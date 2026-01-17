import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  QuizAnswers
} from '@/lib/partner-quiz-calculations';
import { 
  CLICKOUTS, 
  EMAIL_TEMPLATES, 
  formatDate, 
  addDays 
} from '@/lib/partner-quiz-config';
import { 
  ExternalLink, 
  Copy, 
  Mail, 
  FileText,
  Search,
  CheckCircle2,
  Handshake,
  Building2
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface Props {
  answers: QuizAnswers;
  updateAnswers: (updates: Partial<QuizAnswers>) => void;
  breakdown: { lever: string; amount: number; label: string }[];
}

type TemplateType = 'konditionenAnfragen' | 'kuendigung' | 'preisnachlass' | 'sponsoring' | 'standortpatenschaft';

export function ActionLauncher({ answers, updateAnswers, breakdown }: Props) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType | null>(null);
  const [selectedLever, setSelectedLever] = useState<string | null>(null);
  const [providerInput, setProviderInput] = useState<Record<string, string>>({});
  const [contractInput, setContractInput] = useState<Record<string, string>>({});

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const generateEmail = (type: TemplateType, lever: string): { subject: string; body: string } => {
    const template = EMAIL_TEMPLATES[type];
    const now = new Date();
    const futureDate = addDays(now, 7);
    
    const replacements: Record<string, string> = {
      '{firma}': answers.companyName || '[Ihre Firma]',
      '{kontaktperson}': answers.contactPerson || '[Kontaktperson]',
      '{adresse}': answers.companyAddress || '[Adresse]',
      '{telefon}': answers.contactPhone || '[Telefon]',
      '{email}': answers.contactEmail || '[E-Mail]',
      '{datum}': formatDate(futureDate),
      '{jahr}': String(now.getFullYear()),
      '{produkt}': providerInput[lever] || '[Produkt/Leistung]',
      '{vertragsnr}': contractInput[lever] || answers.contractNumbers[lever] || '[Vertragsnr]',
      '{objekt}': answers.companyAddress || '[Objekt]',
      '{typ}': lever === 'rent' ? 'Miete/Nebenkosten' : 'Servicevertrag',
      '{paketpreis}': '250',
      '{sponsorflaechen}': answers.sponsorSlots.join(', ') || '[Flächen]',
      '{budget}': answers.contactsPerMonth === '10000+' ? '500' : '250',
      '{eckdaten}': `- ${answers.locations || '1'} Standort(e)\n- Ca. ${answers.transactionsPerMonth || '?'} Transaktionen/Monat`
    };

    let subject: string = template.subject;
    let body: string = template.body;

    Object.entries(replacements).forEach(([key, value]) => {
      subject = subject.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value);
      body = body.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value);
    });

    return { subject, body };
  };

  const relevantClickouts = CLICKOUTS.filter(c => 
    breakdown.some(b => b.lever === c.lever)
  );

  const allClickouts = breakdown.length === 0 ? CLICKOUTS : relevantClickouts;

  return (
    <div className="space-y-4">
      {/* Lever Cards */}
      {breakdown.map(item => (
        <Card key={item.lever} className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h5 className="font-medium">{item.label}</h5>
              <p className="text-sm text-green-600 font-medium">
                Potenzial: +CHF {Math.round(item.amount)}/Mt.
              </p>
            </div>
          </div>

          {/* Provider Input */}
          <div className="mb-3">
            <Label className="text-xs text-muted-foreground">Aktueller Anbieter</Label>
            <Input
              placeholder="Anbieter eingeben oder aus Rechnung"
              value={providerInput[item.lever] || ''}
              onChange={(e) => setProviderInput(prev => ({ ...prev, [item.lever]: e.target.value }))}
            />
          </div>

          {/* Contract Number */}
          <div className="mb-3">
            <Label className="text-xs text-muted-foreground">Kundennr./Vertragsnr. (optional)</Label>
            <Input
              placeholder="Aus Rechnung übernehmen"
              value={contractInput[item.lever] || ''}
              onChange={(e) => {
                setContractInput(prev => ({ ...prev, [item.lever]: e.target.value }));
                updateAnswers({ 
                  contractNumbers: { ...answers.contractNumbers, [item.lever]: e.target.value } 
                });
              }}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => { setSelectedTemplate('konditionenAnfragen'); setSelectedLever(item.lever); }}
                >
                  <Mail className="w-4 h-4 mr-1" />
                  Konditionen anfragen
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>E-Mail: Konditionen anfragen</DialogTitle>
                </DialogHeader>
                <EmailPreview 
                  email={generateEmail('konditionenAnfragen', item.lever)}
                  onCopy={(text) => copyToClipboard(text, `email-${item.lever}`)}
                  copied={copiedId === `email-${item.lever}`}
                />
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => { setSelectedTemplate('kuendigung'); setSelectedLever(item.lever); }}
                >
                  <FileText className="w-4 h-4 mr-1" />
                  Kündigung
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Kündigungsschreiben</DialogTitle>
                </DialogHeader>
                <EmailPreview 
                  email={generateEmail('kuendigung', item.lever)}
                  onCopy={(text) => copyToClipboard(text, `cancel-${item.lever}`)}
                  copied={copiedId === `cancel-${item.lever}`}
                />
              </DialogContent>
            </Dialog>

            {item.lever === 'rent' && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => { setSelectedTemplate('preisnachlass'); setSelectedLever(item.lever); }}
                  >
                    <Building2 className="w-4 h-4 mr-1" />
                    Verhandeln
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Preisnachlass verhandeln</DialogTitle>
                  </DialogHeader>
                  <EmailPreview 
                    email={generateEmail('preisnachlass', item.lever)}
                    onCopy={(text) => copyToClipboard(text, `negotiate-${item.lever}`)}
                    copied={copiedId === `negotiate-${item.lever}`}
                  />
                </DialogContent>
              </Dialog>
            )}
          </div>
        </Card>
      ))}

      {/* Sponsoring Actions */}
      {answers.openToSponsoring && answers.openToSponsoring !== 'no' && (
        <Card className="p-4 border-2 border-green-200 bg-green-50/50">
          <div className="flex items-center gap-2 mb-3">
            <Handshake className="w-5 h-5 text-green-600" />
            <h5 className="font-medium text-green-900">Sponsoring-Aktionen</h5>
          </div>
          <div className="flex flex-wrap gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="border-green-300 hover:bg-green-100">
                  <Mail className="w-4 h-4 mr-1" />
                  Sponsoring anbieten
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Sponsoring-Anfrage</DialogTitle>
                </DialogHeader>
                <EmailPreview 
                  email={generateEmail('sponsoring', 'sponsor')}
                  onCopy={(text) => copyToClipboard(text, 'sponsor-email')}
                  copied={copiedId === 'sponsor-email'}
                />
              </DialogContent>
            </Dialog>

            {answers.sponsorCategories.includes('Immobilien / Vermieter / Verwaltung / Center-Management') && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="border-green-300 hover:bg-green-100">
                    <Building2 className="w-4 h-4 mr-1" />
                    Standort-Patenschaft
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Standort-Patenschaft anbieten</DialogTitle>
                  </DialogHeader>
                  <EmailPreview 
                    email={generateEmail('standortpatenschaft', 'patenschaft')}
                    onCopy={(text) => copyToClipboard(text, 'patenschaft-email')}
                    copied={copiedId === 'patenschaft-email'}
                  />
                </DialogContent>
              </Dialog>
            )}
          </div>
        </Card>
      )}

      {/* Clickouts */}
      {allClickouts.length > 0 && (
        <Card className="p-4">
          <h5 className="font-medium mb-3">Vergleichsportale & Rechner</h5>
          <div className="flex flex-wrap gap-2">
            {allClickouts.map(clickout => (
              <Button
                key={clickout.url}
                variant="outline"
                size="sm"
                asChild
              >
                <a href={clickout.url} target="_blank" rel="noopener noreferrer">
                  {clickout.label}
                  <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              </Button>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function EmailPreview({ 
  email, 
  onCopy, 
  copied 
}: { 
  email: { subject: string; body: string }; 
  onCopy: (text: string) => void;
  copied: boolean;
}) {
  const fullText = `Betreff: ${email.subject}\n\n${email.body}`;
  
  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm text-muted-foreground">Betreff</Label>
        <div className="p-3 bg-muted rounded-lg text-sm font-medium break-words">
          {email.subject}
        </div>
      </div>
      <div>
        <Label className="text-sm text-muted-foreground">Text</Label>
        <Textarea
          value={email.body}
          readOnly
          className="min-h-[250px] max-h-[350px] text-sm resize-none"
        />
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <Button onClick={() => onCopy(fullText)} className="flex-1">
          {copied ? (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Kopiert!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 mr-2" />
              Alles kopieren
            </>
          )}
        </Button>
        <Button 
          variant="outline"
          className="flex-1"
          onClick={() => {
            window.location.href = `mailto:?subject=${encodeURIComponent(email.subject)}&body=${encodeURIComponent(email.body)}`;
          }}
        >
          <Mail className="w-4 h-4 mr-2" />
          In Mail-App öffnen
        </Button>
      </div>
    </div>
  );
}
