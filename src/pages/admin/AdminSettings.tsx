import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { toast } from 'sonner';
import { Settings, Coins, Gift, Users, Radio, Star, Save, AlertCircle } from 'lucide-react';

interface SystemSetting {
  key: string;
  value: string | number | boolean;
  description: string | null;
}

const settingsConfig = [
  {
    category: 'signup',
    title: 'Anmelde-Bonus',
    icon: Users,
    settings: [
      { key: 'signup_bonus_enabled', type: 'boolean', label: 'Anmelde-Bonus aktiviert', description: 'Ob neue Nutzer einen Bonus erhalten' },
      { key: 'signup_bonus_amount', type: 'number', label: 'Anmelde-Bonus (Taler)', description: 'Anzahl Taler für neue Nutzer' },
    ]
  },
  {
    category: 'referral',
    title: 'Empfehlungsprogramm',
    icon: Gift,
    settings: [
      { key: 'referral_enabled', type: 'boolean', label: 'Empfehlungsprogramm aktiviert', description: 'Ob das Empfehlungsprogramm aktiv ist' },
      { key: 'referral_bonus_referrer', type: 'number', label: 'Bonus für Werber (Taler)', description: 'Taler-Bonus für den werbenden Nutzer' },
      { key: 'referral_bonus_referred', type: 'number', label: 'Bonus für Geworbenen (Taler)', description: 'Taler-Bonus für den geworbenen Nutzer' },
    ]
  },
  {
    category: 'streak',
    title: 'Streak-System',
    icon: Coins,
    settings: [
      { key: 'streak_freeze_cost', type: 'number', label: 'Streak-Freeze Kosten (Taler)', description: 'Preis für einen Streak-Freeze' },
    ]
  },
  {
    category: 'review',
    title: 'Bewertungen',
    icon: Star,
    settings: [
      { key: 'review_bonus_taler', type: 'number', label: 'Review-Bonus (Taler)', description: 'Taler-Bonus für abgegebene Bewertungen' },
    ]
  },
  {
    category: 'redemption',
    title: 'Einlösungen',
    icon: Gift,
    settings: [
      { key: 'redemption_expiry_hours', type: 'number', label: 'Ablaufzeit (Stunden)', description: 'Stunden bis ein Einlöse-Code abläuft' },
    ]
  },
];

export default function AdminSettings() {
  const [settings, setSettings] = useState<Record<string, SystemSetting>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalSettings, setOriginalSettings] = useState<Record<string, SystemSetting>>({});

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('key, value, description');

      if (error) throw error;

      const settingsMap: Record<string, SystemSetting> = {};
      data?.forEach(setting => {
        // Parse JSON value - handle the Json type from Supabase
        let parsedValue: string | number | boolean = '';
        const rawValue = setting.value;
        
        if (typeof rawValue === 'boolean') {
          parsedValue = rawValue;
        } else if (typeof rawValue === 'number') {
          parsedValue = rawValue;
        } else if (typeof rawValue === 'string') {
          // Try to parse string as JSON
          try {
            const parsed = JSON.parse(rawValue);
            if (typeof parsed === 'boolean' || typeof parsed === 'number') {
              parsedValue = parsed;
            } else {
              parsedValue = rawValue;
            }
          } catch {
            parsedValue = rawValue;
          }
        } else {
          // For other types (Json array/object), convert to string
          parsedValue = JSON.stringify(rawValue);
        }
        
        settingsMap[setting.key] = {
          key: setting.key,
          value: parsedValue,
          description: setting.description,
        };
      });

      setSettings(settingsMap);
      setOriginalSettings(JSON.parse(JSON.stringify(settingsMap)));
    } catch (error) {
      console.error('Failed to load settings:', error);
      toast.error('Einstellungen konnten nicht geladen werden');
    } finally {
      setLoading(false);
    }
  }

  function updateSetting(key: string, value: string | number | boolean) {
    setSettings(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        key,
        value,
        description: prev[key]?.description || null,
      }
    }));
    setHasChanges(true);
  }

  async function saveSettings() {
    setSaving(true);
    try {
      // Find changed settings
      const changedSettings = Object.entries(settings).filter(([key, setting]) => {
        const original = originalSettings[key];
        return !original || JSON.stringify(original.value) !== JSON.stringify(setting.value);
      });

      for (const [key, setting] of changedSettings) {
        const config = settingsConfig
          .flatMap(c => c.settings)
          .find(s => s.key === key);

        const { error } = await supabase
          .from('system_settings')
          .upsert({
            key,
            value: setting.value,
            description: config?.description || setting.description,
          }, { onConflict: 'key' });

        if (error) throw error;
      }

      toast.success('Einstellungen gespeichert');
      setOriginalSettings(JSON.parse(JSON.stringify(settings)));
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Fehler beim Speichern');
    } finally {
      setSaving(false);
    }
  }

  function getValue(key: string, defaultValue: string | number | boolean) {
    return settings[key]?.value ?? defaultValue;
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">System-Einstellungen</h1>
          <p className="text-muted-foreground">
            Globale Bonus- und Systemeinstellungen verwalten
          </p>
        </div>
        <Button 
          onClick={saveSettings} 
          disabled={!hasChanges || saving}
          className="gap-2"
        >
          {saving ? (
            <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Speichern
        </Button>
      </div>

      {hasChanges && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">Ungespeicherte Änderungen vorhanden</span>
        </div>
      )}

      {/* Settings Cards */}
      <div className="grid gap-6">
        {settingsConfig.map(category => (
          <Card key={category.category}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10">
                  <category.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>{category.title}</CardTitle>
                  <CardDescription>
                    Einstellungen für {category.title.toLowerCase()}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {category.settings.map(setting => (
                <div key={setting.key} className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <Label htmlFor={setting.key} className="font-medium">
                      {setting.label}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {setting.description}
                    </p>
                  </div>
                  {setting.type === 'boolean' ? (
                    <Switch
                      id={setting.key}
                      checked={getValue(setting.key, false) === true}
                      onCheckedChange={(checked) => updateSetting(setting.key, checked)}
                    />
                  ) : (
                    <Input
                      id={setting.key}
                      type="number"
                      min={0}
                      className="w-24"
                      value={getValue(setting.key, 0) as number}
                      onChange={(e) => updateSetting(setting.key, parseInt(e.target.value) || 0)}
                    />
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bonus Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-accent" />
            Bonus-Übersicht
          </CardTitle>
          <CardDescription>
            Alle Taler-Vergabemöglichkeiten im Überblick
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="font-medium">Anmelde-Bonus</span>
              <span className="font-bold text-accent">{getValue('signup_bonus_amount', 50)} Taler</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="font-medium">Empfehlungs-Bonus (Werber)</span>
              <span className="font-bold text-accent">{getValue('referral_bonus_referrer', 25)} Taler</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="font-medium">Empfehlungs-Bonus (Geworbener)</span>
              <span className="font-bold text-accent">{getValue('referral_bonus_referred', 25)} Taler</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="font-medium">Review-Bonus</span>
              <span className="font-bold text-accent">{getValue('review_bonus_taler', 5)} Taler</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="font-medium">Täglicher Streak (5-15 Taler)</span>
              <span className="font-bold text-accent">5-15 Taler</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="font-medium">Radio hören (1min - 2h)</span>
              <span className="font-bold text-accent">1-35 Taler</span>
            </div>
          </div>
          
          <div className="mt-4 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
            <p className="text-sm text-green-600 dark:text-green-400">
              <strong>Empfohlene Balance:</strong> Die Bonus-Werte sind so konfiguriert, 
              dass regelmässige Nutzung belohnt wird, ohne dass kleine Aktionen zu viele 
              Taler generieren. Ein Reward von 100 Talern entspricht ca. 1-2 Wochen aktiver Nutzung.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
