import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
  Sparkles,
  ArrowRight,
  LogOut
} from 'lucide-react';

export default function HomePage() {
  const { initSession, session, balance, isLoading } = useSession();
  const isBrowseMode = useBrowseMode();
  
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [isLoadingContent, setIsLoadingContent] = useState(true);
  
  // Initialize session on mount (handles URL token + cookie)
  useEffect(() => {
    initSession();
  }, [initSession]);
  
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
      passLink={session?.passLink}
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
    <div className="min-h-screen bg-background">
      {/* Hero Section with Skyline */}
      <section className="hero-section text-secondary">
        {/* Clouds */}
        <div className="clouds-bg" />
        
        {/* Skyline */}
        <div className="skyline-bg" />
        
        <div className="container relative z-10 pt-6 pb-32">
          <div className="animate-in">
            {/* Original Logo */}
            <img 
              src={logo} 
              alt="Radio 2Go" 
              className="h-12 mb-10"
            />
            
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight mb-4">
              Sammle Taler.<br />
              <span className="text-accent">Hol dir Rewards.</span>
            </h1>
            
            <p className="text-secondary/70 text-lg mb-8 max-w-xs leading-relaxed">
              Das Bonusprogramm von Radio 2Go. Bei Partnern sammeln, exklusive Prämien einlösen.
            </p>
            
            <button 
              onClick={() => window.location.href = '?token=demo'}
              className="btn-primary group"
            >
              <Wallet className="h-5 w-5" />
              Taler Karte öffnen
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </section>
      
      {/* Features */}
      <section className="container -mt-16 relative z-20">
        <div className="grid grid-cols-3 gap-3 animate-in-delayed">
          <FeatureChip icon={Sparkles} label="Punkte sammeln" color="accent" />
          <FeatureChip icon={Gift} label="Rewards holen" color="primary" />
          <FeatureChip icon={MapPin} label="Partner finden" color="secondary" />
        </div>
      </section>
      
      {/* Rewards Preview */}
      <section className="container section">
        <div className="section-header">
          <h2 className="section-title">Beliebte Rewards</h2>
          <Link to="/rewards" className="section-link">
            Alle anzeigen <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        
        <div className="space-y-3 stagger-children">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 rounded-3xl bg-muted animate-pulse" />
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
          <Link to="/partner" className="section-link">
            Alle anzeigen <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        
        <div className="space-y-3 stagger-children">
          {isLoading ? (
            Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-24 rounded-3xl bg-muted animate-pulse" />
            ))
          ) : (
            partners.slice(0, 2).map(partner => (
              <PartnerCard key={partner.id} partner={partner} />
            ))
          )}
        </div>
      </section>
      
      {/* Info */}
      <section className="container pb-28">
        <div className="p-5 rounded-2xl bg-secondary/5 border border-secondary/10">
          <p className="text-sm text-muted-foreground text-center">
            2Go Taler sind Bonuspunkte und nicht auszahlbar.
          </p>
        </div>
      </section>
    </div>
  );
}

interface FeatureChipProps {
  icon: React.ElementType;
  label: string;
  color: 'accent' | 'primary' | 'secondary';
}

function FeatureChip({ icon: Icon, label, color }: FeatureChipProps) {
  const colorClasses = {
    accent: 'bg-accent/15 text-accent',
    primary: 'bg-primary/20 text-secondary',
    secondary: 'bg-secondary/10 text-secondary',
  };
  
  return (
    <div className="card-glass p-4 flex flex-col items-center gap-3">
      <div className={`icon-container-md rounded-2xl ${colorClasses[color]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <span className="text-xs font-semibold text-center text-foreground">{label}</span>
    </div>
  );
}

interface SessionModeHomeProps {
  displayName?: string;
  balance: { current: number; pending: number; lifetime: number };
  rewards: Reward[];
  isLoading: boolean;
  passLink?: string;
}

function SessionModeHome({ displayName, balance, rewards, isLoading, passLink }: SessionModeHomeProps) {
  const { logout, isLoggingOut } = useSession();
  const [showMenu, setShowMenu] = useState(false);
  
  const handleLogout = async () => {
    await logout();
    setShowMenu(false);
  };
  
  return (
    <div className="min-h-screen pb-28 bg-background">
      {/* Header */}
      <header className="container pt-6 pb-4">
        <div className="flex items-center justify-between animate-in">
          <img 
            src={logo} 
            alt="Radio 2Go" 
            className="h-10"
          />
          {displayName && (
            <div className="relative">
              <button 
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center gap-2 p-1 rounded-full hover:bg-muted transition-colors"
              >
                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-sm font-bold text-secondary">
                    {displayName.charAt(0).toUpperCase()}
                  </span>
                </div>
              </button>
              
              {/* Dropdown Menu */}
              {showMenu && (
                <div className="absolute right-0 top-12 w-48 rounded-2xl bg-card border border-border shadow-strong p-2 z-50 animate-in">
                  {passLink && (
                    <a 
                      href={passLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-muted transition-colors"
                      onClick={() => setShowMenu(false)}
                    >
                      <Wallet className="h-4 w-4 text-muted-foreground" />
                      Wallet öffnen
                    </a>
                  )}
                  <button 
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    {isLoggingOut ? 'Wird getrennt...' : 'Karte trennen'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        {displayName && (
          <p className="text-muted-foreground mt-4 animate-in-delayed">
            Hallo, <span className="font-semibold text-foreground">{displayName}</span> 👋
          </p>
        )}
      </header>
      
      {/* Balance Card */}
      <section className="container py-4">
        <div className="animate-in">
          <BalanceCard balance={balance} />
        </div>
      </section>
      
      {/* Quick Actions */}
      <section className="container section">
        <h2 className="section-title mb-5">Schnellzugriff</h2>
        <div className="grid grid-cols-3 gap-3 stagger-children">
          <QuickAction to="/code" icon={QrCode} label="Code einlösen" color="accent" />
          <QuickAction to="/rewards" icon={Gift} label="Rewards" color="primary" />
          <QuickAction to="/partner" icon={MapPin} label="Partner" color="secondary" />
        </div>
      </section>
      
      {/* Rewards */}
      <section className="container section">
        <div className="section-header">
          <h2 className="section-title">Für dich</h2>
          <Link to="/rewards" className="section-link">
            Alle <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        
        <div className="space-y-3 stagger-children">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 rounded-3xl bg-muted animate-pulse" />
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

interface QuickActionProps {
  to: string;
  icon: React.ElementType;
  label: string;
  color: 'accent' | 'primary' | 'secondary';
}

function QuickAction({ to, icon: Icon, label, color }: QuickActionProps) {
  const colorClasses = {
    accent: 'bg-accent/15 text-accent',
    primary: 'bg-primary/30 text-secondary',
    secondary: 'bg-secondary/10 text-secondary',
  };
  
  return (
    <Link to={to} className="quick-action">
      <div className={`icon-container-lg rounded-2xl ${colorClasses[color]}`}>
        <Icon className="h-6 w-6" />
      </div>
      <span className="text-sm font-semibold text-center">{label}</span>
    </Link>
  );
}
