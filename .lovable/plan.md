

# Marquee-Lauftext im Soundtrack-Slider

## Idee-Bewertung

Die Idee ist gut — der längere Text kommuniziert den Mehrwert deutlich besser ("Taler sammeln"), und ein sanfter Marquee-Lauftext gibt dem Slider eine dynamische, einladende Wirkung. Es passt zur spielerischen UX der App.

## Umsetzung

**Datei:** `src/components/radio/player-states/SliderState.tsx` (Zeilen 126–143)

1. **Text ändern:**
   - Ohne Bonus: `"Dein Soundtrack starten und 2Go-Taler sammeln >>>"` 
   - Mit Bonus: bleibt `Slide für +${nextBonus} Taler`

2. **Marquee-Animation hinzufügen:**
   - Den Text in einen Container mit `overflow: hidden` setzen
   - Inneres `motion.span` mit einer `x`-Animation von `100%` nach `-100%` über ~8s, `repeat: Infinity`, `linear` easing
   - Nur für den langen Text (ohne Bonus) aktivieren — der Bonus-Text ist kurz genug
   - Die animierten Chevron-Pfeile (`>>>`) sind bereits im Text enthalten, das separate `ChevronRight`-Icon entfällt beim langen Text

3. **Technisch:** Framer Motion `animate` mit `x: ["100%", "-100%"]` — kein extra CSS nötig, da framer-motion bereits im Projekt ist.

