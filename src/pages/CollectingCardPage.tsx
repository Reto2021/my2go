import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ShoppingBag, Users, Calendar, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { CollectingGrid } from "@/components/collecting/CollectingGrid";
import { CollectingMilestone } from "@/components/collecting/CollectingMilestone";
import {
  useCollectingCampaign,
  useCollectingCard,
  useCollectingCells,
  useSponsoredCells,
} from "@/hooks/useCollectingCard";
import { useAuthSafe } from "@/contexts/AuthContext";
import { TalerIcon } from "@/components/icons/TalerIcon";

export default function CollectingCardPage() {
  const { slug } = useParams<{ slug: string }>();
  const auth = useAuthSafe();
  const userId = auth?.user?.id;

  const { data: campaign, isLoading: campLoading } = useCollectingCampaign(slug);
  const { data: card, isLoading: cardLoading } = useCollectingCard(campaign?.id, userId);
  const { data: cells = [] } = useCollectingCells(card?.id);
  const { data: sponsoredCells = [] } = useSponsoredCells(campaign?.id);

  if (campLoading || cardLoading) {
    return (
      <div className="container max-w-lg mx-auto px-4 py-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="container max-w-lg mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold mb-2">Kampagne nicht gefunden</h1>
        <p className="text-muted-foreground mb-6">Diese Sammelkarte existiert nicht oder ist nicht mehr aktiv.</p>
        <Link to="/">
          <Button variant="outline">Zurück zur Startseite</Button>
        </Link>
      </div>
    );
  }

  const totalPurchases = card?.total_purchases ?? 0;
  const progress = Math.min((totalPurchases / campaign.required_purchases) * 100, 100);
  const uniqueShops = new Set(cells.map((c) => c.partner_id)).size;
  const isCompleted = card?.is_completed ?? false;
  const milestones = (campaign.milestones || []) as Array<{
    at_purchase: number;
    type: string;
    value: number;
    label?: string;
  }>;

  return (
    <div className="container max-w-lg mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/">
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold">{campaign.title}</h1>
          {campaign.subtitle && (
            <p className="text-sm text-muted-foreground">{campaign.subtitle}</p>
          )}
        </div>
        {campaign.logo_url && (
          <img src={campaign.logo_url} alt="" className="h-10 w-10 rounded-lg object-contain" />
        )}
      </div>

      {/* Progress Card */}
      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">
              {totalPurchases} / {campaign.required_purchases} Einkäufe
            </span>
          </div>
          {isCompleted && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/15 text-accent text-xs font-bold"
            >
              <Trophy className="h-3 w-3" />
              Komplett!
            </motion.div>
          )}
        </div>
        <Progress value={progress} className="h-2" />
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {uniqueShops} Shops besucht
          </span>
          {campaign.ends_at && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              bis {new Date(campaign.ends_at).toLocaleDateString("de-CH")}
            </span>
          )}
        </div>
      </Card>

      {/* Milestones */}
      <CollectingMilestone
        milestones={milestones}
        currentPurchases={totalPurchases}
        requiredPurchases={campaign.required_purchases}
      />

      {/* Grid */}
      <CollectingGrid
        gridSize={campaign.grid_size}
        requiredPurchases={campaign.required_purchases}
        currentPosition={card?.current_position ?? 0}
        cells={cells}
        sponsoredCells={sponsoredCells}
        milestones={milestones}
        isCompleted={isCompleted}
      />

      {/* Prize description */}
      {campaign.prize_description && (
        <Card className="p-4 bg-accent/5 border-accent/20">
          <div className="flex items-start gap-3">
            <Trophy className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-sm mb-1">Dein Preis</h3>
              <p className="text-sm text-muted-foreground">{campaign.prize_description}</p>
              {campaign.prize_taler && campaign.prize_taler > 0 && (
                <div className="flex items-center gap-1 mt-1">
                  <TalerIcon className="h-3.5 w-3.5" />
                  <span className="text-sm font-bold text-accent">{campaign.prize_taler} Taler</span>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Info */}
      {!userId && (
        <Card className="p-4 text-center">
          <p className="text-sm text-muted-foreground mb-3">
            Melde dich an, um deine Sammelkarte zu starten!
          </p>
          <Link to="/auth">
            <Button size="sm">Anmelden</Button>
          </Link>
        </Card>
      )}
    </div>
  );
}
