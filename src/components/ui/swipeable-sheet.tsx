import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { ReactNode, useCallback } from 'react';

interface SwipeableSheetContentProps {
  children: ReactNode;
  onClose: () => void;
  className?: string;
}

export function SwipeableSheetContent({ 
  children, 
  onClose,
  className = ''
}: SwipeableSheetContentProps) {
  const y = useMotionValue(0);
  const opacity = useTransform(y, [0, 200], [1, 0.5]);
  
  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      // Close if dragged down more than 100px or with enough velocity
      if (info.offset.y > 100 || info.velocity.y > 500) {
        onClose();
      }
    },
    [onClose]
  );

  return (
    <motion.div
      style={{ y, opacity }}
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={{ top: 0, bottom: 0.6 }}
      onDragEnd={handleDragEnd}
      className={`h-full touch-none ${className}`}
    >
      {children}
    </motion.div>
  );
}

// Swipe handle indicator component
export function SwipeHandle({ className = '' }: { className?: string }) {
  return (
    <div className={`flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing ${className}`}>
      <div className="w-12 h-1.5 rounded-full bg-white/40 hover:bg-white/60 transition-colors" />
    </div>
  );
}
