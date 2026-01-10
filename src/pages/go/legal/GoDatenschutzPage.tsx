import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, ArrowLeft, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function GoDatenschutzPage() {
  return (
    <div className="overflow-hidden bg-background">
      {/* Hero Section */}
      <section className="relative py-10 md:py-14 overflow-hidden bg-gradient-to-b from-primary/10 via-primary/5 to-background">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-primary/20 rounded-full blur-3xl" />
        </div>
        
        <div className="container relative z-10 max-w-3xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
              <Shield className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Datenschutzerklärung
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
              
              <h2>1. Verantwortliche Stelle</h2>
              <p>
                Verantwortlich für die Datenverarbeitung ist:<br />
                <strong>My 2Go</strong><br />
                c/o Radio 2Go<br />
                Schweiz<br />
                E-Mail: <a href="mailto:datenschutz@my2go.win" className="text-primary">datenschutz@my2go.win</a>
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
                E-Mail: <a href="mailto:datenschutz@my2go.win" className="text-primary">datenschutz@my2go.win</a>
              </p>
            </div>
          </Card>
          
          {/* Contact CTA */}
          <div className="text-center p-6 rounded-2xl bg-muted/40 border">
            <p className="text-muted-foreground mb-4">Fragen zum Datenschutz?</p>
            <Button asChild variant="outline">
              <a href="mailto:datenschutz@my2go.win">
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
