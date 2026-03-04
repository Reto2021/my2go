

## Plan: Gesamtüberblick — Logo-Tausch, Taler-Bug-Fix, Stream-Stabilität, Sammelkarten-System

Dieser Plan konsolidiert alle offenen Aufgaben und stellt sicher, dass alles fehlerfrei implementiert wird.

---

### 1. Logo-Tausch: "Radio 2Go" → "2Go" (5 Dateien)

Das hochgeladene `Logo_2Go_1-2.png` wird als `src/assets/logo-2go-header.png` gespeichert. Dann Import-Tausch in **allen** 5 Dateien, die `logo-radio2go.png` verwenden:

| Datei | Zeile | Aktion |
|-------|-------|--------|
| `src/components/ui/radio-header.tsx` | 11 | Import ändern |
| `src/components/funnel/FunnelLayout.tsx` | 3 | Import ändern |
| `src/components/ui/session-summary-sheet.tsx` | 9 | Import ändern |
| `src/pages/RedemptionDetailPage.tsx` | 35 | Import ändern |
| `src/pages/go/PartnerLandingPage.tsx` | 34 | Import ändern |

Alt-Text jeweils von "Radio 2Go" auf "2Go" aktualisieren.

---

### 2. Hero-Claim umkehren

In `src/pages/home/BrowseModeHome.tsx` (Zeile 69-77):
- "Hör Radio." → "Sammle Taler."
- "Sammle Taler." → "Hör Radio."

Reihenfolge wird: **"Sammle Taler. Hör Radio."** — Gutscheine zuerst.

---

### 3. Radio-Stream Stabilität (Reise-Modus)

In `src/lib/radio-store.ts`, die bestehenden Event-Listener erweitern:

**a) `waiting`-Event (Zeile 574):** Statt nur zu loggen, nach 5s automatisch Stream neu laden falls noch im `waiting`-State.

**b) `error`-Event (Zeile 554):** Exponential Backoff einbauen (2s → 4s → 8s, max 3 Versuche) statt fixer 2s.

**c) Neuer `stalled`-Event Listener:** Nach 8s Stream neu laden.

**d) Netzwerkwechsel-Listener:** In `togglePlay()` nach erfolgreichem Play einen `online`-Event-Listener registrieren, der bei Netzwerk-Recovery den Stream neu startet:

```text
navigator.onLine → false → true: sofort Stream reload
navigator.connection?.addEventListener('change'): Stream reload bei Netztyp-Wechsel
```

**e) Stall-Detection Timer:** Alle 10s prüfen ob `audio.currentTime` sich bewegt. Falls 10s still → Stream reload.

---

### 4. Taler-Persistenz Bug-Fix

Die Analyse im Plan identifiziert korrekt, dass `saveWithKeepalive()` (Zeile 237-274) den `globalAccessToken` oder den anon-Key als Fallback nutzt. Das ist bereits korrekt implementiert — der Token wird in `saveAuthToken()` gespeichert und über `getFreshAuthToken()` aktualisiert.

**Verbleibende Verbesserungen:**

- **Retry bei fehlgeschlagenem Save:** In `saveProgressGlobal()` bei Netzwerkfehler automatisch nach 5s retry (max 2x).
- **Session-Recovery robuster:** In der `useEffect` bei `userId`-Initialisierung (Zeile 312-392): Falls `globalSessionId` existiert aber Server-Verifikation fehlschlägt wegen Netzwerk, nicht sofort clearen sondern retry.

---

### 5. Sammelkarten-System (Neumärtli Taler)

#### 5a. DB-Migration — 4 Tabellen

```sql
-- collecting_campaigns: Admin-konfigurierte Kampagnen
CREATE TABLE collecting_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  subtitle text,
  grid_size int NOT NULL DEFAULT 6,
  required_purchases int NOT NULL DEFAULT 11,
  min_unique_shops int NOT NULL DEFAULT 4,
  scan_cooldown_hours int NOT NULL DEFAULT 4,
  max_scans_per_day int NOT NULL DEFAULT 3,
  min_days_to_complete int NOT NULL DEFAULT 3,
  milestones jsonb DEFAULT '[]',
  prize_description text,
  logo_url text,
  is_active boolean DEFAULT true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- collecting_cards: User-Fortschritt
CREATE TABLE collecting_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  campaign_id uuid NOT NULL REFERENCES collecting_campaigns(id),
  current_row int DEFAULT 0,
  current_col int DEFAULT 0,
  total_purchases int DEFAULT 0,
  is_completed boolean DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, campaign_id)
);

-- collecting_card_cells: Scan-History pro Feld
CREATE TABLE collecting_card_cells (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id uuid NOT NULL REFERENCES collecting_cards(id) ON DELETE CASCADE,
  row_pos int NOT NULL,
  col_pos int NOT NULL,
  partner_id uuid NOT NULL REFERENCES partners(id),
  move_type text NOT NULL CHECK (move_type IN ('horizontal','vertical')),
  scanned_at timestamptz DEFAULT now(),
  sponsored_cell_id uuid,
  bonus_claimed boolean DEFAULT false
);

-- collecting_sponsored_cells: Partner-buchbare Bonusfelder
CREATE TABLE collecting_sponsored_cells (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES collecting_campaigns(id),
  partner_id uuid NOT NULL REFERENCES partners(id),
  cell_position int NOT NULL,
  bonus_type text DEFAULT 'extra_taler',
  bonus_value int,
  bonus_reward_id uuid,
  display_text text,
  is_active boolean DEFAULT true,
  price_chf numeric,
  paid_at timestamptz,
  created_at timestamptz DEFAULT now()
);
```

**RLS-Policies:**
- `collecting_campaigns`: Public SELECT wenn `is_active = true`; Admin ALL
- `collecting_cards`: User SELECT/INSERT/UPDATE eigene; Admin ALL
- `collecting_card_cells`: User SELECT via card ownership; INSERT via Edge Function (service_role)
- `collecting_sponsored_cells`: Public SELECT; Admin + Partner-Admin ALL

#### 5b. Edge Function: `collecting-card-scan`

Fraud-Checks in dieser Reihenfolge:

```text
1. Partner identifizieren (via QR-Code partner_id)
2. User identifizieren (via Auth)
3. Campaign finden (via slug/UTM)
4. Card finden oder erstellen
5. FRAUD CHECK 1: Cooldown — letzter Scan bei diesem Shop < scan_cooldown_hours? → REJECT
6. FRAUD CHECK 2: Tages-Limit — Scans heute ≥ max_scans_per_day? → REJECT
7. Move-Type bestimmen:
   - Shop schon auf dieser Karte? → horizontal ("einmal mehr")
   - Shop neu auf dieser Karte? → vertical ("einmal anders")
8. Position updaten (row/col)
9. FRAUD CHECK 3: Am Ziel angekommen?
   a. unique_shops < min_unique_shops? → REJECT Completion
   b. Tage seit Start < min_days_to_complete? → REJECT Completion
   c. Sonst: mark completed, award prize
10. Sponsored Cell prüfen → Bonus gutschreiben
11. Milestone prüfen → Bonus-Taler gutschreiben
12. Card-State zurückgeben
```

#### 5c. Frontend

Neue Dateien:
- `src/pages/CollectingCardPage.tsx` — Route `/sammeln/:slug`
- `src/components/collecting/CollectingGrid.tsx` — 6×6 Grid mit CSS Grid
- `src/components/collecting/CollectingMilestone.tsx` — Meilenstein-Badges
- `src/hooks/useCollectingCard.ts` — Daten-Hook (fetch card + cells)

Route in `App.tsx` hinzufügen: `/sammeln/:slug`

#### 5d. Admin-Verwaltung

Neue Seite `src/pages/admin/AdminCollectingCampaigns.tsx`:
- Campaign CRUD (Name, Grid-Grösse, Fraud-Parameter, Milestones)
- Sponsored-Cell-Verwaltung (welcher Partner, welches Feld, Preis)

Route in `App.tsx` unter `/admin/collecting`

---

### Umsetzungsreihenfolge

1. Logo-Tausch (alle 5 Dateien)
2. Hero-Claim umkehren
3. Stream-Stabilität verbessern
4. Taler-Save Retry-Logik
5. DB-Migration (4 Tabellen + RLS)
6. Edge Function `collecting-card-scan`
7. Sammelkarten-UI (Grid, Page, Hook)
8. Admin-Kampagnen-Verwaltung
9. Route-Integration

