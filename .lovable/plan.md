

# Analyse: Visuelles Erlebnis nach Login beibehalten

## Das Problem

Die App hat zwei komplett getrennte Home-Ansichten:

- **BrowseModeHome** (nicht eingeloggt): Dynamischer Hero mit Jahreszeiten, Tageszeiten, Wetter-Effekten, Vögel-Animationen, grosser Typografie "Lebe lokal. Werde belohnt." — emotional, einladend.
- **SessionModeHome** (eingeloggt): Sofort funktional — Greeting, Balance-Card, Gutschein-Listen, Banners. Kein visueller Hero, kein Hintergrundbild, keine Atmosphäre.

Der Bruch ist abrupt: Nach dem Login verschwindet die gesamte visuelle Identität.

## Architektur-Optionen

### Option A: Hero-Header in SessionModeHome integrieren (empfohlen)

Den dynamischen Hero (`HeroDynamic` + `HeroAnimations`) als kompakteren Header auch im eingeloggten Zustand zeigen. Statt 55vh nur ~30vh, mit Greeting und Balance-Card darüber gelegt.

```text
┌─────────────────────────────────┐
│  HeroDynamic (kompakt, ~30vh)   │
│  ┌───────────────────────────┐  │
│  │ Guten Morgen, Max 👋      │  │
│  │ ┌─────────────────────┐   │  │
│  │ │   42 Taler  BalCard │   │  │
│  │ └─────────────────────┘   │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
│  Campaign Banner                │
│  Partner in der Nähe            │
│  Gutscheine                     │
│  ...                            │
```

**Vorteile:** Visuelle Kontinuität, Brand-Identität bleibt, dynamische Tageszeiten-Stimmung auch nach Login.
**Aufwand:** Mittel — `HeroDynamic` und `HeroAnimations` in SessionModeHome einbauen, Greeting + BalanceCard als Overlay darüber positionieren.

### Option B: Geteilter Hero-Hintergrund über AppLayout

Den dynamischen Hintergrund als permanentes Element im `AppLayout` rendern (z.B. hinter dem Header), sodass er auf allen Seiten subtil sichtbar ist.

**Vorteile:** Konsistente Atmosphäre überall.
**Nachteil:** Höhere Komplexität, Performance-Impact auf allen Seiten.

### Option C: Reduzierter Ambient-Header

Nur die Farbverläufe/Stimmung der Tageszeit als subtilen Gradient im Header-Bereich beibehalten — ohne die volle Hero-Section, aber mit der emotionalen Wärme.

**Vorteile:** Leichtgewichtig, subtil.
**Nachteil:** Weniger Impact als der volle Hero.

## Empfehlung

**Option A** — den kompakten dynamischen Hero in SessionModeHome einbauen. Konkret:

1. **SessionModeHome anpassen**: `HeroDynamic` + `HeroAnimations` als kompakten Hero-Header (~30vh) einbauen, mit `-mt-20` wie bei BrowseModeHome
2. **Greeting + BalanceCard** als Overlay auf dem Hero positionieren (weisser Text mit Drop-Shadow)
3. **ActivityTicker** und **LiveHeaderButton** in den Hero integrieren
4. **Restlicher Content** beginnt nach dem Hero mit dem bestehenden Layout

Technisch betrifft das nur eine Datei: `src/pages/home/SessionModeHome.tsx`.

