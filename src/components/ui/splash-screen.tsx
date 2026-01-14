import { motion } from 'framer-motion';
import logo2goWhite from '@/assets/logo-2go-white.png';

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
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <motion.img
        src={logo2goWhite}
        alt="2Go"
        className="w-40 h-40 sm:w-48 sm:h-48 object-contain"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1.2 }}
        transition={{ 
          duration: 1.7, 
          ease: [0.25, 0.1, 0.25, 1]
        }}
        onAnimationComplete={() => {
          setTimeout(onComplete, 300);
        }}
      />
    </motion.div>
  );
}
