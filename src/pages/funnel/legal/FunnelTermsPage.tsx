import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function FunnelTermsPage() {
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

        <h1 className="text-2xl font-bold mb-6">Allgemeine Geschäftsbedingungen</h1>

        <div className="prose prose-sm max-w-none text-muted-foreground">
          <h2 className="text-lg font-semibold text-foreground mt-6 mb-3">1. Geltungsbereich</h2>
          <p>
            Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für die Nutzung der My2Go-App 
            und aller damit verbundenen Dienste. Mit der Registrierung akzeptieren Sie diese AGB.
          </p>

          <h2 className="text-lg font-semibold text-foreground mt-6 mb-3">2. 2Go Taler</h2>
          <p>
            2Go Taler sind Bonuspunkte, die ausschliesslich innerhalb des My2Go-Netzwerks bei 
            teilnehmenden Partnern eingelöst werden können. Eine Barauszahlung ist nicht möglich. 
            2Go Taler verfallen nach 12 Monaten Inaktivität.
          </p>

          <h2 className="text-lg font-semibold text-foreground mt-6 mb-3">3. Gutscheine & Goodies</h2>
          <p>
            Eingelöste Gutscheine und Goodies unterliegen den Bedingungen des jeweiligen Partners. 
            Die Verfügbarkeit kann variieren und ist nicht garantiert.
          </p>

          <h2 className="text-lg font-semibold text-foreground mt-6 mb-3">4. Nutzerkonto</h2>
          <p>
            Sie sind für die Sicherheit Ihres Kontos verantwortlich. Missbrauch oder Verstösse 
            gegen diese AGB können zur Sperrung des Kontos führen.
          </p>

          <h2 className="text-lg font-semibold text-foreground mt-6 mb-3">5. Änderungen</h2>
          <p>
            Wir behalten uns vor, diese AGB jederzeit zu ändern. Änderungen werden in der App 
            bekannt gegeben.
          </p>

          <h2 className="text-lg font-semibold text-foreground mt-6 mb-3">6. Gerichtsstand</h2>
          <p>
            Es gilt Schweizer Recht. Gerichtsstand ist der Sitz des Betreibers.
          </p>

          <p className="mt-8 text-xs">
            Stand: Januar 2025
          </p>
        </div>
      </div>
    </div>
  );
}
