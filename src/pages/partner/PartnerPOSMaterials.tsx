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
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
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
}

type PreviewType = 'qr-card' | 'sticker' | 'table-card' | null;

export default function PartnerPOSMaterials() {
  const { partnerInfo } = usePartner();
  const [downloadingItem, setDownloadingItem] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewType, setPreviewType] = useState<PreviewType>(null);
  
  // Hidden refs for PDF generation
  const qrCardRef = useRef<HTMLDivElement>(null);
  const stickerRef = useRef<HTMLDivElement>(null);
  const tableCardRef = useRef<HTMLDivElement>(null);

  const { data: partner, isLoading } = useQuery({
    queryKey: ['partner-details-pos', partnerInfo?.partnerId],
    queryFn: async () => {
      if (!partnerInfo?.partnerId) return null;
      
      const { data, error } = await supabase
        .from('partners')
        .select('id, name, slug, logo_url')
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

  const qrCardUrl = getTrackedUrl('qr-card');
  const stickerUrl = getTrackedUrl('sticker');
  const tableCardUrl = getTrackedUrl('table-card');

  const downloadPDF = async (
    elementRef: React.RefObject<HTMLDivElement>, 
    filename: string,
    orientation: 'portrait' | 'landscape' = 'portrait'
  ) => {
    if (!elementRef.current) return;
    
    setDownloadingItem(filename);
    
    try {
      // Temporarily show the element for capture
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
      
      // Hide element again
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
      
      // Calculate scaling to fit the page with margins
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
    
    if (previewType === 'qr-card') {
      downloadPDF(qrCardRef, `${partner?.name || 'Partner'}-QR-Karte`);
    } else if (previewType === 'sticker') {
      downloadPDF(stickerRef, `${partner?.name || 'Partner'}-Aufkleber`);
    } else if (previewType === 'table-card') {
      downloadPDF(tableCardRef, `${partner?.name || 'Partner'}-Tischkarte`);
    }
  };

  const getPreviewTitle = () => {
    switch (previewType) {
      case 'qr-card': return 'QR-Code Karte';
      case 'sticker': return 'Aufkleber';
      case 'table-card': return 'Tischkarte';
      default: return 'Vorschau';
    }
  };

  const materials = [
    {
      id: 'qr-card' as const,
      title: 'QR-Code Karte',
      description: 'A6 Karte mit QR-Code für Theke oder Kasse. Kunden scannen und erhalten Taler.',
      icon: QrCode,
      color: 'from-primary/20 to-primary/5',
      borderColor: 'border-primary/20',
      downloadAction: () => downloadPDF(qrCardRef, `${partner?.name || 'Partner'}-QR-Karte`),
      previewAction: () => openPreview('qr-card'),
      hasPreview: true,
    },
    {
      id: 'sticker' as const,
      title: 'Aufkleber',
      description: 'Runder Aufkleber (8cm) für Türen, Fenster oder Vitrinen.',
      icon: Sticker,
      color: 'from-accent/20 to-accent/5',
      borderColor: 'border-accent/20',
      downloadAction: () => downloadPDF(stickerRef, `${partner?.name || 'Partner'}-Aufkleber`),
      previewAction: () => openPreview('sticker'),
      hasPreview: true,
    },
    {
      id: 'table-card' as const,
      title: 'Tischkarte',
      description: 'Faltbare Tischkarte für Restaurants, Cafés oder Wartebereiche.',
      icon: CreditCard,
      color: 'from-success/20 to-success/5',
      borderColor: 'border-success/20',
      downloadAction: () => downloadPDF(tableCardRef, `${partner?.name || 'Partner'}-Tischkarte`),
      previewAction: () => openPreview('table-card'),
      hasPreview: true,
    },
    {
      id: 'logo' as const,
      title: 'Partner Logo',
      description: 'Dein Logo in hoher Auflösung für eigene Designs und Materialien.',
      icon: ImageIcon,
      color: 'from-warning/20 to-warning/5',
      borderColor: 'border-warning/20',
      downloadAction: downloadLogo,
      hasPreview: false,
      disabled: !partner?.logo_url,
    },
  ];

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
            Lade professionelle Materialien für dein Geschäft herunter.
          </p>
        </div>
      </div>

      {/* Preview Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <QrCode className="h-5 w-5 text-primary" />
            Dein Partner-Link
          </CardTitle>
          <CardDescription>
            Kunden können diesen Link besuchen oder den QR-Code scannen
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

      {/* Materials Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {materials.map((material) => (
          <Card 
            key={material.id}
            className={`relative overflow-hidden transition-all hover:shadow-lg ${material.borderColor} ${material.disabled ? 'opacity-50' : ''}`}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${material.color} pointer-events-none`} />
            <CardContent className="relative p-5">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-background/80 shadow-sm flex items-center justify-center flex-shrink-0">
                  <material.icon className="h-6 w-6 text-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold">{material.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {material.description}
                  </p>
                  <div className="flex gap-2 mt-3">
                    {material.hasPreview && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={material.previewAction}
                        disabled={material.disabled}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Vorschau
                      </Button>
                    )}
                    <Button
                      size="sm"
                      onClick={material.downloadAction}
                      disabled={downloadingItem === material.id || material.disabled}
                    >
                      {downloadingItem === material.id ? (
                        <>
                          <LoadingSpinner size="sm" className="mr-2" />
                          Wird erstellt...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

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
                  <span>Kombiniere Aufkleber am Eingang mit Tischkarten im Innenbereich</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-lg p-0 overflow-hidden">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              {getPreviewTitle()} – Vorschau
            </DialogTitle>
            <DialogDescription>
              So wird dein Material nach dem Download aussehen
            </DialogDescription>
          </DialogHeader>
          
          <div className="p-4">
            {/* Preview Content */}
            <div className="relative bg-muted/30 rounded-xl p-6 flex items-center justify-center min-h-[300px] border">
              {previewType === 'qr-card' && (
                <div 
                  className="bg-white rounded-2xl shadow-lg overflow-hidden"
                  style={{ width: '210px', height: '297px' }}
                >
                  <div className="h-full flex flex-col items-center justify-center text-center p-6">
                    <div className="p-3 bg-white rounded-xl shadow-sm mb-5">
                      <QRCodeSVG 
                        value={qrCardUrl || 'https://my2go.lovable.app'} 
                        size={100}
                        level="H"
                      />
                    </div>
                    <p className="text-sm font-semibold text-foreground mb-1">
                      {partner?.name}
                    </p>
                    <p className="text-xs text-muted-foreground mb-5">
                      Scannen & Vorteile sichern
                    </p>
                    <img src={logo2Go} alt="My 2Go" className="h-4 opacity-40" />
                  </div>
                </div>
              )}
              
              {previewType === 'sticker' && (
                <div 
                  className="bg-white rounded-full border-2 border-border shadow-lg flex flex-col items-center justify-center"
                  style={{ width: '180px', height: '180px' }}
                >
                  <div className="mb-2">
                    <QRCodeSVG 
                      value={stickerUrl || 'https://my2go.lovable.app'} 
                      size={70}
                      level="H"
                    />
                  </div>
                  <p className="text-[9px] font-medium text-muted-foreground uppercase tracking-wider">
                    Scannen für Vorteile
                  </p>
                  <img src={logo2Go} alt="My 2Go" className="h-3 mt-1 opacity-40" />
                </div>
              )}
              
              {previewType === 'table-card' && (
                <div 
                  className="bg-white rounded-xl shadow-lg overflow-hidden"
                  style={{ width: '280px', height: '180px' }}
                >
                  <div className="h-full flex items-center p-5 gap-5">
                    <div className="p-3 bg-muted/50 rounded-xl flex-shrink-0">
                      <QRCodeSVG 
                        value={tableCardUrl || 'https://my2go.lovable.app'} 
                        size={80}
                        level="H"
                      />
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                      <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider mb-1">
                        Exklusiv bei
                      </p>
                      <p className="text-sm font-semibold text-foreground mb-2">
                        {partner?.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground leading-relaxed mb-3">
                        QR-Code scannen und Vorteile als Stammkunde sichern.
                      </p>
                      <img src={logo2Go} alt="My 2Go" className="h-3 opacity-30" />
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Actions */}
            <div className="flex gap-3 mt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setPreviewOpen(false)}
              >
                <X className="h-4 w-4 mr-2" />
                Schliessen
              </Button>
              <Button
                className="flex-1"
                onClick={handleDownloadFromPreview}
                disabled={downloadingItem !== null}
              >
                {downloadingItem ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Wird erstellt...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    PDF Download
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Hidden Elements for PDF Generation */}
      <div className="fixed left-[-9999px] top-0" aria-hidden="true">
        {/* QR Card Template - Clean, minimal A6 design */}
        <div 
          ref={qrCardRef} 
          style={{ 
            width: '420px', 
            height: '595px', 
            backgroundColor: '#ffffff',
            display: 'none',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          }}
        >
          <div style={{ 
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '48px',
          }}>
            {/* QR Code - main focus */}
            <div style={{
              padding: '20px',
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
              marginBottom: '40px',
            }}>
              <QRCodeSVG 
                value={qrCardUrl || 'https://my2go.lovable.app'} 
                size={200}
                level="H"
                bgColor="#ffffff"
                fgColor="#18181b"
              />
            </div>
            
            {/* Partner Name */}
            <p style={{ 
              fontSize: '22px', 
              fontWeight: '600',
              color: '#18181b',
              marginBottom: '8px',
              letterSpacing: '-0.02em',
            }}>
              {partner?.name}
            </p>
            
            {/* Simple CTA */}
            <p style={{ 
              fontSize: '15px', 
              color: '#71717a',
              marginBottom: '48px',
              fontWeight: '400',
            }}>
              Scannen & Vorteile sichern
            </p>
            
            {/* Subtle branding */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              opacity: 0.6,
            }}>
              <img 
                src={logo2Go} 
                alt="My 2Go" 
                style={{ height: '20px' }}
                crossOrigin="anonymous"
              />
            </div>
          </div>
        </div>

        {/* Sticker Template - Minimalist circle */}
        <div 
          ref={stickerRef}
          style={{ 
            width: '320px', 
            height: '320px', 
            backgroundColor: '#ffffff',
            display: 'none',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            padding: '10px',
          }}
        >
          <div style={{ 
            width: '300px',
            height: '300px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            borderRadius: '50%',
            border: '2px solid #e4e4e7',
            backgroundColor: '#ffffff',
          }}>
            {/* QR Code */}
            <div style={{
              marginBottom: '12px',
            }}>
              <QRCodeSVG 
                value={stickerUrl || 'https://my2go.lovable.app'} 
                size={120}
                level="H"
                bgColor="#ffffff"
                fgColor="#18181b"
              />
            </div>
            
            {/* Minimal text */}
            <p style={{ 
              fontSize: '11px', 
              fontWeight: '500',
              color: '#71717a',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}>
              Scannen für Vorteile
            </p>
            
            {/* Small logo */}
            <img 
              src={logo2Go} 
              alt="My 2Go" 
              style={{ height: '14px', marginTop: '10px', opacity: 0.5 }}
              crossOrigin="anonymous"
            />
          </div>
        </div>

        {/* Table Card Template - Clean tent card design */}
        <div 
          ref={tableCardRef}
          style={{ 
            width: '440px', 
            height: '280px', 
            backgroundColor: '#ffffff',
            display: 'none',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          }}
        >
          <div style={{ 
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            padding: '40px',
            gap: '40px',
          }}>
            {/* QR Code side */}
            <div style={{
              padding: '16px',
              backgroundColor: '#fafafa',
              borderRadius: '16px',
              flexShrink: 0,
            }}>
              <QRCodeSVG 
                value={tableCardUrl || 'https://my2go.lovable.app'} 
                size={150}
                level="H"
                bgColor="#fafafa"
                fgColor="#18181b"
              />
            </div>
            
            {/* Text side */}
            <div style={{ 
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}>
              <p style={{ 
                fontSize: '13px', 
                color: '#a1a1aa',
                fontWeight: '500',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                marginBottom: '8px',
              }}>
                Exklusiv bei
              </p>
              
              <p style={{ 
                fontSize: '24px', 
                fontWeight: '600',
                color: '#18181b',
                marginBottom: '16px',
                letterSpacing: '-0.02em',
              }}>
                {partner?.name}
              </p>
              
              <p style={{ 
                fontSize: '14px', 
                color: '#71717a',
                lineHeight: 1.5,
                marginBottom: '20px',
              }}>
                QR-Code scannen und Vorteile als Stammkunde sichern.
              </p>
              
              <img 
                src={logo2Go} 
                alt="My 2Go" 
                style={{ height: '18px', opacity: 0.4 }}
                crossOrigin="anonymous"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
