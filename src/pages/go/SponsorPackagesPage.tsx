import { Link } from 'react-router-dom';
import { Check, Star, Crown, Award, Medal, Radio, Gift, Calendar, Users, Building2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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

export default function SponsorPackagesPage() {
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
                <a href="#packages">
                  Pakete ansehen
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/go/partner/faq">
                  Häufige Fragen
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
                    <a href={`mailto:sponsoring@my2go.ch?subject=Anfrage ${level.name}-Sponsoring`}>
                      Anfragen
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Combination Examples */}
      <section className="py-12 container">
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
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-primary to-accent">
        <div className="container text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-primary-foreground mb-4">
            Bereit, Sponsor zu werden?
          </h2>
          <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
            Kontaktiere uns für ein unverbindliches Gespräch über deine Sponsoring-Möglichkeiten.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="lg" variant="secondary" asChild>
              <a href="mailto:sponsoring@my2go.ch">
                Jetzt anfragen
                <ArrowRight className="ml-2 h-4 w-4" />
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
