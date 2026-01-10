/**
 * Partner Helper Functions for 2Go Taler Hub
 * Server-side role checking via Supabase RLS policies
 */

import { supabase } from '@/integrations/supabase/client';
import type { Partner, Reward, Redemption } from './supabase-helpers';

// ============================================================================
// TYPES
// ============================================================================

export interface PartnerStats {
  totalRedemptions: number;
  pendingRedemptions: number;
  completedRedemptions: number;
  totalTalerRedeemed: number;
  activeRewards: number;
  totalRewards: number;
  totalReviews: number;
  avgRating: number | null;
  positiveReviews: number;
}

export interface DailyStats {
  date: string;
  redemptions: number;
  reviews: number;
  taler: number;
}

export interface PartnerAdminInfo {
  partnerId: string;
  partnerName: string;
  role: 'owner' | 'manager' | 'staff';
  canManageRewards: boolean;
  canViewReports: boolean;
  canConfirmRedemptions: boolean;
}

export interface RedemptionWithDetails extends Omit<Redemption, 'reward'> {
  reward?: {
    id: string;
    title: string;
    taler_cost: number;
    image_url?: string | null;
  };
  user?: {
    id: string;
    display_name?: string | null;
    email?: string | null;
  };
}

// ============================================================================
// ROLE CHECKING
// ============================================================================

export async function checkIsPartnerAdmin(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .rpc('has_role', { _user_id: userId, _role: 'partner_admin' });
  
  if (error) {
    console.error('Error checking partner_admin role:', error);
    return false;
  }
  
  return data === true;
}

export async function getPartnerAdminInfo(userId: string): Promise<PartnerAdminInfo | null> {
  const { data, error } = await supabase
    .from('partner_admins')
    .select(`
      partner_id,
      role,
      can_manage_rewards,
      can_view_reports,
      can_confirm_redemptions,
      partner:partners(id, name)
    `)
    .eq('user_id', userId)
    .maybeSingle();
  
  if (error || !data) {
    console.error('Error fetching partner admin info:', error);
    return null;
  }
  
  const partner = Array.isArray(data.partner) ? data.partner[0] : data.partner;
  
  return {
    partnerId: data.partner_id,
    partnerName: partner?.name || 'Unbekannter Partner',
    role: data.role as 'owner' | 'manager' | 'staff',
    canManageRewards: data.can_manage_rewards || false,
    canViewReports: data.can_view_reports || false,
    canConfirmRedemptions: data.can_confirm_redemptions || false,
  };
}

// ============================================================================
// PARTNER DATA
// ============================================================================

export async function getPartnerDetails(partnerId: string): Promise<Partner | null> {
  const { data, error } = await supabase
    .from('partners')
    .select('*')
    .eq('id', partnerId)
    .single();
  
  if (error) {
    console.error('Error fetching partner:', error);
    return null;
  }
  
  return data;
}

// ============================================================================
// PARTNER STATS
// ============================================================================

export async function getPartnerStats(partnerId: string): Promise<PartnerStats> {
  const [
    { count: totalRedemptions },
    { count: pendingRedemptions },
    { count: completedRedemptions },
    { count: activeRewards },
    { count: totalRewards },
    { count: totalReviews },
    { count: positiveReviews },
  ] = await Promise.all([
    supabase.from('redemptions').select('*', { count: 'exact', head: true }).eq('partner_id', partnerId),
    supabase.from('redemptions').select('*', { count: 'exact', head: true }).eq('partner_id', partnerId).eq('status', 'pending'),
    supabase.from('redemptions').select('*', { count: 'exact', head: true }).eq('partner_id', partnerId).eq('status', 'used'),
    supabase.from('rewards').select('*', { count: 'exact', head: true }).eq('partner_id', partnerId).eq('is_active', true),
    supabase.from('rewards').select('*', { count: 'exact', head: true }).eq('partner_id', partnerId),
    supabase.from('review_requests').select('*', { count: 'exact', head: true }).eq('partner_id', partnerId),
    supabase.from('review_requests').select('*', { count: 'exact', head: true }).eq('partner_id', partnerId).gte('in_app_rating', 4),
  ]);
  
  // Calculate total Taler redeemed and avg rating
  const [{ data: redemptionData }, { data: reviewData }] = await Promise.all([
    supabase
      .from('redemptions')
      .select('taler_spent')
      .eq('partner_id', partnerId)
      .eq('status', 'used'),
    supabase
      .from('review_requests')
      .select('in_app_rating')
      .eq('partner_id', partnerId)
      .not('in_app_rating', 'is', null),
  ]);
  
  const totalTalerRedeemed = redemptionData?.reduce((sum, r) => sum + r.taler_spent, 0) || 0;
  const avgRating = reviewData && reviewData.length > 0
    ? reviewData.reduce((sum, r) => sum + (r.in_app_rating || 0), 0) / reviewData.length
    : null;
  
  return {
    totalRedemptions: totalRedemptions || 0,
    pendingRedemptions: pendingRedemptions || 0,
    completedRedemptions: completedRedemptions || 0,
    totalTalerRedeemed,
    activeRewards: activeRewards || 0,
    totalRewards: totalRewards || 0,
    totalReviews: totalReviews || 0,
    avgRating,
    positiveReviews: positiveReviews || 0,
  };
}

export async function getPartnerDailyStats(partnerId: string, days: number = 30): Promise<DailyStats[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startDateStr = startDate.toISOString();
  
  const [{ data: redemptions }, { data: reviews }] = await Promise.all([
    supabase
      .from('redemptions')
      .select('created_at, taler_spent, status')
      .eq('partner_id', partnerId)
      .gte('created_at', startDateStr),
    supabase
      .from('review_requests')
      .select('created_at')
      .eq('partner_id', partnerId)
      .gte('created_at', startDateStr),
  ]);
  
  // Group by date
  const dailyMap = new Map<string, DailyStats>();
  
  // Initialize all days
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (days - 1 - i));
    const dateStr = date.toISOString().split('T')[0];
    dailyMap.set(dateStr, { date: dateStr, redemptions: 0, reviews: 0, taler: 0 });
  }
  
  // Count redemptions
  redemptions?.forEach((r) => {
    const dateStr = new Date(r.created_at).toISOString().split('T')[0];
    const existing = dailyMap.get(dateStr);
    if (existing) {
      existing.redemptions += 1;
      if (r.status === 'used') {
        existing.taler += r.taler_spent;
      }
    }
  });
  
  // Count reviews
  reviews?.forEach((r) => {
    const dateStr = new Date(r.created_at).toISOString().split('T')[0];
    const existing = dailyMap.get(dateStr);
    if (existing) {
      existing.reviews += 1;
    }
  });
  
  return Array.from(dailyMap.values());
}

// ============================================================================
// REWARDS MANAGEMENT
// ============================================================================

export async function getPartnerRewards(partnerId: string): Promise<Reward[]> {
  const { data, error } = await supabase
    .from('rewards')
    .select('*')
    .eq('partner_id', partnerId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching partner rewards:', error);
    return [];
  }
  
  return data || [];
}

export async function createReward(reward: Partial<Reward>): Promise<{ reward: Reward | null; error: string | null }> {
  const { data, error } = await supabase
    .from('rewards')
    .insert({
      partner_id: reward.partner_id!,
      title: reward.title!,
      description: reward.description,
      taler_cost: reward.taler_cost!,
      reward_type: reward.reward_type || 'fixed_discount',
      value_amount: reward.value_amount,
      value_percent: reward.value_percent,
      image_url: reward.image_url,
      terms: reward.terms,
      valid_from: reward.valid_from,
      valid_until: reward.valid_until,
      stock_total: reward.stock_total,
      stock_remaining: reward.stock_remaining || reward.stock_total,
      is_active: reward.is_active ?? true,
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error creating reward:', error);
    return { reward: null, error: error.message };
  }
  
  return { reward: data, error: null };
}

export async function updateReward(id: string, updates: Partial<Reward>): Promise<{ success: boolean; error: string | null }> {
  const { error } = await supabase
    .from('rewards')
    .update(updates)
    .eq('id', id);
  
  if (error) {
    console.error('Error updating reward:', error);
    return { success: false, error: error.message };
  }
  
  return { success: true, error: null };
}

export async function deleteReward(id: string): Promise<{ success: boolean; error: string | null }> {
  const { error } = await supabase
    .from('rewards')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting reward:', error);
    return { success: false, error: error.message };
  }
  
  return { success: true, error: null };
}

// ============================================================================
// REDEMPTIONS MANAGEMENT
// ============================================================================

export async function getPartnerRedemptions(partnerId: string, status?: 'pending' | 'used' | 'expired' | 'cancelled'): Promise<RedemptionWithDetails[]> {
  let query = supabase
    .from('redemptions')
    .select(`
      *,
      reward:rewards(id, title, taler_cost, image_url),
      user:profiles(id, display_name, email)
    `)
    .eq('partner_id', partnerId)
    .order('created_at', { ascending: false });
  
  if (status) {
    query = query.eq('status', status);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching redemptions:', error);
    return [];
  }
  
  return (data || []).map(r => ({
    ...r,
    reward: Array.isArray(r.reward) ? r.reward[0] : r.reward,
    user: Array.isArray(r.user) ? r.user[0] : r.user,
  })) as RedemptionWithDetails[];
}

export async function confirmRedemption(redemptionId: string, confirmedBy: string): Promise<{ success: boolean; error: string | null }> {
  const { error } = await supabase
    .from('redemptions')
    .update({
      status: 'used',
      redeemed_at: new Date().toISOString(),
      redeemed_by: confirmedBy,
    })
    .eq('id', redemptionId)
    .eq('status', 'pending');
  
  if (error) {
    console.error('Error confirming redemption:', error);
    return { success: false, error: error.message };
  }
  
  return { success: true, error: null };
}

export async function cancelRedemption(redemptionId: string): Promise<{ success: boolean; error: string | null }> {
  const { error } = await supabase
    .from('redemptions')
    .update({ status: 'cancelled' })
    .eq('id', redemptionId)
    .eq('status', 'pending');
  
  if (error) {
    console.error('Error cancelling redemption:', error);
    return { success: false, error: error.message };
  }
  
  return { success: true, error: null };
}
