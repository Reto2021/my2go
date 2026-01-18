import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Plus, Pencil, Trash2, ExternalLink, Upload, Search, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Sponsor {
  id: string;
  name: string;
  logo_url: string | null;
  website: string | null;
  is_active: boolean;
  created_at: string;
}

interface SponsorForm {
  name: string;
  logo_url: string;
  website: string;
  is_active: boolean;
}

const initialForm: SponsorForm = {
  name: '',
  logo_url: '',
  website: '',
  is_active: true,
};

export default function AdminSponsors() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingSponsor, setEditingSponsor] = useState<Sponsor | null>(null);
  const [form, setForm] = useState<SponsorForm>(initialForm);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadSponsors();
  }, []);

  async function loadSponsors() {
    try {
      const { data, error } = await supabase
        .from('sponsors')
        .select('*')
        .order('name');

      if (error) throw error;
      setSponsors(data || []);
    } catch (error) {
      console.error('Error loading sponsors:', error);
      toast.error('Fehler beim Laden der Sponsoren');
    } finally {
      setIsLoading(false);
    }
  }

  function openCreateForm() {
    setEditingSponsor(null);
    setForm(initialForm);
    setShowForm(true);
  }

  function openEditForm(sponsor: Sponsor) {
    setEditingSponsor(sponsor);
    setForm({
      name: sponsor.name,
      logo_url: sponsor.logo_url || '',
      website: sponsor.website || '',
      is_active: sponsor.is_active,
    });
    setShowForm(true);
  }

  async function handleLogoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Bitte wähle eine Bilddatei aus');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Das Bild darf maximal 2MB gross sein');
      return;
    }

    setIsUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `sponsor-${Date.now()}.${fileExt}`;
      const filePath = `sponsors/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('partner-logos')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('partner-logos')
        .getPublicUrl(filePath);

      setForm(prev => ({ ...prev, logo_url: publicUrl }));
      toast.success('Logo hochgeladen');
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('Fehler beim Hochladen des Logos');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!form.name.trim()) {
      toast.error('Bitte gib einen Namen ein');
      return;
    }

    setIsSaving(true);

    try {
      const sponsorData = {
        name: form.name.trim(),
        logo_url: form.logo_url.trim() || null,
        website: form.website.trim() || null,
        is_active: form.is_active,
      };

      if (editingSponsor) {
        const { error } = await supabase
          .from('sponsors')
          .update(sponsorData)
          .eq('id', editingSponsor.id);

        if (error) throw error;
        toast.success('Sponsor aktualisiert');
      } else {
        const { error } = await supabase
          .from('sponsors')
          .insert(sponsorData);

        if (error) throw error;
        toast.success('Sponsor erstellt');
      }

      setShowForm(false);
      loadSponsors();
    } catch (error) {
      console.error('Error saving sponsor:', error);
      toast.error('Fehler beim Speichern');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const { error } = await supabase
        .from('sponsors')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Sponsor gelöscht');
      setShowDeleteConfirm(null);
      loadSponsors();
    } catch (error) {
      console.error('Error deleting sponsor:', error);
      toast.error('Fehler beim Löschen');
    }
  }

  async function toggleActive(sponsor: Sponsor) {
    try {
      const { error } = await supabase
        .from('sponsors')
        .update({ is_active: !sponsor.is_active })
        .eq('id', sponsor.id);

      if (error) throw error;
      
      setSponsors(prev => prev.map(s => 
        s.id === sponsor.id ? { ...s, is_active: !s.is_active } : s
      ));
      
      toast.success(sponsor.is_active ? 'Sponsor deaktiviert' : 'Sponsor aktiviert');
    } catch (error) {
      console.error('Error toggling sponsor:', error);
      toast.error('Fehler beim Aktualisieren');
    }
  }

  const filteredSponsors = sponsors.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sponsoren</h1>
          <p className="text-muted-foreground">
            Verwalte Sponsoren für Rewards und Partner
          </p>
        </div>
        <Button onClick={openCreateForm} className="gap-2">
          <Plus className="h-4 w-4" />
          Neuer Sponsor
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Sponsoren suchen..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Sponsors Grid */}
      {filteredSponsors.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">
              {searchQuery ? 'Keine Sponsoren gefunden' : 'Noch keine Sponsoren vorhanden'}
            </p>
            {!searchQuery && (
              <Button onClick={openCreateForm} variant="outline" className="mt-4 gap-2">
                <Plus className="h-4 w-4" />
                Ersten Sponsor erstellen
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredSponsors.map(sponsor => (
            <Card 
              key={sponsor.id}
              className={cn(
                'relative overflow-hidden transition-opacity',
                !sponsor.is_active && 'opacity-60'
              )}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  {sponsor.logo_url ? (
                    <img
                      src={sponsor.logo_url}
                      alt={sponsor.name}
                      className="h-12 w-12 rounded-lg object-contain bg-muted"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                      <Building2 className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={sponsor.is_active}
                      onCheckedChange={() => toggleActive(sponsor)}
                    />
                  </div>
                </div>
                <CardTitle className="text-base mt-2">{sponsor.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {sponsor.website && (
                  <a
                    href={sponsor.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Website besuchen
                  </a>
                )}
                
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-2"
                    onClick={() => openEditForm(sponsor)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Bearbeiten
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => setShowDeleteConfirm(sponsor.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingSponsor ? 'Sponsor bearbeiten' : 'Neuer Sponsor'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Sponsor Name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Logo</Label>
              <div className="flex items-center gap-4">
                {form.logo_url ? (
                  <img
                    src={form.logo_url}
                    alt="Logo preview"
                    className="h-16 w-16 rounded-lg object-contain bg-muted border"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-muted border">
                    <Building2 className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full gap-2"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <LoadingSpinner className="h-4 w-4" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    Logo hochladen
                  </Button>
                  {form.logo_url && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="w-full text-muted-foreground"
                      onClick={() => setForm(prev => ({ ...prev, logo_url: '' }))}
                    >
                      Logo entfernen
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="logo_url">Oder Logo-URL eingeben</Label>
              <Input
                id="logo_url"
                type="url"
                value={form.logo_url}
                onChange={(e) => setForm(prev => ({ ...prev, logo_url: e.target.value }))}
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                value={form.website}
                onChange={(e) => setForm(prev => ({ ...prev, website: e.target.value }))}
                placeholder="https://..."
              />
            </div>

            <div className="flex items-center justify-between py-2">
              <Label htmlFor="is_active">Aktiv</Label>
              <Switch
                id="is_active"
                checked={form.is_active}
                onCheckedChange={(checked) => setForm(prev => ({ ...prev, is_active: checked }))}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
              >
                Abbrechen
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <LoadingSpinner className="mr-2 h-4 w-4" />}
                {editingSponsor ? 'Speichern' : 'Erstellen'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!showDeleteConfirm} onOpenChange={() => setShowDeleteConfirm(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Sponsor löschen?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Möchtest du diesen Sponsor wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(null)}>
              Abbrechen
            </Button>
            <Button
              variant="destructive"
              onClick={() => showDeleteConfirm && handleDelete(showDeleteConfirm)}
            >
              Löschen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
