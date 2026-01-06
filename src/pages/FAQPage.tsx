import { FAQ_ITEMS } from '@/lib/api';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { HelpCircle, Mail, Shield } from 'lucide-react';

export default function FAQPage() {
  return (
    <div className="animate-fade-in">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="container py-4">
          <h1 className="text-xl font-bold">Häufige Fragen</h1>
        </div>
      </header>
      
      <div className="container py-6">
        {/* Hero */}
        <div className="text-center mb-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-secondary mx-auto mb-4">
            <HelpCircle className="h-8 w-8 text-primary" />
          </div>
          <p className="text-muted-foreground">
            Alles Wichtige rund um deine 2Go Taler
          </p>
        </div>
        
        {/* FAQ Accordion */}
        <Accordion type="single" collapsible className="space-y-3">
          {FAQ_ITEMS.map((item, index) => (
            <AccordionItem 
              key={index} 
              value={`item-${index}`}
              className="card-elevated border-0"
            >
              <AccordionTrigger className="hover:no-underline text-left py-4 px-4">
                <span className="font-medium pr-4">{item.question}</span>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 text-muted-foreground">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        
        {/* Contact & Privacy */}
        <div className="mt-8 space-y-4">
          <div className="card-elevated">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary shrink-0">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Noch Fragen?</h3>
                <p className="text-sm text-muted-foreground">
                  Schreib uns an{' '}
                  <a href="mailto:support@radio2go.ch" className="text-accent underline">
                    support@radio2go.ch
                  </a>
                </p>
              </div>
            </div>
          </div>
          
          <div className="card-elevated">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary shrink-0">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Datenschutz</h3>
                <p className="text-sm text-muted-foreground">
                  Alle Infos findest du in unserer{' '}
                  <a 
                    href="https://radio2go.ch/datenschutz" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-accent underline"
                  >
                    Datenschutzerklärung
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Legal Notice */}
        <div className="mt-8 text-center text-xs text-muted-foreground">
          <p>2Go Taler sind Bonuspunkte und nicht gegen Bargeld eintauschbar.</p>
          <p className="mt-1">© {new Date().getFullYear()} Radio 2Go</p>
        </div>
      </div>
    </div>
  );
}
