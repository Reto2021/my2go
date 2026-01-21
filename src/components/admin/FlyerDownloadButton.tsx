import { useState } from 'react';
import { FileDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { generateMarketingFlyer } from '@/lib/flyer-pdf-generator';
import { toast } from 'sonner';

export function FlyerDownloadButton() {
  const [isGenerating, setIsGenerating] = useState(false);
  
  const handleDownload = async () => {
    try {
      setIsGenerating(true);
      await new Promise(resolve => setTimeout(resolve, 100));
      generateMarketingFlyer();
      toast.success('Flyer wurde als PDF heruntergeladen!');
    } catch (error) {
      console.error('Error generating flyer:', error);
      toast.error('Fehler beim Erstellen des Flyers');
    } finally {
      setIsGenerating(false);
    }
  };
  
  return (
    <Button
      onClick={handleDownload}
      disabled={isGenerating}
      className="gap-2"
    >
      {isGenerating ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <FileDown className="h-4 w-4" />
      )}
      Marketing-Flyer herunterladen
    </Button>
  );
}
