import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings, 
  Clock, 
  Star, 
  Globe, 
  Save, 
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Info,
  RefreshCw,
  Search
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { usePartner } from '@/components/partner/PartnerGuard';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PageLoader } from '@/components/ui/loading-spinner';

interface PartnerSettings {
  review_request_enabled: boolean;
  review_request_delay_minutes: number;
  google_place_id: string | null;
  google_rating: number | null;
  google_review_count: number | null;
}

interface PlaceCandidate {
  place_id: string;
  name: string;
  formatted_address?: string;
  rating?: number;
  user_ratings_total?: number;
}

export default function PartnerSettings() {
  const { partnerInfo } = usePartner();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [settings, setSettings] = useState<PartnerSettings>({
    review_request_enabled: true,
    review_request_delay_minutes: 5,
    google_place_id: null,
    google_rating: null,
    google_review_count: null,
  });
  const [googleBusinessUrl, setGoogleBusinessUrl] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [searchResults, setSearchResults] = useState<PlaceCandidate[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [customSearchQuery, setCustomSearchQuery] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationStatus, setValidationStatus] = useState<'valid' | 'invalid' | null>(null);

  useEffect(() => {
    if (partnerInfo?.partnerId) {
      loadSettings();
    }
  }, [partnerInfo?.partnerId]);

  const loadSettings = async () => {
    if (!partnerInfo?.partnerId) return;

    try {
      const { data, error } = await supabase
        .from('partners')
        .select('review_request_enabled, review_request_delay_minutes, google_place_id, google_rating, google_review_count')
        .eq('id', partnerInfo.partnerId)
        .single();

      if (error) throw error;

      if (data) {
        setSettings({
          review_request_enabled: data.review_request_enabled ?? true,
          review_request_delay_minutes: data.review_request_delay_minutes ?? 5,
          google_place_id: data.google_place_id,
          google_rating: data.google_rating,
          google_review_count: data.google_review_count,
        });
        
        // Convert place_id to a Google Maps URL for display
        if (data.google_place_id) {
          setGoogleBusinessUrl(`https://www.google.com/maps/place/?q=place_id:${data.google_place_id}`);
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Einstellungen konnten nicht geladen werden');
    } finally {
      setIsLoading(false);
    }
  };

  const extractPlaceIdFromUrl = (url: string): string | null => {
    // Try to extract place_id from various Google URLs
    // Format 1: https://www.google.com/maps/place/?q=place_id:ChIJ...
    const placeIdMatch = url.match(/place_id[=:]([A-Za-z0-9_-]+)/);
    if (placeIdMatch) return placeIdMatch[1];

    // Format 2: https://maps.google.com/?cid=... (CID format - we'll use the URL as-is)
    const cidMatch = url.match(/cid=(\d+)/);
    if (cidMatch) return `CID:${cidMatch[1]}`;

    // Format 3: Just the place_id directly
    if (url.match(/^[A-Za-z0-9_-]{20,}$/)) return url;

    return null;
  };

  const handleSave = async () => {
    if (!partnerInfo?.partnerId) return;

    setIsSaving(true);
    try {
      // Extract place_id from URL if provided
      let placeId = settings.google_place_id;
      if (googleBusinessUrl && googleBusinessUrl !== `https://www.google.com/maps/place/?q=place_id:${settings.google_place_id}`) {
        const extracted = extractPlaceIdFromUrl(googleBusinessUrl);
        if (extracted) {
          placeId = extracted;
        } else if (googleBusinessUrl.includes('google.com/maps')) {
          // Store the full URL if we can't extract place_id
          placeId = googleBusinessUrl;
        }
      }

      const { error } = await supabase
        .from('partners')
        .update({
          review_request_enabled: settings.review_request_enabled,
          review_request_delay_minutes: settings.review_request_delay_minutes,
          google_place_id: placeId,
        })
        .eq('id', partnerInfo.partnerId);

      if (error) throw error;

      toast.success('Einstellungen gespeichert!');
      setHasChanges(false);
      setSettings(prev => ({ ...prev, google_place_id: placeId }));
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Fehler beim Speichern');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSyncGoogleReviews = async () => {
    if (!partnerInfo?.partnerId || !settings.google_place_id) return;

    setIsSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-google-reviews', {
        body: {
          action: 'sync-single',
          partnerId: partnerInfo.partnerId,
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(`Synchronisiert! Rating: ${data.rating?.toFixed(1) || '-'} ⭐, ${data.reviewCount || 0} Bewertungen`);
        // Reload settings to get updated values
        await loadSettings();
      } else {
        throw new Error(data?.error || 'Sync fehlgeschlagen');
      }
    } catch (error) {
      console.error('Error syncing Google reviews:', error);
      toast.error('Sync fehlgeschlagen. Prüfe die Google Place ID.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSearchPlace = async (customQuery?: string) => {
    const query = customQuery || customSearchQuery || partnerInfo?.partnerName;
    if (!query) return;

    setIsSearching(true);
    setSearchResults([]);
    try {
      const { data, error } = await supabase.functions.invoke('search-place-id', {
        body: {
          name: query,
        },
      });

      if (error) throw error;

      if (data?.success && data.results && data.results.length > 0) {
        setSearchResults(data.results.map((r: any) => ({
          place_id: r.place_id,
          name: r.name,
          formatted_address: r.formatted_address,
          rating: r.rating,
          user_ratings_total: r.user_ratings_total,
        })));
        toast.success(`${data.results.length} Ergebnis(se) gefunden`);
      } else {
        toast.info('Kein Geschäft gefunden. Versuche einen anderen Suchbegriff.');
      }
    } catch (error) {
      console.error('Error searching place:', error);
      toast.error('Suche fehlgeschlagen');
    } finally {
      setIsSearching(false);
    }
  };

  // Auto-search using partner details (name, address, city)
  const handleAutoSearchPlace = async () => {
    if (!partnerInfo?.partnerId) return;

    setIsSearching(true);
    setSearchResults([]);
    try {
      // First fetch partner details
      const { data: partner, error: partnerError } = await supabase
        .from('partners')
        .select('name, address_street, address_number, postal_code, city, country')
        .eq('id', partnerInfo.partnerId)
        .single();

      if (partnerError) throw partnerError;

      const { data, error } = await supabase.functions.invoke('search-place-id', {
        body: {
          name: partner.name,
          address_street: partner.address_street || undefined,
          address_number: partner.address_number || undefined,
          postal_code: partner.postal_code || undefined,
          city: partner.city || undefined,
          country: partner.country || 'CH',
        },
      });

      if (error) throw error;

      if (data?.success && data.results && data.results.length > 0) {
        setSearchResults(data.results.map((r: any) => ({
          place_id: r.place_id,
          name: r.name,
          formatted_address: r.formatted_address,
          rating: r.rating,
          user_ratings_total: r.user_ratings_total,
        })));
        toast.success(`${data.results.length} Ergebnis(se) basierend auf deinen Firmendaten gefunden`);
      } else {
        toast.info('Kein Geschäft gefunden. Versuche die manuelle Suche.');
      }
    } catch (error) {
      console.error('Error auto-searching place:', error);
      toast.error('Auto-Suche fehlgeschlagen');
    } finally {
      setIsSearching(false);
    }
  };

  const handleValidatePlaceId = async () => {
    if (!settings.google_place_id) return;

    setIsValidating(true);
    setValidationStatus(null);
    try {
      const { data, error } = await supabase.functions.invoke('sync-google-reviews', {
        body: {
          action: 'sync-single',
          partnerId: partnerInfo?.partnerId,
        },
      });

      if (error) throw error;

      if (data?.success && data?.rating) {
        setValidationStatus('valid');
        toast.success(`Place ID ist gültig! Rating: ${data.rating?.toFixed(1)} ⭐`);
        await loadSettings();
      } else {
        setValidationStatus('invalid');
        toast.error('Place ID ist ungültig oder das Geschäft wurde nicht gefunden');
      }
    } catch (error) {
      console.error('Error validating place ID:', error);
      setValidationStatus('invalid');
      toast.error('Validierung fehlgeschlagen - Place ID prüfen');
    } finally {
      setIsValidating(false);
    }
  };

  const handleSelectPlace = (candidate: PlaceCandidate) => {
    setGoogleBusinessUrl(candidate.place_id);
    setSettings(prev => ({
      ...prev,
      google_place_id: candidate.place_id,
      google_rating: candidate.rating || null,
      google_review_count: candidate.user_ratings_total || null,
    }));
    setSearchResults([]);
    setCustomSearchQuery('');
    setValidationStatus(null);
    setHasChanges(true);
    toast.success(`${candidate.name} ausgewählt`);
  };

  const handleSettingChange = <K extends keyof PartnerSettings>(
    key: K,
    value: PartnerSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  if (isLoading) {
    return <PageLoader />;
  }

  const delayLabels: Record<number, string> = {
    0: 'Sofort',
    5: '5 Minuten',
    10: '10 Minuten',
    15: '15 Minuten',
    30: '30 Minuten',
    60: '1 Stunde',
    120: '2 Stunden',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-accent/20 to-warning/20">
            <Settings className="h-6 w-6 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Einstellungen</h1>
            <p className="text-sm text-muted-foreground">
              Konfiguriere dein Partner-Profil
            </p>
          </div>
        </div>

        {hasChanges && (
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'Speichern...' : 'Speichern'}
          </Button>
        )}
      </motion.div>

      {/* Review Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Bewertungsanfragen
            </CardTitle>
            <CardDescription>
              Steuere, wie und wann Kunden nach einer Einlösung um eine Bewertung gebeten werden.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Enable/Disable */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="review-enabled" className="text-base font-medium">
                  Bewertungsanfragen aktivieren
                </Label>
                <p className="text-sm text-muted-foreground">
                  Kunden werden nach einer Einlösung zur Bewertung aufgefordert
                </p>
              </div>
              <Switch
                id="review-enabled"
                checked={settings.review_request_enabled}
                onCheckedChange={(checked) => handleSettingChange('review_request_enabled', checked)}
              />
            </div>

            {/* Delay Setting */}
            {settings.review_request_enabled && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4 pt-4 border-t"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2 text-base font-medium">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      Verzögerung nach Einlösung
                    </Label>
                     <span className="text-sm font-semibold text-accent bg-accent/10 px-3 py-1 rounded-full">
                      {delayLabels[settings.review_request_delay_minutes] || `${settings.review_request_delay_minutes} Min.`}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Wie lange nach der Einlösung soll die Bewertungsanfrage erscheinen?
                  </p>
                </div>

                <Slider
                  value={[settings.review_request_delay_minutes]}
                  onValueChange={([value]) => handleSettingChange('review_request_delay_minutes', value)}
                  min={0}
                  max={120}
                  step={5}
                  className="py-4"
                />

                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Sofort</span>
                  <span>30 Min</span>
                  <span>1 Std</span>
                  <span>2 Std</span>
                </div>

                {/* Info Box */}
                <div className="flex items-start gap-3 p-4 rounded-xl bg-accent/50 border border-accent">
                  <Info className="h-5 w-5 text-accent-foreground shrink-0 mt-0.5" />
                  <div className="text-sm text-accent-foreground">
                    <p className="font-medium mb-1">Empfehlung</p>
                    <p className="opacity-80">
                      5-15 Minuten sind ideal – genug Zeit damit der Kunde das Erlebnis genossen hat, 
                      aber noch frisch in Erinnerung.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Google Business Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-blue-500" />
              Google Business Profil
            </CardTitle>
            <CardDescription>
              Verknüpfe dein Google Business Profil um Bewertungen direkt dorthin zu leiten.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Current Status */}
            {settings.google_place_id ? (
              <div className={`flex items-start gap-3 p-4 rounded-xl border ${
                validationStatus === 'invalid' 
                  ? 'bg-destructive/10 border-destructive/30'
                  : 'bg-success/10 border-success/30'
              }`}>
                {validationStatus === 'invalid' ? (
                  <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className={`font-medium ${validationStatus === 'invalid' ? 'text-destructive' : 'text-success'}`}>
                    {validationStatus === 'invalid' ? 'Place ID ungültig - bitte korrigieren' : 'Google Business verknüpft'}
                  </p>
                  <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                    {settings.google_rating && validationStatus !== 'invalid' && (
                      <span className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        {settings.google_rating.toFixed(1)}
                      </span>
                    )}
                    {settings.google_review_count !== null && validationStatus !== 'invalid' && (
                      <span>{settings.google_review_count} Bewertungen</span>
                    )}
                    {validationStatus === 'invalid' && (
                      <span className="text-destructive">Suche unten nach dem richtigen Geschäft</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 font-mono truncate">
                    ID: {settings.google_place_id.substring(0, 30)}...
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleValidatePlaceId}
                    disabled={isValidating}
                    className="gap-1"
                    title="Place ID validieren"
                  >
                    {isValidating ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    Prüfen
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSyncGoogleReviews}
                    disabled={isSyncing}
                    className="gap-1"
                  >
                    <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                    Sync
                  </Button>
                  <a
                    href={`https://search.google.com/local/writereview?placeid=${settings.google_place_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-accent hover:underline"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-warning/10 border border-warning/30">
                <AlertCircle className="h-5 w-5 text-warning shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-warning">Noch nicht verknüpft</p>
                  <p className="text-sm text-muted-foreground">
                    Nutze die Auto-Suche basierend auf deinen Firmendaten.
                  </p>
                </div>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleAutoSearchPlace}
                  disabled={isSearching}
                  className="gap-1 bg-accent text-accent-foreground hover:bg-accent/90"
                >
                  <Search className={`h-4 w-4 ${isSearching ? 'animate-pulse' : ''}`} />
                  Auto-Suche
                </Button>
              </div>
            )}

            {/* Auto Search Button (when already connected but want to re-search) */}
            {settings.google_place_id && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAutoSearchPlace}
                  disabled={isSearching}
                  className="gap-1"
                >
                  <Search className={`h-4 w-4 ${isSearching ? 'animate-pulse' : ''}`} />
                  Neu suchen (basierend auf Firmendaten)
                </Button>
              </div>
            )}

            {/* Custom Search */}
            <div className="space-y-2">
              <Label>Oder manuell suchen</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="z.B. 'Café Sonnenschein Aarau' oder 'Aargauer Kunsthaus'"
                  value={customSearchQuery}
                  onChange={(e) => setCustomSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchPlace()}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  onClick={() => handleSearchPlace()}
                  disabled={isSearching || !customSearchQuery.trim()}
                >
                  <Search className={`h-4 w-4 ${isSearching ? 'animate-pulse' : ''}`} />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Falls die Auto-Suche nicht passt, gib den Namen und Ort manuell ein.
              </p>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-2"
              >
                <Label>Suchergebnisse - Wähle dein Geschäft:</Label>
                <div className="space-y-2">
                  {searchResults.map((candidate) => (
                    <button
                      key={candidate.place_id}
                      onClick={() => handleSelectPlace(candidate)}
                      className="w-full text-left p-3 rounded-xl border border-border hover:border-primary hover:bg-accent/50 transition-all"
                    >
                      <p className="font-medium">{candidate.name}</p>
                      {candidate.formatted_address && (
                        <p className="text-sm text-muted-foreground truncate">{candidate.formatted_address}</p>
                      )}
                      <div className="flex items-center gap-3 mt-1 text-sm">
                        {candidate.rating && (
                          <span className="flex items-center gap-1 text-yellow-600">
                            <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                            {candidate.rating.toFixed(1)}
                          </span>
                        )}
                        {candidate.user_ratings_total && (
                          <span className="text-muted-foreground">
                            {candidate.user_ratings_total} Bewertungen
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* URL Input */}
            <div className="space-y-2">
              <Label htmlFor="google-url">Google Business URL oder Place ID</Label>
              <div className="flex gap-2">
                <Input
                  id="google-url"
                  placeholder="https://www.google.com/maps/place/..."
                  value={googleBusinessUrl}
                  onChange={(e) => {
                    setGoogleBusinessUrl(e.target.value);
                    setHasChanges(true);
                  }}
                  className="flex-1"
                />
                {settings.google_place_id && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleSyncGoogleReviews}
                    disabled={isSyncing}
                    title="Bewertungen synchronisieren"
                  >
                    <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Kopiere die URL aus Google Maps oder nutze die automatische Suche.
              </p>
            </div>

            {/* How to find URL */}
            <details className="group">
              <summary className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors">
                <Info className="h-4 w-4" />
                <span>Wie finde ich meine Google Business URL?</span>
              </summary>
              <div className="mt-3 pl-6 space-y-2 text-sm text-muted-foreground">
                <ol className="list-decimal space-y-1 pl-4">
                  <li>Öffne <a href="https://www.google.com/maps" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google Maps</a></li>
                  <li>Suche nach deinem Geschäft</li>
                  <li>Klicke auf "Teilen" → "Link kopieren"</li>
                  <li>Füge den Link hier ein</li>
                </ol>
                <p className="mt-2">
                  <strong>Tipp:</strong> Klicke auf "Suchen" um dein Geschäft automatisch zu finden!
                </p>
              </div>
            </details>
          </CardContent>
        </Card>
      </motion.div>

      {/* Save Button (Mobile) */}
      {hasChanges && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-20 left-4 right-4 z-40"
        >
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="w-full gap-2 shadow-lg"
            size="lg"
          >
            <Save className="h-4 w-4" />
            {isSaving ? 'Speichern...' : 'Änderungen speichern'}
          </Button>
        </motion.div>
      )}
    </div>
  );
}