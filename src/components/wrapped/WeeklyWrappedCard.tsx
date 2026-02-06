import { useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Download, X, Headphones, Flame, Coins, Radio, Clock, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';
import type { WeeklyWrappedData } from '@/hooks/useWeeklyWrapped';

interface WeeklyWrappedCardProps {
  isOpen: boolean;
  onClose: () => void;
  data: WeeklyWrappedData;
  userName?: string;
}

export function WeeklyWrappedCard({ isOpen, onClose, data, userName }: WeeklyWrappedCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

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
    } catch {
      return null;
    }
  }, []);

  const handleShare = async () => {
    setIsGenerating(true);
    try {
      const blob = await generateImage();
      if (!blob) { toast.error('Bild konnte nicht erstellt werden'); return; }

      const file = new File([blob], `my2go-wrapped-${Date.now()}.png`, { type: 'image/png' });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          title: 'Mein 2Go Wochenrückblick',
          text: `${data.totalMinutes} Minuten gehört, ${data.talerEarned} Taler verdient! 🎧`,
          files: [file],
        });
      } else {
        // Fallback: download
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Bild heruntergeladen!');
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') toast.error('Teilen fehlgeschlagen');
    } finally {
      setIsGenerating(false);
    }
  };

  const formatMinutes = (m: number) => {
    if (m >= 60) return `${Math.floor(m / 60)}h ${m % 60}min`;
    return `${m} min`;
  };

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
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-card rounded-2xl p-5 max-w-sm w-full space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-accent" />
                Wochenrückblick
              </h3>
              <button onClick={onClose} className="p-2 hover:bg-muted rounded-full">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Share Card */}
            <div
              ref={cardRef}
              className="relative overflow-hidden rounded-2xl p-6 text-white"
              style={{
                background: 'linear-gradient(135deg, #061E1C 0%, #1D6B63 50%, #0D3330 100%)',
                aspectRatio: '4/5',
              }}
            >
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-[#F0B510]/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#1D6B63]/30 rounded-full blur-3xl" />

              <div className="relative z-10 h-full flex flex-col justify-between">
                {/* Header */}
                <div>
                  <p className="text-[#F0B510] text-xs font-bold uppercase tracking-widest mb-1">Wochenrückblick</p>
                  <p className="text-white/60 text-sm">{data.weekLabel}</p>
                  {userName && <p className="text-white/80 text-sm mt-0.5">{userName}</p>}
                </div>

                {/* Main stat */}
                <div className="text-center py-4">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 mb-3">
                    <Headphones className="h-5 w-5 text-[#F0B510]" />
                    <span className="text-sm font-medium">Gesamte Hörzeit</span>
                  </div>
                  <p className="text-5xl font-black text-[#F0B510]">{formatMinutes(data.totalMinutes)}</p>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/10 rounded-xl p-3 text-center">
                    <Coins className="h-5 w-5 text-[#F0B510] mx-auto mb-1" />
                    <p className="text-2xl font-bold">{data.talerEarned}</p>
                    <p className="text-[10px] text-white/60 uppercase tracking-wider">Taler verdient</p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-3 text-center">
                    <Flame className="h-5 w-5 text-orange-400 mx-auto mb-1" />
                    <p className="text-2xl font-bold">{data.streakDays}</p>
                    <p className="text-[10px] text-white/60 uppercase tracking-wider">Tage Serie</p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-3 text-center">
                    <Radio className="h-5 w-5 text-[#F0B510] mx-auto mb-1" />
                    <p className="text-sm font-bold line-clamp-1">{data.topStation || '–'}</p>
                    <p className="text-[10px] text-white/60 uppercase tracking-wider">Top Sender</p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-3 text-center">
                    <Clock className="h-5 w-5 text-white/60 mx-auto mb-1" />
                    <p className="text-2xl font-bold">{data.totalSessions}</p>
                    <p className="text-[10px] text-white/60 uppercase tracking-wider">Sessions</p>
                  </div>
                </div>

                {/* Branding */}
                <p className="text-center text-[10px] font-semibold text-white/30 mt-3 uppercase tracking-widest">my2go.ch</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button onClick={handleShare} disabled={isGenerating} className="flex-1 gap-2">
                <Share2 className="h-4 w-4" />
                Teilen
              </Button>
              <Button variant="outline" onClick={handleShare} disabled={isGenerating} className="gap-2">
                <Download className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              Teile deinen Wochenrückblick auf Instagram, WhatsApp & mehr!
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
