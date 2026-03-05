import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthSafe } from '@/contexts/AuthContext';

export interface WeeklyWrappedData {
  totalMinutes: number;
  totalSessions: number;
  talerEarned: number;
  topStation: string | null;
  topStationMinutes: number;
  streakDays: number;
  weekLabel: string;
}

function getWeekRange() {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7)); // go back to Monday
  monday.setHours(0, 0, 0, 0);
  
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  
  return { start: monday, end: sunday };
}

export function useWeeklyWrapped() {
  const auth = useAuthSafe();
  const userId = auth?.user?.id;

  return useQuery({
    queryKey: ['weekly-wrapped', userId],
    queryFn: async (): Promise<WeeklyWrappedData> => {
      if (!userId) throw new Error('Not authenticated');

      const { start, end } = getWeekRange();
      const startISO = start.toISOString();
      const endISO = end.toISOString();

      // Fetch listening sessions for this week
      const { data: sessions, error } = await supabase
        .from('radio_listening_sessions')
        .select('duration_seconds, external_station_name, stream_type, taler_awarded, started_at')
        .eq('user_id', userId)
        .gte('started_at', startISO)
        .lte('started_at', endISO)
        .not('ended_at', 'is', null);

      if (error) throw error;

      const totalSeconds = (sessions || []).reduce((sum, s) => sum + (s.duration_seconds || 0), 0);
      const totalMinutes = Math.round(totalSeconds / 60);
      const totalSessions = sessions?.length || 0;
      const talerEarned = (sessions || []).reduce((sum, s) => sum + (s.taler_awarded || 0), 0);

      // Find top station
      const stationMap: Record<string, number> = {};
      (sessions || []).forEach(s => {
        const name = s.stream_type === 'radio2go' ? 'my2go Radio' : (s.external_station_name || 'Externer Sender');
        stationMap[name] = (stationMap[name] || 0) + (s.duration_seconds || 0);
      });

      let topStation: string | null = null;
      let topStationSeconds = 0;
      Object.entries(stationMap).forEach(([name, seconds]) => {
        if (seconds > topStationSeconds) {
          topStation = name;
          topStationSeconds = seconds;
        }
      });

      // Get streak
      const { data: profile } = await supabase
        .from('profiles')
        .select('current_streak')
        .eq('id', userId)
        .single();

      const weekLabel = `${start.getDate()}.${start.getMonth() + 1}. – ${end.getDate()}.${end.getMonth() + 1}.`;

      return {
        totalMinutes,
        totalSessions,
        talerEarned,
        topStation,
        topStationMinutes: Math.round(topStationSeconds / 60),
        streakDays: profile?.current_streak || 0,
        weekLabel,
      };
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
}
