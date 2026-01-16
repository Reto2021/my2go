import { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageCircleHeart } from 'lucide-react';
import { LiveChatSheet } from './LiveChatSheet';
import { hapticPress } from '@/lib/haptics';
import { cn } from '@/lib/utils';

interface LiveChatButtonProps {
  songTitle: string;
  songArtist?: string;
  className?: string;
}

export function LiveChatButton({ songTitle, songArtist, className }: LiveChatButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpen = () => {
    hapticPress();
    setIsOpen(true);
  };

  // Check if it's the compact variant (used in mini player)
  const isCompact = className?.includes('h-6');

  return (
    <>
      <motion.button
        onClick={handleOpen}
        data-chat-trigger
        className={cn(
          'relative flex items-center justify-center rounded-full',
          'bg-gradient-to-br from-pink-500/20 to-rose-500/20',
          'border border-pink-500/30 shadow-lg shadow-pink-500/10',
          'hover:from-pink-500/30 hover:to-rose-500/30 transition-all',
          isCompact ? 'h-6 w-6' : 'h-10 w-10',
          className
        )}
        whileTap={{ scale: 0.9 }}
        whileHover={{ scale: 1.05 }}
      >
        <MessageCircleHeart className={cn(
          'text-pink-400',
          isCompact ? 'h-3 w-3' : 'h-5 w-5'
        )} />
        
        {/* Pulse animation - only on larger variant */}
        {!isCompact && (
          <motion.div
            className="absolute inset-0 rounded-full bg-pink-500/20"
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.5, 0, 0.5]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 1
            }}
          />
        )}
      </motion.button>

      <LiveChatSheet
        open={isOpen}
        onOpenChange={setIsOpen}
        songTitle={songTitle}
        songArtist={songArtist}
      />
    </>
  );
}
