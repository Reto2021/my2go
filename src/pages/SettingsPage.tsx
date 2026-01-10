import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Volume2, Vibrate, Bell, Gift, ChevronRight, BellRing, Loader2, Users, Award, LogOut, User, Download, Smartphone, Eye } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useSettings } from '@/lib/settings';
import { useAuth } from '@/contexts/AuthContext';
import { signOut } from '@/lib/supabase-helpers';
import { 
  isPushSupported, 
  getPushSubscriptionStatus, 
  subscribeToPush, 
  unsubscribeFromPush,
  getNotificationPermission 
} from '@/lib/push-notifications';
import { toast } from 'sonner';
import { BadgeProgressRing } from '@/components/badges/BadgeProgressRing';

// Visit tracking keys (same as in install-prompt.tsx)
const VISIT_COUNT_KEY = 'pwa-visit-count';
const LAST_VISIT_KEY = 'pwa-last-visit';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
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
  
  useEffect(() => {
    // Check if PWA is installed
    const standalone = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone === true;
    setIsInstalled(standalone);
    
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
    
    const checkPushStatus = async () => {
      const supported = isPushSupported();
      setPushSupported(supported);
      
      if (supported) {
        const permission = await getNotificationPermission();
        setPermissionDenied(permission === 'denied');
        
        const isSubscribed = await getPushSubscriptionStatus();
        setPushEnabled(isSubscribed);
      }
    };
    
    checkPushStatus();
  }, []);
  
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
            toast.error('Konnte Benachrichtigungen nicht aktivieren');
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
      <header className="sticky top-20 z-40 bg-background/95 backdrop-blur-lg">
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
                onClick={() => navigate('/my-redemptions')}
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
        
        {/* App Section */}
        <section className="animate-in">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            App
          </h2>
          
          <div className="card-base divide-y divide-border">
            {/* Install App */}
            <button 
              onClick={() => navigate('/install')}
              className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-secondary/10 flex items-center justify-center">
                  <Download className="h-5 w-5 text-secondary" />
                </div>
                <div className="text-left">
                  <p className="font-medium">App installieren</p>
                  <p className="text-sm text-muted-foreground">
                    {isInstalled ? 'My 2Go ist installiert ✓' : 'Zum Homescreen hinzufügen'}
                  </p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>
            
            {/* Visit Statistics */}
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
                  <Eye className="h-5 w-5 text-accent" />
                </div>
                <div className="text-left">
                  <p className="font-medium">Besuchs-Statistik</p>
                  <p className="text-sm text-muted-foreground">
                    {visitCount} Besuche {firstVisitDate && `seit ${firstVisitDate}`}
                  </p>
                </div>
              </div>
              <span className="text-2xl font-bold text-accent">{visitCount}</span>
            </div>
          </div>
        </section>
        
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
