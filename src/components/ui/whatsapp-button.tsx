import { useState } from 'react';
import { MessageCircle, X, Mic, Heart, ThumbsDown, Music, Store } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const WHATSAPP_NUMBER = '41765864070';

const quickMessages = [
  { 
    icon: Heart, 
    label: 'Das gefällt mir!', 
    message: 'Hey Radio 2Go! 👍 Das gefällt mir gerade richtig gut!' 
  },
  { 
    icon: ThumbsDown, 
    label: 'Nicht so mein Ding', 
    message: 'Hey Radio 2Go! Der Song gerade ist nicht so mein Geschmack 😅' 
  },
  { 
    icon: Music, 
    label: 'Songwunsch', 
    message: 'Hey Radio 2Go! 🎵 Ich hätte einen Songwunsch:' 
  },
  { 
    icon: Mic, 
    label: 'Audio senden', 
    message: 'Hey Radio 2Go! 🎤 Ich schick euch gleich ein Audio!' 
  },
  { 
    icon: Store, 
    label: '2Go Taler-Partner vorschlagen', 
    message: 'Hey Radio 2Go! 🏪 Ich möchte euch einen Taler-Partner vorschlagen:' 
  },
];

export function WhatsAppButton({ className }: { className?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  
  const openWhatsApp = (message: string) => {
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    setIsOpen(false);
  };
  
  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-[45]"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Quick message menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={cn(
              'fixed z-[50] right-3 flex flex-col gap-2 p-3 rounded-2xl',
              'bg-card border border-border shadow-xl',
              'bottom-[calc(15rem+env(safe-area-inset-bottom))]'
            )}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-semibold text-foreground">Schreib uns! 💬</span>
              <button
                onClick={() => setIsOpen(false)}
                className="h-6 w-6 rounded-full bg-muted flex items-center justify-center"
              >
                <X className="h-3 w-3 text-muted-foreground" />
              </button>
            </div>
            
            {quickMessages.map((item, index) => (
              <button
                key={index}
                onClick={() => openWhatsApp(item.message)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl',
                  'bg-muted/50 hover:bg-[#25D366]/10 active:scale-[0.98]',
                  'transition-all duration-200 text-left'
                )}
              >
                <div className="h-8 w-8 rounded-full bg-[#25D366]/20 flex items-center justify-center flex-shrink-0">
                  <item.icon className="h-4 w-4 text-[#25D366]" />
                </div>
                <span className="text-sm font-medium text-foreground">{item.label}</span>
              </button>
            ))}
            
            <button
              onClick={() => openWhatsApp('Hallo Radio 2Go! 👋')}
              className={cn(
                'flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl mt-1',
                'bg-[#25D366] hover:bg-[#20BD5A] active:scale-[0.98]',
                'transition-all duration-200'
              )}
            >
              <MessageCircle className="h-4 w-4 text-white" />
              <span className="text-sm font-semibold text-white">Eigene Nachricht</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main button with pulse effect */}
      <div
        className={cn(
          'fixed z-[50]',
          'bottom-[calc(12.5rem+env(safe-area-inset-bottom))] right-3',
          className
        )}
      >
        {/* Organic pulse ring - slower, softer animation */}
        {!isOpen && (
          <motion.span
            className="absolute inset-0 rounded-full bg-[#25D366]"
            animate={{
              scale: [1, 1.4, 1.4, 1],
              opacity: [0.4, 0.15, 0, 0],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeOut",
              times: [0, 0.4, 0.7, 1],
            }}
          />
        )}
        
        {/* Notification badge */}
        <span className="absolute -top-1 -right-1 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground shadow-md">
          1
        </span>
        
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'relative flex items-center justify-center',
            'h-10 w-10 rounded-full',
            'bg-[#25D366] hover:bg-[#20BD5A] active:scale-95',
            'shadow-lg shadow-[#25D366]/30 hover:shadow-xl hover:shadow-[#25D366]/40',
            'transition-all duration-300'
          )}
          aria-label="WhatsApp Studio kontaktieren"
        >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X className="h-4 w-4 text-white" />
            </motion.div>
          ) : (
            <motion.div
              key="message"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <MessageCircle className="h-4 w-4 text-white" fill="white" />
            </motion.div>
          )}
        </AnimatePresence>
        </button>
      </div>
    </>
  );
}
