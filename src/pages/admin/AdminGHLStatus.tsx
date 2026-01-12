import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  Zap, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  RefreshCw, 
  Search,
  ExternalLink,
  AlertTriangle,
  Store,
  Users,
  TrendingUp,
  Activity,
  Loader2,
  ChevronRight,
  Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface PartnerGHLStatus {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  contact_email: string | null;
  city: string | null;
  ghl_location_id: string | null;
  ghl_synced_at: string | null;
  ghl_sync_status: string | null;
  created_at: string;
  synced_contacts_count: number;
}

type FilterStatus = 'all' | 'synced' | 'pending' | 'error';

export default function AdminGHLStatus() {
  const [partners, setPartners] = useState<PartnerGHLStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [syncingPartnerId, setSyncingPartnerId] = useState<string | null>(null);
  const [isBulkSyncing, setIsBulkSyncing] = useState(false);

  const loadPartners = async () => {
    setIsLoading(true);
    try {
      // Load partners
      const { data: partnersData, error: partnersError } = await supabase
        .from('partners')
        .select('id, name, slug, is_active, contact_email, city, ghl_location_id, ghl_synced_at, ghl_sync_status, created_at')
        .order('name');

      if (partnersError) throw partnersError;

      // Count synced contacts per partner from transactions (partner_visit or partner_purchase indicate a synced contact)
      const { data: contactCounts, error: countsError } = await supabase
        .from('transactions')
        .select('partner_id')
        .in('source', ['partner_visit', 'partner_purchase'])
        .not('partner_id', 'is', null);

      if (countsError) throw countsError;

      // Count unique user_ids per partner from redemptions as a proxy for synced contacts
      const { data: redemptionCounts, error: redemptionError } = await supabase
        .from('redemptions')
        .select('partner_id, user_id');

      if (redemptionError) throw redemptionError;

      // Build a map of partner_id -> unique user count from redemptions
      const partnerContactMap = new Map<string, Set<string>>();
      
      redemptionCounts?.forEach(r => {
        if (r.partner_id) {
          if (!partnerContactMap.has(r.partner_id)) {
            partnerContactMap.set(r.partner_id, new Set());
          }
          partnerContactMap.get(r.partner_id)!.add(r.user_id);
        }
      });

      // Also add from transactions
      const { data: transactionUsers, error: txError } = await supabase
        .from('transactions')
        .select('partner_id, user_id')
        .not('partner_id', 'is', null);

      if (!txError && transactionUsers) {
        transactionUsers.forEach(t => {
          if (t.partner_id) {
            if (!partnerContactMap.has(t.partner_id)) {
              partnerContactMap.set(t.partner_id, new Set());
            }
            partnerContactMap.get(t.partner_id)!.add(t.user_id);
          }
        });
      }

      // Merge counts into partners
      const partnersWithCounts = (partnersData || []).map(p => ({
        ...p,
        synced_contacts_count: partnerContactMap.get(p.id)?.size || 0
      }));

      setPartners(partnersWithCounts);
    } catch (error) {
      console.error('Error loading partners:', error);
      toast.error('Partner konnten nicht geladen werden');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPartners();
  }, []);

  const syncSinglePartner = async (partner: PartnerGHLStatus) => {
    if (!partner.contact_email) {
      toast.error('Partner hat keine E-Mail-Adresse');
      return;
    }

    setSyncingPartnerId(partner.id);
    try {
      const { data, error } = await supabase.functions.invoke('ghl-sync', {
        body: {
          action: 'create-subaccount',
          partnerId: partner.id,
          partnerName: partner.name,
          email: partner.contact_email,
          city: partner.city,
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(`${partner.name}: GHL Sub-Account erstellt`);
        // Update local state
        setPartners(prev => prev.map(p => 
          p.id === partner.id 
            ? { ...p, ghl_location_id: data.locationId, ghl_sync_status: 'synced', ghl_synced_at: new Date().toISOString() }
            : p
        ));
      } else {
        throw new Error(data?.error || 'Unbekannter Fehler');
      }
    } catch (error: any) {
      console.error('Sync error:', error);
      toast.error(`${partner.name}: ${error.message || 'Sync fehlgeschlagen'}`);
      // Update status to error
      setPartners(prev => prev.map(p => 
        p.id === partner.id 
          ? { ...p, ghl_sync_status: 'error' }
          : p
      ));
    } finally {
      setSyncingPartnerId(null);
    }
  };

  const syncAllPending = async () => {
    const pendingPartners = partners.filter(p => 
      !p.ghl_location_id && 
      p.ghl_sync_status !== 'synced' && 
      p.contact_email &&
      p.is_active
    );

    if (pendingPartners.length === 0) {
      toast.info('Keine Partner zum Synchronisieren');
      return;
    }

    setIsBulkSyncing(true);
    let successCount = 0;
    let errorCount = 0;

    for (const partner of pendingPartners) {
      try {
        const { data, error } = await supabase.functions.invoke('ghl-sync', {
          body: {
            action: 'create-subaccount',
            partnerId: partner.id,
            partnerName: partner.name,
            email: partner.contact_email,
            city: partner.city,
          },
        });

        if (error) throw error;

        if (data?.success) {
          successCount++;
          setPartners(prev => prev.map(p => 
            p.id === partner.id 
              ? { ...p, ghl_location_id: data.locationId, ghl_sync_status: 'synced', ghl_synced_at: new Date().toISOString() }
              : p
          ));
        } else {
          errorCount++;
        }
      } catch {
        errorCount++;
      }

      // Small delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setIsBulkSyncing(false);
    
    if (successCount > 0) {
      toast.success(`${successCount} Partner synchronisiert`);
    }
    if (errorCount > 0) {
      toast.error(`${errorCount} Partner fehlgeschlagen`);
    }
  };

  // Filter and search
  const filteredPartners = partners.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         p.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         p.contact_email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    switch (filterStatus) {
      case 'synced':
        return p.ghl_sync_status === 'synced' && p.ghl_location_id;
      case 'pending':
        return !p.ghl_location_id && p.ghl_sync_status !== 'error';
      case 'error':
        return p.ghl_sync_status === 'error';
      default:
        return true;
    }
  });

  // Stats
  const stats = {
    total: partners.length,
    synced: partners.filter(p => p.ghl_sync_status === 'synced' && p.ghl_location_id).length,
    pending: partners.filter(p => !p.ghl_location_id && p.ghl_sync_status !== 'error').length,
    error: partners.filter(p => p.ghl_sync_status === 'error').length,
    noEmail: partners.filter(p => !p.contact_email).length,
  };

  const getStatusBadge = (partner: PartnerGHLStatus) => {
    if (partner.ghl_sync_status === 'synced' && partner.ghl_location_id) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-success/15 text-success">
          <CheckCircle2 className="h-3 w-3" />
          Verbunden
        </span>
      );
    }
    if (partner.ghl_sync_status === 'error') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-destructive/15 text-destructive">
          <XCircle className="h-3 w-3" />
          Fehler
        </span>
      );
    }
    if (!partner.contact_email) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-warning/15 text-warning">
          <AlertTriangle className="h-3 w-3" />
          Keine E-Mail
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
        <Clock className="h-3 w-3" />
        Ausstehend
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            GoHighLevel Status
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Überwache den Sync-Status aller Partner Sub-Accounts
          </p>
        </div>
        <Button 
          onClick={syncAllPending}
          disabled={isBulkSyncing || stats.pending === 0}
          className="gap-2"
        >
          {isBulkSyncing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Alle synchronisieren
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div 
          className={cn(
            'rounded-xl border p-4 cursor-pointer transition-all',
            filterStatus === 'all' ? 'border-primary bg-primary/5' : 'hover:border-muted-foreground/30'
          )}
          onClick={() => setFilterStatus('all')}
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Store className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Gesamt</p>
            </div>
          </div>
        </div>

        <div 
          className={cn(
            'rounded-xl border p-4 cursor-pointer transition-all',
            filterStatus === 'synced' ? 'border-success bg-success/5' : 'hover:border-muted-foreground/30'
          )}
          onClick={() => setFilterStatus('synced')}
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.synced}</p>
              <p className="text-xs text-muted-foreground">Verbunden</p>
            </div>
          </div>
        </div>

        <div 
          className={cn(
            'rounded-xl border p-4 cursor-pointer transition-all',
            filterStatus === 'pending' ? 'border-warning bg-warning/5' : 'hover:border-muted-foreground/30'
          )}
          onClick={() => setFilterStatus('pending')}
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.pending}</p>
              <p className="text-xs text-muted-foreground">Ausstehend</p>
            </div>
          </div>
        </div>

        <div 
          className={cn(
            'rounded-xl border p-4 cursor-pointer transition-all',
            filterStatus === 'error' ? 'border-destructive bg-destructive/5' : 'hover:border-muted-foreground/30'
          )}
          onClick={() => setFilterStatus('error')}
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
              <XCircle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.error}</p>
              <p className="text-xs text-muted-foreground">Fehler</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sync Progress */}
      {stats.total > 0 && (
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Sync-Fortschritt</span>
            <span className="text-sm text-muted-foreground">
              {stats.synced} von {stats.total} ({Math.round((stats.synced / stats.total) * 100)}%)
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-success to-primary transition-all duration-500"
              style={{ width: `${(stats.synced / stats.total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Partner suchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Partner List */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-4 text-sm font-medium">Partner</th>
                <th className="text-left p-4 text-sm font-medium">Stadt</th>
                <th className="text-left p-4 text-sm font-medium">Status</th>
                <th className="text-center p-4 text-sm font-medium">Kontakte</th>
                <th className="text-left p-4 text-sm font-medium">GHL Location ID</th>
                <th className="text-left p-4 text-sm font-medium">Letzter Sync</th>
                <th className="text-right p-4 text-sm font-medium">Aktion</th>
              </tr>
            </thead>
            <tbody>
              {filteredPartners.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    Keine Partner gefunden
                  </td>
                </tr>
              ) : (
                filteredPartners.map((partner) => (
                  <tr 
                    key={partner.id} 
                    className={cn(
                      'border-b last:border-0 hover:bg-muted/30 transition-colors',
                      !partner.is_active && 'opacity-50'
                    )}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Store className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{partner.name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {partner.contact_email || 'Keine E-Mail'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {partner.city || '-'}
                    </td>
                    <td className="p-4">
                      {getStatusBadge(partner)}
                    </td>
                    <td className="p-4 text-center">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10">
                        <Users className="h-3.5 w-3.5 text-primary" />
                        <span className="font-semibold text-sm tabular-nums">
                          {partner.synced_contacts_count}
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      {partner.ghl_location_id ? (
                        <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                          {partner.ghl_location_id.substring(0, 12)}...
                        </code>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {partner.ghl_synced_at 
                        ? format(new Date(partner.ghl_synced_at), 'dd.MM.yy HH:mm', { locale: de })
                        : '-'
                      }
                    </td>
                    <td className="p-4 text-right">
                      {partner.ghl_sync_status === 'synced' && partner.ghl_location_id ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1 text-muted-foreground"
                          onClick={() => window.open(`https://app.gohighlevel.com/v2/location/${partner.ghl_location_id}`, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                          Öffnen
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={!partner.contact_email || syncingPartnerId === partner.id}
                          onClick={() => syncSinglePartner(partner)}
                          className="gap-1"
                        >
                          {syncingPartnerId === partner.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4" />
                          )}
                          Sync
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Box */}
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
        <div className="flex items-start gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
            <Activity className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="font-medium text-sm">Automatische Synchronisation</p>
            <p className="text-sm text-muted-foreground mt-1">
              Neue Partner werden automatisch mit GoHighLevel synchronisiert, wenn sie sich 
              zum ersten Mal im Partner-Portal anmelden. Du kannst hier den Status überwachen 
              und bei Bedarf manuell synchronisieren.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
