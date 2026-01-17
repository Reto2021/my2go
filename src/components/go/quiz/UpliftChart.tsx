import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { 
  TrendingUp,
  Users,
  ShoppingBag
} from 'lucide-react';
import { formatCHF } from '@/lib/partner-quiz-config';
import { MehrbesucheResult } from '@/lib/partner-quiz-calculations';

interface Props {
  mehrbesuche: MehrbesucheResult;
}

export function UpliftChart({ mehrbesuche }: Props) {
  // Monthly projection over 12 months (cumulative effect)
  const monthlyData = useMemo(() => {
    const data = [];
    const { totalUpliftCHFPerMonth, assumptions } = mehrbesuche;
    
    // Ramp-up factor: starts slower, accelerates as enrollment builds
    const rampUp = [0.3, 0.5, 0.7, 0.85, 0.95, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0];
    
    let cumulativeConservative = 0;
    let cumulativeRealistic = 0;
    let cumulativeAmbitious = 0;
    
    for (let month = 1; month <= 12; month++) {
      const factor = rampUp[month - 1];
      
      const monthlyC = totalUpliftCHFPerMonth.conservative * factor;
      const monthlyR = totalUpliftCHFPerMonth.realistic * factor;
      const monthlyA = totalUpliftCHFPerMonth.ambitious * factor;
      
      cumulativeConservative += monthlyC;
      cumulativeRealistic += monthlyR;
      cumulativeAmbitious += monthlyA;
      
      data.push({
        month,
        monthLabel: `M${month}`,
        conservative: Math.round(cumulativeConservative),
        realistic: Math.round(cumulativeRealistic),
        ambitious: Math.round(cumulativeAmbitious),
        monthlyRealistic: Math.round(monthlyR)
      });
    }
    
    return data;
  }, [mehrbesuche]);

  const maxValue = Math.max(...monthlyData.map(d => d.ambitious));
  const year1Total = monthlyData[11]?.realistic || 0;

  return (
    <Card className="p-5 border-2 border-green-200 bg-gradient-to-br from-green-50/50 to-emerald-50/50">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-green-500 rounded-lg">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="font-bold">12-Monats Uplift-Projektion</h4>
            <p className="text-sm text-muted-foreground">Kumulierter Zusatzumsatz</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-green-600">+{formatCHF(year1Total)}</p>
          <p className="text-xs text-muted-foreground">nach 12 Monaten</p>
        </div>
      </div>

      {/* Chart */}
      <div className="relative h-48 mb-4">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-6 w-12 flex flex-col justify-between text-xs text-muted-foreground">
          <span>{formatCHF(maxValue)}</span>
          <span>{formatCHF(maxValue * 0.5)}</span>
          <span>0</span>
        </div>
        
        {/* Chart area */}
        <div className="ml-14 h-full relative">
          {/* Grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
            <div className="border-t border-dashed border-slate-200" />
            <div className="border-t border-dashed border-slate-200" />
            <div className="border-t border-slate-300" />
          </div>
          
          {/* Bars */}
          <div className="absolute inset-0 flex items-end justify-between gap-1 pb-6">
            {monthlyData.map((data, i) => {
              const conservativeHeight = maxValue > 0 ? (data.conservative / maxValue) * 100 : 0;
              const realisticHeight = maxValue > 0 ? (data.realistic / maxValue) * 100 : 0;
              const ambitiousHeight = maxValue > 0 ? (data.ambitious / maxValue) * 100 : 0;
              
              return (
                <div key={data.month} className="flex-1 relative group">
                  {/* Ambitious (background) */}
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 bg-green-200 rounded-t"
                    initial={{ height: 0 }}
                    animate={{ height: `${ambitiousHeight}%` }}
                    transition={{ duration: 0.5, delay: i * 0.05 }}
                  />
                  {/* Realistic */}
                  <motion.div
                    className="absolute bottom-0 left-[15%] right-[15%] bg-green-500 rounded-t z-10"
                    initial={{ height: 0 }}
                    animate={{ height: `${realisticHeight}%` }}
                    transition={{ duration: 0.5, delay: i * 0.05 + 0.1 }}
                  />
                  {/* Conservative */}
                  <motion.div
                    className="absolute bottom-0 left-[30%] right-[30%] bg-green-700 rounded-t z-20"
                    initial={{ height: 0 }}
                    animate={{ height: `${conservativeHeight}%` }}
                    transition={{ duration: 0.5, delay: i * 0.05 + 0.2 }}
                  />
                  
                  {/* Tooltip on hover */}
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-16 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs p-2 rounded-lg shadow-lg z-30 whitespace-nowrap transition-opacity">
                    <p className="font-medium">Monat {data.month}</p>
                    <p className="text-green-300">{formatCHF(data.realistic)} kumuliert</p>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* X-axis labels */}
          <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-muted-foreground">
            {monthlyData.filter((_, i) => i % 2 === 0 || i === 11).map(data => (
              <span key={data.month} className="text-center">{data.monthLabel}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 pt-4 border-t border-green-200">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-3 h-3 rounded bg-green-700" />
          <span className="text-muted-foreground">Konservativ</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="w-3 h-3 rounded bg-green-500" />
          <span className="text-muted-foreground">Realistisch</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="w-3 h-3 rounded bg-green-200" />
          <span className="text-muted-foreground">Ambitioniert</span>
        </div>
      </div>

      {/* Key Insights */}
      <div className="grid grid-cols-2 gap-3 mt-4">
        <motion.div 
          className="p-3 bg-white/70 rounded-lg border border-green-200"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.8 }}
        >
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium">Mehrbesuche</span>
          </div>
          <p className="text-lg font-bold text-green-700">
            +{Math.round(mehrbesuche.totalVisitsPerYear.realistic)} /Jahr
          </p>
        </motion.div>
        
        <motion.div 
          className="p-3 bg-white/70 rounded-lg border border-green-200"
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.9 }}
        >
          <div className="flex items-center gap-2 mb-1">
            <ShoppingBag className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium">Basket Uplift</span>
          </div>
          <p className="text-lg font-bold text-green-700">
            +{Math.round(mehrbesuche.basketUpliftPercent.realistic)}% /Besuch
          </p>
        </motion.div>
      </div>
    </Card>
  );
}
