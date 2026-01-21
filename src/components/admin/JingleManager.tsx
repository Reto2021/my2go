import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  Plus, 
  Play, 
  Pause, 
  Music,
  Upload,
  Trash2,
  Loader2,
  CheckCircle
} from 'lucide-react';

interface Jingle {
  id: string;
  name: string;
  description: string | null;
  partner_id: string | null;
  intro_url: string | null;
  outro_url: string | null;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
}

interface JingleManagerProps {
  onRefresh?: () => void;
}

export default function JingleManager({ onRefresh }: JingleManagerProps) {
  const [jingles, setJingles] = useState<Jingle[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [playingUrl, setPlayingUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isDefault: false,
  });
  const [introFile, setIntroFile] = useState<File | null>(null);
  const [outroFile, setOutroFile] = useState<File | null>(null);

  useEffect(() => {
    loadJingles();
  }, []);

  const loadJingles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('audio_jingles')
        .select('*')
        .order('is_default', { ascending: false })
        .order('name');

      if (error) throw error;
      setJingles(data || []);
    } catch (error) {
      console.error('Error loading jingles:', error);
      toast.error('Fehler beim Laden der Jingles');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!formData.name.trim()) {
      toast.error('Bitte gib einen Namen ein');
      return;
    }

    if (!introFile && !outroFile) {
      toast.error('Bitte wähle mindestens eine Audio-Datei');
      return;
    }

    setUploading(true);
    try {
      let introUrl: string | null = null;
      let outroUrl: string | null = null;

      // Upload intro if provided
      if (introFile) {
        const introPath = `jingles/${Date.now()}_intro_${introFile.name}`;
        const { error: introError } = await supabase.storage
          .from('audio-ads')
          .upload(introPath, introFile, { contentType: introFile.type });

        if (introError) throw introError;

        const { data: introUrlData } = supabase.storage
          .from('audio-ads')
          .getPublicUrl(introPath);
        introUrl = introUrlData.publicUrl;
      }

      // Upload outro if provided
      if (outroFile) {
        const outroPath = `jingles/${Date.now()}_outro_${outroFile.name}`;
        const { error: outroError } = await supabase.storage
          .from('audio-ads')
          .upload(outroPath, outroFile, { contentType: outroFile.type });

        if (outroError) throw outroError;

        const { data: outroUrlData } = supabase.storage
          .from('audio-ads')
          .getPublicUrl(outroPath);
        outroUrl = outroUrlData.publicUrl;
      }

      // If setting as default, unset other defaults first
      if (formData.isDefault) {
        await supabase
          .from('audio_jingles')
          .update({ is_default: false })
          .eq('is_default', true);
      }

      // Create jingle record
      const { error: insertError } = await supabase
        .from('audio_jingles')
        .insert({
          name: formData.name,
          description: formData.description || null,
          intro_url: introUrl,
          outro_url: outroUrl,
          is_default: formData.isDefault,
          is_active: true,
        });

      if (insertError) throw insertError;

      toast.success('Jingle hochgeladen!');
      setDialogOpen(false);
      setFormData({ name: '', description: '', isDefault: false });
      setIntroFile(null);
      setOutroFile(null);
      loadJingles();
      onRefresh?.();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Fehler beim Hochladen');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (jingle: Jingle) => {
    if (!confirm(`Jingle "${jingle.name}" wirklich löschen?`)) return;

    try {
      const { error } = await supabase
        .from('audio_jingles')
        .delete()
        .eq('id', jingle.id);

      if (error) throw error;

      toast.success('Jingle gelöscht');
      loadJingles();
      onRefresh?.();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Fehler beim Löschen');
    }
  };

  const toggleActive = async (jingle: Jingle) => {
    try {
      const { error } = await supabase
        .from('audio_jingles')
        .update({ is_active: !jingle.is_active })
        .eq('id', jingle.id);

      if (error) throw error;

      setJingles(prev => prev.map(j => 
        j.id === jingle.id ? { ...j, is_active: !j.is_active } : j
      ));
    } catch (error) {
      console.error('Toggle error:', error);
      toast.error('Fehler beim Aktualisieren');
    }
  };

  const setAsDefault = async (jingle: Jingle) => {
    try {
      // Unset all defaults
      await supabase
        .from('audio_jingles')
        .update({ is_default: false })
        .eq('is_default', true);

      // Set new default
      const { error } = await supabase
        .from('audio_jingles')
        .update({ is_default: true })
        .eq('id', jingle.id);

      if (error) throw error;

      toast.success(`"${jingle.name}" ist jetzt Standard`);
      loadJingles();
    } catch (error) {
      console.error('Set default error:', error);
      toast.error('Fehler beim Setzen als Standard');
    }
  };

  const playAudio = (url: string) => {
    if (playingUrl === url) {
      audioRef.current?.pause();
      setPlayingUrl(null);
    } else {
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play();
        setPlayingUrl(url);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <audio ref={audioRef} onEnded={() => setPlayingUrl(null)} />

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Music className="h-5 w-5" />
            Jingle-Verpackungen
          </h3>
          <p className="text-sm text-muted-foreground">
            Intro/Outro-Sounds für Audio-Ads
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Neuer Jingle
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Jingle hochladen</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  placeholder="z.B. Standard Radio 2Go"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Beschreibung</Label>
                <Input
                  placeholder="Kurze Beschreibung..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Intro (vor dem Claim)
                </Label>
                <Input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => setIntroFile(e.target.files?.[0] || null)}
                />
                {introFile && (
                  <p className="text-xs text-muted-foreground">{introFile.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Outro (nach dem Claim)
                </Label>
                <Input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => setOutroFile(e.target.files?.[0] || null)}
                />
                {outroFile && (
                  <p className="text-xs text-muted-foreground">{outroFile.name}</p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Als Standard setzen</Label>
                  <p className="text-xs text-muted-foreground">
                    Wird automatisch für neue Ads verwendet
                  </p>
                </div>
                <Switch
                  checked={formData.isDefault}
                  onCheckedChange={(v) => setFormData({ ...formData, isDefault: v })}
                />
              </div>

              <Button
                className="w-full"
                onClick={handleUpload}
                disabled={uploading || !formData.name.trim() || (!introFile && !outroFile)}
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                Hochladen
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {jingles.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Music className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Noch keine Jingles hochgeladen</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {jingles.map((jingle) => (
            <Card key={jingle.id} className={!jingle.is_active ? 'opacity-60' : ''}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium truncate">{jingle.name}</h4>
                      {jingle.is_default && (
                        <Badge className="bg-primary">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Standard
                        </Badge>
                      )}
                    </div>
                    {jingle.description && (
                      <p className="text-sm text-muted-foreground">{jingle.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      {jingle.intro_url && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => playAudio(jingle.intro_url!)}
                        >
                          {playingUrl === jingle.intro_url ? (
                            <Pause className="h-3 w-3 mr-1" />
                          ) : (
                            <Play className="h-3 w-3 mr-1" />
                          )}
                          Intro
                        </Button>
                      )}
                      {jingle.outro_url && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => playAudio(jingle.outro_url!)}
                        >
                          {playingUrl === jingle.outro_url ? (
                            <Pause className="h-3 w-3 mr-1" />
                          ) : (
                            <Play className="h-3 w-3 mr-1" />
                          )}
                          Outro
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!jingle.is_default && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setAsDefault(jingle)}
                      >
                        Als Standard
                      </Button>
                    )}
                    <Switch
                      checked={jingle.is_active}
                      onCheckedChange={() => toggleActive(jingle)}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => handleDelete(jingle)}
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
    </div>
  );
}
