import { useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Download, Copy, Check, X, Trophy, Award, Flame, Coins, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';

interface ShareCardData {
  type: 'badge' | 'leaderboard' | 'streak' | 'taler' | 'redemption';
  title: string;
  subtitle?: string;
  value?: string | number;
  icon?: string; // Emoji or icon name
  color?: string;
  userName?: string;
}

interface ShareCardGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  data: ShareCardData;
}

const gradients: Record<string, string> = {
  badge: 'from-purple-600 via-purple-500 to-pink-500',
  leaderboard: 'from-amber-500 via-orange-500 to-red-500',
  streak: 'from-orange-500 via-red-500 to-pink-500',
  taler: 'from-emerald-500 via-teal-500 to-cyan-500',
  redemption: 'from-purple-500 via-pink-500 to-rose-500',
};

const icons: Record<string, React.ReactNode> = {
  badge: <Award className="h-12 w-12" />,
  leaderboard: <Trophy className="h-12 w-12" />,
  streak: <Flame className="h-12 w-12" />,
  taler: <Coins className="h-12 w-12" />,
  redemption: <Gift className="h-12 w-12" />,
};

export function ShareCardGenerator({ isOpen, onClose, data }: ShareCardGeneratorProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateImage = useCallback(async (): Promise<Blob | null> => {
    if (!cardRef.current) return null;
    
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
        logging: false,
      });
      
      return new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob), 'image/png', 1.0);
      });
    } catch (error) {
      console.error('Error generating image:', error);
      return null;
    }
  }, []);

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      const blob = await generateImage();
      if (!blob) {
        toast.error('Bild konnte nicht erstellt werden');
        return;
      }
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `my2go-${data.type}-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast.success('Bild heruntergeladen!');
    } catch (error) {
      toast.error('Download fehlgeschlagen');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyImage = async () => {
    setIsGenerating(true);
    try {
      const blob = await generateImage();
      if (!blob) {
        toast.error('Bild konnte nicht erstellt werden');
        return;
      }
      
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      
      setCopied(true);
      toast.success('Bild in Zwischenablage kopiert!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      // Fallback: copy as data URL
      toast.error('Kopieren nicht unterstützt');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleNativeShare = async () => {
    if (!navigator.share || !navigator.canShare) {
      handleDownload();
      return;
    }
    
    setIsGenerating(true);
    try {
      const blob = await generateImage();
      if (!blob) {
        toast.error('Bild konnte nicht erstellt werden');
        return;
      }
      
      const file = new File([blob], `my2go-${data.type}.png`, { type: 'image/png' });
      
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'My 2Go Achievement',
          text: `${data.title} - ${data.subtitle || ''}`,
          files: [file],
        });
      } else {
        handleDownload();
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        handleDownload();
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const gradient = gradients[data.type] || gradients.badge;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-card rounded-2xl p-5 max-w-sm w-full space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Teilen</h3>
              <button onClick={onClose} className="p-2 hover:bg-muted rounded-full">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Share Card Preview */}
            <div 
              ref={cardRef}
              className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-6 text-white shadow-2xl`}
              style={{ aspectRatio: '1/1' }}
            >
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-4 left-4 w-32 h-32 bg-white/20 rounded-full blur-3xl" />
                <div className="absolute bottom-4 right-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
              </div>
              
              {/* Content */}
              <div className="relative z-10 h-full flex flex-col items-center justify-center text-center">
                {/* Icon/Emoji */}
                <div className="mb-4 p-4 rounded-full bg-white/20 backdrop-blur-sm">
                  {data.icon ? (
                    <span className="text-4xl">{data.icon}</span>
                  ) : (
                    icons[data.type]
                  )}
                </div>
                
                {/* Value (if present) */}
                {data.value && (
                  <motion.p 
                    className="text-5xl font-black mb-2"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.2 }}
                  >
                    {data.value}
                  </motion.p>
                )}
                
                {/* Title */}
                <h4 className="text-xl font-bold mb-1">{data.title}</h4>
                
                {/* Subtitle */}
                {data.subtitle && (
                  <p className="text-sm opacity-80">{data.subtitle}</p>
                )}
                
                {/* User Name */}
                {data.userName && (
                  <p className="text-sm opacity-70 mt-2">von {data.userName}</p>
                )}
                
                {/* Branding */}
                <div className="absolute bottom-4 left-0 right-0 text-center">
                  <p className="text-xs font-semibold opacity-60">my2go.ch</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={handleNativeShare}
                disabled={isGenerating}
                className="flex-1 gap-2"
              >
                <Share2 className="h-4 w-4" />
                Teilen
              </Button>
              
              <Button
                variant="outline"
                onClick={handleDownload}
                disabled={isGenerating}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                onClick={handleCopyImage}
                disabled={isGenerating}
                className="gap-2"
              >
                {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Teile deine Erfolge auf Instagram, WhatsApp & mehr!
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Hook for easy usage
export function useShareCard() {
  const [isOpen, setIsOpen] = useState(false);
  const [cardData, setCardData] = useState<ShareCardData | null>(null);

  const openShareCard = useCallback((data: ShareCardData) => {
    setCardData(data);
    setIsOpen(true);
  }, []);

  const closeShareCard = useCallback(() => {
    setIsOpen(false);
  }, []);

  return {
    isOpen,
    cardData,
    openShareCard,
    closeShareCard,
  };
}
