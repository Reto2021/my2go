import { useEffect, useState } from 'react';
import { getAllCustomers, getCustomerTransactions, CustomerWithBalance } from '@/lib/admin-helpers';
import { Transaction } from '@/lib/supabase-helpers';
import { 
  Users, 
  Search, 
  Coins, 
  TrendingUp, 
  TrendingDown,
  Calendar,
  Mail,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<CustomerWithBalance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  
  const loadCustomers = async () => {
    setIsLoading(true);
    try {
      const data = await getAllCustomers();
      setCustomers(data);
    } catch (error) {
      console.error('Failed to load customers:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    loadCustomers();
  }, []);
  
  const handleExpandCustomer = async (customerId: string) => {
    if (expandedCustomer === customerId) {
      setExpandedCustomer(null);
      setTransactions([]);
      return;
    }
    
    setExpandedCustomer(customerId);
    setIsLoadingTransactions(true);
    try {
      const data = await getCustomerTransactions(customerId);
      setTransactions(data);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setIsLoadingTransactions(false);
    }
  };
  
  const filteredCustomers = customers.filter(c => 
    c.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.last_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd.MM.yyyy HH:mm', { locale: de });
  };
  
  const getSourceLabel = (source: string) => {
    const labels: Record<string, string> = {
      signup_bonus: 'Willkommens-Bonus',
      air_drop: 'Air Drop',
      partner_visit: 'Partner-Besuch',
      partner_purchase: 'Einkauf',
      bonus: 'Bonus',
      reward_redemption: 'Einlösung',
      system: 'System',
      referral: 'Empfehlung',
    };
    return labels[source] || source;
  };
  
  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Kunden-Übersicht</h1>
          <p className="text-muted-foreground">{customers.length} Benutzer insgesamt</p>
        </div>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card-base p-4 text-center">
          <p className="text-2xl font-bold tabular-nums">
            {customers.reduce((sum, c) => sum + c.balance.taler_balance, 0).toLocaleString('de-CH')}
          </p>
          <p className="text-sm text-muted-foreground">Taler gesamt</p>
        </div>
        <div className="card-base p-4 text-center">
          <p className="text-2xl font-bold tabular-nums">
            {customers.reduce((sum, c) => sum + c.balance.lifetime_earned, 0).toLocaleString('de-CH')}
          </p>
          <p className="text-sm text-muted-foreground">Verdient gesamt</p>
        </div>
        <div className="card-base p-4 text-center">
          <p className="text-2xl font-bold tabular-nums">
            {customers.reduce((sum, c) => sum + c.balance.lifetime_spent, 0).toLocaleString('de-CH')}
          </p>
          <p className="text-sm text-muted-foreground">Ausgegeben gesamt</p>
        </div>
      </div>
      
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Kunden suchen..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-12 pl-12 pr-4 rounded-2xl bg-muted border-2 border-transparent focus:outline-none focus:border-primary/30 focus:bg-background transition-all"
        />
      </div>
      
      {/* Customers List */}
      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-muted animate-pulse" />
          ))
        ) : filteredCustomers.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Keine Kunden gefunden</p>
          </div>
        ) : (
          filteredCustomers.map(customer => (
            <div key={customer.id} className="card-base overflow-hidden">
              <button
                onClick={() => handleExpandCustomer(customer.id)}
                className="w-full p-4 flex items-center gap-4 text-left hover:bg-muted/50 transition-colors"
              >
                {/* Avatar */}
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 flex-shrink-0">
                  {customer.avatar_url ? (
                    <img src={customer.avatar_url} alt="" className="h-full w-full object-cover rounded-full" />
                  ) : (
                    <span className="text-lg font-bold text-secondary">
                      {(customer.display_name || customer.email || '?')[0].toUpperCase()}
                    </span>
                  )}
                </div>
                
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold truncate">
                    {customer.display_name || customer.first_name || 'Unbenannt'}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-3 w-3" />
                    <span className="truncate">{customer.email || 'Keine E-Mail'}</span>
                  </div>
                </div>
                
                {/* Balance */}
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-accent flex items-center gap-1 justify-end">
                    <Coins className="h-4 w-4" />
                    {customer.balance.taler_balance.toLocaleString('de-CH')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {customer.transactionCount} Transaktionen
                  </p>
                </div>
                
                {/* Expand Icon */}
                {expandedCustomer === customer.id ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </button>
              
              {/* Expanded Content */}
              {expandedCustomer === customer.id && (
                <div className="border-t border-border p-4 bg-muted/30 animate-in">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span className="text-sm">
                        Verdient: <strong>{customer.balance.lifetime_earned.toLocaleString('de-CH')}</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-orange-500" />
                      <span className="text-sm">
                        Ausgegeben: <strong>{customer.balance.lifetime_spent.toLocaleString('de-CH')}</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        Registriert: {formatDate(customer.created_at)}
                      </span>
                    </div>
                    {customer.last_activity_at && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          Letzte Aktivität: {formatDate(customer.last_activity_at)}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* Transactions */}
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Letzte Transaktionen</h4>
                    {isLoadingTransactions ? (
                      <div className="h-20 flex items-center justify-center">
                        <div className="animate-spin h-5 w-5 border-2 border-accent border-t-transparent rounded-full" />
                      </div>
                    ) : transactions.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Keine Transaktionen</p>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {transactions.slice(0, 10).map(tx => (
                          <div
                            key={tx.id}
                            className="flex items-center justify-between py-2 px-3 rounded-lg bg-background"
                          >
                            <div>
                              <p className="text-sm font-medium">
                                {tx.description || getSourceLabel(tx.source)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatDate(tx.created_at)}
                              </p>
                            </div>
                            <span className={cn(
                              'font-bold tabular-nums',
                              tx.type === 'earn' || tx.type === 'adjust' ? 'text-green-500' : 'text-orange-500'
                            )}>
                              {tx.type === 'earn' || tx.type === 'adjust' ? '+' : '-'}
                              {tx.amount.toLocaleString('de-CH')}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
