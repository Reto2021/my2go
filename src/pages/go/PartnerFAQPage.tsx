import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { HelpCircle, ArrowRight, MessageCircle } from "lucide-react";
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
    <div className="overflow-hidden bg-background">
      {/* Hero Section */}
      <section className="relative pt-20 pb-10 md:pt-24 md:pb-14 overflow-hidden bg-gradient-to-b from-primary/10 via-primary/5 to-background">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-primary/20 rounded-full blur-3xl" />
        </div>
        
        <div className="container relative z-10 max-w-3xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
              <HelpCircle className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Häufige Fragen
            </h1>
            <p className="text-lg text-muted-foreground">
              Alles, was du über My 2Go wissen musst
            </p>
          </motion.div>
        </div>
      </section>

      <div className="py-12 md:py-16">
        <div className="container max-w-3xl mx-auto px-4">
          <Accordion type="single" collapsible className="mb-12 space-y-3">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <AccordionItem 
                  value={`item-${index}`} 
                  className="bg-card border rounded-2xl px-5 data-[state=open]:shadow-lg transition-shadow"
                >
                  <AccordionTrigger className="text-left font-semibold hover:no-underline py-5">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-5">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>

          {/* CTA */}
          <div className="text-center p-8 rounded-3xl bg-muted/40 border">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-bold text-lg mb-2">Noch Fragen?</h3>
            <p className="text-muted-foreground mb-5">
              Wir helfen dir gerne weiter.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button asChild size="lg" className="font-bold">
                <Link to="/go/partner/pricing">
                  Jetzt starten
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <a href="mailto:partner@my2go.win">
                  Kontakt aufnehmen
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
