import { useEffect, useState } from 'react';
import { 
  getAllPartners, 
  createPartner, 
  updatePartner, 
  deletePartner 
} from '@/lib/admin-helpers';
import { Partner } from '@/lib/supabase-helpers';
import { supabase } from '@/integrations/supabase/client';
import { 
  Store, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  X,
  Check,
  MapPin,
  Star,
  RefreshCw,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function AdminPartners() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showReviewsOverview, setShowReviewsOverview] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    short_description: '',
    category: '',
    address_street: '',
    address_number: '',
    postal_code: '',
    city: '',
    is_active: true,
    is_featured: false,
  });
  
  const loadPartners = async () => {
    setIsLoading(true);
    try {
      const data = await getAllPartners();
      setPartners(data);
    } catch (error) {
      console.error('Failed to load partners:', error);
      toast.error('Partner konnten nicht geladen werden');
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    loadPartners();
  }, []);
  
  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      short_description: '',
      category: '',
      address_street: '',
      address_number: '',
      postal_code: '',
      city: '',
      is_active: true,
      is_featured: false,
    });
  };
  
  const handleCreatePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Auto-generate slug if empty
    const slug = formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    
    const { partner, error } = await createPartner({ ...formData, slug });
    
    if (error) {
      toast.error(`Fehler: ${error}`);
      return;
    }
    
    if (partner) {
      setPartners(prev => [partner, ...prev]);
      toast.success('Partner erfolgreich erstellt');
      setShowCreateForm(false);
      resetForm();
    }
  };
  
  const handleUpdatePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPartner) return;
    
    const { success, error } = await updatePartner(editingPartner.id, formData);
    
    if (error) {
      toast.error(`Fehler: ${error}`);
      return;
    }
    
    if (success) {
      setPartners(prev => prev.map(p => 
        p.id === editingPartner.id ? { ...p, ...formData } : p
      ));
      toast.success('Partner erfolgreich aktualisiert');
      setEditingPartner(null);
      resetForm();
    }
  };
  
  const handleDeletePartner = async (partner: Partner) => {
    if (!confirm(`Partner "${partner.name}" wirklich löschen?`)) return;
    
    const { success, error } = await deletePartner(partner.id);
    
    if (error) {
      toast.error(`Fehler: ${error}`);
      return;
    }
    
    if (success) {
      setPartners(prev => prev.filter(p => p.id !== partner.id));
      toast.success('Partner erfolgreich gelöscht');
    }
  };
  
  const openEditForm = (partner: Partner) => {
    setEditingPartner(partner);
    setFormData({
      name: partner.name,
      slug: partner.slug,
      description: partner.description || '',
      short_description: partner.short_description || '',
      category: partner.category || '',
      address_street: partner.address_street || '',
      address_number: partner.address_number || '',
      postal_code: partner.postal_code || '',
      city: partner.city || '',
      is_active: partner.is_active,
      is_featured: partner.is_featured,
    });
    setShowCreateForm(false);
  };
  
  const filteredPartners = partners.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSyncGoogleReviews = async () => {
    setIsSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-google-reviews');
      
      if (error) throw error;
      
      toast.success(`Google Reviews synchronisiert: ${data?.updated || 0} Partner aktualisiert`);
      loadPartners(); // Reload to show updated data
    } catch (error) {
      console.error('Sync error:', error);
      toast.error('Fehler beim Synchronisieren der Google Reviews');
    } finally {
      setIsSyncing(false);
    }
  };

  const partnersWithReviews = partners.filter(p => p.google_place_id);
  const partnersWithoutReviews = partners.filter(p => !p.google_place_id);
  
  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Partner verwalten</h1>
          <p className="text-muted-foreground">{partners.length} Partner insgesamt</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowReviewsOverview(!showReviewsOverview)}
            className={cn(
              "btn-ghost",
              showReviewsOverview && "bg-primary/10 text-primary"
            )}
          >
            <Star className="h-4 w-4" />
            Reviews
          </button>
          <button
            onClick={() => {
              setShowCreateForm(true);
              setEditingPartner(null);
              resetForm();
            }}
            className="btn-primary"
          >
            <Plus className="h-4 w-4" />
            Partner hinzufügen
          </button>
        </div>
      </div>

      {/* Google Reviews Overview */}
      {showReviewsOverview && (
        <div className="card-base p-6 animate-in space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Star className="h-5 w-5 text-accent" />
                Google Reviews Übersicht
              </h2>
              <p className="text-sm text-muted-foreground">
                {partnersWithReviews.length} von {partners.length} Partnern mit Google Place ID
              </p>
            </div>
            <button
              onClick={handleSyncGoogleReviews}
              disabled={isSyncing}
              className="btn-secondary"
            >
              <RefreshCw className={cn("h-4 w-4", isSyncing && "animate-spin")} />
              {isSyncing ? 'Synchronisiere...' : 'Jetzt synchronisieren'}
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-success/10 text-center">
              <div className="text-2xl font-bold text-success">{partnersWithReviews.length}</div>
              <div className="text-xs text-muted-foreground">Mit Place ID</div>
            </div>
            <div className="p-4 rounded-xl bg-warning/10 text-center">
              <div className="text-2xl font-bold text-warning">{partnersWithoutReviews.length}</div>
              <div className="text-xs text-muted-foreground">Ohne Place ID</div>
            </div>
            <div className="p-4 rounded-xl bg-primary/10 text-center">
              <div className="text-2xl font-bold text-primary">
                {partnersWithReviews.filter(p => p.google_rating).length > 0
                  ? (partnersWithReviews.reduce((sum, p) => sum + (p.google_rating || 0), 0) / 
                     partnersWithReviews.filter(p => p.google_rating).length).toFixed(1)
                  : '-'}
              </div>
              <div className="text-xs text-muted-foreground">Ø Rating</div>
            </div>
            <div className="p-4 rounded-xl bg-accent/10 text-center">
              <div className="text-2xl font-bold text-accent">
                {partnersWithReviews.reduce((sum, p) => sum + (p.google_review_count || 0), 0)}
              </div>
              <div className="text-xs text-muted-foreground">Total Reviews</div>
            </div>
          </div>

          {/* Partners with Reviews */}
          <div className="space-y-2">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Partner mit Google Reviews
            </h3>
            {partnersWithReviews.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Noch keine Partner mit Google Place ID konfiguriert
              </p>
            ) : (
              <div className="divide-y divide-border rounded-xl border overflow-hidden">
                {partnersWithReviews.map(partner => (
                  <div key={partner.id} className="flex items-center gap-4 p-3 bg-card hover:bg-muted/50 transition-colors">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 flex-shrink-0">
                      {partner.logo_url ? (
                        <img src={partner.logo_url} alt={partner.name} className="h-full w-full object-cover rounded-xl" />
                      ) : (
                        <Store className="h-5 w-5 text-secondary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">{partner.name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {partner.google_place_id}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0">
                      {partner.google_rating ? (
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-accent fill-accent" />
                          <span className="font-bold">{partner.google_rating.toFixed(1)}</span>
                          <span className="text-sm text-muted-foreground">
                            ({partner.google_review_count || 0})
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">Keine Daten</span>
                      )}
                      <CheckCircle2 className="h-5 w-5 text-success" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Partners without Reviews */}
          {partnersWithoutReviews.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
                Partner ohne Google Place ID
              </h3>
              <div className="divide-y divide-border rounded-xl border overflow-hidden">
                {partnersWithoutReviews.map(partner => (
                  <div key={partner.id} className="flex items-center gap-4 p-3 bg-card hover:bg-muted/50 transition-colors">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted flex-shrink-0">
                      {partner.logo_url ? (
                        <img src={partner.logo_url} alt={partner.name} className="h-full w-full object-cover rounded-xl" />
                      ) : (
                        <Store className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate">{partner.name}</div>
                      <div className="text-xs text-warning">Google Place ID fehlt</div>
                    </div>
                    <button
                      onClick={() => openEditForm(partner)}
                      className="btn-ghost text-sm"
                    >
                      <Edit className="h-4 w-4" />
                      Bearbeiten
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Partner suchen..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-12 pl-12 pr-4 rounded-2xl bg-muted border-2 border-transparent focus:outline-none focus:border-primary/30 focus:bg-background transition-all"
        />
      </div>
      
      {/* Create/Edit Form */}
      {(showCreateForm || editingPartner) && (
        <div className="card-base p-6 animate-in">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">
              {editingPartner ? 'Partner bearbeiten' : 'Neuer Partner'}
            </h2>
            <button
              onClick={() => {
                setShowCreateForm(false);
                setEditingPartner(null);
                resetForm();
              }}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <form onSubmit={editingPartner ? handleUpdatePartner : handleCreatePartner} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full h-11 px-4 rounded-xl bg-muted border-2 border-transparent focus:outline-none focus:border-primary/30 focus:bg-background transition-all"
                  placeholder="z.B. Café Sonnenschein"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Slug</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  className="w-full h-11 px-4 rounded-xl bg-muted border-2 border-transparent focus:outline-none focus:border-primary/30 focus:bg-background transition-all"
                  placeholder="cafe-sonnenschein (auto-generiert)"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Kategorie</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full h-11 px-4 rounded-xl bg-muted border-2 border-transparent focus:outline-none focus:border-primary/30 focus:bg-background transition-all"
                  placeholder="z.B. Gastronomie"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Stadt</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                  className="w-full h-11 px-4 rounded-xl bg-muted border-2 border-transparent focus:outline-none focus:border-primary/30 focus:bg-background transition-all"
                  placeholder="z.B. Brugg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Strasse</label>
                <input
                  type="text"
                  value={formData.address_street}
                  onChange={(e) => setFormData(prev => ({ ...prev, address_street: e.target.value }))}
                  className="w-full h-11 px-4 rounded-xl bg-muted border-2 border-transparent focus:outline-none focus:border-primary/30 focus:bg-background transition-all"
                  placeholder="z.B. Bahnhofstrasse"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium mb-1">Nr.</label>
                  <input
                    type="text"
                    value={formData.address_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, address_number: e.target.value }))}
                    className="w-full h-11 px-4 rounded-xl bg-muted border-2 border-transparent focus:outline-none focus:border-primary/30 focus:bg-background transition-all"
                    placeholder="12"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">PLZ</label>
                  <input
                    type="text"
                    value={formData.postal_code}
                    onChange={(e) => setFormData(prev => ({ ...prev, postal_code: e.target.value }))}
                    className="w-full h-11 px-4 rounded-xl bg-muted border-2 border-transparent focus:outline-none focus:border-primary/30 focus:bg-background transition-all"
                    placeholder="5200"
                  />
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Kurzbeschreibung</label>
              <input
                type="text"
                value={formData.short_description}
                onChange={(e) => setFormData(prev => ({ ...prev, short_description: e.target.value }))}
                className="w-full h-11 px-4 rounded-xl bg-muted border-2 border-transparent focus:outline-none focus:border-primary/30 focus:bg-background transition-all"
                placeholder="Kurze Beschreibung für Listen"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Beschreibung</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-4 py-3 rounded-xl bg-muted border-2 border-transparent focus:outline-none focus:border-primary/30 focus:bg-background transition-all resize-none"
                placeholder="Ausführliche Beschreibung"
              />
            </div>
            
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="h-5 w-5 rounded"
                />
                <span className="text-sm font-medium">Aktiv</span>
              </label>
              
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_featured}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_featured: e.target.checked }))}
                  className="h-5 w-5 rounded"
                />
                <span className="text-sm font-medium">Featured</span>
              </label>
            </div>
            
            <div className="flex gap-3 pt-2">
              <button type="submit" className="btn-primary">
                <Check className="h-4 w-4" />
                {editingPartner ? 'Speichern' : 'Erstellen'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingPartner(null);
                  resetForm();
                }}
                className="btn-ghost"
              >
                Abbrechen
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Partners List */}
      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-muted animate-pulse" />
          ))
        ) : filteredPartners.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Store className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Keine Partner gefunden</p>
          </div>
        ) : (
          filteredPartners.map(partner => (
            <div
              key={partner.id}
              className="card-base p-4 flex items-center gap-4"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/20 flex-shrink-0">
                {partner.logo_url ? (
                  <img src={partner.logo_url} alt={partner.name} className="h-full w-full object-cover rounded-2xl" />
                ) : (
                  <Store className="h-6 w-6 text-secondary" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold truncate">{partner.name}</h3>
                  {partner.is_featured && (
                    <Star className="h-4 w-4 text-accent fill-accent" />
                  )}
                  {!partner.is_active && (
                    <span className="px-2 py-0.5 rounded text-xs bg-muted text-muted-foreground">Inaktiv</span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  {partner.category && <span>{partner.category}</span>}
                  {partner.city && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {partner.city}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEditForm(partner)}
                  className="p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <Edit className="h-4 w-4 text-muted-foreground" />
                </button>
                <button
                  onClick={() => handleDeletePartner(partner)}
                  className="p-2 rounded-lg hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
