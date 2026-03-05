import { ArrowLeft } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

export default function PrivacyPolicyPage() {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="container py-4 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="btn-ghost p-2 -ml-2">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold">Datenschutzerklärung</h1>
        </div>
      </header>
      
      <div className="container py-6">
        <div className="prose prose-sm max-w-none space-y-6 text-foreground">
          {/* Header Info */}
          <div className="card-base p-6 not-prose">
            <p className="font-semibold">2Go Media AG</p>
            <p className="text-sm text-muted-foreground">
              Industriestrasse 19<br />
              CH-5200 Brugg<br />
              Schweiz
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              E-Mail: contact@2gomedia.ch
            </p>
          </div>
          
          <h2 className="text-lg font-bold">Datenschutzerklärung my2go App</h2>
          
          <p className="text-sm text-muted-foreground">
            Der Schutz Ihrer persönlichen Daten ist uns ein wichtiges Anliegen. In dieser Datenschutzerklärung informieren wir Sie darüber, welche personenbezogenen Daten wir im Rahmen der my2go App erheben, wie wir sie verwenden und welche Rechte Sie haben.
          </p>
          
          <section>
            <h3 className="text-base font-semibold">1. Verantwortliche Stelle</h3>
            <p className="text-sm text-muted-foreground">
              Verantwortlich für die Datenverarbeitung ist:<br />
              2Go Media AG<br />
              Industriestrasse 19, CH-5200 Brugg<br />
              E-Mail: contact@2gomedia.ch
            </p>
          </section>
          
          <section>
            <h3 className="text-base font-semibold">2. Erhobene Daten</h3>
            <p className="text-sm text-muted-foreground">
              Bei der Nutzung der my2go App erheben wir folgende Daten:
            </p>
            <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1 mt-2">
              <li><strong>Registrierungsdaten:</strong> E-Mail-Adresse, Telefonnummer, optional: Name, Geburtsdatum</li>
              <li><strong>Nutzungsdaten:</strong> Login-Zeiten, gesammelte Taler, eingelöste Gutscheine, Streak-Daten</li>
              <li><strong>Audio-Nutzungsdaten:</strong> Gehörte Radiosender, Hördauer, Zeitpunkt und Dauer einzelner Hörsessions. Diese Daten werden zur Berechnung Ihrer Taler-Belohnungen und zur Verbesserung des Dienstes erhoben.</li>
              <li><strong>Technische Daten:</strong> Gerätetyp, Betriebssystem, App-Version, IP-Adresse</li>
              <li><strong>Standortdaten:</strong> Nur wenn Sie dies für die Partnerkarte explizit erlauben</li>
              <li><strong>Push-Benachrichtigungen:</strong> Subscription-Daten für Push-Nachrichten (optional)</li>
            </ul>
          </section>
          
          <section>
            <h3 className="text-base font-semibold">3. Zweck der Datenverarbeitung</h3>
            <p className="text-sm text-muted-foreground">
              Wir verarbeiten Ihre Daten für folgende Zwecke:
            </p>
            <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1 mt-2">
              <li>Bereitstellung und Betrieb der App und des Bonusprogramms</li>
              <li>Verwaltung Ihres Nutzerkontos und Ihrer Taler</li>
              <li>Einlösung von Gutscheinen bei Partnern</li>
              <li>Versand von Push-Benachrichtigungen (z.B. Erinnerung an ablaufende Gutscheine)</li>
              <li>Verbesserung der App und unserer Dienstleistungen</li>
              <li>Betrugsprävention und Sicherheit</li>
            </ul>
          </section>
          
          <section>
            <h3 className="text-base font-semibold">4. Rechtsgrundlage</h3>
            <p className="text-sm text-muted-foreground">
              Die Verarbeitung Ihrer Daten erfolgt auf Grundlage des Schweizerischen Bundesgesetzes über den Datenschutz (DSG/nDSG):
            </p>
            <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1 mt-2">
              <li><strong>Vertragserfüllung (Art. 31 Abs. 2 lit. a DSG):</strong> Bereitstellung des Bonusprogramms, Berechnung von Taler-Belohnungen basierend auf Audio-Nutzungsdaten</li>
              <li><strong>Einwilligung (Art. 31 Abs. 1 DSG):</strong> Push-Benachrichtigungen, Marketing-Kommunikation per E-Mail, SMS und WhatsApp</li>
              <li><strong>Überwiegende Interessen (Art. 31 Abs. 2 lit. a DSG):</strong> Sicherheit, Betrugsprävention und Verbesserung der App</li>
            </ul>
          </section>
          
          <section>
            <h3 className="text-base font-semibold">5. Datenweitergabe</h3>
            <p className="text-sm text-muted-foreground">
              Wir geben Ihre Daten nur in folgenden Fällen weiter:
            </p>
            <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1 mt-2">
              <li><strong>Partner:</strong> Bei Einlösung eines Gutscheins erhält der Partner nur den Gutscheincode und die Information, dass dieser gültig ist</li>
              <li><strong>Technische Dienstleister:</strong> Hosting- und Datenbankdienste, die vertraglich zur Vertraulichkeit verpflichtet sind</li>
              <li><strong>Behörden:</strong> Nur bei gesetzlicher Verpflichtung</li>
            </ul>
          </section>
          
          <section>
            <h3 className="text-base font-semibold">6. Datenspeicherung</h3>
            <p className="text-sm text-muted-foreground">
              Ihre Daten werden auf Servern in der Schweiz/EU gespeichert. Wir speichern Ihre Daten nur so lange, wie dies für die genannten Zwecke erforderlich ist oder gesetzliche Aufbewahrungspflichten bestehen.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Nach Löschung Ihres Kontos werden Ihre personenbezogenen Daten innerhalb von 30 Tagen gelöscht, sofern keine gesetzlichen Aufbewahrungspflichten entgegenstehen.
            </p>
          </section>
          
          <section>
            <h3 className="text-base font-semibold">7. Ihre Rechte</h3>
            <p className="text-sm text-muted-foreground">
              Sie haben folgende Rechte bezüglich Ihrer personenbezogenen Daten:
            </p>
            <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1 mt-2">
              <li><strong>Auskunft:</strong> Sie können Auskunft über Ihre gespeicherten Daten verlangen</li>
              <li><strong>Berichtigung:</strong> Sie können die Korrektur unrichtiger Daten verlangen</li>
              <li><strong>Löschung:</strong> Sie können die Löschung Ihrer Daten verlangen</li>
              <li><strong>Einschränkung:</strong> Sie können die Einschränkung der Verarbeitung verlangen</li>
              <li><strong>Datenübertragbarkeit:</strong> Sie können Ihre Daten in einem gängigen Format erhalten</li>
              <li><strong>Widerspruch:</strong> Sie können der Verarbeitung widersprechen</li>
              <li><strong>Widerruf:</strong> Erteilte Einwilligungen können Sie jederzeit widerrufen</li>
            </ul>
            <p className="text-sm text-muted-foreground mt-2">
              Zur Ausübung Ihrer Rechte kontaktieren Sie uns unter: contact@2gomedia.ch
            </p>
          </section>
          
          <section>
            <h3 className="text-base font-semibold">8. Cookies und Tracking</h3>
            <p className="text-sm text-muted-foreground">
              Die my2go App verwendet nur technisch notwendige lokale Speicherung für:
            </p>
            <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1 mt-2">
              <li>Authentifizierung und Session-Verwaltung</li>
              <li>Speicherung von App-Einstellungen (z.B. Sound, Vibration)</li>
            </ul>
            <p className="text-sm text-muted-foreground mt-2">
              Wir verwenden keine Tracking-Cookies oder Werbe-Tracker von Drittanbietern.
            </p>
          </section>
          
          <section>
            <h3 className="text-base font-semibold">9. Datensicherheit</h3>
            <p className="text-sm text-muted-foreground">
              Wir setzen technische und organisatorische Massnahmen ein, um Ihre Daten vor unbefugtem Zugriff, Verlust oder Missbrauch zu schützen. Dazu gehören Verschlüsselung, sichere Serverinfrastruktur und regelmässige Sicherheitsupdates.
            </p>
          </section>
          
          <section>
            <h3 className="text-base font-semibold">10. Änderungen dieser Datenschutzerklärung</h3>
            <p className="text-sm text-muted-foreground">
              Wir behalten uns vor, diese Datenschutzerklärung bei Bedarf anzupassen. Die aktuelle Version ist jederzeit in der App abrufbar.
            </p>
          </section>
          
          <section>
            <h3 className="text-base font-semibold">11. Kontakt und Beschwerden</h3>
            <p className="text-sm text-muted-foreground">
              Bei Fragen zum Datenschutz oder zur Ausübung Ihrer Rechte kontaktieren Sie uns unter:
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              2Go Media AG<br />
              Industriestrasse 19, CH-5200 Brugg<br />
              E-Mail: contact@2gomedia.ch
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Sie haben zudem das Recht, eine Beschwerde bei der zuständigen Datenschutzbehörde einzureichen (Eidgenössischer Datenschutz- und Öffentlichkeitsbeauftragter, EDÖB).
            </p>
          </section>
          
          <div className="pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Stand: März 2026
            </p>
          </div>
          
          {/* Links */}
          <div className="card-base p-4 not-prose">
            <p className="text-sm font-medium mb-3">Weitere rechtliche Informationen:</p>
            <div className="flex flex-wrap gap-2">
              <Link to="/agb" className="text-sm text-secondary hover:underline">
                Nutzungsbedingungen
              </Link>
              <span className="text-muted-foreground">•</span>
              <Link to="/impressum" className="text-sm text-secondary hover:underline">
                Impressum
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
