import { useState, useEffect } from 'react';
import { 
  Video, 
  VideoOff, 
  Play,
  Square,
  Settings,
  Users,
  Clock,
  Wifi,
  WifiOff,
  Plus,
  Edit,
  Trash2,
  Calendar,
  Radio,
  Eye,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePartner } from '@/components/partner/PartnerGuard';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface LiveEvent {
  id: string;
  title: string;
  description: string | null;
  stream_url: string;
  thumbnail_url: string | null;
  event_type: string;
  is_live: boolean;
  is_active: boolean;
  is_featured: boolean;
  viewer_count: number;
  peak_viewers: number;
  host_name: string | null;
  host_avatar_url: string | null;
  scheduled_start: string | null;
  scheduled_end: string | null;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
  partner_id: string | null;
}

const EVENT_TYPES = [
  { value: 'live_show', label: 'Live Show' },
  { value: 'concert', label: 'Konzert' },
  { value: 'interview', label: 'Interview' },
  { value: 'dj_set', label: 'DJ Set' },
  { value: 'talk', label: 'Talk / Podcast' },
  { value: 'special', label: 'Special Event' },
];

export default function PartnerLivePage() {
  const { partnerInfo } = usePartner();
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingEvent, setEditingEvent] = useState<LiveEvent | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    stream_url: '',
    event_type: 'live_show',
    host_name: '',
    scheduled_start: '',
  });

  useEffect(() => {
    if (partnerInfo?.partnerId) {
      loadEvents();
    }
  }, [partnerInfo?.partnerId]);

  const loadEvents = async () => {
    if (!partnerInfo?.partnerId) return;
    
    try {
      const { data, error } = await supabase
        .from('live_events')
        .select('*')
        .eq('partner_id', partnerInfo.partnerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error loading events:', error);
      toast.error('Fehler beim Laden der Events');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      stream_url: '',
      event_type: 'live_show',
      host_name: '',
      scheduled_start: '',
    });
    setEditingEvent(null);
  };

  const openEditDialog = (event: LiveEvent) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description || '',
      stream_url: event.stream_url,
      event_type: event.event_type,
      host_name: event.host_name || '',
      scheduled_start: event.scheduled_start ? event.scheduled_start.slice(0, 16) : '',
    });
    setShowCreateDialog(true);
  };

  const handleSave = async () => {
    if (!partnerInfo?.partnerId) return;
    if (!formData.title.trim() || !formData.stream_url.trim()) {
      toast.error('Titel und Stream-URL sind erforderlich');
      return;
    }

    setSaving(true);
    try {
      const eventData = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        stream_url: formData.stream_url.trim(),
        event_type: formData.event_type,
        host_name: formData.host_name.trim() || partnerInfo.partnerName,
        scheduled_start: formData.scheduled_start ? new Date(formData.scheduled_start).toISOString() : null,
        partner_id: partnerInfo.partnerId,
        is_active: true,
      };

      if (editingEvent) {
        const { error } = await supabase
          .from('live_events')
          .update(eventData)
          .eq('id', editingEvent.id);
        
        if (error) throw error;
        toast.success('Event aktualisiert');
      } else {
        const { error } = await supabase
          .from('live_events')
          .insert(eventData);
        
        if (error) throw error;
        toast.success('Event erstellt');
      }

      setShowCreateDialog(false);
      resetForm();
      loadEvents();
    } catch (error) {
      console.error('Error saving event:', error);
      toast.error('Fehler beim Speichern');
    } finally {
      setSaving(false);
    }
  };

  const toggleLive = async (event: LiveEvent) => {
    try {
      const updates: Partial<LiveEvent> = {
        is_live: !event.is_live,
      };
      
      if (!event.is_live) {
        // Going live
        updates.started_at = new Date().toISOString();
        updates.ended_at = null;
      } else {
        // Ending stream
        updates.ended_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('live_events')
        .update(updates)
        .eq('id', event.id);

      if (error) throw error;
      
      toast.success(updates.is_live ? 'Stream gestartet!' : 'Stream beendet');
      loadEvents();
    } catch (error) {
      console.error('Error toggling live:', error);
      toast.error('Fehler beim Ändern des Status');
    }
  };

  const deleteEvent = async (eventId: string) => {
    if (!confirm('Event wirklich löschen?')) return;

    try {
      const { error } = await supabase
        .from('live_events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;
      toast.success('Event gelöscht');
      loadEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Fehler beim Löschen');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const liveEvent = events.find(e => e.is_live);
  const upcomingEvents = events.filter(e => !e.is_live && e.is_active);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Live Streaming</h1>
          <p className="text-muted-foreground">
            Starte und verwalte deine Live-Streams
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={(open) => {
          setShowCreateDialog(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Neues Event
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingEvent ? 'Event bearbeiten' : 'Neues Live Event'}
              </DialogTitle>
              <DialogDescription>
                Erstelle ein neues Live-Streaming Event für deine Kunden.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="title">Titel *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="z.B. Live DJ Set"
                />
              </div>

              <div>
                <Label htmlFor="stream_url">Stream URL *</Label>
                <Input
                  id="stream_url"
                  value={formData.stream_url}
                  onChange={(e) => setFormData({ ...formData, stream_url: e.target.value })}
                  placeholder="https://..."
                />
                <p className="text-xs text-muted-foreground mt-1">
                  YouTube, Twitch, oder eigener Stream
                </p>
              </div>

              <div>
                <Label htmlFor="event_type">Event-Typ</Label>
                <Select 
                  value={formData.event_type} 
                  onValueChange={(v) => setFormData({ ...formData, event_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="host_name">Host Name</Label>
                <Input
                  id="host_name"
                  value={formData.host_name}
                  onChange={(e) => setFormData({ ...formData, host_name: e.target.value })}
                  placeholder={partnerInfo?.partnerName || 'Name des Hosts'}
                />
              </div>

              <div>
                <Label htmlFor="scheduled_start">Geplanter Start</Label>
                <Input
                  id="scheduled_start"
                  type="datetime-local"
                  value={formData.scheduled_start}
                  onChange={(e) => setFormData({ ...formData, scheduled_start: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="description">Beschreibung</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Was erwartet die Zuschauer?"
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Abbrechen
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <LoadingSpinner size="sm" /> : editingEvent ? 'Speichern' : 'Erstellen'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Currently Live */}
      {liveEvent && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="overflow-hidden border-2 border-destructive/50 bg-gradient-to-br from-destructive/10 to-background">
            <div className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="destructive" className="animate-pulse">
                      <span className="h-2 w-2 bg-white rounded-full mr-1.5 animate-ping" />
                      LIVE
                    </Badge>
                    <Badge variant="outline">{EVENT_TYPES.find(t => t.value === liveEvent.event_type)?.label}</Badge>
                  </div>
                  <h2 className="text-xl font-bold mb-1">{liveEvent.title}</h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    {liveEvent.description || 'Keine Beschreibung'}
                  </p>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1.5">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                      <span>{liveEvent.viewer_count} Zuschauer</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>
                        Seit {liveEvent.started_at ? format(new Date(liveEvent.started_at), 'HH:mm', { locale: de }) : '-'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Button 
                    variant="destructive" 
                    size="lg"
                    onClick={() => toggleLive(liveEvent)}
                  >
                    <Square className="h-4 w-4 mr-2" />
                    Stream beenden
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => openEditDialog(liveEvent)}>
                    <Settings className="h-4 w-4 mr-1" />
                    Bearbeiten
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Quick Start - Only show if not live */}
      {!liveEvent && events.length > 0 && (
        <Card className="p-6 bg-gradient-to-br from-primary/5 to-background">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center">
              <Radio className="h-7 w-7 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Schnellstart</h3>
              <p className="text-sm text-muted-foreground">
                Wähle ein vorbereitetes Event und gehe sofort live
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Events List */}
      <div>
        <h3 className="text-lg font-semibold mb-4">
          {events.length === 0 ? 'Keine Events' : `Deine Events (${events.length})`}
        </h3>
        
        {events.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="h-16 w-16 rounded-full bg-muted mx-auto flex items-center justify-center mb-4">
              <Video className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-2">Noch keine Events</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Erstelle dein erstes Live-Streaming Event
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Event erstellen
            </Button>
          </Card>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {events.filter(e => !e.is_live).map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "h-12 w-12 rounded-xl flex items-center justify-center shrink-0",
                        event.is_active 
                          ? "bg-primary/10 text-primary" 
                          : "bg-muted text-muted-foreground"
                      )}>
                        <Video className="h-6 w-6" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold truncate">{event.title}</span>
                          <Badge variant="secondary" className="text-xs shrink-0">
                            {EVENT_TYPES.find(t => t.value === event.event_type)?.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          {event.scheduled_start && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(event.scheduled_start), 'dd.MM.yyyy HH:mm', { locale: de })}
                            </span>
                          )}
                          {event.host_name && (
                            <span>Host: {event.host_name}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => toggleLive(event)}
                          disabled={!!liveEvent}
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Live gehen
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(event)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteEvent(event.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Tips */}
      <Card className="p-5 bg-muted/50">
        <h4 className="font-semibold mb-3 flex items-center gap-2">
          <Wifi className="h-4 w-4 text-primary" />
          Streaming-Tipps
        </h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <ChevronRight className="h-4 w-4 shrink-0 mt-0.5" />
            <span>Verwende eine stabile Internetverbindung (mindestens 10 Mbit/s Upload)</span>
          </li>
          <li className="flex items-start gap-2">
            <ChevronRight className="h-4 w-4 shrink-0 mt-0.5" />
            <span>Teste deinen Stream vor dem offiziellen Start</span>
          </li>
          <li className="flex items-start gap-2">
            <ChevronRight className="h-4 w-4 shrink-0 mt-0.5" />
            <span>Kündige deinen Stream vorab auf Social Media an</span>
          </li>
        </ul>
      </Card>
    </div>
  );
}
