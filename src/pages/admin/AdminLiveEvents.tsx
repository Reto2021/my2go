import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { 
  Radio, 
  Tv, 
  Users, 
  Calendar,
  Play,
  Trash2,
  Plus,
  ExternalLink,
  Save,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { LiveIndicator } from '@/components/radio/LiveEventsPanel';
import { EVENT_TYPES, EventType, LiveEvent, useLiveEventsStore } from '@/lib/live-events-store';
import { supabase } from '@/integrations/supabase/client';

interface EventFormData {
  title: string;
  description: string;
  type: EventType;
  streamUrl: string;
  hostName: string;
  isLive: boolean;
  isFeatured: boolean;
}

const initialFormData: EventFormData = {
  title: '',
  description: '',
  type: 'concert',
  streamUrl: '',
  hostName: '',
  isLive: false,
  isFeatured: false
};

const AdminLiveEvents = () => {
  const { events, fetchEvents, isLoadingEvents } = useLiveEventsStore();
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<EventFormData>(initialFormData);
  const [isSaving, setIsSaving] = useState(false);
  
  // Fetch events on mount
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);
  
  const handleCreate = () => {
    setIsCreating(true);
    setEditingId(null);
    setFormData(initialFormData);
  };
  
  const handleEdit = (event: LiveEvent) => {
    setEditingId(event.id);
    setIsCreating(false);
    setFormData({
      title: event.title,
      description: event.description || '',
      type: event.type,
      streamUrl: event.streamUrl,
      hostName: event.hostName || '',
      isLive: event.isLive,
      isFeatured: event.isFeatured
    });
  };
  
  const handleSave = async () => {
    if (!formData.title || !formData.streamUrl) {
      toast.error('Titel und Stream-URL sind erforderlich');
      return;
    }
    
    setIsSaving(true);
    
    try {
      if (isCreating) {
        const { error } = await supabase
          .from('live_events')
          .insert({
            title: formData.title,
            description: formData.description || null,
            event_type: formData.type,
            stream_url: formData.streamUrl,
            host_name: formData.hostName || null,
            is_live: formData.isLive,
            is_featured: formData.isFeatured
          });
        
        if (error) throw error;
        toast.success('Event erstellt!');
      } else if (editingId) {
        const { error } = await supabase
          .from('live_events')
          .update({
            title: formData.title,
            description: formData.description || null,
            event_type: formData.type,
            stream_url: formData.streamUrl,
            host_name: formData.hostName || null,
            is_live: formData.isLive,
            is_featured: formData.isFeatured,
            started_at: formData.isLive ? new Date().toISOString() : null
          })
          .eq('id', editingId);
        
        if (error) throw error;
        toast.success('Event aktualisiert!');
      }
      
      await fetchEvents();
      setIsCreating(false);
      setEditingId(null);
      setFormData(initialFormData);
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Fehler beim Speichern');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('live_events')
        .update({ is_active: false })
        .eq('id', id);
      
      if (error) throw error;
      toast.success('Event gelöscht');
      await fetchEvents();
    } catch (error) {
      toast.error('Fehler beim Löschen');
    }
  };
  
  const handleToggleLive = async (id: string, currentlyLive: boolean) => {
    try {
      const { error } = await supabase
        .from('live_events')
        .update({ 
          is_live: !currentlyLive,
          started_at: !currentlyLive ? new Date().toISOString() : null,
          ended_at: currentlyLive ? new Date().toISOString() : null
        })
        .eq('id', id);
      
      if (error) throw error;
      await fetchEvents();
      toast.success(currentlyLive ? 'Stream beendet' : 'Stream gestartet!');
    } catch (error) {
      toast.error('Fehler beim Aktualisieren');
    }
  };
  
  const liveCount = events.filter(e => e.isLive).length;
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Tv className="h-6 w-6" />
            Live Events
          </h1>
          <p className="text-muted-foreground">
            Verwalte Live-Übertragungen (Konzerte, Gottesdienste, etc.)
          </p>
        </div>
        <div className="flex items-center gap-3">
          {liveCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 text-green-600 rounded-full text-sm">
              <LiveIndicator size="sm" />
              {liveCount} Live
            </div>
          )}
          <Button onClick={handleCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Neues Event
          </Button>
        </div>
      </div>
      
      {/* Create/Edit Form */}
      <AnimatePresence>
        {(isCreating || editingId) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>
                  {isCreating ? 'Neues Event erstellen' : 'Event bearbeiten'}
                </CardTitle>
                <CardDescription>
                  Externe Live-Streams wie Konzerte oder Gottesdienste hinzufügen
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Titel</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="z.B. Sonntagskonzert"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Event-Typ</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value: EventType) => setFormData({ ...formData, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(EVENT_TYPES).map(([key, info]) => (
                          <SelectItem key={key} value={key}>
                            <span className="flex items-center gap-2">
                              <span>{info.emoji}</span>
                              <span>{info.label}</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Stream-URL (HLS/RTMP)</Label>
                  <Input
                    value={formData.streamUrl}
                    onChange={(e) => setFormData({ ...formData, streamUrl: e.target.value })}
                    placeholder="https://example.com/stream.m3u8"
                  />
                  <p className="text-xs text-muted-foreground">
                    Unterstützt HLS (.m3u8) und RTMP Streams
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label>Host/Veranstalter</Label>
                  <Input
                    value={formData.hostName}
                    onChange={(e) => setFormData({ ...formData, hostName: e.target.value })}
                    placeholder="z.B. Konzerthalle Berlin"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Beschreibung</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Kurze Beschreibung des Events..."
                    rows={3}
                  />
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.isLive}
                      onCheckedChange={(checked) => setFormData({ ...formData, isLive: checked })}
                    />
                    <Label>Jetzt Live</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.isFeatured}
                      onCheckedChange={(checked) => setFormData({ ...formData, isFeatured: checked })}
                    />
                    <Label>Featured</Label>
                  </div>
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Speichern
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsCreating(false);
                      setEditingId(null);
                    }}
                  >
                    Abbrechen
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Events List */}
      <div className="grid gap-4">
        {isLoadingEvents ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : events.length === 0 ? (
          <Card className="p-8 text-center">
            <Tv className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">Noch keine Events erstellt</p>
            <Button onClick={handleCreate} variant="link" className="mt-2">
              Erstes Event erstellen
            </Button>
          </Card>
        ) : (
          events.map((event) => {
            const typeInfo = EVENT_TYPES[event.type] || EVENT_TYPES.other;
            
            return (
              <Card key={event.id} className={cn(
                "transition-all",
                event.isLive && "border-green-500/50 bg-green-500/5"
              )}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Icon */}
                    <div className={cn(
                      "h-14 w-14 rounded-lg flex items-center justify-center flex-shrink-0",
                      "bg-gradient-to-br",
                      typeInfo.color
                    )}>
                      <span className="text-2xl">{typeInfo.emoji}</span>
                    </div>
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold truncate">{event.title}</span>
                        {event.isLive && <LiveIndicator size="sm" />}
                        {event.isFeatured && (
                          <span className="px-1.5 py-0.5 bg-yellow-500/20 text-yellow-600 text-xs rounded">
                            Featured
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {event.hostName || 'Kein Host angegeben'}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {event.viewerCount}
                        </span>
                        <span className="px-1.5 py-0.5 bg-muted rounded">
                          {typeInfo.label}
                        </span>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant={event.isLive ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleToggleLive(event.id, event.isLive)}
                        className={cn(
                          "gap-1",
                          event.isLive && "bg-green-500 hover:bg-green-600"
                        )}
                      >
                        <Play className="h-3 w-3" />
                        {event.isLive ? 'Live' : 'Start'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(event)}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(event.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
      
      {/* Info Box */}
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <h3 className="font-medium mb-2 flex items-center gap-2">
            <Radio className="h-4 w-4" />
            Community Live Stage
          </h3>
          <p className="text-sm text-muted-foreground mb-3">
            Neben externen Streams können User auch selbst als Host live gehen:
          </p>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Nutze <strong>Dance Party → Live Stage</strong> im Radio Player</li>
            <li>Wähle "Als Host" um mit Kamera/Mikrofon zu streamen</li>
            <li>Unbegrenzte Zuschauer können zuschauen und reagieren</li>
            <li>Perfekt für Community-Events, DJ-Sets oder spontane Streams</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLiveEvents;
