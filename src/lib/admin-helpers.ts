/**
 * Admin Helper Functions for My 2Go
 * Server-side role checking via Supabase RLS policies
 */

import { supabase } from '@/integrations/supabase/client';
import type { Partner, UserProfile, UserBalance, AirDropCode, Transaction } from './supabase-helpers';

// ============================================================================
// TYPES
// ============================================================================

export interface AdminStats {
  totalUsers: number;
  totalPartners: number;
  totalRewards: number;
  totalRedemptions: number;
  totalTalerCirculating: number;
  activeAirDropCodes: number;
  totalBadges: number;
  totalBadgesAwarded: number;
}

export interface BadgeStats {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  category: string;
  awardedCount: number;
}

export interface CustomerWithBalance extends UserProfile {
  balance: UserBalance;
  transactionCount: number;
}

export interface AirDropCodeWithStats extends AirDropCode {
  created_by_email?: string;
}

// ============================================================================
// ROLE CHECKING (via RLS)
// ============================================================================

export async function checkIsAdmin(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .rpc('has_role', { _user_id: userId, _role: 'admin' });
  
  if (error) {
    console.error('Error checking admin role:', error);
    return false;
  }
  
  return data === true;
}

// ============================================================================
// ADMIN STATS
// ============================================================================

export async function getAdminStats(): Promise<AdminStats> {
  const [
    { count: totalUsers },
    { count: totalPartners },
    { count: totalRewards },
    { count: totalRedemptions },
    { count: activeAirDropCodes },
    { count: totalBadges },
    { count: totalBadgesAwarded },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('partners').select('*', { count: 'exact', head: true }),
    supabase.from('rewards').select('*', { count: 'exact', head: true }),
    supabase.from('redemptions').select('*', { count: 'exact', head: true }),
    supabase.from('air_drop_codes').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('badges').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('user_badges').select('*', { count: 'exact', head: true }),
  ]);
  
  // Calculate circulating Taler (sum of all balances)
  const { data: balanceData } = await supabase
    .from('transactions')
    .select('amount, type');
  
  let totalTalerCirculating = 0;
  if (balanceData) {
    balanceData.forEach(t => {
      if (t.type === 'earn' || t.type === 'adjust') {
        totalTalerCirculating += t.amount;
      } else if (t.type === 'spend') {
        totalTalerCirculating -= t.amount;
      }
    });
  }
  
  return {
    totalUsers: totalUsers || 0,
    totalPartners: totalPartners || 0,
    totalRewards: totalRewards || 0,
    totalRedemptions: totalRedemptions || 0,
    totalTalerCirculating,
    activeAirDropCodes: activeAirDropCodes || 0,
    totalBadges: totalBadges || 0,
    totalBadgesAwarded: totalBadgesAwarded || 0,
  };
}

export async function getBadgeStats(): Promise<BadgeStats[]> {
  // Get all badges
  const { data: badges, error: badgesError } = await supabase
    .from('badges')
    .select('id, name, slug, icon, color, category')
    .eq('is_active', true)
    .order('category')
    .order('sort_order');
  
  if (badgesError || !badges) {
    console.error('Error fetching badges:', badgesError);
    return [];
  }
  
  // Get count of awards for each badge
  const { data: awardCounts, error: countError } = await supabase
    .from('user_badges')
    .select('badge_id');
  
  if (countError) {
    console.error('Error fetching award counts:', countError);
    return badges.map(b => ({ ...b, awardedCount: 0 }));
  }
  
  // Count awards per badge
  const countMap = new Map<string, number>();
  awardCounts?.forEach(ub => {
    countMap.set(ub.badge_id, (countMap.get(ub.badge_id) || 0) + 1);
  });
  
  return badges.map(badge => ({
    ...badge,
    awardedCount: countMap.get(badge.id) || 0,
  }));
}

// ============================================================================
// PARTNER MANAGEMENT
// ============================================================================

export async function getAllPartners(): Promise<Partner[]> {
  const { data, error } = await supabase
    .from('partners')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching partners:', error);
    return [];
  }
  
  return data || [];
}

export async function createPartner(partner: Partial<Partner> & { google_rating?: number | null; google_review_count?: number | null }): Promise<{ partner: Partner | null; error: string | null }> {
  const { data, error } = await supabase
    .from('partners')
    .insert({
      name: partner.name!,
      slug: partner.slug!,
      description: partner.description,
      short_description: partner.short_description,
      category: partner.category,
      address_street: partner.address_street,
      address_number: partner.address_number,
      postal_code: partner.postal_code,
      city: partner.city,
      lat: partner.lat,
      lng: partner.lng,
      logo_url: partner.logo_url,
      website: partner.website,
      google_place_id: partner.google_place_id,
      google_rating: partner.google_rating,
      google_review_count: partner.google_review_count,
      is_active: partner.is_active ?? false,
      is_featured: partner.is_featured ?? false,
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error creating partner:', error);
    return { partner: null, error: error.message };
  }
  
  return { partner: data, error: null };
}

export async function updatePartner(id: string, updates: Partial<Omit<Partner, 'opening_hours' | 'special_hours'>>): Promise<{ success: boolean; error: string | null }> {
  const { error } = await supabase
    .from('partners')
    .update(updates as Record<string, unknown>)
    .eq('id', id);
  
  if (error) {
    console.error('Error updating partner:', error);
    return { success: false, error: error.message };
  }
  
  return { success: true, error: null };
}

export async function deletePartner(id: string): Promise<{ success: boolean; error: string | null }> {
  const { error } = await supabase
    .from('partners')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting partner:', error);
    return { success: false, error: error.message };
  }
  
  return { success: true, error: null };
}

// ============================================================================
// CUSTOMER MANAGEMENT
// ============================================================================

export async function getAllCustomers(): Promise<CustomerWithBalance[]> {
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (profilesError || !profiles) {
    console.error('Error fetching profiles:', profilesError);
    return [];
  }
  
  // Get balances for all users
  const customersWithBalance: CustomerWithBalance[] = await Promise.all(
    profiles.map(async (profile) => {
      const { data: balanceData } = await supabase
        .rpc('get_user_balance', { _user_id: profile.id });
      
      const { count: transactionCount } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profile.id);
      
      return {
        ...profile,
        balance: balanceData?.[0] || { taler_balance: 0, lifetime_earned: 0, lifetime_spent: 0 },
        transactionCount: transactionCount || 0,
      };
    })
  );
  
  return customersWithBalance;
}

export async function getCustomerTransactions(userId: string): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select(`
      *,
      partner:partners(id, name, slug, logo_url)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(100);
  
  if (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }
  
  return (data || []).map(t => ({
    ...t,
    partner: Array.isArray(t.partner) ? t.partner[0] : t.partner,
  }));
}

// ============================================================================
// AIR DROP CODE MANAGEMENT
// ============================================================================

export async function getAllAirDropCodes(): Promise<AirDropCodeWithStats[]> {
  const { data, error } = await supabase
    .from('air_drop_codes')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching air drop codes:', error);
    return [];
  }
  
  return data || [];
}

export async function createAirDropCode(
  code: string,
  talerValue: number,
  validUntil: string,
  maxClaims: number = 1,
  createdBy?: string
): Promise<{ airDropCode: AirDropCode | null; error: string | null }> {
  const normalizedCode = code.trim().toUpperCase();
  
  // Check if code already exists
  const { data: existing } = await supabase
    .from('air_drop_codes')
    .select('id')
    .eq('code', normalizedCode)
    .maybeSingle();
  
  if (existing) {
    return { airDropCode: null, error: 'Code existiert bereits' };
  }
  
  const { data, error } = await supabase
    .from('air_drop_codes')
    .insert({
      code: normalizedCode,
      taler_value: talerValue,
      valid_until: validUntil,
      max_claims: maxClaims,
      created_by: createdBy,
      is_active: true,
      current_claims: 0,
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error creating air drop code:', error);
    return { airDropCode: null, error: error.message };
  }
  
  return { airDropCode: data, error: null };
}

export async function updateAirDropCode(
  id: string, 
  updates: Partial<AirDropCode>
): Promise<{ success: boolean; error: string | null }> {
  const { error } = await supabase
    .from('air_drop_codes')
    .update(updates)
    .eq('id', id);
  
  if (error) {
    console.error('Error updating air drop code:', error);
    return { success: false, error: error.message };
  }
  
  return { success: true, error: null };
}

export async function deleteAirDropCode(id: string): Promise<{ success: boolean; error: string | null }> {
  const { error } = await supabase
    .from('air_drop_codes')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting air drop code:', error);
    return { success: false, error: error.message };
  }
  
  return { success: true, error: null };
}

// Generate a random code
export function generateRandomCode(prefix: string = 'RADIO'): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = prefix + '-';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
