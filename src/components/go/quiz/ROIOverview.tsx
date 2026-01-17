import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { 
  TrendingUp, 
  Shield, 
  Wallet, 
  CheckCircle2,
  ArrowUpRight,
  Target
} from 'lucide-react';
import { formatCHF } from '@/lib/partner-quiz-config';
import { RefinancingResult, UpliftResult } from '@/lib/partner-quiz-calculations';
import { Scenario } from './ScenarioSlider';

interface Props {
  planPrice: number;
  planName: string;
  refinancing: RefinancingResult;
  uplift: UpliftResult;
  scenario: Scenario;
}

export function ROIOverview({ planPrice, planName, refinancing, uplift, scenario }: Props) {
  // Calculate ROI metrics based on selected scenario
  const metrics = useMemo(() => {
    const absicherung = refinancing.totalSavings;
    const monthlyUplift = uplift.mehrbesuche.totalUpliftCHFPerMonth[scenario];
    const yearlyUplift = monthlyUplift * 12;
    
    const totalMonthlyValue = absicherung + monthlyUplift;
    const totalYearlyValue = (absicherung * 12) + yearlyUplift;
    const yearlyCost = planPrice * 12;
    
    const roiPercent = yearlyCost > 0 ? ((totalYearlyValue - yearlyCost) / yearlyCost) * 100 : 0;
    const netGainMonthly = totalMonthlyValue - planPrice;
    const netGainYearly = totalYearlyValue - yearlyCost;
    const paybackMonths = totalMonthlyValue > 0 ? planPrice / totalMonthlyValue : 0;
    
    return {
      absicherung,
      monthlyUplift,
      yearlyUplift,
      totalMonthlyValue,
      totalYearlyValue,
      yearlyCost,
      roiPercent,
      netGainMonthly,
      netGainYearly,
      paybackMonths,
      isPositive: netGainMonthly > 0
    };
  }, [planPrice, refinancing, uplift, scenario]);

  // Calculate bar widths for visualization
  const maxValue = Math.max(metrics.totalMonthlyValue, planPrice);
  const absicherungWidth = (metrics.absicherung / maxValue) * 100;
  const upliftWidth = (metrics.monthlyUplift / maxValue) * 100;
  const costWidth = (planPrice / maxValue) * 100;

  const scenarioLabel = scenario === 'conservative' ? 'Konservativ' : scenario === 'realistic' ? 'Realistisch' : 'Ambitioniert';

  return (
    <Card className="p-5 bg-gradient-to-br from-slate-50 to-slate-100 border-2 border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary rounded-lg">
            <Target className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h4 className="font-bold text-lg">ROI Übersicht</h4>
            <p className="text-sm text-muted-foreground">{planName} · {scenarioLabel}</p>
          </div>
        </div>
        
        {metrics.isPositive && (
          <div className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            Positiver ROI
          </div>
        )}
      </div>

      {/* Visual Bar Chart */}
      <div className="space-y-4 mb-6">
        {/* Value bars */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Monatlicher Wert</span>
            <motion.span 
              key={metrics.totalMonthlyValue}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-bold text-green-600"
            >
              {formatCHF(metrics.totalMonthlyValue)}
            </motion.span>
          </div>
          <div className="h-10 bg-slate-200 rounded-lg overflow-hidden flex">
            <motion.div 
              className="h-full bg-gradient-to-r from-primary to-primary/80 flex items-center justify-center"
              initial={{ width: 0 }}
              animate={{ width: `${absicherungWidth}%` }}
              transition={{ duration: 0.5 }}
            >
              {absicherungWidth > 15 && (
                <span className="text-xs text-primary-foreground font-medium px-2 truncate">
                  <Shield className="w-3 h-3 inline mr-1" />
                  Absicherung
                </span>
              )}
            </motion.div>
            <motion.div 
              className="h-full bg-gradient-to-r from-green-500 to-green-400 flex items-center justify-center"
              initial={{ width: 0 }}
              animate={{ width: `${upliftWidth}%` }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              {upliftWidth > 15 && (
                <span className="text-xs text-white font-medium px-2 truncate">
                  <TrendingUp className="w-3 h-3 inline mr-1" />
                  Uplift
                </span>
              )}
            </motion.div>
          </div>
        </div>

        {/* Cost bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Monatliche Kosten</span>
            <span className="font-bold text-slate-600">{formatCHF(planPrice)}</span>
          </div>
          <div className="h-10 bg-slate-200 rounded-lg overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-slate-400 to-slate-300 flex items-center justify-center"
              initial={{ width: 0 }}
              animate={{ width: `${costWidth}%` }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {costWidth > 15 && (
                <span className="text-xs text-slate-700 font-medium px-2 truncate">
                  <Wallet className="w-3 h-3 inline mr-1" />
                  {planName}
                </span>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Net Result */}
      <motion.div 
        key={`net-${scenario}`}
        className={`p-4 rounded-xl ${metrics.isPositive ? 'bg-green-100 border-2 border-green-200' : 'bg-amber-100 border-2 border-amber-200'}`}
        initial={{ opacity: 0.8, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowUpRight className={`w-5 h-5 ${metrics.isPositive ? 'text-green-600' : 'text-amber-600'}`} />
            <span className="font-medium">Monatlicher Nettogewinn</span>
          </div>
          <motion.span 
            key={metrics.netGainMonthly}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className={`text-2xl font-bold ${metrics.isPositive ? 'text-green-700' : 'text-amber-700'}`}
          >
            {metrics.netGainMonthly >= 0 ? '+' : ''}{formatCHF(metrics.netGainMonthly)}
          </motion.span>
        </div>
      </motion.div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-3 gap-3 mt-4">
        <motion.div 
          key={`roi-${scenario}`}
          className="p-3 bg-white rounded-lg border text-center"
          initial={{ opacity: 0.8 }}
          animate={{ opacity: 1 }}
        >
          <motion.p 
            key={metrics.roiPercent}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold text-primary"
          >
            {Math.round(metrics.roiPercent)}%
          </motion.p>
          <p className="text-xs text-muted-foreground">ROI p.a.</p>
        </motion.div>
        
        <motion.div 
          key={`gain-${scenario}`}
          className="p-3 bg-white rounded-lg border text-center"
          initial={{ opacity: 0.8 }}
          animate={{ opacity: 1 }}
        >
          <motion.p 
            key={metrics.netGainYearly}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold text-green-600"
          >
            +{formatCHF(metrics.netGainYearly)}
          </motion.p>
          <p className="text-xs text-muted-foreground">Netto/Jahr</p>
        </motion.div>
        
        <motion.div 
          key={`payback-${scenario}`}
          className="p-3 bg-white rounded-lg border text-center"
          initial={{ opacity: 0.8 }}
          animate={{ opacity: 1 }}
        >
          <motion.p 
            key={metrics.paybackMonths}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-2xl font-bold text-amber-600"
          >
            {metrics.paybackMonths < 1 ? '<1' : metrics.paybackMonths.toFixed(1)}
          </motion.p>
          <p className="text-xs text-muted-foreground">Monate Payback</p>
        </motion.div>
      </div>

      {/* Breakdown Legend */}
      <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-3 h-3 rounded bg-primary" />
          <span className="text-muted-foreground">Absicherung:</span>
          <span className="font-medium">{formatCHF(metrics.absicherung)}/Mt.</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="w-3 h-3 rounded bg-green-500" />
          <span className="text-muted-foreground">Uplift:</span>
          <motion.span 
            key={metrics.monthlyUplift}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="font-medium"
          >
            {formatCHF(metrics.monthlyUplift)}/Mt.
          </motion.span>
        </div>
      </div>
    </Card>
  );
}
