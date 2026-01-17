import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, Package, ArrowRight, ArrowLeft, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { POS_KITS, formatCHF, calculateBrutto } from "@/lib/partner-pricing";

export default function PartnerPosPage() {
  return (
    <div className="overflow-hidden bg-background">
      {/* Hero Section */}
      <section className="relative pt-20 pb-10 md:pt-24 md:pb-14 overflow-hidden bg-gradient-to-b from-primary/10 via-primary/5 to-background">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-primary/20 rounded-full blur-3xl" />
        </div>
        
        <div className="container relative z-10 max-w-4xl mx-auto px-4">
          {/* Back Button */}
          <Button
            variant="ghost"
            asChild
            className="mb-6"
          >
            <Link to="/go">
              <ArrowLeft className="mr-2 w-4 h-4" />
              Zurück zur Übersicht
            </Link>
          </Button>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
              <Package className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              POS Kits nachbestellen
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Professionelle Materialien für deinen Point of Sale. QR-Codes und NFC-Tags für maximale Sichtbarkeit.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Alle Preise exkl. MwSt (8.1%)
            </p>
          </motion.div>
        </div>
      </section>

      <div className="py-12 md:py-16">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-5 mb-12">
            {Object.values(POS_KITS).map((kit, index) => (
              <motion.div
                key={kit.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full flex flex-col border-2 hover:border-primary/30 hover:shadow-lg transition-all">
                  <CardHeader className="pb-2">
                    <h3 className="font-bold text-lg">POS Kit {kit.name}</h3>
                    <p className="text-sm text-muted-foreground">{kit.description}</p>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <div className="mb-4">
                      <p className="text-3xl font-bold">{formatCHF(kit.price)}</p>
                      <p className="text-xs text-muted-foreground">exkl. MwSt</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        inkl. MwSt: {formatCHF(calculateBrutto(kit.price))}
                      </p>
                    </div>
                    <ul className="space-y-2">
                      {kit.items.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button asChild className="w-full h-11 font-semibold">
                      <a href={`mailto:partner@my2go.app?subject=POS Kit ${kit.name} Bestellung`}>
                        <ShoppingCart className="mr-2 w-4 h-4" />
                        Bestellen
                      </a>
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center p-8 rounded-3xl bg-muted/40 border">
            <p className="text-muted-foreground mb-4">
              Du bist noch kein Partner?
            </p>
            <Button asChild variant="outline" size="lg" className="font-semibold">
              <Link to="/go/partner/pricing">
                Pakete ansehen
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
