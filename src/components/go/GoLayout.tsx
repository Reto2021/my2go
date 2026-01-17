import { Link, Outlet, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { RadioHeader } from "@/components/ui/radio-header";
import { WhatsAppButton } from "@/components/ui/whatsapp-button";
import logo2GoWhite from "@/assets/logo-2go-white.png";

export function GoLayout() {
  const location = useLocation();
  const isLegalPage = location.pathname.startsWith('/go/legal');
  const isLandingPage = location.pathname === '/go';
  const showBackButton = !isLandingPage;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Radio Header - same as consumer app */}
      <RadioHeader />
      
      {/* Back Navigation for sub-pages */}
      {showBackButton && (
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b">
          <div className="container max-w-6xl mx-auto px-4 py-3">
            <Link 
              to="/go" 
              className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Zurück zur Übersicht
            </Link>
          </div>
        </div>
      )}
      
      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer - Premium Style matching consumer app */}
      <footer className="relative overflow-hidden bg-gradient-to-b from-secondary/95 to-secondary text-secondary-foreground">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-64 h-64 bg-primary rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-accent rounded-full blur-3xl" />
        </div>
        
        <div className="container relative max-w-6xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <img 
                  src={logo2GoWhite} 
                  alt="My 2Go" 
                  className="h-12 w-auto"
                />
              </div>
              <p className="text-sm text-secondary-foreground/80 leading-relaxed">
                Das Loyalitäts-Netzwerk für lokale Betriebe in der Schweiz. Powered by Radio 2Go.
              </p>
            </div>
            
            {/* Product */}
            <div>
              <h4 className="font-semibold mb-4 text-accent">Produkt</h4>
              <ul className="space-y-2.5 text-sm">
                <li>
                  <Link to="/go" className="text-secondary-foreground/80 hover:text-white transition-colors">
                    Übersicht
                  </Link>
                </li>
                <li>
                  <Link to="/go/partner/pricing" className="text-secondary-foreground/80 hover:text-white transition-colors">
                    Preise & Pakete
                  </Link>
                </li>
                <li>
                  <Link to="/go/partner/pos" className="text-secondary-foreground/80 hover:text-white transition-colors">
                    POS Kits
                  </Link>
                </li>
                <li>
                  <Link to="/go/partner/faq" className="text-secondary-foreground/80 hover:text-white transition-colors">
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>
            
            {/* Company */}
            <div>
              <h4 className="font-semibold mb-4 text-accent">Unternehmen</h4>
              <ul className="space-y-2.5 text-sm">
                <li>
                  <a 
                    href="https://www.my2go.app" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-secondary-foreground/80 hover:text-white transition-colors"
                  >
                    Website
                  </a>
                </li>
                <li>
                  <a 
                    href="https://radio2go.fm" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-secondary-foreground/80 hover:text-white transition-colors"
                  >
                    Radio 2Go
                  </a>
                </li>
                <li>
                  <Link to="/go/legal/impressum" className="text-secondary-foreground/80 hover:text-white transition-colors">
                    Impressum
                  </Link>
                </li>
                <li>
                  <Link to="/go/legal/agb" className="text-secondary-foreground/80 hover:text-white transition-colors">
                    AGB
                  </Link>
                </li>
              </ul>
            </div>
            
            {/* Legal */}
            <div>
              <h4 className="font-semibold mb-4 text-accent">Rechtliches</h4>
              <ul className="space-y-2.5 text-sm">
                <li>
                  <Link to="/go/legal/datenschutz" className="text-secondary-foreground/80 hover:text-white transition-colors">
                    Datenschutz
                  </Link>
                </li>
                <li>
                  <Link to="/go/partner/refund" className="text-secondary-foreground/80 hover:text-white transition-colors">
                    Geld-zurück Garantie
                  </Link>
                </li>
              </ul>
              
              {/* CTA in footer */}
              <div className="mt-6">
                <Link 
                  to="/go/partner/pricing"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors shadow-lg"
                >
                  Jetzt Partner werden
                </Link>
              </div>
            </div>
          </div>
          
          {/* Bottom bar */}
          <div className="border-t border-white/10 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-secondary-foreground/60">
            <p>© {new Date().getFullYear()} My 2Go. Alle Rechte vorbehalten.</p>
            <p className="flex items-center gap-1">
              Made with <span className="text-red-400">❤️</span> in Switzerland
            </p>
          </div>
        </div>
      </footer>
      
      {/* WhatsApp Button - same as consumer app */}
      <WhatsAppButton />
    </div>
  );
}
