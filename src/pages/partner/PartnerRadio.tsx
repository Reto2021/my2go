import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Radio, 
  Upload, 
  Save, 
  ExternalLink, 
  Copy, 
  Play,
  Pause,
  Music,
  Image as ImageIcon,
  Palette,
  Eye,
  BarChart3,
  Info,
  CheckCircle2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { usePartner } from '@/components/partner/PartnerGuard';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { PageLoader } from '@/components/ui/loading-spinner';

interface PartnerRadioData {
  id: string | null;
  name: string;
  slug: string;
  stream_url: string;
  preroll_audio_url: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  brand_color: string;
  description: string;
  is_active: boolean;
  enable_taler_rewards: boolean;
  play_count: number;
}

export default function PartnerRadio() {
  const { partnerInfo } = usePartner();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  
  const [radioData, setRadioData] = useState<PartnerRadioData>({
    id: null,
    name: '',
    slug: '',
    stream_url: '',
    preroll_audio_url: null,
    logo_url: null,
    cover_image_url: null,
    brand_color: '#C7A94E',
    description: '',
    is_active: true,
    enable_taler_rewards: false,
    play_count: 0,
  });

  const publicUrl = `${window.location.origin}/radio/${radioData.slug}`;

  useEffect(() => {
    if (partnerInfo?.partnerId) {
      loadRadioData();
    }
  }, [partnerInfo?.partnerId]);

  const loadRadioData = async () => {
    if (!partnerInfo?.partnerId) return;

    try {
      const { data, error } = await supabase
        .from('partner_radios')
        .select('*')
        .eq('partner_id', partnerInfo.partnerId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setRadioData({
          id: data.id,
          name: data.name,
          slug: data.slug,
          stream_url: data.stream_url,
          preroll_audio_url: data.preroll_audio_url,
          logo_url: data.logo_url,
          cover_image_url: data.cover_image_url,
          brand_color: data.brand_color || '#C7A94E',
          description: data.description || '',
          is_active: data.is_active ?? true,
          enable_taler_rewards: data.enable_taler_rewards ?? false,
          play_count: data.play_count || 0,
        });
      } else {
        // Initialize with partner info
        const { data: partner } = await supabase
          .from('partners')
          .select('name, slug, logo_url, brand_color')
          .eq('id', partnerInfo.partnerId)
          .single();
        
        if (partner) {
          setRadioData(prev => ({
            ...prev,
            name: `${partner.name} Radio`,
            slug: `${partner.slug}-radio`,
            logo_url: partner.logo_url,
            brand_color: partner.brand_color || '#C7A94E',
          }));
        }
      }
    } catch (error) {
      console.error('Error loading radio data:', error);
      toast.error('Daten konnten nicht geladen werden');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!partnerInfo?.partnerId) return;

    // Validate required fields
    if (!radioData.name.trim()) {
      toast.error('Bitte gib einen Namen ein');
      return;
    }
    if (!radioData.stream_url.trim()) {
      toast.error('Bitte gib eine Stream-URL ein');
      return;
    }
    if (!radioData.slug.trim()) {
      toast.error('Bitte gib einen URL-Slug ein');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        partner_id: partnerInfo.partnerId,
        name: radioData.name.trim(),
        slug: radioData.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        stream_url: radioData.stream_url.trim(),
        preroll_audio_url: radioData.preroll_audio_url,
        logo_url: radioData.logo_url,
        cover_image_url: radioData.cover_image_url,
        brand_color: radioData.brand_color,
        description: radioData.description.trim(),
        is_active: radioData.is_active,
        enable_taler_rewards: radioData.enable_taler_rewards,
      };

      if (radioData.id) {
        // Update existing
        const { error } = await supabase
          .from('partner_radios')
          .update(payload)
          .eq('id', radioData.id);
        if (error) throw error;
      } else {
        // Create new
        const { data, error } = await supabase
          .from('partner_radios')
          .insert(payload)
          .select('id')
          .single();
        if (error) throw error;
        setRadioData(prev => ({ ...prev, id: data.id }));
      }

      toast.success('Radio gespeichert!');
      setHasChanges(false);
    } catch (error: any) {
      console.error('Error saving radio:', error);
      if (error.code === '23505') {
        toast.error('Dieser URL-Slug ist bereits vergeben');
      } else {
        toast.error('Fehler beim Speichern');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleUploadPreroll = async (file: File) => {
    if (!file.type.startsWith('audio/')) {
      toast.error('Bitte lade eine Audio-Datei hoch');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Datei darf maximal 10 MB gross sein');
      return;
    }

    setIsUploading(true);
    try {
      const fileName = `preroll-${partnerInfo?.partnerId}-${Date.now()}.mp3`;
      const { error: uploadError } = await supabase.storage
        .from('partner-audio')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('partner-audio')
        .getPublicUrl(fileName);

      setRadioData(prev => ({ ...prev, preroll_audio_url: urlData.publicUrl }));
      setHasChanges(true);
      toast.success('Pre-Roll hochgeladen!');
    } catch (error) {
      console.error('Error uploading preroll:', error);
      toast.error('Upload fehlgeschlagen');
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadImage = async (file: File, type: 'logo' | 'cover') => {
    if (!file.type.startsWith('image/')) {
      toast.error('Bitte lade ein Bild hoch');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Bild darf maximal 5 MB gross sein');
      return;
    }

    setIsUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `${type}-${partnerInfo?.partnerId}-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('partner-images')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('partner-images')
        .getPublicUrl(fileName);

      if (type === 'logo') {
        setRadioData(prev => ({ ...prev, logo_url: urlData.publicUrl }));
      } else {
        setRadioData(prev => ({ ...prev, cover_image_url: urlData.publicUrl }));
      }
      setHasChanges(true);
      toast.success(`${type === 'logo' ? 'Logo' : 'Cover'} hochgeladen!`);
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Upload fehlgeschlagen');
    } finally {
      setIsUploading(false);
    }
  };

  const handleTestStream = () => {
    if (!radioData.stream_url) {
      toast.error('Bitte gib zuerst eine Stream-URL ein');
      return;
    }

    if (isPlaying && audioElement) {
      audioElement.pause();
      setAudioElement(null);
      setIsPlaying(false);
      return;
    }

    const audio = new Audio(radioData.stream_url);
    audio.addEventListener('error', () => {
      toast.error('Stream konnte nicht geladen werden. Prüfe die URL.');
      setIsPlaying(false);
    });
    audio.addEventListener('playing', () => {
      toast.success('Stream funktioniert!');
    });
    audio.play();
    setAudioElement(audio);
    setIsPlaying(true);
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(publicUrl);
    toast.success('URL kopiert!');
  };

  const handleFieldChange = <K extends keyof PartnerRadioData>(
    key: K,
    value: PartnerRadioData[K]
  ) => {
    setRadioData(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20">
            <Radio className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Mein Radio</h1>
            <p className="text-sm text-muted-foreground">
              Erstelle deine eigene gebrandete Radio-Seite
            </p>
          </div>
        </div>

        {hasChanges && (
          <Button onClick={handleSave} disabled={isSaving} className="gap-2">
            <Save className="h-4 w-4" />
            {isSaving ? 'Speichern...' : 'Speichern'}
          </Button>
        )}
      </motion.div>

      {/* Stats Card (if radio exists) */}
      {radioData.id && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-background">
                    <BarChart3 className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Gesamte Wiedergaben</p>
                    <p className="text-3xl font-bold">{radioData.play_count.toLocaleString()}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleCopyUrl} className="gap-2">
                    <Copy className="h-4 w-4" />
                    Link kopieren
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="gap-2">
                      <ExternalLink className="h-4 w-4" />
                      Vorschau
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Stream Configuration */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Music className="h-5 w-5 text-primary" />
              Stream-Konfiguration
            </CardTitle>
            <CardDescription>
              Konfiguriere deinen Audio-Stream und optionalen Pre-Roll.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Radio Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Radio-Name *</Label>
              <Input
                id="name"
                value={radioData.name}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                placeholder="z.B. Café Schönau Radio"
              />
            </div>

            {/* URL Slug */}
            <div className="space-y-2">
              <Label htmlFor="slug">URL-Slug *</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{window.location.origin}/radio/</span>
                <Input
                  id="slug"
                  value={radioData.slug}
                  onChange={(e) => handleFieldChange('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                  placeholder="cafe-schoenau"
                  className="flex-1"
                />
              </div>
            </div>

            {/* Stream URL */}
            <div className="space-y-2">
              <Label htmlFor="stream_url">Stream-URL *</Label>
              <div className="flex gap-2">
                <Input
                  id="stream_url"
                  value={radioData.stream_url}
                  onChange={(e) => handleFieldChange('stream_url', e.target.value)}
                  placeholder="https://stream.example.com/listen"
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  onClick={handleTestStream}
                  className="gap-2 shrink-0"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="h-4 w-4" />
                      Stop
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      Testen
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Die URL deines Audio-Streams (MP3, AAC, etc.)
              </p>
            </div>

            {/* Pre-roll Audio */}
            <div className="space-y-2">
              <Label>Pre-Roll Audio (optional)</Label>
              <div className="flex items-center gap-4">
                {radioData.preroll_audio_url ? (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-success/10 border border-success/30 flex-1">
                    <CheckCircle2 className="h-5 w-5 text-success" />
                    <span className="text-sm truncate flex-1">Pre-Roll hochgeladen</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleFieldChange('preroll_audio_url', null)}
                    >
                      Entfernen
                    </Button>
                  </div>
                ) : (
                  <label className="flex items-center gap-2 p-4 rounded-lg border-2 border-dashed border-muted-foreground/30 cursor-pointer hover:border-primary/50 transition-colors flex-1">
                    <Upload className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {isUploading ? 'Wird hochgeladen...' : 'MP3 hochladen (max. 10 MB, 30 Sek.)'}
                    </span>
                    <input
                      type="file"
                      accept="audio/*"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleUploadPreroll(e.target.files[0])}
                      disabled={isUploading}
                    />
                  </label>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Diese Audio-Datei wird vor dem Stream abgespielt (z.B. Willkommensnachricht, Jingle).
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Beschreibung (optional)</Label>
              <Textarea
                id="description"
                value={radioData.description}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                placeholder="Kurze Beschreibung deines Radios..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Branding */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-accent" />
              Branding
            </CardTitle>
            <CardDescription>
              Gestalte das Aussehen deiner Radio-Seite.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Logo Upload */}
            <div className="space-y-2">
              <Label>Logo</Label>
              <div className="flex items-center gap-4">
                {radioData.logo_url ? (
                  <div className="h-20 w-20 rounded-xl overflow-hidden bg-muted flex items-center justify-center">
                    <img src={radioData.logo_url} alt="Logo" className="h-full w-full object-cover" />
                  </div>
                ) : (
                  <div className="h-20 w-20 rounded-xl bg-muted flex items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <label className="cursor-pointer">
                  <Button variant="outline" size="sm" asChild>
                    <span>
                      <Upload className="h-4 w-4 mr-2" />
                      Logo hochladen
                    </span>
                  </Button>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleUploadImage(e.target.files[0], 'logo')}
                    disabled={isUploading}
                  />
                </label>
              </div>
            </div>

            {/* Cover Image Upload */}
            <div className="space-y-2">
              <Label>Cover-Bild (optional)</Label>
              <div className="space-y-2">
                {radioData.cover_image_url ? (
                  <div className="relative h-40 rounded-xl overflow-hidden bg-muted">
                    <img src={radioData.cover_image_url} alt="Cover" className="h-full w-full object-cover" />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => handleFieldChange('cover_image_url', null)}
                    >
                      Entfernen
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center gap-2 p-8 rounded-xl border-2 border-dashed border-muted-foreground/30 cursor-pointer hover:border-primary/50 transition-colors">
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Cover-Bild hochladen (empfohlen: 1200 x 600 px)
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleUploadImage(e.target.files[0], 'cover')}
                      disabled={isUploading}
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Brand Color */}
            <div className="space-y-2">
              <Label htmlFor="brand_color">Markenfarbe</Label>
              <div className="flex items-center gap-4">
                <input
                  type="color"
                  id="brand_color"
                  value={radioData.brand_color}
                  onChange={(e) => handleFieldChange('brand_color', e.target.value)}
                  className="h-10 w-20 rounded-lg border cursor-pointer"
                />
                <Input
                  value={radioData.brand_color}
                  onChange={(e) => handleFieldChange('brand_color', e.target.value)}
                  className="w-32"
                  placeholder="#C7A94E"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Settings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              Einstellungen
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Active Toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label className="text-base font-medium">Radio aktiv</Label>
                <p className="text-sm text-muted-foreground">
                  Deaktiviere dein Radio vorübergehend
                </p>
              </div>
              <Switch
                checked={radioData.is_active}
                onCheckedChange={(checked) => handleFieldChange('is_active', checked)}
              />
            </div>

            {/* Taler Rewards (Premium Feature) */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Label className="text-base font-medium">Taler-Belohnungen</Label>
                  <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-warning/20 text-warning">
                    Premium
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Hörer können Taler verdienen während sie dein Radio hören
                </p>
              </div>
              <Switch
                checked={radioData.enable_taler_rewards}
                onCheckedChange={(checked) => handleFieldChange('enable_taler_rewards', checked)}
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Info Box */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex items-start gap-3 p-4 rounded-xl bg-accent/10 border border-accent/20">
          <Info className="h-5 w-5 text-accent shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium mb-1">Tipp</p>
            <p className="text-muted-foreground">
              Teile den Link zu deiner Radio-Seite auf deiner Website, in Social Media oder per QR-Code 
              auf deinem POS-Material. Jeder Besuch wird gezählt und du kannst die Statistiken hier einsehen.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
