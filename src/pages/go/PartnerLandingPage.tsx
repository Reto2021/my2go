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
    <div className="overflow-hidden bg-background">
      {/* Hero Section - Clean, no clouds */}
      <section className="relative pt-8 pb-16 md:pt-12 md:pb-24 overflow-hidden bg-gradient-to-b from-primary/10 via-primary/5 to-background">
        {/* Subtle decorative gradient orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 -left-24 w-64 h-64 bg-accent/15 rounded-full blur-3xl" />
        </div>
        
        <div className="container relative z-10 max-w-5xl mx-auto px-4">
          <motion.div 
            className="max-w-3xl mx-auto text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Partner Badge */}
            <motion.div 
              className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-secondary text-white text-sm font-semibold mb-8 shadow-lg shadow-secondary/30"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
            >
              <img src={logoRadio2go} alt="Radio 2Go" className="h-5 w-auto brightness-0 invert" />
              Für Partner & Betriebe
            </motion.div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-6 text-foreground leading-tight">
              Mehr Kunden.{" "}
              <span className="text-primary">Mehr Reviews.</span>
              <br className="hidden sm:block" />
              Mehr Fun.
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              My 2Go macht aus Reichweite Stammkundschaft – mit 2Go Talern, 
              Review-Booster, POS-QR/NFC, Kampagnen und Radio-Activation.
            </p>
            
            {/* CTA Buttons - Prominent */}
            <motion.div 
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Button asChild size="lg" className="h-14 px-8 text-base font-bold rounded-2xl bg-accent hover:bg-accent/90 text-accent-foreground shadow-xl shadow-accent/30 transition-all hover:scale-[1.02]">
                <Link to="/go/partner/pricing">
                  30 Tage kostenlos testen
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-14 px-8 text-base font-semibold rounded-2xl border-2 hover:bg-secondary hover:text-white hover:border-secondary transition-all">
                <a href="#demo" className="flex items-center gap-2">
                  <Play className="w-5 h-5" />
                  Demo ansehen
                </a>
              </Button>
            </motion.div>
            
            {/* USP Pills - Below buttons */}
            <motion.div 
              className="flex flex-wrap items-center justify-center gap-2 md:gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {[
                { icon: CheckCircle2, text: "In 7 Tagen startklar" },
                { icon: QrCode, text: "QR/NFC am POS" },
                { icon: Zap, text: "Automationen" },
                { icon: Radio, text: "Radio-Activation" }
              ].map((item, idx) => (
                <span 
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-card border border-border text-xs md:text-sm font-medium text-muted-foreground"
                >
                  <item.icon className="w-3.5 h-3.5 text-primary" />
                  {item.text}
                </span>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Trust Bar - Solid background */}
      <section className="py-5 bg-secondary text-white">
        <div className="container max-w-5xl mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10 text-sm font-medium">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-accent" />
              <span>Keine Fake-Reviews</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-accent" />
              <span>DSG & DSGVO konform</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-accent" />
              <span>Erst Zufriedenheit, dann Bewertung</span>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 md:py-24">
        <div className="container max-w-5xl mx-auto px-4">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent/10 text-accent-foreground text-xs font-bold uppercase tracking-wide mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              So funktioniert's
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Von Reichweite zur Stammkundschaft
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              In drei einfachen Schritten zu mehr Kunden und besseren Bewertungen
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Radio,
                title: "Radio-Reichweite",
                description: "Dein Betrieb wird im Radio promoted. Hörer werden zu Neukunden.",
                step: "1",
                gradient: "from-primary to-primary/70"
              },
              {
                icon: QrCode,
                title: "QR am POS",
                description: "Kunden scannen, sammeln 2Go Taler, lösen Belohnungen ein.",
                step: "2",
                gradient: "from-accent to-accent/70"
              },
              {
                icon: Star,
                title: "Automatische Reviews",
                description: "Zufriedene Kunden werden automatisch um eine Google-Bewertung gebeten.",
                step: "3",
                gradient: "from-green-500 to-green-400"
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="relative p-6 h-full bg-card border-2 border-border/50 hover:border-primary/30 hover:shadow-xl transition-all duration-300">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center mb-5 shadow-lg`}>
                    <item.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="absolute top-5 right-5 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <span className="text-sm font-bold text-muted-foreground">{item.step}</span>
                  </div>
                  <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16 md:py-24 bg-muted/40">
        <div className="container max-w-5xl mx-auto px-4">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-secondary text-xs font-bold uppercase tracking-wide mb-4">
              <Gift className="w-3.5 h-3.5" />
              Features
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Alles, was du brauchst
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Ein komplettes System für Kundenbindung und Reichweite
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                <Card className="p-5 h-full bg-card hover:shadow-lg transition-shadow">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-bold mb-1">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Audio Credits Explainer */}
      <section id="demo" className="py-16 md:py-24">
        <div className="container max-w-5xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent/10 text-accent-foreground text-xs font-bold uppercase tracking-wide mb-4">
                <Radio className="w-3.5 h-3.5" />
                Radio-Power
              </span>
              <h2 className="text-3xl md:text-4xl font-bold mb-5">
                Audio-Credits erklärt
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                Mit Audio-Credits buchst du Radiozeit. Jedes Paket enthält monatliche Credits, 
                die du flexibel einsetzen kannst.
              </p>
              
              <div className="space-y-3">
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border">
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                    <span className="text-xl font-bold text-primary">1</span>
                  </div>
                  <div>
                    <h4 className="font-bold">Air-Drop (5–8 Sek.)</h4>
                    <p className="text-sm text-muted-foreground">Sponsor-Tag oder CTA = 1 Credit</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border">
                  <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center shrink-0">
                    <span className="text-xl font-bold text-accent-foreground">3</span>
                  </div>
                  <div>
                    <h4 className="font-bold">Radio-Spot (20 Sek.)</h4>
                    <p className="text-sm text-muted-foreground">Vollwertiger Werbespot = 3 Credits</p>
                  </div>
                </div>
              </div>
              
              <p className="text-xs text-muted-foreground mt-5">
                Aussteuerung erfolgt rotations-/inventory-basiert. Keine minutengenaue Sendeplatz-Garantie.
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="aspect-square max-w-sm mx-auto rounded-3xl bg-gradient-to-br from-secondary via-secondary/90 to-primary/80 p-10 flex items-center justify-center shadow-2xl">
                <div className="text-center text-white">
                  <img 
                    src={logoRadio2go} 
                    alt="Radio 2Go" 
                    className="h-16 w-auto mx-auto mb-6 brightness-0 invert drop-shadow-lg"
                  />
                  <p className="text-2xl font-bold">Radio 2Go</p>
                  <p className="text-white/70 text-sm">Dein Partner fürs Radio</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-16 md:py-24 overflow-hidden bg-secondary text-white">
        {/* Decorative */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
          <div className="absolute top-0 left-1/3 w-80 h-80 bg-primary rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/3 w-64 h-64 bg-accent rounded-full blur-3xl" />
        </div>
        
        <div className="container relative z-10 max-w-3xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-sm font-medium mb-6">
              <Target className="w-4 h-4" />
              Bereit durchzustarten?
            </div>
            
            <h2 className="text-3xl md:text-5xl font-bold mb-5">
              Bereit für mehr Kunden?
            </h2>
            <p className="text-xl text-white/80 mb-8 max-w-xl mx-auto">
              Starte jetzt mit 30 Tagen kostenlosem Trial. 
              Keine Verpflichtung, jederzeit kündbar.
            </p>
            
            <Button asChild size="lg" className="h-14 px-10 text-base font-bold rounded-2xl bg-accent hover:bg-accent/90 text-accent-foreground shadow-xl shadow-accent/40 transition-all hover:scale-[1.02]">
              <Link to="/go/partner/pricing">
                Pakete & Preise ansehen
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            
            <p className="text-sm text-white/50 mt-6 flex items-center justify-center gap-2">
              <Shield className="w-4 h-4" />
              30 Tage Geld-zurück Garantie
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
