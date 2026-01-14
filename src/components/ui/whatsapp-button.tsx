import { MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const WHATSAPP_NUMBER = '41765864070';
const WHATSAPP_MESSAGE = 'Hallo Radio 2Go! 👋';

export function WhatsAppButton({ className }: { className?: string }) {
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;
  
  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'fixed z-40 flex items-center justify-center',
        'h-10 w-10 rounded-full',
        'bg-[#25D366] hover:bg-[#20BD5A] active:scale-95',
        'shadow-lg shadow-[#25D366]/30 hover:shadow-xl hover:shadow-[#25D366]/40',
        'transition-all duration-300',
        // Position above bottom nav + player bar with safe area
        'bottom-[calc(12rem+env(safe-area-inset-bottom))] right-3',
        className
      )}
      aria-label="WhatsApp Studio kontaktieren"
    >
      <MessageCircle className="h-4 w-4 text-white" fill="white" />
    </a>
  );
}
