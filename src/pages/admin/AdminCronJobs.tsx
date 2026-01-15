import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  Clock, 
  RefreshCw, 
  Play, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Calendar,
  Timer,
  Zap
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

interface CronJob {
  jobid: number;
  schedule: string;
  command: string;
  nodename: string;
  nodeport: number;
  database: string;
  username: string;
  active: boolean;
  jobname: string;
}

interface CronJobRun {
  runid: number;
  jobid: number;
  job_pid: number;
  database: string;
  username: string;
  command: string;
  status: string;
  return_message: string;
  start_time: string;
  end_time: string;
}

export default function AdminCronJobs() {
  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [recentRuns, setRecentRuns] = useState<CronJobRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadCronData();
  }, []);

  const loadCronData = async () => {
    setRefreshing(true);
    try {
      // Use raw SQL via edge function or direct rpc call with type assertion
      const { data: jobsData, error: jobsError } = await supabase
        .rpc('get_cron_jobs' as any);

      if (jobsError) {
        console.error('Error loading cron jobs:', jobsError);
        // Jobs may not exist yet
      } else if (jobsData) {
        setJobs(jobsData as CronJob[]);
      }

      // Load recent job runs
      const { data: runsData, error: runsError } = await supabase
        .rpc('get_cron_job_runs' as any);

      if (runsError) {
        console.error('Error loading cron runs:', runsError);
      } else if (runsData) {
        setRecentRuns(runsData as CronJobRun[]);
      }
    } catch (error) {
      console.error('Failed to load cron data:', error);
      toast.error('Cron-Daten konnten nicht geladen werden');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const triggerManualSync = async () => {
    try {
      toast.info('Starte manuelle Synchronisation...');
      
      const { data, error } = await supabase.functions.invoke('sync-google-reviews', {
        body: { action: 'sync-all' }
      });

      if (error) throw error;

      toast.success(`Sync abgeschlossen! ${data?.synced || 0} Partner synchronisiert.`);
      loadCronData();
    } catch (error) {
      console.error('Manual sync failed:', error);
      toast.error('Manuelle Synchronisation fehlgeschlagen');
    }
  };

  const getScheduleDescription = (schedule: string): string => {
    const parts = schedule.split(' ');
    if (parts.length !== 5) return schedule;
    
    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
    
    // Common patterns
    if (schedule === '* * * * *') return 'Jede Minute';
    if (schedule === '0 * * * *') return 'Jede Stunde';
    if (schedule === '0 0 * * *') return 'Täglich um Mitternacht';
    if (schedule === '0 3 * * *') return 'Täglich um 03:00 Uhr';
    if (minute === '0' && hour !== '*' && dayOfMonth === '*') {
      return `Täglich um ${hour.padStart(2, '0')}:00 Uhr`;
    }
    if (dayOfWeek === '0') return 'Jeden Sonntag';
    if (dayOfWeek === '1') return 'Jeden Montag';
    
    return schedule;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'succeeded':
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-destructive" />;
      case 'running':
        return <RefreshCw className="h-4 w-4 text-primary animate-spin" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'succeeded':
        return <Badge variant="outline" className="bg-success/10 text-success border-success/30">Erfolgreich</Badge>;
      case 'failed':
        return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">Fehlgeschlagen</Badge>;
      case 'running':
        return <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">Läuft</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Clock className="h-6 w-6 text-primary" />
            Cron-Jobs
          </h1>
          <p className="text-muted-foreground">
            Automatisierte Aufgaben und deren Ausführungshistorie
          </p>
        </div>
        <Button 
          onClick={loadCronData} 
          variant="outline"
          disabled={refreshing}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Aktualisieren
        </Button>
      </div>

      {/* Active Cron Jobs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Timer className="h-5 w-5 text-primary" />
            Geplante Aufgaben
          </CardTitle>
          <CardDescription>
            Alle aktiven Cron-Jobs im System
          </CardDescription>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Keine Cron-Jobs gefunden</p>
              <p className="text-sm mt-1">Die Cron-Jobs werden möglicherweise erst nach der ersten Ausführung angezeigt.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => (
                <div 
                  key={job.jobid}
                  className="flex items-center justify-between p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${job.active ? 'bg-success/10' : 'bg-muted'}`}>
                      <Zap className={`h-5 w-5 ${job.active ? 'text-success' : 'text-muted-foreground'}`} />
                    </div>
                    <div>
                      <p className="font-medium">{job.jobname || `Job #${job.jobid}`}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{getScheduleDescription(job.schedule)}</span>
                        <span className="text-muted-foreground/50">|</span>
                        <code className="text-xs bg-muted px-1 rounded">{job.schedule}</code>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={job.active ? 'default' : 'secondary'}>
                      {job.active ? 'Aktiv' : 'Inaktiv'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5 text-primary" />
            Schnellaktionen
          </CardTitle>
          <CardDescription>
            Manuelle Ausführung von geplanten Aufgaben
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <Button 
              onClick={triggerManualSync}
              variant="outline"
              className="h-auto py-4 flex-col gap-2"
            >
              <RefreshCw className="h-6 w-6 text-primary" />
              <div className="text-center">
                <p className="font-medium">Google Reviews Sync</p>
                <p className="text-xs text-muted-foreground">Alle Partner synchronisieren</p>
              </div>
            </Button>
            
            <Button 
              variant="outline"
              className="h-auto py-4 flex-col gap-2"
              onClick={() => {
                toast.info('Streak-Reminder wird normalerweise automatisch gesendet');
              }}
            >
              <Clock className="h-6 w-6 text-orange-500" />
              <div className="text-center">
                <p className="font-medium">Streak-Reminder</p>
                <p className="text-xs text-muted-foreground">Push-Benachrichtigungen senden</p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Job Runs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-success" />
            Letzte Ausführungen
          </CardTitle>
          <CardDescription>
            Historie der letzten Cron-Job-Ausführungen
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentRuns.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Keine Ausführungen gefunden</p>
              <p className="text-sm mt-1">Die Historie wird nach der ersten Ausführung angezeigt.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentRuns.slice(0, 10).map((run) => (
                <div 
                  key={run.runid}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(run.status)}
                    <div>
                      <p className="font-medium text-sm">Job #{run.jobid}</p>
                      <p className="text-xs text-muted-foreground">
                        {run.start_time && formatDistanceToNow(new Date(run.start_time), { 
                          addSuffix: true,
                          locale: de 
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(run.status)}
                    {run.return_message && run.status === 'failed' && (
                      <span className="text-xs text-destructive max-w-[200px] truncate" title={run.return_message}>
                        {run.return_message}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Box */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <Clock className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">Über Cron-Jobs</h3>
              <p className="text-sm text-muted-foreground">
                Cron-Jobs werden automatisch im Hintergrund ausgeführt. Der Google Reviews Sync 
                läuft täglich um 03:00 Uhr und synchronisiert die Bewertungen aller Partner mit 
                gültiger Google Place ID. Bei Fehlern werden diese hier protokolliert.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
