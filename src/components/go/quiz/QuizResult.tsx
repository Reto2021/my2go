import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  QuizAnswers,
  calculateFitScore,
  calculateRefinancing,
  calculateUplift,
  getPlanByKey
} from '@/lib/partner-quiz-calculations';
import { 
  TEXTS, 
  MODULES, 
  formatCHF, 
  formatPercent,
  ModuleKey
} from '@/lib/partner-quiz-config';
import { 
  CheckCircle2, 
  TrendingUp, 
  ArrowRight,
  Copy,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Zap,
  Sparkles,
  Clock,
  Handshake,
  PiggyBank,
  Building2,
  FileDown,
  Loader2,
  Mail,
  AlertCircle,
  Eye,
  CheckCheck,
  Users,
  Calendar,
  Star,
  Shield,
  Info,
  ExternalLink
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ActionLauncher } from './ActionLauncher';
import { generatePDFReport } from './pdfExport';
import { MissingInfoChecklist } from './MissingInfoChecklist';
import { SendToCFOModal } from './SendToCFOModal';
import { ReportPreviewSheet } from './ReportPreviewSheet';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Props {
  answers: QuizAnswers;
  updateAnswers: (updates: Partial<QuizAnswers>) => void;
  dbPercent: number;
  onReset: () => void;
}

export function QuizResult({ answers, updateAnswers, dbPercent, onReset }: Props) {
  const [activeTab, setActiveTab] = useState<'mehrbesuche' | 'absicherung'>('mehrbesuche');
  const [showCHF, setShowCHF] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [showCompanyData, setShowCompanyData] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [showCFOModal, setShowCFOModal] = useState(false);
  const [showReportPreview, setShowReportPreview] = useState(false);

  const isLargeOrg = answers.employees === '11-30' || answers.employees === '31+' || answers.locations === '2-3' || answers.locations === '4+';

  const fitResult = calculateFitScore(answers);
  const plan = getPlanByKey(fitResult.recommendedPlan);
  const refinancing = calculateRefinancing(answers, plan.priceCHF, dbPercent);
  const uplift = calculateUplift(answers, plan.includesGHL);

  const fitLabel = TEXTS.fitLabels[fitResult.score];
  const coveragePercent = Math.min(100, (refinancing.totalSavings / plan.priceCHF) * 100);
  const isCovered = refinancing.gap <= 0;

  const copyResult = () => {
    const text = `My2Go Fit-Check: ${fitLabel.title} - ${plan.name} (${formatCHF(plan.priceCHF)}/Mt.)`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      await generatePDFReport({ answers, fitResult, refinancing, uplift, planName: plan.name, planPrice: plan.priceCHF });
    } finally {
      setIsExporting(false);
    }
  };

  const handleSendEmail = async () => {
    if (!answers.contactEmail) { toast.error('Bitte E-Mail eingeben'); return; }
    setIsSendingEmail(true);
    try {
      await supabase.functions.invoke('send-partner-report', { body: { recipientEmail: answers.contactEmail, companyName: answers.companyName || 'Partner' } });
      setEmailSent(true);
      toast.success('Report gesendet!');
    } catch { toast.error('Fehler beim Senden'); }
    finally { setIsSendingEmail(false); }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div className="text-center" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${fitLabel.bgColor} ${fitLabel.color} font-bold mb-4`}>
          <CheckCircle2 className="w-5 h-5" />{fitLabel.title}
        </div>
        <h3 className="text-2xl font-bold mb-2">{plan.name} empfohlen</h3>
        <p className="text-3xl font-bold text-primary">{formatCHF(plan.priceCHF)}<span className="text-base font-normal text-muted-foreground">/Monat</span></p>
      </motion.div>

      {/* Tabs: Mehrbesuche vs Absicherung */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="mehrbesuche" className="flex items-center gap-2"><TrendingUp className="w-4 h-4" />Mehrbesuche</TabsTrigger>
          <TabsTrigger value="absicherung" className="flex items-center gap-2"><Shield className="w-4 h-4" />Absicherung</TabsTrigger>
        </TabsList>

        <TabsContent value="mehrbesuche" className="space-y-4">
          <Card className="p-5 border-2 border-green-200 bg-green-50/50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-green-600" />
                <h4 className="font-bold">Uplift nach 12 Monaten</h4>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="text-muted-foreground hover:text-foreground transition-colors">
                        <Info className="w-4 h-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs p-3 text-xs">
                      <p className="font-semibold mb-2">Berechnungsgrundlage</p>
                      <ul className="space-y-1 text-muted-foreground">
                        <li>• Enrollment: 20-50% der Stammkunden</li>
                        <li>• Aktiv-Rate: 40-70% der Mitglieder</li>
                        <li>• Mehrbesuche: 2-5x/Jahr pro Aktivem</li>
                      </ul>
                      <p className="mt-2 text-muted-foreground italic">
                        Basierend auf Branchenbenchmarks (Bond Loyalty Report, Antavo)
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex items-center gap-2"><span className="text-xs text-muted-foreground">CHF</span><Switch checked={showCHF} onCheckedChange={setShowCHF} /></div>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {(['conservative', 'realistic', 'ambitious'] as const).map(scenario => (
                <div key={scenario} className={`p-4 rounded-xl text-center ${scenario === 'realistic' ? 'bg-green-200 border-2 border-green-400' : 'bg-white border border-green-200'}`}>
                  <p className="text-xs text-muted-foreground mb-2">{scenario === 'conservative' ? 'Konservativ' : scenario === 'realistic' ? 'Realistisch' : 'Ambitioniert'}</p>
                  <p className="text-2xl font-bold text-green-700">+{Math.round(uplift.mehrbesuche.totalVisitsPerMonth[scenario] * 10) / 10}</p>
                  <p className="text-xs text-muted-foreground">Mehrbesuche/Mt.</p>
                  <p className="text-lg font-semibold text-green-600 mt-2">+{Math.round(uplift.mehrbesuche.totalVisitsPerYear[scenario])}/Jahr</p>
                  {showCHF && <p className="text-sm font-medium text-green-800 mt-2 bg-green-100 rounded px-2 py-1">≈ +{formatCHF(uplift.mehrbesuche.upliftCHFPerMonth[scenario])}/Mt.</p>}
                </div>
              ))}
            </div>
            
            {/* Benchmark sources */}
            <Collapsible>
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50/50 border border-blue-100 hover:bg-blue-50 transition-colors cursor-pointer">
                  <div className="flex items-center gap-2 text-sm text-blue-700">
                    <Info className="w-4 h-4" />
                    <span className="font-medium">Methodik & Quellen</span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-blue-500" />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-3 p-4 rounded-lg bg-blue-50/30 border border-blue-100 text-xs space-y-3">
                  <div>
                    <p className="font-semibold text-foreground mb-1">Berechnungsmodell</p>
                    <p className="text-muted-foreground">
                      Mehrbesuche = Stammkunden × Enrollment × Aktiv-Rate × Extra-Besuche/Jahr
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground mb-1">Annahmen (realistisch)</p>
                    <ul className="text-muted-foreground space-y-0.5">
                      <li>• <strong>35%</strong> der Stammkunden registrieren sich (90 Tage)</li>
                      <li>• <strong>55%</strong> davon nutzen aktiv das Programm</li>
                      <li>• Aktive Mitglieder besuchen <strong>3.5×/Jahr</strong> zusätzlich</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground mb-1">Branchenquellen</p>
                    <div className="flex flex-wrap gap-2">
                      <a 
                        href="https://www.bondbrandloyalty.com/the-loyalty-report" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white border text-blue-600 hover:bg-blue-50 transition-colors"
                      >
                        Bond Loyalty Report <ExternalLink className="w-3 h-3" />
                      </a>
                      <a 
                        href="https://antavo.com/blog/loyalty-program-statistics/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white border text-blue-600 hover:bg-blue-50 transition-colors"
                      >
                        Antavo Statistics <ExternalLink className="w-3 h-3" />
                      </a>
                      <a 
                        href="https://www.yotpo.com/loyalty-programs-statistics/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white border text-blue-600 hover:bg-blue-50 transition-colors"
                      >
                        Yotpo Research <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                  <p className="text-muted-foreground italic pt-2 border-t">
                    Hinweis: Ergebnisse variieren je nach Branche, Standort und Umsetzung. Keine Garantie.
                  </p>
                </div>
              </CollapsibleContent>
            </Collapsible>
            
            {showCHF && <p className="text-xs text-amber-700 bg-amber-50 rounded-lg p-2 mt-3">⚠️ CHF-Schätzung basiert auf Ø Bon. Keine Garantie.</p>}
            {fitResult.recommendReviewBooster && <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg mt-4 flex items-start gap-2"><Star className="w-5 h-5 text-amber-500" /><div><p className="text-sm font-medium text-amber-900">Review-Booster empfohlen</p></div></div>}
          </Card>
        </TabsContent>

        <TabsContent value="absicherung" className="space-y-4">
          <Card className="p-5 border-2 border-primary/20 bg-primary/5">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-primary" />
              <h4 className="font-bold">Absicherung (ohne Wachstum)</h4>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="text-muted-foreground hover:text-foreground transition-colors">
                      <Info className="w-4 h-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs p-3 text-xs">
                    <p className="font-semibold mb-2">Einsparpotenzial</p>
                    <ul className="space-y-1 text-muted-foreground">
                      <li>• Telekom/Web: 10-20% Ersparnis</li>
                      <li>• Versicherungen: 10-15% Ersparnis</li>
                      <li>• Zeitersparnis: CHF 90/Std.</li>
                    </ul>
                    <p className="mt-2 text-muted-foreground italic">
                      Basierend auf Schweizer Vergleichsportalen
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1"><span className="text-muted-foreground">Abdeckung</span><span className={`font-bold ${isCovered ? 'text-green-600' : 'text-amber-600'}`}>{formatPercent(coveragePercent / 100)}</span></div>
              <div className="h-3 bg-muted rounded-full overflow-hidden"><motion.div className={`h-full ${isCovered ? 'bg-green-500' : 'bg-primary'}`} initial={{ width: 0 }} animate={{ width: `${coveragePercent}%` }} /></div>
            </div>
            <div className="space-y-2 text-sm">
              {refinancing.fixcostBreakdown.length > 0 && <div className="flex justify-between"><span className="flex items-center gap-2"><PiggyBank className="w-4 h-4" />Fixkosten</span><span className="font-medium text-green-600">+{formatCHF(refinancing.fixcostSavings)}</span></div>}
              {refinancing.timeSavings > 0 && <div className="flex justify-between"><span className="flex items-center gap-2"><Clock className="w-4 h-4" />Zeit</span><span className="font-medium text-green-600">+{formatCHF(refinancing.timeSavings)}</span></div>}
              {refinancing.sponsoringSavings > 0 && <div className="flex justify-between"><span className="flex items-center gap-2"><Handshake className="w-4 h-4" />Sponsoring</span><span className="font-medium text-green-600">+{formatCHF(refinancing.sponsoringSavings)}</span></div>}
              <div className="border-t pt-2 mt-2 flex justify-between font-bold"><span>Total</span><span className="text-green-600">{formatCHF(refinancing.totalSavings)}</span></div>
            </div>
            
            {/* Methodology sources */}
            <Collapsible>
              <CollapsibleTrigger className="w-full mt-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/10 hover:bg-primary/10 transition-colors cursor-pointer">
                  <div className="flex items-center gap-2 text-sm text-primary">
                    <Info className="w-4 h-4" />
                    <span className="font-medium">Methodik & Quellen</span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-primary/60" />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-3 p-4 rounded-lg bg-primary/5 border border-primary/10 text-xs space-y-3">
                  <div>
                    <p className="font-semibold text-foreground mb-1">Berechnungsmodell</p>
                    <p className="text-muted-foreground">
                      Einsparung = Aktuelle Kosten × branchenüblicher Sparprozentsatz
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground mb-1">Sparpotenziale nach Kategorie</p>
                    <ul className="text-muted-foreground space-y-0.5">
                      <li>• <strong>Telekom/Internet:</strong> 15% (bei &gt;CHF 80/Mt.)</li>
                      <li>• <strong>Web-Hosting:</strong> 10-20% je nach Volumen</li>
                      <li>• <strong>Versicherungen:</strong> 10% (bei &gt;CHF 200/Mt.)</li>
                      <li>• <strong>Treuhand:</strong> 15% (bei &gt;CHF 300/Mt.)</li>
                      <li>• <strong>Zeitersparnis:</strong> CHF 90/Std. Opportunitätskosten</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground mb-1">Schweizer Vergleichsquellen</p>
                    <div className="flex flex-wrap gap-2">
                      <a 
                        href="https://www.moneyland.ch" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white border text-primary hover:bg-primary/5 transition-colors"
                      >
                        Moneyland.ch <ExternalLink className="w-3 h-3" />
                      </a>
                      <a 
                        href="https://www.comparis.ch" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white border text-primary hover:bg-primary/5 transition-colors"
                      >
                        Comparis.ch <ExternalLink className="w-3 h-3" />
                      </a>
                      <a 
                        href="https://www.strompreis.elcom.admin.ch" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white border text-primary hover:bg-primary/5 transition-colors"
                      >
                        ElCom Strompreis <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                  <p className="text-muted-foreground italic pt-2 border-t">
                    Hinweis: Tatsächliche Einsparungen hängen von individuellen Verträgen und Verhandlungen ab.
                  </p>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modules */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4"><Sparkles className="w-5 h-5 text-accent" /><h4 className="font-bold">Empfohlene Module</h4></div>
        <div className="space-y-3">
          {fitResult.modules.map(moduleKey => {
            const module = MODULES[moduleKey as ModuleKey];
            if (!module) return null;
            return <div key={moduleKey} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"><CheckCircle2 className="w-5 h-5 text-green-500" /><div><p className="font-medium">{module.title}</p><p className="text-sm text-muted-foreground">{module.desc}</p></div></div>;
          })}
        </div>
      </Card>

      {/* Action Launcher */}
      <Collapsible open={showActions} onOpenChange={setShowActions}>
        <CollapsibleTrigger className="w-full"><Card className="p-4 flex items-center justify-between hover:bg-muted/50 cursor-pointer"><div className="flex items-center gap-2"><Zap className="w-5 h-5 text-amber-500" /><span className="font-medium">Action Launcher</span></div>{showActions ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}</Card></CollapsibleTrigger>
        <CollapsibleContent><div className="mt-2"><ActionLauncher answers={answers} updateAnswers={updateAnswers} breakdown={refinancing.fixcostBreakdown} /></div></CollapsibleContent>
      </Collapsible>

      {/* Company Data */}
      <Collapsible open={showCompanyData} onOpenChange={setShowCompanyData}>
        <CollapsibleTrigger className="w-full"><Card className="p-4 flex items-center justify-between hover:bg-muted/50 cursor-pointer"><div className="flex items-center gap-2"><Building2 className="w-5 h-5" /><span className="font-medium">Firmendaten</span></div>{showCompanyData ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}</Card></CollapsibleTrigger>
        <CollapsibleContent><Card className="p-5 mt-2"><div className="grid sm:grid-cols-2 gap-4"><div><Label>Firmenname</Label><Input value={answers.companyName} onChange={(e) => updateAnswers({ companyName: e.target.value })} /></div><div><Label>E-Mail</Label><Input value={answers.contactEmail} onChange={(e) => updateAnswers({ contactEmail: e.target.value })} /></div></div></Card></CollapsibleContent>
      </Collapsible>

      <MissingInfoChecklist answers={answers} userRole={answers.userRole} />

      {/* Report Actions */}
      <Card className="p-4 bg-muted/30">
        <div className="flex flex-col gap-2">
          <Button size="lg" className="w-full h-12 rounded-xl" onClick={() => setShowReportPreview(true)}><Eye className="w-4 h-4 mr-2" />Report Vorschau</Button>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={handleExportPDF} disabled={isExporting}>{isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}</Button>
            <Button variant="outline" className="flex-1" onClick={handleSendEmail} disabled={isSendingEmail}>{isSendingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}</Button>
          </div>
        </div>
      </Card>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <Button size="lg" className="flex-1 h-14 font-bold rounded-xl" asChild>
          <a href="/go/checkout">Jetzt starten<ArrowRight className="w-5 h-5 ml-2" /></a>
        </Button>
        <Button variant="outline" size="lg" className="h-14 rounded-xl" onClick={copyResult}><Copy className="w-4 h-4 mr-2" />{copied ? 'Kopiert!' : 'Kopieren'}</Button>
        <Button variant="ghost" size="lg" className="h-14 rounded-xl" onClick={onReset}><RotateCcw className="w-4 h-4 mr-2" />Neu</Button>
      </div>

      <SendToCFOModal open={showCFOModal} onOpenChange={setShowCFOModal} answers={answers} fitResult={fitResult} refinancing={refinancing} planName={plan.name} planPrice={plan.priceCHF} includesGHL={plan.includesGHL} />
      <ReportPreviewSheet open={showReportPreview} onOpenChange={setShowReportPreview} answers={answers} fitResult={fitResult} refinancing={refinancing} uplift={uplift} planName={plan.name} planPrice={plan.priceCHF} onDownloadPDF={handleExportPDF} onSendEmail={handleSendEmail} isExporting={isExporting} isSendingEmail={isSendingEmail} emailSent={emailSent} />
    </div>
  );
}
