import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAllCampaigns, useCampaignPartners, type SeasonalCampaign } from '@/hooks/useSeasonalCampaigns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Users, Calendar, Percent } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { CampaignPartnerManager } from '@/components/admin/CampaignPartnerManager';

type CampaignForm = {
  name: string;
  slug: string;
  description: string;
  badge_text: string;
  badge_color: string;
  bonus_multiplier: number;
  bonus_taler: number;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
};

const emptyForm: CampaignForm = {
  name: '',
  slug: '',
  description: '',
  badge_text: '🔥 Saisonaktion',
  badge_color: '#D4AF37',
  bonus_multiplier: 1.0,
  bonus_taler: 0,
  starts_at: '',
  ends_at: '',
  is_active: true,
};

export default function AdminCampaigns() {
  const { data: campaigns = [], isLoading } = useAllCampaigns();
  const queryClient = useQueryClient();
  const [editingCampaign, setEditingCampaign] = useState<SeasonalCampaign | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CampaignForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [managingPartnersFor, setManagingPartnersFor] = useState<SeasonalCampaign | null>(null);

  const openCreate = () => {
    setEditingCampaign(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (c: SeasonalCampaign) => {
    setEditingCampaign(c);
    setForm({
      name: c.name,
      slug: c.slug,
      description: c.description || '',
      badge_text: c.badge_text,
      badge_color: c.badge_color,
      bonus_multiplier: c.bonus_multiplier,
      bonus_taler: c.bonus_taler,
      starts_at: c.starts_at?.slice(0, 16) || '',
      ends_at: c.ends_at?.slice(0, 16) || '',
      is_active: c.is_active,
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.slug || !form.starts_at || !form.ends_at) {
      toast.error('Bitte alle Pflichtfelder ausfüllen');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        slug: form.slug,
        description: form.description || null,
        badge_text: form.badge_text,
        badge_color: form.badge_color,
        bonus_multiplier: form.bonus_multiplier,
        bonus_taler: form.bonus_taler,
        starts_at: new Date(form.starts_at).toISOString(),
        ends_at: new Date(form.ends_at).toISOString(),
        is_active: form.is_active,
      };

      if (editingCampaign) {
        const { error } = await supabase.from('seasonal_campaigns').update(payload).eq('id', editingCampaign.id);
        if (error) throw error;
        toast.success('Kampagne aktualisiert');
      } else {
        const { error } = await supabase.from('seasonal_campaigns').insert(payload);
        if (error) throw error;
        toast.success('Kampagne erstellt');
      }

      queryClient.invalidateQueries({ queryKey: ['seasonal-campaigns'] });
      setShowForm(false);
    } catch (err: any) {
      toast.error(err.message || 'Fehler beim Speichern');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Kampagne wirklich löschen?')) return;
    const { error } = await supabase.from('seasonal_campaigns').delete().eq('id', id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Kampagne gelöscht');
      queryClient.invalidateQueries({ queryKey: ['seasonal-campaigns'] });
    }
  };

  const getStatus = (c: SeasonalCampaign) => {
    const now = new Date();
    const start = new Date(c.starts_at);
    const end = new Date(c.ends_at);
    if (!c.is_active) return { label: 'Inaktiv', variant: 'outline' as const };
    if (now < start) return { label: 'Geplant', variant: 'secondary' as const };
    if (now > end) return { label: 'Beendet', variant: 'outline' as const };
    return { label: 'Aktiv', variant: 'default' as const };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Saisonale Kampagnen</h2>
          <p className="text-muted-foreground text-sm">Kampagnen erstellen und Partner zuweisen</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" /> Neue Kampagne
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Laden...</div>
      ) : campaigns.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Noch keine Kampagnen erstellt. Starte mit "Neue Kampagne".
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {campaigns.map(c => {
            const status = getStatus(c);
            return (
              <Card key={c.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-lg truncate">{c.name}</h3>
                        <Badge variant={status.variant}>{status.label}</Badge>
                        {c.bonus_taler > 0 && (
                          <Badge variant="secondary" className="gap-1">
                            <Percent className="h-3 w-3" /> +{c.bonus_taler} Taler
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1">{c.description || 'Keine Beschreibung'}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(c.starts_at), 'dd.MM.yy', { locale: de })} – {format(new Date(c.ends_at), 'dd.MM.yy', { locale: de })}
                        </span>
                        <span style={{ color: c.badge_color }}>{c.badge_text}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="icon" onClick={() => setManagingPartnersFor(c)} title="Partner verwalten">
                        <Users className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)} className="text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit Form Sheet */}
      <Sheet open={showForm} onOpenChange={setShowForm}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingCampaign ? 'Kampagne bearbeiten' : 'Neue Kampagne'}</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium">Name *</label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '') }))} placeholder="z.B. Reifenwechsel Frühling 2026" />
            </div>
            <div>
              <label className="text-sm font-medium">Slug *</label>
              <Input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="reifenwechsel-fruehling-2026" />
            </div>
            <div>
              <label className="text-sm font-medium">Beschreibung</label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Kampagnen-Beschreibung..." rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Start *</label>
                <Input type="datetime-local" value={form.starts_at} onChange={e => setForm(f => ({ ...f, starts_at: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium">Ende *</label>
                <Input type="datetime-local" value={form.ends_at} onChange={e => setForm(f => ({ ...f, ends_at: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Badge-Text</label>
                <Input value={form.badge_text} onChange={e => setForm(f => ({ ...f, badge_text: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium">Badge-Farbe</label>
                <Input type="color" value={form.badge_color} onChange={e => setForm(f => ({ ...f, badge_color: e.target.value }))} className="h-10" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Bonus-Taler</label>
                <Input type="number" min={0} value={form.bonus_taler} onChange={e => setForm(f => ({ ...f, bonus_taler: parseInt(e.target.value) || 0 }))} />
                <p className="text-xs text-muted-foreground mt-1">Extra Taler pro Einlösung</p>
              </div>
              <div>
                <label className="text-sm font-medium">Multiplikator</label>
                <Input type="number" min={1} step={0.1} value={form.bonus_multiplier} onChange={e => setForm(f => ({ ...f, bonus_multiplier: parseFloat(e.target.value) || 1 }))} />
                <p className="text-xs text-muted-foreground mt-1">z.B. 1.5 = 50% mehr</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
              <label className="text-sm font-medium">Aktiv</label>
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? 'Speichern...' : editingCampaign ? 'Aktualisieren' : 'Erstellen'}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Partner Manager Sheet */}
      <Sheet open={!!managingPartnersFor} onOpenChange={open => !open && setManagingPartnersFor(null)}>
        <SheetContent className="overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Partner für: {managingPartnersFor?.name}</SheetTitle>
          </SheetHeader>
          {managingPartnersFor && (
            <CampaignPartnerManager campaignId={managingPartnersFor.id} />
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
