import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Shield, Loader2, CheckCircle2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { GUARANTEE_CONDITIONS } from "@/lib/partner-pricing";

const refundSchema = z.object({
  companyName: z.string().min(2, "Firmenname ist erforderlich"),
  contactName: z.string().min(2, "Kontaktperson ist erforderlich"),
  email: z.string().email("Gültige E-Mail erforderlich"),
  stripeEmail: z.string().email("Stripe E-Mail ist erforderlich"),
  startDate: z.string().min(1, "Startdatum ist erforderlich"),
  conditionsConfirmed: z.boolean().refine(val => val === true, {
    message: "Bitte bestätige, dass alle Bedingungen erfüllt sind"
  }),
  reason: z.string().min(10, "Bitte gib einen Grund an (mind. 10 Zeichen)"),
});

type RefundFormData = z.infer<typeof refundSchema>;

export default function PartnerRefundPage() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<RefundFormData>({
    resolver: zodResolver(refundSchema),
    defaultValues: {
      companyName: "",
      contactName: "",
      email: "",
      stripeEmail: "",
      startDate: "",
      conditionsConfirmed: false,
      reason: "",
    }
  });

  const onSubmit = async (data: RefundFormData) => {
    setIsSubmitting(true);
    
    try {
      console.log("Refund request:", data);
      
      if (typeof window !== 'undefined' && 'gtag' in window) {
        (window as any).gtag('event', 'refund_form_submitted');
      }
      
      setIsSubmitted(true);
    } catch (error: any) {
      toast({
        title: "Fehler",
        description: error.message || "Bitte versuche es erneut.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="py-20 min-h-[60vh] flex items-center bg-background">
        <div className="container max-w-lg mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="w-20 h-20 rounded-3xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-2xl font-bold mb-4">Antrag eingereicht</h1>
            <p className="text-muted-foreground mb-6">
              Vielen Dank. Wir melden uns innert 2 Werktagen bei dir.
            </p>
            <Button asChild variant="outline">
              <Link to="/go">
                <ArrowLeft className="mr-2 w-4 h-4" />
                Zurück zur Übersicht
              </Link>
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden bg-background">
      {/* Hero Section */}
      <section className="relative pt-20 pb-10 md:pt-24 md:pb-14 overflow-hidden bg-gradient-to-b from-green-50 via-green-50/50 to-background dark:from-green-950/30 dark:via-green-950/10 dark:to-background">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-green-200/30 dark:bg-green-800/20 rounded-full blur-3xl" />
        </div>
        
        <div className="container relative z-10 max-w-2xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="w-14 h-14 rounded-2xl bg-green-100 dark:bg-green-900/50 flex items-center justify-center mx-auto mb-5">
              <Shield className="w-7 h-7 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Geld-zurück Garantie
            </h1>
            <p className="text-lg text-muted-foreground">
              Passt nicht? Kein Problem. Wir erstatten die Activation Fee.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="py-12 md:py-16">
        <div className="container max-w-2xl mx-auto px-4">
          {/* Conditions */}
          <Card className="mb-8 bg-muted/30 border-2">
            <CardContent className="p-6">
              <h3 className="font-bold text-lg mb-4">Voraussetzungen für die Erstattung:</h3>
              <ul className="space-y-3">
                {GUARANTEE_CONDITIONS.map((condition, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-xs font-bold text-primary">{i + 1}</span>
                    <span>{condition}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground mt-5 p-3 rounded-lg bg-background border">
                💡 POS-Druck und Versandkosten sind nicht erstattbar, falls bereits ausgelöst.
              </p>
            </CardContent>
          </Card>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <Card className="border-2">
                <CardContent className="p-6 space-y-5">
                  <h3 className="font-bold text-lg">Antrag einreichen</h3>
                  
                  <div className="grid sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="companyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Firmenname *</FormLabel>
                          <FormControl>
                            <Input placeholder="Muster GmbH" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="contactName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Kontaktperson *</FormLabel>
                          <FormControl>
                            <Input placeholder="Max Muster" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>E-Mail *</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="max@muster.ch" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="stripeEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>E-Mail bei Stripe *</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="billing@muster.ch" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Startdatum des Trials *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="conditionsConfirmed"
                    render={({ field }) => (
                      <FormItem className="flex items-start gap-3 space-y-0 p-4 rounded-xl bg-muted/50 border">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="font-medium">Ich bestätige, dass alle oben genannten Bedingungen erfüllt sind.</FormLabel>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="reason"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Grund für die Kündigung *</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Warum passt My 2Go nicht zu dir? Dein Feedback hilft uns, besser zu werden."
                            rows={4}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full h-12 font-bold" 
                    size="lg"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                        Wird gesendet...
                      </>
                    ) : (
                      "Antrag einreichen"
                    )}
                  </Button>
                </CardContent>
              </Card>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
