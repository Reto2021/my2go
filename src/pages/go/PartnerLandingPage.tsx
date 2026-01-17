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
  Sparkles,
  Gift,
  Target,
  Clock,
  Heart,
  BarChart3,
  MessageSquare,
  Smartphone,
  BadgeCheck,
  Award,
  Repeat,
  ChevronRight,
  Play,
  Coffee,
  Store,
  Utensils,
  Dumbbell
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import logoRadio2go from "@/assets/logo-radio2go.png";
import logo2go from "@/assets/logo-2go.png";
import { PartnerFitQuiz } from "@/components/go/quiz";

// App Screenshots from sandbox
const APP_SCREENSHOTS = {
  home: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/9a0ad490-f471-4c84-87e3-a8e8fafc017e/55537522-b2fd-4d8f-8838-3c380c179fc6.lovableproject.com-1768679295332.png",
  rewards: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/bf2b7e88-8882-48fb-8ef2-337b090263eb/55537522-b2fd-4d8f-8838-3c380c179fc6.lovableproject.com-1768679296254.png",
  partners: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/74547add-2855-4511-b6c6-cc65e506b1cd/55537522-b2fd-4d8f-8838-3c380c179fc6.lovableproject.com-1768679308399.png",
  badges: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/20e70c83-e232-4556-8da2-a10de865a20d/55537522-b2fd-4d8f-8838-3c380c179fc6.lovableproject.com-1768679309045.png",
};

const INDUSTRIES = [
  { icon: Coffee, label: "Cafés" },
  { icon: Utensils, label: "Restaurants" },
  { icon: Store, label: "Retail" },
  { icon: Dumbbell, label: "Fitness" },
];

const STATS = [
  { value: "12'000+", label: "Aktive Nutzer" },
  { value: "45+", label: "Partner" },
  { value: "4.8★", label: "Ø Bewertung" },
  { value: "32%", label: "Mehr Wiederkäufe" },
];

export default function PartnerLandingPage() {
  return (
    <div className="overflow-hidden bg-background">
      {/* Hero Section */}
      <section className="relative pt-16 pb-12 md:pt-20 md:pb-20 overflow-hidden bg-gradient-to-b from-primary/10 via-primary/5 to-background">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 -left-24 w-64 h-64 bg-accent/15 rounded-full blur-3xl" />
        </div>
        
        <div className="container relative z-10 max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            {/* Left: Text Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex flex-wrap items-center gap-2 mb-6">
                <Badge variant="secondary" className="bg-secondary text-white font-semibold">
                  <img src={logoRadio2go} alt="Radio 2Go" className="h-4 w-auto mr-1.5" />
                  Partner werden
                </Badge>
                <Badge variant="outline" className="border-green-500 text-green-600 bg-green-50">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  30 Tage kostenlos
                </Badge>
              </div>
              
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-5 text-foreground leading-[1.1]">
                Ihre Gäste kommen{" "}
                <span className="text-primary">öfter zurück.</span>
              </h1>
              
              <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                My 2Go bringt Ihnen mehr Stammkunden, bessere Google-Bewertungen und 
                Radio-Präsenz – mit einem System, das automatisch läuft.
              </p>

              {/* Mini Social Proof */}
              <div className="flex flex-wrap gap-4 mb-8">
                {STATS.map((stat, i) => (
                  <div key={i} className="text-center">
                    <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                    <div className="text-xs text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>
              
              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <Button asChild size="lg" className="h-14 px-8 text-base font-bold rounded-2xl bg-accent hover:bg-accent/90 text-accent-foreground shadow-xl shadow-accent/30">
                  <Link to="/go/partner/pricing">
                    Jetzt starten – 30 Tage gratis
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-14 px-6 text-base font-semibold rounded-2xl">
                  <a href="#quiz">
                    <BarChart3 className="mr-2 w-5 h-5" />
                    Passt das zu mir?
                  </a>
                </Button>
              </div>

              {/* Industries */}
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span>Perfekt für:</span>
                {INDUSTRIES.map((ind, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-muted">
                    <ind.icon className="w-3.5 h-3.5" />
                    {ind.label}
                  </span>
                ))}
              </div>
            </motion.div>

            {/* Right: App Screenshots */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative hidden lg:block"
            >
              <div className="relative">
                {/* Main Screenshot */}
                <div className="relative z-10 rounded-3xl overflow-hidden shadow-2xl border-4 border-white/50">
                  <img 
                    src={APP_SCREENSHOTS.home} 
                    alt="My 2Go App Startseite" 
                    className="w-full h-auto"
                  />
                </div>
                {/* Secondary Screenshots */}
                <div className="absolute -right-8 top-20 w-48 rounded-2xl overflow-hidden shadow-xl border-2 border-white/50 z-20">
                  <img 
                    src={APP_SCREENSHOTS.rewards} 
                    alt="Gutscheine" 
                    className="w-full h-auto"
                  />
                </div>
                <div className="absolute -left-4 bottom-10 w-40 rounded-2xl overflow-hidden shadow-xl border-2 border-white/50">
                  <img 
                    src={APP_SCREENSHOTS.partners} 
                    alt="Partner" 
                    className="w-full h-auto"
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="py-4 bg-secondary text-white">
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
              <BadgeCheck className="w-4 h-4 text-accent" />
              <span>Geld-zurück-Garantie</span>
            </div>
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-accent" />
              <span>50% Non-Profit Rabatt</span>
            </div>
          </div>
        </div>
      </section>

      {/* Problem → Solution */}
      <section className="py-16 md:py-24">
        <div className="container max-w-5xl mx-auto px-4">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-100 text-red-700 text-xs font-bold uppercase tracking-wide mb-4">
              Das Problem
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Kennen Sie das?
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-5 mb-12">
            {[
              { emoji: "😕", problem: "Kunden kommen einmal – und nie wieder", stat: "70% der Neukunden werden nicht zu Stammkunden" },
              { emoji: "⭐", problem: "Zu wenige Google-Bewertungen", stat: "Nur 5% der zufriedenen Gäste schreiben aktiv" },
              { emoji: "📣", problem: "Marketing kostet Zeit und Geld", stat: "Ohne System verpuffen Werbebudgets" },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="p-5 h-full border-red-200 bg-red-50/50">
                  <span className="text-3xl mb-3 block">{item.emoji}</span>
                  <h3 className="font-bold text-lg mb-2">{item.problem}</h3>
                  <p className="text-sm text-muted-foreground">{item.stat}</p>
                </Card>
              </motion.div>
            ))}
          </div>

          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-100 text-green-700 text-xs font-bold uppercase tracking-wide mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              Die Lösung
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              My 2Go macht Ihre Gäste zu Fans
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              { icon: Repeat, title: "Mehr Wiederkäufe", desc: "Kunden sammeln 2Go Taler und kommen zurück, um sie einzulösen.", gradient: "from-primary to-primary/70" },
              { icon: Star, title: "Mehr 5★ Bewertungen", desc: "Automatische Review-Anfragen nach positiver Erfahrung.", gradient: "from-amber-500 to-amber-400" },
              { icon: Radio, title: "Radio-Reichweite", desc: "Ihr Betrieb wird im Radio promoted – ohne eigenes Werbebudget.", gradient: "from-secondary to-secondary/70" },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="p-6 h-full border-green-200 bg-green-50/50 hover:shadow-xl transition-all">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center mb-4 shadow-lg`}>
                    <item.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works - Visual */}
      <section className="py-16 md:py-24 bg-muted/40">
        <div className="container max-w-5xl mx-auto px-4">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent/10 text-accent-foreground text-xs font-bold uppercase tracking-wide mb-4">
              <Play className="w-3.5 h-3.5" />
              So funktioniert's
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              In 3 Schritten startklar
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 mb-10">
            {[
              { step: "1", title: "QR-Code aufstellen", desc: "Wir liefern Tischsteller, Aufkleber oder NFC-Tags. Einfach platzieren.", icon: QrCode, time: "5 Min Setup" },
              { step: "2", title: "Kunden scannen & sammeln", desc: "Gäste scannen, laden die App und sammeln 2Go Taler bei jedem Besuch.", icon: Smartphone, time: "Automatisch" },
              { step: "3", title: "Stammkunden & Reviews", desc: "Zufriedene Gäste werden gebeten, eine Bewertung zu hinterlassen.", icon: Star, time: "Automatisch" },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative"
              >
                <Card className="p-6 h-full relative overflow-hidden">
                  <div className="absolute -top-2 -right-2 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-2xl font-bold text-primary">{item.step}</span>
                  </div>
                  <item.icon className="w-10 h-10 text-primary mb-4" />
                  <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{item.desc}</p>
                  <Badge variant="outline" className="text-xs">
                    <Clock className="w-3 h-3 mr-1" />
                    {item.time}
                  </Badge>
                </Card>
                {i < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 z-10">
                    <ChevronRight className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* App Store Style Screenshots */}
      <section className="py-16 md:py-24">
        <div className="container max-w-6xl mx-auto px-4">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-secondary text-xs font-bold uppercase tracking-wide mb-4">
              <Smartphone className="w-3.5 h-3.5" />
              Die App
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Das sehen Ihre Kunden
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Eine moderne App, die Ihre Gäste gerne nutzen
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {[
              { img: APP_SCREENSHOTS.home, label: "Home mit Radio" },
              { img: APP_SCREENSHOTS.rewards, label: "Gutscheine entdecken" },
              { img: APP_SCREENSHOTS.partners, label: "Partner finden" },
              { img: APP_SCREENSHOTS.badges, label: "Auszeichnungen" },
            ].map((screen, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <div className="rounded-2xl overflow-hidden shadow-xl border-2 border-muted mb-3">
                  <img src={screen.img} alt={screen.label} className="w-full h-auto" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">{screen.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Deep Dive */}
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
              Ihre Vorteile
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Alles in einem System
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: Users, title: "Multipartner-Loyalty", desc: "Kunden sammeln & lösen netzwerkweit ein – mehr Reichweite für Sie." },
              { icon: Star, title: "Review-Booster", desc: "Automatische Bewertungsanfragen nur an zufriedene Kunden." },
              { icon: Radio, title: "Audio-Credits", desc: "Radiozeit inklusive – Sponsor-Tags und Spots ohne Extrakosten." },
              { icon: QrCode, title: "POS-Materials", desc: "QR-Tischsteller, NFC-Tags, Aufkleber – schlüsselfertig geliefert." },
              { icon: Zap, title: "Automationen", desc: "Geburtstags-Reminder, Inaktivitäts-Trigger, Win-back Kampagnen." },
              { icon: TrendingUp, title: "Dashboard", desc: "Scans, Einlösungen, Reviews – alles in Echtzeit auswertbar." },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="p-5 h-full hover:shadow-lg transition-shadow">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-bold mb-1">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.desc}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Audio Credits Explainer */}
      <section id="audio-credits" className="py-16 md:py-24">
        <div className="container max-w-5xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/10 text-secondary text-xs font-bold uppercase tracking-wide mb-4">
                <Radio className="w-3.5 h-3.5" />
                Radio-Power inklusive
              </span>
              <h2 className="text-3xl md:text-4xl font-bold mb-5">
                Audio-Credits erklärt
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                Jedes Paket enthält monatliche Audio-Credits für Radio-Promotion. 
                Die Credits werden automatisch aufgeladen und verfallen nicht sofort.
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
                Ausspielung erfolgt rotationsbasiert. Guthaben wird monatlich aufgestockt.
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Card className="p-8 bg-gradient-to-br from-secondary/5 to-secondary/10 border-secondary/20">
                <div className="text-center mb-6">
                  <img src={logoRadio2go} alt="Radio 2Go" className="h-16 w-auto mx-auto mb-4" />
                  <h3 className="text-xl font-bold">Audio-Credits pro Monat</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 rounded-lg bg-white/50">
                    <span className="font-medium">Starter</span>
                    <Badge>20 Credits</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-white/50 border-2 border-primary">
                    <span className="font-medium">Growth <span className="text-xs text-primary ml-1">Empfohlen</span></span>
                    <Badge className="bg-primary">60 Credits</Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-white/50">
                    <span className="font-medium">Radio Partner</span>
                    <Badge>140 Credits</Badge>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Partner Fit Quiz */}
      <section id="quiz">
        <PartnerFitQuiz />
      </section>

      {/* Non-Profit Callout */}
      <section className="py-12 bg-pink-50 dark:bg-pink-950/20">
        <div className="container max-w-3xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Heart className="w-10 h-10 text-pink-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-3">Non-Profit? 50% Rabatt für Sie.</h2>
            <p className="text-muted-foreground mb-4">
              Vereine, gemeinnützige Organisationen und soziale Einrichtungen erhalten 
              dauerhaft 50% Rabatt auf alle Pakete.
            </p>
            <p className="text-sm font-medium text-pink-600 dark:text-pink-400">
              Nutzen Sie den Code <span className="font-mono bg-pink-100 dark:bg-pink-900/50 px-2 py-1 rounded">NONPROFIT50</span> im Checkout.
            </p>
          </motion.div>
        </div>
      </section>

      {/* FAQ Quick */}
      <section className="py-16 md:py-24">
        <div className="container max-w-3xl mx-auto px-4">
          <motion.div 
            className="text-center mb-10"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold mb-4">Häufige Fragen</h2>
          </motion.div>

          <div className="space-y-4">
            {[
              { q: "Was kostet mich My 2Go?", a: "Ab CHF 249/Monat (netto). Alle Pakete inkl. 30 Tage kostenlosem Trial. Activation Fee ab CHF 690 einmalig." },
              { q: "Wie schnell bin ich startklar?", a: "In der Regel innerhalb von 5-7 Tagen. Sie erhalten POS-Material per Post und werden persönlich ongeboardet." },
              { q: "Was ist, wenn es nicht funktioniert?", a: "30 Tage Geld-zurück-Garantie auf die Activation Fee – wenn Sie die Bedingungen erfüllen." },
              { q: "Muss ich selbst etwas tun?", a: "Minimal. QR aufstellen, fertig. Reviews, Reminder und Kampagnen laufen automatisch." },
              { q: "Sind die Google-Bewertungen echt?", a: "Ja, 100%. Wir fragen nur zufriedene Kunden aktiv nach einer Bewertung. Keine Fake-Reviews." },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="p-5">
                  <h3 className="font-bold mb-2 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-primary" />
                    {item.q}
                  </h3>
                  <p className="text-sm text-muted-foreground">{item.a}</p>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Button asChild variant="outline" size="lg">
              <Link to="/go/partner/faq">
                Alle FAQs ansehen
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-16 md:py-24 overflow-hidden bg-secondary text-white">
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
            <img src={logo2go} alt="My 2Go" className="h-12 w-auto mx-auto mb-6 invert" />
            
            <h2 className="text-3xl md:text-4xl font-bold mb-5">
              Bereit für mehr Stammkunden?
            </h2>
            <p className="text-xl text-white/80 mb-8 max-w-xl mx-auto">
              Starten Sie heute – die ersten 30 Tage sind kostenlos. 
              Kein Risiko, jederzeit kündbar.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild size="lg" className="h-14 px-10 text-base font-bold rounded-2xl bg-accent hover:bg-accent/90 text-accent-foreground shadow-xl shadow-accent/40">
                <Link to="/go/partner/pricing">
                  Pakete & Preise ansehen
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-14 px-8 text-base font-semibold rounded-2xl border-white/30 text-white hover:bg-white/10">
                <a href="#quiz">
                  Erst den Quiz machen
                </a>
              </Button>
            </div>
            
            <div className="flex items-center justify-center gap-6 mt-8 text-sm text-white/60">
              <span className="flex items-center gap-1.5">
                <Shield className="w-4 h-4" />
                30 Tage Garantie
              </span>
              <span className="flex items-center gap-1.5">
                <Award className="w-4 h-4" />
                Keine Fake-Reviews
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer Links */}
      <section className="py-8 bg-muted/50">
        <div className="container max-w-5xl mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
            <Link to="/go/legal/impressum" className="hover:text-foreground">Impressum</Link>
            <Link to="/go/legal/datenschutz" className="hover:text-foreground">Datenschutz</Link>
            <Link to="/go/legal/agb" className="hover:text-foreground">AGB</Link>
            <Link to="/go/partner/faq" className="hover:text-foreground">FAQ</Link>
            <Link to="/go/partner/refund" className="hover:text-foreground">Geld-zurück-Garantie</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
