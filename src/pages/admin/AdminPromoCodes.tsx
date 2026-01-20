import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { toast } from 'sonner';
import { 
  Ticket, 
  Plus, 
  Copy, 
  Trash2, 
  Check,
  Percent,
  Calendar,
  Users,
  TrendingUp,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { format, addDays, addMonths } from 'date-fns';
import { de } from 'date-fns/locale';

interface PromoCode {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  max_uses: number | null;
  current_uses: number;
  valid_from: string;
  valid_until: string | null;
  is_active: boolean;
  applies_to: string;
  created_at: string;
  description: string | null;
}

// Stripe coupon IDs we know about
const KNOWN_STRIPE_COUPONS = [
  { id: 'R5RGpBBl', name: 'Plus Verlängerung 10%', percent_off: 10, duration: 'once' },
  { id: 'Ize00xGa', name: 'Non-Profit 50%', percent_off: 50, duration: 'forever' },
];

export default function AdminPromoCodes() {
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [creating, setCreating] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  
  // Form state
  const [newCode, setNewCode] = useState({
    code: '',
    discount_type: 'percent' as 'percent' | 'amount',
    discount_value: 10,
    max_uses: '',
    valid_days: '30',
    applies_to: 'all' as 'plus_monthly' | 'plus_yearly' | 'all',
    description: '',
  });

  useEffect(() => {
    loadPromoCodes();
  }, []);

  async function loadPromoCodes() {
    try {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        // Table might not exist yet - that's okay
        if (error.code === '42P01') {
          setCodes([]);
          return;
        }
        throw error;
      }

      setCodes(data || []);
    } catch (error) {
      console.error('Failed to load promo codes:', error);
    } finally {
      setLoading(false);
    }
  }

  function generateCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '2GO';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewCode(prev => ({ ...prev, code }));
  }

  async function createPromoCode() {
    if (!newCode.code) {
      toast.error('Bitte gib einen Code ein');
      return;
    }

    setCreating(true);
    try {
      const validUntil = newCode.valid_days 
        ? addDays(new Date(), parseInt(newCode.valid_days)).toISOString()
        : null;

      const { error } = await supabase
        .from('promo_codes')
        .insert({
          code: newCode.code.toUpperCase(),
          discount_type: newCode.discount_type,
          discount_value: newCode.discount_value,
          max_uses: newCode.max_uses ? parseInt(newCode.max_uses) : null,
          valid_from: new Date().toISOString(),
          valid_until: validUntil,
          applies_to: newCode.applies_to,
          description: newCode.description || null,
          is_active: true,
          current_uses: 0,
        });

      if (error) throw error;

      toast.success('Promo-Code erstellt!');
      setShowCreateDialog(false);
      setNewCode({
        code: '',
        discount_type: 'percent',
        discount_value: 10,
        max_uses: '',
        valid_days: '30',
        applies_to: 'all',
        description: '',
      });
      loadPromoCodes();
    } catch (error: any) {
      console.error('Failed to create promo code:', error);
      if (error.code === '23505') {
        toast.error('Dieser Code existiert bereits');
      } else {
        toast.error('Fehler beim Erstellen');
      }
    } finally {
      setCreating(false);
    }
  }

  async function toggleCodeStatus(id: string, isActive: boolean) {
    try {
      const { error } = await supabase
        .from('promo_codes')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) throw error;

      setCodes(prev => prev.map(c => c.id === id ? { ...c, is_active: isActive } : c));
      toast.success(isActive ? 'Code aktiviert' : 'Code deaktiviert');
    } catch (error) {
      console.error('Failed to toggle code:', error);
      toast.error('Fehler beim Aktualisieren');
    }
  }

  async function deleteCode(id: string) {
    if (!confirm('Code wirklich löschen?')) return;

    try {
      const { error } = await supabase
        .from('promo_codes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setCodes(prev => prev.filter(c => c.id !== id));
      toast.success('Code gelöscht');
    } catch (error) {
      console.error('Failed to delete code:', error);
      toast.error('Fehler beim Löschen');
    }
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
    toast.success('Code kopiert!');
  }

  const activeCodesCount = codes.filter(c => c.is_active).length;
  const totalUses = codes.reduce((sum, c) => sum + c.current_uses, 0);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Promo-Codes</h1>
          <p className="text-muted-foreground">
            Rabattcodes für 2Go Plus Abonnements verwalten
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Neuer Code
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-green-500/10">
                <Check className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeCodesCount}</p>
                <p className="text-sm text-muted-foreground">Aktive Codes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-accent/10">
                <TrendingUp className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalUses}</p>
                <p className="text-sm text-muted-foreground">Einlösungen</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-500/10">
                <Ticket className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{codes.length}</p>
                <p className="text-sm text-muted-foreground">Gesamt</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/10">
                <Sparkles className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{KNOWN_STRIPE_COUPONS.length}</p>
                <p className="text-sm text-muted-foreground">Stripe Coupons</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stripe Coupons Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            Aktive Stripe Coupons
          </CardTitle>
          <CardDescription>
            Diese Coupons sind direkt in Stripe konfiguriert und im Checkout verfügbar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {KNOWN_STRIPE_COUPONS.map(coupon => (
              <div 
                key={coupon.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10">
                    <Percent className="h-4 w-4 text-amber-500" />
                  </div>
                  <div>
                    <p className="font-medium">{coupon.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {coupon.duration === 'once' ? 'Einmalig' : 'Für immer'}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" className="font-bold">
                  {coupon.percent_off}%
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Custom Promo Codes Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Eigene Promo-Codes</CardTitle>
              <CardDescription>
                Selbst erstellte Rabattcodes für spezielle Aktionen
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={loadPromoCodes} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Aktualisieren
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {codes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Ticket className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Noch keine eigenen Promo-Codes erstellt</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setShowCreateDialog(true)}
              >
                Ersten Code erstellen
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Rabatt</TableHead>
                  <TableHead>Gültig bis</TableHead>
                  <TableHead>Nutzungen</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {codes.map(code => (
                  <TableRow key={code.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="px-2 py-1 bg-muted rounded font-mono font-bold">
                          {code.code}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => copyCode(code.code)}
                        >
                          {copiedCode === code.code ? (
                            <Check className="h-3.5 w-3.5 text-green-500" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                      {code.description && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {code.description}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={code.discount_type === 'percent' ? 'default' : 'secondary'}>
                        {code.discount_type === 'percent' 
                          ? `${code.discount_value}%`
                          : `CHF ${code.discount_value}`
                        }
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {code.valid_until ? (
                        <span className={
                          new Date(code.valid_until) < new Date() 
                            ? 'text-red-500' 
                            : ''
                        }>
                          {format(new Date(code.valid_until), 'dd.MM.yyyy', { locale: de })}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Unbegrenzt</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {code.max_uses ? (
                        <span className={
                          code.current_uses >= code.max_uses 
                            ? 'text-red-500' 
                            : ''
                        }>
                          {code.current_uses} / {code.max_uses}
                        </span>
                      ) : (
                        <span>{code.current_uses}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={code.is_active}
                        onCheckedChange={(checked) => toggleCodeStatus(code.id, checked)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => deleteCode(code.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Neuen Promo-Code erstellen</DialogTitle>
            <DialogDescription>
              Erstelle einen Rabattcode für 2Go Plus Abonnements
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Code */}
            <div className="space-y-2">
              <Label>Code</Label>
              <div className="flex gap-2">
                <Input
                  value={newCode.code}
                  onChange={(e) => setNewCode(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  placeholder="z.B. SOMMER24"
                  className="font-mono"
                />
                <Button variant="outline" onClick={generateCode}>
                  Generieren
                </Button>
              </div>
            </div>

            {/* Discount Type & Value */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Rabatt-Art</Label>
                <Select
                  value={newCode.discount_type}
                  onValueChange={(v: 'percent' | 'amount') => setNewCode(prev => ({ ...prev, discount_type: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">Prozent (%)</SelectItem>
                    <SelectItem value="amount">Betrag (CHF)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Wert</Label>
                <Input
                  type="number"
                  min={1}
                  max={newCode.discount_type === 'percent' ? 100 : 1000}
                  value={newCode.discount_value}
                  onChange={(e) => setNewCode(prev => ({ ...prev, discount_value: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>

            {/* Validity */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Gültigkeitsdauer (Tage)</Label>
                <Input
                  type="number"
                  min={1}
                  placeholder="Leer = unbegrenzt"
                  value={newCode.valid_days}
                  onChange={(e) => setNewCode(prev => ({ ...prev, valid_days: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Max. Nutzungen</Label>
                <Input
                  type="number"
                  min={1}
                  placeholder="Leer = unbegrenzt"
                  value={newCode.max_uses}
                  onChange={(e) => setNewCode(prev => ({ ...prev, max_uses: e.target.value }))}
                />
              </div>
            </div>

            {/* Applies to */}
            <div className="space-y-2">
              <Label>Gilt für</Label>
              <Select
                value={newCode.applies_to}
                onValueChange={(v: 'plus_monthly' | 'plus_yearly' | 'all') => setNewCode(prev => ({ ...prev, applies_to: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle 2Go Plus Abos</SelectItem>
                  <SelectItem value="plus_monthly">Nur Monatsabo</SelectItem>
                  <SelectItem value="plus_yearly">Nur Jahresabo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>Beschreibung (optional)</Label>
              <Input
                value={newCode.description}
                onChange={(e) => setNewCode(prev => ({ ...prev, description: e.target.value }))}
                placeholder="z.B. Sommerkampagne 2024"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Abbrechen
            </Button>
            <Button onClick={createPromoCode} disabled={creating}>
              {creating ? (
                <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                'Erstellen'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
