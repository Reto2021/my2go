import { useState, useMemo } from 'react';
import { FAQ_ITEMS } from '@/lib/api';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { HelpCircle, Mail, Shield, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

// Category order for grouping
const CATEGORY_ORDER = ['Grundlagen', 'Rewards', 'Codes', 'Taler', 'Konto'];

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState('');
  
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
  
  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
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
        
        {/* Contact & Privacy */}
        <div className="mt-8 space-y-3">
          <div className="card-base p-4">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 shrink-0">
                <Mail className="h-5 w-5 text-secondary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-sm">Noch Fragen?</h3>
                <p className="text-sm text-muted-foreground">
                  <a href="mailto:support@radio2go.ch" className="text-secondary font-medium hover:underline">
                    support@radio2go.ch
                  </a>
                </p>
              </div>
            </div>
          </div>
          
          <div className="card-base p-4">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted shrink-0">
                <Shield className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-sm">Datenschutz</h3>
                <p className="text-sm text-muted-foreground">
                  <a 
                    href="https://radio2go.ch/datenschutz" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-secondary font-medium hover:underline"
                  >
                    Datenschutzerklärung lesen
                  </a>
                </p>
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
            © {new Date().getFullYear()} Radio 2Go
          </p>
        </div>
      </div>
    </div>
  );
}
