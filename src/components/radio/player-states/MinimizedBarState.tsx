import { motion } from "framer-motion";
import { ChevronUp } from "lucide-react";
import { hapticToggle } from "@/lib/haptics";
import { Equalizer } from "../Equalizer";
import { formatTime } from "../utils";

interface NowPlaying {
  title?: string;
  artist?: string;
  artworkUrl?: string;
}

interface MinimizedBarStateProps {
  nowPlaying: NowPlaying | null;
  elapsed: number;
  onRestore: () => void;
}

export function MinimizedBarState({
  nowPlaying,
  elapsed,
  onRestore,
}: MinimizedBarStateProps) {
  return (
    <motion.div
      key="minimized-bar"
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 40, opacity: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={{ top: 0.5, bottom: 0.3 }}
      onDragEnd={(_, info) => {
        // Swipe up to restore mini player
        if (info.offset.y < -30 || info.velocity.y < -150) {
          hapticToggle();
          onRestore();
        }
      }}
      onClick={() => {
        hapticToggle();
        onRestore();
      }}
      className="rounded-full bg-secondary/90 backdrop-blur-sm shadow-lg px-4 py-2 flex items-center gap-3 cursor-pointer hover:bg-secondary transition-colors"
    >
      {/* Equalizer */}
      <Equalizer className="flex-shrink-0" />

      {/* Now Playing */}
      <p className="text-xs text-secondary-foreground font-medium truncate flex-1">
        {nowPlaying?.title || "Radio 2Go läuft"}
      </p>

      {/* Session time */}
      <span className="text-xs text-secondary-foreground/60 tabular-nums">
        {formatTime(elapsed)}
      </span>

      {/* Swipe up hint */}
      <ChevronUp className="h-4 w-4 text-secondary-foreground/40" />
    </motion.div>
  );
}
