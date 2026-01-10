import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Star, 
  MessageSquare, 
  ExternalLink, 
  TrendingUp,
  ThumbsUp,
  ThumbsDown,
  Settings,
  Save,
  AlertCircle,
  RefreshCw,
  Info,
  CheckCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { usePartner } from '@/components/partner/PartnerGuard';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { GoogleReviewCard } from '@/components/partner/GoogleReviewBadge';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { toast } from 'sonner';

interface ReviewRequest {
  id: string;
  in_app_rating: number | null;
  review_clicked: boolean;
  feedback_text: string | null;
  created_at: string;
}

interface ReviewStats {
  totalRequests: number;
  averageRating: number;
  positiveCount: number;
  negativeCount: number;
  reviewClickCount: number;
  conversionRate: number;
}

interface PartnerData {
  google_place_id: string | null;
  google_rating: number | null;
  google_review_count: number | null;
  review_request_enabled: boolean | null;
  review_request_delay_minutes: number | null;
}

export default function PartnerReviews() {
  const { partnerInfo } = usePartner();
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [settings, setSettings] = useState({
    googlePlaceId: '',
    reviewRequestEnabled: true,
    reviewRequestDelayMinutes: 5,
  });

  // Fetch partner data including Google Place ID
  const { data: partnerData, isLoading: partnerLoading, refetch: refetchPartner } = useQuery({
    queryKey: ['partner-data', partnerInfo?.partnerId],
    queryFn: async () => {
      if (!partnerInfo?.partnerId) return null;

      const { data, error } = await supabase
        .from('partners')
        .select('google_place_id, google_rating, google_review_count, review_request_enabled, review_request_delay_minutes')
        .eq('id', partnerInfo.partnerId)
        .single();

      if (error) throw error;
      return data as PartnerData;
    },
    enabled: !!partnerInfo?.partnerId,
  });

  // Load settings from partner data
  useEffect(() => {
    if (partnerData) {
      setSettings({
        googlePlaceId: partnerData.google_place_id || '',
        reviewRequestEnabled: partnerData.review_request_enabled ?? true,
        reviewRequestDelayMinutes: partnerData.review_request_delay_minutes ?? 5,
      });
    }
  }, [partnerData]);

  // Fetch review statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['partner-review-stats', partnerInfo?.partnerId],
    queryFn: async () => {
      if (!partnerInfo?.partnerId) return null;

      const { data, error } = await supabase
        .from('review_requests')
        .select('in_app_rating, review_clicked')
        .eq('partner_id', partnerInfo.partnerId);

      if (error) throw error;

      const requests = data || [];
      const totalRequests = requests.length;
      const ratingsWithValue = requests.filter(r => r.in_app_rating !== null);
      const positiveCount = ratingsWithValue.filter(r => (r.in_app_rating || 0) >= 4).length;
      const negativeCount = ratingsWithValue.filter(r => (r.in_app_rating || 0) < 4).length;
      const reviewClickCount = requests.filter(r => r.review_clicked).length;
      const averageRating = ratingsWithValue.length > 0
        ? ratingsWithValue.reduce((sum, r) => sum + (r.in_app_rating || 0), 0) / ratingsWithValue.length
        : 0;
      const conversionRate = positiveCount > 0 
        ? (reviewClickCount / positiveCount) * 100 
        : 0;

      return {
        totalRequests,
        averageRating,
        positiveCount,
        negativeCount,
        reviewClickCount,
        conversionRate,
      } as ReviewStats;
    },
    enabled: !!partnerInfo?.partnerId,
  });

  // Fetch feedback (negative reviews)
  const { data: feedback, isLoading: feedbackLoading } = useQuery({
    queryKey: ['partner-review-feedback', partnerInfo?.partnerId],
    queryFn: async () => {
      if (!partnerInfo?.partnerId) return [];

      const { data, error } = await supabase
        .from('review_requests')
        .select('id, in_app_rating, feedback_text, created_at')
        .eq('partner_id', partnerInfo.partnerId)
        .not('feedback_text', 'is', null)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data as ReviewRequest[];
    },
    enabled: !!partnerInfo?.partnerId,
  });

  const handleSaveSettings = async () => {
    if (!partnerInfo?.partnerId) return;

    // Validate Google Place ID format if provided
    if (settings.googlePlaceId && !settings.googlePlaceId.startsWith('ChIJ')) {
      toast.error('Google Place ID muss mit "ChIJ" beginnen');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('partners')
        .update({
          google_place_id: settings.googlePlaceId || null,
          review_request_enabled: settings.reviewRequestEnabled,
          review_request_delay_minutes: settings.reviewRequestDelayMinutes,
        })
        .eq('id', partnerInfo.partnerId);

      if (error) throw error;
      toast.success('Einstellungen gespeichert');
      refetchPartner();
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Fehler beim Speichern');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSyncGoogleReviews = async () => {
    if (!partnerData?.google_place_id) {
      toast.error('Bitte zuerst eine Google Place ID eintragen');
      return;
    }

    setIsSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-google-reviews');
      
      if (error) throw error;
      
      toast.success('Google Reviews erfolgreich synchronisiert');
      refetchPartner();
    } catch (error) {
      console.error('Failed to sync Google reviews:', error);
      toast.error('Fehler beim Synchronisieren der Google Reviews');
    } finally {
      setIsSyncing(false);
    }
  };

  const isLoading = statsLoading || partnerLoading;
  const hasGooglePlaceId = !!partnerData?.google_place_id;

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Google Reviews</h1>
        <p className="text-muted-foreground">
          Verwalte Review-Anfragen und sieh Feedback deiner Kunden.
        </p>
      </div>

      {/* Missing Google Place ID Warning */}
      {!hasGooglePlaceId && (
        <Alert variant="destructive" className="border-yellow-500/50 bg-yellow-500/10">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="text-yellow-800">Google Place ID fehlt</AlertTitle>
          <AlertDescription className="text-yellow-700">
            Um Google Reviews zu synchronisieren und auf deiner Partner-Seite anzuzeigen, 
            benötigst du eine Google Place ID. Gehe zu den Einstellungen unten, um sie hinzuzufügen.
          </AlertDescription>
        </Alert>
      )}

      {/* Current Google Rating */}
      {partnerData?.google_rating && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Aktuelle Google-Bewertung
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <GoogleReviewCard
                rating={partnerData.google_rating}
                reviewCount={partnerData.google_review_count}
                googlePlaceId={partnerData.google_place_id}
              />
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleSyncGoogleReviews}
                disabled={isSyncing}
              >
                {isSyncing ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Aktualisieren
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Die Bewertungen werden täglich um 3:00 Uhr automatisch synchronisiert.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-100">
                <Star className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {stats?.averageRating.toFixed(1) || '—'}
                </p>
                <p className="text-xs text-muted-foreground">Ø In-App</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <ThumbsUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.positiveCount || 0}</p>
                <p className="text-xs text-muted-foreground">Positiv (4-5⭐)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <ExternalLink className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats?.reviewClickCount || 0}</p>
                <p className="text-xs text-muted-foreground">Google Clicks</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {stats?.conversionRate.toFixed(0) || 0}%
                </p>
                <p className="text-xs text-muted-foreground">Conversion</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue={hasGooglePlaceId ? "feedback" : "settings"} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="feedback">
            <MessageSquare className="h-4 w-4 mr-2" />
            Feedback ({feedback?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 mr-2" />
            Einstellungen
            {!hasGooglePlaceId && (
              <span className="ml-1 flex h-2 w-2 rounded-full bg-yellow-500" />
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="feedback" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Kunden-Feedback</CardTitle>
              <CardDescription>
                Anonymes Feedback von Kunden mit weniger als 4 Sternen
              </CardDescription>
            </CardHeader>
            <CardContent>
              {feedbackLoading ? (
                <div className="flex justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : !feedback || feedback.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Noch kein Feedback vorhanden.</p>
                  <p className="text-sm">Das ist eigentlich gut! 😊</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {feedback.map((item) => (
                    <div 
                      key={item.id}
                      className="p-4 rounded-lg border bg-muted/30"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-4 w-4 ${
                                star <= (item.in_app_rating || 0)
                                  ? 'text-yellow-500 fill-yellow-500'
                                  : 'text-muted-foreground/30'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(item.created_at), 'dd.MM.yyyy', { locale: de })}
                        </span>
                      </div>
                      <p className="text-sm">{item.feedback_text}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Review-Einstellungen</CardTitle>
              <CardDescription>
                Konfiguriere Google Reviews und Review-Anfragen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Google Place ID Section */}
              <div className="space-y-3 p-4 rounded-lg border bg-muted/30">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  <Label className="text-base font-semibold">Google Reviews</Label>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="google-place-id">Google Place ID</Label>
                  <Input
                    id="google-place-id"
                    value={settings.googlePlaceId}
                    onChange={(e) => 
                      setSettings(s => ({ ...s, googlePlaceId: e.target.value.trim() }))
                    }
                    placeholder="ChIJ..."
                    className={!hasGooglePlaceId ? 'border-yellow-500' : ''}
                  />
                  <div className="flex items-start gap-2 text-xs text-muted-foreground">
                    <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    <span>
                      Deine Google Place ID findest du auf{' '}
                      <a 
                        href="https://developers.google.com/maps/documentation/places/web-service/place-id" 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Google Maps Platform
                      </a>
                      {' '}oder suche deinen Geschäftsnamen auf Google Maps und kopiere die Place ID aus der URL.
                    </span>
                  </div>
                </div>

                {hasGooglePlaceId && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span>Google Place ID konfiguriert</span>
                  </div>
                )}
              </div>

              {/* Review Request Settings */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Review-Anfragen aktiviert</Label>
                    <p className="text-sm text-muted-foreground">
                      Kunden werden nach Einlösungen um eine Bewertung gebeten
                    </p>
                  </div>
                  <Switch
                    checked={settings.reviewRequestEnabled}
                    onCheckedChange={(checked) => 
                      setSettings(s => ({ ...s, reviewRequestEnabled: checked }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="delay-minutes">Verzögerung (Minuten)</Label>
                  <Input
                    id="delay-minutes"
                    type="number"
                    min={1}
                    max={60}
                    value={settings.reviewRequestDelayMinutes}
                    onChange={(e) => 
                      setSettings(s => ({ 
                        ...s, 
                        reviewRequestDelayMinutes: parseInt(e.target.value) || 5 
                      }))
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Zeit nach Einlösung, bevor die Review-Anfrage erscheint
                  </p>
                </div>
              </div>

              <Button onClick={handleSaveSettings} disabled={isSaving} className="w-full sm:w-auto">
                {isSaving ? (
                  <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Einstellungen speichern
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
