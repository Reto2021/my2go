import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
  Calculator,
  Sparkles,
  Clock,
  Handshake,
  PiggyBank,
  Building2,
  FileDown,
  Loader2,
  Mail,
  AlertCircle,
  Eye
} from 'lucide-react';
import { ActionLauncher } from './ActionLauncher';
import { NextStepCTA } from './NextStepCTA';
import { generatePDFReport } from './pdfExport';
import { MissingInfoChecklist } from './MissingInfoChecklist';
import { SendToCFOModal } from './SendToCFOModal';

interface Props {
  answers: QuizAnswers;
  updateAnswers: (updates: Partial<QuizAnswers>) => void;
  dbPercent: number;
  onScrollToBuy: () => void;
  onReset: () => void;
}

export function QuizResult({ answers, updateAnswers, dbPercent, onScrollToBuy, onReset }: Props) {
  const [showUplift, setShowUplift] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [showCompanyData, setShowCompanyData] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showCFOModal, setShowCFOModal] = useState(false);
  const [cfoView, setCfoView] = useState(false);

  // Size check for emphasis
  const isLargeOrg = answers.employees === '11-30' || answers.employees === '31+' || answers.locations === '2-3' || answers.locations === '4+';

  // Calculations
  const fitResult = calculateFitScore(answers);
  const plan = getPlanByKey(fitResult.recommendedPlan);
  const refinancing = calculateRefinancing(answers, plan.priceCHF, dbPercent);
  const uplift = calculateUplift(answers, plan.includesGHL);

  const fitLabel = TEXTS.fitLabels[fitResult.score];
  
  // Coverage calculation
  const coveragePercent = Math.min(100, (refinancing.totalSavings / plan.priceCHF) * 100);
  const isCovered = refinancing.gap <= 0;

  const copyResult = () => {
    const text = `
My2Go Fit-Check Ergebnis
========================
Fit-Score: ${fitLabel.title} (${fitResult.score})
Empfohlener Plan: ${plan.name} (CHF ${plan.priceCHF}/Mt.)

Refinanzierung:
- Fixkosten-Einsparungen: ${formatCHF(refinancing.fixcostSavings)}
- Zeit-Einsparungen: ${formatCHF(refinancing.timeSavings)} (${refinancing.timeHours}h/Mt.)
- Sponsoring-Potenzial: ${formatCHF(refinancing.sponsoringSavings)}
- TOTAL: ${formatCHF(refinancing.totalSavings)}

${isCovered ? '✓ Vollständig gedeckt!' : `Lücke: ${formatCHF(refinancing.gap)}`}

Empfohlene Module:
${fitResult.modules.map(m => `- ${MODULES[m as ModuleKey]?.title || m}`).join('\n')}
    `.trim();
    
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      await generatePDFReport({
        answers,
        fitResult,
        refinancing,
        uplift,
        planName: plan.name,
        planPrice: plan.priceCHF
      });
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Fit Score */}
      <motion.div 
        className="text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${fitLabel.bgColor} ${fitLabel.color} font-bold mb-4`}>
          <CheckCircle2 className="w-5 h-5" />
          {fitLabel.title}
        </div>
        <h3 className="text-2xl font-bold mb-2">
          {plan.name} empfohlen
        </h3>
        <p className="text-3xl font-bold text-primary">
          {formatCHF(plan.priceCHF)}<span className="text-base font-normal text-muted-foreground">/Monat</span>
        </p>
        {plan.includesGHL && (
          <p className="text-sm text-muted-foreground mt-1 flex items-center justify-center gap-1">
            <Zap className="w-4 h-4 text-amber-500" />
            Inkl. GHL/Automationen
          </p>
        )}
      </motion.div>

      {/* Refinancing Summary */}
      <Card className="p-5 border-2 border-primary/20 bg-primary/5">
        <div className="flex items-center gap-2 mb-4">
          <Calculator className="w-5 h-5 text-primary" />
          <h4 className="font-bold">0-Risiko Refinanzierung</h4>
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">Abdeckung</span>
            <span className={`font-bold ${isCovered ? 'text-green-600' : 'text-amber-600'}`}>
              {formatPercent(coveragePercent / 100)}
            </span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <motion.div
              className={`h-full ${isCovered ? 'bg-green-500' : 'bg-primary'}`}
              initial={{ width: 0 }}
              animate={{ width: `${coveragePercent}%` }}
              transition={{ duration: 0.8, delay: 0.2 }}
            />
          </div>
        </div>

        {/* Breakdown */}
        <div className="space-y-2 text-sm">
          {refinancing.fixcostBreakdown.length > 0 && (
            <div className="flex justify-between">
              <span className="flex items-center gap-2">
                <PiggyBank className="w-4 h-4 text-muted-foreground" />
                Fixkosten-Einsparungen
              </span>
              <span className="font-medium text-green-600">+{formatCHF(refinancing.fixcostSavings)}</span>
            </div>
          )}
          {refinancing.timeSavings > 0 && (
            <div className="flex justify-between">
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                Zeit-Einsparungen ({refinancing.timeHours}h × CHF 90)
              </span>
              <span className="font-medium text-green-600">+{formatCHF(refinancing.timeSavings)}</span>
            </div>
          )}
          {refinancing.sponsoringSavings > 0 && (
            <div className="flex justify-between">
              <span className="flex items-center gap-2">
                <Handshake className="w-4 h-4 text-muted-foreground" />
                Sponsoring-Potenzial
              </span>
              <span className="font-medium text-green-600">+{formatCHF(refinancing.sponsoringSavings)}</span>
            </div>
          )}
          <div className="border-t border-border pt-2 mt-2 flex justify-between font-bold">
            <span>Total Einsparungen</span>
            <span className="text-green-600">{formatCHF(refinancing.totalSavings)}</span>
          </div>
          {!isCovered && refinancing.miniPriceLever && (
            <div className="p-3 bg-amber-50 rounded-lg mt-3">
              <p className="text-amber-800 text-xs">
                <strong>Mini-Preishebel:</strong> Bei {formatPercent(dbPercent)} DB benötigen Sie nur{' '}
                <strong>{formatCHF(refinancing.miniPriceLever.requiredExtraRevenue)}</strong> Mehrumsatz/Mt.
                (≈ {formatCHF(refinancing.miniPriceLever.priceIncreasePerSale)} pro Transaktion)
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Recommended Modules */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-accent" />
          <h4 className="font-bold">Empfohlene Module</h4>
        </div>
        <div className="space-y-3">
          {fitResult.modules.map(moduleKey => {
            const module = MODULES[moduleKey as ModuleKey];
            if (!module) return null;
            return (
              <div key={moduleKey} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">{module.title}</p>
                  <p className="text-sm text-muted-foreground">{module.desc}</p>
                </div>
              </div>
            );
          })}
          {fitResult.setupHints.length > 0 && (
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-sm font-medium text-amber-900 mb-1">Setup-Empfehlungen:</p>
              <ul className="text-xs text-amber-800 space-y-1">
                {fitResult.setupHints.map(hint => (
                  <li key={hint}>• {hint}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Card>

      {/* Uplift (optional) */}
      <Collapsible open={showUplift} onOpenChange={setShowUplift}>
        <CollapsibleTrigger className="w-full">
          <Card className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors cursor-pointer">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <span className="font-medium">Uplift-Potenzial anzeigen</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">Bonus</span>
            </div>
            {showUplift ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </Card>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <Card className="p-5 mt-2 border-2 border-green-200 bg-green-50/50">
            <p className="text-sm text-muted-foreground mb-4">{TEXTS.upliftNote}</p>
            <div className="grid grid-cols-3 gap-3">
              {(['conservative', 'realistic', 'ambitious'] as const).map(scenario => (
                <div 
                  key={scenario}
                  className={`p-3 rounded-lg text-center ${
                    scenario === 'realistic' 
                      ? 'bg-green-200 border-2 border-green-400' 
                      : 'bg-white border border-green-200'
                  }`}
                >
                  <p className="text-xs text-muted-foreground mb-1 capitalize">
                    {scenario === 'conservative' ? 'Konservativ' : scenario === 'realistic' ? 'Realistisch' : 'Ambitioniert'}
                  </p>
                  <p className="text-lg font-bold text-green-700">
                    +{formatCHF(uplift.total[scenario])}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    /Monat
                  </p>
                </div>
              ))}
            </div>
            <p className="text-xs text-center text-muted-foreground mt-3">
              Basis: {formatCHF(uplift.baselineRevenue)} geschätzter Monatsumsatz
            </p>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {/* Action Launcher */}
      <Collapsible open={showActions} onOpenChange={setShowActions}>
        <CollapsibleTrigger className="w-full">
          <Card className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors cursor-pointer">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              <span className="font-medium">Action Launcher</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                {refinancing.fixcostBreakdown.length} Hebel
              </span>
            </div>
            {showActions ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </Card>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-2">
            <ActionLauncher 
              answers={answers}
              updateAnswers={updateAnswers}
              breakdown={refinancing.fixcostBreakdown}
            />
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Company Data */}
      <Collapsible open={showCompanyData} onOpenChange={setShowCompanyData}>
        <CollapsibleTrigger className="w-full">
          <Card className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors cursor-pointer">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-muted-foreground" />
              <span className="font-medium">Firmendaten ergänzen</span>
              <span className="text-xs text-muted-foreground">(für Vorlagen)</span>
            </div>
            {showCompanyData ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </Card>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <Card className="p-5 mt-2">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm">Firmenname</Label>
                <Input
                  value={answers.companyName}
                  onChange={(e) => updateAnswers({ companyName: e.target.value })}
                  placeholder="Muster GmbH"
                />
              </div>
              <div>
                <Label className="text-sm">Kontaktperson</Label>
                <Input
                  value={answers.contactPerson}
                  onChange={(e) => updateAnswers({ contactPerson: e.target.value })}
                  placeholder="Max Muster"
                />
              </div>
              <div>
                <Label className="text-sm">Adresse</Label>
                <Input
                  value={answers.companyAddress}
                  onChange={(e) => updateAnswers({ companyAddress: e.target.value })}
                  placeholder="Musterstrasse 1"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-sm">PLZ</Label>
                  <Input
                    value={answers.companyPostalCode}
                    onChange={(e) => updateAnswers({ companyPostalCode: e.target.value })}
                    placeholder="8000"
                  />
                </div>
                <div>
                  <Label className="text-sm">Ort</Label>
                  <Input
                    value={answers.companyCity}
                    onChange={(e) => updateAnswers({ companyCity: e.target.value })}
                    placeholder="Zürich"
                  />
                </div>
              </div>
              <div>
                <Label className="text-sm">E-Mail</Label>
                <Input
                  type="email"
                  value={answers.contactEmail}
                  onChange={(e) => updateAnswers({ contactEmail: e.target.value })}
                  placeholder="info@muster.ch"
                />
              </div>
              <div>
                <Label className="text-sm">Telefon</Label>
                <Input
                  value={answers.contactPhone}
                  onChange={(e) => updateAnswers({ contactPhone: e.target.value })}
                  placeholder="+41 44 123 45 67"
                />
              </div>
            </div>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {/* Size Banner */}
      {isLargeOrg && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <p className="text-sm text-blue-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            {TEXTS.sizeBanner}
          </p>
        </Card>
      )}

      {/* Operations Banner */}
      {answers.userRole === 'operations' && (
        <Card className="p-4 bg-amber-50 border-amber-200">
          <p className="text-sm text-amber-800 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            {TEXTS.operationsBanner}
          </p>
        </Card>
      )}

      {/* Missing Info Checklist */}
      <MissingInfoChecklist answers={answers} userRole={answers.userRole} />

      {/* Send to CFO Button - show if not finance role */}
      {answers.userRole !== 'finance' && (
        <Button
          variant="outline"
          size="lg"
          className="w-full h-14 rounded-xl border-2 border-primary/30"
          onClick={() => setShowCFOModal(true)}
        >
          <Mail className="w-5 h-5 mr-2 text-primary" />
          Ergebnis an Finanzen senden
        </Button>
      )}

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <Button 
          size="lg" 
          className="flex-1 h-14 text-base font-bold rounded-xl"
          onClick={onScrollToBuy}
        >
          Jetzt starten
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="h-14 rounded-xl"
          onClick={handleExportPDF}
          disabled={isExporting}
        >
          {isExporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileDown className="w-4 h-4 mr-2" />}
          PDF
        </Button>
        <Button
          variant="outline"
          size="lg"
          className="h-14 rounded-xl"
          onClick={copyResult}
        >
          <Copy className="w-4 h-4 mr-2" />
          {copied ? 'Kopiert!' : 'Kopieren'}
        </Button>
        <Button
          variant="ghost"
          size="lg"
          className="h-14 rounded-xl"
          onClick={onReset}
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Neu
        </Button>
      </div>

      {/* Send to CFO Modal */}
      <SendToCFOModal
        open={showCFOModal}
        onOpenChange={setShowCFOModal}
        answers={answers}
        fitResult={fitResult}
        refinancing={refinancing}
        planName={plan.name}
        planPrice={plan.priceCHF}
        includesGHL={plan.includesGHL}
      />
    </div>
  );
}
