import { useState, useEffect } from 'react';
import { 
  Download, 
  Share, 
  Plus, 
  MoreVertical, 
  Smartphone, 
  Monitor, 
  Check,
  Apple,
  Chrome,
  ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

type Platform = 'ios' | 'android' | 'desktop' | 'unknown';

function detectPlatform(): Platform {
  const ua = navigator.userAgent.toLowerCase();
  
  if (/ipad|iphone|ipod/.test(ua)) {
    return 'ios';
  }
  if (/android/.test(ua)) {
    return 'android';
  }
  if (!/mobile|tablet/.test(ua)) {
    return 'desktop';
  }
  return 'unknown';
}

export default function InstallPage() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [platform, setPlatform] = useState<Platform>('unknown');
  const [activePlatform, setActivePlatform] = useState<Platform>('ios');

  useEffect(() => {
    const detected = detectPlatform();
    setPlatform(detected);
    setActivePlatform(detected === 'unknown' ? 'ios' : detected);

    // Check if already installed
    const standalone = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone === true;
    setIsInstalled(standalone);

    // Listen for install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    }
  };

  const platforms = [
    { id: 'ios' as Platform, label: 'iPhone', icon: Apple },
    { id: 'android' as Platform, label: 'Android', icon: Smartphone },
    { id: 'desktop' as Platform, label: 'Desktop', icon: Monitor },
  ];

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="sticky top-20 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="container py-4">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-2">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Zurück</span>
          </Link>
          <h1 className="text-display-sm">My 2Go installieren</h1>
        </div>
      </header>

      <div className="container py-6 space-y-6">
        {/* Already installed */}
        {isInstalled ? (
          <div className="p-6 rounded-2xl bg-success/10 border border-success/20 text-center animate-in">
            <div className="h-16 w-16 rounded-2xl bg-success/20 flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-success" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">
              My 2Go ist installiert! 🎉
            </h2>
            <p className="text-muted-foreground">
              Du nutzt bereits die installierte Version von My 2Go.
            </p>
          </div>
        ) : (
          <>
            {/* Hero */}
            <div className="text-center animate-in">
              <div className="h-20 w-20 rounded-2xl overflow-hidden mx-auto mb-4 shadow-medium">
                <img src="/pwa-192x192.png" alt="My 2Go" className="h-full w-full object-cover" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">
                Hol dir My 2Go auf dein Gerät
              </h2>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                Installiere die App für schnelleren Zugriff, Offline-Nutzung und das beste Erlebnis.
              </p>
            </div>

            {/* Quick install button for Android/Chrome */}
            {deferredPrompt && (
              <div className="animate-in">
                <button
                  onClick={handleInstall}
                  className="w-full flex items-center justify-center gap-3 rounded-2xl py-4 bg-accent text-accent-foreground font-bold text-lg hover:bg-accent/90 transition-colors"
                >
                  <Download className="h-5 w-5" />
                  Jetzt installieren
                </button>
              </div>
            )}

            {/* Platform selector */}
            <div className="flex gap-2 p-1 rounded-2xl bg-muted">
              {platforms.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActivePlatform(id)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all",
                    activePlatform === id
                      ? "bg-card text-foreground shadow-soft"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>

            {/* Platform-specific instructions */}
            <div className="space-y-4">
              {activePlatform === 'ios' && (
                <div className="space-y-4 animate-in">
                  <div className="p-4 rounded-2xl bg-card border border-border">
                    <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                      <Apple className="h-5 w-5" />
                      Safari (iPhone/iPad)
                    </h3>
                    
                    <div className="space-y-4">
                      <Step number={1}>
                        <div className="flex items-center gap-2">
                          <span>Tippe auf</span>
                          <div className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/10">
                            <Share className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium">Teilen</span>
                          </div>
                          <span>in der Browser-Leiste</span>
                        </div>
                      </Step>
                      
                      <Step number={2}>
                        <div className="flex items-center gap-2">
                          <span>Scrolle und wähle</span>
                          <div className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/10">
                            <Plus className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium">Zum Home-Bildschirm</span>
                          </div>
                        </div>
                      </Step>
                      
                      <Step number={3}>
                        <span>Tippe auf "Hinzufügen" oben rechts</span>
                      </Step>
                    </div>
                  </div>
                  
                  <div className="p-4 rounded-xl bg-accent/10 border border-accent/20">
                    <p className="text-sm text-muted-foreground">
                      <strong className="text-foreground">Tipp:</strong> Verwende Safari für die beste Erfahrung. 
                      Chrome auf iOS unterstützt keine App-Installation.
                    </p>
                  </div>
                </div>
              )}

              {activePlatform === 'android' && (
                <div className="space-y-4 animate-in">
                  <div className="p-4 rounded-2xl bg-card border border-border">
                    <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                      <Chrome className="h-5 w-5" />
                      Chrome (Android)
                    </h3>
                    
                    <div className="space-y-4">
                      {deferredPrompt ? (
                        <div className="text-center py-4">
                          <p className="text-muted-foreground mb-4">
                            Klicke einfach auf den Button oben!
                          </p>
                        </div>
                      ) : (
                        <>
                          <Step number={1}>
                            <div className="flex items-center gap-2">
                              <span>Tippe auf</span>
                              <div className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/10">
                                <MoreVertical className="h-4 w-4 text-primary" />
                                <span className="text-sm font-medium">Menü</span>
                              </div>
                              <span>(drei Punkte oben rechts)</span>
                            </div>
                          </Step>
                          
                          <Step number={2}>
                            <div className="flex items-center gap-2">
                              <span>Wähle</span>
                              <div className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/10">
                                <Download className="h-4 w-4 text-primary" />
                                <span className="text-sm font-medium">App installieren</span>
                              </div>
                            </div>
                          </Step>
                          
                          <Step number={3}>
                            <span>Bestätige mit "Installieren"</span>
                          </Step>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="p-4 rounded-xl bg-accent/10 border border-accent/20">
                    <p className="text-sm text-muted-foreground">
                      <strong className="text-foreground">Tipp:</strong> Falls du keinen "Installieren"-Button siehst, 
                      lade die Seite neu oder verwende Chrome.
                    </p>
                  </div>
                </div>
              )}

              {activePlatform === 'desktop' && (
                <div className="space-y-4 animate-in">
                  <div className="p-4 rounded-2xl bg-card border border-border">
                    <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                      <Monitor className="h-5 w-5" />
                      Chrome / Edge (Desktop)
                    </h3>
                    
                    <div className="space-y-4">
                      <Step number={1}>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span>Klicke auf das</span>
                          <div className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/10">
                            <Download className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium">Install-Symbol</span>
                          </div>
                          <span>in der Adressleiste</span>
                        </div>
                      </Step>
                      
                      <Step number={2}>
                        <span>Klicke auf "Installieren"</span>
                      </Step>
                      
                      <Step number={3}>
                        <span>Die App öffnet sich in einem eigenen Fenster</span>
                      </Step>
                    </div>
                  </div>
                  
                  <div className="p-4 rounded-xl bg-muted/50">
                    <p className="text-sm text-muted-foreground">
                      <strong className="text-foreground">Alternative:</strong> Öffne das Browser-Menü (⋮) 
                      und wähle "My 2Go installieren" oder "Als App installieren".
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Benefits */}
            <div className="p-4 rounded-2xl bg-secondary/5 border border-secondary/10">
              <h3 className="font-bold text-foreground mb-3">Vorteile der Installation</h3>
              <ul className="space-y-2">
                <Benefit>Schneller Zugriff vom Homescreen</Benefit>
                <Benefit>Funktioniert auch offline</Benefit>
                <Benefit>Vollbildmodus ohne Browser-Leiste</Benefit>
                <Benefit>Push-Benachrichtigungen für neue Angebote</Benefit>
                <Benefit>Schnellere Ladezeiten</Benefit>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Step({ number, children }: { number: number; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className="h-6 w-6 rounded-full bg-accent flex items-center justify-center flex-shrink-0 mt-0.5">
        <span className="text-xs font-bold text-accent-foreground">{number}</span>
      </div>
      <div className="text-sm text-foreground">{children}</div>
    </div>
  );
}

function Benefit({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2 text-sm text-muted-foreground">
      <Check className="h-4 w-4 text-success flex-shrink-0" />
      {children}
    </li>
  );
}
