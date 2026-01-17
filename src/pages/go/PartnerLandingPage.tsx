import { useState, useEffect, useRef } from "react";
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

// Testimonials with realistic personas across industries
const TESTIMONIALS = [
  {
    name: "Lena Kaufmann",
    role: "Inhaberin, Café Rosengarten",
    location: "Bern",
    photo: "https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=200&h=200&fit=crop&crop=face",
    quote: "Früher hatte ich 12 Google-Bewertungen. Jetzt sind es über 80 – und meine Kunden kommen wirklich öfter.",
    metric: "+68 Reviews",
  },
  {
    name: "Thomas Müller",
    role: "Leiter, EnergyFit Studio",
    location: "Zürich",
    photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face",
    quote: "Das Loyalty-System funktioniert, weil es einfach ist – für mich und meine Mitglieder. Die Kündigungsrate ist messbar gesunken.",
    metric: "-24% Kündigungen",
  },
  {
    name: "Sandra Brunner",
    role: "Geschäftsführerin, Tankstelle Brunner",
    location: "Luzern",
    photo: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&h=200&fit=crop&crop=face",
    quote: "Die Radio-Spots waren der Gamechanger. Wir werden regelmässig erwähnt – ganz ohne Werbebudget.",
    metric: "1'200+ Kontakte",
  }
];

const SOCIAL_PROOF = [
  { value: "12'400+", label: "Aktive Nutzer" },
  { value: "47", label: "Partner schweizweit" },
  { value: "4.8", label: "Ø Bewertung", suffix: "★" },
];

const BENEFITS = [
  { 
    icon: Repeat, 
    title: "Mehr Stammkunden", 
    desc: "Kunden sammeln Taler und kommen zurück. Einfache Psychologie, grosse Wirkung."
  },
  { 
    icon: Star, 
    title: "Bessere Bewertungen", 
    desc: "Automatische Review-Anfragen nach positiven Erlebnissen. Echte 5-Sterne-Bewertungen."
  },
  { 
    icon: Radio, 
    title: "Radio-Reichweite", 
    desc: "Ihr Name im Radio – ohne eigenes Werbebudget. Audio-Credits sind inklusive."
  },
];

const FEATURES = [
  { icon: QrCode, title: "Schlüsselfertiges Setup", desc: "QR-Steller, NFC-Tags, Aufkleber – alles geliefert." },
  { icon: Zap, title: "Automatisierungen", desc: "Geburtstage, Win-back, Reminder – läuft von allein." },
  { icon: BarChart3, title: "Live-Dashboard", desc: "Scans, Einlösungen, Reviews auf einen Blick." },
  { icon: Shield, title: "DSGVO-konform", desc: "Keine Fake-Reviews, vollständig datenschutzkonform." },
  { icon: Gift, title: "Flexible Prämien", desc: "Rabatte, Gratis-Produkte, 2-für-1 – Sie entscheiden." },
  { icon: Users, title: "Netzwerk-Effekt", desc: "Kunden sammeln überall – mehr Reichweite für alle." },
];

const STEPS = [
  { 
    step: "1", 
    title: "Anmelden", 
    desc: "Paket wählen, POS-Material erhalten.",
    time: "5 Min"
  },
  { 
    step: "2", 
    title: "Aufstellen", 
    desc: "QR-Code platzieren – fertig.",
    time: "2 Min"
  },
  { 
    step: "3", 
    title: "Profitieren", 
    desc: "Kunden scannen, sammeln, kommen wieder.",
    time: "∞"
  },
];

const FAQ_ITEMS = [
  { 
    q: "Was kostet My 2Go?", 
    a: "Ab CHF 249/Monat. Alle Pakete beinhalten 30 Tage kostenlosen Trial." 
  },
  { 
    q: "Wie schnell bin ich startklar?", 
    a: "In 5-7 Tagen. POS-Material per Post, persönliches Onboarding inklusive." 
  },
  { 
    q: "Was, wenn es nicht funktioniert?", 
    a: "30 Tage Geld-zurück-Garantie auf die Aktivierungsgebühr." 
  },
];

// Testimonials Section Component with Auto-Slider
function TestimonialsSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  
  // Auto-slide every 4 seconds on mobile
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Scroll to active card when index changes
  useEffect(() => {
    if (carouselRef.current) {
      const cardWidth = carouselRef.current.scrollWidth / TESTIMONIALS.length;
      carouselRef.current.scrollTo({
        left: cardWidth * activeIndex,
        behavior: 'smooth'
      });
    }
  }, [activeIndex]);

  return (
    <section className="py-16 md:py-24">
      <div className="container max-w-5xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10 md:mb-14"
        >
          <h2 className="text-2xl md:text-4xl font-bold text-foreground">
            Das sagen unsere Partner
          </h2>
        </motion.div>
        
        {/* Mobile: Auto-sliding carousel */}
        <div className="md:hidden">
          <div 
            ref={carouselRef}
            className="-mx-4 px-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory"
            onScroll={(e) => {
              const container = e.currentTarget;
              const cardWidth = container.scrollWidth / TESTIMONIALS.length;
              const newIndex = Math.round(container.scrollLeft / cardWidth);
              if (newIndex !== activeIndex) {
                setActiveIndex(newIndex);
              }
            }}
          >
            <div className="flex gap-4 pb-4" style={{ width: 'max-content' }}>
              {TESTIMONIALS.map((testimonial, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="w-[85vw] max-w-[320px] flex-shrink-0 snap-center"
                >
                  <Card className="p-5 h-full bg-white border-0 shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, j) => (
                          <Star key={j} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                      <Badge className="bg-green-100 text-green-700 font-semibold text-xs">
                        {testimonial.metric}
                      </Badge>
                    </div>
                    
                    <blockquote className="text-sm text-foreground mb-5 leading-relaxed">
                      "{testimonial.quote}"
                    </blockquote>
                    
                    <div className="flex items-center gap-3 pt-4 border-t">
                      <img 
                        src={testimonial.photo} 
                        alt={testimonial.name}
                        className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="font-semibold text-sm text-foreground truncate">{testimonial.name}</div>
                        <div className="text-xs text-muted-foreground truncate">{testimonial.role}</div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
          {/* Dot indicators */}
          <div className="flex justify-center gap-2 mt-4">
            {TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveIndex(i)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  i === activeIndex 
                    ? 'w-6 bg-primary' 
                    : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                }`}
                aria-label={`Go to testimonial ${i + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Desktop: Grid layout */}
        <div className="hidden md:grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((testimonial, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="p-6 h-full bg-white border-0 shadow-lg">
                <div className="flex items-center gap-1 mb-5">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                
                <blockquote className="text-foreground mb-6 leading-relaxed">
                  "{testimonial.quote}"
                </blockquote>
                
                <div className="flex items-center gap-3">
                  <img 
                    src={testimonial.photo} 
                    alt={testimonial.name}
                    className="w-11 h-11 rounded-full object-cover"
                  />
                  <div>
                    <div className="font-bold text-foreground">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                  </div>
                </div>
                
                <div className="mt-5 pt-5 border-t">
                  <Badge className="bg-green-100 text-green-700 font-semibold">
                    {testimonial.metric}
                  </Badge>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

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
              Ihre Kunden kommen{" "}
              <span className="relative">
                <span className="relative z-10 text-accent">öfter zurück.</span>
                <span className="absolute inset-x-0 bottom-1 h-3 bg-accent/20 -z-0" />
              </span>
            </h1>
            
            {/* Subheadline */}
            <p className="text-lg sm:text-xl text-secondary/80 mb-8 max-w-2xl mx-auto leading-relaxed">
              Mehr Stammkunden. Bessere Google-Bewertungen. Radio-Präsenz. <br className="hidden sm:block" />
              Für Gastronomie, Retail, Studios, Tankstellen & lokale Betriebe.
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

      {/* ===== BENEFITS SECTION ===== */}
      <section className="py-24 md:py-32">
        <div className="container max-w-5xl mx-auto px-4">
          {/* Problem */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Stammkunden sind Gold wert
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Aber: 70% der Neukunden kommen nie wieder. Nur 5% hinterlassen aktiv eine Bewertung.
            </p>
          </motion.div>
          
          {/* Solution */}
          <div className="grid md:grid-cols-3 gap-8">
            {BENEFITS.map((benefit, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="p-8 h-full border-0 bg-white shadow-lg hover:shadow-xl transition-all">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mb-6">
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

      {/* ===== TESTIMONIALS ===== */}
      <TestimonialsSection />

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
