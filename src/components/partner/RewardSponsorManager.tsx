import { useState, useEffect } from 'react';
import { X, Plus, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Sponsor {
  id: string;
  name: string;
  logo_url: string | null;
  website: string | null;
}

interface RewardSponsor {
  id: string;
  sponsor_id: string;
  sponsorship_type: string | null;
  display_text: string | null;
  sponsor?: Sponsor;
}

interface RewardSponsorManagerProps {
  rewardId: string;
  onUpdate?: () => void;
}

export function RewardSponsorManager({ rewardId, onUpdate }: RewardSponsorManagerProps) {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [rewardSponsors, setRewardSponsors] = useState<RewardSponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [selectedSponsorId, setSelectedSponsorId] = useState<string>('');
  const [sponsorshipType, setSponsorshipType] = useState<string>('financial');
  const [displayText, setDisplayText] = useState<string>('');

  useEffect(() => {
    loadData();
  }, [rewardId]);

  async function loadData() {
    setLoading(true);
    try {
      // Load all active sponsors
      const { data: sponsorsData } = await supabase
        .from('sponsors')
        .select('*')
        .eq('is_active', true)
        .order('name');

      // Load existing reward sponsors
      const { data: rewardSponsorsData } = await supabase
        .from('reward_sponsors')
        .select(`
          id,
          sponsor_id,
          sponsorship_type,
          display_text,
          sponsors (
            id,
            name,
            logo_url,
            website
          )
        `)
        .eq('reward_id', rewardId);

      setSponsors(sponsorsData || []);
      setRewardSponsors(
        (rewardSponsorsData || []).map((rs: any) => ({
          ...rs,
          sponsor: rs.sponsors,
        }))
      );
    } catch (error) {
      console.error('Error loading sponsor data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddSponsor() {
    if (!selectedSponsorId) {
      toast.error('Bitte wähle einen Sponsor aus');
      return;
    }

    // Check if already assigned
    if (rewardSponsors.some(rs => rs.sponsor_id === selectedSponsorId)) {
      toast.error('Dieser Sponsor ist bereits zugeordnet');
      return;
    }

    try {
      const { error } = await supabase
        .from('reward_sponsors')
        .insert({
          reward_id: rewardId,
          sponsor_id: selectedSponsorId,
          sponsorship_type: sponsorshipType,
          display_text: displayText || null,
        });

      if (error) throw error;

      toast.success('Sponsor hinzugefügt');
      setAdding(false);
      setSelectedSponsorId('');
      setDisplayText('');
      setSponsorshipType('financial');
      loadData();
      onUpdate?.();
    } catch (error) {
      console.error('Error adding sponsor:', error);
      toast.error('Fehler beim Hinzufügen');
    }
  }

  async function handleRemoveSponsor(rewardSponsorId: string) {
    if (!confirm('Sponsor-Zuordnung wirklich entfernen?')) return;

    try {
      const { error } = await supabase
        .from('reward_sponsors')
        .delete()
        .eq('id', rewardSponsorId);

      if (error) throw error;

      toast.success('Sponsor entfernt');
      loadData();
      onUpdate?.();
    } catch (error) {
      console.error('Error removing sponsor:', error);
      toast.error('Fehler beim Entfernen');
    }
  }

  // Get sponsors that are not yet assigned
  const availableSponsors = sponsors.filter(
    s => !rewardSponsors.some(rs => rs.sponsor_id === s.id)
  );

  if (loading) {
    return (
      <div className="text-sm text-muted-foreground py-2">
        Lade Sponsoren...
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <Label className="flex items-center gap-2">
        <Building2 className="h-4 w-4" />
        Sponsoren
      </Label>

      {/* Current Sponsors */}
      {rewardSponsors.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {rewardSponsors.map((rs) => (
            <Badge 
              key={rs.id} 
              variant="secondary" 
              className="flex items-center gap-2 pr-1"
            >
              {rs.sponsor?.logo_url && (
                <img 
                  src={rs.sponsor.logo_url} 
                  alt="" 
                  className="h-4 w-4 rounded-sm object-contain"
                />
              )}
              <span>{rs.sponsor?.name}</span>
              {rs.sponsorship_type && rs.sponsorship_type !== 'financial' && (
                <span className="text-xs opacity-60">
                  ({rs.sponsorship_type === 'product' ? 'Produkt' : rs.sponsorship_type})
                </span>
              )}
              <button
                type="button"
                onClick={() => handleRemoveSponsor(rs.id)}
                className="ml-1 p-0.5 rounded-full hover:bg-destructive/20 text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Add Sponsor Form */}
      {adding ? (
        <div className="border rounded-lg p-3 space-y-3 bg-muted/50">
          <div className="space-y-2">
            <Label htmlFor="sponsor-select">Sponsor auswählen</Label>
            <Select value={selectedSponsorId} onValueChange={setSelectedSponsorId}>
              <SelectTrigger id="sponsor-select">
                <SelectValue placeholder="Sponsor wählen..." />
              </SelectTrigger>
              <SelectContent>
                {availableSponsors.length === 0 ? (
                  <SelectItem value="_none" disabled>
                    Keine Sponsoren verfügbar
                  </SelectItem>
                ) : (
                  availableSponsors.map((sponsor) => (
                    <SelectItem key={sponsor.id} value={sponsor.id}>
                      <div className="flex items-center gap-2">
                        {sponsor.logo_url && (
                          <img 
                            src={sponsor.logo_url} 
                            alt="" 
                            className="h-4 w-4 rounded-sm object-contain"
                          />
                        )}
                        {sponsor.name}
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="sponsorship-type">Art</Label>
              <Select value={sponsorshipType} onValueChange={setSponsorshipType}>
                <SelectTrigger id="sponsorship-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="financial">Finanziell</SelectItem>
                  <SelectItem value="product">Produkt</SelectItem>
                  <SelectItem value="service">Service</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="display-text">Anzeigetext (optional)</Label>
              <Input
                id="display-text"
                value={displayText}
                onChange={(e) => setDisplayText(e.target.value)}
                placeholder="z.B. Gesponsert von"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              type="button" 
              size="sm" 
              onClick={handleAddSponsor}
              disabled={!selectedSponsorId}
            >
              Hinzufügen
            </Button>
            <Button 
              type="button" 
              size="sm" 
              variant="outline" 
              onClick={() => {
                setAdding(false);
                setSelectedSponsorId('');
                setDisplayText('');
              }}
            >
              Abbrechen
            </Button>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setAdding(true)}
          className="gap-1"
          disabled={availableSponsors.length === 0 && rewardSponsors.length === 0}
        >
          <Plus className="h-3 w-3" />
          Sponsor zuordnen
        </Button>
      )}

      {sponsors.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Keine Sponsoren verfügbar. Bitte kontaktiere den Admin.
        </p>
      )}
    </div>
  );
}
