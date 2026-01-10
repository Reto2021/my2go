import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, Radio, Clock, Coins, Users, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

interface RadioTier {
  id: string;
  name: string;
  min_duration_seconds: number;
  taler_reward: number;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

interface ListeningStats {
  totalSessions: number;
  totalDuration: number;
  totalRewards: number;
  uniqueListeners: number;
}

export default function AdminRadioTiers() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState<RadioTier | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    min_duration_seconds: 60,
    taler_reward: 1,
    description: '',
    sort_order: 0,
    is_active: true,
  });
  
  // Fetch tiers
  const { data: tiers, isLoading: tiersLoading } = useQuery({
    queryKey: ['admin-radio-tiers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('radio_listening_tiers')
        .select('*')
        .order('sort_order');
      
      if (error) throw error;
      return data as RadioTier[];
    }
  });
  
  // Fetch listening stats
  const { data: stats } = useQuery({
    queryKey: ['admin-listening-stats'],
    queryFn: async () => {
      const { data: sessions, error } = await supabase
        .from('radio_listening_sessions')
        .select('id, user_id, duration_seconds, taler_awarded, rewarded');
      
      if (error) throw error;
      
      const uniqueUsers = new Set(sessions?.map(s => s.user_id));
      
      return {
        totalSessions: sessions?.length || 0,
        totalDuration: sessions?.reduce((sum, s) => sum + (s.duration_seconds || 0), 0) || 0,
        totalRewards: sessions?.reduce((sum, s) => sum + (s.taler_awarded || 0), 0) || 0,
        uniqueListeners: uniqueUsers.size,
      } as ListeningStats;
    }
  });
  
  // Create/Update tier
  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData & { id?: string }) => {
      if (data.id) {
        const { error } = await supabase
          .from('radio_listening_tiers')
          .update(data)
          .eq('id', data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('radio_listening_tiers')
          .insert(data);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-radio-tiers'] });
      setIsDialogOpen(false);
      setSelectedTier(null);
      toast.success(selectedTier ? 'Tier aktualisiert' : 'Tier erstellt');
    },
    onError: (error) => {
      toast.error('Fehler: ' + error.message);
    }
  });
  
  // Delete tier
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('radio_listening_tiers')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-radio-tiers'] });
      setDeleteDialogOpen(false);
      setSelectedTier(null);
      toast.success('Tier gelöscht');
    },
    onError: (error) => {
      toast.error('Fehler: ' + error.message);
    }
  });
  
  const openCreateDialog = () => {
    setSelectedTier(null);
    setFormData({
      name: '',
      min_duration_seconds: 60,
      taler_reward: 1,
      description: '',
      sort_order: (tiers?.length || 0) + 1,
      is_active: true,
    });
    setIsDialogOpen(true);
  };
  
  const openEditDialog = (tier: RadioTier) => {
    setSelectedTier(tier);
    setFormData({
      name: tier.name,
      min_duration_seconds: tier.min_duration_seconds,
      taler_reward: tier.taler_reward,
      description: tier.description || '',
      sort_order: tier.sort_order,
      is_active: tier.is_active,
    });
    setIsDialogOpen(true);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(selectedTier ? { ...formData, id: selectedTier.id } : formData);
  };
  
  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}min`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}min`;
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Radio-Hörbelohnungen</h1>
          <p className="text-muted-foreground">Verwalte Belohnungs-Tiers für Radio-Hörer</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Neues Tier
        </Button>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card-base p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Radio className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.totalSessions || 0}</p>
              <p className="text-xs text-muted-foreground">Sessions</p>
            </div>
          </div>
        </div>
        
        <div className="card-base p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold">{formatDuration(stats?.totalDuration || 0)}</p>
              <p className="text-xs text-muted-foreground">Gesamte Hörzeit</p>
            </div>
          </div>
        </div>
        
        <div className="card-base p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <Coins className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.totalRewards || 0}</p>
              <p className="text-xs text-muted-foreground">Taler vergeben</p>
            </div>
          </div>
        </div>
        
        <div className="card-base p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.uniqueListeners || 0}</p>
              <p className="text-xs text-muted-foreground">Hörer</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Tiers Table */}
      <div className="card-base overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold">Belohnungs-Tiers</h3>
          <p className="text-sm text-muted-foreground">Je länger gehört wird, desto mehr Taler</p>
        </div>
        
        <div className="divide-y divide-border">
          {tiersLoading ? (
            <div className="p-8 text-center text-muted-foreground">Lädt...</div>
          ) : tiers?.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">Keine Tiers vorhanden</div>
          ) : (
            tiers?.map((tier) => (
              <div key={tier.id} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="font-medium">{tier.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDuration(tier.min_duration_seconds)} → {tier.taler_reward} Taler
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${tier.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                    {tier.is_active ? 'Aktiv' : 'Inaktiv'}
                  </span>
                  <Button variant="ghost" size="icon" onClick={() => openEditDialog(tier)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => {
                      setSelectedTier(tier);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedTier ? 'Tier bearbeiten' : 'Neues Tier erstellen'}</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Name</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="z.B. Musikfan"
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Mindestdauer (Sekunden)</label>
                <Input
                  type="number"
                  min={60}
                  value={formData.min_duration_seconds}
                  onChange={(e) => setFormData({ ...formData, min_duration_seconds: parseInt(e.target.value) })}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  = {formatDuration(formData.min_duration_seconds)}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium">Taler-Belohnung</label>
                <Input
                  type="number"
                  min={1}
                  value={formData.taler_reward}
                  onChange={(e) => setFormData({ ...formData, taler_reward: parseInt(e.target.value) })}
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium">Beschreibung</label>
              <Input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Kurze Beschreibung..."
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Sortierung</label>
                <Input
                  type="number"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) })}
                />
              </div>
              
              <div className="flex items-center gap-2 pt-6">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <label className="text-sm font-medium">Aktiv</label>
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Abbrechen
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? 'Speichert...' : 'Speichern'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tier löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchtest du das Tier "{selectedTier?.name}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedTier && deleteMutation.mutate(selectedTier.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
