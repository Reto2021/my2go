import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { 
  TrendingUp, 
  Shield, 
  Wallet, 
  CheckCircle2,
  ArrowUpRight,
  Target,
  Zap
} from 'lucide-react';
import { formatCHF } from '@/lib/partner-quiz-config';
import { RefinancingResult, UpliftResult } from '@/lib/partner-quiz-calculations';

interface Props {
  planPrice: number;
  planName: string;
  refinancing: RefinancingResult;
  uplift: UpliftResult;
}

export function ROIOverview({ planPrice, planName, refinancing, uplift }: Props) {
  // Calculate ROI metrics
  const metrics = useMemo(() => {
    const absicherung = refinancing.totalSavings;
    const monthlyUplift = uplift.mehrbesuche.totalUpliftCHFPerMonth.realistic;
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
  }, [planPrice, refinancing, uplift]);

  // Calculate bar widths for visualization
  const maxValue = Math.max(metrics.totalMonthlyValue, planPrice);
  const absicherungWidth = (metrics.absicherung / maxValue) * 100;
  const upliftWidth = (metrics.monthlyUplift / maxValue) * 100;
  const costWidth = (planPrice / maxValue) * 100;

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
            <p className="text-sm text-muted-foreground">{planName}</p>
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
            <span className="font-bold text-green-600">{formatCHF(metrics.totalMonthlyValue)}</span>
          </div>
          <div className="h-10 bg-slate-200 rounded-lg overflow-hidden flex">
            <motion.div 
              className="h-full bg-gradient-to-r from-primary to-primary/80 flex items-center justify-center"
              initial={{ width: 0 }}
              animate={{ width: `${absicherungWidth}%` }}
              transition={{ duration: 0.8, delay: 0.2 }}
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
              transition={{ duration: 0.8, delay: 0.5 }}
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
              transition={{ duration: 0.8, delay: 0.8 }}
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
        className={`p-4 rounded-xl ${metrics.isPositive ? 'bg-green-100 border-2 border-green-200' : 'bg-amber-100 border-2 border-amber-200'}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowUpRight className={`w-5 h-5 ${metrics.isPositive ? 'text-green-600' : 'text-amber-600'}`} />
            <span className="font-medium">Monatlicher Nettogewinn</span>
          </div>
          <span className={`text-2xl font-bold ${metrics.isPositive ? 'text-green-700' : 'text-amber-700'}`}>
            {metrics.netGainMonthly >= 0 ? '+' : ''}{formatCHF(metrics.netGainMonthly)}
          </span>
        </div>
      </motion.div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-3 gap-3 mt-4">
        <motion.div 
          className="p-3 bg-white rounded-lg border text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.4 }}
        >
          <p className="text-2xl font-bold text-primary">{Math.round(metrics.roiPercent)}%</p>
          <p className="text-xs text-muted-foreground">ROI p.a.</p>
        </motion.div>
        
        <motion.div 
          className="p-3 bg-white rounded-lg border text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.5 }}
        >
          <p className="text-2xl font-bold text-green-600">+{formatCHF(metrics.netGainYearly)}</p>
          <p className="text-xs text-muted-foreground">Netto/Jahr</p>
        </motion.div>
        
        <motion.div 
          className="p-3 bg-white rounded-lg border text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.6 }}
        >
          <p className="text-2xl font-bold text-amber-600">
            {metrics.paybackMonths < 1 ? '<1' : metrics.paybackMonths.toFixed(1)}
          </p>
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
          <span className="font-medium">{formatCHF(metrics.monthlyUplift)}/Mt.</span>
        </div>
      </div>
    </Card>
  );
}
