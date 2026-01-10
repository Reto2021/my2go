import { motion } from "framer-motion";

export default function GoAGBPage() {
  return (
    <div className="py-12 md:py-20">
      <div className="container max-w-3xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl md:text-4xl font-bold mb-8">
            Allgemeine Geschäftsbedingungen (AGB)
          </h1>
          
          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <p className="text-muted-foreground mb-8">
              Stand: Januar 2025
            </p>

            <h2>1. Geltungsbereich</h2>
            <p>
              Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für alle Verträge, die zwischen 
              My 2Go (nachfolgend "Anbieter") und dem Geschäftskunden (nachfolgend "Partner") 
              über die Nutzung der My 2Go Plattform geschlossen werden.
            </p>

            <h2>2. Vertragsgegenstand</h2>
            <p>
              Der Anbieter stellt dem Partner eine digitale Loyalitäts- und Marketing-Plattform 
              zur Verfügung, die folgende Leistungen umfasst:
            </p>
            <ul>
              <li>Zugang zum My 2Go Partner-Dashboard</li>
              <li>Integration in das 2Go Taler Loyalitätsprogramm</li>
              <li>Review-Booster Funktionalität</li>
              <li>Audio-Credits für Radio-Werbung (je nach gewähltem Paket)</li>
              <li>Marketing-Kampagnen und Automationen</li>
            </ul>

            <h2>3. Vertragsschluss</h2>
            <p>
              Der Vertrag kommt mit erfolgreicher Zahlung der Activation Fee über das 
              Online-Checkout-System zustande. Der Partner erhält eine Bestätigung per E-Mail.
            </p>

            <h2>4. Trial-Periode</h2>
            <p>
              Alle Pakete beinhalten eine 30-tägige Trial-Periode. Während dieser Zeit wird 
              keine monatliche/jährliche Abo-Gebühr erhoben. Die Activation Fee ist sofort 
              bei Vertragsschluss fällig.
            </p>

            <h2>5. Preise und Zahlungsbedingungen</h2>
            <p>
              Alle angegebenen Preise verstehen sich in Schweizer Franken (CHF) und exklusive 
              der gesetzlichen Mehrwertsteuer (MwSt). Die aktuelle MwSt von 8.1% wird bei der 
              Abrechnung hinzugerechnet.
            </p>

            <h2>6. Geld-zurück Garantie</h2>
            <p>
              Der Partner kann innerhalb der ersten 30 Tage die Erstattung der Activation Fee 
              beantragen, sofern folgende Bedingungen erfüllt sind:
            </p>
            <ul>
              <li>Onboarding wurde innerhalb von 5 Tagen abgeschlossen</li>
              <li>QR/POS-Materialien waren mindestens 10 Öffnungstage sichtbar im Einsatz</li>
              <li>Mindestens 1 Kampagne wurde ausgespielt</li>
              <li>Antrag wurde bis spätestens Tag 30 eingereicht</li>
            </ul>
            <p>
              POS-Druck und Versandkosten sind von der Erstattung ausgenommen, falls diese 
              bereits ausgelöst wurden.
            </p>

            <h2>7. Vertragslaufzeit und Kündigung</h2>
            <p>
              Nach Ablauf der Trial-Periode verlängert sich der Vertrag automatisch um die 
              gewählte Abrechnungsperiode (monatlich oder jährlich). Der Vertrag kann jederzeit 
              zum Ende der aktuellen Abrechnungsperiode gekündigt werden.
            </p>

            <h2>8. Datenschutz</h2>
            <p>
              Die Verarbeitung personenbezogener Daten erfolgt gemäss unserer Datenschutzerklärung 
              und im Einklang mit dem Schweizer Datenschutzgesetz (DSG) sowie der DSGVO.
            </p>

            <h2>9. Haftung</h2>
            <p>
              Die Haftung des Anbieters ist auf Vorsatz und grobe Fahrlässigkeit beschränkt. 
              Eine Haftung für indirekte Schäden oder entgangenen Gewinn ist ausgeschlossen.
            </p>

            <h2>10. Anwendbares Recht und Gerichtsstand</h2>
            <p>
              Es gilt Schweizer Recht. Gerichtsstand ist der Sitz des Anbieters.
            </p>

            <h2>11. Salvatorische Klausel</h2>
            <p>
              Sollten einzelne Bestimmungen dieser AGB unwirksam sein, bleibt die Wirksamkeit 
              der übrigen Bestimmungen davon unberührt.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
