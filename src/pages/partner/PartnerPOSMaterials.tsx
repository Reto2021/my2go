import { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Download, 
  QrCode, 
  Sticker, 
  CreditCard, 
  Image as ImageIcon,
  Printer,
  Sparkles,
  Check,
  ExternalLink,
  Eye,
  X,
  UtensilsCrossed,
  Coffee,
  ShoppingBag,
  Scissors,
  FileText,
  Instagram,
  Share2,
  Layers
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePartner } from '@/components/partner/PartnerGuard';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import logo2Go from '@/assets/logo-2go.png';

interface PartnerDetails {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  category: string | null;
}

type PreviewType = 
  | 'qr-card' | 'sticker' | 'table-card' 
  | 'gastro-menu' | 'cafe-counter' | 'retail-checkout' | 'beauty-card'
  | 'a4-poster' | 'instagram-story' | 'instagram-post' 
  | null;

export default function PartnerPOSMaterials() {
  const { partnerInfo } = usePartner();
  const [downloadingItem, setDownloadingItem] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewType, setPreviewType] = useState<PreviewType>(null);
  
  // Hidden refs for PDF generation
  const qrCardRef = useRef<HTMLDivElement>(null);
  const stickerRef = useRef<HTMLDivElement>(null);
  const tableCardRef = useRef<HTMLDivElement>(null);
  const gastroMenuRef = useRef<HTMLDivElement>(null);
  const cafeCounterRef = useRef<HTMLDivElement>(null);
  const retailCheckoutRef = useRef<HTMLDivElement>(null);
  const beautyCardRef = useRef<HTMLDivElement>(null);
  const a4PosterRef = useRef<HTMLDivElement>(null);
  const instagramStoryRef = useRef<HTMLDivElement>(null);
  const instagramPostRef = useRef<HTMLDivElement>(null);

  const { data: partner, isLoading } = useQuery({
    queryKey: ['partner-details-pos', partnerInfo?.partnerId],
    queryFn: async () => {
      if (!partnerInfo?.partnerId) return null;
      
      const { data, error } = await supabase
        .from('partners')
        .select('id, name, slug, logo_url, category')
        .eq('id', partnerInfo.partnerId)
        .single();
      
      if (error) throw error;
      return data as PartnerDetails;
    },
    enabled: !!partnerInfo?.partnerId
  });

  // Base partner URL
  const basePartnerUrl = partner?.slug 
    ? `${window.location.origin}/partner/${partner.slug}`
    : '';

  // URLs with UTM tracking for each material type
  const getTrackedUrl = (campaign: string) => {
    if (!basePartnerUrl) return '';
    return `${basePartnerUrl}?utm_source=pos&utm_medium=qr&utm_campaign=${campaign}`;
  };

  const downloadPDF = async (
    elementRef: React.RefObject<HTMLDivElement>, 
    filename: string,
    orientation: 'portrait' | 'landscape' = 'portrait'
  ) => {
    if (!elementRef.current) return;
    
    setDownloadingItem(filename);
    
    try {
      const element = elementRef.current;
      element.style.position = 'absolute';
      element.style.left = '-9999px';
      element.style.display = 'block';
      
      const canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
      });
      
      element.style.display = 'none';
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation,
        unit: 'mm',
        format: 'a4',
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      
      const margin = 10;
      const availableWidth = pdfWidth - (2 * margin);
      const availableHeight = pdfHeight - (2 * margin);
      
      const scale = Math.min(
        availableWidth / (imgWidth / 3),
        availableHeight / (imgHeight / 3)
      );
      
      const scaledWidth = (imgWidth / 3) * scale;
      const scaledHeight = (imgHeight / 3) * scale;
      
      const x = (pdfWidth - scaledWidth) / 2;
      const y = (pdfHeight - scaledHeight) / 2;
      
      pdf.addImage(imgData, 'PNG', x, y, scaledWidth, scaledHeight);
      pdf.save(`${filename}.pdf`);
      
      toast.success('Download gestartet!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Fehler beim Erstellen des PDFs');
    } finally {
      setDownloadingItem(null);
    }
  };

  const downloadImage = async (
    elementRef: React.RefObject<HTMLDivElement>, 
    filename: string
  ) => {
    if (!elementRef.current) return;
    
    setDownloadingItem(filename);
    
    try {
      const element = elementRef.current;
      element.style.position = 'absolute';
      element.style.left = '-9999px';
      element.style.display = 'block';
      
      const canvas = await html2canvas(element, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
      });
      
      element.style.display = 'none';
      
      const link = document.createElement('a');
      link.download = `${filename}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      toast.success('Download gestartet!');
    } catch (error) {
      console.error('Error generating image:', error);
      toast.error('Fehler beim Erstellen des Bildes');
    } finally {
      setDownloadingItem(null);
    }
  };

  const downloadLogo = async () => {
    if (!partner?.logo_url) {
      toast.error('Kein Logo vorhanden');
      return;
    }
    
    setDownloadingItem('logo');
    
    try {
      const response = await fetch(partner.logo_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${partner.name.replace(/\s+/g, '-')}-logo.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Logo heruntergeladen!');
    } catch (error) {
      console.error('Error downloading logo:', error);
      toast.error('Fehler beim Herunterladen des Logos');
    } finally {
      setDownloadingItem(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const openPreview = (type: PreviewType) => {
    setPreviewType(type);
    setPreviewOpen(true);
  };

  const handleDownloadFromPreview = () => {
    if (!previewType) return;
    
    const refMap: Record<string, { ref: React.RefObject<HTMLDivElement>; isImage?: boolean }> = {
      'qr-card': { ref: qrCardRef },
      'sticker': { ref: stickerRef },
      'table-card': { ref: tableCardRef },
      'gastro-menu': { ref: gastroMenuRef },
      'cafe-counter': { ref: cafeCounterRef },
      'retail-checkout': { ref: retailCheckoutRef },
      'beauty-card': { ref: beautyCardRef },
      'a4-poster': { ref: a4PosterRef },
      'instagram-story': { ref: instagramStoryRef, isImage: true },
      'instagram-post': { ref: instagramPostRef, isImage: true },
    };

    const config = refMap[previewType];
    if (config) {
      if (config.isImage) {
        downloadImage(config.ref, `${partner?.name || 'Partner'}-${previewType}`);
      } else {
        downloadPDF(config.ref, `${partner?.name || 'Partner'}-${previewType}`);
      }
    }
  };

  const getPreviewTitle = () => {
    const titles: Record<string, string> = {
      'qr-card': 'QR-Code Karte',
      'sticker': 'Aufkleber',
      'table-card': 'Tischkarte',
      'gastro-menu': 'Menükarten-Einleger',
      'cafe-counter': 'Thekenaufsteller',
      'retail-checkout': 'Kassendisplay',
      'beauty-card': 'Terminkarten-Rückseite',
      'a4-poster': 'A4 Poster',
      'instagram-story': 'Instagram Story',
      'instagram-post': 'Instagram Post',
    };
    return titles[previewType || ''] || 'Vorschau';
  };

  // Standard materials
  const standardMaterials = [
    {
      id: 'qr-card' as const,
      title: 'QR-Code Karte',
      description: 'A6 Karte für Theke oder Kasse',
      icon: QrCode,
      color: 'from-primary/20 to-primary/5',
      borderColor: 'border-primary/20',
    },
    {
      id: 'sticker' as const,
      title: 'Aufkleber',
      description: 'Runder Aufkleber (8cm)',
      icon: Sticker,
      color: 'from-accent/20 to-accent/5',
      borderColor: 'border-accent/20',
    },
    {
      id: 'table-card' as const,
      title: 'Tischkarte',
      description: 'Faltbare Tischkarte',
      icon: CreditCard,
      color: 'from-success/20 to-success/5',
      borderColor: 'border-success/20',
    },
    {
      id: 'a4-poster' as const,
      title: 'A4 Poster',
      description: 'Für Schaufenster & Wände',
      icon: FileText,
      color: 'from-warning/20 to-warning/5',
      borderColor: 'border-warning/20',
    },
  ];

  // Industry materials
  const industryMaterials = [
    {
      id: 'gastro-menu' as const,
      title: 'Menükarten-Einleger',
      description: 'Eleganter Einleger für Speisekarten',
      icon: UtensilsCrossed,
      color: 'from-orange-500/20 to-orange-500/5',
      borderColor: 'border-orange-500/20',
      industry: 'Gastro',
    },
    {
      id: 'cafe-counter' as const,
      title: 'Thekenaufsteller',
      description: 'Kompakter Aufsteller für Cafés',
      icon: Coffee,
      color: 'from-amber-600/20 to-amber-600/5',
      borderColor: 'border-amber-600/20',
      industry: 'Café',
    },
    {
      id: 'retail-checkout' as const,
      title: 'Kassendisplay',
      description: 'Aufmerksamkeitsstarkes Display',
      icon: ShoppingBag,
      color: 'from-blue-500/20 to-blue-500/5',
      borderColor: 'border-blue-500/20',
      industry: 'Retail',
    },
    {
      id: 'beauty-card' as const,
      title: 'Terminkarten-Rückseite',
      description: 'Für Visitenkarten & Terminzettel',
      icon: Scissors,
      color: 'from-pink-500/20 to-pink-500/5',
      borderColor: 'border-pink-500/20',
      industry: 'Beauty',
    },
  ];

  // Social media materials
  const socialMaterials = [
    {
      id: 'instagram-story' as const,
      title: 'Instagram Story',
      description: '1080 × 1920 px',
      icon: Instagram,
      color: 'from-gradient-to-r from-purple-500/20 to-pink-500/5',
      borderColor: 'border-purple-500/20',
    },
    {
      id: 'instagram-post' as const,
      title: 'Instagram Post',
      description: '1080 × 1080 px',
      icon: Share2,
      color: 'from-fuchsia-500/20 to-fuchsia-500/5',
      borderColor: 'border-fuchsia-500/20',
    },
  ];

  interface MaterialItem {
    id: string;
    title: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    borderColor: string;
    industry?: string;
  }

  const MaterialCard = ({ material, downloadAction, previewAction }: { 
    material: MaterialItem; 
    downloadAction: () => void;
    previewAction: () => void;
  }) => (
    <Card 
      className={`relative overflow-hidden transition-all hover:shadow-lg ${material.borderColor}`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${material.color} pointer-events-none`} />
      <CardContent className="relative p-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-background/80 shadow-sm flex items-center justify-center flex-shrink-0">
            <material.icon className="h-5 w-5 text-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm">{material.title}</h3>
              {material.industry && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-background/80 text-muted-foreground">
                  {material.industry}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {material.description}
            </p>
            <div className="flex gap-2 mt-2">
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={previewAction}>
                <Eye className="h-3 w-3 mr-1" />
                Vorschau
              </Button>
              <Button size="sm" className="h-7 text-xs" onClick={downloadAction} disabled={downloadingItem === material.id}>
                {downloadingItem === material.id ? (
                  <LoadingSpinner size="sm" className="mr-1" />
                ) : (
                  <Download className="h-3 w-3 mr-1" />
                )}
                Download
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-accent p-6 text-primary-foreground">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iNCIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Printer className="h-5 w-5" />
            <span className="text-sm font-medium opacity-90">POS Materialien</span>
          </div>
          <h1 className="text-2xl font-bold mb-1">Werbematerialien</h1>
          <p className="text-sm opacity-80">
            Premium-Vorlagen für dein Geschäft – branchenspezifisch & social-ready.
          </p>
        </div>
      </div>

      {/* Partner Link Preview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <QrCode className="h-5 w-5 text-primary" />
            Dein Partner-Link
          </CardTitle>
          <CardDescription>
            Alle QR-Codes führen zu deiner individuellen Partnerseite
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 p-3 bg-white rounded-xl border">
              <QRCodeSVG 
                value={basePartnerUrl || 'https://my2go.lovable.app'} 
                size={80}
                level="M"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{partner?.name}</p>
              <a 
                href={basePartnerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline flex items-center gap-1 mt-1"
              >
                {basePartnerUrl}
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabbed Materials */}
      <Tabs defaultValue="standard" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="standard" className="text-xs">
            <Layers className="h-3.5 w-3.5 mr-1.5" />
            Standard
          </TabsTrigger>
          <TabsTrigger value="industry" className="text-xs">
            <UtensilsCrossed className="h-3.5 w-3.5 mr-1.5" />
            Branchen
          </TabsTrigger>
          <TabsTrigger value="social" className="text-xs">
            <Instagram className="h-3.5 w-3.5 mr-1.5" />
            Social
          </TabsTrigger>
        </TabsList>

        <TabsContent value="standard" className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {standardMaterials.map((material) => (
              <MaterialCard
                key={material.id}
                material={material}
                downloadAction={() => downloadPDF(
                  material.id === 'qr-card' ? qrCardRef :
                  material.id === 'sticker' ? stickerRef :
                  material.id === 'table-card' ? tableCardRef :
                  a4PosterRef,
                  `${partner?.name || 'Partner'}-${material.title}`
                )}
                previewAction={() => openPreview(material.id)}
              />
            ))}
          </div>
          
          {/* Logo Download */}
          <Card className="border-warning/20 bg-gradient-to-br from-warning/10 to-warning/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-background/80 shadow-sm flex items-center justify-center flex-shrink-0">
                  <ImageIcon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm">Partner Logo</h3>
                  <p className="text-xs text-muted-foreground">Hochauflösend für eigene Designs</p>
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={downloadLogo}
                  disabled={!partner?.logo_url || downloadingItem === 'logo'}
                >
                  {downloadingItem === 'logo' ? <LoadingSpinner size="sm" /> : <Download className="h-4 w-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="industry" className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {industryMaterials.map((material) => (
              <MaterialCard
                key={material.id}
                material={material}
                downloadAction={() => downloadPDF(
                  material.id === 'gastro-menu' ? gastroMenuRef :
                  material.id === 'cafe-counter' ? cafeCounterRef :
                  material.id === 'retail-checkout' ? retailCheckoutRef :
                  beautyCardRef,
                  `${partner?.name || 'Partner'}-${material.title}`
                )}
                previewAction={() => openPreview(material.id)}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="social" className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {socialMaterials.map((material) => (
              <MaterialCard
                key={material.id}
                material={material}
                downloadAction={() => downloadImage(
                  material.id === 'instagram-story' ? instagramStoryRef : instagramPostRef,
                  `${partner?.name || 'Partner'}-${material.title}`
                )}
                previewAction={() => openPreview(material.id)}
              />
            ))}
          </div>
          <div className="rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground">
            <p className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent" />
              <span>Tipp: Die Social-Media-Grafiken sind perfekt für Posts mit dem Aufruf "Scannt unseren QR-Code!"</span>
            </p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Pro Tips */}
      <Card className="bg-muted/50">
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-accent/20 flex items-center justify-center flex-shrink-0">
              <Sparkles className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h3 className="font-semibold mb-2">Profi-Tipps</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                  <span>Platziere den QR-Code gut sichtbar an der Kasse oder Theke</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                  <span>Weise Mitarbeiter ein, Kunden aktiv auf My 2Go hinzuweisen</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                  <span>Nutze die Analytics um zu sehen, welches Material am besten funktioniert</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-lg p-0 overflow-hidden max-h-[90vh]">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              {getPreviewTitle()} – Vorschau
            </DialogTitle>
            <DialogDescription>
              So wird dein Material nach dem Download aussehen
            </DialogDescription>
          </DialogHeader>
          
          <div className="p-4 overflow-y-auto">
            {/* Preview Content */}
            <div className="relative bg-muted/30 rounded-xl p-4 flex items-center justify-center min-h-[280px] border overflow-hidden">
              {/* Standard Previews */}
              {previewType === 'qr-card' && (
                <div className="bg-white rounded-2xl shadow-lg p-6 text-center" style={{ width: '200px' }}>
                  <div className="p-3 bg-white rounded-xl shadow-sm mb-4 inline-block">
                    <QRCodeSVG value={getTrackedUrl('qr-card') || 'https://my2go.lovable.app'} size={90} level="H" />
                  </div>
                  <p className="text-sm font-semibold text-foreground mb-1">{partner?.name}</p>
                  <p className="text-xs text-muted-foreground mb-3">Scannen & Vorteile sichern</p>
                  <img src={logo2Go} alt="My 2Go" className="h-4 opacity-40 mx-auto" />
                </div>
              )}

              {previewType === 'sticker' && (
                <div className="bg-white rounded-full border-2 border-border shadow-lg flex flex-col items-center justify-center" style={{ width: '160px', height: '160px' }}>
                  <QRCodeSVG value={getTrackedUrl('sticker') || 'https://my2go.lovable.app'} size={60} level="H" />
                  <p className="text-[8px] font-medium text-muted-foreground uppercase tracking-wider mt-2">Scannen für Vorteile</p>
                  <img src={logo2Go} alt="My 2Go" className="h-3 mt-1 opacity-40" />
                </div>
              )}

              {previewType === 'table-card' && (
                <div className="bg-white rounded-xl shadow-lg overflow-hidden" style={{ width: '260px', height: '160px' }}>
                  <div className="h-full flex items-center p-4 gap-4">
                    <div className="p-2 bg-muted/50 rounded-lg flex-shrink-0">
                      <QRCodeSVG value={getTrackedUrl('table-card') || 'https://my2go.lovable.app'} size={70} level="H" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[8px] text-muted-foreground font-medium uppercase tracking-wider mb-1">Exklusiv bei</p>
                      <p className="text-sm font-semibold text-foreground mb-1">{partner?.name}</p>
                      <p className="text-[9px] text-muted-foreground leading-relaxed mb-2">QR-Code scannen und Vorteile sichern.</p>
                      <img src={logo2Go} alt="My 2Go" className="h-3 opacity-30" />
                    </div>
                  </div>
                </div>
              )}

              {previewType === 'a4-poster' && (
                <div className="bg-white rounded-xl shadow-lg p-6 text-center" style={{ width: '200px', height: '280px' }}>
                  <div className="h-full flex flex-col items-center justify-between">
                    <div>
                      <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest mb-1">Jetzt mitmachen</p>
                      <p className="text-lg font-bold text-foreground mb-4">{partner?.name}</p>
                    </div>
                    <div className="p-3 bg-gradient-to-br from-primary/10 to-accent/10 rounded-2xl">
                      <QRCodeSVG value={getTrackedUrl('a4-poster') || 'https://my2go.lovable.app'} size={100} level="H" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground mt-4 mb-1">Scannen & Taler sammeln</p>
                      <p className="text-[9px] text-muted-foreground mb-3">Exklusive Vorteile für Stammkunden</p>
                      <img src={logo2Go} alt="My 2Go" className="h-4 opacity-50 mx-auto" />
                    </div>
                  </div>
                </div>
              )}

              {/* Industry Previews */}
              {previewType === 'gastro-menu' && (
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl shadow-lg p-5 text-center border border-orange-200/50" style={{ width: '180px', height: '240px' }}>
                  <div className="h-full flex flex-col items-center justify-between">
                    <div className="w-full border-b border-orange-200/50 pb-2 mb-2">
                      <p className="text-[9px] text-orange-600/80 font-semibold uppercase tracking-widest">Stammkunden-Bonus</p>
                    </div>
                    <div className="flex-1 flex flex-col items-center justify-center">
                      <div className="p-2 bg-white rounded-xl shadow-sm">
                        <QRCodeSVG value={getTrackedUrl('gastro-menu') || 'https://my2go.lovable.app'} size={70} level="H" />
                      </div>
                      <p className="text-xs font-semibold text-foreground mt-3 mb-1">Jetzt Taler sammeln</p>
                      <p className="text-[8px] text-muted-foreground">bei {partner?.name}</p>
                    </div>
                    <img src={logo2Go} alt="My 2Go" className="h-3 opacity-40 mt-2" />
                  </div>
                </div>
              )}

              {previewType === 'cafe-counter' && (
                <div className="bg-gradient-to-br from-amber-900 to-amber-800 rounded-xl shadow-lg p-4 text-center" style={{ width: '160px', height: '200px' }}>
                  <div className="h-full flex flex-col items-center justify-between">
                    <Coffee className="h-6 w-6 text-amber-200" />
                    <div className="p-2 bg-white rounded-lg">
                      <QRCodeSVG value={getTrackedUrl('cafe-counter') || 'https://my2go.lovable.app'} size={65} level="H" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-amber-100 mb-0.5">Kaffee trinken</p>
                      <p className="text-[10px] text-amber-200">& Taler sammeln</p>
                    </div>
                    <img src={logo2Go} alt="My 2Go" className="h-3 opacity-60 invert" />
                  </div>
                </div>
              )}

              {previewType === 'retail-checkout' && (
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl shadow-lg p-4 text-center" style={{ width: '180px', height: '120px' }}>
                  <div className="h-full flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg flex-shrink-0">
                      <QRCodeSVG value={getTrackedUrl('retail-checkout') || 'https://my2go.lovable.app'} size={55} level="H" />
                    </div>
                    <div className="text-left flex-1">
                      <ShoppingBag className="h-4 w-4 text-blue-200 mb-1" />
                      <p className="text-xs font-bold text-white leading-tight">Punkte sammeln beim Einkauf</p>
                      <p className="text-[8px] text-blue-200 mt-1">Jetzt QR-Code scannen</p>
                    </div>
                  </div>
                </div>
              )}

              {previewType === 'beauty-card' && (
                <div className="bg-gradient-to-br from-pink-50 to-rose-100 rounded-lg shadow-lg p-3 text-center border border-pink-200" style={{ width: '170px', height: '100px' }}>
                  <div className="h-full flex items-center gap-3">
                    <div className="p-1.5 bg-white rounded-lg flex-shrink-0 shadow-sm">
                      <QRCodeSVG value={getTrackedUrl('beauty-card') || 'https://my2go.lovable.app'} size={45} level="H" />
                    </div>
                    <div className="text-left flex-1">
                      <p className="text-[10px] font-semibold text-pink-700 mb-0.5">Beauty Bonus</p>
                      <p className="text-[8px] text-pink-600/80 leading-tight">Scannen & bei jedem Besuch Taler sammeln</p>
                      <img src={logo2Go} alt="My 2Go" className="h-2.5 opacity-40 mt-1.5" />
                    </div>
                  </div>
                </div>
              )}

              {/* Social Media Previews */}
              {previewType === 'instagram-story' && (
                <div className="bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 rounded-xl shadow-lg p-4 text-center" style={{ width: '135px', height: '240px' }}>
                  <div className="h-full flex flex-col items-center justify-between text-white">
                    <div>
                      <p className="text-[8px] font-semibold uppercase tracking-widest opacity-80">Jetzt neu</p>
                      <p className="text-sm font-bold mt-1">{partner?.name}</p>
                    </div>
                    <div className="p-2 bg-white rounded-xl">
                      <QRCodeSVG value={getTrackedUrl('instagram-story') || 'https://my2go.lovable.app'} size={70} level="H" />
                    </div>
                    <div>
                      <p className="text-xs font-bold">Scannt & spart!</p>
                      <p className="text-[8px] opacity-80 mt-0.5">Exklusive Vorteile für Follower</p>
                      <img src={logo2Go} alt="My 2Go" className="h-3 opacity-70 mx-auto mt-2 invert" />
                    </div>
                  </div>
                </div>
              )}

              {previewType === 'instagram-post' && (
                <div className="bg-gradient-to-br from-violet-600 to-fuchsia-500 rounded-xl shadow-lg p-4 text-center" style={{ width: '180px', height: '180px' }}>
                  <div className="h-full flex flex-col items-center justify-between text-white">
                    <p className="text-[9px] font-semibold uppercase tracking-widest opacity-80">Stammkunden-Bonus</p>
                    <div>
                      <div className="p-2 bg-white rounded-xl mb-2">
                        <QRCodeSVG value={getTrackedUrl('instagram-post') || 'https://my2go.lovable.app'} size={65} level="H" />
                      </div>
                      <p className="text-sm font-bold">{partner?.name}</p>
                    </div>
                    <div>
                      <p className="text-[9px] opacity-90">QR-Code scannen & Taler sammeln</p>
                      <img src={logo2Go} alt="My 2Go" className="h-3 opacity-60 mx-auto mt-1 invert" />
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Actions */}
            <div className="flex gap-3 mt-4">
              <Button variant="outline" className="flex-1" onClick={() => setPreviewOpen(false)}>
                <X className="h-4 w-4 mr-2" />
                Schliessen
              </Button>
              <Button className="flex-1" onClick={handleDownloadFromPreview} disabled={downloadingItem !== null}>
                {downloadingItem ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Wird erstellt...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    {previewType?.includes('instagram') ? 'PNG Download' : 'PDF Download'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Hidden Elements for PDF/Image Generation */}
      <div className="fixed left-[-9999px] top-0" aria-hidden="true">
        {/* QR Card Template */}
        <div ref={qrCardRef} style={{ width: '420px', height: '595px', backgroundColor: '#ffffff', display: 'none', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '48px' }}>
            <div style={{ padding: '20px', backgroundColor: '#ffffff', borderRadius: '20px', boxShadow: '0 2px 16px rgba(0,0,0,0.06)', marginBottom: '40px' }}>
              <QRCodeSVG value={getTrackedUrl('qr-card') || 'https://my2go.lovable.app'} size={200} level="H" bgColor="#ffffff" fgColor="#18181b" />
            </div>
            <p style={{ fontSize: '22px', fontWeight: '600', color: '#18181b', marginBottom: '8px', letterSpacing: '-0.02em' }}>{partner?.name}</p>
            <p style={{ fontSize: '15px', color: '#71717a', marginBottom: '48px', fontWeight: '400' }}>Scannen & Vorteile sichern</p>
            <img src={logo2Go} alt="My 2Go" style={{ height: '20px', opacity: 0.6 }} crossOrigin="anonymous" />
          </div>
        </div>

        {/* Sticker Template */}
        <div ref={stickerRef} style={{ width: '320px', height: '320px', backgroundColor: '#ffffff', display: 'none', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', padding: '10px' }}>
          <div style={{ width: '300px', height: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', borderRadius: '50%', border: '2px solid #e4e4e7', backgroundColor: '#ffffff' }}>
            <div style={{ marginBottom: '12px' }}>
              <QRCodeSVG value={getTrackedUrl('sticker') || 'https://my2go.lovable.app'} size={120} level="H" bgColor="#ffffff" fgColor="#18181b" />
            </div>
            <p style={{ fontSize: '11px', fontWeight: '500', color: '#71717a', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Scannen für Vorteile</p>
            <img src={logo2Go} alt="My 2Go" style={{ height: '14px', marginTop: '10px', opacity: 0.5 }} crossOrigin="anonymous" />
          </div>
        </div>

        {/* Table Card Template */}
        <div ref={tableCardRef} style={{ width: '440px', height: '280px', backgroundColor: '#ffffff', display: 'none', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', padding: '40px', gap: '40px' }}>
            <div style={{ padding: '16px', backgroundColor: '#fafafa', borderRadius: '16px', flexShrink: 0 }}>
              <QRCodeSVG value={getTrackedUrl('table-card') || 'https://my2go.lovable.app'} size={150} level="H" bgColor="#fafafa" fgColor="#18181b" />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <p style={{ fontSize: '13px', color: '#a1a1aa', fontWeight: '500', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '8px' }}>Exklusiv bei</p>
              <p style={{ fontSize: '24px', fontWeight: '600', color: '#18181b', marginBottom: '16px', letterSpacing: '-0.02em' }}>{partner?.name}</p>
              <p style={{ fontSize: '14px', color: '#71717a', lineHeight: 1.5, marginBottom: '20px' }}>QR-Code scannen und Vorteile als Stammkunde sichern.</p>
              <img src={logo2Go} alt="My 2Go" style={{ height: '18px', opacity: 0.4 }} crossOrigin="anonymous" />
            </div>
          </div>
        </div>

        {/* A4 Poster Template */}
        <div ref={a4PosterRef} style={{ width: '595px', height: '842px', backgroundColor: '#ffffff', display: 'none', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', textAlign: 'center', padding: '60px 48px' }}>
            <div>
              <p style={{ fontSize: '14px', color: '#a1a1aa', fontWeight: '600', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '12px' }}>Jetzt mitmachen</p>
              <p style={{ fontSize: '36px', fontWeight: '700', color: '#18181b', letterSpacing: '-0.02em' }}>{partner?.name}</p>
            </div>
            <div style={{ padding: '32px', background: 'linear-gradient(135deg, #f0f0ff 0%, #fff0f5 100%)', borderRadius: '32px' }}>
              <QRCodeSVG value={getTrackedUrl('a4-poster') || 'https://my2go.lovable.app'} size={280} level="H" bgColor="transparent" fgColor="#18181b" />
            </div>
            <div>
              <p style={{ fontSize: '24px', fontWeight: '600', color: '#18181b', marginBottom: '8px' }}>Scannen & Taler sammeln</p>
              <p style={{ fontSize: '16px', color: '#71717a', marginBottom: '32px' }}>Exklusive Vorteile für Stammkunden</p>
              <img src={logo2Go} alt="My 2Go" style={{ height: '28px', opacity: 0.5 }} crossOrigin="anonymous" />
            </div>
          </div>
        </div>

        {/* Gastro Menu Insert Template */}
        <div ref={gastroMenuRef} style={{ width: '350px', height: '500px', background: 'linear-gradient(135deg, #fff7ed 0%, #fffbeb 100%)', display: 'none', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', textAlign: 'center', padding: '40px 32px' }}>
            <div style={{ width: '100%', borderBottom: '1px solid rgba(234, 88, 12, 0.2)', paddingBottom: '16px' }}>
              <p style={{ fontSize: '12px', color: '#ea580c', fontWeight: '600', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Stammkunden-Bonus</p>
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ padding: '16px', backgroundColor: '#ffffff', borderRadius: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
                <QRCodeSVG value={getTrackedUrl('gastro-menu') || 'https://my2go.lovable.app'} size={160} level="H" bgColor="#ffffff" fgColor="#18181b" />
              </div>
              <p style={{ fontSize: '20px', fontWeight: '600', color: '#18181b', marginTop: '28px', marginBottom: '8px' }}>Jetzt Taler sammeln</p>
              <p style={{ fontSize: '14px', color: '#71717a' }}>bei {partner?.name}</p>
            </div>
            <img src={logo2Go} alt="My 2Go" style={{ height: '18px', opacity: 0.4 }} crossOrigin="anonymous" />
          </div>
        </div>

        {/* Café Counter Template */}
        <div ref={cafeCounterRef} style={{ width: '320px', height: '420px', background: 'linear-gradient(135deg, #78350f 0%, #92400e 100%)', display: 'none', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', textAlign: 'center', padding: '36px 28px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '24px' }}>☕</span>
            </div>
            <div style={{ padding: '16px', backgroundColor: '#ffffff', borderRadius: '20px' }}>
              <QRCodeSVG value={getTrackedUrl('cafe-counter') || 'https://my2go.lovable.app'} size={160} level="H" bgColor="#ffffff" fgColor="#18181b" />
            </div>
            <div>
              <p style={{ fontSize: '22px', fontWeight: '600', color: '#fef3c7', marginBottom: '4px' }}>Kaffee trinken</p>
              <p style={{ fontSize: '18px', color: '#fde68a' }}>& Taler sammeln</p>
              <p style={{ fontSize: '13px', color: 'rgba(254, 243, 199, 0.7)', marginTop: '12px' }}>{partner?.name}</p>
            </div>
            <img src={logo2Go} alt="My 2Go" style={{ height: '18px', opacity: 0.7, filter: 'invert(1)' }} crossOrigin="anonymous" />
          </div>
        </div>

        {/* Retail Checkout Template */}
        <div ref={retailCheckoutRef} style={{ width: '440px', height: '280px', background: 'linear-gradient(135deg, #2563eb 0%, #4338ca 100%)', display: 'none', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', padding: '32px', gap: '32px' }}>
            <div style={{ padding: '16px', backgroundColor: '#ffffff', borderRadius: '16px', flexShrink: 0 }}>
              <QRCodeSVG value={getTrackedUrl('retail-checkout') || 'https://my2go.lovable.app'} size={150} level="H" bgColor="#ffffff" fgColor="#18181b" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <span style={{ fontSize: '20px' }}>🛍️</span>
              </div>
              <p style={{ fontSize: '28px', fontWeight: '700', color: '#ffffff', lineHeight: 1.2, marginBottom: '8px' }}>Punkte sammeln beim Einkauf</p>
              <p style={{ fontSize: '14px', color: '#bfdbfe', marginBottom: '16px' }}>Jetzt QR-Code scannen bei {partner?.name}</p>
              <img src={logo2Go} alt="My 2Go" style={{ height: '16px', opacity: 0.7, filter: 'invert(1)' }} crossOrigin="anonymous" />
            </div>
          </div>
        </div>

        {/* Beauty Card Template */}
        <div ref={beautyCardRef} style={{ width: '350px', height: '200px', background: 'linear-gradient(135deg, #fdf2f8 0%, #ffe4e6 100%)', display: 'none', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', border: '1px solid #fecdd3', borderRadius: '12px' }}>
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', padding: '24px', gap: '24px' }}>
            <div style={{ padding: '12px', backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', flexShrink: 0 }}>
              <QRCodeSVG value={getTrackedUrl('beauty-card') || 'https://my2go.lovable.app'} size={100} level="H" bgColor="#ffffff" fgColor="#18181b" />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '18px', fontWeight: '600', color: '#be185d', marginBottom: '6px' }}>Beauty Bonus</p>
              <p style={{ fontSize: '13px', color: '#9d174d', lineHeight: 1.5, marginBottom: '8px' }}>Scannen & bei jedem Besuch bei {partner?.name} Taler sammeln</p>
              <p style={{ fontSize: '11px', color: '#db2777', marginBottom: '12px' }}>Einlösen für exklusive Vorteile</p>
              <img src={logo2Go} alt="My 2Go" style={{ height: '14px', opacity: 0.4 }} crossOrigin="anonymous" />
            </div>
          </div>
        </div>

        {/* Instagram Story Template */}
        <div ref={instagramStoryRef} style={{ width: '1080px', height: '1920px', background: 'linear-gradient(135deg, #7c3aed 0%, #ec4899 50%, #f97316 100%)', display: 'none', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', textAlign: 'center', padding: '120px 80px' }}>
            <div>
              <p style={{ fontSize: '32px', fontWeight: '600', color: 'rgba(255,255,255,0.9)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '16px' }}>Jetzt neu</p>
              <p style={{ fontSize: '64px', fontWeight: '700', color: '#ffffff' }}>{partner?.name}</p>
            </div>
            <div style={{ padding: '48px', backgroundColor: '#ffffff', borderRadius: '48px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
              <QRCodeSVG value={getTrackedUrl('instagram-story') || 'https://my2go.lovable.app'} size={400} level="H" bgColor="#ffffff" fgColor="#18181b" />
            </div>
            <div>
              <p style={{ fontSize: '48px', fontWeight: '700', color: '#ffffff', marginBottom: '16px' }}>Scannt & spart!</p>
              <p style={{ fontSize: '28px', color: 'rgba(255,255,255,0.85)', marginBottom: '48px' }}>Exklusive Vorteile für Follower</p>
              <img src={logo2Go} alt="My 2Go" style={{ height: '48px', opacity: 0.8, filter: 'invert(1)' }} crossOrigin="anonymous" />
            </div>
          </div>
        </div>

        {/* Instagram Post Template */}
        <div ref={instagramPostRef} style={{ width: '1080px', height: '1080px', background: 'linear-gradient(135deg, #8b5cf6 0%, #d946ef 100%)', display: 'none', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', textAlign: 'center', padding: '80px 60px' }}>
            <p style={{ fontSize: '28px', fontWeight: '600', color: 'rgba(255,255,255,0.9)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>Stammkunden-Bonus</p>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ padding: '32px', backgroundColor: '#ffffff', borderRadius: '32px', marginBottom: '32px', boxShadow: '0 16px 48px rgba(0,0,0,0.2)' }}>
                <QRCodeSVG value={getTrackedUrl('instagram-post') || 'https://my2go.lovable.app'} size={320} level="H" bgColor="#ffffff" fgColor="#18181b" />
              </div>
              <p style={{ fontSize: '48px', fontWeight: '700', color: '#ffffff' }}>{partner?.name}</p>
            </div>
            <div>
              <p style={{ fontSize: '28px', color: 'rgba(255,255,255,0.9)', marginBottom: '24px' }}>QR-Code scannen & Taler sammeln</p>
              <img src={logo2Go} alt="My 2Go" style={{ height: '40px', opacity: 0.7, filter: 'invert(1)' }} crossOrigin="anonymous" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
