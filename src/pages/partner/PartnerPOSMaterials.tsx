import { useState, useRef, useEffect } from 'react';
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
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

export default function PartnerPOSMaterials() {
  const { partnerInfo } = usePartner();
  const [downloadingItem, setDownloadingItem] = useState<string | null>(null);
  
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

  const partnerUrl = partner?.slug 
    ? `${window.location.origin}/partner/${partner.slug}`
    : '';

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

  const materials = [
    {
      id: 'qr-card',
      title: 'QR-Code Karte',
      description: 'A6 Karte mit QR-Code für Theke oder Kasse. Kunden scannen und erhalten Taler.',
      icon: QrCode,
      color: 'from-primary/20 to-primary/5',
      borderColor: 'border-primary/20',
      action: () => downloadPDF(qrCardRef, `${partner?.name || 'Partner'}-QR-Karte`),
    },
    {
      id: 'sticker',
      title: 'Aufkleber',
      description: 'Runder Aufkleber (8cm) für Türen, Fenster oder Vitrinen.',
      icon: Sticker,
      color: 'from-accent/20 to-accent/5',
      borderColor: 'border-accent/20',
      action: () => downloadPDF(stickerRef, `${partner?.name || 'Partner'}-Aufkleber`),
    },
    {
      id: 'table-card',
      title: 'Tischkarte',
      description: 'Faltbare Tischkarte für Restaurants, Cafés oder Wartebereiche.',
      icon: CreditCard,
      color: 'from-success/20 to-success/5',
      borderColor: 'border-success/20',
      action: () => downloadPDF(tableCardRef, `${partner?.name || 'Partner'}-Tischkarte`),
    },
    {
      id: 'logo',
      title: 'Partner Logo',
      description: 'Dein Logo in hoher Auflösung für eigene Designs und Materialien.',
      icon: ImageIcon,
      color: 'from-warning/20 to-warning/5',
      borderColor: 'border-warning/20',
      action: downloadLogo,
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
                value={partnerUrl || 'https://my2go.lovable.app'} 
                size={80}
                level="M"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{partner?.name}</p>
              <a 
                href={partnerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline flex items-center gap-1 mt-1"
              >
                {partnerUrl}
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
                  <Button
                    size="sm"
                    className="mt-3"
                    onClick={material.action}
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
                        PDF Download
                      </>
                    )}
                  </Button>
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

      {/* Hidden Elements for PDF Generation */}
      <div className="fixed left-[-9999px] top-0" aria-hidden="true">
        {/* QR Card Template */}
        <div 
          ref={qrCardRef} 
          style={{ 
            width: '420px', 
            height: '595px', 
            padding: '40px',
            backgroundColor: 'white',
            display: 'none',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          <div style={{ 
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            border: '2px solid #e5e5e5',
            borderRadius: '24px',
            padding: '40px',
          }}>
            <img 
              src={logo2Go} 
              alt="My 2Go" 
              style={{ height: '48px', marginBottom: '24px' }}
              crossOrigin="anonymous"
            />
            <h2 style={{ 
              fontSize: '28px', 
              fontWeight: 'bold', 
              marginBottom: '8px',
              color: '#1a1a1a',
            }}>
              Sammle Taler!
            </h2>
            <p style={{ 
              fontSize: '16px', 
              color: '#666',
              marginBottom: '32px',
            }}>
              Scanne den QR-Code und erhalte Belohnungen
            </p>
            <div style={{
              padding: '16px',
              backgroundColor: 'white',
              borderRadius: '16px',
              border: '1px solid #e5e5e5',
              marginBottom: '24px',
            }}>
              <QRCodeSVG 
                value={partnerUrl || 'https://my2go.lovable.app'} 
                size={180}
                level="M"
              />
            </div>
            <p style={{ 
              fontSize: '18px', 
              fontWeight: '600',
              color: '#1a1a1a',
              marginBottom: '4px',
            }}>
              {partner?.name}
            </p>
            <p style={{ 
              fontSize: '12px', 
              color: '#999',
            }}>
              my2go.lovable.app
            </p>
          </div>
        </div>

        {/* Sticker Template */}
        <div 
          ref={stickerRef}
          style={{ 
            width: '300px', 
            height: '300px', 
            backgroundColor: 'white',
            display: 'none',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          <div style={{ 
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            borderRadius: '50%',
            border: '4px solid #6366f1',
            backgroundColor: 'white',
            padding: '24px',
          }}>
            <p style={{ 
              fontSize: '12px', 
              fontWeight: '600',
              color: '#6366f1',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: '8px',
            }}>
              Partner von
            </p>
            <img 
              src={logo2Go} 
              alt="My 2Go" 
              style={{ height: '28px', marginBottom: '12px' }}
              crossOrigin="anonymous"
            />
            <div style={{
              padding: '8px',
              backgroundColor: 'white',
              borderRadius: '8px',
            }}>
              <QRCodeSVG 
                value={partnerUrl || 'https://my2go.lovable.app'} 
                size={100}
                level="M"
              />
            </div>
            <p style={{ 
              fontSize: '10px', 
              color: '#666',
              marginTop: '8px',
            }}>
              Scanne & sammle Taler
            </p>
          </div>
        </div>

        {/* Table Card Template */}
        <div 
          ref={tableCardRef}
          style={{ 
            width: '400px', 
            height: '260px', 
            backgroundColor: 'white',
            display: 'none',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          <div style={{ 
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '32px',
            border: '2px dashed #e5e5e5',
            borderRadius: '16px',
          }}>
            <div style={{ flex: 1 }}>
              <img 
                src={logo2Go} 
                alt="My 2Go" 
                style={{ height: '32px', marginBottom: '16px' }}
                crossOrigin="anonymous"
              />
              <h3 style={{ 
                fontSize: '20px', 
                fontWeight: 'bold',
                color: '#1a1a1a',
                marginBottom: '8px',
              }}>
                Taler sammeln bei
              </h3>
              <p style={{ 
                fontSize: '18px', 
                fontWeight: '600',
                color: '#6366f1',
                marginBottom: '12px',
              }}>
                {partner?.name}
              </p>
              <p style={{ 
                fontSize: '12px', 
                color: '#666',
                maxWidth: '160px',
              }}>
                Scanne den QR-Code und erhalte exklusive Belohnungen!
              </p>
            </div>
            <div style={{
              padding: '12px',
              backgroundColor: 'white',
              borderRadius: '12px',
              border: '1px solid #e5e5e5',
            }}>
              <QRCodeSVG 
                value={partnerUrl || 'https://my2go.lovable.app'} 
                size={140}
                level="M"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
