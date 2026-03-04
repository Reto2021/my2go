import React, { useRef, useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { Share2, Download, X, Clock, Music2, Headphones } from 'lucide-react';
import html2canvas from 'html2canvas';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { TalerIcon } from '@/components/icons/TalerIcon';
import { useToast } from '@/hooks/use-toast';
import logo2go from '@/assets/logo-2go-header.png';

interface SessionSummaryData {
  duration: number;
  reward: number;
  tier?: string;
  songCount?: number;
}

interface SessionSummarySheetProps {
  isOpen: boolean;
  onClose: () => void;
  sessionData: SessionSummaryData | null;
}

export function SessionSummarySheet({ isOpen, onClose, sessionData }: SessionSummarySheetProps) {
  const summaryRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [isSharing, setIsSharing] = useState(false);

  const formatDuration = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getDurationText = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours} Stunde${hours > 1 ? 'n' : ''} ${minutes} Minuten`;
    }
    return `${minutes} Minute${minutes !== 1 ? 'n' : ''}`;
  };

  const captureScreenshot = useCallback(async (): Promise<Blob | null> => {
    if (!summaryRef.current) return null;
    
    try {
      const canvas = await html2canvas(summaryRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
        logging: false,
      });
      
      return new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob), 'image/png', 1.0);
      });
    } catch (error) {
      console.error('Error capturing screenshot:', error);
      return null;
    }
  }, []);

  const handleShare = useCallback(async () => {
    if (!sessionData) return;
    
    setIsSharing(true);
    
    try {
      const blob = await captureScreenshot();
      
      if (!blob) {
        toast({
          title: 'Fehler',
          description: 'Screenshot konnte nicht erstellt werden.',
          variant: 'destructive',
        });
        return;
      }

      const file = new File([blob], '2go-session.png', { type: 'image/png' });
      
      // Try native share API first
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: 'Meine 2Go Session',
          text: `Ich habe ${getDurationText(sessionData.duration)} 2Go gehört und ${sessionData.reward} Taler verdient! 🎧`,
          files: [file],
        });
        toast({
          title: '✅ Geteilt!',
          description: 'Deine Session wurde erfolgreich geteilt.',
        });
      } else {
        // Fallback: Download the image
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = '2go-session.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast({
          title: '📥 Heruntergeladen!',
          description: 'Screenshot wurde heruntergeladen.',
        });
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Share error:', error);
        toast({
          title: 'Fehler beim Teilen',
          description: 'Bitte versuche es erneut.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsSharing(false);
    }
  }, [sessionData, captureScreenshot, toast]);

  if (!sessionData) return null;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="h-auto max-h-[90vh] rounded-t-3xl bg-secondary border-white/10">
        <SheetHeader className="sr-only">
          <SheetTitle>Session Zusammenfassung</SheetTitle>
        </SheetHeader>
        
        <div className="py-2">
          {/* Screenshot-able area */}
          <div 
            ref={summaryRef}
            className="bg-gradient-to-br from-secondary via-secondary/95 to-primary/30 rounded-2xl p-6 mb-4"
          >
            {/* Logo Header */}
            <div className="flex items-center justify-center gap-2 mb-6">
              <img src={logo2go} alt="2Go" className="h-8 object-contain" />
            </div>

            {/* Main Stats */}
            <div className="text-center mb-6">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="mb-4"
              >
                <Headphones className="h-16 w-16 mx-auto text-accent mb-3" />
                <h2 className="text-2xl font-bold text-white mb-1">Session beendet!</h2>
                {sessionData.tier && (
                  <p className="text-accent font-semibold">{sessionData.tier}</p>
                )}
              </motion.div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* Duration */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-white/10 rounded-xl p-4 text-center"
              >
                <Clock className="h-6 w-6 mx-auto text-white/60 mb-2" />
                <p className="text-2xl font-bold text-white tabular-nums">
                  {formatDuration(sessionData.duration)}
                </p>
                <p className="text-xs text-white/50">Hörzeit</p>
              </motion.div>

              {/* Reward */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-accent/20 rounded-xl p-4 text-center border border-accent/30"
              >
                <TalerIcon size={24} className="mx-auto mb-2" />
                <p className="text-2xl font-bold text-accent tabular-nums">
                  +{sessionData.reward}
                </p>
                <p className="text-xs text-white/50">Taler verdient</p>
              </motion.div>
            </div>

            {/* Branding Footer */}
            <p className="text-center text-xs text-white/30">
              my2go.app • Hören lohnt sich!
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 bg-white/5 border-white/10 text-white hover:bg-white/10"
            >
              <X className="h-4 w-4 mr-2" />
              Schliessen
            </Button>
            <Button
              onClick={handleShare}
              disabled={isSharing}
              className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {isSharing ? (
                <div className="h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : navigator.share ? (
                <Share2 className="h-4 w-4 mr-2" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              {navigator.share ? 'Teilen' : 'Speichern'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
