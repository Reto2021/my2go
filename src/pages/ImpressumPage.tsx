import { ArrowLeft, Building2, Mail, Phone, Globe } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

export default function ImpressumPage() {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="container py-4 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="btn-ghost p-2 -ml-2">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold">Impressum</h1>
        </div>
      </header>
      
      <div className="container py-6 space-y-6">
        {/* Company Info Card */}
        <div className="card-base p-6 animate-in">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Building2 className="h-6 w-6 text-secondary" />
            </div>
            <div>
              <h2 className="text-lg font-bold">2Go Media AG</h2>
              <p className="text-muted-foreground mt-1">
                Industriestrasse 19<br />
                CH-5200 Brugg AG<br />
                Schweiz
              </p>
            </div>
          </div>
        </div>
        
        {/* Handelsregister */}
        <div className="card-base p-6 animate-in">
          <h3 className="font-semibold mb-3">Handelsregister</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">UID-Nr.:</span>
              <span className="font-medium">CHE-130.920.325</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Rechtsform:</span>
              <span className="font-medium">Aktiengesellschaft (AG)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Registriert in:</span>
              <span className="font-medium">Kanton Aargau</span>
            </div>
          </div>
        </div>
        
        {/* Contact */}
        <div className="card-base divide-y divide-border animate-in">
          <h3 className="font-semibold p-6 pb-4">Kontakt</h3>
          
          <a 
            href="mailto:contact@2gomedia.ch"
            className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
          >
            <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <Mail className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="font-medium">E-Mail</p>
              <p className="text-sm text-secondary">contact@2gomedia.ch</p>
            </div>
          </a>
          
          <a 
            href="https://www.2gomedia.ch" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
          >
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Globe className="h-5 w-5 text-secondary" />
            </div>
            <div>
              <p className="font-medium">Webseite</p>
              <p className="text-sm text-secondary">www.2gomedia.ch</p>
            </div>
          </a>
        </div>
        
        {/* Responsibility */}
        <div className="card-base p-6 animate-in">
          <h3 className="font-semibold mb-3">Verantwortlich für Inhalte</h3>
          <p className="text-sm text-muted-foreground">
            Verantwortlich für die Inhalte der Radio 2Go App und Webseite ist die 2Go Media AG gemäss den Angaben oben.
          </p>
        </div>
        
        {/* Copyright */}
        <div className="card-base p-6 animate-in">
          <h3 className="font-semibold mb-3">Urheberrecht</h3>
          <p className="text-sm text-muted-foreground">
            Sämtliche Inhalte dieser App (Texte, Bilder, Grafiken, Logos, Audio- und Videodateien) sind urheberrechtlich geschützt und Eigentum der 2Go Media AG oder der jeweiligen Rechteinhaber. Eine Vervielfältigung, Bearbeitung, Verbreitung oder jede Art der Verwertung ausserhalb der Grenzen des Urheberrechts bedarf der vorherigen schriftlichen Zustimmung.
          </p>
        </div>
        
        {/* Disclaimer */}
        <div className="card-base p-6 animate-in">
          <h3 className="font-semibold mb-3">Haftungsausschluss</h3>
          <p className="text-sm text-muted-foreground">
            Trotz sorgfältiger Kontrolle übernehmen wir keine Haftung für die Inhalte externer Links. Für den Inhalt der verlinkten Seiten sind ausschliesslich deren Betreiber verantwortlich.
          </p>
        </div>
        
        {/* Links */}
        <div className="card-base p-4">
          <p className="text-sm font-medium mb-3">Weitere rechtliche Informationen:</p>
          <div className="flex flex-wrap gap-2">
            <Link to="/agb" className="text-sm text-secondary hover:underline">
              Nutzungsbedingungen
            </Link>
            <span className="text-muted-foreground">•</span>
            <Link to="/datenschutz" className="text-sm text-secondary hover:underline">
              Datenschutz
            </Link>
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-4 rounded-xl bg-muted/50 text-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} 2Go Media AG. Alle Rechte vorbehalten.
          </p>
        </div>
      </div>
    </div>
  );
}
