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
  Play,
  Sparkles,
  Gift,
  Target
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import logoRadio2go from "@/assets/logo-radio2go.png";

export default function PartnerLandingPage() {
  return (
    <div className="overflow-hidden">
      {/* Hero Section - Premium Style matching consumer app */}
      <section className="hero-section relative pt-16 pb-32 md:pt-24 md:pb-40 overflow-hidden">
        {/* Clouds */}
        <div className="clouds-container">
          <div className="cloud cloud-1" />
          <div className="cloud cloud-2" />
          <div className="cloud cloud-3" />
          <div className="cloud cloud-4" />
          <div className="cloud cloud-5" />
          <div className="cloud cloud-6" />
          <div className="cloud cloud-7" />
          <div className="cloud cloud-8" />
        </div>
        
        <div className="container relative z-10 max-w-6xl mx-auto px-4">
          <motion.div 
            className="max-w-3xl mx-auto text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Partner Badge */}
            <motion.div 
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 backdrop-blur-sm shadow-lg text-secondary text-sm font-medium mb-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <img src={logoRadio2go} alt="Radio 2Go" className="h-5 w-auto" />
              <span className="font-semibold">Für Partner & Betriebe</span>
            </motion.div>
            
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 text-secondary">
              Mehr Kunden.{" "}
              <span className="text-primary">Mehr Reviews.</span>{" "}
              Mehr Fun.
            </h1>
            
            <p className="text-xl text-secondary/80 mb-8 max-w-2xl mx-auto">
              My 2Go macht aus Reichweite Stammkundschaft – mit 2Go Talern, 
              Review-Booster, POS-QR/NFC, Kampagnen und Radio-Activation.
            </p>
            
            {/* USP Pills */}
            <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
              {[
                { icon: CheckCircle2, text: "In 7 Tagen startklar" },
                { icon: QrCode, text: "QR/NFC am POS" },
                { icon: Zap, text: "Automationen inklusive" },
                { icon: Radio, text: "Radio-Activation inklusive" }
              ].map((item, idx) => (
                <motion.span 
                  key={idx}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 backdrop-blur-sm text-sm font-medium text-secondary shadow-sm"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + idx * 0.1 }}
                >
                  <item.icon className="w-4 h-4 text-green-500" />
                  {item.text}
                </motion.span>
              ))}
            </div>
            
            {/* CTA Buttons */}
            <motion.div 
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Button asChild size="lg" className="btn-primary text-base px-8 shadow-xl shadow-accent/30">
                <Link to="/go/partner/pricing">
                  30 Tage testen
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-base bg-white/90 backdrop-blur-sm hover:bg-white border-white/50 text-secondary">
                <a href="#demo" className="flex items-center gap-2">
                  <Play className="w-4 h-4" />
                  Demo ansehen
                </a>
              </Button>
            </motion.div>
          </motion.div>
        </div>
        
        {/* Skyline */}
        <div className="skyline-container">
          <div className="skyline-distant" />
          <div className="skyline-mid" />
          <div className="skyline-front" />
        </div>
      </section>

      {/* Trust Bar */}
      <section className="py-6 border-b bg-card">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Shield className="w-5 h-5 text-primary" />
              <span>Keine Fake-Reviews. Kein Druck.</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              <span>DSG & DSGVO konform</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Star className="w-5 h-5 text-primary" />
              <span>Erst Zufriedenheit, dann Bewertung</span>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Premium Cards */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container max-w-6xl mx-auto px-4">
          <motion.div 
            className="text-center mb-14"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="badge-accent mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              So funktioniert's
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Von Reichweite zur Stammkundschaft
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              In drei einfachen Schritten zu mehr Kunden und besseren Bewertungen
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Radio,
                title: "Radio-Reichweite",
                description: "Dein Betrieb wird im Radio promoted. Hörer werden zu Neukunden.",
                step: "01",
                color: "from-primary/20 to-primary/5"
              },
              {
                icon: QrCode,
                title: "QR am POS",
                description: "Kunden scannen, sammeln 2Go Taler, lösen Belohnungen ein.",
                step: "02",
                color: "from-accent/20 to-accent/5"
              },
              {
                icon: Star,
                title: "Automatische Reviews",
                description: "Zufriedene Kunden werden automatisch um eine Google-Bewertung gebeten.",
                step: "03",
                color: "from-success/20 to-success/5"
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`card-interactive relative p-6 h-full bg-gradient-to-br ${item.color}`}>
                  <span className="absolute top-4 right-4 text-5xl font-bold text-foreground/5">
                    {item.step}
                  </span>
                  <div className="icon-container-lg bg-white shadow-lg mb-5">
                    <item.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid - Premium Style */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container max-w-6xl mx-auto px-4">
          <motion.div 
            className="text-center mb-14"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="badge-primary mb-4">
              <Gift className="w-3.5 h-3.5" />
              Features
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Alles, was du brauchst
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Ein komplettes System für Kundenbindung und Reichweite
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: Users,
                title: "My 2Go Loyalty",
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
                <Card className="card-base p-5 h-full">
                  <div className="icon-container-md bg-primary/10 mb-4">
                    <feature.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-bold mb-1.5">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Audio Credits Explainer */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="badge-accent mb-4">
                <Radio className="w-3.5 h-3.5" />
                Radio-Power
              </span>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Audio-Credits erklärt
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                Mit Audio-Credits buchst du Radiozeit. Jedes Paket enthält monatliche Credits, 
                die du flexibel einsetzen kannst.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-card border border-border/50">
                  <div className="icon-container-md bg-primary/20 shrink-0">
                    <span className="font-bold text-primary">1</span>
                  </div>
                  <div>
                    <h4 className="font-bold">Air-Drop (5–8 Sek.)</h4>
                    <p className="text-sm text-muted-foreground">
                      Sponsor-Tag oder CTA = 1 Credit
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-card border border-border/50">
                  <div className="icon-container-md bg-accent/20 shrink-0">
                    <span className="font-bold text-accent-foreground">3</span>
                  </div>
                  <div>
                    <h4 className="font-bold">Radio-Spot (20 Sek.)</h4>
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
              <div className="aspect-square rounded-3xl bg-gradient-to-br from-primary/30 via-primary/20 to-accent/10 p-8 flex items-center justify-center shadow-2xl shadow-primary/20">
                <div className="text-center">
                  <img 
                    src={logoRadio2go} 
                    alt="Radio 2Go" 
                    className="h-20 w-auto mx-auto mb-6 drop-shadow-lg"
                  />
                  <p className="text-2xl font-bold text-secondary">Radio 2Go</p>
                  <p className="text-muted-foreground">Dein Partner fürs Radio</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section - Premium Style */}
      <section className="relative py-20 md:py-28 overflow-hidden bg-gradient-to-br from-secondary via-secondary to-secondary/95 text-secondary-foreground">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-accent rounded-full blur-3xl" />
        </div>
        
        <div className="container relative z-10 max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-sm font-medium mb-6">
              <Target className="w-4 h-4" />
              Bereit durchzustarten?
            </div>
            
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Bereit für mehr Kunden?
            </h2>
            <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
              Starte jetzt mit 30 Tagen kostenlosem Trial. 
              Keine Verpflichtung, jederzeit kündbar.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild size="lg" className="btn-primary text-base px-8 shadow-xl shadow-accent/40">
                <Link to="/go/partner/pricing">
                  Pakete & Preise ansehen
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
            </div>
            
            <p className="text-sm opacity-60 mt-6 flex items-center justify-center gap-2">
              <Shield className="w-4 h-4" />
              30 Tage Geld-zurück Garantie auf die Activation Fee
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
