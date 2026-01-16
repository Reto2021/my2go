import { Navigation } from 'lucide-react';

interface LocationPermissionPromptProps {
  isOpen: boolean;
  isRequesting: boolean;
  onAllow: () => void;
  onDeny: () => void;
}

export function LocationPermissionPrompt({ 
  isOpen, 
  isRequesting, 
  onAllow, 
  onDeny 
}: LocationPermissionPromptProps) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
      <div className="card-base p-6 max-w-sm w-full text-center shadow-strong animate-in">
        <div className="flex h-16 w-16 items-center justify-center rounded-full mx-auto mb-4 bg-accent/10">
          <Navigation className="h-8 w-8 text-accent" />
        </div>
        <h2 className="text-xl font-bold mb-2">Gutscheine in deiner Nähe</h2>
        <p className="text-muted-foreground mb-6">
          Erlaube Standortzugriff, um nur Gutscheine von Partnern in deiner Region zu sehen.
        </p>
        <div className="space-y-3">
          <button 
            className="btn-primary w-full"
            onClick={onAllow}
            disabled={isRequesting}
          >
            {isRequesting ? 'Wird ermittelt...' : 'Standort erlauben'}
          </button>
          <button 
            className="btn-ghost w-full text-muted-foreground"
            onClick={onDeny}
          >
            Später
          </button>
        </div>
      </div>
    </div>
  );
}
