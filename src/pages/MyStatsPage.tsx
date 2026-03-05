import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useBadges } from "@/hooks/useBadges";
import { format, subDays, startOfDay, eachDayOfInterval } from "date-fns";
import { de } from "date-fns/locale";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import {
  Radio,
  Flame,
  Award,
  TrendingUp,
  Clock,
  Calendar,
  Target,
  ChevronRight,
  ArrowLeft,
  Coins,
  Trophy,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { TalerBatchOverview } from "@/components/stats/TalerBatchOverview";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface ListeningSession {
  id: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  taler_awarded: number | null;
}

interface DailyListeningData {
  date: string;
  dateLabel: string;
  minutes: number;
  taler: number;
}

interface StreakHistoryEntry {
  date: string;
  dateLabel: string;
  streak: number;
  claimed: boolean;
}

export default function MyStatsPage() {
  const navigate = useNavigate();
  const { user, balance } = useAuth();
  const { allBadges, userBadges, progress, getProgressForBadge } = useBadges();
  const [period, setPeriod] = useState<"7d" | "14d" | "30d">("14d");

  const periodDays = period === "7d" ? 7 : period === "14d" ? 14 : 30;

  // Fetch listening sessions
  const { data: listeningSessions, isLoading: loadingSessions } = useQuery({
    queryKey: ["my-listening-sessions", user?.id, period],
    queryFn: async () => {
      if (!user) return [];
      const startDate = subDays(new Date(), periodDays);
      const { data, error } = await supabase
        .from("radio_listening_sessions")
        .select("*")
        .eq("user_id", user.id)
        .gte("started_at", startDate.toISOString())
        .order("started_at", { ascending: false });
      if (error) throw error;
      return data as ListeningSession[];
    },
    enabled: !!user,
  });

  // Fetch listening stats
  const { data: listeningStats } = useQuery({
    queryKey: ["my-listening-stats", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("user_listening_stats")
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
    enabled: !!user,
  });

  // Process listening data for chart
  const dailyListeningData: DailyListeningData[] = useMemo(() => {
    const days = eachDayOfInterval({
      start: subDays(new Date(), periodDays - 1),
      end: new Date(),
    });

    return days.map((day) => {
      const dayStart = startOfDay(day);
      const dayStr = format(day, "yyyy-MM-dd");
      const daySessions =
        listeningSessions?.filter((s) => {
          const sessionDate = format(new Date(s.started_at), "yyyy-MM-dd");
          return sessionDate === dayStr;
        }) || [];

      const totalSeconds = daySessions.reduce(
        (sum, s) => sum + (s.duration_seconds || 0),
        0
      );
      const totalTaler = daySessions.reduce(
        (sum, s) => sum + (s.taler_awarded || 0),
        0
      );

      return {
        date: dayStr,
        dateLabel: format(day, "dd.MM", { locale: de }),
        minutes: Math.round(totalSeconds / 60),
        taler: totalTaler,
      };
    });
  }, [listeningSessions, periodDays]);

  // Calculate totals for the period
  const periodStats = useMemo(() => {
    const totalMinutes = dailyListeningData.reduce((sum, d) => sum + d.minutes, 0);
    const totalTaler = dailyListeningData.reduce((sum, d) => sum + d.taler, 0);
    const activeDays = dailyListeningData.filter((d) => d.minutes > 0).length;
    return { totalMinutes, totalTaler, activeDays };
  }, [dailyListeningData]);

  // Badge categories with progress
  const categoryLabels: Record<string, { label: string; icon: React.ElementType }> = {
    general: { label: "Allgemein", icon: Award },
    streak: { label: "Bonus-Serie", icon: Flame },
    leaderboard: { label: "Rangliste", icon: Trophy },
    collector: { label: "Sammler", icon: Target },
    social: { label: "Social", icon: TrendingUp },
  };

  // Group badges by category with progress
  const badgeProgressByCategory = useMemo(() => {
    const result: Record<
      string,
      Array<{
        badge: (typeof allBadges)[0];
        earned: boolean;
        progress: number;
        progressPercent: number;
      }>
    > = {};

    allBadges.forEach((badge) => {
      if (!result[badge.category]) result[badge.category] = [];
      const earned = userBadges.some((ub) => ub.badge_id === badge.id);
      const currentProgress = getProgressForBadge(badge);
      const progressPercent = Math.min(
        100,
        (currentProgress / badge.criteria_value) * 100
      );

      result[badge.category].push({
        badge,
        earned,
        progress: currentProgress,
        progressPercent,
      });
    });

    return result;
  }, [allBadges, userBadges, getProgressForBadge]);

  // Calculate overall badge progress
  const overallBadgeStats = useMemo(() => {
    const total = allBadges.length;
    const earned = userBadges.length;
    const percent = total > 0 ? Math.round((earned / total) * 100) : 0;
    return { total, earned, percent };
  }, [allBadges, userBadges]);

  if (!user) {
    return (
      <div className="min-h-screen bg-background p-4">
        <Card>
          <CardContent className="p-8 text-center">
            <Award className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              Melde dich an, um deine Statistiken zu sehen.
            </p>
            <Button asChild className="mt-4">
              <Link to="/auth">Anmelden</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border/50">
        <div className="container py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Meine Statistiken</h1>
              <p className="text-sm text-muted-foreground">
                Dein persönlicher Fortschritt
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-6 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Coins className="h-4 w-4 text-primary" />
                  <span className="text-xs text-muted-foreground">Guthaben</span>
                </div>
                <p className="text-2xl font-bold text-primary">
                  {balance?.taler_balance?.toLocaleString("de-CH") || 0}
                </p>
                <p className="text-xs text-muted-foreground">Taler</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="h-4 w-4 text-accent" />
                  <span className="text-xs text-muted-foreground">Abzeichen</span>
                </div>
                <p className="text-2xl font-bold text-accent">
                  {overallBadgeStats.earned}/{overallBadgeStats.total}
                </p>
                <p className="text-xs text-muted-foreground">
                  {overallBadgeStats.percent}% erreicht
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Gesamt gehört</span>
                </div>
                <p className="text-2xl font-bold">
                  {Math.round((listeningStats?.total_duration_seconds || 0) / 3600)}h
                </p>
                <p className="text-xs text-muted-foreground">Stunden Soundtrack</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Flame className="h-4 w-4 text-orange-500" />
                  <span className="text-xs text-muted-foreground">Längste Serie</span>
                </div>
                <p className="text-2xl font-bold">
                  {listeningStats?.longest_streak_days || progress?.streak_days || 0}
                </p>
                <p className="text-xs text-muted-foreground">Tage in Folge</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Listening History Chart */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Radio className="h-5 w-5 text-primary" />
                  Hörzeit-Verlauf
                </CardTitle>
                <div className="flex gap-1">
                  {(["7d", "14d", "30d"] as const).map((p) => (
                    <Button
                      key={p}
                      variant={period === p ? "default" : "ghost"}
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => setPeriod(p)}
                    >
                      {p === "7d" ? "7T" : p === "14d" ? "14T" : "30T"}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="flex gap-4 mt-2">
                <div>
                  <p className="text-2xl font-bold">{periodStats.totalMinutes}</p>
                  <p className="text-xs text-muted-foreground">Minuten</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-primary">
                    +{periodStats.totalTaler}
                  </p>
                  <p className="text-xs text-muted-foreground">Taler verdient</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{periodStats.activeDays}</p>
                  <p className="text-xs text-muted-foreground">Aktive Tage</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingSessions ? (
                <div className="h-48 flex items-center justify-center">
                  <LoadingSpinner />
                </div>
              ) : (
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={dailyListeningData}>
                      <defs>
                        <linearGradient id="colorMinutes" x1="0" y1="0" x2="0" y2="1">
                          <stop
                            offset="5%"
                            stopColor="hsl(var(--primary))"
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor="hsl(var(--primary))"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <XAxis
                        dataKey="dateLabel"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                        interval="preserveStartEnd"
                      />
                      <YAxis hide />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-popover border rounded-lg p-2 shadow-lg text-sm">
                                <p className="font-medium">
                                  {payload[0].payload.dateLabel}
                                </p>
                                <p className="text-muted-foreground">
                                  {payload[0].value} Minuten
                                </p>
                                <p className="text-primary">
                                  +{payload[0].payload.taler} Taler
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="minutes"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        fill="url(#colorMinutes)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Badge Progress */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Award className="h-5 w-5 text-accent" />
                  Abzeichen-Fortschritt
                </CardTitle>
                <Link to="/badges">
                  <Button variant="ghost" size="sm" className="h-7 gap-1">
                    Alle anzeigen
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
              {/* Overall progress bar */}
              <div className="mt-3">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Gesamtfortschritt</span>
                  <span className="font-medium">
                    {overallBadgeStats.earned} / {overallBadgeStats.total}
                  </span>
                </div>
                <Progress value={overallBadgeStats.percent} className="h-2" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(badgeProgressByCategory).map(([category, badges]) => {
                const CategoryIcon = categoryLabels[category]?.icon || Award;
                const earnedInCategory = badges.filter((b) => b.earned).length;

                return (
                  <div key={category} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CategoryIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {categoryLabels[category]?.label || category}
                      </span>
                      <Badge variant="secondary" className="text-xs ml-auto">
                        {earnedInCategory}/{badges.length}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-5 gap-2">
                      {badges.slice(0, 5).map(({ badge, earned, progressPercent }) => (
                        <div
                          key={badge.id}
                          className={cn(
                            "relative aspect-square rounded-lg p-1.5 flex items-center justify-center",
                            earned
                              ? "bg-accent/20"
                              : "bg-muted/50 grayscale opacity-50"
                          )}
                        >
                          <div
                            className="text-xl"
                            style={{ color: earned ? badge.color : undefined }}
                          >
                            {badge.icon === "flame" && "🔥"}
                            {badge.icon === "award" && "🏆"}
                            {badge.icon === "trophy" && "🥇"}
                            {badge.icon === "star" && "⭐"}
                            {badge.icon === "crown" && "👑"}
                            {badge.icon === "gift" && "🎁"}
                            {badge.icon === "users" && "👥"}
                            {badge.icon === "heart" && "❤️"}
                            {badge.icon === "zap" && "⚡"}
                            {badge.icon === "medal" && "🏅"}
                            {!["flame", "award", "trophy", "star", "crown", "gift", "users", "heart", "zap", "medal"].includes(badge.icon) && "🎖️"}
                          </div>
                          {!earned && progressPercent > 0 && (
                            <div
                              className="absolute bottom-0 left-0 right-0 h-1 bg-primary/50 rounded-b"
                              style={{ width: `${progressPercent}%` }}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </motion.div>

        {/* Streak Calendar - Simple Visual */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-5 w-5 text-orange-500" />
                Aktivitäts-Kalender
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Deine aktiven Tage in den letzten {periodDays} Tagen
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1.5">
                {dailyListeningData.map((day, i) => {
                  const isActive = day.minutes > 0;
                  const intensity = Math.min(1, day.minutes / 60); // 60 min = full intensity

                  return (
                    <div
                      key={day.date}
                      className={cn(
                        "w-8 h-8 rounded-md flex items-center justify-center text-xs font-medium transition-colors",
                        isActive
                          ? "text-white"
                          : "bg-muted/30 text-muted-foreground"
                      )}
                      style={
                        isActive
                          ? {
                              backgroundColor: `hsl(var(--primary) / ${0.3 + intensity * 0.7})`,
                            }
                          : undefined
                      }
                      title={`${day.dateLabel}: ${day.minutes} Min`}
                    >
                      {format(new Date(day.date), "d")}
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-end gap-2 mt-3 text-xs text-muted-foreground">
                <span>Weniger</span>
                <div className="flex gap-0.5">
                  {[0.2, 0.4, 0.6, 0.8, 1].map((intensity) => (
                    <div
                      key={intensity}
                      className="w-3 h-3 rounded-sm"
                      style={{
                        backgroundColor: `hsl(var(--primary) / ${intensity})`,
                      }}
                    />
                  ))}
                </div>
                <span>Mehr</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Taler Batch Overview - Expiry Tracking */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
        >
          <TalerBatchOverview userId={user?.id || null} />
        </motion.div>

        {/* Lifetime Stats */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-5 w-5 text-green-500" />
                Lifetime Statistiken
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 rounded-lg bg-muted/30">
                  <p className="text-2xl font-bold">
                    {balance?.lifetime_earned?.toLocaleString("de-CH") || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Taler verdient</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/30">
                  <p className="text-2xl font-bold">
                    {balance?.lifetime_spent?.toLocaleString("de-CH") || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Taler eingelöst</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/30">
                  <p className="text-2xl font-bold">
                    {listeningStats?.total_sessions || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Radio-Sessions</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/30">
                  <p className="text-2xl font-bold">
                    {progress?.redemption_count || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">Einlösungen</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
