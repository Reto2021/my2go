import { useEffect, useState } from 'react';
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

interface ConfettiProps {
  isActive: boolean;
  duration?: number;
  particleCount?: number;
}

export function Confetti({ isActive, duration = 3000, particleCount = 50 }: ConfettiProps) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([]);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isActive) {
      setPieces(generateConfetti(particleCount));
      setShow(true);
      
      const timer = setTimeout(() => {
        setShow(false);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isActive, duration, particleCount]);

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
      )}
    </AnimatePresence>
  );
}

// Hook to trigger confetti
export function useConfetti() {
  const [isActive, setIsActive] = useState(false);

  const trigger = () => {
    setIsActive(true);
    // Reset after animation
    setTimeout(() => setIsActive(false), 100);
  };

  return { isActive, trigger };
}
