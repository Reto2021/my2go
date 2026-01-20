import { useState } from 'react';
import { FileDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { generatePartnerReport } from '@/lib/partner-pdf-export';
import type { PartnerStats, DailyStats } from '@/lib/partner-helpers';
import { toast } from 'sonner';

interface DashboardPDFExportProps {
  partnerName: string;
  stats: PartnerStats;
  dailyStats: DailyStats[];
  periodLabel?: string;
}

export function DashboardPDFExport({
  partnerName,
  stats,
  dailyStats,
  periodLabel = 'Letzte 14 Tage',
}: DashboardPDFExportProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  
  const handleExport = async () => {
    try {
      setIsGenerating(true);
      
      // Small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 100));
      
      generatePartnerReport({
        partnerName,
        stats,
        dailyStats,
        periodLabel,
      });
      
      toast.success('Report wurde als PDF heruntergeladen!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Fehler beim Erstellen des PDFs');
    } finally {
      setIsGenerating(false);
    }
  };
  
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={isGenerating}
      className="gap-2"
    >
      {isGenerating ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <FileDown className="h-4 w-4" />
      )}
      PDF Export
    </Button>
  );
}
