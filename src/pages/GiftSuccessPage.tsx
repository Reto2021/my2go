import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PartyPopper, Gift, Copy, Check, Home, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Confetti } from '@/components/ui/confetti';
import { toast } from 'sonner';

export default function GiftSuccessPage() {
  const [searchParams] = useSearchParams();
  const [showConfetti, setShowConfetti] = useState(true);
  const [copied, setCopied] = useState(false);
  
  const giftCode = searchParams.get('code') || '';
  const recipientName = searchParams.get('recipient') || 'Dein Freund';

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  const copyCode = () => {
    navigator.clipboard.writeText(giftCode);
    setCopied(true);
    toast.success('Code kopiert!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <Confetti isActive={showConfetti} />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md text-center space-y-6"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.2 }}
          className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-lg shadow-pink-500/30"
        >
          <PartyPopper className="h-12 w-12 text-white" />
        </motion.div>

        <div>
          <h1 className="text-2xl font-bold mb-2">Geschenk gekauft! 🎁</h1>
          <p className="text-muted-foreground">
            {recipientName} wird sich freuen!
          </p>
        </div>

        <Card className="bg-gradient-to-br from-pink-500/10 to-rose-500/10 border-pink-500/20">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-center gap-2 text-pink-600 dark:text-pink-400">
              <Gift className="h-5 w-5" />
              <span className="font-medium">Geschenk-Code</span>
            </div>
            
            <div 
              className="p-4 rounded-xl bg-background cursor-pointer hover:bg-muted transition-colors"
              onClick={copyCode}
            >
              <p className="font-mono font-bold text-xl tracking-wider">{giftCode}</p>
              <p className="text-xs text-muted-foreground mt-1">Klicken zum Kopieren</p>
            </div>

            <Button 
              variant="outline" 
              className="w-full gap-2"
              onClick={copyCode}
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? 'Kopiert!' : 'Code kopieren'}
            </Button>
          </CardContent>
        </Card>

        <div className="p-4 rounded-xl bg-muted/50 text-sm space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="h-4 w-4" />
            <span>Eine E-Mail mit dem Code wurde versendet</span>
          </div>
          <p className="text-muted-foreground">
            Der Code kann unter <strong>/code</strong> eingelöst werden
          </p>
        </div>

        <Button asChild className="w-full gap-2">
          <Link to="/">
            <Home className="h-4 w-4" />
            Zurück zur Startseite
          </Link>
        </Button>
      </motion.div>
    </div>
  );
}
