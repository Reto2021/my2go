import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCampaignPartners } from '@/hooks/useSeasonalCampaigns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Plus, Trash2, Search, Store } from 'lucide-react';

interface Props {
  campaignId: string;
}

export function CampaignPartnerManager({ campaignId }: Props) {
  const { data: campaignPartners = [], isLoading } = useCampaignPartners(campaignId);
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  // Fetch all partners for the add list
  const { data: allPartners = [] } = useQuery({
    queryKey: ['partners-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partners')
        .select('id, name, city, logo_url, category')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data || [];
    },
  });

  const assignedIds = new Set(campaignPartners.map(cp => cp.partner_id));

  const filteredPartners = allPartners.filter(p =>
    !assignedIds.has(p.id) &&
    (p.name.toLowerCase().includes(search.toLowerCase()) ||
     p.city?.toLowerCase().includes(search.toLowerCase()) ||
     p.category?.toLowerCase().includes(search.toLowerCase()))
  );

  const addPartner = async (partnerId: string) => {
    const { error } = await supabase
      .from('campaign_partners')
      .insert({ campaign_id: campaignId, partner_id: partnerId });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Partner hinzugefügt');
      queryClient.invalidateQueries({ queryKey: ['campaign-partners', campaignId] });
    }
  };

  const removePartner = async (id: string) => {
    const { error } = await supabase.from('campaign_partners').delete().eq('id', id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Partner entfernt');
      queryClient.invalidateQueries({ queryKey: ['campaign-partners', campaignId] });
    }
  };

  // Get partner details for assigned partners
  const assignedPartnerDetails = campaignPartners.map(cp => {
    const partner = allPartners.find(p => p.id === cp.partner_id);
    return { ...cp, partner };
  });

  return (
    <div className="space-y-4 mt-4">
      {/* Assigned Partners */}
      <div>
        <h4 className="font-semibold text-sm mb-2">Zugewiesene Partner ({campaignPartners.length})</h4>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Laden...</p>
        ) : assignedPartnerDetails.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">Noch keine Partner zugewiesen</p>
        ) : (
          <div className="space-y-2">
            {assignedPartnerDetails.map(cp => (
              <div key={cp.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                {cp.partner?.logo_url ? (
                  <img src={cp.partner.logo_url} alt="" className="w-8 h-8 rounded-lg object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Store className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{cp.partner?.name || 'Unbekannt'}</p>
                  <p className="text-xs text-muted-foreground">{cp.partner?.city} · {cp.partner?.category}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => removePartner(cp.id)} className="text-destructive shrink-0">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Partner */}
      <div>
        <h4 className="font-semibold text-sm mb-2">Partner hinzufügen</h4>
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Partner suchen..."
            className="pl-9"
          />
        </div>
        <div className="space-y-1.5 max-h-60 overflow-y-auto">
          {filteredPartners.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-3">
              {search ? 'Kein Partner gefunden' : 'Alle Partner bereits zugewiesen'}
            </p>
          ) : (
            filteredPartners.slice(0, 20).map(p => (
              <button
                key={p.id}
                onClick={() => addPartner(p.id)}
                className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-accent/10 transition-colors text-left"
              >
                {p.logo_url ? (
                  <img src={p.logo_url} alt="" className="w-7 h-7 rounded-lg object-cover" />
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center">
                    <Store className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.city} · {p.category}</p>
                </div>
                <Plus className="h-4 w-4 text-accent shrink-0" />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
