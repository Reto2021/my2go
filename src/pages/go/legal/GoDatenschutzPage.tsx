import { motion } from "framer-motion";

export default function GoDatenschutzPage() {
  return (
    <div className="py-12 md:py-20">
      <div className="container max-w-3xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl md:text-4xl font-bold mb-8">
            Datenschutzerklärung
          </h1>
          
          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <p className="text-muted-foreground mb-8">
              Stand: Januar 2025
            </p>

            <h2>1. Verantwortliche Stelle</h2>
            <p>
              Verantwortlich für die Datenverarbeitung ist:<br />
              My 2Go<br />
              [Adresse]<br />
              Schweiz<br />
              E-Mail: datenschutz@my2go.win
            </p>

            <h2>2. Erhobene Daten</h2>
            <p>
              Im Rahmen der Nutzung unserer Dienste erheben und verarbeiten wir folgende Daten:
            </p>
            <ul>
              <li>Firmendaten (Name, Adresse, Branche)</li>
              <li>Kontaktdaten (Name, E-Mail, Telefon)</li>
              <li>Zahlungsdaten (über unseren Zahlungsanbieter Stripe)</li>
              <li>Nutzungsdaten der Plattform</li>
              <li>Kommunikationsdaten</li>
            </ul>

            <h2>3. Zweck der Datenverarbeitung</h2>
            <p>
              Die erhobenen Daten werden für folgende Zwecke verwendet:
            </p>
            <ul>
              <li>Vertragserfüllung und Bereitstellung unserer Dienste</li>
              <li>Abrechnung und Zahlungsabwicklung</li>
              <li>Kundensupport und Kommunikation</li>
              <li>Verbesserung unserer Dienste</li>
              <li>Rechtliche Verpflichtungen</li>
            </ul>

            <h2>4. Rechtsgrundlage</h2>
            <p>
              Die Verarbeitung erfolgt auf Basis von:
            </p>
            <ul>
              <li>Vertragserfüllung (Art. 6 Abs. 1 lit. b DSGVO)</li>
              <li>Berechtigte Interessen (Art. 6 Abs. 1 lit. f DSGVO)</li>
              <li>Einwilligung, sofern erteilt (Art. 6 Abs. 1 lit. a DSGVO)</li>
              <li>Gesetzliche Verpflichtungen (Art. 6 Abs. 1 lit. c DSGVO)</li>
            </ul>

            <h2>5. Datenweitergabe</h2>
            <p>
              Ihre Daten werden nur an Dritte weitergegeben, wenn dies für die 
              Vertragserfüllung erforderlich ist:
            </p>
            <ul>
              <li>Stripe (Zahlungsabwicklung)</li>
              <li>Cloud-Anbieter (Hosting)</li>
              <li>E-Mail-Dienstleister (Kommunikation)</li>
            </ul>

            <h2>6. Datenspeicherung</h2>
            <p>
              Wir speichern Ihre Daten nur so lange, wie es für die jeweiligen Zwecke 
              erforderlich ist oder gesetzliche Aufbewahrungsfristen bestehen.
            </p>

            <h2>7. Ihre Rechte</h2>
            <p>
              Sie haben folgende Rechte bezüglich Ihrer Daten:
            </p>
            <ul>
              <li>Recht auf Auskunft</li>
              <li>Recht auf Berichtigung</li>
              <li>Recht auf Löschung</li>
              <li>Recht auf Einschränkung der Verarbeitung</li>
              <li>Recht auf Datenübertragbarkeit</li>
              <li>Widerspruchsrecht</li>
            </ul>

            <h2>8. Cookies und Tracking</h2>
            <p>
              Unsere Website verwendet Cookies und Analytics-Tools. Details finden Sie 
              in unserem Cookie-Banner, über den Sie Ihre Einstellungen verwalten können.
            </p>

            <h2>9. Kontakt</h2>
            <p>
              Bei Fragen zum Datenschutz wenden Sie sich an:<br />
              E-Mail: datenschutz@my2go.win
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
