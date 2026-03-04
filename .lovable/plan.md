
# Comprehensive Review & Plan

## Part 1: Taler Persistence Bug Analysis

### Root Cause Identified

After deep analysis of the database and code, I found the critical issue:

**Recent radio listening sessions show:**
- `ended_at: NULL` (sessions never closed)
- `taler_awarded: 0` (rewards never written)
- `duration_seconds: NULL` (never updated)
- Last successful radio transaction: **2026-01-22** (11+ days ago)

The `save_session_progress` RPC function is correct in the database, but **it's never being called** because:

1. **Authentication Race Condition**: The console log shows `[RadioRewards] Waiting for user authentication` - the hook waits for `userId` before starting sessions, but the global module-level state (session ID, timers) gets wiped on auth state changes.

2. **Global State Reset on Page Load**: While `restoreGlobalStateFromStorage()` runs on module load, the `useEffect` that verifies the session and starts the save interval depends on `userId`. If auth is slow, the session data is restored but never verified/resumed.

3. **Missing User Authentication in Background Saves**: The keepalive `fetch` on page unload uses `SUPABASE_KEY` as the Bearer token, but the RPC requires an authenticated user session to look up `user_id` from the session record.

4. **Silent Failures**: The `save_session_progress` RPC checks if session is found and active, but returns `{success: false}` without the frontend reacting to failures.

### Technical Fix Strategy

```text
┌─────────────────────────────────────────────────────────────────┐
│ Current Flow (Broken)                                           │
├─────────────────────────────────────────────────────────────────┤
│ 1. User plays radio                                             │
│ 2. Hook waits for userId (may be slow)                         │
│ 3. Session started in DB                                        │
│ 4. 15s interval starts                                          │
│ 5. User refreshes page                                          │
│ 6. Global state restored from localStorage                      │
│ 7. Hook re-mounts, userId not yet available                    │
│ 8. Session verification never happens                           │
│ 9. Save interval never restarts                                 │
│ ❌ Points lost forever                                          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ Fixed Flow                                                      │
├─────────────────────────────────────────────────────────────────┤
│ 1. On module load: restore session from localStorage            │
│ 2. On any user auth: immediately verify session in DB           │
│ 3. If session valid: restart 15s save interval immediately     │
│ 4. On page unload: use proper auth token (not anon key)        │
│ 5. Background save via service worker for reliability          │
│ 6. Show toast on save success/failure for debugging            │
│ ✅ Points persisted reliably                                    │
└─────────────────────────────────────────────────────────────────┘
```

### Files to Modify

1. **`src/hooks/useRadioRewards.ts`**:
   - Fix auth token retrieval for keepalive requests (get actual user JWT)
   - Move session verification to run immediately when auth becomes available
   - Add retry logic with exponential backoff for failed saves
   - Add visible feedback (toast) on save success for debugging
   - Ensure interval restarts even if userId arrives late

2. **`src/contexts/AuthContext.tsx`**:
   - Ensure `refreshBalance` is called immediately after detecting new radio transactions
   - Add realtime subscription to taler_monthly_batches for faster balance updates

3. **Guest Mode (`src/lib/guest-rewards-store.ts`)**:
   - Guest rewards are stored only in localStorage (zustand persist)
   - On login, `syncGuestRewards` in AuthContext transfers them
   - This flow works but could be more robust with offline support

---

## Part 2: Business Radio Feature Analysis

### Current Capabilities

The platform already has infrastructure for audio advertising:

1. **Audio Ads System** (`supabase/functions/generate-audio-ad/`):
   - TTS generation via ElevenLabs (Swiss German voices)
   - Jingle intro/outro management
   - MP3 upload support
   - Audio mastering via Auphonic API
   - Targeting by location, demographics, subscription tier

2. **Jingle Manager** (`src/components/admin/JingleManager.tsx`):
   - Upload custom intro/outro audio
   - Partner-specific jingles possible (`partner_id` field)

3. **Partner Dashboard** (`src/pages/partner/`):
   - Full analytics suite
   - Reward management
   - QR scan tracking

### Proposed "Business Radio" Feature

Allow business partners to create their own branded radio landing pages with:

1. **Custom Stream Configuration**:
   - Enter external stream URL
   - Upload pre-roll audio (MP3)
   - Upload logo/cover image
   - Set brand colors

2. **Generated Landing Page**:
   - Simple, mobile-optimized HTML page
   - Partner logo prominently displayed
   - Play button to start custom stream
   - Pre-roll audio plays before stream starts
   - Optionally embed Taler earning (if partner pays for premium)

3. **Technical Implementation**:

```text
Database Schema Addition:
┌─────────────────────────────────────────────────────────────────┐
│ partner_radios                                                  │
├─────────────────────────────────────────────────────────────────┤
│ id: uuid (PK)                                                   │
│ partner_id: uuid (FK → partners)                                │
│ name: text                                                      │
│ stream_url: text (required)                                     │
│ preroll_audio_url: text (optional)                             │
│ logo_url: text (optional, defaults to partner logo)            │
│ cover_image_url: text (optional)                               │
│ brand_color: text (hex, optional)                              │
│ slug: text (unique, for URL: /radio/{slug})                    │
│ is_active: boolean                                              │
│ play_count: integer (analytics)                                │
│ created_at: timestamp                                           │
│ updated_at: timestamp                                           │
└─────────────────────────────────────────────────────────────────┘

New Files:
- src/pages/radio/[slug].tsx - Public radio landing page
- src/pages/partner/PartnerRadio.tsx - Partner config UI
- supabase/functions/partner-radio-stats/ - Track plays
```

4. **Partner Dashboard UI**:
   - New tab: "Mein Radio" (My Radio)
   - Stream URL input with validation
   - Pre-roll MP3 upload (max 30 seconds)
   - Logo upload
   - Color picker for brand color
   - Preview button
   - Generated shareable URL: `https://my2go.lovable.app/radio/partner-slug`
   - Embed code for partner's website

5. **Public Radio Page Flow**:
```
User visits /radio/cafe-schoenau
→ Page loads with Café Schönau branding
→ User taps PLAY button
→ Pre-roll audio plays (if configured)
→ Stream starts automatically after pre-roll
→ Optional: Taler earning widget shows progress
```

---

## Implementation Priority

### Phase 1 (Critical - Taler Bug Fix)

1. Fix authentication in background saves
2. Add proper session recovery on auth state change
3. Add save success/failure feedback
4. Test with actual user listening sessions

### Phase 2 (Business Radio MVP)

1. Create `partner_radios` database table
2. Build partner configuration UI
3. Create public radio landing page
4. Implement pre-roll audio playback
5. Add play count analytics

### Phase 3 (Enhancement)

1. Embed code generator for partners
2. Optional Taler earning on partner radios
3. Custom HTML page theming
4. Mobile PWA support for partner radios

---

## Technical Details

### Taler Bug Fix - Key Code Changes

```typescript
// In useRadioRewards.ts - Fix auth token retrieval
async function saveWithProperAuth() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    console.error('[RadioRewards] No auth session for save');
    return;
  }
  
  fetch(`${SUPABASE_URL}/rest/v1/rpc/save_session_progress`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${session.access_token}`, // Use actual JWT
    },
    body: JSON.stringify({
      _session_id: globalSessionId,
      _duration_seconds: durationSeconds
    }),
    keepalive: true,
  });
}
```

### Business Radio - Database Migration

```sql
CREATE TABLE public.partner_radios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES partners(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  stream_url TEXT NOT NULL,
  preroll_audio_url TEXT,
  logo_url TEXT,
  cover_image_url TEXT,
  brand_color TEXT DEFAULT '#C7A94E',
  is_active BOOLEAN DEFAULT true,
  play_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Partners can manage their own radios
ALTER TABLE partner_radios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partners can manage own radios"
  ON partner_radios
  FOR ALL
  USING (partner_id IN (
    SELECT partner_id FROM partner_admins WHERE user_id = auth.uid()
  ));

-- Public can view active radios
CREATE POLICY "Public can view active radios"
  ON partner_radios
  FOR SELECT
  USING (is_active = true);
```

---

## Summary

| Issue | Status | Priority |
|-------|--------|----------|
| Taler not persisting after refresh | Root cause identified | **Critical** |
| Background save using wrong auth token | Fix required | **Critical** |
| Session never verified after page reload | Fix required | **Critical** |
| Guest rewards sync | Working, minor improvements | Low |
| Business Radio feature | New feature, fully feasible | Medium |
| Partner custom stream + pre-roll | Extends existing audio infrastructure | Medium |
| Embeddable radio player | Enhancement | Low |
