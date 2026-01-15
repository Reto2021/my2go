import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { DancePartySheet } from './DancePartySheet';
import { cn } from '@/lib/utils';
import { hapticFeedback } from '@/lib/haptics';

interface DancePartyButtonProps {
  songIdentifier: string;
  songTitle?: string;
  isCompact?: boolean;
}

export const DancePartyButton = ({ 
  songIdentifier, 
  songTitle,
  isCompact = false 
}: DancePartyButtonProps) => {
  const [open, setOpen] = useState(false);

  const handleClick = () => {
    hapticFeedback('medium');
    setOpen(true);
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleClick}
        className={cn(
          "relative",
          isCompact ? "h-8 w-8" : "h-10 w-10"
        )}
        title="Dance Party"
      >
        <Sparkles className={cn(
          "text-primary",
          isCompact ? "h-4 w-4" : "h-5 w-5"
        )} />
        
        {/* Pulse animation */}
        {!isCompact && (
          <span className="absolute inset-0 rounded-full animate-ping bg-primary/20 pointer-events-none" />
        )}
      </Button>

      <DancePartySheet
        open={open}
        onOpenChange={setOpen}
        songIdentifier={songIdentifier}
        songTitle={songTitle}
      />
    </>
  );
};
