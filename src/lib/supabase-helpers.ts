/**
 * Supabase Helper Functions for My 2Go
 */

import { supabase } from '@/integrations/supabase/client';

// ============================================================================
// TYPES
// ============================================================================

export interface UserProfile {
  id: string;
  email: string | null;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  birth_date: string | null;
  postal_code: string | null;
  city: string | null;
  avatar_url: string | null;
  marketing_consent: boolean;
  last_activity_at: string | null;
  created_at: string;
  referred_by: string | null;
  referral_count: number;
  leaderboard_nickname: string | null;
  show_on_leaderboard: boolean | null;
}

export interface UserBalance {
  taler_balance: number;
  lifetime_earned: number;
  lifetime_spent: number;
}

export interface UserCode {
  permanent_code: string;
  qr_payload: string | null;
  is_active: boolean;
}

export interface Partner {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  address_street: string | null;
  address_number: string | null;
  postal_code: string | null;
  city: string | null;
  country?: string | null;
  lat: number | null;
  lng: number | null;
  logo_url: string | null;
  cover_image_url?: string | null;
  brand_color?: string | null;
  category: string | null;
  tags: string[] | null;
  opening_hours: unknown;
  special_hours?: unknown;
  is_active?: boolean;
  is_featured?: boolean;
  google_place_id?: string | null;
  google_rating: number | null;
  google_review_count: number | null;
  website?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  // Contact fields
  contact_email?: string | null;
  contact_phone?: string | null;
  contact_first_name?: string | null;
  contact_last_name?: string | null;
  // GHL integration
  ghl_location_id?: string | null;
  ghl_synced_at?: string | null;
  ghl_sync_status?: string | null;
}

export interface Reward {
  id: string;
  partner_id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  reward_type: 'fixed_discount' | 'percent_discount' | 'free_item' | 'topup_bonus' | 'experience';
  taler_cost: number;
  value_amount: number | null;
  value_percent: number | null;
  stock_total: number | null;
  stock_remaining: number | null;
  terms: string | null;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
  partner?: Partner;
}

export interface Redemption {
  id: string;
  reward_id: string;
  partner_id: string;
  redemption_code: string;
  qr_payload: string | null;
  status: 'pending' | 'used' | 'expired' | 'cancelled';
  taler_spent: number;
  expires_at: string;
  redeemed_at: string | null;
  created_at: string;
  reward?: Reward;
  partner?: Partner;
}

export interface Transaction {
  id: string;
  amount: number;
  type: 'earn' | 'spend' | 'expire' | 'adjust';
  source: string;
  description: string | null;
  partner_id: string | null;
  created_at: string;
  partner?: Partner;
}

export interface AirDropCode {
  id: string;
  code: string;
  taler_value: number;
  valid_until: string;
  max_claims: number;
  current_claims: number;
  is_active: boolean;
}

export interface Region {
  id: string;
  name: string;
  slug: string;
  lat: number | null;
  lng: number | null;
  radius_km: number;
}

// ============================================================================
// AUTH
// ============================================================================

export async function signUp(email: string, password: string, firstName?: string, phone?: string, marketingConsent?: boolean) {
  const redirectUrl = `${window.location.origin}/`;
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: redirectUrl,
      data: {
        first_name: firstName || email.split('@')[0],
        phone: phone || null,
        marketing_consent: marketingConsent || false,
      },
    },
  });
  
  return { data, error };
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  return { data, error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

// ============================================================================
// PROFILE
// ============================================================================

export async function getProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  
  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
  
  return data;
}

export async function updateProfile(userId: string, updates: Partial<UserProfile>) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();
  
  return { data, error };
}

// ============================================================================
// USER CODE
// ============================================================================

export async function getUserCode(userId: string): Promise<UserCode | null> {
  const { data, error } = await supabase
    .from('user_codes')
    .select('permanent_code, qr_payload, is_active')
    .eq('user_id', userId)
    .maybeSingle();
  
  if (error) {
    console.error('Error fetching user code:', error);
    return null;
  }
  
  return data;
}

// ============================================================================
// BALANCE (from transactions ledger)
// ============================================================================

export async function getUserBalance(userId: string): Promise<UserBalance> {
  const { data, error } = await supabase
    .rpc('get_user_balance', { _user_id: userId });
  
  if (error || !data || data.length === 0) {
    console.error('Error fetching balance:', error);
    return { taler_balance: 0, lifetime_earned: 0, lifetime_spent: 0 };
  }
  
  return data[0];
}

// ============================================================================
// TRANSACTIONS
// ============================================================================

export async function getTransactions(userId: string, limit = 50): Promise<Transaction[]> {
  const { data, error } = await supabase
    .from('transactions')
    .select(`
      id,
      amount,
      type,
      source,
      description,
      partner_id,
      created_at,
      partner:partners(id, name, slug, logo_url)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }
  
  return (data || []).map(t => ({
    ...t,
    partner: Array.isArray(t.partner) ? t.partner[0] : t.partner,
  })) as Transaction[];
}

// ============================================================================
// PARTNERS
// ============================================================================

export async function getPartners(): Promise<Partner[]> {
  // Use secure RPC function that only exposes public-safe fields
  const { data, error } = await supabase.rpc('get_public_partners');
  
  if (error) {
    console.error('Error fetching partners:', error);
    return [];
  }
  
  return (data || []) as Partner[];
}

export async function getPartnerBySlug(slug: string): Promise<Partner | null> {
  // Use secure RPC function that only exposes public-safe fields
  const { data, error } = await supabase.rpc('get_public_partner_by_slug', {
    partner_slug: slug
  });
  
  if (error) {
    console.error('Error fetching partner:', error);
    return null;
  }
  
  // RPC returns an array, get first element
  const partners = data as Partner[] | null;
  return partners && partners.length > 0 ? partners[0] : null;
}

export async function getPartnerById(id: string): Promise<Partner | null> {
  // Use secure RPC function that only exposes public-safe fields
  const { data, error } = await supabase.rpc('get_public_partner_by_id', {
    partner_id: id
  });
  
  if (error) {
    console.error('Error fetching partner:', error);
    return null;
  }
  
  // RPC returns an array, get first element
  const partners = data as Partner[] | null;
  return partners && partners.length > 0 ? partners[0] : null;
}

// ============================================================================
// REWARDS
// ============================================================================

export async function getRewards(): Promise<Reward[]> {
  const { data, error } = await supabase
    .from('rewards')
    .select(`
      *,
      partner:partners(id, name, slug, logo_url, city, lat, lng)
    `)
    .eq('is_active', true)
    .order('taler_cost');
  
  if (error) {
    console.error('Error fetching rewards:', error);
    return [];
  }
  
  return (data || []).map(r => ({
    ...r,
    partner: Array.isArray(r.partner) ? r.partner[0] : r.partner,
  })) as Reward[];
}

export async function getRewardById(id: string): Promise<Reward | null> {
  const { data, error } = await supabase
    .from('rewards')
    .select(`
      *,
      partner:partners(*)
    `)
    .eq('id', id)
    .eq('is_active', true)
    .maybeSingle();
  
  if (error) {
    console.error('Error fetching reward:', error);
    return null;
  }
  
  if (!data) return null;
  
  return {
    ...data,
    partner: Array.isArray(data.partner) ? data.partner[0] : data.partner,
  } as Reward;
}

export async function getRewardsByPartner(partnerId: string): Promise<Reward[]> {
  const { data, error } = await supabase
    .from('rewards')
    .select('*')
    .eq('partner_id', partnerId)
    .eq('is_active', true)
    .order('taler_cost');
  
  if (error) {
    console.error('Error fetching partner rewards:', error);
    return [];
  }
  
  return data || [];
}

// ============================================================================
// REDEMPTIONS
// ============================================================================

export async function redeemReward(
  userId: string,
  rewardId: string,
  partnerId: string,
  talerCost: number
): Promise<{ redemption: Redemption | null; error: string | null }> {
  // 1. Check balance
  const balance = await getUserBalance(userId);
  if (balance.taler_balance < talerCost) {
    return { redemption: null, error: 'Nicht genügend Taler' };
  }
  
  // 2. Generate cryptographically secure redemption code using database function
  const { data: codeData, error: codeError } = await supabase.rpc('generate_redemption_code');
  if (codeError || !codeData) {
    console.error('Error generating redemption code:', codeError);
    return { redemption: null, error: 'Fehler beim Generieren des Codes' };
  }
  const redemptionCode = codeData as string;
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 60 minutes validity
  
  // 3. Create redemption
  const { data: redemption, error: redemptionError } = await supabase
    .from('redemptions')
    .insert({
      user_id: userId,
      reward_id: rewardId,
      partner_id: partnerId,
      redemption_code: redemptionCode,
      qr_payload: `${redemptionCode}:${userId}`,
      taler_spent: talerCost,
      expires_at: expiresAt,
    })
    .select()
    .single();
  
  if (redemptionError) {
    console.error('Error creating redemption:', redemptionError);
    return { redemption: null, error: 'Fehler beim Einlösen' };
  }
  
  // 4. Create spend transaction
  const { error: transactionError } = await supabase
    .from('transactions')
    .insert({
      user_id: userId,
      partner_id: partnerId,
      amount: talerCost,
      type: 'spend',
      source: 'reward_redemption',
      description: `Gutschein eingelöst`,
      reference_id: redemption.id,
    });
  
  if (transactionError) {
    console.error('Error creating transaction:', transactionError);
    // Redemption was created, but transaction failed - should not happen with proper setup
  }
  
  // 5. Trigger GHL contact sync (fire-and-forget, non-blocking)
  syncContactToGHLOnRedemption(userId, partnerId).catch(err => {
    console.warn('GHL contact sync failed (non-blocking):', err);
  });
  
  return { redemption, error: null };
}

/**
 * Syncs the user as a contact to the partner's GoHighLevel location.
 * This is called automatically after a successful redemption.
 * Non-blocking - failures are logged but don't affect the redemption.
 * Includes partner info for email notifications on failure.
 */
async function syncContactToGHLOnRedemption(userId: string, partnerId: string): Promise<void> {
  try {
    // 1. Get partner's GHL location ID and name
    const { data: partner, error: partnerError } = await supabase
      .from('partners')
      .select('ghl_location_id, name, id')
      .eq('id', partnerId)
      .single();
    
    if (partnerError || !partner?.ghl_location_id) {
      // Partner doesn't have GHL integration - this is fine, just skip
      console.log('Partner has no GHL location, skipping contact sync');
      return;
    }
    
    // 2. Get user profile for contact details
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email, first_name, last_name, phone')
      .eq('id', userId)
      .single();
    
    if (profileError || !profile?.email) {
      console.warn('Could not get user profile for GHL sync');
      return;
    }
    
    // 3. Call GHL sync edge function with partner info for error notifications
    const { error: syncError } = await supabase.functions.invoke('ghl-sync', {
      body: {
        action: 'sync-contact',
        locationId: partner.ghl_location_id,
        partnerId: partner.id,
        partnerName: partner.name,
        contact: {
          email: profile.email,
          firstName: profile.first_name || '',
          lastName: profile.last_name || '',
          phone: profile.phone || '',
        },
      },
    });
    
    if (syncError) {
      console.error('GHL contact sync error:', syncError);
    } else {
      console.log(`Contact synced to GHL for partner: ${partner.name}`);
    }
  } catch (err) {
    console.error('GHL sync error (caught):', err);
  }
}

export async function getRedemptions(userId: string): Promise<Redemption[]> {
  const { data, error } = await supabase
    .from('redemptions')
    .select(`
      *,
      reward:rewards(id, title, description, image_url, reward_type, taler_cost),
      partner:partners(id, name, slug, logo_url)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching redemptions:', error);
    return [];
  }
  
  return (data || []).map(r => ({
    ...r,
    reward: Array.isArray(r.reward) ? r.reward[0] : r.reward,
    partner: Array.isArray(r.partner) ? r.partner[0] : r.partner,
  })) as Redemption[];
}

// ============================================================================
// AIR DROP CODES
// ============================================================================

export async function redeemAirDropCode(
  userId: string,
  code: string
): Promise<{ success: boolean; talerAwarded?: number; error?: string }> {
  // Use atomic server-side RPC function to prevent race conditions
  const { data, error } = await supabase.rpc('redeem_air_drop_code', {
    _user_id: userId,
    _code: code,
  });

  if (error) {
    console.error('Error redeeming air drop code:', error);
    return { success: false, error: 'Fehler beim Einlösen des Codes' };
  }

  const result = data as { success: boolean; taler_awarded?: number; error?: string } | null;

  if (!result) {
    return { success: false, error: 'Unbekannter Fehler' };
  }

  if (!result.success) {
    return { success: false, error: result.error || 'Fehler beim Einlösen' };
  }

  return { success: true, talerAwarded: result.taler_awarded };
}

// ============================================================================
// REGIONS
// ============================================================================

export async function getRegions(): Promise<Region[]> {
  const { data, error } = await supabase
    .from('regions')
    .select('*')
    .order('name');
  
  if (error) {
    console.error('Error fetching regions:', error);
    return [];
  }
  
  return data || [];
}
