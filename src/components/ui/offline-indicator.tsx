import { useState, useEffect } from 'react';
import { WifiOff, CloudOff, RefreshCw, Check, ChevronDown, ChevronUp, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useOnlineStatus, PendingAction } from '@/hooks/useOnlineStatus';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

const actionTypeLabels: Record<PendingAction['type'], string> = {
  redemption: 'Einlösung',
  code_claim: 'Code einlösen',
  streak_claim: 'Streak-Bonus',
  profile_update: 'Profil-Update',
  other: 'Aktion',
};

export function OfflineIndicator() {
  const { isOnline, wasOffline, pendingActions, pendingCount, clearWasOffline } = useOnlineStatus();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showBackOnline, setShowBackOnline] = useState(false);

  // Show "back online" toast when coming back online
  useEffect(() => {
    if (isOnline && wasOffline) {
      setShowBackOnline(true);
      const timer = setTimeout(() => {
        setShowBackOnline(false);
        clearWasOffline();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline, clearWasOffline]);

  // Don't render anything if online and no pending actions and not showing back online toast
  if (isOnline && pendingCount === 0 && !showBackOnline) {
    return null;
  }

  return (
    <>

      {/* Offline Banner */}
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="fixed top-0 left-0 right-0 z-[99] overflow-hidden"
          >
            <div 
              className={cn(
                "bg-amber-500 text-white transition-all duration-300",
                isExpanded ? "pb-3" : ""
              )}
            >
              {/* Main Banner */}
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between px-4 py-2 text-left"
              >
                <div className="flex items-center gap-2">
                  <WifiOff className="h-4 w-4 animate-pulse" />
                  <span className="text-sm font-medium">
                    Du bist offline
                    {pendingCount > 0 && (
                      <span className="ml-2 bg-white/20 px-2 py-0.5 rounded-full text-xs">
                        {pendingCount} ausstehend
                      </span>
                    )}
                  </span>
                </div>
                {pendingCount > 0 && (
                  isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )
                )}
              </button>

              {/* Expanded Pending Actions List */}
              <AnimatePresence>
                {isExpanded && pendingCount > 0 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 space-y-2 max-h-40 overflow-y-auto">
                      {pendingActions.map((action) => (
                        <div
                          key={action.id}
                          className="flex items-center gap-3 bg-white/10 rounded-lg px-3 py-2"
                        >
                          <CloudOff className="h-4 w-4 flex-shrink-0 opacity-70" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {action.description}
                            </p>
                            <p className="text-xs opacity-70">
                              {actionTypeLabels[action.type]} • {formatDistanceToNow(action.timestamp, { locale: de, addSuffix: true })}
                            </p>
                          </div>
                          <Clock className="h-3 w-3 opacity-50" />
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-center opacity-70 mt-2 px-4">
                      Aktionen werden synchronisiert, sobald du wieder online bist
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Syncing Indicator (when back online with pending actions) */}
      <AnimatePresence>
        {isOnline && pendingCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-0 left-0 right-0 z-[99] bg-blue-500 text-white"
          >
            <div className="flex items-center justify-center gap-2 px-4 py-2">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span className="text-sm font-medium">
                Synchronisiere {pendingCount} Aktion{pendingCount > 1 ? 'en' : ''}...
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
