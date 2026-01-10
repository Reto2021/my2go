import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, ArrowRight, Shield, HelpCircle, Radio, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { PLANS, POS_KITS, GUARANTEE_CONDITIONS, formatCHF, type PlanId } from "@/lib/partner-pricing";

export default function PartnerPricingPage() {
  const [isYearly, setIsYearly] = useState(false);
  const planOrder: PlanId[] = ['starter', 'growth', 'radio'];

  return (
    <div className="overflow-hidden bg-background">
      {/* Hero Section - Clean */}
      <section className="relative pt-20 pb-10 md:pt-24 md:pb-14 overflow-hidden bg-gradient-to-b from-primary/10 via-primary/5 to-background">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 -left-24 w-48 h-48 bg-accent/15 rounded-full blur-3xl" />
        </div>
        
        <div className="container relative z-10 max-w-5xl mx-auto px-4">
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent/10 text-accent-foreground text-xs font-bold uppercase tracking-wide mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              Preise & Pakete
            </span>
            
            <h1 className="text-3xl md:text-5xl font-bold mb-4">
              Wähle dein Paket
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-2">
              Alle Pakete inkl. 30 Tage Trial. Die erste Monatsgebühr wird erst nach dem Trial fällig.
            </p>
            <p className="text-sm text-muted-foreground mb-8">
              Alle Preise exkl. MwSt (8.1%)
            </p>
            
            {/* Billing Toggle */}
            <div className="inline-flex items-center gap-1 p-1.5 rounded-full bg-card border border-border shadow-sm">
              <button
                onClick={() => setIsYearly(false)}
                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                  !isYearly ? 'bg-secondary text-white shadow-md' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Monatlich
              </button>
              <button
                onClick={() => setIsYearly(true)}
                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                  isYearly ? 'bg-secondary text-white shadow-md' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Jährlich
                <span className="ml-1.5 text-xs text-green-500 font-bold">-17%</span>
              </button>
            </div>
          </motion.div>
        </div>
      </section>
      
      <div className="py-12 md:py-16">
        <div className="container max-w-5xl mx-auto px-4">
          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-5 mb-16">
            {planOrder.map((planId, index) => {
              const plan = PLANS[planId];
              const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
              const displayPrice = isYearly ? Math.round(plan.yearlyPrice / 12) : plan.monthlyPrice;
              
              return (
                <motion.div
                  key={planId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className={`relative h-full flex flex-col border-2 ${
                    plan.isRecommended ? 'border-primary shadow-xl shadow-primary/10 scale-[1.02]' : 'border-border hover:border-primary/30'
                  } transition-all`}>
                    {plan.highlight && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge className="bg-accent text-accent-foreground font-bold shadow-lg">
                          {plan.highlight}
                        </Badge>
                      </div>
                    )}
                    
                    <CardHeader className="pb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Radio className="w-4 h-4 text-primary" />
                        </div>
                        <h3 className="font-bold text-lg">{plan.name}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">{plan.tagline}</p>
                    </CardHeader>
                    
                    <CardContent className="flex-1">
                      <div className="mb-6">
                        <div className="flex items-baseline gap-1">
                          <span className="text-4xl font-bold">{formatCHF(displayPrice)}</span>
                          <span className="text-muted-foreground">/Monat</span>
                        </div>
                        <p className="text-xs text-muted-foreground">exkl. MwSt</p>
                        {isYearly && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {formatCHF(price)} jährlich
                          </p>
                        )}
                        <p className="text-sm mt-2">
                          <span className="font-semibold">+ {formatCHF(plan.activationFee)}</span>
                          <span className="text-muted-foreground"> Activation Fee</span>
                        </p>
                      </div>
                      
                      <div className="p-3 rounded-xl bg-primary/5 border border-primary/10 mb-5">
                        <div className="flex items-center gap-2 text-sm">
                          <Radio className="w-4 h-4 text-primary" />
                          <span className="font-semibold">{plan.audioCredits} Audio-Credits/Mt.</span>
                          <Tooltip>
                            <TooltipTrigger>
                              <HelpCircle className="w-3.5 h-3.5 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p>1 Air-Drop (5-8 Sek.) = 1 Credit</p>
                              <p>1 Radio-Spot (20 Sek.) = 3 Credits</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                      
                      <ul className="space-y-2.5">
                        {plan.features.map((feature, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                    
                    <CardFooter className="pt-4">
                      <Button 
                        asChild 
                        className={`w-full h-12 font-bold ${plan.isRecommended ? 'bg-accent hover:bg-accent/90 text-accent-foreground' : ''}`}
                        variant={plan.isRecommended ? 'default' : 'outline'}
                      >
                        <Link to={`/go/partner/checkout?plan=${planId}&interval=${isYearly ? 'yearly' : 'monthly'}`}>
                          30 Tage testen
                          <ArrowRight className="ml-2 w-4 h-4" />
                        </Link>
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* Money-Back Guarantee */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <Card className="p-6 md:p-8 bg-gradient-to-br from-green-50 to-green-50/50 dark:from-green-950/30 dark:to-green-950/10 border-green-200 dark:border-green-800">
              <div className="flex flex-col md:flex-row items-start gap-5">
                <div className="w-14 h-14 rounded-2xl bg-green-100 dark:bg-green-900/50 flex items-center justify-center shrink-0">
                  <Shield className="w-7 h-7 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">30 Tage Geld-zurück Garantie</h3>
                  <p className="text-muted-foreground mb-4">
                    Passt nicht? Bekommst du die Activation Fee vollständig zurück.
                  </p>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {GUARANTEE_CONDITIONS.map((condition, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                        <span>{condition}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-4">
                    POS-Druck und Versand sind nicht rückerstattbar, falls bereits ausgelöst.
                  </p>
                  <Button asChild variant="link" className="px-0 mt-2 text-green-600 dark:text-green-400">
                    <Link to="/go/partner/refund">
                      Mehr zur Garantie →
                    </Link>
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* POS Kits Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold mb-2">POS Kits (Optional)</h2>
              <p className="text-muted-foreground">
                Professionelle Materialien für deinen Point of Sale
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-5">
              {Object.values(POS_KITS).map((kit, index) => (
                <motion.div
                  key={kit.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full flex flex-col hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-2">
                      <h3 className="font-bold">POS Kit {kit.name}</h3>
                      <p className="text-sm text-muted-foreground">{kit.description}</p>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <p className="text-3xl font-bold mb-4">{formatCHF(kit.price)}</p>
                      <ul className="space-y-2">
                        {kit.items.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
            
            <p className="text-center text-sm text-muted-foreground mt-6">
              POS Kits werden im Checkout hinzugefügt oder{" "}
              <Link to="/go/partner/pos" className="text-primary hover:underline font-medium">
                später nachbestellt
              </Link>.
            </p>
          </motion.div>

          {/* FAQ Link */}
          <div className="text-center mt-16 py-10 border-t">
            <p className="text-muted-foreground mb-4">Noch Fragen?</p>
            <Button asChild variant="outline" size="lg" className="font-semibold">
              <Link to="/go/partner/faq">
                Häufige Fragen ansehen
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
