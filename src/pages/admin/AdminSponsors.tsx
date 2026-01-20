import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Plus, Pencil, Trash2, ExternalLink, Upload, Search, Building2, Crown, Star, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

type SponsorLevel = 'platinum' | 'gold' | 'silver' | 'bronze';
type EngagementArea = 'reward' | 'radio' | 'event' | 'partner' | 'community';

interface Sponsor {
  id: string;
  name: string;
  logo_url: string | null;
  website: string | null;
  is_active: boolean;
  level: SponsorLevel;
  engagement_area: EngagementArea;
  description: string | null;
  featured_on_home: boolean;
  sort_order: number;
  created_at: string;
}

interface SponsorForm {
  name: string;
  logo_url: string;
  website: string;
  is_active: boolean;
  level: SponsorLevel;
  engagement_area: EngagementArea;
  description: string;
  featured_on_home: boolean;
}

const initialForm: SponsorForm = {
  name: '',
  logo_url: '',
  website: '',
  is_active: true,
  level: 'bronze',
  engagement_area: 'community',
  description: '',
  featured_on_home: false,
};

const levelConfig: Record<SponsorLevel, { label: string; color: string; icon: typeof Crown; sortOrder: number }> = {
  platinum: { label: 'Platinum', color: 'bg-gradient-to-r from-slate-300 to-slate-400 text-slate-900', icon: Crown, sortOrder: 10 },
  gold: { label: 'Gold', color: 'bg-gradient-to-r from-yellow-400 to-amber-500 text-amber-900', icon: Crown, sortOrder: 20 },
  silver: { label: 'Silber', color: 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-800', icon: Star, sortOrder: 30 },
  bronze: { label: 'Bronze', color: 'bg-gradient-to-r from-orange-300 to-orange-400 text-orange-900', icon: Star, sortOrder: 40 },
};

const engagementConfig: Record<EngagementArea, { label: string; emoji: string }> = {
  reward: { label: 'Reward-Sponsor', emoji: '🎁' },
  radio: { label: 'Radio-Sponsor', emoji: '📻' },
  event: { label: 'Event-Sponsor', emoji: '🎉' },
  partner: { label: 'Partner-Sponsor', emoji: '🤝' },
  community: { label: 'Community-Sponsor', emoji: '💚' },
};

export default function AdminSponsors() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState<SponsorLevel | 'all'>('all');
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
        .order('sort_order')
        .order('name');

      if (error) throw error;
      setSponsors((data as Sponsor[]) || []);
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
      level: sponsor.level || 'bronze',
      engagement_area: sponsor.engagement_area || 'community',
      description: sponsor.description || '',
      featured_on_home: sponsor.featured_on_home || false,
    });
    setShowForm(true);
  }

  async function handleLogoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Bitte wähle eine Bilddatei aus');
      return;
    }

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
        level: form.level,
        engagement_area: form.engagement_area,
        description: form.description.trim() || null,
        featured_on_home: form.featured_on_home,
        sort_order: levelConfig[form.level].sortOrder,
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

  const filteredSponsors = sponsors.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = filterLevel === 'all' || s.level === filterLevel;
    return matchesSearch && matchesLevel;
  });

  // Group by level
  const groupedSponsors = filteredSponsors.reduce((acc, sponsor) => {
    const level = sponsor.level || 'bronze';
    if (!acc[level]) acc[level] = [];
    acc[level].push(sponsor);
    return acc;
  }, {} as Record<SponsorLevel, Sponsor[]>);

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
            Verwalte Sponsoren nach Level und Engagement-Bereich
          </p>
        </div>
        <Button onClick={openCreateForm} className="gap-2">
          <Plus className="h-4 w-4" />
          Neuer Sponsor
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Sponsoren suchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterLevel} onValueChange={(v) => setFilterLevel(v as SponsorLevel | 'all')}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Alle Level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Level</SelectItem>
            {Object.entries(levelConfig).map(([key, config]) => (
              <SelectItem key={key} value={key}>{config.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Sponsors by Level */}
      {filteredSponsors.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">
              {searchQuery || filterLevel !== 'all' ? 'Keine Sponsoren gefunden' : 'Noch keine Sponsoren vorhanden'}
            </p>
            {!searchQuery && filterLevel === 'all' && (
              <Button onClick={openCreateForm} variant="outline" className="mt-4 gap-2">
                <Plus className="h-4 w-4" />
                Ersten Sponsor erstellen
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {(['platinum', 'gold', 'silver', 'bronze'] as SponsorLevel[]).map(level => {
            const levelSponsors = groupedSponsors[level];
            if (!levelSponsors?.length) return null;
            
            const config = levelConfig[level];
            
            return (
              <div key={level}>
                <div className="flex items-center gap-2 mb-4">
                  <Badge className={cn('text-sm py-1 px-3', config.color)}>
                    <config.icon className="h-3.5 w-3.5 mr-1" />
                    {config.label}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {levelSponsors.length} Sponsor{levelSponsors.length > 1 ? 'en' : ''}
                  </span>
                </div>
                
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {levelSponsors.map(sponsor => (
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
                              className={cn(
                                'rounded-lg object-contain bg-muted',
                                level === 'platinum' ? 'h-16 w-16' : 
                                level === 'gold' ? 'h-14 w-14' : 'h-12 w-12'
                              )}
                            />
                          ) : (
                            <div className={cn(
                              'flex items-center justify-center rounded-lg bg-muted',
                              level === 'platinum' ? 'h-16 w-16' : 
                              level === 'gold' ? 'h-14 w-14' : 'h-12 w-12'
                            )}>
                              <Building2 className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            {sponsor.featured_on_home && (
                              <span title="Auf Startseite">
                                <Home className="h-4 w-4 text-primary" />
                              </span>
                            )}
                            <Switch
                              checked={sponsor.is_active}
                              onCheckedChange={() => toggleActive(sponsor)}
                            />
                          </div>
                        </div>
                        <CardTitle className="text-base mt-2">{sponsor.name}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {engagementConfig[sponsor.engagement_area]?.emoji} {engagementConfig[sponsor.engagement_area]?.label}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {sponsor.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {sponsor.description}
                          </p>
                        )}
                        
                        {sponsor.website && (
                          <a
                            href={sponsor.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            Website
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
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Form Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%]">
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="level">Level</Label>
                <Select 
                  value={form.level} 
                  onValueChange={(v) => setForm(prev => ({ ...prev, level: v as SponsorLevel }))}
                >
                  <SelectTrigger id="level">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(levelConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        <span className="flex items-center gap-2">
                          <config.icon className="h-4 w-4" />
                          {config.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="engagement">Bereich</Label>
                <Select 
                  value={form.engagement_area} 
                  onValueChange={(v) => setForm(prev => ({ ...prev, engagement_area: v as EngagementArea }))}
                >
                  <SelectTrigger id="engagement">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(engagementConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {config.emoji} {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
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
              <Label htmlFor="description">Beschreibung</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Kurze Beschreibung des Sponsors..."
                rows={2}
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

            <div className="flex items-center justify-between py-2 border-t">
              <div>
                <Label htmlFor="featured_on_home">Auf Startseite zeigen</Label>
                <p className="text-xs text-muted-foreground">Platinum-Sponsoren werden prominent angezeigt</p>
              </div>
              <Switch
                id="featured_on_home"
                checked={form.featured_on_home}
                onCheckedChange={(checked) => setForm(prev => ({ ...prev, featured_on_home: checked }))}
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
        <DialogContent className="sm:max-w-sm left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%]">
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
