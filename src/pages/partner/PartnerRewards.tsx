import { useEffect, useState } from 'react';
import { 
  Plus, 
  Gift, 
  Edit2, 
  Trash2,
  ToggleLeft,
  ToggleRight,
  Building2,
  Lock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePartner } from '@/components/partner/PartnerGuard';
import { usePartnerTier } from '@/hooks/usePartnerTier';
import { UpgradeBanner } from '@/components/partner/UpgradeBanner';
import { 
  getPartnerRewards, 
  createReward, 
  updateReward, 
  deleteReward 
} from '@/lib/partner-helpers';
import { Reward } from '@/lib/supabase-helpers';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { toast } from 'sonner';
import { RewardSponsorManager } from '@/components/partner/RewardSponsorManager';
import { useRewardSponsors } from '@/hooks/useRewardSponsors';
import { SponsorBadgeCompact } from '@/components/sponsors/SponsorBadge';

const rewardTypes = [
  { value: 'fixed_discount', label: 'Fixer Rabatt (CHF)' },
  { value: 'percent_discount', label: 'Prozent-Rabatt (%)' },
  { value: 'free_item', label: 'Gratis-Artikel' },
  { value: 'two_for_one', label: '2 für 1' },
  { value: 'experience', label: 'Erlebnis' },
];

type RewardType = 'fixed_discount' | 'percent_discount' | 'free_item' | 'topup_bonus' | 'experience' | 'two_for_one';

export default function PartnerRewards() {
  const { partnerInfo } = usePartner();
  const { tier, canCreateRewards, isLoading: tierLoading } = usePartnerTier(partnerInfo?.partnerId || null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingReward, setEditingReward] = useState<Reward | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    taler_cost: 100,
    reward_type: 'fixed_discount' as RewardType,
    value_amount: 5,
    value_percent: 10,
    terms: '',
    stock_total: null as number | null,
    max_per_user: null as number | null,
    is_active: true,
  });

  // Show upgrade banner if starter tier
  if (!tierLoading && !canCreateRewards && partnerInfo?.partnerId) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Gutscheine & Rewards</h1>
        </div>
        
        <UpgradeBanner 
          partnerId={partnerInfo.partnerId} 
          featureName="Gutscheine & Rewards"
        />
        
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <Lock className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Feature gesperrt</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Mit dem Partner-Paket kannst du eigene Gutscheine erstellen und deine Kunden mit exklusiven Rabatten belohnen.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  useEffect(() => {
    loadRewards();
  }, [partnerInfo?.partnerId]);

  async function loadRewards() {
    if (!partnerInfo?.partnerId) return;
    
    try {
      const data = await getPartnerRewards(partnerInfo.partnerId);
      setRewards(data);
    } catch (error) {
      console.error('Error loading rewards:', error);
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setFormData({
      title: '',
      description: '',
      taler_cost: 100,
      reward_type: 'fixed_discount',
      value_amount: 5,
      value_percent: 10,
      terms: '',
      stock_total: null,
      max_per_user: null,
      is_active: true,
    });
    setEditingReward(null);
    setShowForm(false);
  }

  function openEditForm(reward: Reward) {
    setFormData({
      title: reward.title,
      description: reward.description || '',
      taler_cost: reward.taler_cost,
      reward_type: reward.reward_type,
      value_amount: reward.value_amount || 5,
      value_percent: reward.value_percent || 10,
      terms: reward.terms || '',
      stock_total: reward.stock_total,
      max_per_user: (reward as any).max_per_user ?? null,
      is_active: reward.is_active ?? true,
    });
    setEditingReward(reward);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!partnerInfo?.partnerId) return;

    const rewardData = {
      partner_id: partnerInfo.partnerId,
      title: formData.title,
      description: formData.description || null,
      taler_cost: formData.taler_cost,
      reward_type: formData.reward_type,
      value_amount: formData.reward_type === 'fixed_discount' ? formData.value_amount : null,
      value_percent: formData.reward_type === 'percent_discount' ? formData.value_percent : null,
      terms: formData.terms || null,
      stock_total: formData.stock_total,
      stock_remaining: formData.stock_total,
      max_per_user: formData.max_per_user,
      is_active: formData.is_active,
    };

    if (editingReward) {
      const { success, error } = await updateReward(editingReward.id, rewardData);
      if (success) {
        toast.success('Gutschein aktualisiert');
        resetForm();
        loadRewards();
      } else {
        toast.error('Fehler: ' + error);
      }
    } else {
      const { reward, error } = await createReward(rewardData);
      if (reward) {
        toast.success('Gutschein erstellt');
        resetForm();
        loadRewards();
      } else {
        toast.error('Fehler: ' + error);
      }
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Gutschein wirklich löschen?')) return;
    
    const { success, error } = await deleteReward(id);
    if (success) {
      toast.success('Gutschein gelöscht');
      loadRewards();
    } else {
      toast.error('Fehler: ' + error);
    }
  }

  async function handleToggleActive(reward: Reward) {
    const { success } = await updateReward(reward.id, { is_active: !reward.is_active });
    if (success) {
      toast.success(reward.is_active ? 'Gutschein deaktiviert' : 'Gutschein aktiviert');
      loadRewards();
    }
  }

  if (loading) {
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
          <h1 className="text-2xl font-bold">Gutscheine verwalten</h1>
          <p className="text-muted-foreground">
            Erstelle und verwalte deine Gutscheine
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Neuer Gutschein
        </Button>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingReward ? 'Gutschein bearbeiten' : 'Neuer Gutschein'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Titel *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="z.B. CHF 5 Rabatt"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="taler_cost">Taler-Preis *</Label>
                  <Input
                    id="taler_cost"
                    type="number"
                    min="1"
                    value={formData.taler_cost}
                    onChange={(e) => setFormData({ ...formData, taler_cost: parseInt(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Beschreibung</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Beschreibe deinen Gutschein..."
                  rows={3}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reward_type">Gutschein-Typ</Label>
                  <Select 
                    value={formData.reward_type} 
                    onValueChange={(value: any) => setFormData({ ...formData, reward_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {rewardTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {formData.reward_type === 'fixed_discount' && (
                  <div className="space-y-2">
                    <Label htmlFor="value_amount">Rabatt-Wert (CHF)</Label>
                    <Input
                      id="value_amount"
                      type="number"
                      min="1"
                      value={formData.value_amount}
                      onChange={(e) => setFormData({ ...formData, value_amount: parseInt(e.target.value) })}
                    />
                  </div>
                )}

                {formData.reward_type === 'percent_discount' && (
                  <div className="space-y-2">
                    <Label htmlFor="value_percent">Rabatt-Prozent (%)</Label>
                    <Input
                      id="value_percent"
                      type="number"
                      min="1"
                      max="100"
                      value={formData.value_percent}
                      onChange={(e) => setFormData({ ...formData, value_percent: parseInt(e.target.value) })}
                    />
                  </div>
                )}
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stock_total">Limitierte Stückzahl</Label>
                  <Input
                    id="stock_total"
                    type="number"
                    min="1"
                    value={formData.stock_total || ''}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      stock_total: e.target.value ? parseInt(e.target.value) : null 
                    })}
                    placeholder="Unbegrenzt"
                  />
                  <p className="text-xs text-muted-foreground">Leer = unbegrenzt</p>
                </div>

                <div className="space-y-2">
                  <Label>Einlösung pro Kunde</Label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, max_per_user: 1 })}
                      className={cn(
                        'flex-1 px-3 py-2 text-sm font-medium rounded-lg border transition-colors',
                        formData.max_per_user === 1
                          ? 'bg-secondary text-secondary-foreground border-secondary'
                          : 'bg-muted text-muted-foreground border-border hover:bg-muted/80'
                      )}
                    >
                      Einmalig
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, max_per_user: null })}
                      className={cn(
                        'flex-1 px-3 py-2 text-sm font-medium rounded-lg border transition-colors',
                        formData.max_per_user === null
                          ? 'bg-secondary text-secondary-foreground border-secondary'
                          : 'bg-muted text-muted-foreground border-border hover:bg-muted/80'
                      )}
                    >
                      Unbegrenzt
                    </button>
                  </div>
                  {formData.max_per_user !== null && formData.max_per_user !== 1 && (
                    <Input
                      type="number"
                      min="1"
                      value={formData.max_per_user || ''}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        max_per_user: e.target.value ? parseInt(e.target.value) : null 
                      })}
                      placeholder="Anzahl"
                      className="mt-2"
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="terms">Bedingungen</Label>
                  <Input
                    id="terms"
                    value={formData.terms}
                    onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                    placeholder="z.B. Gültig ab CHF 20 Einkauf"
                  />
                </div>
              </div>

              {/* Sponsor Management */}
              {editingReward ? (
                <RewardSponsorManager 
                  rewardId={editingReward.id} 
                  onUpdate={loadRewards}
                />
              ) : (
                <div className="rounded-lg border border-dashed border-muted-foreground/30 p-4 bg-muted/30">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Building2 className="h-4 w-4" />
                    <span className="text-sm">
                      Sponsoren können nach dem Erstellen des Gutscheins hinzugefügt werden.
                    </span>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button type="submit">
                  {editingReward ? 'Speichern' : 'Erstellen'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Abbrechen
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Rewards List */}
      {rewards.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Gift className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">Noch keine Rewards</h3>
            <p className="text-muted-foreground mb-4">
              Erstelle deinen ersten Reward, um Kunden anzulocken.
            </p>
            <Button onClick={() => setShowForm(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Ersten Reward erstellen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {rewards.map((reward) => (
            <RewardListItem 
              key={reward.id}
              reward={reward}
              onEdit={openEditForm}
              onDelete={handleDelete}
              onToggleActive={handleToggleActive}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Separate component to handle sponsor loading per reward
function RewardListItem({ 
  reward, 
  onEdit, 
  onDelete, 
  onToggleActive 
}: { 
  reward: Reward;
  onEdit: (reward: Reward) => void;
  onDelete: (id: string) => void;
  onToggleActive: (reward: Reward) => void;
}) {
  const { sponsors } = useRewardSponsors(reward.id);

  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
              <Gift className="h-6 w-6 text-accent" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold">{reward.title}</h3>
                <Badge variant={reward.is_active ? 'default' : 'secondary'}>
                  {reward.is_active ? 'Aktiv' : 'Inaktiv'}
                </Badge>
                {sponsors.length > 0 && (
                  <Badge variant="outline" className="gap-1">
                    <Building2 className="h-3 w-3" />
                    {sponsors.length} Sponsor{sponsors.length > 1 ? 'en' : ''}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {reward.taler_cost} Taler • 
                {reward.reward_type === 'fixed_discount' && ` CHF ${reward.value_amount} Rabatt`}
                {reward.reward_type === 'percent_discount' && ` ${reward.value_percent}% Rabatt`}
                {reward.reward_type === 'free_item' && ' Gratis-Artikel'}
                {reward.reward_type === 'two_for_one' && ' 2 für 1'}
                {reward.reward_type === 'experience' && ' Erlebnis'}
                {reward.stock_total && ` • ${reward.stock_remaining}/${reward.stock_total} verfügbar`}
                {(reward as any).max_per_user === 1 && ' • Einmalig'}
                {(reward as any).max_per_user && (reward as any).max_per_user > 1 && ` • Max. ${(reward as any).max_per_user}x pro Kunde`}
              </p>
              {sponsors.length > 0 && (
                <div className="flex items-center gap-2 mt-1">
                  {sponsors.map((rs) => rs.sponsor && (
                    <SponsorBadgeCompact 
                      key={rs.id} 
                      sponsor={rs.sponsor} 
                      className="text-xs"
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onToggleActive(reward)}
              title={reward.is_active ? 'Deaktivieren' : 'Aktivieren'}
            >
              {reward.is_active ? (
                <ToggleRight className="h-5 w-5 text-green-600" />
              ) : (
                <ToggleLeft className="h-5 w-5 text-muted-foreground" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(reward)}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(reward.id)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
