import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Grid3X3, Users, ShoppingBag } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Campaign {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  grid_size: number;
  required_purchases: number;
  min_unique_shops: number;
  scan_cooldown_hours: number;
  max_scans_per_day: number;
  min_days_to_complete: number;
  milestones: any;
  prize_description: string | null;
  prize_taler: number | null;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
}

function CampaignForm({
  campaign,
  onSave,
  onClose,
}: {
  campaign?: Campaign;
  onSave: (data: Partial<Campaign>) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    title: campaign?.title || "",
    slug: campaign?.slug || "",
    subtitle: campaign?.subtitle || "",
    grid_size: campaign?.grid_size || 6,
    required_purchases: campaign?.required_purchases || 11,
    min_unique_shops: campaign?.min_unique_shops || 4,
    scan_cooldown_hours: campaign?.scan_cooldown_hours || 4,
    max_scans_per_day: campaign?.max_scans_per_day || 3,
    min_days_to_complete: campaign?.min_days_to_complete || 3,
    prize_description: campaign?.prize_description || "",
    prize_taler: campaign?.prize_taler || 0,
    is_active: campaign?.is_active ?? true,
    starts_at: campaign?.starts_at?.split("T")[0] || "",
    ends_at: campaign?.ends_at?.split("T")[0] || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.slug) {
      toast.error("Titel und Slug sind erforderlich");
      return;
    }
    onSave({
      ...form,
      starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
      ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Titel</Label>
          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </div>
        <div>
          <Label>Slug</Label>
          <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
        </div>
      </div>
      <div>
        <Label>Untertitel</Label>
        <Input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label>Grid-Grösse</Label>
          <Input type="number" value={form.grid_size} onChange={(e) => setForm({ ...form, grid_size: +e.target.value })} />
        </div>
        <div>
          <Label>Einkäufe nötig</Label>
          <Input type="number" value={form.required_purchases} onChange={(e) => setForm({ ...form, required_purchases: +e.target.value })} />
        </div>
        <div>
          <Label>Min. Shops</Label>
          <Input type="number" value={form.min_unique_shops} onChange={(e) => setForm({ ...form, min_unique_shops: +e.target.value })} />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label>Cooldown (h)</Label>
          <Input type="number" value={form.scan_cooldown_hours} onChange={(e) => setForm({ ...form, scan_cooldown_hours: +e.target.value })} />
        </div>
        <div>
          <Label>Scans/Tag</Label>
          <Input type="number" value={form.max_scans_per_day} onChange={(e) => setForm({ ...form, max_scans_per_day: +e.target.value })} />
        </div>
        <div>
          <Label>Min. Tage</Label>
          <Input type="number" value={form.min_days_to_complete} onChange={(e) => setForm({ ...form, min_days_to_complete: +e.target.value })} />
        </div>
      </div>
      <div>
        <Label>Preis-Beschreibung</Label>
        <Textarea value={form.prize_description} onChange={(e) => setForm({ ...form, prize_description: e.target.value })} />
      </div>
      <div>
        <Label>Preis-Taler</Label>
        <Input type="number" value={form.prize_taler} onChange={(e) => setForm({ ...form, prize_taler: +e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Start</Label>
          <Input type="date" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} />
        </div>
        <div>
          <Label>Ende</Label>
          <Input type="date" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
        <Label>Aktiv</Label>
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onClose}>Abbrechen</Button>
        <Button type="submit">{campaign ? "Speichern" : "Erstellen"}</Button>
      </div>
    </form>
  );
}

export default function AdminCollectingCampaigns() {
  const queryClient = useQueryClient();
  const [editCampaign, setEditCampaign] = useState<Campaign | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ["admin-collecting-campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("collecting_campaigns" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as Campaign[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: Partial<Campaign>) => {
      const { error } = await supabase
        .from("collecting_campaigns" as any)
        .insert(data as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-collecting-campaigns"] });
      setShowCreate(false);
      toast.success("Kampagne erstellt");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Campaign> & { id: string }) => {
      const { error } = await supabase
        .from("collecting_campaigns" as any)
        .update(data as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-collecting-campaigns"] });
      setEditCampaign(null);
      toast.success("Kampagne aktualisiert");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("collecting_campaigns" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-collecting-campaigns"] });
      toast.success("Kampagne gelöscht");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sammelkarten-Kampagnen</h1>
          <p className="text-muted-foreground text-sm">
            Verwalte Sammelkarten inkl. Fraud-Parameter und Bonusfelder
          </p>
        </div>
        <Dialog open={showCreate} onOpenChange={setShowCreate}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Neue Kampagne</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Neue Kampagne</DialogTitle>
            </DialogHeader>
            <CampaignForm
              onSave={(data) => createMutation.mutate(data)}
              onClose={() => setShowCreate(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground text-center py-8">Laden...</div>
      ) : campaigns.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          Noch keine Kampagnen erstellt.
        </Card>
      ) : (
        <div className="space-y-3">
          {campaigns.map((c) => (
            <Card key={c.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{c.title}</h3>
                    <Badge variant={c.is_active ? "default" : "secondary"}>
                      {c.is_active ? "Aktiv" : "Inaktiv"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{c.subtitle}</p>
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Grid3X3 className="h-3 w-3" /> {c.grid_size}×{c.grid_size}
                    </span>
                    <span className="flex items-center gap-1">
                      <ShoppingBag className="h-3 w-3" /> {c.required_purchases} Einkäufe
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" /> Min. {c.min_unique_shops} Shops
                    </span>
                    <span>Cooldown: {c.scan_cooldown_hours}h</span>
                    <span>Max: {c.max_scans_per_day}/Tag</span>
                    <span>Min: {c.min_days_to_complete} Tage</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Dialog
                    open={editCampaign?.id === c.id}
                    onOpenChange={(open) => !open && setEditCampaign(null)}
                  >
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => setEditCampaign(c)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Kampagne bearbeiten</DialogTitle>
                      </DialogHeader>
                      {editCampaign && (
                        <CampaignForm
                          campaign={editCampaign}
                          onSave={(data) => updateMutation.mutate({ id: editCampaign.id, ...data })}
                          onClose={() => setEditCampaign(null)}
                        />
                      )}
                    </DialogContent>
                  </Dialog>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (confirm("Kampagne wirklich löschen?")) deleteMutation.mutate(c.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
