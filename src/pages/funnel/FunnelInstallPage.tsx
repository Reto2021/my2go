import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Share, Plus, ArrowLeft, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { trackFunnelEvent } from '@/lib/funnel-config';

export default function FunnelInstallPage() {
  useEffect(() => {
    trackFunnelEvent('pwa_install_shown');
  }, []);

  return (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col px-4 py-8">
      <div className="w-full max-w-md mx-auto">
        {/* Back Button */}
        <Link
          to="/u"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Zurück
        </Link>

        {/* Icon */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center justify-center mb-6"
        >
          <div className="h-20 w-20 rounded-3xl bg-primary/20 flex items-center justify-center">
            <Smartphone className="h-10 w-10 text-primary" />
          </div>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-2xl sm:text-3xl font-extrabold tracking-tight text-center mb-3"
        >
          My2Go installieren
        </motion.h1>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-muted-foreground text-center mb-8"
        >
          Füge My2Go zu deinem Home-Bildschirm hinzu, um schneller darauf zuzugreifen.
        </motion.p>

        {/* Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4 mb-8"
        >
          {/* Step 1 */}
          <div className="flex items-start gap-4 p-4 rounded-2xl bg-card border border-border">
            <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-primary/20 flex-shrink-0">
              <span className="text-lg font-bold text-primary">1</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Share className="h-5 w-5 text-primary" />
                <p className="font-bold">Teilen-Symbol antippen</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Tippe unten in Safari auf das Teilen-Symbol (Quadrat mit Pfeil nach oben).
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-start gap-4 p-4 rounded-2xl bg-card border border-border">
            <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-accent/20 flex-shrink-0">
              <span className="text-lg font-bold text-accent-foreground">2</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Plus className="h-5 w-5 text-accent-foreground" />
                <p className="font-bold">"Zum Home-Bildschirm"</p>
              </div>
              <p className="text-sm text-muted-foreground">
                Scrolle im Menü nach unten und wähle "Zum Home-Bildschirm".
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex items-start gap-4 p-4 rounded-2xl bg-card border border-border">
            <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-success/20 flex-shrink-0">
              <span className="text-lg font-bold text-success">3</span>
            </div>
            <div className="flex-1">
              <p className="font-bold mb-1">Hinzufügen</p>
              <p className="text-sm text-muted-foreground">
                Tippe oben rechts auf "Hinzufügen". Fertig!
              </p>
            </div>
          </div>
        </motion.div>

        {/* Visual Guide */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="p-4 rounded-2xl bg-muted/50 text-center"
        >
          <p className="text-sm text-muted-foreground">
            💡 Tipp: Nach der Installation startet My2Go wie eine echte App – schneller und ohne Browser-Leiste.
          </p>
        </motion.div>

        {/* Back CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8"
        >
          <Button asChild variant="outline" size="lg" className="w-full h-12 rounded-2xl">
            <Link to="/u">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Zurück
            </Link>
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
