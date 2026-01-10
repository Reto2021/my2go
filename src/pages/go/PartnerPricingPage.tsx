import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, ArrowRight, Shield, HelpCircle, Radio, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { PLANS, POS_KITS, GUARANTEE_CONDITIONS, formatCHF, type PlanId } from "@/lib/partner-pricing";

export default function PartnerPricingPage() {
  const [isYearly, setIsYearly] = useState(false);

  const planOrder: PlanId[] = ['starter', 'growth', 'radio'];

  return (
    <div className="overflow-hidden">
      {/* Hero Section - Compact */}
      <section className="hero-section relative py-12 md:py-16 overflow-hidden">
        {/* Clouds */}
        <div className="clouds-container opacity-50">
          <div className="cloud cloud-2" />
          <div className="cloud cloud-4" />
          <div className="cloud cloud-6" />
        </div>
        
        <div className="container relative z-10 max-w-6xl mx-auto px-4">
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="badge-accent mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              Preise & Pakete
            </span>
            
            <h1 className="text-3xl md:text-5xl font-bold mb-4 text-secondary">
              Wähle dein Paket
            </h1>
            <p className="text-lg text-secondary/80 max-w-2xl mx-auto mb-2">
              Alle Pakete inkl. 30 Tage Trial. Die erste Monatsgebühr wird erst nach dem Trial fällig.
            </p>
            <p className="text-sm text-secondary/60 mb-8">
              Alle Preise exkl. MwSt (8.1%)
            </p>
            
            {/* Billing Toggle */}
            <div className="inline-flex items-center gap-1 p-1 rounded-full bg-white/90 backdrop-blur-sm shadow-lg">
              <button
                onClick={() => setIsYearly(false)}
                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                  !isYearly ? 'bg-secondary text-white shadow-md' : 'text-secondary/70 hover:text-secondary'
                }`}
              >
                Monatlich
              </button>
              <button
                onClick={() => setIsYearly(true)}
                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                  isYearly ? 'bg-secondary text-white shadow-md' : 'text-secondary/70 hover:text-secondary'
                }`}
              >
                Jährlich
                <span className="ml-1.5 text-xs text-green-500 font-bold">-17%</span>
              </button>
            </div>
          </motion.div>
        </div>
        
        {/* Mini Skyline */}
        <div className="skyline-container h-[80px] opacity-30">
          <div className="skyline-front" />
        </div>
      </section>
      
      <div className="py-12 md:py-16 bg-background">
        <div className="container max-w-6xl mx-auto px-4">

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
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
                <Card className={`relative h-full flex flex-col ${
                  plan.isRecommended ? 'border-primary shadow-lg scale-[1.02]' : ''
                }`}>
                  {plan.highlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground">
                        {plan.highlight}
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Radio className="w-5 h-5 text-primary" />
                      <h3 className="font-semibold">{plan.name}</h3>
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
                          {formatCHF(price)} jährlich abgerechnet
                        </p>
                      )}
                      <p className="text-sm mt-2">
                        <span className="font-medium">+ {formatCHF(plan.activationFee)}</span>
                        <span className="text-muted-foreground"> einmalige Activation Fee</span>
                      </p>
                    </div>
                    
                    <div className="p-3 rounded-lg bg-primary/5 mb-6">
                      <div className="flex items-center gap-2 text-sm">
                        <Radio className="w-4 h-4 text-primary" />
                        <span className="font-medium">{plan.audioCredits} Audio-Credits/Monat</span>
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
                    
                    <ul className="space-y-3">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  
                  <CardFooter className="pt-6">
                    <Button 
                      asChild 
                      className="w-full" 
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
          <Card className="p-6 md:p-8 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center shrink-0">
                <Shield className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">30 Tage Geld-zurück Garantie</h3>
                <p className="text-muted-foreground mb-4">
                  Wenn du im Trial merkst: passt nicht – bekommst du die Activation Fee zurück.
                </p>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Bedingungen:</p>
                  <ul className="grid sm:grid-cols-2 gap-2">
                    {GUARANTEE_CONDITIONS.map((condition, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                        <span>{condition}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  Hinweis: POS-Druck und Versand sind nicht rückerstattbar, falls bereits ausgelöst.
                </p>
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
          
          <div className="grid md:grid-cols-3 gap-6">
            {Object.values(POS_KITS).map((kit, index) => (
              <motion.div
                key={kit.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full flex flex-col">
                  <CardHeader>
                    <h3 className="font-semibold">POS Kit {kit.name}</h3>
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
            POS Kits können im Checkout hinzugefügt oder später unter{" "}
            <Link to="/go/partner/pos" className="text-primary hover:underline">
              /go/partner/pos
            </Link>{" "}
            nachbestellt werden.
          </p>
        </motion.div>

        {/* FAQ Link */}
        <div className="text-center mt-16">
          <p className="text-muted-foreground mb-4">Noch Fragen?</p>
          <Button asChild variant="outline">
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
