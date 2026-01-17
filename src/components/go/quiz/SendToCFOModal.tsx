import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { 
  QuizAnswers, 
  FitResult, 
  RefinancingResult 
} from '@/lib/partner-quiz-calculations';
import { 
  TEXTS, 
  MODULES,
  formatCHF,
  ModuleKey 
} from '@/lib/partner-quiz-config';
import { getMissingInfo, MissingItem } from './MissingInfoChecklist';
import { Copy, Mail, CheckCircle2 } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  answers: QuizAnswers;
  fitResult: FitResult;
  refinancing: RefinancingResult;
  planName: string;
  planPrice: number;
  includesGHL: boolean;
}

function generateCFOEmail(
  answers: QuizAnswers,
  fitResult: FitResult,
  refinancing: RefinancingResult,
  planName: string,
  planPrice: number,
  includesGHL: boolean,
  missingItems: MissingItem[]
): { subject: string; body: string } {
  const fitLabel = TEXTS.fitLabels[fitResult.score];
  const isCovered = refinancing.gap <= 0;
  const isLargeOrg = answers.employees === '11-30' || answers.employees === '31+' || answers.locations === '2-3' || answers.locations === '4+';

  const moduleA = MODULES.loyalty.title;
  const moduleB = fitResult.modules[1] ? MODULES[fitResult.modules[1] as ModuleKey]?.title : 'Deals/Gutscheine';

  const subject = `My2Go Kurzcheck – Empfehlung & fehlende Zahlen (${answers.companyName || 'Firma'})`;

  let body = `Guten Tag

Ich habe den My2Go "Passt das zu Ihnen?"-Kurzcheck ausgefüllt. Ergebnis in 60 Sekunden:

1) Fit (A/B/C): ${fitLabel.title} – ${fitResult.score === 'A' ? 'Ideale Voraussetzungen für Loyalty-Programm' : fitResult.score === 'B' ? 'Gute Basis mit Optimierungspotenzial' : 'Einige Anpassungen empfohlen'}

2) Empfehlung: ${planName} (CHF ${planPrice}/Monat)${includesGHL ? ' – inkl. GHL/Automationen' : ''}

3) Start-Module: 
   - ${moduleA}
   - ${moduleB}
`;

  if (isLargeOrg) {
    body += `
Hinweis: Für unsere Grösse ist Uplift in %/Rollout relevant; Automationen sind ab Plus enthalten.
`;
  }

  body += `
Risikolos-Refinanzierung (konservativ, ohne Umsatzversprechen):
- Fixkosten-/Zeithebel bisher: ${formatCHF(refinancing.totalSavings)}/Monat
- ${isCovered ? '✓ Vollständig gedeckt!' : `Restlücke: ${formatCHF(refinancing.gap)}/Monat (kann ggf. über Mini-Preishebel oder Sponsoring gedeckt werden)`}
`;

  if (missingItems.length > 0) {
    body += `
Für eine saubere Entscheidung fehlen nur noch:
${missingItems.map(item => `- ${item.label}`).join('\n')}
`;
  }

  body += `
Link/Notiz:
- Clickouts/Anbieter-Kontakt + Textvorlagen sind im Quiz-Ergebnis enthalten (Konditionen anfragen / Kündigung / Preisnachlass / Sponsoring).

Könnten Sie bitte diese fehlenden Angaben ergänzen bzw. kurz Feedback geben, ob wir starten?

Besten Dank und freundliche Grüsse

${answers.contactPerson || '[Name]'}
${answers.userRole === 'operations' ? 'Filialleitung / Operations' : answers.userRole === 'marketing' ? 'Marketing/Vertrieb' : 'Team'}
${answers.companyName || '[Firma]'}${answers.companyCity ? `, ${answers.companyCity}` : ''}
${answers.contactPhone || ''}
${answers.contactEmail || ''}
`;

  return { subject, body };
}

export function SendToCFOModal({ 
  open, 
  onOpenChange, 
  answers, 
  fitResult, 
  refinancing,
  planName,
  planPrice,
  includesGHL
}: Props) {
  const [recipientEmail, setRecipientEmail] = useState('');
  const [ccMe, setCcMe] = useState(true);
  const [copied, setCopied] = useState(false);

  const missingItems = getMissingInfo(answers);
  const { subject, body } = generateCFOEmail(
    answers, 
    fitResult, 
    refinancing, 
    planName, 
    planPrice, 
    includesGHL,
    missingItems
  );

  const handleCopy = () => {
    const fullText = `Betreff: ${subject}\n\n${body}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenMail = () => {
    const mailtoLink = `mailto:${recipientEmail}${ccMe && answers.contactEmail ? `?cc=${answers.contactEmail}` : ''}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-primary" />
            Ergebnis an Finanzen senden
          </DialogTitle>
          <DialogDescription>
            Senden Sie Ihr Quiz-Ergebnis an CFO/Finanzen zur Freigabe
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {/* Recipient */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">
                Empfänger E-Mail
              </Label>
              <Input
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="cfo@firma.ch"
              />
            </div>
            <div className="flex items-end">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="cc-me"
                  checked={ccMe}
                  onCheckedChange={(c) => setCcMe(c === true)}
                />
                <label htmlFor="cc-me" className="text-sm cursor-pointer">
                  CC an mich ({answers.contactEmail || 'keine E-Mail'})
                </label>
              </div>
            </div>
          </div>

          {/* Email Preview */}
          <div>
            <Label className="text-sm font-medium mb-2 block">
              Vorschau E-Mail
            </Label>
            <div className="bg-muted/50 rounded-lg p-4 border">
              <p className="text-sm font-semibold text-muted-foreground mb-2">
                Betreff: {subject}
              </p>
              <Textarea
                value={body}
                readOnly
                className="min-h-[300px] text-sm font-mono bg-background"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              size="lg"
              className="flex-1"
              onClick={handleOpenMail}
              disabled={!recipientEmail}
            >
              <Mail className="w-4 h-4 mr-2" />
              E-Mail öffnen
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={handleCopy}
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" />
                  Kopiert!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Text kopieren
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
