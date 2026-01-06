import { cn } from '@/lib/utils';
import { LucideIcon, Search } from 'lucide-react';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  className?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ 
  icon: Icon = Search, 
  title, 
  description, 
  className,
  action
}: EmptyStateProps) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center py-12 px-6 text-center',
      className
    )}>
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="font-semibold text-foreground mb-1">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-xs mb-4">
          {description}
        </p>
      )}
      {action && (
        <button 
          onClick={action.onClick}
          className="text-sm font-medium text-secondary hover:underline"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}