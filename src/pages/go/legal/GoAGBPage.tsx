import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FileText, ArrowLeft, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function GoAGBPage() {
  return (
    <div className="overflow-hidden bg-background">
      {/* Hero Section */}
      <section className="relative pt-20 pb-10 md:pt-24 md:pb-14 overflow-hidden bg-gradient-to-b from-primary/10 via-primary/5 to-background">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-primary/20 rounded-full blur-3xl" />
        </div>
        
        <div className="container relative z-10 max-w-3xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
              <FileText className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Allgemeine Geschäftsbedingungen
            </h1>
            <p className="text-muted-foreground">
              Stand: Januar 2025
            </p>
          </motion.div>
        </div>
      </section>

      <div className="py-12 md:py-16">
        <div className="container max-w-3xl mx-auto px-4">
          <Card className="p-6 md:p-8 mb-8">
            <div className="prose prose-neutral dark:prose-invert max-w-none prose-headings:font-bold prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-4 prose-p:text-muted-foreground prose-li:text-muted-foreground prose-ul:my-4">
              
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
                <li>Integration in das My 2Go Loyalitätsprogramm</li>
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
                Die Verarbeitung personenbezogener Daten erfolgt gemäss unserer{" "}
                <Link to="/go/legal/datenschutz" className="text-primary hover:underline">Datenschutzerklärung</Link>{" "}
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
          </Card>
          
          {/* Contact CTA */}
          <div className="text-center p-6 rounded-2xl bg-muted/40 border">
            <p className="text-muted-foreground mb-4">Fragen zu den AGB?</p>
            <Button asChild variant="outline">
              <a href="mailto:info@my2go.app">
                <Mail className="mr-2 w-4 h-4" />
                Kontakt aufnehmen
              </a>
            </Button>
          </div>
          
          {/* Back Link */}
          <div className="text-center mt-8">
            <Button asChild variant="ghost">
              <Link to="/go">
                <ArrowLeft className="mr-2 w-4 h-4" />
                Zurück zur Übersicht
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
