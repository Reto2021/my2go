import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetDescription 
} from '@/components/ui/sheet';
import { Camera, Download, Share2, Loader2, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import { cn } from '@/lib/utils';

export const GroupPhotoButton = ({
  onCapture, 
  isCapturing 
}: { 
  onCapture: () => void; 
  isCapturing: boolean;
}) => {
  return (
    <Button
      variant="outline"
      size="icon"
      className={cn(
        "h-12 w-12 rounded-full border-pink-500/50 hover:bg-pink-500/10 hover:border-pink-500",
        isCapturing && "animate-pulse"
      )}
      onClick={onCapture}
      disabled={isCapturing}
    >
      {isCapturing ? (
        <Loader2 className="h-5 w-5 animate-spin text-pink-500" />
      ) : (
        <Camera className="h-5 w-5 text-pink-500" />
      )}
    </Button>
  );
};

interface GroupPhotoSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  photoDataUrl: string | null;
  songTitle?: string;
  participantCount: number;
}

export const GroupPhotoSheet = ({ 
  open, 
  onOpenChange, 
  photoDataUrl,
  songTitle,
  participantCount
}: GroupPhotoSheetProps) => {
  const [isSharing, setIsSharing] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const handleDownload = useCallback(() => {
    if (!photoDataUrl) return;

    const link = document.createElement('a');
    link.href = photoDataUrl;
    link.download = `dance-party-${new Date().toISOString().slice(0, 10)}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setDownloadSuccess(true);
    toast.success('Foto heruntergeladen! 📸');
    setTimeout(() => setDownloadSuccess(false), 2000);
  }, [photoDataUrl]);

  const handleShare = useCallback(async () => {
    if (!photoDataUrl) return;

    setIsSharing(true);
    
    try {
      // Convert data URL to blob for sharing
      const response = await fetch(photoDataUrl);
      const blob = await response.blob();
      const file = new File([blob], 'dance-party-photo.png', { type: 'image/png' });

      const shareData: ShareData = {
        title: '🕺 Dance Party Gruppenfoto!',
        text: songTitle 
          ? `Wir haben gerade bei "${songTitle}" getanzt! 💃🎵 ${participantCount} Tänzer waren dabei!`
          : `Dance Party Gruppenfoto mit ${participantCount} Tänzern! 💃🕺`,
        files: [file]
      };

      if (navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        toast.success('Foto geteilt! 🎉');
      } else {
        // Fallback: share without file
        const textShareData = {
          title: '🕺 Dance Party!',
          text: songTitle 
            ? `Ich war gerade bei der Dance Party zu "${songTitle}"! 💃🎵`
            : 'Ich war gerade bei der Dance Party! 💃🕺',
        };
        
        if (navigator.share) {
          await navigator.share(textShareData);
          toast.success('Geteilt! 🎉');
        } else {
          // Copy to clipboard as last resort
          await navigator.clipboard.writeText(textShareData.text);
          toast.success('Text kopiert! 📋');
        }
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Share error:', err);
        toast.error('Teilen fehlgeschlagen');
      }
    } finally {
      setIsSharing(false);
    }
  }, [photoDataUrl, songTitle, participantCount]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[80vh] rounded-t-3xl">
        <SheetHeader className="text-center pb-4">
          <SheetTitle className="flex items-center justify-center gap-2">
            <Camera className="h-5 w-5 text-pink-500" />
            Gruppenfoto
          </SheetTitle>
          <SheetDescription>
            {songTitle && `📸 Dance Party zu "${songTitle}"`}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col items-center gap-6 h-[calc(100%-6rem)]">
          {/* Photo Preview */}
          <div className="flex-1 w-full max-w-md flex items-center justify-center">
            {photoDataUrl ? (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white/20"
              >
                <img 
                  src={photoDataUrl} 
                  alt="Dance Party Gruppenfoto" 
                  className="max-w-full max-h-[50vh] object-contain"
                />
                
                {/* Photo overlay with branding */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-bold text-sm">🕺 Dance Party</p>
                      {songTitle && (
                        <p className="text-white/80 text-xs truncate max-w-[200px]">
                          🎵 {songTitle}
                        </p>
                      )}
                    </div>
                    <div className="text-white/80 text-xs">
                      {participantCount} 💃
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="text-muted-foreground text-center">
                <Camera className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p>Kein Foto vorhanden</p>
              </div>
            )}
          </div>

          {/* Action buttons */}
          {photoDataUrl && (
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="flex items-center gap-4"
            >
              <Button
                variant="outline"
                size="lg"
                className="gap-2"
                onClick={handleDownload}
              >
                {downloadSuccess ? (
                  <Check className="h-5 w-5 text-green-500" />
                ) : (
                  <Download className="h-5 w-5" />
                )}
                Speichern
              </Button>
              
              <Button
                size="lg"
                className="gap-2 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
                onClick={handleShare}
                disabled={isSharing}
              >
                {isSharing ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Share2 className="h-5 w-5" />
                )}
                Teilen
              </Button>
            </motion.div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

// Hook for capturing group photo
export const useGroupPhoto = (videoGridRef: React.RefObject<HTMLDivElement>) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [showPhotoSheet, setShowPhotoSheet] = useState(false);

  const capturePhoto = useCallback(async () => {
    if (!videoGridRef.current) {
      toast.error('Keine Videos zum Erfassen');
      return;
    }

    setIsCapturing(true);
    
    // Play camera shutter sound
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      osc.connect(gain);
      gain.connect(audioContext.destination);
      osc.frequency.value = 1000;
      osc.type = 'square';
      gain.gain.setValueAtTime(0.1, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);
      osc.start(audioContext.currentTime);
      osc.stop(audioContext.currentTime + 0.1);
    } catch (e) {
      // Audio not supported
    }

    // Flash effect
    const flash = document.createElement('div');
    flash.style.cssText = `
      position: fixed;
      inset: 0;
      background: white;
      z-index: 9999;
      pointer-events: none;
      animation: flash 0.3s ease-out;
    `;
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 300);

    try {
      // Small delay for flash effect
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const canvas = await html2canvas(videoGridRef.current, {
        backgroundColor: '#1a1a2e',
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
      });
      
      const dataUrl = canvas.toDataURL('image/png');
      setPhotoDataUrl(dataUrl);
      setShowPhotoSheet(true);
      toast.success('📸 Foto aufgenommen!');
    } catch (err) {
      console.error('Capture error:', err);
      toast.error('Foto konnte nicht aufgenommen werden');
    } finally {
      setIsCapturing(false);
    }
  }, [videoGridRef]);

  return {
    isCapturing,
    photoDataUrl,
    showPhotoSheet,
    setShowPhotoSheet,
    capturePhoto
  };
};

// Add flash animation to global styles
const addFlashAnimation = () => {
  if (typeof document !== 'undefined' && !document.getElementById('flash-animation')) {
    const style = document.createElement('style');
    style.id = 'flash-animation';
    style.textContent = `
      @keyframes flash {
        0% { opacity: 1; }
        100% { opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }
};

// Initialize flash animation
if (typeof window !== 'undefined') {
  addFlashAnimation();
}
