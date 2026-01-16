import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Gift, X, Coins } from 'lucide-react';
import { VIRTUAL_GIFTS, VirtualGift, GIFT_TIER_COLORS, SentGift, useGiftStore } from '@/lib/gifts-store';
import { Button } from '@/components/ui/button';
import { TalerIcon } from '@/components/icons/TalerIcon';
import { toast } from 'sonner';

interface GiftPanelProps {
  isOpen: boolean;
  onClose: () => void;
  recipientId: string;
  recipientName: string;
  senderId: string;
  senderName: string;
  currentBalance: number;
  onGiftSent?: (gift: VirtualGift) => void;
}

export const GiftPanel = ({
  isOpen,
  onClose,
  recipientId,
  recipientName,
  senderId,
  senderName,
  currentBalance,
  onGiftSent
}: GiftPanelProps) => {
  const [selectedTier, setSelectedTier] = useState<string>('common');
  const { sendGift, isSending, error } = useGiftStore();
  
  const filteredGifts = VIRTUAL_GIFTS.filter(g => g.tier === selectedTier);
  
  const handleSendGift = async (gift: VirtualGift) => {
    if (currentBalance < gift.talerCost) {
      toast.error('Nicht genügend Taler!');
      return;
    }
    
    const success = await sendGift(
      gift.id,
      senderId,
      senderName,
      recipientId,
      recipientName
    );
    
    if (success) {
      toast.success(`${gift.emoji} ${gift.name} an ${recipientName} gesendet!`);
      onGiftSent?.(gift);
      onClose();
    }
  };
  
  const tiers = [
    { id: 'common', name: 'Normal', emoji: '🎁' },
    { id: 'rare', name: 'Selten', emoji: '💙' },
    { id: 'epic', name: 'Episch', emoji: '💜' },
    { id: 'legendary', name: 'Legendär', emoji: '🌟' }
  ];
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />
          
          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-background rounded-t-2xl z-50 max-h-[70vh] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-primary" />
                <span className="font-semibold">Geschenk senden</span>
                <span className="text-sm text-muted-foreground">
                  an {recipientName}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-sm">
                  <TalerIcon className="h-4 w-4" />
                  <span className="font-medium">{currentBalance}</span>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
            
            {/* Tier tabs */}
            <div className="flex gap-1 p-2 bg-muted/30 overflow-x-auto">
              {tiers.map((tier) => (
                <motion.button
                  key={tier.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedTier(tier.id)}
                  className={cn(
                    "flex items-center gap-1 px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors",
                    selectedTier === tier.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-background hover:bg-muted"
                  )}
                >
                  <span>{tier.emoji}</span>
                  <span>{tier.name}</span>
                </motion.button>
              ))}
            </div>
            
            {/* Gifts grid */}
            <div className="p-4 overflow-y-auto max-h-[40vh]">
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {filteredGifts.map((gift) => {
                  const canAfford = currentBalance >= gift.talerCost;
                  
                  return (
                    <motion.button
                      key={gift.id}
                      whileHover={{ scale: canAfford ? 1.05 : 1 }}
                      whileTap={{ scale: canAfford ? 0.95 : 1 }}
                      onClick={() => canAfford && handleSendGift(gift)}
                      disabled={!canAfford || isSending}
                      className={cn(
                        "flex flex-col items-center gap-2 p-3 rounded-xl transition-all",
                        "bg-gradient-to-br",
                        GIFT_TIER_COLORS[gift.tier],
                        "bg-opacity-10",
                        canAfford 
                          ? "opacity-100 cursor-pointer hover:shadow-lg" 
                          : "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <motion.span 
                        className="text-4xl"
                        animate={canAfford ? { 
                          scale: [1, 1.1, 1],
                        } : {}}
                        transition={{ 
                          repeat: Infinity, 
                          duration: 2,
                          repeatType: 'reverse'
                        }}
                      >
                        {gift.emoji}
                      </motion.span>
                      <span className="text-xs font-medium text-center">
                        {gift.name}
                      </span>
                      <div className="flex items-center gap-1 text-xs">
                        <TalerIcon className="h-3 w-3" />
                        <span className="font-bold">{gift.talerCost}</span>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>
            
            {/* Error message */}
            {error && (
              <div className="px-4 pb-4">
                <div className="p-2 bg-destructive/10 text-destructive text-sm rounded-lg text-center">
                  {error}
                </div>
              </div>
            )}
            
            {/* Footer hint */}
            <div className="p-4 border-t bg-muted/30 text-center text-xs text-muted-foreground">
              Geschenke zeigen deine Wertschätzung und unterstützen die Hosts!
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// Floating gift animation component
interface FloatingGiftProps {
  gift: SentGift;
  giftInfo: VirtualGift;
}

export const FloatingGift = ({ gift, giftInfo }: FloatingGiftProps) => {
  const animations = {
    float: {
      initial: { opacity: 0, y: 50, scale: 0.5 },
      animate: { 
        opacity: [0, 1, 1, 0], 
        y: [-50, -150, -200, -250],
        scale: [0.5, 1.5, 1.2, 0.8]
      },
      transition: { duration: 3, ease: 'easeOut' as const }
    },
    burst: {
      initial: { opacity: 0, scale: 0 },
      animate: { 
        opacity: [0, 1, 1, 0], 
        scale: [0, 2, 1.5, 0],
        rotate: [0, 15, -15, 0]
      },
      transition: { duration: 2, ease: 'easeOut' as const }
    },
    rain: {
      initial: { opacity: 0, y: -100 },
      animate: { 
        opacity: [0, 1, 1, 0], 
        y: [-100, 0, 100, 200],
        x: [0, -20, 20, 0]
      },
      transition: { duration: 3, ease: 'easeIn' as const }
    },
    spin: {
      initial: { opacity: 0, scale: 0, rotate: 0 },
      animate: { 
        opacity: [0, 1, 1, 0], 
        scale: [0, 1.5, 1, 0.5],
        rotate: [0, 360, 720, 1080]
      },
      transition: { duration: 3, ease: 'easeOut' as const }
    }
  };
  
  const animation = animations[giftInfo.animation];
  const randomX = 10 + Math.random() * 80; // 10-90%
  
  return (
    <motion.div
      initial={animation.initial}
      animate={animation.animate}
      transition={animation.transition}
      className="fixed z-[100] pointer-events-none flex flex-col items-center"
      style={{ left: `${randomX}%`, bottom: '20%' }}
    >
      <span className="text-6xl drop-shadow-lg">{giftInfo.emoji}</span>
      <div className="mt-1 px-2 py-0.5 bg-black/60 text-white text-xs rounded-full whitespace-nowrap">
        {gift.senderName}
      </div>
    </motion.div>
  );
};

// Gift button for quick access
interface GiftButtonProps {
  onClick: () => void;
  hasGifts?: boolean;
}

export const GiftButton = ({ onClick, hasGifts = false }: GiftButtonProps) => {
  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className={cn(
        "relative p-3 rounded-full transition-colors",
        "bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg",
        "hover:from-pink-600 hover:to-purple-600"
      )}
    >
      <Gift className="h-5 w-5" />
      {hasGifts && (
        <motion.span
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 1 }}
          className="absolute -top-1 -right-1 h-3 w-3 bg-yellow-400 rounded-full"
        />
      )}
    </motion.button>
  );
};

export default GiftPanel;
