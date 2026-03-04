import { Link, Outlet, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import logoRadio2go from "@/assets/logo-2go-header.png";
import { WhatsAppButton } from "@/components/ui/whatsapp-button";

export function FunnelLayout() {
  const location = useLocation();
  const isLegalPage = location.pathname.includes('/legal');

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* WhatsApp Button */}
      <WhatsAppButton />
      {/* Minimal Header - Logo only, no navigation */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border/50">
        <div className="container max-w-lg mx-auto px-4">
          <div className="flex items-center justify-center h-14">
            <Link to="/u" className="flex items-center gap-2">
              <img 
                src={logoRadio2go} 
                alt="2Go" 
                className="h-8 w-auto"
              />
              <span className="font-bold text-lg text-foreground">My2Go</span>
            </Link>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-1">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <Outlet />
        </motion.div>
      </main>

      {/* Minimal Footer - Legal only */}
      <footer className="py-4 bg-muted/30 border-t border-border/50">
        <div className="container max-w-lg mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
            <Link to="/u/legal/terms" className="hover:text-foreground transition-colors">
              AGB
            </Link>
            <span className="text-border">•</span>
            <Link to="/u/legal/privacy" className="hover:text-foreground transition-colors">
              Datenschutz
            </Link>
            <span className="text-border">•</span>
            <Link to="/u/legal/imprint" className="hover:text-foreground transition-colors">
              Impressum
            </Link>
          </div>
          <p className="text-center text-xs text-muted-foreground/60 mt-2">
            © {new Date().getFullYear()} My2Go
          </p>
        </div>
      </footer>
    </div>
  );
}
