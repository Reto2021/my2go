import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Trash2, 
  GripVertical,
  Clock,
  Volume2,
  Loader2,
  Calendar as CalendarIcon,
  Repeat
} from 'lucide-react';
import { format, addDays, startOfWeek, isSameDay, addWeeks, subWeeks, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

interface AudioAd {
  id: string;
  title: string;
  partner_id: string;
  is_active: boolean;
  generation_status: string;
  partners?: { name: string };
}

interface Schedule {
  id: string;
  audio_ad_id: string;
  scheduled_date: string;
  scheduled_time: string;
  is_active: boolean;
  weekdays: number[];
  day_start_time: string;
  day_end_time: string;
  repeat_interval_minutes: number | null;
  audio_ads?: {
    title: string;
    partners?: { name: string };
  };
}

interface AudioAdScheduleCalendarProps {
  audioAds: AudioAd[];
  onRefresh: () => void;
}

const HOURS = Array.from({ length: 16 }, (_, i) => i + 7); // 07:00 - 22:00
const WEEKDAYS = [
  { value: 1, label: 'Mo' },
  { value: 2, label: 'Di' },
  { value: 3, label: 'Mi' },
  { value: 4, label: 'Do' },
  { value: 5, label: 'Fr' },
  { value: 6, label: 'Sa' },
  { value: 0, label: 'So' },
];

export default function AudioAdScheduleCalendar({ audioAds, onRefresh }: AudioAdScheduleCalendarProps) {
  const [currentWeek, setCurrentWeek] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [draggedAd, setDraggedAd] = useState<AudioAd | null>(null);
  const [dropTarget, setDropTarget] = useState<{ day: Date; hour: number } | null>(null);

  // Form state for new schedule
  const [formData, setFormData] = useState({
    audioAdId: '',
    scheduledDate: format(new Date(), 'yyyy-MM-dd'),
    scheduledTime: '12:00',
    isRecurring: false,
    weekdays: [1, 2, 3, 4, 5] as number[],
    dayStartTime: '08:00',
    dayEndTime: '22:00',
    repeatIntervalMinutes: 60,
  });

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(currentWeek, i));
  }, [currentWeek]);

  useEffect(() => {
    loadSchedules();
  }, [currentWeek]);

  const loadSchedules = async () => {
    setLoading(true);
    try {
      const startDate = format(currentWeek, 'yyyy-MM-dd');
      const endDate = format(addDays(currentWeek, 6), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('audio_ad_schedules')
        .select('*, audio_ads(title, partners(name))')
        .gte('scheduled_date', startDate)
        .lte('scheduled_date', endDate)
        .order('scheduled_time');

      if (error) throw error;
      setSchedules(data || []);
    } catch (error) {
      console.error('Error loading schedules:', error);
      toast.error('Fehler beim Laden des Zeitplans');
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (ad: AudioAd) => {
    if (ad.generation_status !== 'completed') {
      toast.error('Nur generierte Audio-Ads können geplant werden');
      return;
    }
    setDraggedAd(ad);
  };

  const handleDragOver = (e: React.DragEvent, day: Date, hour: number) => {
    e.preventDefault();
    setDropTarget({ day, hour });
  };

  const handleDragLeave = () => {
    setDropTarget(null);
  };

  const handleDrop = async (e: React.DragEvent, day: Date, hour: number) => {
    e.preventDefault();
    setDropTarget(null);

    if (!draggedAd) return;

    try {
      const { error } = await supabase
        .from('audio_ad_schedules')
        .insert({
          audio_ad_id: draggedAd.id,
          scheduled_date: format(day, 'yyyy-MM-dd'),
          scheduled_time: `${hour.toString().padStart(2, '0')}:00`,
          is_active: true,
        });

      if (error) throw error;

      toast.success('Audio-Ad eingeplant!');
      loadSchedules();
    } catch (error) {
      console.error('Error creating schedule:', error);
      toast.error('Fehler beim Einplanen');
    } finally {
      setDraggedAd(null);
    }
  };

  const handleCreateSchedule = async () => {
    if (!formData.audioAdId) {
      toast.error('Bitte wähle eine Audio-Ad aus');
      return;
    }

    setCreating(true);
    try {
      const scheduleData = {
        audio_ad_id: formData.audioAdId,
        scheduled_date: formData.scheduledDate,
        scheduled_time: formData.scheduledTime,
        is_active: true,
        weekdays: formData.isRecurring ? formData.weekdays : null,
        day_start_time: formData.isRecurring ? formData.dayStartTime : null,
        day_end_time: formData.isRecurring ? formData.dayEndTime : null,
        repeat_interval_minutes: formData.isRecurring ? formData.repeatIntervalMinutes : null,
      };

      const { error } = await supabase
        .from('audio_ad_schedules')
        .insert(scheduleData);

      if (error) throw error;

      toast.success('Zeitplan erstellt!');
      setDialogOpen(false);
      setFormData({
        audioAdId: '',
        scheduledDate: format(new Date(), 'yyyy-MM-dd'),
        scheduledTime: '12:00',
        isRecurring: false,
        weekdays: [1, 2, 3, 4, 5],
        dayStartTime: '08:00',
        dayEndTime: '22:00',
        repeatIntervalMinutes: 60,
      });
      loadSchedules();
    } catch (error) {
      console.error('Error creating schedule:', error);
      toast.error('Fehler beim Erstellen');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    try {
      const { error } = await supabase
        .from('audio_ad_schedules')
        .delete()
        .eq('id', scheduleId);

      if (error) throw error;

      toast.success('Zeitplan gelöscht');
      loadSchedules();
    } catch (error) {
      console.error('Error deleting schedule:', error);
      toast.error('Fehler beim Löschen');
    }
  };

  const toggleScheduleActive = async (schedule: Schedule) => {
    try {
      const { error } = await supabase
        .from('audio_ad_schedules')
        .update({ is_active: !schedule.is_active })
        .eq('id', schedule.id);

      if (error) throw error;

      setSchedules(prev => prev.map(s => 
        s.id === schedule.id ? { ...s, is_active: !s.is_active } : s
      ));
    } catch (error) {
      console.error('Error toggling schedule:', error);
      toast.error('Fehler beim Aktualisieren');
    }
  };

  const getSchedulesForSlot = (day: Date, hour: number) => {
    return schedules.filter(s => {
      const scheduleDate = parseISO(s.scheduled_date);
      const scheduleHour = parseInt(s.scheduled_time.split(':')[0], 10);
      return isSameDay(scheduleDate, day) && scheduleHour === hour;
    });
  };

  const activeAds = audioAds.filter(ad => ad.is_active && ad.generation_status === 'completed');

  const toggleWeekday = (day: number) => {
    setFormData(prev => ({
      ...prev,
      weekdays: prev.weekdays.includes(day)
        ? prev.weekdays.filter(d => d !== day)
        : [...prev.weekdays, day].sort((a, b) => a - b),
    }));
  };

  return (
    <div className="space-y-4">
      {/* Header with Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <span className="font-semibold ml-2">
            {format(currentWeek, 'd. MMM', { locale: de })} - {format(addDays(currentWeek, 6), 'd. MMM yyyy', { locale: de })}
          </span>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setCurrentWeek(startOfWeek(new Date(), { weekStartsOn: 1 }))}
          >
            Heute
          </Button>
        </div>

        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Zeitplan erstellen
        </Button>
      </div>

      <div className="grid grid-cols-[200px_1fr] gap-4">
        {/* Sidebar: Draggable Audio Ads */}
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Volume2 className="h-4 w-4" />
              Verfügbare Audio-Ads
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 space-y-2 max-h-[500px] overflow-y-auto">
            {activeAds.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">
                Keine aktiven Audio-Ads vorhanden
              </p>
            ) : (
              activeAds.map((ad) => (
                <div
                  key={ad.id}
                  draggable
                  onDragStart={() => handleDragStart(ad)}
                  onDragEnd={() => setDraggedAd(null)}
                  className="p-2 bg-muted rounded-md cursor-grab active:cursor-grabbing hover:bg-accent transition-colors flex items-center gap-2"
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium truncate">{ad.title}</p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {ad.partners?.name}
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Calendar Grid */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[700px]">
              <thead>
                <tr>
                  <th className="w-16 p-2 border-b text-left text-xs font-medium text-muted-foreground">
                    Zeit
                  </th>
                  {weekDays.map((day) => (
                    <th 
                      key={day.toISOString()} 
                      className={`p-2 border-b text-center text-xs font-medium ${
                        isSameDay(day, new Date()) ? 'bg-primary/10 text-primary' : ''
                      }`}
                    >
                      <div>{format(day, 'EEE', { locale: de })}</div>
                      <div className="text-lg font-bold">{format(day, 'd')}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {HOURS.map((hour) => (
                  <tr key={hour} className="h-16">
                    <td className="p-2 border-r text-xs text-muted-foreground align-top">
                      {hour.toString().padStart(2, '0')}:00
                    </td>
                    {weekDays.map((day) => {
                      const slotSchedules = getSchedulesForSlot(day, hour);
                      const isDropTarget = dropTarget && isSameDay(dropTarget.day, day) && dropTarget.hour === hour;

                      return (
                        <td
                          key={`${day.toISOString()}-${hour}`}
                          className={`p-1 border-r border-b relative ${
                            isDropTarget ? 'bg-primary/20' : 'hover:bg-muted/50'
                          } ${isSameDay(day, new Date()) ? 'bg-primary/5' : ''}`}
                          onDragOver={(e) => handleDragOver(e, day, hour)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, day, hour)}
                        >
                          <div className="space-y-1">
                            {slotSchedules.map((schedule) => (
                              <div
                                key={schedule.id}
                                className={`group text-[10px] p-1 rounded ${
                                  schedule.is_active 
                                    ? 'bg-primary text-primary-foreground' 
                                    : 'bg-muted text-muted-foreground'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="truncate flex-1">
                                    {schedule.audio_ads?.title}
                                  </span>
                                  <button
                                    onClick={() => handleDeleteSchedule(schedule.id)}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                                {schedule.repeat_interval_minutes && (
                                  <div className="flex items-center gap-1 mt-0.5 opacity-75">
                                    <Repeat className="h-2 w-2" />
                                    <span>alle {schedule.repeat_interval_minutes}min</span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-primary" />
          <span>Aktiver Zeitplan</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-muted" />
          <span>Pausiert</span>
        </div>
        <div className="flex items-center gap-2">
          <GripVertical className="h-3 w-3" />
          <span>Drag & Drop zum Einplanen</span>
        </div>
      </div>

      {/* Create Schedule Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Zeitplan erstellen
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            {/* Audio Ad Selection */}
            <div className="space-y-2">
              <Label>Audio-Ad *</Label>
              <Select
                value={formData.audioAdId}
                onValueChange={(v) => setFormData({ ...formData, audioAdId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Audio-Ad auswählen..." />
                </SelectTrigger>
                <SelectContent>
                  {activeAds.map((ad) => (
                    <SelectItem key={ad.id} value={ad.id}>
                      {ad.title} ({ad.partners?.name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label>Startdatum</Label>
              <Input
                type="date"
                value={formData.scheduledDate}
                onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
              />
            </div>

            {/* Time */}
            <div className="space-y-2">
              <Label>Startzeit</Label>
              <Input
                type="time"
                value={formData.scheduledTime}
                onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
              />
            </div>

            {/* Recurring Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <Label>Wiederkehrend</Label>
                <p className="text-xs text-muted-foreground">
                  In regelmässigen Abständen abspielen
                </p>
              </div>
              <Switch
                checked={formData.isRecurring}
                onCheckedChange={(v) => setFormData({ ...formData, isRecurring: v })}
              />
            </div>

            {/* Recurring Options */}
            {formData.isRecurring && (
              <div className="space-y-4 p-3 bg-muted rounded-lg">
                {/* Weekdays */}
                <div className="space-y-2">
                  <Label>Wochentage</Label>
                  <div className="flex flex-wrap gap-1">
                    {WEEKDAYS.map((day) => (
                      <Button
                        key={day.value}
                        type="button"
                        size="sm"
                        variant={formData.weekdays.includes(day.value) ? 'default' : 'outline'}
                        className="w-9 h-9 p-0"
                        onClick={() => toggleWeekday(day.value)}
                      >
                        {day.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Time Range */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Von</Label>
                    <Input
                      type="time"
                      value={formData.dayStartTime}
                      onChange={(e) => setFormData({ ...formData, dayStartTime: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Bis</Label>
                    <Input
                      type="time"
                      value={formData.dayEndTime}
                      onChange={(e) => setFormData({ ...formData, dayEndTime: e.target.value })}
                    />
                  </div>
                </div>

                {/* Repeat Interval */}
                <div className="space-y-2">
                  <Label>Wiederholungsintervall (Minuten)</Label>
                  <Select
                    value={formData.repeatIntervalMinutes.toString()}
                    onValueChange={(v) => setFormData({ ...formData, repeatIntervalMinutes: parseInt(v) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">Alle 30 Minuten</SelectItem>
                      <SelectItem value="60">Stündlich</SelectItem>
                      <SelectItem value="120">Alle 2 Stunden</SelectItem>
                      <SelectItem value="180">Alle 3 Stunden</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <Button
              className="w-full"
              onClick={handleCreateSchedule}
              disabled={creating || !formData.audioAdId}
            >
              {creating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Clock className="h-4 w-4 mr-2" />
              )}
              Zeitplan erstellen
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
