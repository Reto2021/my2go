import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Award, 
  Plus, 
  Pencil, 
  Trash2, 
  Loader2,
  Search,
  Check,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { BadgeIcon } from '@/components/badges/BadgeIcon';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type Badge = Tables<'badges'>;

const CRITERIA_TYPES = [
  { value: 'lifetime_earned', label: 'Lebenslange Taler' },
  { value: 'redemption_count', label: 'Einlösungen' },
  { value: 'referral_count', label: 'Empfehlungen' },
  { value: 'streak_days', label: 'Serien-Tage' },
  { value: 'leaderboard_rank', label: 'Leaderboard-Rang' },
];

const CATEGORIES = [
  { value: 'general', label: 'Allgemein' },
  { value: 'streak', label: 'Bonus-Serie' },
  { value: 'leaderboard', label: 'Leaderboard' },
  { value: 'collector', label: 'Sammler' },
  { value: 'social', label: 'Social' },
];

const ICONS = [
  'award', 'star', 'trophy', 'medal', 'crown', 'flame', 'zap', 
  'gift', 'heart', 'sparkles', 'gem', 'coins', 'shield', 'target'
];

const COLORS = [
  '#FFD700', '#CD7F32', '#C0C0C0', '#FF6B6B', '#4ECDC4', 
  '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'
];

export default function AdminBadges() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBadge, setEditingBadge] = useState<Badge | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Badge | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    icon: 'award',
    color: '#FFD700',
    category: 'general',
    criteria_type: 'lifetime_earned',
    criteria_value: 100,
    sort_order: 0,
    is_active: true,
  });
  
  // Fetch all badges
  const { data: badges, isLoading } = useQuery({
    queryKey: ['admin-badges'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('badges')
        .select('*')
        .order('category')
        .order('sort_order');
      if (error) throw error;
      return data as Badge[];
    },
  });
  
  // Create badge mutation
  const createBadge = useMutation({
    mutationFn: async (badge: TablesInsert<'badges'>) => {
      const { data, error } = await supabase
        .from('badges')
        .insert(badge)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-badges'] });
      toast.success('Badge erstellt');
      closeDialog();
    },
    onError: (error) => {
      toast.error('Fehler beim Erstellen: ' + error.message);
    },
  });
  
  // Update badge mutation
  const updateBadge = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: TablesUpdate<'badges'> }) => {
      const { data, error } = await supabase
        .from('badges')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-badges'] });
      toast.success('Badge aktualisiert');
      closeDialog();
    },
    onError: (error) => {
      toast.error('Fehler beim Aktualisieren: ' + error.message);
    },
  });
  
  // Delete badge mutation
  const deleteBadge = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('badges')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-badges'] });
      toast.success('Badge gelöscht');
      setDeleteConfirm(null);
    },
    onError: (error) => {
      toast.error('Fehler beim Löschen: ' + error.message);
    },
  });
  
  const openCreateDialog = () => {
    setEditingBadge(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      icon: 'award',
      color: '#FFD700',
      category: 'general',
      criteria_type: 'lifetime_earned',
      criteria_value: 100,
      sort_order: 0,
      is_active: true,
    });
    setIsDialogOpen(true);
  };
  
  const openEditDialog = (badge: Badge) => {
    setEditingBadge(badge);
    setFormData({
      name: badge.name,
      slug: badge.slug,
      description: badge.description,
      icon: badge.icon,
      color: badge.color,
      category: badge.category,
      criteria_type: badge.criteria_type,
      criteria_value: badge.criteria_value,
      sort_order: badge.sort_order,
      is_active: badge.is_active,
    });
    setIsDialogOpen(true);
  };
  
  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingBadge(null);
  };
  
  const handleSubmit = () => {
    if (!formData.name || !formData.slug || !formData.description) {
      toast.error('Bitte alle Pflichtfelder ausfüllen');
      return;
    }
    
    if (editingBadge) {
      updateBadge.mutate({
        id: editingBadge.id,
        updates: formData,
      });
    } else {
      createBadge.mutate(formData);
    }
  };
  
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[äöüß]/g, (m) => ({ 'ä': 'ae', 'ö': 'oe', 'ü': 'ue', 'ß': 'ss' }[m] || m))
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');
  };
  
  // Filter badges by search
  const filteredBadges = badges?.filter(badge => 
    badge.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    badge.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    badge.category.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Group by category
  const groupedBadges = filteredBadges?.reduce((acc, badge) => {
    if (!acc[badge.category]) acc[badge.category] = [];
    acc[badge.category].push(badge);
    return acc;
  }, {} as Record<string, Badge[]>);
  
  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Badges</h1>
          <p className="text-muted-foreground">Verwalte alle Badges und deren Kriterien</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Badge erstellen
        </Button>
      </div>
      
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Badges durchsuchen..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>
      
      {/* Badges List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedBadges || {}).map(([category, categoryBadges]) => (
            <div key={category} className="space-y-3">
              <h2 className="text-lg font-semibold capitalize flex items-center gap-2">
                {CATEGORIES.find(c => c.value === category)?.label || category}
                <span className="text-sm font-normal text-muted-foreground">
                  ({categoryBadges.length})
                </span>
              </h2>
              
              <div className="grid gap-3">
                {categoryBadges.map((badge) => (
                  <div
                    key={badge.id}
                    className={cn(
                      'card-base p-4 flex items-center gap-4',
                      !badge.is_active && 'opacity-50'
                    )}
                  >
                    {/* Badge Icon Preview */}
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: badge.color + '20' }}
                    >
                      <BadgeIcon icon={badge.icon} color={badge.color} size={24} />
                    </div>
                    
                    {/* Badge Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold truncate">{badge.name}</h3>
                        {!badge.is_active && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                            Inaktiv
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {badge.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {CRITERIA_TYPES.find(c => c.value === badge.criteria_type)?.label}: {badge.criteria_value}
                      </p>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(badge)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteConfirm(badge)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          
          {filteredBadges?.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              Keine Badges gefunden
            </div>
          )}
        </div>
      )}
      
      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingBadge ? 'Badge bearbeiten' : 'Neues Badge erstellen'}
            </DialogTitle>
            <DialogDescription>
              Definiere das Badge und seine Vergabekriterien
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    name: e.target.value,
                    slug: editingBadge ? formData.slug : generateSlug(e.target.value),
                  });
                }}
                placeholder="z.B. Taler-Sammler"
              />
            </div>
            
            {/* Slug */}
            <div className="space-y-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="z.B. taler_sammler"
              />
            </div>
            
            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Beschreibung *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="z.B. Sammle 1000 Taler"
                rows={2}
              />
            </div>
            
            {/* Category */}
            <div className="space-y-2">
              <Label>Kategorie</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Icon */}
            <div className="space-y-2">
              <Label>Icon</Label>
              <div className="flex flex-wrap gap-2">
                {ICONS.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setFormData({ ...formData, icon })}
                    className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center border-2 transition-colors',
                      formData.icon === icon
                        ? 'border-accent bg-accent/10'
                        : 'border-transparent bg-muted hover:bg-muted/80'
                    )}
                  >
                    <BadgeIcon icon={icon} color={formData.color} size={20} />
                  </button>
                ))}
              </div>
            </div>
            
            {/* Color */}
            <div className="space-y-2">
              <Label>Farbe</Label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, color })}
                    className={cn(
                      'w-8 h-8 rounded-full border-2 transition-transform',
                      formData.color === color
                        ? 'border-foreground scale-110'
                        : 'border-transparent hover:scale-105'
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            
            {/* Criteria Type */}
            <div className="space-y-2">
              <Label>Kriterium-Typ</Label>
              <Select
                value={formData.criteria_type}
                onValueChange={(value) => setFormData({ ...formData, criteria_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CRITERIA_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Criteria Value */}
            <div className="space-y-2">
              <Label htmlFor="criteria_value">Kriterium-Wert</Label>
              <Input
                id="criteria_value"
                type="number"
                value={formData.criteria_value}
                onChange={(e) => setFormData({ ...formData, criteria_value: parseInt(e.target.value) || 0 })}
                min={0}
              />
              <p className="text-xs text-muted-foreground">
                {formData.criteria_type === 'lifetime_earned' && 'Anzahl Taler, die verdient werden müssen'}
                {formData.criteria_type === 'redemption_count' && 'Anzahl Einlösungen, die getätigt werden müssen'}
                {formData.criteria_type === 'referral_count' && 'Anzahl Empfehlungen'}
                {formData.criteria_type === 'streak_days' && 'Anzahl aufeinanderfolgender Serien-Tage'}
                {formData.criteria_type === 'leaderboard_rank' && 'Platzierung im Leaderboard (1, 2 oder 3)'}
              </p>
            </div>
            
            {/* Sort Order */}
            <div className="space-y-2">
              <Label htmlFor="sort_order">Sortierung</Label>
              <Input
                id="sort_order"
                type="number"
                value={formData.sort_order}
                onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                min={0}
              />
            </div>
            
            {/* Active */}
            <div className="flex items-center justify-between">
              <Label htmlFor="is_active">Aktiv</Label>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
            
            {/* Preview */}
            <div className="p-4 rounded-xl bg-muted/50">
              <Label className="text-xs text-muted-foreground">Vorschau</Label>
              <div className="flex items-center gap-3 mt-2">
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: formData.color + '20' }}
                >
                  <BadgeIcon icon={formData.icon} color={formData.color} size={28} />
                </div>
                <div>
                  <p className="font-semibold">{formData.name || 'Badge-Name'}</p>
                  <p className="text-sm text-muted-foreground">
                    {formData.description || 'Beschreibung'}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Abbrechen
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={createBadge.isPending || updateBadge.isPending}
            >
              {(createBadge.isPending || updateBadge.isPending) && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {editingBadge ? 'Speichern' : 'Erstellen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Badge löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchtest du das Badge "{deleteConfirm?.name}" wirklich löschen? 
              Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && deleteBadge.mutate(deleteConfirm.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteBadge.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
