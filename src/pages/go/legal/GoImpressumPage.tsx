import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Building2, ArrowLeft, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function GoImpressumPage() {
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
              <Building2 className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Impressum
            </h1>
            <p className="text-muted-foreground">
              Angaben gemäss Schweizer Recht
            </p>
          </motion.div>
        </div>
      </section>

      <div className="py-12 md:py-16">
        <div className="container max-w-3xl mx-auto px-4">
          <div className="grid gap-5 mb-8">
            {/* Betreiber */}
            <Card className="p-6">
              <h2 className="font-bold text-lg mb-4">Betreiber</h2>
              <div className="text-muted-foreground space-y-1">
                <p className="font-semibold text-foreground">My 2Go</p>
                <p>c/o Radio 2Go</p>
                <p>Schweiz</p>
              </div>
            </Card>
            
            {/* Kontakt */}
            <Card className="p-6">
              <h2 className="font-bold text-lg mb-4">Kontakt</h2>
              <div className="text-muted-foreground space-y-2">
                <p>
                  E-Mail: <a href="mailto:info@my2go.app" className="text-primary hover:underline">info@my2go.app</a>
                </p>
                <p>
                  Website: <a href="https://www.my2go.app" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">www.my2go.app</a>
                </p>
              </div>
            </Card>
            
            {/* Haftungsausschluss */}
            <Card className="p-6">
              <h2 className="font-bold text-lg mb-4">Haftungsausschluss</h2>
              <div className="text-muted-foreground space-y-3 text-sm">
                <p>
                  Der Autor übernimmt keinerlei Gewähr hinsichtlich der inhaltlichen Richtigkeit, 
                  Genauigkeit, Aktualität, Zuverlässigkeit und Vollständigkeit der Informationen.
                </p>
                <p>
                  Haftungsansprüche gegen den Autor wegen Schäden materieller oder immaterieller Art, 
                  welche aus dem Zugriff oder der Nutzung bzw. Nichtnutzung der veröffentlichten 
                  Informationen, durch Missbrauch der Verbindung oder durch technische Störungen 
                  entstanden sind, werden ausgeschlossen.
                </p>
              </div>
            </Card>
            
            {/* Urheberrechte */}
            <Card className="p-6">
              <h2 className="font-bold text-lg mb-4">Urheberrechte</h2>
              <p className="text-muted-foreground text-sm">
                Die Urheber- und alle anderen Rechte an Inhalten, Bildern, Fotos oder anderen 
                Dateien auf dieser Website gehören ausschliesslich My 2Go oder den speziell 
                genannten Rechtsinhabern. Für die Reproduktion jeglicher Elemente ist die 
                schriftliche Zustimmung der Urheberrechtsträger im Voraus einzuholen.
              </p>
            </Card>
          </div>
          
          {/* Contact CTA */}
          <div className="text-center p-6 rounded-2xl bg-muted/40 border">
            <p className="text-muted-foreground mb-4">Kontakt aufnehmen?</p>
            <Button asChild variant="outline">
              <a href="mailto:info@my2go.app">
                <Mail className="mr-2 w-4 h-4" />
                E-Mail senden
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
