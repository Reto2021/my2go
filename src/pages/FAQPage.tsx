import { useState, useMemo } from 'react';
import { FAQ_ITEMS, createSupportTicket } from '@/lib/api';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { 
  HelpCircle, 
  Mail, 
  Shield, 
  Search, 
  X, 
  Send, 
  CheckCircle2,
  MessageSquare,
  ChevronDown,
  Phone,
  MessageCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Category order for grouping
const CATEGORY_ORDER = ['Grundlagen', 'Gutscheine', 'Codes', 'Taler', 'Streaming', 'Konto'];

// Support topics
const SUPPORT_TOPICS = [
  { value: 'code', label: 'Code funktioniert nicht' },
  { value: 'reward', label: 'Problem beim Einlösen' },
  { value: 'balance', label: 'Punkte stimmen nicht' },
  { value: 'partner', label: 'Partner-Problem' },
  { value: 'account', label: 'Konto & Zugang' },
  { value: 'other', label: 'Sonstiges' },
];

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSupportForm, setShowSupportForm] = useState(false);
  
  // Support form state
  const [topic, setTopic] = useState('');
  const [message, setMessage] = useState('');
  const [contact, setContact] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ticketId, setTicketId] = useState<string | null>(null);
  
  // Filter FAQ by search
  const filteredFAQ = useMemo(() => {
    if (!searchQuery.trim()) return FAQ_ITEMS;
    
    const query = searchQuery.toLowerCase();
    return FAQ_ITEMS.filter(item => 
      item.question.toLowerCase().includes(query) ||
      item.answer.toLowerCase().includes(query)
    );
  }, [searchQuery]);
  
  // Group by category
  const groupedFAQ = useMemo(() => {
    if (searchQuery.trim()) return null; // Flat list when searching
    
    const groups: Record<string, typeof FAQ_ITEMS> = {};
    filteredFAQ.forEach(item => {
      const cat = (item as any).category || 'Andere';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    
    // Sort by category order
    return CATEGORY_ORDER
      .filter(cat => groups[cat]?.length > 0)
      .map(cat => ({ category: cat, items: groups[cat] }));
  }, [filteredFAQ, searchQuery]);
  
  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic || !message.trim()) return;
    
    setIsSubmitting(true);
    try {
      const result = await createSupportTicket({
        topic,
        message: message.trim(),
        emailOrPhone: contact.trim() || undefined,
      });
      setTicketId(result.ticketId);
    } catch (error) {
      console.error('Failed to create ticket:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const resetForm = () => {
    setTopic('');
    setMessage('');
    setContact('');
    setTicketId(null);
    setShowSupportForm(false);
  };
  
  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="sticky top-20 z-40 bg-background/95 backdrop-blur-lg">
        <div className="container py-4 space-y-3">
          <h1 className="text-display-sm">Häufige Fragen</h1>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Frage suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                'w-full h-12 pl-12 pr-4 rounded-2xl',
                'bg-muted border-2 border-transparent',
                'placeholder:text-muted-foreground/60',
                'focus:outline-none focus:border-primary/30 focus:bg-background',
                'transition-all duration-200'
              )}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-background"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>
      </header>
      
      <div className="container py-6">
        {/* Quick Info Banner */}
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-accent/10 border border-accent/20 mb-6 animate-in">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/20 flex-shrink-0">
            <HelpCircle className="h-5 w-5 text-accent" />
          </div>
          <p className="text-sm text-foreground">
            <span className="font-semibold">Wichtig:</span> 2Go Taler sind Bonuspunkte, nicht auszahlbar, nur vor Ort einlösbar.
          </p>
        </div>
        
        {/* No results */}
        {filteredFAQ.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-2">Keine Ergebnisse gefunden.</p>
            <button 
              onClick={() => setSearchQuery('')}
              className="text-sm text-primary font-medium"
            >
              Suche zurücksetzen
            </button>
          </div>
        )}
        
        {/* Grouped FAQ (default) */}
        {groupedFAQ && groupedFAQ.map(group => (
          <div key={group.category} className="mb-8 animate-in">
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-3">
              {group.category}
            </h2>
            <Accordion type="single" collapsible className="space-y-2">
              {group.items.map((item, index) => (
                <AccordionItem 
                  key={index} 
                  value={`${group.category}-${index}`}
                  className="card-base border-border overflow-hidden"
                >
                  <AccordionTrigger className="hover:no-underline text-left py-4 px-4 hover:bg-muted/50 transition-colors">
                    <span className="font-semibold pr-4 text-sm">{item.question}</span>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 text-sm text-muted-foreground">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        ))}
        
        {/* Flat list (search mode) */}
        {searchQuery.trim() && filteredFAQ.length > 0 && (
          <Accordion type="single" collapsible className="space-y-2 stagger-children">
            {filteredFAQ.map((item, index) => (
              <AccordionItem 
                key={index} 
                value={`search-${index}`}
                className="card-base border-border overflow-hidden"
              >
                <AccordionTrigger className="hover:no-underline text-left py-4 px-4 hover:bg-muted/50 transition-colors">
                  <span className="font-semibold pr-4 text-sm">{item.question}</span>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 text-sm text-muted-foreground">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
        
        {/* Support Section */}
        <div className="mt-8 space-y-4">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wide">
            Support
          </h2>
          
          {/* Support Form Toggle */}
          {!showSupportForm && !ticketId && (
            <button 
              onClick={() => setShowSupportForm(true)}
              className="card-interactive w-full p-4"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/15 shrink-0">
                  <MessageSquare className="h-6 w-6 text-accent" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-semibold">Problem melden</h3>
                  <p className="text-sm text-muted-foreground">
                    Schreib uns dein Anliegen
                  </p>
                </div>
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              </div>
            </button>
          )}
          
          {/* Support Form */}
          {showSupportForm && !ticketId && (
            <form onSubmit={handleSubmitTicket} className="card-base p-5 space-y-4 animate-in">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">Problem melden</h3>
                <button 
                  type="button"
                  onClick={() => setShowSupportForm(false)}
                  className="p-1 rounded-full hover:bg-muted"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
              
              {/* Topic Select */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Thema *</label>
                <div className="relative">
                  <select
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    required
                    className={cn(
                      'w-full h-12 px-4 rounded-xl appearance-none',
                      'bg-muted border-2 border-transparent',
                      'focus:outline-none focus:border-primary/30 focus:bg-background',
                      'transition-all duration-200',
                      !topic && 'text-muted-foreground'
                    )}
                  >
                    <option value="">Thema wählen...</option>
                    {SUPPORT_TOPICS.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>
              
              {/* Message */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Nachricht *</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  rows={4}
                  placeholder="Beschreibe dein Problem..."
                  className={cn(
                    'w-full px-4 py-3 rounded-xl resize-none',
                    'bg-muted border-2 border-transparent',
                    'placeholder:text-muted-foreground/60',
                    'focus:outline-none focus:border-primary/30 focus:bg-background',
                    'transition-all duration-200'
                  )}
                />
              </div>
              
              {/* Contact (optional) */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  E-Mail oder Telefon <span className="text-muted-foreground font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="Für Rückfragen"
                  className={cn(
                    'w-full h-12 px-4 rounded-xl',
                    'bg-muted border-2 border-transparent',
                    'placeholder:text-muted-foreground/60',
                    'focus:outline-none focus:border-primary/30 focus:bg-background',
                    'transition-all duration-200'
                  )}
                />
              </div>
              
              {/* Submit */}
              <button 
                type="submit" 
                className="btn-primary w-full"
                disabled={isSubmitting || !topic || !message.trim()}
              >
                {isSubmitting ? (
                  'Wird gesendet...'
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Absenden
                  </>
                )}
              </button>
            </form>
          )}
          
          {/* Ticket Success */}
          {ticketId && (
            <div className="card-base p-6 text-center animate-in">
              <div className="flex h-16 w-16 items-center justify-center rounded-full mx-auto mb-4 bg-success/10">
                <CheckCircle2 className="h-8 w-8 text-success" />
              </div>
              <h3 className="text-lg font-bold mb-2">Ticket erstellt!</h3>
              <p className="text-muted-foreground mb-4">
                Wir melden uns so schnell wie möglich.
              </p>
              <p className="text-sm font-mono bg-muted rounded-lg py-2 px-4 inline-block mb-4">
                Ticket: {ticketId}
              </p>
              <button onClick={resetForm} className="btn-secondary w-full">
                Schliessen
              </button>
            </div>
          )}
          
          {/* Studio Phone & WhatsApp */}
          <div className="card-base p-4">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/15 shrink-0">
                <Phone className="h-5 w-5 text-success" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-sm">Studio & WhatsApp</h3>
                <p className="text-sm text-muted-foreground">
                  <a href="tel:+41765864070" className="text-secondary font-medium hover:underline">
                    076 586 40 70
                  </a>
                </p>
              </div>
              <a 
                href="https://wa.me/41765864070" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 transition-colors"
              >
                <MessageCircle className="h-5 w-5 text-[#25D366]" />
              </a>
            </div>
          </div>
          
          {/* Contact Email */}
          <div className="card-base p-4">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 shrink-0">
                <Mail className="h-5 w-5 text-secondary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-sm">Direkt schreiben</h3>
                <p className="text-sm text-muted-foreground">
                  <a href="mailto:support@radio2go.ch" className="text-secondary font-medium hover:underline">
                    support@radio2go.ch
                  </a>
                </p>
              </div>
            </div>
          </div>
          
          {/* Privacy */}
          <div className="card-base p-4">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted shrink-0">
                <Shield className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-sm">Rechtliches</h3>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm">
                  <a href="/agb" className="text-secondary font-medium hover:underline">AGB</a>
                  <a href="/datenschutz" className="text-secondary font-medium hover:underline">Datenschutz</a>
                  <a href="/impressum" className="text-secondary font-medium hover:underline">Impressum</a>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Legal Footer */}
        <div className="mt-8 p-4 rounded-xl bg-muted/50 text-center">
          <p className="text-xs text-muted-foreground font-medium">
            2Go Taler sind Bonuspunkte und nicht gegen Bargeld eintauschbar.
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            © {new Date().getFullYear()} <a href="/impressum" className="hover:underline">2Go Media AG</a>
          </p>
        </div>
      </div>
    </div>
  );
}
