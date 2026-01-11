import { useEffect, useState, useRef, forwardRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Confetti } from '@/components/ui/confetti';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { 
  ArrowLeft, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Gift, 
  Store, 
  Calendar,
  MapPin,
  Phone,
  ExternalLink,
  Share2,
  MessageCircle,
  Instagram,
  Download,
  Radio,
  Coins
} from 'lucide-react';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';
import { format, formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import logoRadio2go from '@/assets/logo-radio2go.png';
import html2canvas from 'html2canvas';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// Instagram Share Card Component (inline to avoid circular dependencies)
interface ShareCardProps {
  rewardTitle: string;
  partnerName: string;
  partnerLogo?: string | null;
  savedAmount?: number | null;
  savedPercent?: number | null;
  talerSpent: number;
  isRedeemed: boolean;
}

const InstagramShareCard = forwardRef<HTMLDivElement, ShareCardProps>(
  function InstagramShareCard(props, ref) {
    const { rewardTitle, partnerName, partnerLogo, savedAmount, savedPercent, talerSpent, isRedeemed } = props;
    
    const savingsText = savedAmount ? `${savedAmount}€ gespart` : savedPercent ? `${savedPercent}% Rabatt` : null;

    return (
      <div
        ref={ref}
        className="w-[360px] h-[640px] relative overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, hsl(200 50% 66%) 0%, hsl(200 55% 75%) 40%, hsl(200 60% 85%) 100%)',
        }}
      >
        {/* Floating coins */}
        <div className="absolute top-12 left-6 w-10 h-10 opacity-60">
          <Coins className="w-full h-full text-accent" />
        </div>
        <div className="absolute top-32 right-8 w-8 h-8 opacity-50">
          <Coins className="w-full h-full text-accent" />
        </div>
        <div className="absolute bottom-48 right-12 w-8 h-8 opacity-50">
          <Coins className="w-full h-full text-accent" />
        </div>

        {/* Main Content */}
        <div className="relative z-10 h-full flex flex-col items-center justify-center px-8 py-12">
          <div className="mb-6">
            <img src={logoRadio2go} alt="Radio 2Go" className="h-10 object-contain" />
          </div>

          <div 
            className="px-4 py-2 rounded-full mb-6"
            style={{ 
              background: isRedeemed 
                ? 'linear-gradient(135deg, hsl(160 84% 39%) 0%, hsl(160 84% 30%) 100%)' 
                : 'linear-gradient(135deg, hsl(44 98% 49%) 0%, hsl(40 98% 40%) 100%)',
              color: isRedeemed ? 'white' : 'hsl(197 96% 12%)',
            }}
          >
            <span className="font-bold text-sm uppercase tracking-wide">
              {isRedeemed ? '✓ Eingelöst!' : '🎁 Mein Gutschein'}
            </span>
          </div>

          <div 
            className="w-full rounded-3xl p-6 mb-6"
            style={{ 
              background: 'rgba(255, 255, 255, 0.95)',
              boxShadow: '0 20px 40px rgba(2, 63, 90, 0.2)',
            }}
          >
            <div className="flex items-center gap-4 mb-4">
              {partnerLogo ? (
                <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gray-100 flex-shrink-0">
                  <OptimizedImage 
                    src={partnerLogo} 
                    alt={partnerName} 
                    width={56}
                    height={56}
                    className="w-full h-full rounded-2xl"
                    priority
                  />
                </div>
              ) : (
                <div 
                  className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, hsl(200 50% 66%) 0%, hsl(200 55% 75%) 100%)' }}
                >
                  <Gift className="w-7 h-7 text-white" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-500 font-medium">Bei</p>
                <p className="text-lg font-bold text-gray-900 truncate">{partnerName}</p>
              </div>
            </div>

            <h2 className="text-xl font-bold mb-4 leading-tight" style={{ color: 'hsl(197 96% 18%)' }}>
              {rewardTitle}
            </h2>

            {savingsText && (
              <div 
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full"
                style={{ 
                  background: 'linear-gradient(135deg, hsl(44 98% 49% / 0.2) 0%, hsl(44 98% 49% / 0.3) 100%)',
                  border: '2px solid hsl(44 98% 49%)',
                }}
              >
                <span className="text-2xl">💰</span>
                <span className="font-bold text-lg" style={{ color: 'hsl(197 96% 18%)' }}>
                  {savingsText}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 px-5 py-3 rounded-2xl mb-8" style={{ background: 'rgba(255, 255, 255, 0.7)' }}>
            <Coins className="w-8 h-8 text-accent" />
            <span className="font-bold text-lg" style={{ color: 'hsl(197 96% 18%)' }}>
              {talerSpent} Taler eingesetzt
            </span>
          </div>

          <div className="text-center">
            <p className="text-white font-semibold text-base mb-2" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
              Auch sparen? Hol dir die App!
            </p>
            <div className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl" style={{ background: 'hsl(197 96% 18%)', color: 'white' }}>
              <Radio className="w-5 h-5" />
              <span className="font-bold">radio2go.fm</span>
            </div>
          </div>
        </div>

        <div 
          className="absolute bottom-0 left-0 right-0 h-20"
          style={{ background: 'linear-gradient(to top, hsl(197 96% 18% / 0.8), hsl(197 96% 18% / 0.4), transparent)' }}
        />
      </div>
    );
  }
);

interface RedemptionDetail {
  id: string;
  redemption_code: string;
  qr_payload: string | null;
  status: 'pending' | 'used' | 'expired' | 'cancelled';
  taler_spent: number;
  created_at: string;
  expires_at: string;
  redeemed_at: string | null;
  reward: {
    id: string;
    title: string;
    description: string | null;
    image_url: string | null;
    terms: string | null;
    reward_type: string;
    value_amount: number | null;
    value_percent: number | null;
  } | null;
  partner: {
    id: string;
    name: string;
    logo_url: string | null;
    address_street: string | null;
    address_number: string | null;
    city: string | null;
    postal_code: string | null;
    phone: string | null;
    website: string | null;
  } | null;
}

const statusConfig = {
  pending: {
    label: 'Aktiv',
    description: 'Zeige diesen QR-Code beim Partner vor',
    icon: Clock,
    className: 'bg-accent/15 text-accent border-accent/30',
    bgClass: 'bg-accent/5',
  },
  used: {
    label: 'Eingelöst',
    description: 'Dieser Gutschein wurde erfolgreich eingelöst',
    icon: CheckCircle,
    className: 'bg-success/15 text-success border-success/30',
    bgClass: 'bg-success/5',
  },
  expired: {
    label: 'Abgelaufen',
    description: 'Die Gültigkeitsdauer ist abgelaufen',
    icon: AlertCircle,
    className: 'bg-muted text-muted-foreground border-border',
    bgClass: 'bg-muted/50',
  },
  cancelled: {
    label: 'Storniert',
    description: 'Dieser Gutschein wurde storniert',
    icon: XCircle,
    className: 'bg-destructive/15 text-destructive border-destructive/30',
    bgClass: 'bg-destructive/5',
  },
};

export default function RedemptionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [redemption, setRedemption] = useState<RedemptionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInstagramDialog, setShowInstagramDialog] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const shareCardRef = useRef<HTMLDivElement>(null);

  // Trigger confetti when redemption is successfully used
  useEffect(() => {
    if (redemption?.status === 'used') {
      // Check if this is the first time viewing after redemption (within 30 seconds)
      const redeemedAt = redemption.redeemed_at ? new Date(redemption.redeemed_at).getTime() : 0;
      const now = Date.now();
      const isRecentlyRedeemed = now - redeemedAt < 30000; // 30 seconds
      
      if (isRecentlyRedeemed) {
        // Small delay for dramatic effect
        const timer = setTimeout(() => {
          setShowConfetti(true);
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [redemption?.status, redemption?.redeemed_at]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }

    if (user && id) {
      fetchRedemption();
    }
  }, [user, authLoading, id, navigate]);

  const fetchRedemption = async () => {
    try {
      const { data, error } = await supabase
        .from('redemptions')
        .select(`
          id,
          redemption_code,
          qr_payload,
          status,
          taler_spent,
          created_at,
          expires_at,
          redeemed_at,
          reward:rewards(
            id, 
            title, 
            description, 
            image_url, 
            terms, 
            reward_type,
            value_amount,
            value_percent
          ),
          partner:partners(
            id, 
            name, 
            logo_url, 
            address_street, 
            address_number, 
            city, 
            postal_code, 
            phone,
            website
          )
        `)
        .eq('id', id)
        .eq('user_id', user!.id)
        .maybeSingle();

      if (error) throw error;
      
      if (!data) {
        setError('Einlösung nicht gefunden');
        return;
      }
      
      setRedemption(data as unknown as RedemptionDetail);
    } catch (err) {
      console.error('Error fetching redemption:', err);
      setError('Fehler beim Laden der Einlösung');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !redemption) {
    return (
      <div className="container pb-24">
        <header className="py-4 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="btn-ghost p-2 -ml-2">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold">Einlösung</h1>
        </header>
        <div className="text-center py-12">
          <p className="text-muted-foreground">{error || 'Nicht gefunden'}</p>
          <Button onClick={() => navigate('/my-redemptions')} className="mt-4">
            Zurück zur Übersicht
          </Button>
        </div>
      </div>
    );
  }

  const expiresAt = new Date(redemption.expires_at);
  const isExpired = expiresAt.getTime() < Date.now();
  // Show as expired if expires_at has passed and status is still pending
  const effectiveStatus = (redemption.status === 'pending' && isExpired) ? 'expired' : redemption.status;
  const config = statusConfig[effectiveStatus];
  const StatusIcon = config.icon;
  const isPending = effectiveStatus === 'pending';
  const isExpiringSoon = isPending && expiresAt.getTime() - Date.now() < 24 * 60 * 60 * 1000;

  const partnerAddress = [
    redemption.partner?.address_street,
    redemption.partner?.address_number,
  ].filter(Boolean).join(' ');
  
  const partnerLocation = [
    redemption.partner?.postal_code,
    redemption.partner?.city,
  ].filter(Boolean).join(' ');

  const qrValue = redemption.qr_payload || redemption.redemption_code;

  // Share functionality
  const getShareText = () => {
    const partnerName = redemption.partner?.name || 'einem Partner';
    const rewardTitle = redemption.reward?.title || 'Gutschein';
    
    if (redemption.status === 'used') {
      return `🎉 Ich habe gerade "${rewardTitle}" bei ${partnerName} eingelöst! Mit My 2Go spare ich richtig Geld. 💰`;
    }
    return `🎁 Ich habe mir "${rewardTitle}" bei ${partnerName} gesichert! Sammle auch du 2Go Taler und hol dir tolle Gutscheine! 🎧`;
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(getShareText() + `\n\nJetzt anmelden: ${window.location.origin}/auth`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleShareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My 2Go',
          text: getShareText(),
          url: `${window.location.origin}/auth`,
        });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(getShareText() + `\n\n${window.location.origin}/auth`);
      toast.success('Text kopiert!');
    } catch {
      toast.error('Kopieren fehlgeschlagen');
    }
  };

  const handleInstagramShare = () => {
    setShowInstagramDialog(true);
  };

  const handleDownloadShareCard = async () => {
    if (!shareCardRef.current) return;
    
    setGeneratingImage(true);
    try {
      const canvas = await html2canvas(shareCardRef.current, {
        scale: 2,
        backgroundColor: null,
        useCORS: true,
        allowTaint: true,
      });
      
      const dataUrl = canvas.toDataURL('image/png');
      
      // Try native share with file (mobile)
      if (navigator.share && navigator.canShare) {
        try {
          const response = await fetch(dataUrl);
          const blob = await response.blob();
          const file = new File([blob], 'radio2go-share.png', { type: 'image/png' });
          
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: 'Radio 2Go Gutschein',
              text: 'Schau mal, was ich bei Radio 2Go gespart habe! 🎧💰',
            });
            setShowInstagramDialog(false);
            return;
          }
        } catch (shareError) {
          console.log('Native share failed, falling back to download');
        }
      }
      
      // Fallback: download the image
      const link = document.createElement('a');
      link.download = 'radio2go-story.png';
      link.href = dataUrl;
      link.click();
      
      toast.success('Bild heruntergeladen! Öffne Instagram und teile es in deiner Story.');
    } catch (err) {
      console.error('Error generating share card:', err);
      toast.error('Fehler beim Erstellen des Bildes');
    } finally {
      setGeneratingImage(false);
    }
  };

  return (
    <div className="min-h-screen pb-24 bg-background">
      {/* Confetti Animation with Success Message */}
      <Confetti 
        isActive={showConfetti} 
        duration={4000} 
        particleCount={60}
        showMessage={true}
        message="🎉 Erfolgreich eingelöst!"
        subMessage="Geniesse deinen Vorteil!"
        playSound={true}
      />
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border/50">
        <div className="container py-4 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="btn-ghost p-2 -ml-2">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold">Gutschein-Details</h1>
        </div>
      </header>

      <div className="container py-6 space-y-6">
        {/* Status Banner */}
        <div className={cn('rounded-2xl p-4', config.bgClass)}>
          <div className="flex items-center gap-3">
            <div className={cn('p-2 rounded-xl', config.className)}>
              <StatusIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold">{config.label}</p>
              <p className="text-sm text-muted-foreground">{config.description}</p>
            </div>
          </div>
        </div>

        {/* QR Code Section - Only for pending */}
        {isPending && (
          <Card className="overflow-hidden border-2 border-accent/30">
            <CardContent className="p-6">
              <div className="flex flex-col items-center">
                <div className="bg-white p-4 rounded-2xl shadow-lg mb-4">
                  <QRCodeSVG 
                    value={qrValue} 
                    size={200}
                    level="H"
                    includeMargin={true}
                  />
                </div>
                
                <p className="text-sm text-muted-foreground mb-2">Einlösecode</p>
                <code className="text-2xl font-mono font-bold text-secondary tracking-wider">
                  {redemption.redemption_code}
                </code>
                
                {isExpiringSoon && (
                  <div className="mt-4 flex items-center gap-2 text-destructive">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      Läuft in {formatDistanceToNow(expiresAt, { locale: de })} ab!
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Reward Info */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-4">
              {redemption.reward?.image_url ? (
                <div className="flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-muted">
                  <OptimizedImage
                    src={redemption.reward.image_url}
                    alt={redemption.reward.title}
                    width={80}
                    height={80}
                    className="w-full h-full rounded-xl"
                  />
                </div>
              ) : (
                <div className="flex-shrink-0 w-20 h-20 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Gift className="w-8 h-8 text-secondary" />
                </div>
              )}
              
              <div className="flex-1">
                <h2 className="font-bold text-lg text-foreground">
                  {redemption.reward?.title || 'Gutschein'}
                </h2>
                {redemption.reward?.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {redemption.reward.description}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <Coins className="w-4 h-4" />
                  <span className="text-sm font-semibold text-secondary">
                    {redemption.taler_spent} Taler
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Partner Info */}
        {redemption.partner && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <Store className="w-5 h-5 text-muted-foreground" />
                <h3 className="font-semibold">Einlösbar bei</h3>
              </div>
              
              <div className="flex gap-4">
                {redemption.partner.logo_url ? (
                  <div className="flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden bg-muted">
                    <OptimizedImage
                      src={redemption.partner.logo_url}
                      alt={redemption.partner.name}
                      width={56}
                      height={56}
                      className="w-full h-full rounded-xl"
                    />
                  </div>
                ) : (
                  <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-muted flex items-center justify-center">
                    <Store className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
                
                <div className="flex-1 space-y-2">
                  <p className="font-semibold">{redemption.partner.name}</p>
                  
                  {(partnerAddress || partnerLocation) && (
                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <div>
                        {partnerAddress && <p>{partnerAddress}</p>}
                        {partnerLocation && <p>{partnerLocation}</p>}
                      </div>
                    </div>
                  )}
                  
                  {redemption.partner.phone && (
                    <a 
                      href={`tel:${redemption.partner.phone}`}
                      className="flex items-center gap-2 text-sm text-secondary hover:underline"
                    >
                      <Phone className="w-4 h-4" />
                      {redemption.partner.phone}
                    </a>
                  )}
                  
                  {redemption.partner.website && (
                    <a 
                      href={redemption.partner.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-secondary hover:underline"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Website besuchen
                    </a>
                  )}
                </div>
              </div>
              
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => navigate(`/partner/${redemption.partner?.id}`)}
              >
                Partner-Seite öffnen
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Timeline / Details */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <h3 className="font-semibold">Zeitverlauf</h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-sm text-muted-foreground">Eingelöst am</span>
                <span className="text-sm font-medium">
                  {format(new Date(redemption.created_at), 'dd.MM.yyyy, HH:mm', { locale: de })}
                </span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-sm text-muted-foreground">Gültig bis</span>
                <span className={cn(
                  'text-sm font-medium',
                  isExpiringSoon && 'text-destructive'
                )}>
                  {format(expiresAt, 'dd.MM.yyyy, HH:mm', { locale: de })}
                </span>
              </div>
              
              {redemption.status === 'used' && redemption.redeemed_at && (
                <div className="flex justify-between items-center py-2 border-b border-border/50">
                  <span className="text-sm text-muted-foreground">Beim Partner eingelöst</span>
                  <span className="text-sm font-medium text-success">
                    {format(new Date(redemption.redeemed_at), 'dd.MM.yyyy, HH:mm', { locale: de })}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Terms */}
        {redemption.reward?.terms && (
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-2">Bedingungen</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {redemption.reward.terms}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Share Section */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <Share2 className="w-5 h-5 text-muted-foreground" />
              <h3 className="font-semibold">Teilen & Freunde einladen</h3>
            </div>
            
            <p className="text-sm text-muted-foreground mb-4">
              Teile deine Ersparnis mit Freunden und lade sie zu Radio 2Go ein!
            </p>
            
            <div className="grid grid-cols-3 gap-3">
              <Button
                variant="outline"
                className="flex-1 bg-[#25D366]/10 border-[#25D366]/30 text-[#25D366] hover:bg-[#25D366]/20"
                onClick={handleShareWhatsApp}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                WhatsApp
              </Button>
              
              <Button
                variant="outline"
                className="flex-1 bg-gradient-to-r from-[#833AB4]/10 via-[#FD1D1D]/10 to-[#FCAF45]/10 border-[#E1306C]/30 text-[#E1306C] hover:from-[#833AB4]/20 hover:via-[#FD1D1D]/20 hover:to-[#FCAF45]/20"
                onClick={handleInstagramShare}
              >
                <Instagram className="w-4 h-4 mr-2" />
                Story
              </Button>
              
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleShareNative}
              >
                <Share2 className="w-4 h-4 mr-2" />
                Teilen
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Back Button */}
        <Button
          variant="outline"
          className="w-full"
          onClick={() => navigate('/my-redemptions')}
        >
          Zurück zur Übersicht
        </Button>
      </div>

      {/* Instagram Share Dialog */}
      <Dialog open={showInstagramDialog} onOpenChange={setShowInstagramDialog}>
        <DialogContent className="max-w-[400px] p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="flex items-center gap-2">
              <Instagram className="w-5 h-5 text-[#E1306C]" />
              Instagram Story erstellen
            </DialogTitle>
          </DialogHeader>
          
          <div className="p-4 space-y-4">
            {/* Preview Card */}
            <div className="flex justify-center overflow-hidden rounded-2xl shadow-lg">
              <div className="transform scale-[0.55] origin-top -mb-[288px]">
                <InstagramShareCard
                  ref={shareCardRef}
                  rewardTitle={redemption.reward?.title || 'Gutschein'}
                  partnerName={redemption.partner?.name || 'Partner'}
                  partnerLogo={redemption.partner?.logo_url}
                  savedAmount={redemption.reward?.value_amount}
                  savedPercent={redemption.reward?.value_percent}
                  talerSpent={redemption.taler_spent}
                  isRedeemed={redemption.status === 'used'}
                />
              </div>
            </div>
            
            <div className="space-y-3">
              <Button
                className="w-full bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#FCAF45] hover:opacity-90"
                onClick={handleDownloadShareCard}
                disabled={generatingImage}
              >
                {generatingImage ? (
                  <LoadingSpinner />
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Bild speichern & in Story teilen
                  </>
                )}
              </Button>
              
              <p className="text-xs text-center text-muted-foreground">
                Das Bild wird gespeichert. Öffne dann Instagram und teile es in deiner Story!
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
