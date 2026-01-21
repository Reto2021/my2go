import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Volume2, Vibrate, Bell, Gift, ChevronRight, BellRing, Loader2, Users, Award, LogOut, User, Download, Smartphone, Eye, HelpCircle, Shield, Store, Settings2, Sparkles, Share, Plus, Crown, Radio } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}
import { Switch } from '@/components/ui/switch';
import { useSettings } from '@/lib/settings';
import { useAuth } from '@/contexts/AuthContext';
import { signOut } from '@/lib/supabase-helpers';
import { supabase } from '@/integrations/supabase/client';
import { 
  isPushSupported, 
  getPushSubscriptionStatus, 
  subscribeToPush, 
  unsubscribeFromPush,
  getNotificationPermission 
} from '@/lib/push-notifications';
import { toast } from 'sonner';
import { BadgeProgressRing } from '@/components/badges/BadgeProgressRing';
import { OnboardingTrigger } from '@/components/onboarding/OnboardingTrigger';
import { SubscriptionSettings } from '@/components/subscription/SubscriptionSettings';
import { RadioStationSearch } from '@/components/radio/RadioStationSearch';
import { useRadioStore, ExternalStation } from '@/lib/radio-store';

// Visit tracking keys (same as in install-prompt.tsx)
const VISIT_COUNT_KEY = 'pwa-visit-count';
const LAST_VISIT_KEY = 'pwa-last-visit';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, profile, isPartnerAdmin, partnerInfo } = useAuth();
  const { 
    soundEnabled, 
    vibrationEnabled, 
    setSoundEnabled, 
    setVibrationEnabled 
  } = useSettings();
  
  const [pushSupported, setPushSupported] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [visitCount, setVisitCount] = useState(0);
  const [firstVisitDate, setFirstVisitDate] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [showRadioSearch, setShowRadioSearch] = useState(false);
  
  const { customStation, setCustomStation, isRadio2Go } = useRadioStore();
  
  // Handle #radio hash to auto-open search
  useEffect(() => {
    if (window.location.hash === '#radio') {
      setShowRadioSearch(true);
      // Clear hash after opening
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);
  
  useEffect(() => {
    // Check admin status
    const checkAdminStatus = async () => {
      if (!user) return;
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();
      setIsAdmin(!!data);
    };
    checkAdminStatus();
  }, [user]);

  useEffect(() => {
    // Check if PWA is installed
    const standalone = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone === true;
    setIsInstalled(standalone);
    
    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(iOS);
    
    // Get visit statistics
    const storedVisitCount = parseInt(localStorage.getItem(VISIT_COUNT_KEY) || '0');
    setVisitCount(storedVisitCount);
    
    const firstVisit = localStorage.getItem('pwa-first-visit');
    if (firstVisit) {
      const date = new Date(parseInt(firstVisit));
      setFirstVisitDate(date.toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' }));
    } else {
      // Set first visit if not exists
      localStorage.setItem('pwa-first-visit', Date.now().toString());
      setFirstVisitDate(new Date().toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric' }));
    }
    
    // Listen for install prompt (Android/Chrome)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    
    const checkPushStatus = async () => {
      const supported = isPushSupported();
      setPushSupported(supported);
      
      if (supported) {
        try {
          const permission = await getNotificationPermission();
          setPermissionDenied(permission === 'denied');
          
          const isSubscribed = await getPushSubscriptionStatus();
          setPushEnabled(isSubscribed);
        } catch (error) {
          console.error('Error checking push status:', error);
          // Service Worker not ready yet
          setPushSupported(false);
        }
      }
    };
    
    // Small delay to allow Service Worker to register
    const timer = setTimeout(checkPushStatus, 500);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isInstalled) {
      toast.success('My 2Go ist bereits installiert!');
      return;
    }
    
    if (isIOS) {
      setShowIOSInstructions(true);
      return;
    }
    
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          toast.success('App wird installiert!');
          setIsInstalled(true);
        }
        setDeferredPrompt(null);
      } catch (error) {
        console.error('Install error:', error);
        navigate('/install');
      }
    } else {
      // Fallback to install page if prompt not available
      navigate('/install');
    }
  };
  
  const handlePushToggle = async (enabled: boolean) => {
    if (!user) {
      toast.error('Bitte melde dich an, um Benachrichtigungen zu aktivieren');
      return;
    }
    
    setPushLoading(true);
    try {
      if (enabled) {
        const success = await subscribeToPush();
        if (success) {
          setPushEnabled(true);
          toast.success('Push-Benachrichtigungen aktiviert');
        } else {
          const permission = await getNotificationPermission();
          if (permission === 'denied') {
            setPermissionDenied(true);
            toast.error('Benachrichtigungen wurden im Browser blockiert. Bitte ändere die Einstellungen in deinem Browser.');
          } else {
            // Check if it's a Service Worker issue
            const swReady = await navigator.serviceWorker?.ready;
            if (!swReady) {
              toast.error('Push-Benachrichtigungen sind in der Vorschau nicht verfügbar. Bitte installiere die App.');
            } else {
              toast.error('Konnte Benachrichtigungen nicht aktivieren. Bitte versuche es nach der Installation der App.');
            }
          }
        }
      } else {
        const success = await unsubscribeFromPush();
        if (success) {
          setPushEnabled(false);
          toast.success('Push-Benachrichtigungen deaktiviert');
        }
      }
    } catch (error) {
      console.error('Push toggle error:', error);
      toast.error('Fehler bei der Einstellung');
    } finally {
      setPushLoading(false);
    }
  };
  
  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await signOut();
      toast.success('Erfolgreich abgemeldet');
      navigate('/auth');
    } catch (error) {
      toast.error('Fehler beim Abmelden');
    } finally {
      setIsLoggingOut(false);
    }
  };
  
  return (
    <div className="min-h-screen pb-24 bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="container py-4 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="btn-ghost p-2 -ml-2">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold">Einstellungen</h1>
        </div>
      </header>
      
      <div className="container py-6 space-y-6">
        {/* Badge Progress Ring - only show if logged in */}
        {user && (
          <section className="animate-in">
            <BadgeProgressRing />
          </section>
        )}

        {/* Help & Info Section */}
        <section className="animate-in">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
            <HelpCircle className="h-4 w-4" />
            Hilfe & Info
          </h2>
          
          <div className="card-base divide-y divide-border">
            {/* Tutorial */}
            {user && (
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-accent" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">App-Tour</p>
                    <p className="text-sm text-muted-foreground">
                      Lerne die wichtigsten Funktionen kennen
                    </p>
                  </div>
                </div>
                <OnboardingTrigger />
              </div>
            )}
            
            {/* FAQ */}
            <button 
              onClick={() => navigate('/faq')}
              className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <HelpCircle className="h-5 w-5 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Häufige Fragen (FAQ)</p>
                  <p className="text-sm text-muted-foreground">
                    Antworten auf die wichtigsten Fragen
                  </p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
        </section>
        
        {/* Account Section - only show if logged in */}
        {user && (
          <section className="animate-in">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
              <Gift className="h-4 w-4" />
              Mein Konto
            </h2>
            
            <div className="card-base divide-y divide-border">
              {/* Profile */}
              <button 
                onClick={() => navigate('/profile')}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-secondary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-secondary" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">Mein Profil</p>
                    <p className="text-sm text-muted-foreground">
                      Name, Telefon und Adresse bearbeiten
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>
              
              {/* My Redemptions */}
              <button 
                onClick={() => navigate('/rewards?tab=aktiviert')}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-success/10 flex items-center justify-center">
                    <Gift className="h-5 w-5 text-success" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">Meine Gutscheine</p>
                    <p className="text-sm text-muted-foreground">
                      Aktivierte Gutscheine und Status
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>
              
              {/* Referral Program */}
              <button 
                onClick={() => navigate('/referral')}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-accent" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">Freunde einladen</p>
                    <p className="text-sm text-muted-foreground">
                      Erhalte 25 Taler pro Empfehlung
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>
              
              {/* Badges */}
              <button 
                onClick={() => navigate('/badges')}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                    <Award className="h-5 w-5 text-amber-500" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">Meine Badges</p>
                    <p className="text-sm text-muted-foreground">
                      Errungenschaften und Fortschritt
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
          </section>
        )}
        
        {/* 2Go Plus Subscription Section */}
        {user && (
          <section className="animate-in">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
              <Crown className="h-4 w-4" />
              Premium
            </h2>
            <SubscriptionSettings />
          </section>
        )}
        
        {/* Notifications Section */}
        {pushSupported && user && (
          <section className="animate-in">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
              <BellRing className="h-4 w-4" />
              Benachrichtigungen
            </h2>
            
            <div className="card-base divide-y divide-border">
              {/* Push Notifications Toggle */}
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-secondary/10 flex items-center justify-center">
                    <BellRing className="h-5 w-5 text-secondary" />
                  </div>
                  <div>
                    <p className="font-medium">Push-Benachrichtigungen</p>
                    <p className="text-sm text-muted-foreground">
                      Erhalte eine Erinnerung, wenn Gutscheine bald ablaufen
                    </p>
                    {permissionDenied && (
                      <p className="text-xs text-destructive mt-1">
                        Im Browser blockiert - bitte in den Browser-Einstellungen erlauben
                      </p>
                    )}
                  </div>
                </div>
                {pushLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                ) : (
                  <Switch 
                    checked={pushEnabled} 
                    onCheckedChange={handlePushToggle}
                    disabled={permissionDenied}
                  />
                )}
              </div>
            </div>
          </section>
        )}
        
        {/* Feedback Section */}
        <section className="animate-in">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Feedback
          </h2>
          
          <div className="card-base divide-y divide-border">
            {/* Sound Toggle */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
                  <Volume2 className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="font-medium">Sound</p>
                  <p className="text-sm text-muted-foreground">
                    Töne beim Einlösen abspielen
                  </p>
                </div>
              </div>
              <Switch 
                checked={soundEnabled} 
                onCheckedChange={setSoundEnabled}
              />
            </div>
            
            {/* Vibration Toggle */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Vibrate className="h-5 w-5 text-secondary" />
                </div>
                <div>
                  <p className="font-medium">Vibration</p>
                  <p className="text-sm text-muted-foreground">
                    Haptisches Feedback auf Mobilgeräten
                  </p>
                </div>
              </div>
              <Switch 
                checked={vibrationEnabled} 
                onCheckedChange={setVibrationEnabled}
              />
            </div>
          </div>
        </section>
        
        {/* Radio Section */}
        <section className="animate-in">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
            <Radio className="h-4 w-4" />
            Radio
          </h2>
          
          <div className="card-base divide-y divide-border">
            {/* Current Station */}
            <button 
              onClick={() => setShowRadioSearch(!showRadioSearch)}
              className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="relative h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center overflow-hidden">
                  {customStation?.favicon ? (
                    <img 
                      src={customStation.favicon} 
                      alt={customStation.name}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : (
                    <Radio className="h-5 w-5 text-accent" />
                  )}
                </div>
                <div className="text-left">
                  <p className="font-medium flex items-center gap-2">
                    {isRadio2Go ? 'Radio 2Go' : customStation?.name || 'Radio 2Go'}
                    {isRadio2Go && (
                      <span className="text-xs bg-accent text-accent-foreground px-1.5 py-0.5 rounded">
                        Volle Taler
                      </span>
                    )}
                    {!isRadio2Go && (
                      <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                        ½ Taler
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {showRadioSearch ? 'Sender wechseln' : 'Tippen um Sender zu wechseln'}
                  </p>
                </div>
              </div>
              <ChevronRight className={`h-5 w-5 text-muted-foreground transition-transform ${showRadioSearch ? 'rotate-90' : ''}`} />
            </button>
            
            {/* Radio Station Search - expandable */}
            {showRadioSearch && (
              <div className="p-4 bg-muted/30 animate-in">
                <RadioStationSearch 
                  currentStation={customStation as any}
                  onSelectStation={(station) => {
                    setCustomStation(station as ExternalStation | null);
                    if (station) {
                      toast.success(`Wechsel zu ${station.name}`, {
                        description: 'Hinweis: Bei externen Sendern erhältst du halbe Taler.',
                      });
                    } else {
                      toast.success('Zurück zu Radio 2Go', {
                        description: 'Volle Taler-Belohnungen aktiviert!',
                      });
                    }
                    setShowRadioSearch(false);
                  }}
                />
              </div>
            )}
            
            {/* Reset to Radio 2Go if using external */}
            {!isRadio2Go && (
              <button 
                onClick={() => {
                  setCustomStation(null);
                  toast.success('Zurück zu Radio 2Go', {
                    description: 'Volle Taler-Belohnungen aktiviert!',
                  });
                }}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-accent"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-accent" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">Zurück zu Radio 2Go</p>
                    <p className="text-sm text-muted-foreground">
                      Für volle Taler-Belohnungen
                    </p>
                  </div>
                </div>
              </button>
            )}
          </div>
        </section>
        
        {/* App Section */}
        <section className="animate-in">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            App
          </h2>
          
          <div className="card-base divide-y divide-border">
            {/* Install App */}
            <div className="p-4">
              <button 
                onClick={handleInstallClick}
                className="w-full flex items-center justify-between hover:bg-muted/50 transition-colors rounded-lg -m-2 p-2"
              >
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${isInstalled ? 'bg-success/10' : 'bg-secondary/10'}`}>
                    <Download className={`h-5 w-5 ${isInstalled ? 'text-success' : 'text-secondary'}`} />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">App installieren</p>
                    <p className="text-sm text-muted-foreground">
                      {isInstalled 
                        ? 'My 2Go ist installiert ✓' 
                        : isIOS 
                          ? 'Zum Home-Bildschirm hinzufügen'
                          : deferredPrompt 
                            ? 'Jetzt installieren'
                            : 'Zum Homescreen hinzufügen'
                      }
                    </p>
                  </div>
                </div>
                {!isInstalled && (
                  <div className={`h-8 px-3 rounded-full flex items-center justify-center text-sm font-medium ${
                    deferredPrompt ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'
                  }`}>
                    {deferredPrompt ? 'Installieren' : <ChevronRight className="h-5 w-5" />}
                  </div>
                )}
              </button>
              
              {/* iOS Instructions - shown inline when clicked */}
              {showIOSInstructions && isIOS && !isInstalled && (
                <div className="mt-4 bg-muted/50 rounded-xl p-4 animate-in">
                  <div className="flex items-center gap-2 text-sm text-foreground font-medium mb-3">
                    <Share className="h-4 w-4 text-primary" />
                    So installierst du My 2Go:
                  </div>
                  <ol className="text-sm text-muted-foreground space-y-2 ml-1">
                    <li className="flex items-center gap-3">
                      <span className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">1</span>
                      <span>Tippe auf <Share className="h-4 w-4 inline mx-1" /> (Teilen) in Safari</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">2</span>
                      <span>Wähle <Plus className="h-4 w-4 inline mx-1" /> "Zum Home-Bildschirm"</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">3</span>
                      <span>Tippe auf "Hinzufügen"</span>
                    </li>
                  </ol>
                  <button 
                    onClick={() => setShowIOSInstructions(false)}
                    className="mt-3 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Ausblenden
                  </button>
                </div>
              )}
            </div>
            
            {/* My Stats - Personal Analytics */}
            <button 
              onClick={() => navigate('/my-stats')}
              className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Eye className="h-5 w-5 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Meine Statistiken</p>
                  <p className="text-sm text-muted-foreground">
                    Hörzeit, Streaks & Badge-Fortschritt
                  </p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
        </section>
        
        {/* Admin & Partner Portal Access */}
        {(isAdmin || isPartnerAdmin) && (
          <section className="animate-in-delayed">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
              <Settings2 className="h-4 w-4" />
              Verwaltung
            </h2>
            
            <div className="card-base divide-y divide-border">
              {/* Admin Dashboard */}
              {isAdmin && (
                <button 
                  onClick={() => navigate('/admin')}
                  className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                      <Shield className="h-5 w-5 text-destructive" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">Admin Dashboard</p>
                      <p className="text-sm text-muted-foreground">
                        System verwalten, Partner & Nutzer
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </button>
              )}
              
              {/* Partner Portal */}
              {isPartnerAdmin && partnerInfo && (
                <button 
                  onClick={() => navigate('/partner-portal')}
                  className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-success/10 flex items-center justify-center">
                      <Store className="h-5 w-5 text-success" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">Partner-Portal</p>
                      <p className="text-sm text-muted-foreground">
                        {partnerInfo.partnerName} verwalten
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </button>
              )}
            </div>
          </section>
        )}
        
        {/* Info */}
        <section className="animate-in-delayed">
          <div className="p-4 rounded-2xl bg-muted/50">
            <p className="text-sm text-muted-foreground text-center">
              Diese Einstellungen werden lokal auf deinem Gerät gespeichert.
            </p>
          </div>
        </section>
        
        {/* Logout Section - only show if logged in */}
        {user && (
          <section className="animate-in-delayed">
            <button 
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="w-full flex items-center justify-center gap-3 p-4 rounded-2xl bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors font-medium"
            >
              {isLoggingOut ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <LogOut className="h-5 w-5" />
                  Abmelden
                </>
              )}
            </button>
          </section>
        )}
        
        {/* Account Info */}
        {user && profile && (
          <section className="animate-in-delayed">
            <div className="p-4 rounded-2xl bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-secondary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-secondary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{profile.display_name || profile.email}</p>
                  <p className="text-xs text-muted-foreground">{profile.email}</p>
                </div>
              </div>
            </div>
          </section>
        )}
        
        {/* Legal Links */}
        <section className="animate-in-delayed">
          <div className="p-4 rounded-2xl bg-muted/50">
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
              <a href="/agb" className="hover:text-foreground transition-colors">AGB</a>
              <a href="/datenschutz" className="hover:text-foreground transition-colors">Datenschutz</a>
              <a href="/impressum" className="hover:text-foreground transition-colors">Impressum</a>
              <a href="/go/sponsoring" className="hover:text-foreground transition-colors">Sponsoring</a>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-3">
              © {new Date().getFullYear()} 2Go Media AG
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
