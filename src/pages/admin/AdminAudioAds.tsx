import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  Plus, 
  Play, 
  Pause, 
  Volume2, 
  Loader2, 
  Trash2, 
  Calendar,
  Mic,
  Music,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Upload,
  FileAudio,
  Target,
  MapPin,
  Users,
  Radio
} from 'lucide-react';
import AudioAdScheduleCalendar from '@/components/admin/AudioAdScheduleCalendar';
import JingleManager from '@/components/admin/JingleManager';

interface Partner {
  id: string;
  name: string;
}

interface Voice {
  id: string;
  name: string;
}

interface AudioAd {
  id: string;
  partner_id: string;
  title: string;
  claim_text: string;
  voice_id: string;
  voice_name: string | null;
  generated_audio_url: string | null;
  generation_status: string;
  generation_error: string | null;
  duration_seconds: number | null;
  is_active: boolean;
  trigger_on_tier: boolean;
  created_at: string;
  partners?: { name: string };
  // Targeting
  target_cities: string[] | null;
  target_postal_codes: string[] | null;
  target_stations: string[] | null;
  target_age_min: number | null;
  target_age_max: number | null;
  target_subscription_tiers: string[] | null;
  target_min_streak: number | null;
  target_min_listen_hours: number | null;
}

interface Jingle {
  id: string;
  name: string;
  partner_id: string | null;
  intro_url: string | null;
  outro_url: string | null;
  is_default: boolean;
}

export default function AdminAudioAds() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [audioAds, setAudioAds] = useState<AudioAd[]>([]);
  const [jingles, setJingles] = useState<Jingle[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [generating, setGenerating] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    partnerId: '',
    title: '',
    claimText: '',
    voiceId: 'JBFqnCBsd6RMkjVDRZzb',
    triggerOnTier: false,
    jingleId: '',
    useUploadedAudio: false,
    // Targeting
    targetCities: '',
    targetPostalCodes: '',
    targetAgeMin: '',
    targetAgeMax: '',
    targetSubscriptionTiers: [] as string[],
    targetMinStreak: '',
    targetMinListenHours: '',
  });
  const [uploadedClaimFile, setUploadedClaimFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showTargeting, setShowTargeting] = useState(false);

  useEffect(() => {
    loadData();
    loadVoices();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load partners
      const { data: partnersData } = await supabase
        .from('partners')
        .select('id, name')
        .eq('is_active', true)
        .order('name');
      
      setPartners(partnersData || []);

      // Load audio ads with partner info
      const { data: adsData } = await supabase
        .from('audio_ads')
        .select('*, partners(name)')
        .order('created_at', { ascending: false });
      
      setAudioAds(adsData || []);

      // Load jingles
      const { data: jinglesData } = await supabase
        .from('audio_jingles')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      setJingles(jinglesData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Fehler beim Laden der Daten');
    } finally {
      setLoading(false);
    }
  };

  const loadVoices = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-audio-ad`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ action: 'list-voices' }),
        }
      );
      const data = await response.json();
      if (data.voices) {
        setVoices(data.voices);
      }
    } catch (error) {
      console.error('Error loading voices:', error);
    }
  };

  const handlePreview = async () => {
    if (!formData.claimText.trim()) {
      toast.error('Bitte gib einen Text ein');
      return;
    }

    setPreviewLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-audio-ad`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            action: 'preview',
            text: formData.claimText,
            voiceId: formData.voiceId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Preview generation failed');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play();
      }
      
      toast.success('Vorschau wird abgespielt');
    } catch (error) {
      console.error('Preview error:', error);
      toast.error('Fehler bei der Vorschau');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.partnerId || !formData.title) {
      toast.error('Bitte fülle alle Pflichtfelder aus');
      return;
    }

    // Require either claim text (for TTS) or uploaded file
    if (!formData.useUploadedAudio && !formData.claimText.trim()) {
      toast.error('Bitte gib einen Werbetext ein');
      return;
    }

    if (formData.useUploadedAudio && !uploadedClaimFile) {
      toast.error('Bitte wähle eine Audio-Datei aus');
      return;
    }

    setCreating(true);
    try {
      let uploadedClaimUrl: string | null = null;

      // Upload claim audio if using uploaded file
      if (formData.useUploadedAudio && uploadedClaimFile) {
        setUploading(true);
        const uploadPath = `claims/${Date.now()}_${uploadedClaimFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from('audio-ads')
          .upload(uploadPath, uploadedClaimFile, { contentType: uploadedClaimFile.type });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('audio-ads')
          .getPublicUrl(uploadPath);
        uploadedClaimUrl = urlData.publicUrl;
        setUploading(false);
      }

      const selectedVoice = voices.find(v => v.id === formData.voiceId);
      
      // Prepare targeting arrays
      const targetCities = formData.targetCities.trim() 
        ? formData.targetCities.split(',').map(s => s.trim()).filter(Boolean)
        : null;
      const targetPostalCodes = formData.targetPostalCodes.trim()
        ? formData.targetPostalCodes.split(',').map(s => s.trim()).filter(Boolean)
        : null;
      const targetSubscriptionTiers = formData.targetSubscriptionTiers.length > 0
        ? formData.targetSubscriptionTiers
        : null;

      const { data, error } = await supabase
        .from('audio_ads')
        .insert({
          partner_id: formData.partnerId,
          title: formData.title,
          claim_text: formData.claimText || '(Hochgeladener Spot)',
          voice_id: formData.voiceId,
          voice_name: selectedVoice?.name || null,
          trigger_on_tier: formData.triggerOnTier,
          jingle_id: formData.jingleId || null,
          uploaded_claim_url: uploadedClaimUrl,
          // Targeting
          target_cities: targetCities,
          target_postal_codes: targetPostalCodes,
          target_age_min: formData.targetAgeMin ? parseInt(formData.targetAgeMin) : null,
          target_age_max: formData.targetAgeMax ? parseInt(formData.targetAgeMax) : null,
          target_subscription_tiers: targetSubscriptionTiers,
          target_min_streak: formData.targetMinStreak ? parseInt(formData.targetMinStreak) : null,
          target_min_listen_hours: formData.targetMinListenHours ? parseInt(formData.targetMinListenHours) : null,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Audio-Ad erstellt! Generiere jetzt...');
      setDialogOpen(false);
      setFormData({
        partnerId: '',
        title: '',
        claimText: '',
        voiceId: 'JBFqnCBsd6RMkjVDRZzb',
        triggerOnTier: false,
        jingleId: '',
        useUploadedAudio: false,
        targetCities: '',
        targetPostalCodes: '',
        targetAgeMin: '',
        targetAgeMax: '',
        targetSubscriptionTiers: [],
        targetMinStreak: '',
        targetMinListenHours: '',
      });
      setUploadedClaimFile(null);
      setShowTargeting(false);
      
      // Reload and generate
      await loadData();
      if (data) {
        handleGenerate(data.id);
      }
    } catch (error) {
      console.error('Create error:', error);
      toast.error('Fehler beim Erstellen');
    } finally {
      setCreating(false);
      setUploading(false);
    }
  };

  const handleGenerate = async (adId: string) => {
    setGenerating(adId);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-audio-ad`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            action: 'generate',
            audioAdId: adId,
          }),
        }
      );

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      toast.success('Audio erfolgreich generiert!');
      loadData();
    } catch (error) {
      console.error('Generate error:', error);
      toast.error('Fehler bei der Generierung');
    } finally {
      setGenerating(null);
    }
  };

  const handleDelete = async (adId: string) => {
    if (!confirm('Audio-Ad wirklich löschen?')) return;

    try {
      const { error } = await supabase
        .from('audio_ads')
        .delete()
        .eq('id', adId);

      if (error) throw error;

      toast.success('Audio-Ad gelöscht');
      loadData();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Fehler beim Löschen');
    }
  };

  const togglePlay = (ad: AudioAd) => {
    if (!ad.generated_audio_url) return;

    if (playingId === ad.id) {
      audioRef.current?.pause();
      setPlayingId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.src = ad.generated_audio_url;
        audioRef.current.play();
        setPlayingId(ad.id);
      }
    }
  };

  const toggleActive = async (ad: AudioAd) => {
    try {
      const { error } = await supabase
        .from('audio_ads')
        .update({ is_active: !ad.is_active })
        .eq('id', ad.id);

      if (error) throw error;

      setAudioAds(prev => prev.map(a => 
        a.id === ad.id ? { ...a, is_active: !a.is_active } : a
      ));
    } catch (error) {
      console.error('Toggle error:', error);
      toast.error('Fehler beim Aktualisieren');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" /> Bereit</Badge>;
      case 'generating':
        return <Badge className="bg-yellow-500"><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Generiert...</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> Fehler</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" /> Ausstehend</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hidden audio element */}
      <audio ref={audioRef} onEnded={() => setPlayingId(null)} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Volume2 className="h-6 w-6" />
            Taler-Alarm Audio-Ads
          </h1>
          <p className="text-muted-foreground">
            Erstelle und verwalte automatisierte Partner-Werbespots
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Neue Audio-Ad
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Mic className="h-5 w-5" />
                Neue Audio-Ad erstellen
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 pt-4">
              {/* Partner */}
              <div className="space-y-2">
                <Label>Partner *</Label>
                <Select 
                  value={formData.partnerId} 
                  onValueChange={(v) => setFormData({ ...formData, partnerId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Partner auswählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {partners.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <Label>Titel *</Label>
                <Input
                  placeholder="z.B. Sommer-Aktion Kaffee"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              {/* Audio Source Toggle */}
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  {formData.useUploadedAudio ? (
                    <FileAudio className="h-4 w-4 text-primary" />
                  ) : (
                    <Mic className="h-4 w-4 text-primary" />
                  )}
                  <div>
                    <Label>Audio-Quelle</Label>
                    <p className="text-xs text-muted-foreground">
                      {formData.useUploadedAudio ? 'Fertiger Spot (MP3)' : 'TTS-Generierung'}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={formData.useUploadedAudio}
                  onCheckedChange={(v) => setFormData({ ...formData, useUploadedAudio: v })}
                />
              </div>

              {/* Upload Claim Audio OR TTS Options */}
              {formData.useUploadedAudio ? (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    Audio-Spot hochladen *
                  </Label>
                  <Input
                    type="file"
                    accept="audio/*"
                    onChange={(e) => setUploadedClaimFile(e.target.files?.[0] || null)}
                  />
                  {uploadedClaimFile && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <FileAudio className="h-3 w-3" />
                      {uploadedClaimFile.name}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Lade einen fertigen Werbespot hoch (MP3, WAV, etc.)
                  </p>
                </div>
              ) : (
                <>
                  {/* Claim Text */}
                  <div className="space-y-2">
                    <Label>Werbetext (Claim) *</Label>
                    <Textarea
                      placeholder="Der Text, der gesprochen wird..."
                      rows={3}
                      value={formData.claimText}
                      onChange={(e) => setFormData({ ...formData, claimText: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Tipp: Halte den Text kurz und prägnant (max. 30 Sekunden)
                    </p>
                  </div>

                  {/* Voice Selection */}
                  <div className="space-y-2">
                    <Label>Stimme</Label>
                    <Select 
                      value={formData.voiceId} 
                      onValueChange={(v) => setFormData({ ...formData, voiceId: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {voices.map((v) => (
                          <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {/* Jingle Selection */}
              {jingles.length > 0 && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Music className="h-4 w-4" />
                    Verpackung (Jingle)
                  </Label>
                  <Select 
                    value={formData.jingleId} 
                    onValueChange={(v) => setFormData({ ...formData, jingleId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Optional: Jingle auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Kein Jingle</SelectItem>
                      {jingles.map((j) => (
                        <SelectItem key={j.id} value={j.id}>
                          {j.name} {j.is_default && '(Standard)'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Trigger on Tier */}
              <div className="flex items-center justify-between">
                <div>
                  <Label>Bei Tier-Erreichung abspielen</Label>
                  <p className="text-xs text-muted-foreground">
                    Zusätzlich zum Zeitplan
                  </p>
                </div>
                <Switch
                  checked={formData.triggerOnTier}
                  onCheckedChange={(v) => setFormData({ ...formData, triggerOnTier: v })}
                />
              </div>

              {/* Targeting Section */}
              <div className="border-t pt-4">
                <button
                  type="button"
                  onClick={() => setShowTargeting(!showTargeting)}
                  className="flex items-center justify-between w-full text-left"
                >
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-primary" />
                    <div>
                      <Label className="cursor-pointer">Zielgruppen-Targeting</Label>
                      <p className="text-xs text-muted-foreground">
                        Optional: Nach Location, Alter, Verhalten filtern
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {showTargeting ? 'Ausblenden' : 'Einblenden'}
                  </Badge>
                </button>

                {showTargeting && (
                  <div className="mt-4 space-y-4 p-3 bg-muted/50 rounded-lg">
                    {/* Location Targeting */}
                    <div className="space-y-2">
                      <Label className="flex items-center gap-1 text-sm">
                        <MapPin className="h-3 w-3" />
                        Städte (kommagetrennt)
                      </Label>
                      <Input
                        placeholder="z.B. Zürich, Bern, Basel"
                        value={formData.targetCities}
                        onChange={(e) => setFormData({ ...formData, targetCities: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm">PLZ-Präfixe (kommagetrennt)</Label>
                      <Input
                        placeholder="z.B. 80, 81, 90"
                        value={formData.targetPostalCodes}
                        onChange={(e) => setFormData({ ...formData, targetPostalCodes: e.target.value })}
                      />
                    </div>

                    {/* Age Targeting */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="flex items-center gap-1 text-sm">
                          <Users className="h-3 w-3" />
                          Alter min
                        </Label>
                        <Input
                          type="number"
                          placeholder="18"
                          value={formData.targetAgeMin}
                          onChange={(e) => setFormData({ ...formData, targetAgeMin: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-sm">Alter max</Label>
                        <Input
                          type="number"
                          placeholder="65"
                          value={formData.targetAgeMax}
                          onChange={(e) => setFormData({ ...formData, targetAgeMax: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* Subscription Targeting */}
                    <div className="space-y-2">
                      <Label className="text-sm">Abo-Status</Label>
                      <div className="flex gap-2 flex-wrap">
                        {['free', 'plus', 'trial'].map((tier) => (
                          <Badge
                            key={tier}
                            variant={formData.targetSubscriptionTiers.includes(tier) ? 'default' : 'outline'}
                            className="cursor-pointer"
                            onClick={() => {
                              const tiers = formData.targetSubscriptionTiers.includes(tier)
                                ? formData.targetSubscriptionTiers.filter(t => t !== tier)
                                : [...formData.targetSubscriptionTiers, tier];
                              setFormData({ ...formData, targetSubscriptionTiers: tiers });
                            }}
                          >
                            {tier === 'free' ? 'Gratis' : tier === 'plus' ? 'Plus' : 'Trial'}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Behavior Targeting */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="flex items-center gap-1 text-sm">
                          <Radio className="h-3 w-3" />
                          Min. Streak (Tage)
                        </Label>
                        <Input
                          type="number"
                          placeholder="7"
                          value={formData.targetMinStreak}
                          onChange={(e) => setFormData({ ...formData, targetMinStreak: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-sm">Min. Hörzeit (Std)</Label>
                        <Input
                          type="number"
                          placeholder="10"
                          value={formData.targetMinListenHours}
                          onChange={(e) => setFormData({ ...formData, targetMinListenHours: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Preview Button - only for TTS mode */}
              {!formData.useUploadedAudio && (
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={handlePreview}
                  disabled={!formData.claimText.trim() || previewLoading}
                >
                  {previewLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  Vorschau anhören
                </Button>
              )}

              {/* Create Button */}
              <Button 
                className="w-full"
                onClick={handleCreate}
                disabled={
                  creating || 
                  uploading ||
                  !formData.partnerId || 
                  !formData.title || 
                  (formData.useUploadedAudio ? !uploadedClaimFile : !formData.claimText.trim())
                }
              >
                {creating || uploading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                {uploading ? 'Lade hoch...' : 'Erstellen & Generieren'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="ads">
        <TabsList>
          <TabsTrigger value="ads">Audio-Ads ({audioAds.length})</TabsTrigger>
          <TabsTrigger value="jingles">Jingles ({jingles.length})</TabsTrigger>
          <TabsTrigger value="schedule">
            <Calendar className="h-4 w-4 mr-1" />
            Zeitplan
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ads" className="mt-4">
          {audioAds.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Volume2 className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Noch keine Audio-Ads erstellt</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setDialogOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Erste Audio-Ad erstellen
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {audioAds.map((ad) => (
                <Card key={ad.id} className={!ad.is_active ? 'opacity-60' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold truncate">{ad.title}</h3>
                          {getStatusBadge(ad.generation_status)}
                          {ad.trigger_on_tier && (
                            <Badge variant="outline">Tier-Trigger</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {ad.partners?.name}
                        </p>
                        <p className="text-sm line-clamp-2">{ad.claim_text}</p>
                        {ad.duration_seconds && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Dauer: ~{ad.duration_seconds}s • Stimme: {ad.voice_name || 'Standard'}
                          </p>
                        )}
                        {ad.generation_error && (
                          <p className="text-xs text-destructive mt-1">{ad.generation_error}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Play Button */}
                        {ad.generated_audio_url && (
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => togglePlay(ad)}
                          >
                            {playingId === ad.id ? (
                              <Pause className="h-4 w-4" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                          </Button>
                        )}

                        {/* Regenerate Button */}
                        {(ad.generation_status === 'failed' || ad.generation_status === 'pending') && (
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => handleGenerate(ad.id)}
                            disabled={generating === ad.id}
                          >
                            {generating === ad.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <RefreshCw className="h-4 w-4" />
                            )}
                          </Button>
                        )}

                        {/* Active Toggle */}
                        <Switch
                          checked={ad.is_active}
                          onCheckedChange={() => toggleActive(ad)}
                        />

                        {/* Delete Button */}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => handleDelete(ad.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="jingles" className="mt-4">
          <JingleManager onRefresh={loadData} />
        </TabsContent>

        <TabsContent value="schedule" className="mt-4">
          <AudioAdScheduleCalendar 
            audioAds={audioAds} 
            onRefresh={loadData} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
