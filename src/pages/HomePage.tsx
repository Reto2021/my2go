import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useSession, useBrowseMode } from '@/lib/session';
import { getRewards, getPartners, Reward, Partner } from '@/lib/api';
import { BalanceCard } from '@/components/ui/balance-card';
import { RewardCard } from '@/components/ui/reward-card';
import { PartnerCard } from '@/components/ui/partner-card';
import { PageLoader } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import logo from '@/assets/logo-radio2go.png';
import talerCoin from '@/assets/taler-coin.png';
import { QrCode, Gift, MapPin, ArrowRight, Sparkles } from 'lucide-react';

export default function HomePage() {
  const [searchParams] = useSearchParams();
  const { initSession, session, balance, isLoading } = useSession();
  const isBrowseMode = useBrowseMode();
  
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [isLoadingContent, setIsLoadingContent] = useState(true);
  
  useEffect(() => {
    const token = searchParams.get('token');
    initSession(token);
  }, [searchParams, initSession]);
  
  useEffect(() => {
    async function loadContent() {
      setIsLoadingContent(true);
      try {
        const [rewardsData, partnersData] = await Promise.all([
          getRewards(),
          getPartners(),
        ]);
        setRewards(rewardsData.slice(0, 4));
        setPartners(partnersData.slice(0, 3));
      } catch (error) {
        console.error('Failed to load content:', error);
      } finally {
        setIsLoadingContent(false);
      }
    }
    loadContent();
  }, []);
  
  if (isLoading) {
    return <PageLoader />;
  }
  
  // Browse Mode - No valid session
  if (isBrowseMode) {
    return <BrowseModeHome rewards={rewards} partners={partners} isLoading={isLoadingContent} />;
  }
  
  // Session Mode - Valid session
  return (
    <SessionModeHome 
      displayName={session?.displayName} 
      balance={balance!}
      rewards={rewards}
      isLoading={isLoadingContent}
    />
  );
}

interface BrowseModeHomeProps {
  rewards: Reward[];
  partners: Partner[];
  isLoading: boolean;
}

function BrowseModeHome({ rewards, partners, isLoading }: BrowseModeHomeProps) {
  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-primary/95 px-4 pt-8 pb-12 text-primary-foreground">
        {/* Background decoration */}
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-accent/10 blur-2xl" />
        
        <div className="relative container">
          <img 
            src={logo} 
            alt="Radio 2Go" 
            className="h-12 mb-6"
          />
          
          <h1 className="text-2xl font-bold mb-3 text-balance">
            Sammle 2Go Taler & hol dir exklusive Rewards!
          </h1>
          
          <p className="text-primary-foreground/80 mb-6">
            Das Multi-Partner Bonus-Programm von Radio 2Go. Punkte sammeln, Prämien einlösen.
          </p>
          
          <Button 
            size="lg" 
            className="btn-gold w-full text-base"
            onClick={() => {
              // In production: would open wallet pass / registration
              window.location.href = '?token=demo';
            }}
          >
            <Sparkles className="h-5 w-5 mr-2" />
            2Go Taler Karte öffnen
          </Button>
        </div>
      </section>
      
      {/* Coin Image */}
      <section className="container -mt-8 mb-6">
        <div className="relative">
          <img 
            src={talerCoin} 
            alt="2Go Taler" 
            className="w-full max-w-sm mx-auto rounded-3xl coin-glow"
          />
        </div>
      </section>
      
      {/* Rewards Teaser */}
      <section className="container mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Beliebte Rewards</h2>
          <Link to="/rewards" className="text-sm text-accent font-medium flex items-center gap-1">
            Alle <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="card-elevated h-20 animate-pulse bg-muted" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {rewards.slice(0, 3).map(reward => (
              <RewardCard key={reward.id} reward={reward} />
            ))}
          </div>
        )}
      </section>
      
      {/* Partners Teaser */}
      <section className="container mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Partner in deiner Nähe</h2>
          <Link to="/partner" className="text-sm text-accent font-medium flex items-center gap-1">
            Alle <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="card-elevated h-20 animate-pulse bg-muted" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {partners.slice(0, 2).map(partner => (
              <PartnerCard key={partner.id} partner={partner} />
            ))}
          </div>
        )}
      </section>
      
      {/* Info Banner */}
      <section className="container mb-8">
        <div className="card-elevated bg-secondary/50 text-center">
          <p className="text-sm text-muted-foreground">
            2Go Taler sind Bonuspunkte und nicht auszahlbar.
          </p>
        </div>
      </section>
    </div>
  );
}

interface SessionModeHomeProps {
  displayName?: string;
  balance: { current: number; pending: number; lifetime: number };
  rewards: Reward[];
  isLoading: boolean;
}

function SessionModeHome({ displayName, balance, rewards, isLoading }: SessionModeHomeProps) {
  return (
    <div className="animate-fade-in">
      {/* Header */}
      <header className="container pt-6 pb-4">
        <img 
          src={logo} 
          alt="Radio 2Go" 
          className="h-10"
        />
      </header>
      
      {/* Balance Card */}
      <section className="container mb-6">
        <BalanceCard balance={balance} displayName={displayName} />
      </section>
      
      {/* Quick Actions */}
      <section className="container mb-8">
        <h2 className="text-lg font-semibold mb-4">Schnellaktionen</h2>
        <div className="grid grid-cols-3 gap-3">
          <QuickActionButton 
            to="/code" 
            icon={QrCode} 
            label="Code einlösen" 
          />
          <QuickActionButton 
            to="/rewards" 
            icon={Gift} 
            label="Rewards" 
          />
          <QuickActionButton 
            to="/partner" 
            icon={MapPin} 
            label="Partner" 
          />
        </div>
      </section>
      
      {/* Rewards for you */}
      <section className="container mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Für dich</h2>
          <Link to="/rewards" className="text-sm text-accent font-medium flex items-center gap-1">
            Alle <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="card-elevated h-20 animate-pulse bg-muted" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {rewards.map(reward => (
              <RewardCard key={reward.id} reward={reward} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

interface QuickActionButtonProps {
  to: string;
  icon: React.ElementType;
  label: string;
}

function QuickActionButton({ to, icon: Icon, label }: QuickActionButtonProps) {
  return (
    <Link
      to={to}
      className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-card card-elevated transition-all active:scale-[0.98]"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
        <Icon className="h-6 w-6 text-accent" />
      </div>
      <span className="text-xs font-medium text-center">{label}</span>
    </Link>
  );
}
