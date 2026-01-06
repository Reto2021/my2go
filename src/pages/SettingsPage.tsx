import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Volume2, Vibrate, Bell } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useSettings } from '@/lib/settings';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { 
    soundEnabled, 
    vibrationEnabled, 
    setSoundEnabled, 
    setVibrationEnabled 
  } = useSettings();
  
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
        
        {/* Info */}
        <section className="animate-in-delayed">
          <div className="p-4 rounded-2xl bg-muted/50">
            <p className="text-sm text-muted-foreground text-center">
              Diese Einstellungen werden lokal auf deinem Gerät gespeichert.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
