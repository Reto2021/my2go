import { useState, useEffect, useRef } from 'react';
import { Slider } from '@/components/ui/slider';
import { Volume2, Mic2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface AudioBalanceSliderProps {
  radioVolume: number;
  voiceVolume: number;
  onRadioVolumeChange: (volume: number) => void;
  onVoiceVolumeChange: (volume: number) => void;
  className?: string;
}

export function AudioBalanceSlider({
  radioVolume,
  voiceVolume,
  onRadioVolumeChange,
  onVoiceVolumeChange,
  className,
}: AudioBalanceSliderProps) {
  // Balance: -1 = all voice, 0 = equal, 1 = all radio
  // We use a single slider for intuitive balance control
  const [balance, setBalance] = useState(0);

  // Calculate balance from current volumes
  useEffect(() => {
    const total = radioVolume + voiceVolume;
    if (total === 0) {
      setBalance(0);
    } else {
      // Convert volumes to balance: -1 to 1
      const newBalance = (radioVolume - voiceVolume) / Math.max(radioVolume, voiceVolume, 1);
      setBalance(newBalance);
    }
  }, []);

  const handleBalanceChange = (values: number[]) => {
    const newBalance = values[0];
    setBalance(newBalance);
    
    // Convert balance to volumes
    // At balance 0: radio = 0.4, voice = 1.0 (default for dance party)
    // At balance -1: radio = 0.1, voice = 1.0 (voices louder)
    // At balance 1: radio = 1.0, voice = 0.3 (radio louder)
    
    if (newBalance <= 0) {
      // Favor voices: radio goes from 0.4 to 0.1 as balance goes from 0 to -1
      const radioVol = 0.4 + (newBalance * 0.3); // 0.4 at 0, 0.1 at -1
      const voiceVol = 1.0;
      onRadioVolumeChange(Math.max(0.05, radioVol));
      onVoiceVolumeChange(voiceVol);
    } else {
      // Favor radio: voice goes from 1.0 to 0.3 as balance goes from 0 to 1
      const radioVol = 0.4 + (newBalance * 0.6); // 0.4 at 0, 1.0 at 1
      const voiceVol = 1.0 - (newBalance * 0.7); // 1.0 at 0, 0.3 at 1
      onRadioVolumeChange(radioVol);
      onVoiceVolumeChange(Math.max(0.1, voiceVol));
    }
  };

  const getBalanceLabel = () => {
    if (balance < -0.5) return 'Stimmen laut';
    if (balance < -0.2) return 'Stimmen betont';
    if (balance > 0.5) return 'Musik laut';
    if (balance > 0.2) return 'Musik betont';
    return 'Ausgewogen';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex items-center gap-3 px-4 py-3 rounded-2xl bg-black/30 backdrop-blur-sm border border-white/10",
        className
      )}
    >
      {/* Voice icon */}
      <div className={cn(
        "flex items-center justify-center h-8 w-8 rounded-full transition-colors",
        balance < 0 ? "bg-accent/30 text-accent" : "bg-white/10 text-white/50"
      )}>
        <Mic2 className="h-4 w-4" />
      </div>
      
      {/* Slider */}
      <div className="flex-1 flex flex-col gap-1">
        <Slider
          value={[balance]}
          min={-1}
          max={1}
          step={0.1}
          onValueChange={handleBalanceChange}
          className="w-full"
        />
        <span className="text-[10px] text-white/50 text-center">
          {getBalanceLabel()}
        </span>
      </div>
      
      {/* Radio icon */}
      <div className={cn(
        "flex items-center justify-center h-8 w-8 rounded-full transition-colors",
        balance > 0 ? "bg-pink-500/30 text-pink-400" : "bg-white/10 text-white/50"
      )}>
        <Volume2 className="h-4 w-4" />
      </div>
    </motion.div>
  );
}
