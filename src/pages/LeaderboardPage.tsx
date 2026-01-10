import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Trophy, 
  Medal, 
  Crown, 
  Flame, 
  ChevronRight, 
  Settings2,
  User,
  Eye,
  EyeOff,
  Coins,
  ArrowLeft
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { useAuth } from "@/contexts/AuthContext";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { format, startOfWeek, endOfWeek } from "date-fns";
import { de } from "date-fns/locale";
import talerCoin from "@/assets/taler-coin.png";

export default function LeaderboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    leaderboard, 
    userRank, 
    isLoading, 
    currentNickname,
    isParticipating,
    updateSettings,
    isUpdating
  } = useLeaderboard();
  
  const [showSettings, setShowSettings] = useState(false);
  const [nickname, setNickname] = useState(currentNickname);
  const [participateEnabled, setParticipateEnabled] = useState(isParticipating);

  // Week date range
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const weekRange = `${format(weekStart, "d.", { locale: de })} - ${format(weekEnd, "d. MMMM", { locale: de })}`;

  const handleSaveSettings = () => {
    if (participateEnabled && !nickname.trim()) {
      toast.error("Bitte gib einen Nickname ein, um teilzunehmen");
      return;
    }
    
    updateSettings(
      { nickname: nickname.trim(), showOnLeaderboard: participateEnabled },
      {
        onSuccess: () => {
          toast.success("Einstellungen gespeichert");
          setShowSettings(false);
        },
        onError: () => {
          toast.error("Fehler beim Speichern");
        }
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 bg-background">
      {/* Header */}
      <header className="sticky top-20 z-40 bg-background/95 backdrop-blur-lg">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="btn-ghost p-2 -ml-2">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-lg font-semibold flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-500" />
                Leaderboard
              </h1>
              <p className="text-xs text-muted-foreground">{weekRange}</p>
            </div>
          </div>
          
          {user && (
            <button
              onClick={() => {
                setNickname(currentNickname);
                setParticipateEnabled(isParticipating);
                setShowSettings(true);
              }}
              className="p-2 rounded-xl hover:bg-muted transition-colors"
            >
              <Settings2 className="h-5 w-5 text-muted-foreground" />
            </button>
          )}
        </div>
      </header>

      <div className="container py-6 space-y-6">
        {/* User's own rank card */}
        {user && userRank && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-2xl bg-gradient-to-br from-primary/10 via-card to-accent/5 border border-primary/20"
          >
            {userRank.is_participating ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                    {userRank.rank ? (
                      <span className="text-lg font-bold text-primary">#{userRank.rank}</span>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Dein Rang</p>
                    <p className="text-sm text-muted-foreground">
                      {userRank.weekly_earned} Taler diese Woche
                    </p>
                  </div>
                </div>
                <Flame className="h-6 w-6 text-orange-500" />
              </div>
            ) : (
              <div className="text-center py-2">
                <p className="text-muted-foreground text-sm mb-2">
                  Du nimmst noch nicht am Leaderboard teil
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSettings(true)}
                  className="gap-2"
                >
                  <User className="h-4 w-4" />
                  Jetzt teilnehmen
                </Button>
              </div>
            )}
          </motion.div>
        )}

        {/* Top 3 Podium */}
        {leaderboard.length >= 3 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-end justify-center gap-2 py-4"
          >
            {/* 2nd Place */}
            <PodiumSpot entry={leaderboard[1]} position={2} delay={0.4} />
            
            {/* 1st Place */}
            <PodiumSpot entry={leaderboard[0]} position={1} delay={0.3} />
            
            {/* 3rd Place */}
            <PodiumSpot entry={leaderboard[2]} position={3} delay={0.5} />
          </motion.div>
        )}

        {/* Rankings List */}
        <div className="space-y-2">
          {leaderboard.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">
                Noch keine Teilnehmer diese Woche
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Sei der Erste im Leaderboard!
              </p>
            </div>
          ) : (
            leaderboard.slice(3).map((entry, index) => (
              <LeaderboardRow 
                key={entry.nickname} 
                entry={entry} 
                index={index + 4}
                delay={0.6 + index * 0.05}
              />
            ))
          )}
        </div>

        {/* Info */}
        <div className="p-4 rounded-2xl bg-muted/50">
          <p className="text-sm text-muted-foreground text-center">
            Das Leaderboard zeigt die aktivsten Taler-Sammler der aktuellen Woche.
            Nur Nutzer mit Nickname werden angezeigt.
          </p>
        </div>
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center"
            onClick={() => setShowSettings(false)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="bg-card border border-border rounded-t-2xl sm:rounded-2xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Settings2 className="h-5 w-5 text-primary" />
                Leaderboard Einstellungen
              </h2>

              <div className="space-y-5">
                {/* Nickname input */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Dein Nickname
                  </label>
                  <Input
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="z.B. TalerKing2024"
                    maxLength={20}
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Max. 20 Zeichen. Wird öffentlich im Leaderboard angezeigt.
                  </p>
                </div>

                {/* Participate toggle */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
                  <div className="flex items-center gap-3">
                    {participateEnabled ? (
                      <Eye className="h-5 w-5 text-primary" />
                    ) : (
                      <EyeOff className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div>
                      <p className="font-medium">Im Leaderboard anzeigen</p>
                      <p className="text-xs text-muted-foreground">
                        Dein Nickname wird öffentlich sichtbar
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={participateEnabled}
                    onCheckedChange={setParticipateEnabled}
                  />
                </div>

                {/* Save button */}
                <Button
                  className="w-full"
                  onClick={handleSaveSettings}
                  disabled={isUpdating}
                >
                  {isUpdating ? "Speichern..." : "Speichern"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface PodiumSpotProps {
  entry: {
    rank: number;
    nickname: string;
    weekly_earned: number;
    avatar_url: string | null;
  };
  position: 1 | 2 | 3;
  delay: number;
}

function PodiumSpot({ entry, position, delay }: PodiumSpotProps) {
  const heights = { 1: "h-24", 2: "h-16", 3: "h-12" };
  const colors = { 
    1: "from-amber-400 to-amber-600", 
    2: "from-slate-300 to-slate-500", 
    3: "from-orange-300 to-orange-500" 
  };
  const icons = {
    1: <Crown className="h-6 w-6 text-amber-400" />,
    2: <Medal className="h-5 w-5 text-slate-400" />,
    3: <Medal className="h-5 w-5 text-orange-400" />
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: "spring" }}
      className="flex flex-col items-center"
    >
      {/* Avatar & Crown */}
      <div className="relative mb-2">
        {position === 1 && (
          <motion.div
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: delay + 0.2, type: "spring" }}
            className="absolute -top-4 left-1/2 -translate-x-1/2"
          >
            {icons[1]}
          </motion.div>
        )}
        <div 
          className={`${position === 1 ? 'w-16 h-16' : 'w-12 h-12'} rounded-full bg-gradient-to-br ${colors[position]} flex items-center justify-center text-white font-bold shadow-lg`}
        >
          {entry.nickname.charAt(0).toUpperCase()}
        </div>
      </div>

      {/* Name & Points */}
      <p className="text-xs font-semibold text-foreground truncate max-w-[80px] text-center">
        {entry.nickname}
      </p>
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <img src={talerCoin} alt="" className="w-3 h-3" />
        {entry.weekly_earned}
      </div>

      {/* Podium */}
      <motion.div
        initial={{ height: 0 }}
        animate={{ height: "auto" }}
        transition={{ delay: delay + 0.1, duration: 0.3 }}
        className={`mt-2 w-20 ${heights[position]} bg-gradient-to-t ${colors[position]} rounded-t-lg flex items-center justify-center`}
      >
        <span className="text-2xl font-extrabold text-white/90">
          {position}
        </span>
      </motion.div>
    </motion.div>
  );
}

interface LeaderboardRowProps {
  entry: {
    rank: number;
    nickname: string;
    weekly_earned: number;
    avatar_url: string | null;
  };
  index: number;
  delay: number;
}

function LeaderboardRow({ entry, index, delay }: LeaderboardRowProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border"
    >
      {/* Rank */}
      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
        <span className="text-sm font-bold text-muted-foreground">{index}</span>
      </div>

      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
        <span className="font-semibold text-foreground">
          {entry.nickname.charAt(0).toUpperCase()}
        </span>
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground truncate">{entry.nickname}</p>
      </div>

      {/* Points */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10">
        <img src={talerCoin} alt="" className="w-4 h-4" />
        <span className="font-semibold text-amber-600">{entry.weekly_earned}</span>
      </div>
    </motion.div>
  );
}
