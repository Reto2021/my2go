import { motion } from 'framer-motion';
import logoRadio2go from '@/assets/logo-radio2go.png';

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-white"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <motion.img
        src={logoRadio2go}
        alt="Radio 2Go"
        className="h-24 sm:h-32 w-auto"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ 
          duration: 0.8, 
          ease: [0.25, 0.46, 0.45, 0.94] // Custom easing for organic feel
        }}
        onAnimationComplete={() => {
          // Wait a moment after animation completes before hiding
          setTimeout(onComplete, 400);
        }}
      />
    </motion.div>
  );
}
