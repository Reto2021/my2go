import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfettiPiece {
  id: number;
  x: number;
  delay: number;
  rotation: number;
  color: string;
  size: number;
  type: 'circle' | 'square' | 'star';
}

const COLORS = [
  'hsl(44 98% 49%)',   // accent (yellow)
  'hsl(200 50% 66%)',  // primary (sky blue)
  'hsl(160 84% 39%)',  // success (green)
  'hsl(197 96% 18%)',  // secondary (deep teal)
  'hsl(0 84% 60%)',    // red
  'hsl(280 80% 60%)',  // purple
];

const generateConfetti = (count: number): ConfettiPiece[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 0.5,
    rotation: Math.random() * 360,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    size: 8 + Math.random() * 8,
    type: ['circle', 'square', 'star'][Math.floor(Math.random() * 3)] as ConfettiPiece['type'],
  }));
};

// Play success sound using Web Audio API
const playSuccessSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Create a pleasant "ding" sound
    const playTone = (frequency: number, startTime: number, duration: number, volume: number) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    };

    const now = audioContext.currentTime;
    
    // Play a cheerful chord progression
    playTone(523.25, now, 0.3, 0.15);        // C5
    playTone(659.25, now + 0.1, 0.3, 0.12);  // E5
    playTone(783.99, now + 0.2, 0.4, 0.15);  // G5
    playTone(1046.50, now + 0.3, 0.5, 0.1);  // C6

  } catch (error) {
    console.log('Audio not supported');
  }
};

interface ConfettiProps {
  isActive: boolean;
  duration?: number;
  particleCount?: number;
  showMessage?: boolean;
  message?: string;
  subMessage?: string;
  playSound?: boolean;
}

export function Confetti({ 
  isActive, 
  duration = 3000, 
  particleCount = 50,
  showMessage = false,
  message = '🎉 Erfolgreich eingelöst!',
  subMessage = 'Genieße deinen Vorteil!',
  playSound = true,
}: ConfettiProps) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);
  const [show, setShow] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  useEffect(() => {
    if (isActive) {
      setPieces(generateConfetti(particleCount));
      setShow(true);
      setShowSuccessMessage(showMessage);
      
      // Play sound
      if (playSound) {
        playSuccessSound();
      }
      
      const timer = setTimeout(() => {
        setShow(false);
      }, duration);

      const messageTimer = setTimeout(() => {
        setShowSuccessMessage(false);
      }, duration - 500);

      return () => {
        clearTimeout(timer);
        clearTimeout(messageTimer);
      };
    }
  }, [isActive, duration, particleCount, showMessage, playSound]);

  const renderShape = (piece: ConfettiPiece) => {
    switch (piece.type) {
      case 'circle':
        return (
          <div
            className="rounded-full"
            style={{
              width: piece.size,
              height: piece.size,
              backgroundColor: piece.color,
            }}
          />
        );
      case 'square':
        return (
          <div
            className="rounded-sm"
            style={{
              width: piece.size,
              height: piece.size,
              backgroundColor: piece.color,
            }}
          />
        );
      case 'star':
        return (
          <svg
            width={piece.size}
            height={piece.size}
            viewBox="0 0 24 24"
            fill={piece.color}
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        );
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Confetti particles */}
          <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
            {pieces.map((piece) => (
              <motion.div
                key={piece.id}
                className="absolute"
                style={{
                  left: `${piece.x}%`,
                  top: -20,
                }}
                initial={{
                  y: -20,
                  rotate: 0,
                  opacity: 1,
                  scale: 0,
                }}
                animate={{
                  y: window.innerHeight + 50,
                  rotate: piece.rotation + 720,
                  opacity: [1, 1, 1, 0],
                  scale: [0, 1, 1, 0.5],
                  x: [0, Math.sin(piece.id) * 50, Math.cos(piece.id) * -30, Math.sin(piece.id) * 40],
                }}
                exit={{
                  opacity: 0,
                }}
                transition={{
                  duration: 2.5 + Math.random() * 1.5,
                  delay: piece.delay,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
              >
                {renderShape(piece)}
              </motion.div>
            ))}
          </div>

          {/* Success Message Overlay */}
          {showSuccessMessage && (
            <motion.div
              className="fixed inset-0 flex items-center justify-center z-[101] pointer-events-none px-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-card/95 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-success/30 max-w-sm w-full text-center"
                initial={{ scale: 0.5, y: 50, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.8, y: -20, opacity: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 20,
                }}
              >
                {/* Animated checkmark */}
                <motion.div
                  className="w-20 h-20 mx-auto mb-4 rounded-full bg-success/15 flex items-center justify-center"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    type: 'spring',
                    stiffness: 200,
                    damping: 15,
                    delay: 0.2,
                  }}
                >
                  <motion.svg
                    className="w-10 h-10 text-success"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                  >
                    <motion.path
                      d="M20 6L9 17l-5-5"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.5, delay: 0.4 }}
                    />
                  </motion.svg>
                </motion.div>

                {/* Main message */}
                <motion.h2
                  className="text-2xl font-bold text-foreground mb-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  {message}
                </motion.h2>

                {/* Sub message */}
                <motion.p
                  className="text-muted-foreground"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  {subMessage}
                </motion.p>

                {/* Sparkle decorations */}
                <motion.div
                  className="absolute -top-2 -right-2 text-2xl"
                  initial={{ scale: 0, rotate: -45 }}
                  animate={{ scale: [0, 1.2, 1], rotate: 0 }}
                  transition={{ delay: 0.7, duration: 0.4 }}
                >
                  ✨
                </motion.div>
                <motion.div
                  className="absolute -bottom-2 -left-2 text-2xl"
                  initial={{ scale: 0, rotate: 45 }}
                  animate={{ scale: [0, 1.2, 1], rotate: 0 }}
                  transition={{ delay: 0.8, duration: 0.4 }}
                >
                  🎊
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  );
}

// Hook to trigger confetti
export function useConfetti() {
  const [isActive, setIsActive] = useState(false);

  const trigger = useCallback(() => {
    setIsActive(true);
    // Reset after animation
    setTimeout(() => setIsActive(false), 100);
  }, []);

  return { isActive, trigger };
}
