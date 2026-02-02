import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX, ExternalLink, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { supabase } from '@/integrations/supabase/client';
import { PageLoader } from '@/components/ui/loading-spinner';
import logo2go from '@/assets/logo-2go.png';

interface PartnerRadioData {
  id: string;
  name: string;
  slug: string;
  stream_url: string;
  preroll_audio_url: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  brand_color: string;
  description: string | null;
  is_active: boolean;
  partner: {
    name: string;
    website: string | null;
  } | null;
}

export default function PartnerRadioPage() {
  const { slug } = useParams<{ slug: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [radio, setRadio] = useState<PartnerRadioData | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPrerollPlaying, setIsPrerollPlaying] = useState(false);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  
  const prerollRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (slug) {
      loadRadio();
    }
  }, [slug]);

  const loadRadio = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('partner_radios')
        .select(`
          id,
          name,
          slug,
          stream_url,
          preroll_audio_url,
          logo_url,
          cover_image_url,
          brand_color,
          description,
          is_active,
          partner:partners!partner_id (
            name,
            website
          )
        `)
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          setError('Radio nicht gefunden');
        } else {
          throw fetchError;
        }
        return;
      }

      // Transform the partner data to match our interface
      const radioData: PartnerRadioData = {
        ...data,
        partner: data.partner ? {
          name: (data.partner as any).name,
          website: (data.partner as any).website
        } : null
      };

      setRadio(radioData);

      // Track the play (increment play count)
      supabase.rpc('increment_partner_radio_plays', { _radio_id: data.id }).then(() => {
        console.log('Play count incremented');
      });
    } catch (err) {
      console.error('Error loading radio:', err);
      setError('Fehler beim Laden');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlay = async () => {
    if (isPlaying) {
      // Stop playback
      if (streamRef.current) {
        streamRef.current.pause();
        streamRef.current = null;
      }
      if (prerollRef.current) {
        prerollRef.current.pause();
        prerollRef.current = null;
      }
      setIsPlaying(false);
      setIsPrerollPlaying(false);
      return;
    }

    // Start playback
    setIsPlaying(true);

    if (radio?.preroll_audio_url) {
      // Play preroll first
      setIsPrerollPlaying(true);
      prerollRef.current = new Audio(radio.preroll_audio_url);
      prerollRef.current.volume = (isMuted ? 0 : volume) / 100;
      
      prerollRef.current.addEventListener('ended', () => {
        setIsPrerollPlaying(false);
        startMainStream();
      });
      
      prerollRef.current.addEventListener('error', () => {
        console.error('Preroll error, starting main stream');
        setIsPrerollPlaying(false);
        startMainStream();
      });

      await prerollRef.current.play().catch(() => {
        setIsPrerollPlaying(false);
        startMainStream();
      });
    } else {
      startMainStream();
    }
  };

  const startMainStream = () => {
    if (!radio?.stream_url) return;

    streamRef.current = new Audio(radio.stream_url);
    streamRef.current.volume = (isMuted ? 0 : volume) / 100;
    
    streamRef.current.addEventListener('error', () => {
      console.error('Stream error');
      setIsPlaying(false);
    });

    streamRef.current.play().catch(() => {
      setIsPlaying(false);
    });
  };

  const handleVolumeChange = (newVolume: number[]) => {
    const vol = newVolume[0];
    setVolume(vol);
    setIsMuted(vol === 0);
    
    if (prerollRef.current) {
      prerollRef.current.volume = vol / 100;
    }
    if (streamRef.current) {
      streamRef.current.volume = vol / 100;
    }
  };

  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    
    const newVol = newMuted ? 0 : volume / 100;
    if (prerollRef.current) {
      prerollRef.current.volume = newVol;
    }
    if (streamRef.current) {
      streamRef.current.volume = newVol;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (prerollRef.current) {
        prerollRef.current.pause();
      }
      if (streamRef.current) {
        streamRef.current.pause();
      }
    };
  }, []);

  if (isLoading) {
    return <PageLoader />;
  }

  if (error || !radio) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center space-y-4">
          <Radio className="h-16 w-16 text-muted-foreground mx-auto" />
          <h1 className="text-2xl font-bold">{error || 'Radio nicht gefunden'}</h1>
          <p className="text-muted-foreground">
            Dieses Radio existiert nicht oder ist deaktiviert.
          </p>
          <Button asChild>
            <a href="/">Zur Startseite</a>
          </Button>
        </div>
      </div>
    );
  }

  const brandColor = radio.brand_color || '#C7A94E';

  return (
    <div 
      className="min-h-screen flex flex-col"
      style={{ 
        background: `linear-gradient(180deg, ${brandColor}20 0%, transparent 50%)` 
      }}
    >
      {/* Cover Image */}
      {radio.cover_image_url && (
        <div className="relative h-48 sm:h-64 overflow-hidden">
          <img 
            src={radio.cover_image_url} 
            alt={radio.name}
            className="w-full h-full object-cover"
          />
          <div 
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to bottom, transparent 0%, ${brandColor}40 100%)`
            }}
          />
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md space-y-8 text-center"
        >
          {/* Logo */}
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', bounce: 0.4 }}
            className="flex justify-center"
          >
            <div 
              className="h-32 w-32 rounded-3xl shadow-2xl overflow-hidden flex items-center justify-center"
              style={{ backgroundColor: brandColor + '20', borderColor: brandColor, borderWidth: 2 }}
            >
              {radio.logo_url ? (
                <img src={radio.logo_url} alt={radio.name} className="h-full w-full object-cover" />
              ) : (
                <Radio className="h-16 w-16" style={{ color: brandColor }} />
              )}
            </div>
          </motion.div>

          {/* Title & Description */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">{radio.name}</h1>
            {radio.partner?.name && (
              <p className="text-muted-foreground">von {radio.partner.name}</p>
            )}
            {radio.description && (
              <p className="text-sm text-muted-foreground mt-2">{radio.description}</p>
            )}
          </div>

          {/* Play Button */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              size="lg"
              onClick={handlePlay}
              className="h-20 w-20 rounded-full shadow-xl"
              style={{ 
                backgroundColor: brandColor,
                color: 'white'
              }}
            >
              <AnimatePresence mode="wait">
                {isPlaying ? (
                  <motion.div
                    key="pause"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    <Pause className="h-10 w-10" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="play"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                  >
                    <Play className="h-10 w-10 ml-1" />
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>
          </motion.div>

          {/* Status Text */}
          <AnimatePresence>
            {isPlaying && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-sm text-muted-foreground"
              >
                {isPrerollPlaying ? '⏳ Willkommen...' : '🎵 Live'}
              </motion.p>
            )}
          </AnimatePresence>

          {/* Volume Control */}
          {isPlaying && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-4 px-4"
            >
              <Button variant="ghost" size="icon" onClick={toggleMute}>
                {isMuted ? (
                  <VolumeX className="h-5 w-5" />
                ) : (
                  <Volume2 className="h-5 w-5" />
                )}
              </Button>
              <Slider
                value={[isMuted ? 0 : volume]}
                onValueChange={handleVolumeChange}
                max={100}
                step={1}
                className="flex-1"
              />
            </motion.div>
          )}

          {/* Partner Website Link */}
          {radio.partner?.website && (
            <Button variant="ghost" asChild className="gap-2">
              <a href={radio.partner.website} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
                Website besuchen
              </a>
            </Button>
          )}
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="p-4 text-center">
        <a href="/" className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <img src={logo2go} alt="my2go" className="h-4" />
          <span>Powered by my2go</span>
        </a>
      </footer>
    </div>
  );
}
