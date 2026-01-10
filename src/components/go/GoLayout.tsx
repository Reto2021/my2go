import { Link, Outlet, useLocation } from "react-router-dom";
import { RadioHeader } from "@/components/ui/radio-header";

export function GoLayout() {
  const location = useLocation();
  const isLegalPage = location.pathname.startsWith('/go/legal');

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Radio Header - same as consumer app */}
      <RadioHeader />
      
      {/* Secondary Navigation for Go */}
      <nav className="sticky top-[52px] sm:top-[60px] z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-12 items-center justify-between max-w-6xl mx-auto px-4">
          <Link to="/go" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xs">2G</span>
            </div>
            <span className="font-bold text-base">My 2Go Business</span>
          </Link>
          
          <div className="flex items-center gap-4">
            <nav className="hidden md:flex items-center gap-5">
              <Link 
                to="/go" 
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Übersicht
              </Link>
              <Link 
                to="/go/partner/pricing" 
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Preise
              </Link>
              <Link 
                to="/go/partner/faq" 
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                FAQ
              </Link>
            </nav>

            <div className="flex items-center gap-2">
              <Link 
                to="/auth" 
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:block"
              >
                Login
              </Link>
              <Link 
                to="/go/partner/pricing"
                className="inline-flex items-center justify-center rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Jetzt starten
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content - with proper top padding for headers */}
      <main className="flex-1 pt-[100px] sm:pt-[108px]">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/30">
        <div className="container max-w-6xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">2G</span>
                </div>
                <span className="font-bold">My 2Go</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Das Loyalitäts-Netzwerk für lokale Betriebe in der Schweiz.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Produkt</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/go" className="hover:text-foreground transition-colors">Für Partner</Link></li>
                <li><Link to="/go/partner/pricing" className="hover:text-foreground transition-colors">Preise</Link></li>
                <li><Link to="/go/partner/pos" className="hover:text-foreground transition-colors">POS Kits</Link></li>
                <li><Link to="/go/partner/faq" className="hover:text-foreground transition-colors">FAQ</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Unternehmen</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="https://www.my2go.win" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Website</a></li>
                <li><Link to="/go/legal/impressum" className="hover:text-foreground transition-colors">Impressum</Link></li>
                <li><Link to="/go/legal/agb" className="hover:text-foreground transition-colors">AGB</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Rechtliches</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/go/legal/datenschutz" className="hover:text-foreground transition-colors">Datenschutz</Link></li>
                <li><Link to="/go/partner/refund" className="hover:text-foreground transition-colors">Geld-zurück Garantie</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t mt-8 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} My 2Go. Alle Rechte vorbehalten.</p>
            <p>Made with ❤️ in Switzerland</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
