import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function FunnelPrivacyPage() {
  return (
    <div className="min-h-[calc(100vh-8rem)] px-4 py-8">
      <div className="w-full max-w-2xl mx-auto">
        <Link
          to="/u"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Zurück
        </Link>

        <h1 className="text-2xl font-bold mb-6">Datenschutzerklärung</h1>

        <div className="prose prose-sm max-w-none text-muted-foreground">
          <h2 className="text-lg font-semibold text-foreground mt-6 mb-3">1. Verantwortlicher</h2>
          <p>
            Verantwortlich für die Datenverarbeitung ist der Betreiber der My2Go-App. 
            Kontaktdaten finden Sie im Impressum.
          </p>

          <h2 className="text-lg font-semibold text-foreground mt-6 mb-3">2. Erhobene Daten</h2>
          <p>
            Wir erheben folgende Daten: E-Mail-Adresse, optional Telefonnummer, 
            Nutzungsdaten (Radiozeit, eingelöste Gutscheine), Geräteinformationen.
          </p>

          <h2 className="text-lg font-semibold text-foreground mt-6 mb-3">3. Verwendungszweck</h2>
          <p>
            Ihre Daten werden verwendet für: Bereitstellung des Dienstes, 
            Guthabenverwaltung, Benachrichtigungen (mit Ihrer Zustimmung), 
            Verbesserung des Angebots.
          </p>

          <h2 className="text-lg font-semibold text-foreground mt-6 mb-3">4. Weitergabe an Dritte</h2>
          <p>
            Daten werden nur an Partner weitergegeben, soweit dies für die Einlösung 
            von Gutscheinen erforderlich ist. Ihre E-Mail wird nicht an Partner übermittelt.
          </p>

          <h2 className="text-lg font-semibold text-foreground mt-6 mb-3">5. Ihre Rechte</h2>
          <p>
            Sie haben das Recht auf Auskunft, Berichtigung, Löschung und Datenübertragbarkeit. 
            Kontaktieren Sie uns unter den im Impressum angegebenen Daten.
          </p>

          <h2 className="text-lg font-semibold text-foreground mt-6 mb-3">6. Cookies & Tracking</h2>
          <p>
            Wir verwenden technisch notwendige Cookies und anonyme Nutzungsanalysen 
            zur Verbesserung unseres Angebots.
          </p>

          <p className="mt-8 text-xs">
            Stand: Januar 2025
          </p>
        </div>
      </div>
    </div>
  );
}
