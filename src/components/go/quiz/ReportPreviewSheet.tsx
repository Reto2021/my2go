import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  QuizAnswers, 
  FitResult, 
  RefinancingResult, 
  UpliftResult 
} from '@/lib/partner-quiz-calculations';
import { 
  TEXTS, 
  MODULES, 
  formatCHF, 
  formatPercent,
  formatDate,
  ModuleKey
} from '@/lib/partner-quiz-config';
import { 
  FileDown, 
  Mail, 
  X,
  CheckCircle2,
  TrendingUp,
  PiggyBank,
  Clock,
  Handshake,
  Sparkles,
  Loader2,
  CheckCheck
} from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  answers: QuizAnswers;
  fitResult: FitResult;
  refinancing: RefinancingResult;
  uplift: UpliftResult;
  planName: string;
  planPrice: number;
  onDownloadPDF: () => void;
  onSendEmail: () => void;
  isExporting: boolean;
  isSendingEmail: boolean;
  emailSent: boolean;
}

export function ReportPreviewSheet({
  open,
  onOpenChange,
  answers,
  fitResult,
  refinancing,
  uplift,
  planName,
  planPrice,
  onDownloadPDF,
  onSendEmail,
  isExporting,
  isSendingEmail,
  emailSent
}: Props) {
  const fitLabel = TEXTS.fitLabels[fitResult.score];
  const isCovered = refinancing.gap <= 0;
  const coveragePercent = Math.min(100, (refinancing.totalSavings / planPrice) * 100);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] p-0">
        <SheetHeader className="px-6 py-4 border-b bg-gradient-to-r from-primary to-primary/80">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-white text-lg">Report Vorschau</SheetTitle>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => onOpenChange(false)}
              className="text-white hover:bg-white/20"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 h-[calc(90vh-140px)]">
          <div className="p-6 space-y-6 bg-muted/30">
            {/* Letterhead Preview */}
            <div className="bg-gradient-to-r from-primary to-primary/80 rounded-t-xl p-6 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <div className="bg-white text-primary font-bold px-3 py-1 rounded-lg inline-block text-lg">
                    2Go
                  </div>
                  <p className="text-sm mt-2 opacity-90">Das Loyalitäts-Netzwerk</p>
                </div>
                <div className="text-right text-sm opacity-90">
                  <p className="font-semibold">2Go GmbH</p>
                  <p>Bahnhofstrasse 10, 8001 Zürich</p>
                  <p>partner@my2go.app</p>
                </div>
              </div>
            </div>

            {/* Report Content Preview */}
            <div className="bg-white rounded-b-xl shadow-sm border -mt-6 pt-8 p-6 space-y-6">
              {/* Title */}
              <div className="text-center pb-4 border-b">
                <h2 className="text-xl font-bold mb-1">🎯 Partner Fit-Check Report</h2>
                <p className="text-sm text-muted-foreground">{formatDate(new Date())}</p>
              </div>

              {/* Company Info */}
              {answers.companyName && (
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="font-bold text-lg">{answers.companyName}</p>
                  {answers.contactPerson && <p className="text-sm">{answers.contactPerson}</p>}
                  {(answers.companyAddress || answers.companyPostalCode || answers.companyCity) && (
                    <p className="text-sm text-muted-foreground">
                      {answers.companyAddress && `${answers.companyAddress}, `}
                      {answers.companyPostalCode} {answers.companyCity}
                    </p>
                  )}
                  {answers.contactEmail && (
                    <p className="text-sm text-muted-foreground mt-1">
                      📧 {answers.contactEmail}
                      {answers.contactPhone && ` • 📞 ${answers.contactPhone}`}
                    </p>
                  )}
                </div>
              )}

              {/* Plan Recommendation */}
              <div className="bg-gradient-to-r from-primary to-primary/80 rounded-xl p-6 text-white text-center">
                <div className={`inline-block px-4 py-1 rounded-full text-sm font-bold mb-3 ${
                  fitResult.score === 'A' ? 'bg-green-100 text-green-800' :
                  fitResult.score === 'B' ? 'bg-amber-100 text-amber-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {fitLabel.title}
                </div>
                <p className="text-2xl font-bold">{planName}</p>
                <p className="text-3xl font-bold mt-2">{formatCHF(planPrice)}</p>
                <p className="text-sm opacity-80">pro Monat</p>
              </div>

              {/* Coverage Status */}
              <div className={`rounded-xl p-5 text-center ${isCovered ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
                <p className={`text-xl font-bold ${isCovered ? 'text-green-700' : 'text-amber-700'}`}>
                  {isCovered ? '✅ Vollständig refinanziert!' : `⚡ ${formatPercent(coveragePercent / 100)} bereits gedeckt`}
                </p>
                <p className={`text-lg mt-1 ${isCovered ? 'text-green-600' : 'text-amber-600'}`}>
                  Total Einsparungen: <strong>{formatCHF(refinancing.totalSavings)}</strong>
                </p>
                {!isCovered && refinancing.gap > 0 && (
                  <p className="text-sm text-amber-600 mt-2">
                    Nur noch {formatCHF(refinancing.gap)} Mehrumsatz benötigt
                  </p>
                )}
              </div>

              {/* Savings Breakdown */}
              <div className="space-y-3">
                <h3 className="font-bold flex items-center gap-2">
                  <PiggyBank className="w-5 h-5 text-primary" />
                  Einsparungen im Detail
                </h3>
                <div className="space-y-2">
                  {refinancing.fixcostBreakdown.map((item, i) => (
                    <div key={i} className="flex justify-between py-2 border-b border-dashed">
                      <span className="text-muted-foreground">{item.label}</span>
                      <span className="font-medium text-green-600">+{formatCHF(item.amount)}</span>
                    </div>
                  ))}
                  {refinancing.timeSavings > 0 && (
                    <div className="flex justify-between py-2 border-b border-dashed">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        Zeit-Einsparungen ({refinancing.timeHours}h × CHF 90)
                      </span>
                      <span className="font-medium text-green-600">+{formatCHF(refinancing.timeSavings)}</span>
                    </div>
                  )}
                  {refinancing.sponsoringSavings > 0 && (
                    <div className="flex justify-between py-2 border-b border-dashed">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Handshake className="w-4 h-4" />
                        Sponsoring-Potenzial
                      </span>
                      <span className="font-medium text-green-600">+{formatCHF(refinancing.sponsoringSavings)}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-3 bg-green-50 rounded-lg px-3 -mx-3 font-bold">
                    <span>🎉 Total</span>
                    <span className="text-green-600 text-lg">{formatCHF(refinancing.totalSavings)}</span>
                  </div>
                </div>
              </div>

              {/* Recommended Modules */}
              <div className="space-y-3">
                <h3 className="font-bold flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Empfohlene Module
                </h3>
                <div className="space-y-2">
                  {fitResult.modules.map(moduleKey => {
                    const module = MODULES[moduleKey as ModuleKey];
                    if (!module) return null;
                    return (
                      <div key={moduleKey} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg border-l-4 border-primary">
                        <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium">{module.title}</p>
                          <p className="text-sm text-muted-foreground">{module.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Uplift Potential */}
              <div className="space-y-3">
                <h3 className="font-bold flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  Uplift-Potenzial
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {(['conservative', 'realistic', 'ambitious'] as const).map(scenario => (
                    <div 
                      key={scenario}
                      className={`p-3 rounded-lg text-center ${
                        scenario === 'realistic' 
                          ? 'bg-green-500 text-white' 
                          : 'bg-muted'
                      }`}
                    >
                      <p className={`text-xs mb-1 ${scenario === 'realistic' ? 'text-white/80' : 'text-muted-foreground'}`}>
                        {scenario === 'conservative' ? 'Konservativ' : scenario === 'realistic' ? 'Realistisch' : 'Ambitioniert'}
                      </p>
                      <p className={`font-bold ${scenario === 'realistic' ? 'text-lg' : ''}`}>
                        +{formatCHF(uplift.total[scenario])}
                      </p>
                      <p className={`text-xs ${scenario === 'realistic' ? 'text-white/80' : 'text-muted-foreground'}`}>
                        /Monat
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Privacy Note */}
              <p className="text-xs text-center text-muted-foreground border-t pt-4">
                Ihre Angaben werden nur für die Analyse und das Zusenden des Reports verwendet.
              </p>
            </div>
          </div>
        </ScrollArea>

        {/* Action Buttons */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t flex gap-3">
          <Button
            variant="outline"
            size="lg"
            className="flex-1 h-12"
            onClick={onDownloadPDF}
            disabled={isExporting}
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <FileDown className="w-4 h-4 mr-2" />
            )}
            PDF herunterladen
          </Button>
          <Button
            size="lg"
            className={`flex-1 h-12 ${emailSent ? 'bg-green-500 hover:bg-green-600' : ''}`}
            onClick={onSendEmail}
            disabled={isSendingEmail || emailSent || !answers.contactEmail}
          >
            {isSendingEmail ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : emailSent ? (
              <CheckCheck className="w-4 h-4 mr-2" />
            ) : (
              <Mail className="w-4 h-4 mr-2" />
            )}
            {emailSent ? 'Gesendet!' : 'Per E-Mail senden'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
