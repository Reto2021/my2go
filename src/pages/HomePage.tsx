import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useSession, useBrowseMode } from '@/lib/session';
import { getRewards, getPartners, Reward, Partner } from '@/lib/api';
import { BalanceCard } from '@/components/ui/balance-card';
import { RewardCard } from '@/components/ui/reward-card';
import { PartnerCard } from '@/components/ui/partner-card';
import { PageLoader } from '@/components/ui/loading-spinner';
import logo from '@/assets/logo-radio2go.png';
import { 
  QrCode, 
  Gift, 
  MapPin, 
  ChevronRight, 
  Wallet,
  Sparkles
} from 'lucide-react';

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
  
  if (isBrowseMode) {
    return <BrowseModeHome rewards={rewards} partners={partners} isLoading={isLoadingContent} />;
  }
  
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
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="hero-gradient text-primary-foreground">
        <div className="container pt-8 pb-12">
          <div className="animate-in">
            <img 
              src={logo} 
              alt="Radio 2Go" 
              className="h-10 mb-8 brightness-0 invert"
            />
            
            <h1 className="text-display text-balance mb-4">
              Sammle Taler.<br />
              Hol dir Rewards.
            </h1>
            
            <p className="text-primary-foreground/80 text-lg mb-8 max-w-sm">
              Das Bonusprogramm von Radio 2Go. Bei unseren Partnern sammeln, exklusive Prämien einlösen.
            </p>
            
            <button 
              onClick={() => window.location.href = '?token=demo'}
              className="btn-primary w-full sm:w-auto text-base"
            >
              <Wallet className="h-5 w-5" />
              Taler Karte öffnen
            </button>
          </div>
        </div>
      </section>
      
      {/* Features */}
      <section className="container section">
        <div className="grid grid-cols-3 gap-3 animate-in-delayed">
          <FeatureChip icon={Sparkles} label="Punkte sammeln" />
          <FeatureChip icon={Gift} label="Rewards holen" />
          <FeatureChip icon={MapPin} label="Partner finden" />
        </div>
      </section>
      
      {/* Rewards Preview */}
      <section className="container section">
        <div className="section-header">
          <h2 className="section-title">Beliebte Rewards</h2>
          <Link to="/rewards" className="section-link flex items-center gap-1">
            Alle <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        
        <div className="space-y-3 stagger-children">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 rounded-2xl bg-muted animate-pulse-soft" />
            ))
          ) : (
            rewards.slice(0, 3).map(reward => (
              <RewardCard key={reward.id} reward={reward} />
            ))
          )}
        </div>
      </section>
      
      {/* Partners Preview */}
      <section className="container section">
        <div className="section-header">
          <h2 className="section-title">Partner entdecken</h2>
          <Link to="/partner" className="section-link flex items-center gap-1">
            Alle <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        
        <div className="space-y-3 stagger-children">
          {isLoading ? (
            Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-20 rounded-2xl bg-muted animate-pulse-soft" />
            ))
          ) : (
            partners.slice(0, 2).map(partner => (
              <PartnerCard key={partner.id} partner={partner} />
            ))
          )}
        </div>
      </section>
      
      {/* Info */}
      <section className="container section pb-24">
        <div className="p-4 rounded-2xl bg-muted/50 text-center">
          <p className="text-sm text-muted-foreground">
            2Go Taler sind Bonuspunkte und nicht auszahlbar.
          </p>
        </div>
      </section>
    </div>
  );
}

function FeatureChip({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-secondary/50">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <span className="text-xs font-medium text-center text-muted-foreground">{label}</span>
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
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="container pt-6 pb-2">
        <div className="flex items-center justify-between animate-in">
          <img 
            src={logo} 
            alt="Radio 2Go" 
            className="h-9"
          />
          {displayName && (
            <span className="text-sm font-medium text-muted-foreground">
              Hallo, {displayName}
            </span>
          )}
        </div>
      </header>
      
      {/* Balance Card */}
      <section className="container py-4">
        <div className="animate-in">
          <BalanceCard balance={balance} />
        </div>
      </section>
      
      {/* Quick Actions */}
      <section className="container section">
        <h2 className="section-title mb-4">Schnellzugriff</h2>
        <div className="grid grid-cols-3 gap-3 stagger-children">
          <QuickAction to="/code" icon={QrCode} label="Code einlösen" />
          <QuickAction to="/rewards" icon={Gift} label="Rewards" />
          <QuickAction to="/partner" icon={MapPin} label="Partner" />
        </div>
      </section>
      
      {/* Rewards */}
      <section className="container section">
        <div className="section-header">
          <h2 className="section-title">Für dich</h2>
          <Link to="/rewards" className="section-link flex items-center gap-1">
            Alle <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        
        <div className="space-y-3 stagger-children">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 rounded-2xl bg-muted animate-pulse-soft" />
            ))
          ) : (
            rewards.map(reward => (
              <RewardCard key={reward.id} reward={reward} />
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function QuickAction({ to, icon: Icon, label }: { to: string; icon: React.ElementType; label: string }) {
  return (
    <Link
      to={to}
      className="card-interactive p-4 flex flex-col items-center gap-3"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10">
        <Icon className="h-6 w-6 text-accent" />
      </div>
      <span className="text-xs font-medium text-center">{label}</span>
    </Link>
  );
}
