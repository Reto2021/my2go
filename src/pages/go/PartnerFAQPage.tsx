import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { HelpCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Was ist My 2Go?",
    answer: "My 2Go ist ein Loyalitäts-Netzwerk für lokale Betriebe in der Schweiz. Kunden sammeln 2Go Taler und lösen diese bei teilnehmenden Partnern ein. Dazu kommt Radio-Reichweite und ein automatisierter Review-Booster."
  },
  {
    question: "Wie funktioniert der 30-Tage-Trial?",
    answer: "Nach der Zahlung der Activation Fee startet dein 30-Tage-Trial. In dieser Zeit ist die monatliche Abo-Gebühr CHF 0. Erst am Tag 31 wird die erste reguläre Abo-Zahlung fällig. Du kannst bis Tag 30 jederzeit kündigen."
  },
  {
    question: "Was sind Audio-Credits?",
    answer: "Audio-Credits sind dein Budget für Radio-Werbung. 1 Air-Drop (5-8 Sek. Sponsor-Tag) = 1 Credit. 1 Radio-Spot (20 Sek.) = 3 Credits. Die Aussteuerung erfolgt rotationsbasiert."
  },
  {
    question: "Wie funktioniert die Geld-zurück Garantie?",
    answer: "Wenn du nach dem Trial merkst, dass My 2Go nicht zu dir passt, erstatten wir die Activation Fee zurück. Bedingungen: Onboarding innerhalb 5 Tagen, QR/POS mind. 10 Tage sichtbar, mind. 1 Kampagne, Antrag bis Tag 30. POS-Versandkosten sind nicht erstattbar."
  },
  {
    question: "Brauche ich ein POS Kit?",
    answer: "Das POS Kit ist optional, aber empfohlen. Es enthält professionelle QR-Aufsteller und NFC-Tags für deinen Point of Sale. Du kannst auch später nachbestellen."
  },
  {
    question: "Wie lange dauert das Setup?",
    answer: "Nach Abschluss des Onboardings bist du in der Regel innerhalb von 7 Tagen startklar. Das POS Kit wird separat versendet."
  },
  {
    question: "Kann ich das Abo jederzeit kündigen?",
    answer: "Ja, du kannst jederzeit über das Kundenportal kündigen. Die Kündigung wird zum Ende der aktuellen Abrechnungsperiode wirksam."
  },
  {
    question: "Wie werden Google Reviews generiert?",
    answer: "Nach einer Einlösung wird der Kunde automatisch nach seiner Zufriedenheit gefragt. Nur zufriedene Kunden werden gebeten, eine Google-Bewertung abzugeben. Keine Fake-Reviews, kein Druck – echtes Feedback."
  }
];

export default function PartnerFAQPage() {
  return (
    <div className="py-12 md:py-20">
      <div className="container max-w-3xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <HelpCircle className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Häufige Fragen
          </h1>
          <p className="text-lg text-muted-foreground">
            Alles, was du über My 2Go wissen musst
          </p>
        </motion.div>

        <Accordion type="single" collapsible className="mb-12">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-left">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="text-center">
          <p className="text-muted-foreground mb-4">
            Noch Fragen? Wir helfen gerne.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild>
              <Link to="/go/partner/pricing">
                Jetzt starten
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <a href="mailto:partner@my2go.win">
                Kontakt aufnehmen
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
