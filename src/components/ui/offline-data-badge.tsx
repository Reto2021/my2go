import { WifiOff, RefreshCw, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface OfflineDataBadgeProps {
  isFromCache: boolean;
  lastUpdated: Date | null;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  className?: string;
}

export function OfflineDataBadge({
  isFromCache,
  lastUpdated,
  onRefresh,
  isRefreshing,
  className,
}: OfflineDataBadgeProps) {
  if (!isFromCache) return null;

  return (
    <div className={cn(
      "flex items-center gap-2 text-sm text-muted-foreground animate-in fade-in slide-in-from-top-2",
      className
    )}>
      <Badge variant="secondary" className="gap-1.5 bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
        <WifiOff className="h-3 w-3" />
        Offline-Daten
      </Badge>
      
      {lastUpdated && (
        <span className="flex items-center gap-1 text-xs">
          <Clock className="h-3 w-3" />
          {formatDistanceToNow(lastUpdated, { addSuffix: true, locale: de })}
        </span>
      )}
      
      {onRefresh && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="h-6 px-2 text-xs"
        >
          <RefreshCw className={cn("h-3 w-3", isRefreshing && "animate-spin")} />
        </Button>
      )}
    </div>
  );
}
