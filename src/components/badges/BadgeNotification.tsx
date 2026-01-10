import { motion, AnimatePresence } from "framer-motion";
import { BadgeIcon } from "./BadgeIcon";
import { X } from "lucide-react";
import { Confetti } from "@/components/ui/confetti";
import { useEffect, useRef } from "react";

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

interface BadgeNotificationProps {
  badge: Badge | null;
  onClose: () => void;
}

// Play a cheerful achievement sound
function playBadgeSound() {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    const playNote = (frequency: number, startTime: number, duration: number) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = "sine";
      
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    };
    
    const now = audioContext.currentTime;
    // Triumphant fanfare
    playNote(523.25, now, 0.15); // C5
    playNote(659.25, now + 0.12, 0.15); // E5
    playNote(783.99, now + 0.24, 0.15); // G5
    playNote(1046.50, now + 0.36, 0.4); // C6 (held longer)
    
  } catch (error) {
    console.log("Could not play badge sound:", error);
  }
}

export function BadgeNotification({ badge, onClose }: BadgeNotificationProps) {
  const hasPlayedSound = useRef(false);

  useEffect(() => {
    if (badge && !hasPlayedSound.current) {
      hasPlayedSound.current = true;
      playBadgeSound();
      
      // Vibrate if supported
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100, 50, 200]);
      }
    }
    
    return () => {
      if (!badge) {
        hasPlayedSound.current = false;
      }
    };
  }, [badge]);

  if (!badge) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <Confetti isActive={true} />
        
        <motion.div
          initial={{ scale: 0.5, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.5, opacity: 0, y: 50 }}
          transition={{ type: "spring", damping: 15 }}
          className="relative bg-card border border-border rounded-2xl p-8 mx-4 max-w-sm text-center shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1 rounded-full hover:bg-muted transition-colors"
          >
            <X size={20} className="text-muted-foreground" />
          </button>

          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", damping: 10, delay: 0.2 }}
            className="flex justify-center mb-4"
          >
            <BadgeIcon icon={badge.icon} color={badge.color} size="lg" earned />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <p className="text-sm text-primary font-medium mb-1">
              🎉 Neues Badge erhalten!
            </p>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              {badge.name}
            </h2>
            <p className="text-muted-foreground">
              {badge.description}
            </p>
          </motion.div>

          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            onClick={onClose}
            className="mt-6 px-6 py-2 bg-primary text-primary-foreground rounded-full font-medium hover:bg-primary/90 transition-colors"
          >
            Super!
          </motion.button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
