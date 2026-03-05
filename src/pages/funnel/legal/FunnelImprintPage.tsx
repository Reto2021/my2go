import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function FunnelImprintPage() {
  return (
    <div className="min-h-[calc(100vh-8rem)] px-4 py-8">
      <div className="w-full max-w-2xl mx-auto">
        <Link
          to="/u"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Zurück
        </Link>

        <h1 className="text-2xl font-bold mb-6">Impressum</h1>

        <div className="prose prose-sm max-w-none text-muted-foreground">
          <h2 className="text-lg font-semibold text-foreground mt-6 mb-3">Betreiber</h2>
          <p>
            My2Go<br />
            c/o my2go<br />
            Schweiz
          </p>

          <h2 className="text-lg font-semibold text-foreground mt-6 mb-3">Kontakt</h2>
          <p>
            E-Mail: hello@my2go.app<br />
            Website: <a href="https://my2go.app" className="text-primary hover:underline">my2go.app</a>
          </p>

          <h2 className="text-lg font-semibold text-foreground mt-6 mb-3">Haftungsausschluss</h2>
          <p>
            Trotz sorgfältiger Kontrolle übernehmen wir keine Haftung für die Inhalte 
            externer Links. Für den Inhalt verlinkter Seiten sind ausschliesslich 
            deren Betreiber verantwortlich.
          </p>

          <h2 className="text-lg font-semibold text-foreground mt-6 mb-3">Urheberrecht</h2>
          <p>
            Die Inhalte dieser App sind urheberrechtlich geschützt. Die Vervielfältigung, 
            Bearbeitung, Verbreitung und jede Art der Verwertung ausserhalb der Grenzen 
            des Urheberrechtes bedürfen der schriftlichen Zustimmung.
          </p>

          <p className="mt-8 text-xs">
            Stand: Januar 2025
          </p>
        </div>
      </div>
    </div>
  );
}
