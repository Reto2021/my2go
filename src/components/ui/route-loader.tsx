import { motion } from 'framer-motion';
import { LoadingSpinner } from './loading-spinner';

export function RouteLoader() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen flex items-center justify-center bg-background"
    >
      <div className="flex flex-col items-center gap-4">
        <LoadingSpinner size="lg" />
        <p className="text-sm text-muted-foreground animate-pulse">
          Lädt...
        </p>
      </div>
    </motion.div>
  );
}
