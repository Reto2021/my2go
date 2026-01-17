import { motion } from 'framer-motion';
import { TrendingDown, Target, Rocket } from 'lucide-react';
import { cn } from '@/lib/utils';

export type Scenario = 'conservative' | 'realistic' | 'ambitious';

interface Props {
  value: Scenario;
  onChange: (scenario: Scenario) => void;
  className?: string;
}

const SCENARIOS: { key: Scenario; label: string; sublabel: string; icon: React.ReactNode; color: string }[] = [
  { 
    key: 'conservative', 
    label: 'Konservativ', 
    sublabel: 'Vorsichtige Annahmen',
    icon: <TrendingDown className="w-4 h-4" />,
    color: 'bg-amber-500'
  },
  { 
    key: 'realistic', 
    label: 'Realistisch', 
    sublabel: 'Branchendurchschnitt',
    icon: <Target className="w-4 h-4" />,
    color: 'bg-green-500'
  },
  { 
    key: 'ambitious', 
    label: 'Ambitioniert', 
    sublabel: 'Optimale Umsetzung',
    icon: <Rocket className="w-4 h-4" />,
    color: 'bg-blue-500'
  }
];

export function ScenarioSlider({ value, onChange, className }: Props) {
  const currentIndex = SCENARIOS.findIndex(s => s.key === value);
  
  return (
    <div className={cn("w-full", className)}>
      {/* Label */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-muted-foreground">Szenario wählen</span>
        <span className="text-xs text-muted-foreground">
          {SCENARIOS[currentIndex]?.sublabel}
        </span>
      </div>
      
      {/* Slider Track */}
      <div className="relative">
        {/* Background track */}
        <div className="h-12 bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-between p-1 relative overflow-hidden">
          {/* Animated highlight */}
          <motion.div
            className={cn(
              "absolute h-10 rounded-lg shadow-sm z-0",
              SCENARIOS[currentIndex]?.color
            )}
            style={{ width: 'calc(33.333% - 4px)' }}
            animate={{ x: `calc(${currentIndex * 100}% + ${currentIndex * 4}px)` }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          />
          
          {/* Options */}
          {SCENARIOS.map((scenario, idx) => (
            <button
              key={scenario.key}
              onClick={() => onChange(scenario.key)}
              className={cn(
                "flex-1 h-10 flex items-center justify-center gap-1.5 rounded-lg z-10 transition-colors relative",
                value === scenario.key 
                  ? "text-white font-semibold" 
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              {scenario.icon}
              <span className="text-sm hidden sm:inline">{scenario.label}</span>
              <span className="text-sm sm:hidden">
                {scenario.key === 'conservative' ? 'Kons.' : scenario.key === 'realistic' ? 'Real.' : 'Amb.'}
              </span>
            </button>
          ))}
        </div>
        
        {/* Connecting dots */}
        <div className="absolute inset-x-0 -bottom-3 flex justify-around px-16">
          {SCENARIOS.map((scenario, idx) => (
            <motion.div
              key={scenario.key}
              className={cn(
                "w-2 h-2 rounded-full transition-colors",
                idx <= currentIndex ? SCENARIOS[currentIndex]?.color : "bg-slate-300"
              )}
              animate={{ scale: idx === currentIndex ? 1.2 : 1 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
