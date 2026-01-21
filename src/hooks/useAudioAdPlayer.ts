import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useRadioStore } from '@/lib/radio-store';
import { useAuthSafe } from '@/contexts/AuthContext';

interface ScheduledAd {
  id: string;
  audio_ad_id: string;
  scheduled_date: string;
  scheduled_time: string;
  is_active: boolean;
  repeat_interval_minutes: number | null;
  day_start_time: string | null;
  day_end_time: string | null;
  weekdays: number[] | null;
  last_played_at: string | null;
  audio_ads: {
    id: string;
    title: string;
    generated_audio_url: string | null;
    duration_seconds: number | null;
    partner_id: string;
    trigger_on_tier: boolean;
  } | null;
}

interface UseAudioAdPlayerOptions {
  enabled?: boolean;
  onAdStart?: (ad: ScheduledAd) => void;
  onAdEnd?: (ad: ScheduledAd) => void;
}

const DUCK_VOLUME = 0.15; // Volume during ad playback (15%)
const FADE_DURATION = 500; // Fade in/out duration in ms

export function useAudioAdPlayer(options: UseAudioAdPlayerOptions = {}) {
  const { enabled = true, onAdStart, onAdEnd } = options;
  const { isPlaying, volume, setVolume } = useRadioStore();
  const authContext = useAuthSafe();
  
  const [isPlayingAd, setIsPlayingAd] = useState(false);
  const [currentAd, setCurrentAd] = useState<ScheduledAd | null>(null);
  const [scheduledAds, setScheduledAds] = useState<ScheduledAd[]>([]);
  
  const adAudioRef = useRef<HTMLAudioElement | null>(null);
  const originalVolumeRef = useRef<number>(1);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastPlayedRef = useRef<Map<string, number>>(new Map());

  // Load scheduled ads for today
  const loadScheduledAds = useCallback(async () => {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('audio_ad_schedules')
      .select(`
        *,
        audio_ads (
          id,
          title,
          generated_audio_url,
          duration_seconds,
          partner_id,
          trigger_on_tier
        )
      `)
      .eq('scheduled_date', today)
      .eq('is_active', true);

    if (error) {
      console.error('Error loading scheduled ads:', error);
      return;
    }

    // Filter only ads with generated audio
    const validAds = (data || []).filter(
      (s) => s.audio_ads?.generated_audio_url
    ) as ScheduledAd[];

    setScheduledAds(validAds);
  }, []);

  // Fade volume smoothly
  const fadeVolume = useCallback((targetVolume: number, duration: number): Promise<void> => {
    return new Promise((resolve) => {
      const startVolume = volume;
      const startTime = Date.now();
      
      const fade = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Ease out curve
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        const newVolume = startVolume + (targetVolume - startVolume) * easeProgress;
        
        setVolume(newVolume);
        
        if (progress < 1) {
          requestAnimationFrame(fade);
        } else {
          resolve();
        }
      };
      
      requestAnimationFrame(fade);
    });
  }, [volume, setVolume]);

  // Play an audio ad with ducking
  const playAd = useCallback(async (schedule: ScheduledAd) => {
    if (!schedule.audio_ads?.generated_audio_url || isPlayingAd) return;

    try {
      setIsPlayingAd(true);
      setCurrentAd(schedule);
      onAdStart?.(schedule);

      // Save original volume and duck the stream
      originalVolumeRef.current = volume;
      await fadeVolume(DUCK_VOLUME, FADE_DURATION);

      // Create and play ad audio
      const adAudio = new Audio(schedule.audio_ads.generated_audio_url);
      adAudioRef.current = adAudio;

      await new Promise<void>((resolve, reject) => {
        adAudio.onended = () => resolve();
        adAudio.onerror = () => reject(new Error('Ad playback failed'));
        adAudio.play().catch(reject);
      });

      // Record play in database
      await supabase.from('audio_ad_plays').insert({
        audio_ad_id: schedule.audio_ads.id,
        schedule_id: schedule.id,
        user_id: authContext?.user?.id || null,
        trigger_type: 'scheduled',
        completed: true,
        duration_listened_seconds: schedule.audio_ads.duration_seconds,
      });

      // Update last played timestamp
      await supabase
        .from('audio_ad_schedules')
        .update({ last_played_at: new Date().toISOString() })
        .eq('id', schedule.id);

      lastPlayedRef.current.set(schedule.id, Date.now());

    } catch (error) {
      console.error('Error playing audio ad:', error);
    } finally {
      // Fade volume back up
      await fadeVolume(originalVolumeRef.current, FADE_DURATION);
      
      setIsPlayingAd(false);
      onAdEnd?.(currentAd!);
      setCurrentAd(null);
      adAudioRef.current = null;
    }
  }, [isPlayingAd, volume, fadeVolume, onAdStart, onAdEnd, authContext?.user?.id]);

  // Play ad triggered by tier (for tier celebration)
  const playTierAd = useCallback(async (partnerId?: string) => {
    // Find an ad configured for tier triggers
    const tierAds = scheduledAds.filter(s => s.audio_ads?.trigger_on_tier);
    
    // Prefer ads from specific partner if provided
    let adToPlay = partnerId 
      ? tierAds.find(s => s.audio_ads?.partner_id === partnerId)
      : tierAds[0];

    if (!adToPlay && tierAds.length > 0) {
      adToPlay = tierAds[Math.floor(Math.random() * tierAds.length)];
    }

    if (adToPlay) {
      await playAd(adToPlay);
    }
  }, [scheduledAds, playAd]);

  // Check if any ad should play now
  const checkSchedule = useCallback(() => {
    if (!isPlaying || isPlayingAd || !enabled) return;

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const currentDay = now.getDay();

    for (const schedule of scheduledAds) {
      // Check if already played recently (within repeat interval or 5 min default)
      const lastPlayed = lastPlayedRef.current.get(schedule.id);
      const repeatInterval = (schedule.repeat_interval_minutes || 60) * 60 * 1000;
      
      if (lastPlayed && Date.now() - lastPlayed < repeatInterval) {
        continue;
      }

      // Check weekdays if configured
      if (schedule.weekdays && schedule.weekdays.length > 0) {
        if (!schedule.weekdays.includes(currentDay)) {
          continue;
        }
      }

      // For repeating schedules, check time range
      if (schedule.repeat_interval_minutes && schedule.day_start_time && schedule.day_end_time) {
        if (currentTime >= schedule.day_start_time && currentTime <= schedule.day_end_time) {
          playAd(schedule);
          return;
        }
      } else {
        // For single-time schedules, check exact time (within 1 minute)
        const scheduledHour = parseInt(schedule.scheduled_time.split(':')[0], 10);
        const scheduledMin = parseInt(schedule.scheduled_time.split(':')[1], 10);
        
        if (now.getHours() === scheduledHour && Math.abs(now.getMinutes() - scheduledMin) <= 1) {
          playAd(schedule);
          return;
        }
      }
    }
  }, [isPlaying, isPlayingAd, enabled, scheduledAds, playAd]);

  // Load ads on mount and when radio starts playing
  useEffect(() => {
    if (enabled) {
      loadScheduledAds();
    }
  }, [enabled, loadScheduledAds]);

  // Check schedule every 30 seconds when radio is playing
  useEffect(() => {
    if (isPlaying && enabled && !isPlayingAd) {
      checkSchedule(); // Check immediately
      checkIntervalRef.current = setInterval(checkSchedule, 30000);
    }

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
    };
  }, [isPlaying, enabled, isPlayingAd, checkSchedule]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (adAudioRef.current) {
        adAudioRef.current.pause();
        adAudioRef.current = null;
      }
    };
  }, []);

  return {
    isPlayingAd,
    currentAd,
    playTierAd,
    refreshSchedule: loadScheduledAds,
  };
}
