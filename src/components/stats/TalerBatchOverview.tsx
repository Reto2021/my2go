import { useTalerBatches, formatMonthName, formatExpiryDate, daysUntilExpiry } from '@/hooks/useTalerBatches';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Calendar, Coins, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface TalerBatchOverviewProps {
  userId: string | null;
}

export function TalerBatchOverview({ userId }: TalerBatchOverviewProps) {
  const { batches, totalExpiringSoon, isLoading } = useTalerBatches(userId);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-8 bg-muted rounded" />
            <div className="h-8 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (batches.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            Taler-Gültigkeit
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Noch keine Taler gesammelt. Hör Radio oder besuche einen Partner!
          </p>
        </CardContent>
      </Card>
    );
  }

  // Calculate total remaining
  const totalRemaining = batches.reduce((sum, b) => sum + b.amount_remaining, 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-5 w-5 text-primary" />
            Taler-Gültigkeit
          </CardTitle>
          <Badge variant="secondary" className="font-mono">
            {totalRemaining.toLocaleString('de-CH')} Taler
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Älteste Taler werden zuerst verwendet (FIFO)
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Warning for expiring soon */}
        {totalExpiringSoon > 0 && (
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-sm">
              <span className="font-semibold text-amber-600 dark:text-amber-400">
                {totalExpiringSoon} Taler
              </span>{' '}
              <span className="text-muted-foreground">
                verfallen diesen Monat – jetzt einlösen!
              </span>
            </div>
          </div>
        )}

        {/* Batch list */}
        <div className="space-y-2">
          {batches.map((batch, index) => {
            const days = daysUntilExpiry(batch.expires_at);
            const isExpiringSoon = batch.status === 'expiring_soon';
            const percentOfTotal = totalRemaining > 0 
              ? (batch.amount_remaining / totalRemaining) * 100 
              : 0;

            return (
              <motion.div
                key={batch.earn_month}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "p-3 rounded-lg border transition-colors",
                  isExpiringSoon 
                    ? "bg-amber-500/5 border-amber-500/20" 
                    : "bg-muted/30 border-border/50"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Coins className={cn(
                      "h-4 w-4",
                      isExpiringSoon ? "text-amber-500" : "text-primary"
                    )} />
                    <span className="font-medium text-sm">
                      {formatMonthName(batch.earn_month)}
                    </span>
                  </div>
                  <span className={cn(
                    "font-bold tabular-nums",
                    isExpiringSoon ? "text-amber-600 dark:text-amber-400" : "text-foreground"
                  )}>
                    {batch.amount_remaining.toLocaleString('de-CH')}
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>
                      Gültig bis {formatExpiryDate(batch.expires_at)}
                    </span>
                  </div>
                  {isExpiringSoon && (
                    <Badge variant="outline" className="text-amber-600 border-amber-500/30 text-xs py-0">
                      {days <= 0 ? 'Heute' : `${days} Tage`}
                    </Badge>
                  )}
                </div>

                {/* Visual proportion bar */}
                <Progress 
                  value={percentOfTotal} 
                  className={cn(
                    "h-1 mt-2",
                    isExpiringSoon && "[&>div]:bg-amber-500"
                  )} 
                />
              </motion.div>
            );
          })}
        </div>

        {/* Info text */}
        <p className="text-xs text-muted-foreground text-center pt-2">
          Taler verfallen 6 Monate nach Erhalt am Monatsersten.
        </p>
      </CardContent>
    </Card>
  );
}
