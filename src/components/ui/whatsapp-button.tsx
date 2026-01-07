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
        'fixed z-50 flex items-center justify-center',
        'h-14 w-14 rounded-full',
        'bg-[#25D366] hover:bg-[#20BD5A] active:scale-95',
        'shadow-lg shadow-[#25D366]/30 hover:shadow-xl hover:shadow-[#25D366]/40',
        'transition-all duration-300',
        'bottom-24 right-4', // Above bottom nav
        className
      )}
      aria-label="WhatsApp kontaktieren"
    >
      <MessageCircle className="h-7 w-7 text-white" fill="white" />
    </a>
  );
}
