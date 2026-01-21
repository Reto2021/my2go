/**
 * My 2Go - Static Content
 * 
 * This file contains static content like FAQ items.
 * All dynamic data is fetched from Supabase.
 */

// ============================================================================
// FAQ ITEMS
// ============================================================================

export interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

export const FAQ_ITEMS: FAQItem[] = [
  // Grundlagen (3)
  { question: 'Was sind 2Go Taler?', answer: 'Deine lokale Belohnungswährung. Hör Radio, kauf ein vor Ort, sammle Taler – geniess bei Partnern. Nicht auszahlbar.', category: 'Grundlagen' },
  { question: 'Wie sammle ich Taler?', answer: 'Radio hören (automatisch), bei Partnern einkaufen (10 Taler pro 10 CHF), Besuche (5 Taler) oder On-Air Codes eingeben. Mit 2Go Plus erhältst du 2x Bonus bei Besuchen und Einkäufen!', category: 'Grundlagen' },
  { question: 'Wo ist meine Karte?', answer: 'Du erhältst einen Link per E-Mail oder Wallet. Damit öffnest du deine My 2Go Karte.', category: 'Grundlagen' },
  
  // 2Go Plus (5) - NEW CATEGORY
  { question: 'Was ist 2Go Plus?', answer: '2Go Plus ist unser Premium-Abo. Du sparst 50% Taler bei Gutscheinen, verdienst 2x Bonus bei Besuchen & Einkäufen, hast Zugang zu exklusiven Rewards und deine Taler sind 12 Monate gültig statt 6!', category: '2Go Plus' },
  { question: 'Welche Vorteile habe ich mit 2Go Plus?', answer: '✓ 50% weniger Taler für alle Gutscheine\n✓ 2x Taler-Bonus bei Besuchen & Einkäufen\n✓ Exklusive Premium-Rewards\n✓ 12 Monate Taler-Gültigkeit statt 6 Monate', category: '2Go Plus' },
  { question: 'Wie aktiviere ich 2Go Plus?', answer: 'Gehe auf dein Profil oder die Guthaben-Seite und wähle "2Go Plus aktivieren". Du kannst monatlich oder jährlich zahlen – oder mit 500 Taler für 30 Tage einlösen.', category: '2Go Plus' },
  { question: 'Kann ich 2Go Plus mit Taler kaufen?', answer: 'Ja! Du kannst 500 Taler gegen 30 Tage 2Go Plus eintauschen. Perfekt, wenn du viele Taler gesammelt hast.', category: '2Go Plus' },
  { question: 'Verlängert sich 2Go Plus automatisch?', answer: 'Beim Abo ja – du kannst aber jederzeit kündigen. Bei Taler-Einlösung nicht automatisch, du musst manuell verlängern.', category: '2Go Plus' },
  
  // Gutscheine (4)
  { question: 'Wie löse ich einen Gutschein ein?', answer: 'Gutschein wählen, einlösen, Code beim Partner vorzeigen. Nur vor Ort gültig. Mit 2Go Plus sparst du 50% Taler!', category: 'Gutscheine' },
  { question: 'Wie lange ist der Einlösecode gültig?', answer: '60 Minuten. Danach verfällt er, deine Taler bleiben erhalten.', category: 'Gutscheine' },
  { question: 'Kann ich Gutscheine zurückgeben?', answer: 'Nein. Einmal eingelöst, kein Rücktausch möglich.', category: 'Gutscheine' },
  { question: 'Gibt es ein Limit pro Tag?', answer: 'Ja, manche Gutscheine haben ein Tageslimit. Steht beim jeweiligen Gutschein.', category: 'Gutscheine' },
  
  // Codes (3)
  { question: 'Was ist ein On-Air Code?', answer: 'Codes, die live im Radio genannt werden. Eingeben und Taler kassieren!', category: 'Codes' },
  { question: 'Mein Code funktioniert nicht?', answer: 'Schreibweise prüfen. Codes sind 24h gültig und nur 1x einlösbar.', category: 'Codes' },
  { question: 'Wie viele Codes kann ich pro Tag einlösen?', answer: 'Max. 5 Codes pro Tag. Bei Missbrauch wird das Konto gesperrt.', category: 'Codes' },
  
  // Taler & Gültigkeit (4)
  { question: 'Verfallen meine Taler?', answer: 'Standardmässig haben Taler eine Gültigkeit von 6 Monaten ab Erhalt. Mit 2Go Plus verlängert sich die Gültigkeit auf 12 Monate! Bei Einlösung werden immer die ältesten Taler zuerst verwendet (FIFO).', category: 'Taler' },
  { question: 'Werde ich vor dem Verfall gewarnt?', answer: 'Ja! Du siehst auf deiner Guthaben-Karte, wenn Taler bald verfallen. Zusätzlich wirst du per Push-Benachrichtigung informiert.', category: 'Taler' },
  { question: 'Kann ich Taler auszahlen?', answer: 'Nein. 2Go Taler sind Bonuspunkte, keine Währung. Keine Barauszahlung.', category: 'Taler' },
  { question: 'Kann ich Taler übertragen?', answer: 'Nein. Taler sind an dein Konto gebunden und nicht übertragbar.', category: 'Taler' },
  
  // Konto & Support (2)
  { question: 'Wie lösche ich mein Konto?', answer: 'E-Mail an datenschutz@radio2go.ch mit Betreff "Konto löschen".', category: 'Konto' },
  { question: 'Ich brauche Hilfe!', answer: 'Schreib an support@radio2go.ch. Antwort innerhalb 24h.', category: 'Konto' },
  
  // Streaming / Geräte (5)
  { question: 'Wie höre ich Radio 2Go auf Chromecast?', answer: 'Stream starten, Cast-Symbol antippen, Chromecast auswählen. Läuft direkt auf dem TV/Lautsprecher.', category: 'Streaming' },
  { question: 'Wie höre ich Radio 2Go über AirPlay?', answer: 'iPhone/iPad: Kontrollzentrum öffnen (wischen), AirPlay-Symbol tippen, Gerät wählen. Mac: Menüleiste → AirPlay.', category: 'Streaming' },
  { question: 'Kann ich Radio 2Go auf Sonos hören?', answer: 'Ja! Sonos App → Durchsuchen → Radio by TuneIn → "Radio 2Go" suchen. Oder: radio2go.fm/stream als Favorit hinzufügen.', category: 'Streaming' },
  { question: 'Wie höre ich Radio 2Go auf Alexa?', answer: '"Alexa, spiele Radio 2Go" oder via TuneIn Skill. Einmal einrichten, dann per Sprachbefehl starten.', category: 'Streaming' },
  { question: 'Kann ich auf mehreren Geräten gleichzeitig hören?', answer: 'Ja, aber jedes Gerät braucht eine eigene Verbindung. Bluetooth-Kopfhörer: Nur eines gleichzeitig möglich (Geräte-Limit).', category: 'Streaming' },
  { question: 'Kann ich andere Radiosender hören?', answer: 'Ja! In den Einstellungen findest du eine Sender-Suche. Du kannst jeden Sender als Favorit speichern. Wichtig: Bei Radio 2Go gibt es volle Taler-Belohnungen – bei anderen Sendern brauchst du die doppelte Hördauer. Der Taler-Alarm läuft nur bei Radio 2Go!', category: 'Streaming' },
];

// ============================================================================
// SUPPORT TICKET (placeholder for future implementation)
// ============================================================================

export async function createSupportTicket(data: {
  topic: string;
  message: string;
  contact?: string;
}): Promise<{ ticketId: string }> {
  // TODO: Implement via Supabase edge function or external service
  console.log('Support ticket:', data);
  
  // For now, return a mock ticket ID
  const ticketId = 'TKT-' + Math.random().toString(36).substring(2, 8).toUpperCase();
  return { ticketId };
}
