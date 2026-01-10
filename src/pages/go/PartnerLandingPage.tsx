import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Radio, 
  Star, 
  QrCode, 
  Users, 
  TrendingUp, 
  Shield, 
  Zap,
  CheckCircle2,
  ArrowRight,
  Play
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

export default function PartnerLandingPage() {
  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/10" />
        <div className="absolute top-20 right-0 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary/10 rounded-full blur-2xl" />
        
        <div className="container relative max-w-6xl mx-auto px-4">
          <motion.div 
            className="max-w-3xl mx-auto text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Radio className="w-4 h-4" />
              Radio-Reichweite für lokale Betriebe
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Mehr Kunden.{" "}
              <span className="text-primary">Mehr Reviews.</span>{" "}
              Mehr Fun.
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              My 2Go macht aus Reichweite Stammkundschaft – mit 2Go Talern, 
              Review-Booster, POS-QR/NFC, Kampagnen und Radio-Activation.
            </p>
            
            <div className="flex flex-wrap items-center justify-center gap-3 mb-8 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                In 7 Tagen startklar
              </span>
              <span className="hidden sm:block">•</span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                QR/NFC am POS
              </span>
              <span className="hidden sm:block">•</span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                Automationen inklusive
              </span>
              <span className="hidden sm:block">•</span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                Radio-Activation inklusive
              </span>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild size="lg" className="text-base px-8">
                <Link to="/go/partner/pricing">
                  30 Tage testen
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-base">
                <a href="#demo" className="flex items-center gap-2">
                  <Play className="w-4 h-4" />
                  Demo ansehen (60 Sek.)
                </a>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="py-8 border-y bg-muted/30">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <span>Keine Fake-Reviews. Kein Druck.</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              <span>DSG & DSGVO konform</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-primary" />
              <span>Erst Zufriedenheit, dann Bewertung</span>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 md:py-28">
        <div className="container max-w-6xl mx-auto px-4">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              So funktioniert My 2Go
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Von der Reichweite zur Stammkundschaft in drei einfachen Schritten
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Radio,
                title: "Radio-Reichweite",
                description: "Dein Betrieb wird im Radio promoted. Hörer werden zu Neukunden.",
                step: "01"
              },
              {
                icon: QrCode,
                title: "QR am POS",
                description: "Kunden scannen, sammeln 2Go Taler, lösen Belohnungen ein.",
                step: "02"
              },
              {
                icon: Star,
                title: "Automatische Reviews",
                description: "Zufriedene Kunden werden automatisch um eine Google-Bewertung gebeten.",
                step: "03"
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="relative p-6 h-full border-2 hover:border-primary/50 transition-colors">
                  <span className="absolute top-4 right-4 text-4xl font-bold text-muted/20">
                    {item.step}
                  </span>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <item.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 md:py-28 bg-muted/30">
        <div className="container max-w-6xl mx-auto px-4">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Alles, was du brauchst
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Ein komplettes System für Kundenbindung und Reichweite
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Users,
                title: "2Go Taler Loyalty",
                description: "Kunden sammeln Punkte und lösen Belohnungen bei dir ein."
              },
              {
                icon: Star,
                title: "Review-Booster",
                description: "Automatisierte Bewertungsanfragen nach positiver Erfahrung."
              },
              {
                icon: Radio,
                title: "Radio-Activation",
                description: "Dein Betrieb im Radio – mit Audio-Credits für Spots und Tags."
              },
              {
                icon: QrCode,
                title: "POS Integration",
                description: "QR-Codes und NFC-Tags für einfaches Scannen vor Ort."
              },
              {
                icon: Zap,
                title: "Kampagnen-Automationen",
                description: "Automatische Trigger für Geburtstage, Inaktivität und mehr."
              },
              {
                icon: TrendingUp,
                title: "Dashboard & Insights",
                description: "Übersichtliche Statistiken und Auswertungen in Echtzeit."
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="p-6 h-full">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Audio Credits Explainer */}
      <section className="py-20 md:py-28">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Audio-Credits erklärt
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                Mit Audio-Credits buchst du Radiozeit. Jedes Paket enthält monatliche Credits, 
                die du flexibel einsetzen kannst.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <span className="font-bold text-primary">1</span>
                  </div>
                  <div>
                    <h4 className="font-semibold">Air-Drop (5–8 Sek.)</h4>
                    <p className="text-sm text-muted-foreground">
                      Sponsor-Tag oder CTA = 1 Credit
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <span className="font-bold text-primary">3</span>
                  </div>
                  <div>
                    <h4 className="font-semibold">Radio-Spot (20 Sek.)</h4>
                    <p className="text-sm text-muted-foreground">
                      Vollwertiger Werbespot = 3 Credits
                    </p>
                  </div>
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground mt-6">
                Aussteuerung erfolgt rotations-/inventory-basiert. Keine minutengenaue Sendeplatz-Garantie.
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent p-8 flex items-center justify-center">
                <div className="text-center">
                  <Radio className="w-20 h-20 text-primary mx-auto mb-4" />
                  <p className="text-2xl font-bold">Radio 2Go</p>
                  <p className="text-muted-foreground">Dein Partner fürs Radio</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-28 bg-primary text-primary-foreground">
        <div className="container max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Bereit für mehr Kunden?
            </h2>
            <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
              Starte jetzt mit 30 Tagen kostenlosem Trial. 
              Keine Verpflichtung, jederzeit kündbar.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild size="lg" variant="secondary" className="text-base px-8">
                <Link to="/go/partner/pricing">
                  Pakete & Preise ansehen
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
            </div>
            
            <p className="text-sm opacity-70 mt-6">
              30 Tage Geld-zurück Garantie auf die Activation Fee
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
