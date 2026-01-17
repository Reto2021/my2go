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
  Heart,
  BarChart3,
  MessageSquare,
  Smartphone,
  BadgeCheck,
  Award,
  Repeat,
  Play,
  Quote,
  Clock,
  Target,
  ChevronRight,
  Check,
  MapPin
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import logoRadio2go from "@/assets/logo-radio2go.png";
import logo2go from "@/assets/logo-2go.png";
import { PartnerFitQuiz } from "@/components/go/quiz";

// Testimonials with personas
const TESTIMONIALS = [
  {
    name: "Lena Kaufmann",
    role: "Inhaberin, Café Rosengarten",
    location: "Bern",
    avatar: "👩‍🍳",
    quote: "Früher hatte ich 12 Google-Bewertungen. Jetzt sind es über 80 – und meine Gäste kommen wirklich öfter. Das System läuft einfach.",
    metric: "+68 Reviews in 4 Monaten",
    stars: 5
  },
  {
    name: "Marco Bianchi",
    role: "Geschäftsführer, Pizzeria Napoli",
    location: "Zürich",
    avatar: "👨‍🍳",
    quote: "Meine Stammkunden fragen jetzt aktiv nach den Talern. Das Loyalty-System funktioniert, weil es einfach ist – für mich und die Gäste.",
    metric: "+32% Wiederkäufe",
    stars: 5
  },
  {
    name: "Sarah Weber",
    role: "Studioleitung, YogaFlow",
    location: "Basel",
    avatar: "🧘‍♀️",
    quote: "Die Radio-Spots waren der Gamechanger. Wir werden jetzt regelmässig erwähnt – ohne dass ich irgendwas tun musste.",
    metric: "1'200+ Radio-Kontakte",
    stars: 5
  }
];

const SOCIAL_PROOF = [
  { value: "12'400+", label: "Aktive Nutzer", icon: Users },
  { value: "47", label: "Partner", icon: MapPin },
  { value: "4.8", label: "Ø Bewertung", suffix: "★", icon: Star },
  { value: "+32%", label: "Mehr Stammkunden", icon: TrendingUp },
];

const BENEFITS = [
  { 
    icon: Repeat, 
    title: "Mehr Stammkunden", 
    desc: "Gäste sammeln Taler und kommen zurück, um sie einzulösen. Einfache Psychologie, grosse Wirkung.",
    color: "from-primary to-primary/60"
  },
  { 
    icon: Star, 
    title: "Bessere Bewertungen", 
    desc: "Automatische Review-Anfragen nur an zufriedene Kunden. Echte 5-Sterne-Bewertungen.",
    color: "from-amber-500 to-amber-400"
  },
  { 
    icon: Radio, 
    title: "Radio-Reichweite", 
    desc: "Ihr Name im Radio – ohne eigenes Werbebudget. Audio-Credits sind inklusive.",
    color: "from-secondary to-secondary/60"
  },
];

const FEATURES = [
  { icon: QrCode, title: "Schlüsselfertiges Setup", desc: "QR-Steller, NFC-Tags, Aufkleber – alles geliefert." },
  { icon: Zap, title: "Automatisierungen", desc: "Geburtstage, Win-back-Kampagnen, Reminder – läuft von allein." },
  { icon: BarChart3, title: "Echtzeit-Dashboard", desc: "Scans, Einlösungen, Reviews – alles auf einen Blick." },
  { icon: Shield, title: "DSGVO-konform", desc: "Keine Fake-Reviews, vollständig datenschutzkonform." },
  { icon: Gift, title: "Flexible Gutscheine", desc: "Rabatte, Gratis-Produkte, 2-für-1 – Sie entscheiden." },
  { icon: Users, title: "Netzwerk-Effekt", desc: "Kunden sammeln überall – mehr Reichweite für alle." },
];

const STEPS = [
  { 
    step: "1", 
    title: "Anmelden & Material erhalten", 
    desc: "Sie wählen Ihr Paket. Wir liefern die POS-Materialien innerhalb einer Woche.",
    time: "5 Min"
  },
  { 
    step: "2", 
    title: "QR-Code aufstellen", 
    desc: "Tischsteller platzieren – fertig. Kein technisches Setup nötig.",
    time: "2 Min"
  },
  { 
    step: "3", 
    title: "Zurücklehnen & profitieren", 
    desc: "Kunden scannen, sammeln Taler und werden zu Stammgästen. Automatisch.",
    time: "∞"
  },
];

const FAQ_ITEMS = [
  { 
    q: "Was kostet mich My 2Go?", 
    a: "Ab CHF 249/Monat (netto). Alle Pakete beinhalten 30 Tage kostenlosen Trial. Einmalige Aktivierungsgebühr ab CHF 690." 
  },
  { 
    q: "Wie schnell bin ich startklar?", 
    a: "In der Regel innerhalb von 5-7 Tagen. Sie erhalten POS-Material per Post und werden persönlich ongeboardet." 
  },
  { 
    q: "Was, wenn es nicht funktioniert?", 
    a: "30 Tage Geld-zurück-Garantie auf die Aktivierungsgebühr – wenn Sie die Bedingungen erfüllen." 
  },
  { 
    q: "Muss ich selbst etwas tun?", 
    a: "Minimal. QR aufstellen, fertig. Reviews, Reminder und Kampagnen laufen automatisch." 
  },
];

export default function PartnerLandingPage() {
  return (
    <div className="overflow-hidden bg-background">
      {/* ===== HERO SECTION ===== */}
      <section className="hero-section relative min-h-[90vh] flex items-center">
        {/* Clouds */}
        <div className="clouds-container">
          <div className="cloud cloud-1" />
          <div className="cloud cloud-2" />
          <div className="cloud cloud-3" />
          <div className="cloud cloud-4" />
          <div className="cloud cloud-5" />
          <div className="cloud cloud-6" />
        </div>
        
        {/* Skyline */}
        <div className="skyline-container">
          <div className="skyline-distant" />
          <div className="skyline-mid" />
          <div className="skyline-front" />
        </div>
        
        <div className="container relative z-10 max-w-5xl mx-auto px-4 pt-8 pb-48">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            {/* Badges */}
            <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
              <Badge className="bg-white/90 text-secondary font-bold shadow-lg px-4 py-2">
                <img src={logoRadio2go} alt="Radio 2Go" className="h-4 w-auto mr-2" />
                Partner werden
              </Badge>
              <Badge className="bg-accent text-accent-foreground font-bold shadow-lg px-4 py-2">
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                30 Tage kostenlos testen
              </Badge>
            </div>
            
            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-6 text-secondary leading-[1.1]">
              Ihre Gäste kommen{" "}
              <span className="relative">
                <span className="relative z-10 text-accent">öfter zurück.</span>
                <span className="absolute inset-x-0 bottom-1 h-3 bg-accent/20 -z-0" />
              </span>
            </h1>
            
            {/* Subheadline */}
            <p className="text-lg sm:text-xl text-secondary/80 mb-8 max-w-2xl mx-auto leading-relaxed">
              Mehr Stammkunden. Bessere Google-Bewertungen. Radio-Präsenz. <br className="hidden sm:block" />
              Ein System, das automatisch läuft – für Cafés, Restaurants & lokale Betriebe.
            </p>
            
            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
              <Button 
                asChild 
                size="lg" 
                className="h-14 px-10 text-base font-bold rounded-2xl bg-accent hover:bg-accent/90 text-accent-foreground shadow-xl shadow-accent/40 hover:shadow-2xl hover:shadow-accent/50 transition-all hover:scale-105"
              >
                <Link to="/go/partner/pricing">
                  Jetzt starten – 30 Tage gratis
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button 
                asChild 
                variant="outline" 
                size="lg" 
                className="h-14 px-8 text-base font-semibold rounded-2xl bg-white/90 border-white/50 text-secondary hover:bg-white hover:scale-105 transition-all shadow-lg"
              >
                <a href="#quiz">
                  <Target className="mr-2 w-5 h-5" />
                  Passt das zu mir?
                </a>
              </Button>
            </div>
            
            {/* Social Proof Strip */}
            <div className="inline-flex flex-wrap items-center justify-center gap-6 sm:gap-10 px-6 py-4 rounded-2xl bg-white/80 backdrop-blur-sm shadow-lg">
              {SOCIAL_PROOF.map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-xl sm:text-2xl font-bold text-secondary">
                    {stat.value}{stat.suffix}
                  </div>
                  <div className="text-xs text-secondary/60">{stat.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== TRUST BAR ===== */}
      <section className="py-4 bg-secondary text-white -mt-1">
        <div className="container max-w-5xl mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10 text-sm font-medium">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-accent" />
              <span>Keine Fake-Reviews</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-accent" />
              <span>DSGVO-konform</span>
            </div>
            <div className="flex items-center gap-2">
              <BadgeCheck className="w-4 h-4 text-accent" />
              <span>30 Tage Geld-zurück</span>
            </div>
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-accent" />
              <span>50% Non-Profit Rabatt</span>
            </div>
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIAL SPOTLIGHT (Lena) ===== */}
      <section className="py-20 md:py-28 bg-gradient-to-b from-background to-muted/30">
        <div className="container max-w-5xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative"
          >
            {/* Big Quote Card */}
            <Card className="relative overflow-hidden p-8 sm:p-12 bg-white border-0 shadow-2xl rounded-3xl">
              <Quote className="absolute top-6 left-6 w-16 h-16 text-primary/10" />
              
              <div className="relative z-10 grid md:grid-cols-[1fr,auto] gap-8 items-center">
                <div>
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  
                  <blockquote className="text-xl sm:text-2xl font-medium text-foreground mb-6 leading-relaxed">
                    "{TESTIMONIALS[0].quote}"
                  </blockquote>
                  
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-3xl">
                        {TESTIMONIALS[0].avatar}
                      </div>
                      <div>
                        <div className="font-bold text-foreground">{TESTIMONIALS[0].name}</div>
                        <div className="text-sm text-muted-foreground">{TESTIMONIALS[0].role}</div>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-700 font-bold px-4 py-2">
                      <TrendingUp className="w-4 h-4 mr-1.5" />
                      {TESTIMONIALS[0].metric}
                    </Badge>
                  </div>
                </div>
                
                {/* Accent visual */}
                <div className="hidden md:block">
                  <div className="w-48 h-48 rounded-3xl bg-gradient-to-br from-primary/20 via-primary/10 to-accent/20 flex items-center justify-center">
                    <div className="w-32 h-32 rounded-2xl bg-white shadow-xl flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-4xl font-bold text-primary">+68</div>
                        <div className="text-xs text-muted-foreground">neue Reviews</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* ===== PROBLEM → SOLUTION ===== */}
      <section className="py-20 md:py-28">
        <div className="container max-w-5xl mx-auto px-4">
          {/* Problem */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-red-100 text-red-700 text-xs font-bold uppercase tracking-wide mb-4">
              Das kennen Sie
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Stammkunden sind Gold wert – aber schwer zu gewinnen
            </h2>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-5 mb-16">
            {[
              { emoji: "😕", problem: "Gäste kommen einmal – und nie wieder", stat: "70% der Neukunden werden nicht zu Stammkunden" },
              { emoji: "⭐", problem: "Zu wenige Google-Bewertungen", stat: "Nur 5% der zufriedenen Gäste schreiben aktiv" },
              { emoji: "📣", problem: "Marketing ist teuer und zeitaufwändig", stat: "Ohne System verpuffen Werbebudgets" },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="p-6 h-full border-red-200/50 bg-gradient-to-br from-red-50/80 to-red-50/30 hover:shadow-lg transition-shadow">
                  <span className="text-4xl mb-4 block">{item.emoji}</span>
                  <h3 className="font-bold text-lg mb-2 text-foreground">{item.problem}</h3>
                  <p className="text-sm text-muted-foreground">{item.stat}</p>
                </Card>
              </motion.div>
            ))}
          </div>
          
          {/* Arrow */}
          <div className="flex justify-center mb-12">
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-xl"
            >
              <ArrowRight className="w-8 h-8 text-white rotate-90" />
            </motion.div>
          </div>
          
          {/* Solution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-green-100 text-green-700 text-xs font-bold uppercase tracking-wide mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              Die Lösung
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              My 2Go macht Ihre Gäste zu treuen Fans
            </h2>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {BENEFITS.map((benefit, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="p-8 h-full border-green-200/50 bg-gradient-to-br from-green-50/80 to-green-50/30 hover:shadow-xl hover:-translate-y-1 transition-all">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${benefit.color} flex items-center justify-center mb-5 shadow-lg`}>
                    <benefit.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="font-bold text-xl mb-3 text-foreground">{benefit.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{benefit.desc}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="py-20 md:py-28 bg-muted/40">
        <div className="container max-w-5xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary/10 text-secondary text-xs font-bold uppercase tracking-wide mb-4">
              <Play className="w-3.5 h-3.5" />
              So funktioniert's
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              In 3 Schritten zu mehr Stammkunden
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Kein kompliziertes Setup. Kein technisches Know-how nötig.
            </p>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-6 relative">
            {/* Connection line */}
            <div className="hidden md:block absolute top-1/2 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-primary/30 via-accent/30 to-primary/30 -translate-y-1/2" />
            
            {STEPS.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="relative"
              >
                <Card className="p-8 h-full text-center bg-white border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <span className="text-2xl font-bold text-white">{item.step}</span>
                  </div>
                  <h3 className="font-bold text-lg mb-3 text-foreground">{item.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{item.desc}</p>
                  <Badge variant="outline" className="text-xs">
                    <Clock className="w-3 h-3 mr-1" />
                    {item.time}
                  </Badge>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== MORE TESTIMONIALS ===== */}
      <section className="py-20 md:py-28">
        <div className="container max-w-5xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-amber-100 text-amber-700 text-xs font-bold uppercase tracking-wide mb-4">
              <Star className="w-3.5 h-3.5" />
              Das sagen unsere Partner
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Echte Resultate, echte Betriebe
            </h2>
          </motion.div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((testimonial, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="p-6 h-full bg-white border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(testimonial.stars)].map((_, j) => (
                      <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  
                  <blockquote className="text-foreground mb-6 leading-relaxed">
                    "{testimonial.quote}"
                  </blockquote>
                  
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-2xl">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-foreground">{testimonial.name}</div>
                      <div className="text-xs text-muted-foreground">{testimonial.role}</div>
                    </div>
                  </div>
                  
                  <Badge className="bg-green-100 text-green-700 text-xs font-semibold">
                    {testimonial.metric}
                  </Badge>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FEATURES GRID ===== */}
      <section className="py-20 md:py-28 bg-muted/40">
        <div className="container max-w-5xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-secondary/10 text-secondary text-xs font-bold uppercase tracking-wide mb-4">
              <Gift className="w-3.5 h-3.5" />
              Alles inklusive
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Ein System. Alles drin.
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Kein Zusammensuchen verschiedener Tools – alles aus einer Hand.
            </p>
          </motion.div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="p-6 h-full bg-white border-0 shadow-md hover:shadow-xl transition-all hover:-translate-y-1">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-bold text-lg mb-2 text-foreground">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.desc}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== AUDIO CREDITS ===== */}
      <section id="audio-credits" className="py-20 md:py-28">
        <div className="container max-w-5xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-secondary/10 text-secondary text-xs font-bold uppercase tracking-wide mb-4">
                <Radio className="w-3.5 h-3.5" />
                Radio-Power inklusive
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                Ihr Name im Radio – <span className="text-accent">ohne Extrakosten</span>
              </h2>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Jedes Paket enthält monatliche Audio-Credits. Sie werden auf Radio 2Go erwähnt – 
                automatisch, ohne Aufwand, ohne zusätzliche Werbekosten.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-white shadow-md">
                  <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                    <span className="text-2xl font-bold text-primary">1</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground">Air-Drop (5–8 Sek.)</h4>
                    <p className="text-sm text-muted-foreground">Sponsor-Tag mit Ihrem Namen = 1 Credit</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-white shadow-md">
                  <div className="w-14 h-14 rounded-xl bg-accent/30 flex items-center justify-center shrink-0">
                    <span className="text-2xl font-bold text-accent-foreground">3</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground">Radio-Spot (20 Sek.)</h4>
                    <p className="text-sm text-muted-foreground">Vollwertiger Werbespot = 3 Credits</p>
                  </div>
                </div>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Card className="p-8 bg-gradient-to-br from-secondary/5 via-primary/5 to-accent/10 border-0 shadow-xl rounded-3xl">
                <div className="text-center mb-8">
                  <img src={logoRadio2go} alt="Radio 2Go" className="h-14 w-auto mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-foreground">Audio-Credits pro Monat</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 rounded-xl bg-white shadow-sm">
                    <span className="font-semibold text-foreground">Starter</span>
                    <Badge className="bg-primary/10 text-primary">20 Credits</Badge>
                  </div>
                  <div className="flex justify-between items-center p-4 rounded-xl bg-white shadow-md ring-2 ring-accent">
                    <div>
                      <span className="font-semibold text-foreground">Growth</span>
                      <Badge className="ml-2 bg-accent text-accent-foreground text-xs">Empfohlen</Badge>
                    </div>
                    <Badge className="bg-accent text-accent-foreground font-bold">60 Credits</Badge>
                  </div>
                  <div className="flex justify-between items-center p-4 rounded-xl bg-white shadow-sm">
                    <span className="font-semibold text-foreground">Radio Partner</span>
                    <Badge className="bg-secondary/10 text-secondary">140 Credits</Badge>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ===== PARTNER FIT QUIZ ===== */}
      <section id="quiz" className="bg-muted/40">
        <PartnerFitQuiz />
      </section>

      {/* ===== NON-PROFIT ===== */}
      <section className="py-16 bg-gradient-to-br from-pink-50 via-pink-50/50 to-background">
        <div className="container max-w-3xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="w-16 h-16 rounded-full bg-pink-100 flex items-center justify-center mx-auto mb-6">
              <Heart className="w-8 h-8 text-pink-500" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
              Non-Profit? 50% Rabatt für Sie.
            </h2>
            <p className="text-lg text-muted-foreground mb-6 max-w-xl mx-auto">
              Vereine, gemeinnützige Organisationen und soziale Einrichtungen erhalten 
              dauerhaft 50% Rabatt auf alle Pakete.
            </p>
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-pink-100 text-pink-700 font-medium">
              <span>Code:</span>
              <code className="font-mono font-bold bg-white px-3 py-1 rounded-lg">NONPROFIT50</code>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section className="py-20 md:py-28">
        <div className="container max-w-3xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Häufige Fragen
            </h2>
          </motion.div>
          
          <div className="space-y-4">
            {FAQ_ITEMS.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Card className="p-6 bg-white border-0 shadow-md">
                  <h3 className="font-bold text-foreground mb-2 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-primary shrink-0" />
                    {item.q}
                  </h3>
                  <p className="text-muted-foreground pl-7">{item.a}</p>
                </Card>
              </motion.div>
            ))}
          </div>
          
          <div className="text-center mt-10">
            <Button asChild variant="outline" size="lg" className="rounded-xl">
              <Link to="/go/partner/faq">
                Alle FAQs ansehen
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="relative py-20 md:py-28 overflow-hidden bg-secondary text-white">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 left-1/4 w-96 h-96 bg-primary/30 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-accent/20 rounded-full blur-[80px]" />
        </div>
        
        <div className="container relative z-10 max-w-3xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <img src={logo2go} alt="My 2Go" className="h-14 w-auto mx-auto mb-8 invert" />
            
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              Bereit für mehr Stammkunden?
            </h2>
            <p className="text-xl text-white/80 mb-10 max-w-xl mx-auto leading-relaxed">
              Starten Sie heute – die ersten 30 Tage sind kostenlos. 
              Kein Risiko, jederzeit kündbar.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
              <Button 
                asChild 
                size="lg" 
                className="h-16 px-12 text-lg font-bold rounded-2xl bg-accent hover:bg-accent/90 text-accent-foreground shadow-2xl shadow-accent/50 hover:scale-105 transition-all"
              >
                <Link to="/go/partner/pricing">
                  Pakete & Preise ansehen
                  <ArrowRight className="ml-2 w-6 h-6" />
                </Link>
              </Button>
              <Button 
                asChild 
                variant="outline" 
                size="lg" 
                className="h-16 px-10 text-lg font-semibold rounded-2xl border-white/30 text-white hover:bg-white/10 transition-all"
              >
                <a href="#quiz">
                  Erst den Quiz machen
                </a>
              </Button>
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-8 text-white/60">
              <span className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                30 Tage Garantie
              </span>
              <span className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                Keine Fake-Reviews
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                DSGVO-konform
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <section className="py-8 bg-muted/50">
        <div className="container max-w-5xl mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
            <Link to="/go/legal/impressum" className="hover:text-foreground transition-colors">Impressum</Link>
            <Link to="/go/legal/datenschutz" className="hover:text-foreground transition-colors">Datenschutz</Link>
            <Link to="/go/legal/agb" className="hover:text-foreground transition-colors">AGB</Link>
            <Link to="/go/partner/faq" className="hover:text-foreground transition-colors">FAQ</Link>
            <Link to="/go/partner/refund" className="hover:text-foreground transition-colors">Geld-zurück-Garantie</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
