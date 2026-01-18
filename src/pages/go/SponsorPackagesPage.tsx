import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Star, Crown, Award, Medal, Radio, Gift, Calendar, Users, Building2, ArrowRight, Send, Quote, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const ENGAGEMENT_AREAS = [
  {
    id: 'reward',
    name: 'Reward-Sponsor',
    icon: Gift,
    description: 'Sponsor für bestimmte Gutscheine/Rewards',
    color: 'bg-pink-500',
  },
  {
    id: 'radio',
    name: 'Radio-Sponsor',
    icon: Radio,
    description: 'Sponsor für Radio-Sendungen und Audio-Inhalte',
    color: 'bg-purple-500',
  },
  {
    id: 'event',
    name: 'Event-Sponsor',
    icon: Calendar,
    description: 'Sponsor für Live-Events und Aktionen',
    color: 'bg-blue-500',
  },
  {
    id: 'partner',
    name: 'Partner-Sponsor',
    icon: Building2,
    description: 'Unterstützung lokaler Partner-Betriebe',
    color: 'bg-green-500',
  },
  {
    id: 'community',
    name: 'Community-Sponsor',
    icon: Users,
    description: 'Generelle Unterstützung der 2Go Community',
    color: 'bg-orange-500',
  },
];

const SPONSOR_LEVELS = [
  {
    id: 'bronze',
    name: 'Bronze',
    icon: Medal,
    color: 'from-amber-600 to-amber-800',
    textColor: 'text-amber-700 dark:text-amber-400',
    borderColor: 'border-amber-300 dark:border-amber-700',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    price: 'CHF 500',
    period: '/Monat',
    features: [
      'Logo auf Sponsorenseite',
      'Erwähnung in Newsletter',
      'Basis-Sichtbarkeit',
      'Monatlicher Report',
    ],
    notIncluded: [
      'Logo auf Homepage',
      'Exklusive Events',
      'Premium-Platzierung',
      'Individuelles Branding',
    ],
  },
  {
    id: 'silver',
    name: 'Silber',
    icon: Award,
    color: 'from-gray-400 to-gray-600',
    textColor: 'text-gray-600 dark:text-gray-300',
    borderColor: 'border-gray-300 dark:border-gray-600',
    bgColor: 'bg-gray-50 dark:bg-gray-900/30',
    price: 'CHF 1\'000',
    period: '/Monat',
    features: [
      'Alles aus Bronze',
      'Logo auf Sponsorenseite (grösser)',
      'Social Media Erwähnung',
      'Prioritäts-Support',
      'Vierteljährliche Analyse',
    ],
    notIncluded: [
      'Logo auf Homepage',
      'Exklusive Events',
      'Premium-Platzierung',
    ],
  },
  {
    id: 'gold',
    name: 'Gold',
    icon: Star,
    color: 'from-yellow-400 to-amber-500',
    textColor: 'text-yellow-600 dark:text-yellow-400',
    borderColor: 'border-yellow-300 dark:border-yellow-600',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950/30',
    price: 'CHF 2\'500',
    period: '/Monat',
    popular: true,
    features: [
      'Alles aus Silber',
      'Premium-Platzierung auf Sponsorenseite',
      'Logo in App-Footer',
      'Einladung zu Partner-Events',
      'Dedizierter Account Manager',
      'Monatliche Performance-Calls',
    ],
    notIncluded: [
      'Logo auf Homepage',
    ],
  },
  {
    id: 'platinum',
    name: 'Platinum',
    icon: Crown,
    color: 'from-indigo-400 to-purple-600',
    textColor: 'text-indigo-600 dark:text-indigo-400',
    borderColor: 'border-indigo-300 dark:border-indigo-600',
    bgColor: 'bg-indigo-50 dark:bg-indigo-950/30',
    price: 'CHF 5\'000',
    period: '/Monat',
    features: [
      'Alles aus Gold',
      'Logo auf Homepage (Featured)',
      'Exklusive Top-Platzierung',
      'Co-Branding Möglichkeiten',
      'VIP-Zugang zu allen Events',
      'Exklusive Sponsoring-Aktionen',
      'Persönlicher Strategie-Workshop',
      'Priorität bei neuen Features',
    ],
    notIncluded: [],
  },
];

// Realistische Sponsor-Testimonials
const TESTIMONIALS = [
  {
    name: 'Stefan Müller',
    role: 'Marketing-Leiter',
    company: 'Bäckerei Müller AG',
    level: 'Gold',
    area: 'Partner',
    quote: 'Seit wir Gold Partner-Sponsor sind, haben wir 35% mehr Neukunden in unserer Bäckerei. Die 2Go Community ist extrem engagiert und die Zusammenarbeit ist unkompliziert.',
    avatar: '👨‍🍳',
  },
  {
    name: 'Claudia Weber',
    role: 'Geschäftsführerin',
    company: 'Autohaus Weber',
    level: 'Platinum',
    area: 'Radio',
    quote: 'Als Platinum Radio-Sponsor erreichen wir täglich tausende Hörer. Die Audio-Spots haben unsere Markenbekanntheit in der Region massiv gesteigert. Absolut empfehlenswert!',
    avatar: '👩‍💼',
  },
  {
    name: 'Marco Bernasconi',
    role: 'Inhaber',
    company: 'Ristorante Bella Vista',
    level: 'Silber',
    area: 'Reward',
    quote: 'Mit dem Reward-Sponsoring konnten wir unsere Stammkundenbindung deutlich verbessern. Die Gutschein-Aktionen über 2Go funktionieren super und bringen echten Mehrwert.',
    avatar: '👨‍🍳',
  },
];

export default function SponsorPackagesPage() {
  const [formData, setFormData] = useState({
    company: '',
    name: '',
    email: '',
    phone: '',
    level: '',
    area: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.company || !formData.name || !formData.email) {
      toast.error('Bitte füllen Sie die Pflichtfelder aus.');
      return;
    }

    setIsSubmitting(true);
    
    // Simulate form submission
    try {
      // In a real scenario, you would send this to an API endpoint
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Vielen Dank für Ihre Anfrage! Wir melden uns innerhalb von 48 Stunden bei Ihnen.');
      setFormData({
        company: '',
        name: '',
        email: '',
        phone: '',
        level: '',
        area: '',
        message: '',
      });
    } catch (error) {
      toast.error('Es ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-16 md:py-24 bg-gradient-to-br from-primary/10 via-accent/5 to-background overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="container relative">
          <div className="max-w-3xl mx-auto text-center">
            <Badge variant="secondary" className="mb-4">
              Sponsoring-Pakete
            </Badge>
            <h1 className="text-4xl md:text-5xl font-extrabold text-secondary dark:text-foreground mb-4">
              Werde Teil der 2Go Community
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Unterstütze lokale Betriebe und erreiche eine engagierte Community. 
              Wähle das passende Sponsoring-Paket für dein Unternehmen.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button size="lg" asChild>
                <a href="#contact">
                  Jetzt anfragen
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/sponsoren">
                  Aktuelle Sponsoren
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Engagement Areas */}
      <section className="py-12 container">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-secondary dark:text-foreground mb-3">
            Engagement-Bereiche
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Wähle den Bereich, der am besten zu deinem Unternehmen passt
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {ENGAGEMENT_AREAS.map((area) => (
            <Card key={area.id} className="text-center hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className={`h-12 w-12 rounded-xl ${area.color} flex items-center justify-center mx-auto mb-3`}>
                  <area.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-secondary dark:text-foreground mb-1">
                  {area.name}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {area.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Pricing Packages */}
      <section id="packages" className="py-12 bg-muted/30">
        <div className="container">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-secondary dark:text-foreground mb-3">
              Sponsoring-Level
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Jedes Level bietet unterschiedliche Vorteile und Sichtbarkeit
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {SPONSOR_LEVELS.map((level) => (
              <Card 
                key={level.id} 
                className={`relative overflow-hidden ${level.bgColor} ${level.borderColor} border-2 ${level.popular ? 'ring-2 ring-primary ring-offset-2' : ''}`}
              >
                {level.popular && (
                  <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-bl-lg">
                    Beliebt
                  </div>
                )}
                
                <CardHeader className="text-center pb-2">
                  <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${level.color} flex items-center justify-center mx-auto mb-3 shadow-lg`}>
                    <level.icon className="h-7 w-7 text-white" />
                  </div>
                  <CardTitle className={`text-xl ${level.textColor}`}>
                    {level.name}
                  </CardTitle>
                  <div className="mt-2">
                    <span className="text-3xl font-extrabold text-secondary dark:text-foreground">
                      {level.price}
                    </span>
                    <span className="text-muted-foreground text-sm">
                      {level.period}
                    </span>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <ul className="space-y-2">
                    {level.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-secondary dark:text-foreground">{feature}</span>
                      </li>
                    ))}
                    {level.notIncluded.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground line-through">
                        <span className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    className="w-full mt-6" 
                    variant={level.popular ? 'default' : 'outline'}
                    asChild
                  >
                    <a href="#contact">
                      Anfragen
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-12 container">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-secondary dark:text-foreground mb-3">
            Das sagen unsere Sponsoren
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Erfahre, wie andere Unternehmen von unserem Sponsoring profitieren
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {TESTIMONIALS.map((testimonial, idx) => (
            <Card key={idx} className="relative overflow-hidden hover:shadow-lg transition-all">
              <CardContent className="pt-8 pb-6">
                <Quote className="absolute top-4 right-4 h-8 w-8 text-primary/20" />
                
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-2xl">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-secondary dark:text-foreground">
                      {testimonial.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {testimonial.role}, {testimonial.company}
                    </div>
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground mb-4 italic">
                  "{testimonial.quote}"
                </p>
                
                <Badge variant="outline" className="text-xs">
                  {testimonial.level} {testimonial.area}-Sponsor
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Combination Examples */}
      <section className="py-12 bg-muted/30">
        <div className="container">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-secondary dark:text-foreground mb-3">
              Beispiel-Kombinationen
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Kombiniere Level und Engagement-Bereich für massgeschneidertes Sponsoring
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {[
              { level: 'Platinum', area: 'Radio', desc: 'Höchste Sichtbarkeit bei allen Radio-Inhalten', icon: Radio },
              { level: 'Gold', area: 'Event', desc: 'Premium-Präsenz bei Live-Events', icon: Calendar },
              { level: 'Gold', area: 'Partner', desc: 'Unterstützung lokaler Partner mit Branding', icon: Building2 },
              { level: 'Silber', area: 'Community', desc: 'Breite Sichtbarkeit in der Community', icon: Users },
              { level: 'Bronze', area: 'Reward', desc: 'Einstieg mit Reward-Sponsoring', icon: Gift },
              { level: 'Platinum', area: 'Partner', desc: 'Maximale Partner-Unterstützung', icon: Crown },
            ].map((combo, idx) => (
              <Card key={idx} className="hover:shadow-md transition-shadow">
                <CardContent className="flex items-center gap-4 pt-6">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center flex-shrink-0">
                    <combo.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold text-secondary dark:text-foreground">
                      {combo.level} {combo.area}-Sponsor
                    </div>
                    <p className="text-xs text-muted-foreground">{combo.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section id="contact" className="py-16 container">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-secondary dark:text-foreground mb-3">
              Sponsoring-Anfrage
            </h2>
            <p className="text-muted-foreground">
              Fülle das Formular aus und wir melden uns innerhalb von 48 Stunden bei dir.
            </p>
          </div>

          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company">Unternehmen *</Label>
                    <Input
                      id="company"
                      placeholder="Firmenname AG"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Ansprechperson *</Label>
                    <Input
                      id="name"
                      placeholder="Vor- und Nachname"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">E-Mail *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="email@beispiel.ch"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefon</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+41 79 123 45 67"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="level">Gewünschtes Level</Label>
                    <Select
                      value={formData.level}
                      onValueChange={(value) => setFormData({ ...formData, level: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Level wählen..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bronze">Bronze - CHF 500/Monat</SelectItem>
                        <SelectItem value="silver">Silber - CHF 1'000/Monat</SelectItem>
                        <SelectItem value="gold">Gold - CHF 2'500/Monat</SelectItem>
                        <SelectItem value="platinum">Platinum - CHF 5'000/Monat</SelectItem>
                        <SelectItem value="custom">Individuelles Paket</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="area">Engagement-Bereich</Label>
                    <Select
                      value={formData.area}
                      onValueChange={(value) => setFormData({ ...formData, area: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Bereich wählen..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="reward">🎁 Reward-Sponsor</SelectItem>
                        <SelectItem value="radio">📻 Radio-Sponsor</SelectItem>
                        <SelectItem value="event">🎉 Event-Sponsor</SelectItem>
                        <SelectItem value="partner">🤝 Partner-Sponsor</SelectItem>
                        <SelectItem value="community">💚 Community-Sponsor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Nachricht</Label>
                  <Textarea
                    id="message"
                    placeholder="Erzähl uns mehr über dein Unternehmen und deine Ziele..."
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  />
                </div>

                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Wird gesendet...
                    </>
                  ) : (
                    <>
                      Anfrage senden
                      <Send className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  Mit dem Absenden stimmst du unserer{' '}
                  <Link to="/go/legal/datenschutz" className="underline hover:text-foreground">
                    Datenschutzerklärung
                  </Link>{' '}
                  zu.
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-16 bg-gradient-to-br from-primary to-accent">
        <div className="container text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-primary-foreground mb-4">
            Noch Fragen?
          </h2>
          <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
            Unser Team steht dir gerne für ein unverbindliches Gespräch zur Verfügung.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" variant="secondary" asChild>
              <a href="tel:+41791234567">
                Jetzt anrufen
              </a>
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10" asChild>
              <Link to="/sponsoren">
                Aktuelle Sponsoren
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer Note */}
      <section className="py-8 container">
        <p className="text-center text-sm text-muted-foreground">
          Alle Preise verstehen sich exkl. MwSt. Individuelle Pakete auf Anfrage möglich.
        </p>
      </section>
    </div>
  );
}
