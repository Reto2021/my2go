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
        'fixed z-50 flex items-center gap-1.5',
        'pl-3 pr-3.5 py-2.5 rounded-full',
        'bg-[#25D366] hover:bg-[#20BD5A] active:scale-95',
        'shadow-lg shadow-[#25D366]/30 hover:shadow-xl hover:shadow-[#25D366]/40',
        'transition-all duration-300',
        'bottom-24 right-4',
        className
      )}
      aria-label="WhatsApp Studio kontaktieren"
    >
      <MessageCircle className="h-4 w-4 text-white" fill="white" />
      <span className="text-xs font-bold text-white">Studio</span>
    </a>
  );
}
