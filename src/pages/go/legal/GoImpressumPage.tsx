import { motion } from "framer-motion";

export default function GoImpressumPage() {
  return (
    <div className="py-12 md:py-20">
      <div className="container max-w-3xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl md:text-4xl font-bold mb-8">
            Impressum
          </h1>
          
          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <h2>Angaben gemäss Schweizer Recht</h2>
            
            <h3>Betreiber</h3>
            <p>
              My 2Go<br />
              [Strasse und Hausnummer]<br />
              [PLZ Ort]<br />
              Schweiz
            </p>

            <h3>Kontakt</h3>
            <p>
              E-Mail: info@my2go.win<br />
              Website: www.my2go.win
            </p>

            <h3>Vertretungsberechtigte Personen</h3>
            <p>
              [Name des Geschäftsführers / der Geschäftsführerin]
            </p>

            <h3>Handelsregistereintrag</h3>
            <p>
              [Handelsregisternummer]<br />
              [Handelsregisteramt]
            </p>

            <h3>UID-Nummer</h3>
            <p>
              CHE-[XXX.XXX.XXX]
            </p>

            <h3>Haftungsausschluss</h3>
            <p>
              Der Autor übernimmt keinerlei Gewähr hinsichtlich der inhaltlichen Richtigkeit, 
              Genauigkeit, Aktualität, Zuverlässigkeit und Vollständigkeit der Informationen.
            </p>
            <p>
              Haftungsansprüche gegen den Autor wegen Schäden materieller oder immaterieller Art, 
              welche aus dem Zugriff oder der Nutzung bzw. Nichtnutzung der veröffentlichten 
              Informationen, durch Missbrauch der Verbindung oder durch technische Störungen 
              entstanden sind, werden ausgeschlossen.
            </p>

            <h3>Urheberrechte</h3>
            <p>
              Die Urheber- und alle anderen Rechte an Inhalten, Bildern, Fotos oder anderen 
              Dateien auf dieser Website gehören ausschliesslich My 2Go oder den speziell 
              genannten Rechtsinhabern. Für die Reproduktion jeglicher Elemente ist die 
              schriftliche Zustimmung der Urheberrechtsträger im Voraus einzuholen.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
