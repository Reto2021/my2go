import { useState, useEffect } from 'react';
import { Slider } from '@/components/ui/slider';
import { Volume2, Mic2, Music, MessageCircle, PartyPopper } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

// Preset configurations for different use cases
const AUDIO_PRESETS = {
  gespraech: {
    name: 'Gespräch',
    icon: MessageCircle,
    radioVolume: 0.15,
    voiceVolume: 1.0,
    description: 'Stimmen im Fokus',
    emoji: '💬'
  },
  party: {
    name: 'Party',
    icon: PartyPopper,
    radioVolume: 0.4,
    voiceVolume: 1.0,
    description: 'Ausgewogen',
    emoji: '🎉'
  },
  karaoke: {
    name: 'Karaoke',
    icon: Music,
    radioVolume: 0.7,
    voiceVolume: 0.5,
    description: 'Musik betont',
    emoji: '🎤'
  }
} as const;

type PresetKey = keyof typeof AUDIO_PRESETS;

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
  const [balance, setBalance] = useState(0);
  const [activePreset, setActivePreset] = useState<PresetKey | null>('party');

  // Calculate balance from current volumes on mount
  useEffect(() => {
    const total = radioVolume + voiceVolume;
    if (total === 0) {
      setBalance(0);
    } else {
      const newBalance = (radioVolume - voiceVolume) / Math.max(radioVolume, voiceVolume, 1);
      setBalance(newBalance);
    }
  }, []);

  // Check if current settings match a preset
  useEffect(() => {
    const matchingPreset = (Object.entries(AUDIO_PRESETS) as [PresetKey, typeof AUDIO_PRESETS[PresetKey]][]).find(
      ([_, preset]) => 
        Math.abs(preset.radioVolume - radioVolume) < 0.05 && 
        Math.abs(preset.voiceVolume - voiceVolume) < 0.05
    );
    setActivePreset(matchingPreset ? matchingPreset[0] : null);
  }, [radioVolume, voiceVolume]);

  const handleBalanceChange = (values: number[]) => {
    const newBalance = values[0];
    setBalance(newBalance);
    setActivePreset(null); // Clear preset when manually adjusting
    
    if (newBalance <= 0) {
      const radioVol = 0.4 + (newBalance * 0.3);
      const voiceVol = 1.0;
      onRadioVolumeChange(Math.max(0.05, radioVol));
      onVoiceVolumeChange(voiceVol);
    } else {
      const radioVol = 0.4 + (newBalance * 0.6);
      const voiceVol = 1.0 - (newBalance * 0.7);
      onRadioVolumeChange(radioVol);
      onVoiceVolumeChange(Math.max(0.1, voiceVol));
    }
  };

  const handlePresetSelect = (presetKey: PresetKey) => {
    const preset = AUDIO_PRESETS[presetKey];
    setActivePreset(presetKey);
    onRadioVolumeChange(preset.radioVolume);
    onVoiceVolumeChange(preset.voiceVolume);
    
    // Update balance slider to match
    const newBalance = (preset.radioVolume - preset.voiceVolume) / Math.max(preset.radioVolume, preset.voiceVolume, 1);
    setBalance(newBalance);
  };

  const getBalanceLabel = () => {
    if (activePreset) {
      return AUDIO_PRESETS[activePreset].description;
    }
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
        "flex flex-col gap-3 px-4 py-3 rounded-2xl bg-black/30 backdrop-blur-sm border border-white/10",
        className
      )}
    >
      {/* Preset Buttons */}
      <div className="flex items-center justify-center gap-2">
        {(Object.entries(AUDIO_PRESETS) as [PresetKey, typeof AUDIO_PRESETS[PresetKey]][]).map(([key, preset]) => {
          const Icon = preset.icon;
          const isActive = activePreset === key;
          
          return (
            <motion.button
              key={key}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handlePresetSelect(key)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                isActive 
                  ? "bg-accent text-accent-foreground shadow-lg shadow-accent/30" 
                  : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
              )}
            >
              <span className="text-sm">{preset.emoji}</span>
              <span>{preset.name}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Slider Row */}
      <div className="flex items-center gap-3">
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
      </div>
    </motion.div>
  );
}
