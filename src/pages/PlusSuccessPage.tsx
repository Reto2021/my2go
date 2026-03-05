import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Crown, Sparkles, Gift, Radio, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useSubscription } from '@/hooks/useSubscription';
import { Confetti } from '@/components/ui/confetti';

const benefits = [
  {
    icon: Gift,
    title: 'Premium Gutscheine',
    description: 'Zugang zu exklusiven Rabatten und 2-für-1 Angeboten',
  },
  {
    icon: Radio,
    title: 'Werbefreies Hören',
    description: 'Geniesse den Soundtrack ohne Unterbrechungen',
  },
  {
    icon: Zap,
    title: 'Doppelte Taler',
    description: 'Verdiene 2x so viele Taler beim Zuhören',
  },
];

export default function PlusSuccessPage() {
  const navigate = useNavigate();
  const { checkSubscription, tier } = useSubscription();
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    // Refresh subscription status after successful checkout
    checkSubscription();
    // Hide confetti after a delay
    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, [checkSubscription]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-background to-primary/5">
      <Confetti isActive={showConfetti} message="Willkommen bei 2Go Plus!" />
      
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="relative mb-8"
      >
        <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-xl shadow-primary/30">
          <Check className="h-12 w-12 text-primary-foreground" strokeWidth={3} />
        </div>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3 }}
          className="absolute -top-2 -right-2"
        >
          <Crown className="h-8 w-8 text-yellow-500 fill-yellow-500" />
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-center mb-8"
      >
        <h1 className="text-3xl font-bold mb-2">Willkommen bei 2Go Plus!</h1>
        <p className="text-muted-foreground text-lg">
          {tier === 'yearly' 
            ? 'Dein Jahresabo ist jetzt aktiv. Danke für deine Unterstützung!'
            : 'Dein Monatsabo ist jetzt aktiv. Viel Spass mit deinen Vorteilen!'}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="w-full max-w-md space-y-4 mb-8"
      >
        {benefits.map((benefit, index) => (
          <motion.div
            key={benefit.title}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + index * 0.1 }}
          >
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <benefit.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold flex items-center gap-2">
                    {benefit.title}
                    <Sparkles className="h-4 w-4 text-primary" />
                  </h3>
                  <p className="text-sm text-muted-foreground">{benefit.description}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="flex flex-col gap-3 w-full max-w-md"
      >
        <Button 
          size="lg" 
          onClick={() => navigate('/rewards')}
          className="w-full gap-2"
        >
          <Gift className="h-5 w-5" />
          Premium Gutscheine entdecken
        </Button>
        <Button 
          variant="outline" 
          size="lg"
          onClick={() => navigate('/')}
          className="w-full"
        >
          Zur Startseite
        </Button>
      </motion.div>
    </div>
  );
}
