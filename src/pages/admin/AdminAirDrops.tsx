import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getAllAirDropCodes, 
  createAirDropCode, 
  updateAirDropCode, 
  deleteAirDropCode,
  generateRandomCode,
  AirDropCodeWithStats 
} from '@/lib/admin-helpers';
import { 
  QrCode, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  X,
  Check,
  Copy,
  RefreshCw,
  Calendar,
  Users,
  Coins
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { format, addDays } from 'date-fns';
import { de } from 'date-fns/locale';

export default function AdminAirDrops() {
  const { user } = useAuth();
  const [codes, setCodes] = useState<AirDropCodeWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCode, setEditingCode] = useState<AirDropCodeWithStats | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    code: '',
    taler_value: 50,
    valid_until: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
    max_claims: 1,
    is_active: true,
  });
  
  const loadCodes = async () => {
    setIsLoading(true);
    try {
      const data = await getAllAirDropCodes();
      setCodes(data);
    } catch (error) {
      console.error('Failed to load codes:', error);
      toast.error('Codes konnten nicht geladen werden');
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    loadCodes();
  }, []);
  
  const resetForm = () => {
    setFormData({
      code: generateRandomCode(),
      taler_value: 50,
      valid_until: format(addDays(new Date(), 30), 'yyyy-MM-dd'),
      max_claims: 1,
      is_active: true,
    });
  };
  
  const handleGenerateCode = () => {
    setFormData(prev => ({ ...prev, code: generateRandomCode() }));
  };
  
  const handleCreateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { airDropCode, error } = await createAirDropCode(
      formData.code,
      formData.taler_value,
      new Date(formData.valid_until).toISOString(),
      formData.max_claims,
      user?.id
    );
    
    if (error) {
      toast.error(`Fehler: ${error}`);
      return;
    }
    
    if (airDropCode) {
      setCodes(prev => [airDropCode, ...prev]);
      toast.success('Air Drop Code erfolgreich erstellt');
      setShowCreateForm(false);
      resetForm();
    }
  };
  
  const handleUpdateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCode) return;
    
    const { success, error } = await updateAirDropCode(editingCode.id, {
      taler_value: formData.taler_value,
      valid_until: new Date(formData.valid_until).toISOString(),
      max_claims: formData.max_claims,
      is_active: formData.is_active,
    });
    
    if (error) {
      toast.error(`Fehler: ${error}`);
      return;
    }
    
    if (success) {
      setCodes(prev => prev.map(c => 
        c.id === editingCode.id ? { 
          ...c, 
          taler_value: formData.taler_value,
          valid_until: new Date(formData.valid_until).toISOString(),
          max_claims: formData.max_claims,
          is_active: formData.is_active,
        } : c
      ));
      toast.success('Code erfolgreich aktualisiert');
      setEditingCode(null);
      resetForm();
    }
  };
  
  const handleDeleteCode = async (code: AirDropCodeWithStats) => {
    if (!confirm(`Code "${code.code}" wirklich löschen?`)) return;
    
    const { success, error } = await deleteAirDropCode(code.id);
    
    if (error) {
      toast.error(`Fehler: ${error}`);
      return;
    }
    
    if (success) {
      setCodes(prev => prev.filter(c => c.id !== code.id));
      toast.success('Code erfolgreich gelöscht');
    }
  };
  
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Code in Zwischenablage kopiert');
  };
  
  const openEditForm = (code: AirDropCodeWithStats) => {
    setEditingCode(code);
    setFormData({
      code: code.code,
      taler_value: code.taler_value,
      valid_until: format(new Date(code.valid_until), 'yyyy-MM-dd'),
      max_claims: code.max_claims,
      is_active: code.is_active,
    });
    setShowCreateForm(false);
  };
  
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd.MM.yyyy', { locale: de });
  };
  
  const isExpired = (dateString: string) => {
    return new Date(dateString) < new Date();
  };
  
  const filteredCodes = codes.filter(c => 
    c.code.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Stats
  const activeCodes = codes.filter(c => c.is_active && !isExpired(c.valid_until)).length;
  const totalClaims = codes.reduce((sum, c) => sum + c.current_claims, 0);
  const totalTalerDistributed = codes.reduce((sum, c) => sum + (c.current_claims * c.taler_value), 0);
  
  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Air Drop Codes</h1>
          <p className="text-muted-foreground">{codes.length} Codes insgesamt</p>
        </div>
        <button
          onClick={() => {
            setShowCreateForm(true);
            setEditingCode(null);
            resetForm();
          }}
          className="btn-primary"
        >
          <Plus className="h-4 w-4" />
          Code erstellen
        </button>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card-base p-4 text-center">
          <p className="text-2xl font-bold tabular-nums text-green-500">{activeCodes}</p>
          <p className="text-sm text-muted-foreground">Aktive Codes</p>
        </div>
        <div className="card-base p-4 text-center">
          <p className="text-2xl font-bold tabular-nums">{totalClaims}</p>
          <p className="text-sm text-muted-foreground">Einlösungen</p>
        </div>
        <div className="card-base p-4 text-center">
          <p className="text-2xl font-bold tabular-nums text-accent">{totalTalerDistributed.toLocaleString('de-CH')}</p>
          <p className="text-sm text-muted-foreground">Taler verteilt</p>
        </div>
      </div>
      
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Code suchen..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-12 pl-12 pr-4 rounded-2xl bg-muted border-2 border-transparent focus:outline-none focus:border-primary/30 focus:bg-background transition-all"
        />
      </div>
      
      {/* Create/Edit Form */}
      {(showCreateForm || editingCode) && (
        <div className="card-base p-6 animate-in">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">
              {editingCode ? 'Code bearbeiten' : 'Neuer Air Drop Code'}
            </h2>
            <button
              onClick={() => {
                setShowCreateForm(false);
                setEditingCode(null);
                resetForm();
              }}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <form onSubmit={editingCode ? handleUpdateCode : handleCreateCode} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Code *</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    disabled={!!editingCode}
                    className="flex-1 h-11 px-4 rounded-xl bg-muted border-2 border-transparent focus:outline-none focus:border-primary/30 focus:bg-background transition-all uppercase disabled:opacity-50"
                    placeholder="RADIO-XXXXX"
                  />
                  {!editingCode && (
                    <button
                      type="button"
                      onClick={handleGenerateCode}
                      className="px-3 rounded-xl bg-muted hover:bg-muted/80 transition-colors"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Taler-Wert *</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={formData.taler_value}
                  onChange={(e) => setFormData(prev => ({ ...prev, taler_value: parseInt(e.target.value) || 0 }))}
                  className="w-full h-11 px-4 rounded-xl bg-muted border-2 border-transparent focus:outline-none focus:border-primary/30 focus:bg-background transition-all"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Gültig bis *</label>
                <input
                  type="date"
                  required
                  value={formData.valid_until}
                  onChange={(e) => setFormData(prev => ({ ...prev, valid_until: e.target.value }))}
                  className="w-full h-11 px-4 rounded-xl bg-muted border-2 border-transparent focus:outline-none focus:border-primary/30 focus:bg-background transition-all"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Max. Einlösungen</label>
                <input
                  type="number"
                  min={1}
                  value={formData.max_claims}
                  onChange={(e) => setFormData(prev => ({ ...prev, max_claims: parseInt(e.target.value) || 1 }))}
                  className="w-full h-11 px-4 rounded-xl bg-muted border-2 border-transparent focus:outline-none focus:border-primary/30 focus:bg-background transition-all"
                />
              </div>
            </div>
            
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                className="h-5 w-5 rounded"
              />
              <span className="text-sm font-medium">Aktiv</span>
            </label>
            
            <div className="flex gap-3 pt-2">
              <button type="submit" className="btn-primary">
                <Check className="h-4 w-4" />
                {editingCode ? 'Speichern' : 'Erstellen'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingCode(null);
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
      
      {/* Codes List */}
      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-muted animate-pulse" />
          ))
        ) : filteredCodes.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <QrCode className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Keine Codes gefunden</p>
          </div>
        ) : (
          filteredCodes.map(code => (
            <div
              key={code.id}
              className={cn(
                'card-base p-4 flex items-center gap-4',
                (!code.is_active || isExpired(code.valid_until)) && 'opacity-60'
              )}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10 flex-shrink-0">
                <QrCode className="h-6 w-6 text-accent" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-mono font-bold text-lg">{code.code}</h3>
                  <button
                    onClick={() => handleCopyCode(code.code)}
                    className="p-1 rounded hover:bg-muted transition-colors"
                  >
                    <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                  {!code.is_active && (
                    <span className="px-2 py-0.5 rounded text-xs bg-muted text-muted-foreground">Inaktiv</span>
                  )}
                  {isExpired(code.valid_until) && (
                    <span className="px-2 py-0.5 rounded text-xs bg-destructive/10 text-destructive">Abgelaufen</span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                  <span className="flex items-center gap-1">
                    <Coins className="h-3.5 w-3.5 text-accent" />
                    {code.taler_value} Taler
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {code.current_claims}/{code.max_claims}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    bis {formatDate(code.valid_until)}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEditForm(code)}
                  className="p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <Edit className="h-4 w-4 text-muted-foreground" />
                </button>
                <button
                  onClick={() => handleDeleteCode(code)}
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
