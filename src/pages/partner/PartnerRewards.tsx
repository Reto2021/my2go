import { useEffect, useState } from 'react';
import { 
  Plus, 
  Gift, 
  Edit2, 
  Trash2,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePartner } from '@/components/partner/PartnerGuard';
import { 
  getPartnerRewards, 
  createReward, 
  updateReward, 
  deleteReward 
} from '@/lib/partner-helpers';
import { Reward } from '@/lib/supabase-helpers';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { toast } from 'sonner';

const rewardTypes = [
  { value: 'fixed_discount', label: 'Fixer Rabatt (CHF)' },
  { value: 'percent_discount', label: 'Prozent-Rabatt (%)' },
  { value: 'free_item', label: 'Gratis-Artikel' },
  { value: 'experience', label: 'Erlebnis' },
];

type RewardType = 'fixed_discount' | 'percent_discount' | 'free_item' | 'topup_bonus' | 'experience';

export default function PartnerRewards() {
  const { partnerInfo } = usePartner();
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
    is_active: true,
  });

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

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stock_total">Limitierte Stückzahl (leer = unbegrenzt)</Label>
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
            <Card key={reward.id}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                      <Gift className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{reward.title}</h3>
                        <Badge variant={reward.is_active ? 'default' : 'secondary'}>
                          {reward.is_active ? 'Aktiv' : 'Inaktiv'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {reward.taler_cost} Taler • 
                        {reward.reward_type === 'fixed_discount' && ` CHF ${reward.value_amount} Rabatt`}
                        {reward.reward_type === 'percent_discount' && ` ${reward.value_percent}% Rabatt`}
                        {reward.reward_type === 'free_item' && ' Gratis-Artikel'}
                        {reward.reward_type === 'experience' && ' Erlebnis'}
                        {reward.stock_total && ` • ${reward.stock_remaining}/${reward.stock_total} verfügbar`}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleActive(reward)}
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
                      onClick={() => openEditForm(reward)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(reward.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
