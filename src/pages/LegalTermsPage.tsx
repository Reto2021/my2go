import { ArrowLeft } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

export default function LegalTermsPage() {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="container py-4 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="btn-ghost p-2 -ml-2">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold">Nutzungsbedingungen</h1>
        </div>
      </header>
      
      <div className="container py-6">
        <div className="prose prose-sm max-w-none space-y-6 text-foreground">
          {/* Header Info */}
          <div className="card-base p-6 not-prose">
            <p className="font-semibold">2Go Media AG</p>
            <p className="text-sm text-muted-foreground">
              Industriestrasse 19<br />
              CH-5200 Brugg AG<br />
              Schweiz
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              E-Mail: contact@2gomedia.ch
            </p>
          </div>
          
          <h2 className="text-lg font-bold">Allgemeine Nutzungsbedingungen my2go App</h2>
          
          <section>
            <h3 className="text-base font-semibold">1. Geltungsbereich</h3>
            <p className="text-sm text-muted-foreground">
              Die nachstehenden Allgemeinen Nutzungsbedingungen (auch «AGB» genannt) gelten für die Nutzung der my2go App und des damit verbundenen 2Go Taler Bonusprogramms, betrieben von der 2Go Media AG.
            </p>
          </section>
          
          <section>
            <h3 className="text-base font-semibold">2. Leistungen</h3>
            <p className="text-sm text-muted-foreground">
              2.1 Die my2go App ermöglicht es registrierten Nutzern, 2Go Taler (Bonuspunkte) zu sammeln und diese bei teilnehmenden Partnern gegen Vergünstigungen, Rabatte oder Produkte einzulösen.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              2.2 2Go Taler sind Bonuspunkte ohne Geldwert und können nicht gegen Bargeld eingetauscht werden. Sie sind nicht übertragbar und verfallen bei Kontolöschung.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              2.3 Die Bereitstellung der App erfolgt während der Laufzeit 24 Stunden am Tag und 7 Tage die Woche, vorbehaltlich technischer Wartungsarbeiten oder Störungen.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              2.4 2Go Media ist jederzeit berechtigt, Updates oder Änderungen an der App durchzuführen, das Angebot an Partnern und Prämien zu ändern oder die Bedingungen des Bonusprogramms anzupassen.
            </p>
          </section>
          
          <section>
            <h3 className="text-base font-semibold">3. Registrierung und Nutzerkonto</h3>
            <p className="text-sm text-muted-foreground">
              3.1 Für die vollständige Nutzung der App ist eine Registrierung erforderlich. Der Nutzer muss wahrheitsgemässe Angaben machen und das Mindestalter von 16 Jahren erreicht haben.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              3.2 Der Nutzer ist verpflichtet, seine Zugangsdaten geheim zu halten und 2Go Media unverzüglich zu informieren, wenn unbefugte Dritte Kenntnis von den Zugangsdaten erlangt haben.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              3.3 Pro Person ist nur ein Nutzerkonto zulässig. Mehrfachregistrierungen können zur Sperrung des Kontos führen.
            </p>
          </section>
          
          <section>
            <h3 className="text-base font-semibold">4. Taler sammeln und einlösen</h3>
            <p className="text-sm text-muted-foreground">
              4.1 Taler können durch verschiedene Aktionen gesammelt werden, wie z.B. tägliches Einloggen (Streak), Eingabe von Codes, Empfehlungen oder besondere Aktionen.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              4.2 Die Anzahl der erhältlichen Taler kann je nach Aktion variieren und wird von 2Go Media festgelegt.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              4.3 Eingelöste Gutscheine haben ein Ablaufdatum und müssen innerhalb der angegebenen Frist beim Partner vor Ort eingelöst werden.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              4.4 2Go Media behält sich das Recht vor, bei Missbrauch (z.B. automatisierte Registrierungen, betrügerische Codes) Taler zu stornieren und Konten zu sperren.
            </p>
          </section>
          
          <section>
            <h3 className="text-base font-semibold">5. Haftung</h3>
            <p className="text-sm text-muted-foreground">
              5.1 2Go Media haftet für Schäden nur bei Vorsatz oder grober Fahrlässigkeit.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              5.2 2Go Media haftet nicht für die Qualität der von Partnern angebotenen Produkte oder Dienstleistungen. Reklamationen sind direkt an den jeweiligen Partner zu richten.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              5.3 2Go Media haftet nicht für Schäden durch Leistungsausfälle, die auf höhere Gewalt, technische Störungen oder Wartungsarbeiten zurückzuführen sind.
            </p>
          </section>
          
          <section>
            <h3 className="text-base font-semibold">6. Datenschutz</h3>
            <p className="text-sm text-muted-foreground">
              Die Erhebung und Verarbeitung personenbezogener Daten erfolgt gemäss unserer <Link to="/datenschutz" className="text-secondary hover:underline">Datenschutzerklärung</Link> und im Einklang mit dem Schweizerischen Datenschutzgesetz.
            </p>
          </section>
          
          <section>
            <h3 className="text-base font-semibold">7. Kündigung und Kontolöschung</h3>
            <p className="text-sm text-muted-foreground">
              7.1 Der Nutzer kann sein Konto jederzeit löschen. Mit der Löschung verfallen alle gesammelten Taler unwiderruflich.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              7.2 2Go Media ist berechtigt, Nutzerkonten bei Verstössen gegen diese AGB oder bei länger als 12 Monate inaktiven Konten zu löschen.
            </p>
          </section>
          
          <section>
            <h3 className="text-base font-semibold">8. Änderungen der AGB</h3>
            <p className="text-sm text-muted-foreground">
              2Go Media behält sich vor, diese AGB jederzeit zu ändern. Änderungen werden dem Nutzer rechtzeitig mitgeteilt. Die weitere Nutzung der App nach Inkrafttreten der Änderungen gilt als Zustimmung.
            </p>
          </section>
          
          <section>
            <h3 className="text-base font-semibold">9. Schlussbestimmungen</h3>
            <p className="text-sm text-muted-foreground">
              9.1 Es gilt Schweizer Recht unter Ausschluss des UN-Kaufrechts.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              9.2 Gerichtsstand für sämtliche Streitigkeiten ist Brugg AG, Schweiz.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              9.3 Sollten einzelne Bestimmungen dieser AGB unwirksam sein, bleibt die Gültigkeit der übrigen Bestimmungen unberührt.
            </p>
          </section>
          
          <div className="pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Stand: Januar 2025
            </p>
          </div>
          
          {/* Links */}
          <div className="card-base p-4 not-prose">
            <p className="text-sm font-medium mb-3">Weitere rechtliche Informationen:</p>
            <div className="flex flex-wrap gap-2">
              <Link to="/impressum" className="text-sm text-secondary hover:underline">
                Impressum
              </Link>
              <span className="text-muted-foreground">•</span>
              <Link to="/datenschutz" className="text-sm text-secondary hover:underline">
                Datenschutz
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
