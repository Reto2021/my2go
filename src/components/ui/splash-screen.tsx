import { motion } from 'framer-motion';
import logo2go from '@/assets/logo-2go.png';

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
        src={logo2go}
        alt="2Go"
        className="w-32 h-32 sm:w-40 sm:h-40 object-contain"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1.2 }}
        transition={{ 
          duration: 2.5, 
          ease: [0.25, 0.1, 0.25, 1]
        }}
        onAnimationComplete={() => {
          setTimeout(onComplete, 500);
        }}
      />
    </motion.div>
  );
}
