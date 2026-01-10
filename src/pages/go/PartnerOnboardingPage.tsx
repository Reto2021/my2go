import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Building2, 
  User, 
  MapPin, 
  Clock, 
  Target, 
  Upload,
  ArrowRight,
  Loader2,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

const onboardingSchema = z.object({
  // Company
  companyName: z.string().min(2, "Firmenname ist erforderlich"),
  industry: z.string().min(1, "Branche ist erforderlich"),
  website: z.string().url("Gültige URL erforderlich").optional().or(z.literal("")),
  
  // Location
  street: z.string().min(2, "Strasse ist erforderlich"),
  streetNumber: z.string().min(1, "Hausnummer ist erforderlich"),
  postalCode: z.string().min(4, "PLZ ist erforderlich"),
  city: z.string().min(2, "Ort ist erforderlich"),
  
  // Contact
  contactName: z.string().min(2, "Name ist erforderlich"),
  contactEmail: z.string().email("Gültige E-Mail erforderlich"),
  contactPhone: z.string().min(10, "Telefonnummer ist erforderlich"),
  whatsappOptIn: z.boolean(),
  
  // Google
  googleBusinessUrl: z.string().url("Gültige URL erforderlich").optional().or(z.literal("")),
  
  // Opening Hours
  openingHours: z.string().optional(),
  
  // Goals
  goals: z.array(z.string()).min(1, "Mindestens ein Ziel auswählen"),
  
  // Shipping (if POS Kit)
  shippingStreet: z.string().optional(),
  shippingStreetNumber: z.string().optional(),
  shippingPostalCode: z.string().optional(),
  shippingCity: z.string().optional(),
  shippingSameAsLocation: z.boolean().optional(),
});

type OnboardingFormData = z.infer<typeof onboardingSchema>;

const INDUSTRIES = [
  "Restaurant / Café",
  "Bar / Club",
  "Retail / Laden",
  "Dienstleistung",
  "Fitness / Wellness",
  "Hotel / Unterkunft",
  "Handwerk",
  "Andere"
];

const GOALS = [
  { id: "reviews", label: "Mehr Google Reviews" },
  { id: "frequency", label: "Höhere Besuchsfrequenz" },
  { id: "retention", label: "Bessere Kundenbindung" },
  { id: "awareness", label: "Mehr Bekanntheit (Radio)" },
  { id: "newCustomers", label: "Neue Kunden gewinnen" }
];

export default function PartnerOnboardingPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  
  // TODO: Check if user has valid checkout session
  const hasPosKit = true; // This would come from session/context

  const form = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      companyName: "",
      industry: "",
      website: "",
      street: "",
      streetNumber: "",
      postalCode: "",
      city: "",
      contactName: "",
      contactEmail: "",
      contactPhone: "",
      whatsappOptIn: false,
      googleBusinessUrl: "",
      openingHours: "",
      goals: [],
      shippingSameAsLocation: true,
      shippingStreet: "",
      shippingStreetNumber: "",
      shippingPostalCode: "",
      shippingCity: "",
    }
  });

  const steps = [
    { id: "company", title: "Firma", icon: Building2 },
    { id: "location", title: "Standort", icon: MapPin },
    { id: "contact", title: "Kontakt", icon: User },
    { id: "details", title: "Details", icon: Clock },
    { id: "goals", title: "Ziele", icon: Target },
  ];

  const onSubmit = async (data: OnboardingFormData) => {
    setIsSubmitting(true);
    
    try {
      // TODO: Submit to backend
      console.log("Onboarding data:", data);
      
      // Track event
      if (typeof window !== 'undefined' && 'gtag' in window) {
        (window as any).gtag('event', 'onboarding_completed');
      }
      
      toast({
        title: "Onboarding abgeschlossen!",
        description: "Dein Setup beginnt jetzt. Wir melden uns in Kürze."
      });
      
      // Redirect to success or dashboard
      navigate("/partner-portal");
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

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="py-12 md:py-20">
      <div className="container max-w-3xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold mb-2">Onboarding</h1>
          <p className="text-muted-foreground">
            Fülle die folgenden Informationen aus, damit wir dein Setup starten können.
          </p>
        </motion.div>

        {/* Progress Steps */}
        <div className="flex justify-between mb-8 relative">
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-muted -z-10" />
          <div 
            className="absolute top-5 left-0 h-0.5 bg-primary -z-10 transition-all duration-300"
            style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
          />
          
          {steps.map((step, index) => (
            <div 
              key={step.id}
              className="flex flex-col items-center"
            >
              <div 
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                  index <= currentStep 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {index < currentStep ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <step.icon className="w-5 h-5" />
                )}
              </div>
              <span className="text-xs mt-2 hidden sm:block">{step.title}</span>
            </div>
          ))}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <Card>
              <CardContent className="p-6">
                {/* Step 0: Company */}
                {currentStep === 0 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4"
                  >
                    <h2 className="text-xl font-semibold mb-4">Firma</h2>
                    
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
                      name="industry"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Branche *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Branche wählen" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {INDUSTRIES.map((industry) => (
                                <SelectItem key={industry} value={industry}>
                                  {industry}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Website</FormLabel>
                          <FormControl>
                            <Input placeholder="https://www.muster.ch" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </motion.div>
                )}

                {/* Step 1: Location */}
                {currentStep === 1 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4"
                  >
                    <h2 className="text-xl font-semibold mb-4">Standort</h2>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="street"
                        render={({ field }) => (
                          <FormItem className="col-span-2">
                            <FormLabel>Strasse *</FormLabel>
                            <FormControl>
                              <Input placeholder="Bahnhofstrasse" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="streetNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nr. *</FormLabel>
                            <FormControl>
                              <Input placeholder="1" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="postalCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>PLZ *</FormLabel>
                            <FormControl>
                              <Input placeholder="8000" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem className="col-span-2">
                            <FormLabel>Ort *</FormLabel>
                            <FormControl>
                              <Input placeholder="Zürich" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </motion.div>
                )}

                {/* Step 2: Contact */}
                {currentStep === 2 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4"
                  >
                    <h2 className="text-xl font-semibold mb-4">Kontaktperson</h2>
                    
                    <FormField
                      control={form.control}
                      name="contactName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Max Muster" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="contactEmail"
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
                      name="contactPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefon *</FormLabel>
                          <FormControl>
                            <Input type="tel" placeholder="+41 79 123 45 67" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="whatsappOptIn"
                      render={({ field }) => (
                        <FormItem className="flex items-start gap-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>WhatsApp-Updates erhalten</FormLabel>
                            <FormDescription>
                              Wichtige Infos und Support via WhatsApp
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  </motion.div>
                )}

                {/* Step 3: Details */}
                {currentStep === 3 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4"
                  >
                    <h2 className="text-xl font-semibold mb-4">Details</h2>
                    
                    <FormField
                      control={form.control}
                      name="googleBusinessUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Google Business Profil URL</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="https://g.page/..." 
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Link zu deinem Google Business Eintrag
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="openingHours"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Öffnungszeiten</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Mo-Fr: 09:00-18:00&#10;Sa: 10:00-16:00&#10;So: geschlossen"
                              rows={4}
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </motion.div>
                )}

                {/* Step 4: Goals */}
                {currentStep === 4 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4"
                  >
                    <h2 className="text-xl font-semibold mb-4">Deine Ziele</h2>
                    
                    <FormField
                      control={form.control}
                      name="goals"
                      render={() => (
                        <FormItem>
                          <FormLabel>Was möchtest du erreichen? *</FormLabel>
                          <div className="space-y-3 mt-2">
                            {GOALS.map((goal) => (
                              <FormField
                                key={goal.id}
                                control={form.control}
                                name="goals"
                                render={({ field }) => (
                                  <FormItem className="flex items-center gap-3 space-y-0">
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(goal.id)}
                                        onCheckedChange={(checked) => {
                                          const current = field.value || [];
                                          if (checked) {
                                            field.onChange([...current, goal.id]);
                                          } else {
                                            field.onChange(current.filter((v) => v !== goal.id));
                                          }
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal cursor-pointer">
                                      {goal.label}
                                    </FormLabel>
                                  </FormItem>
                                )}
                              />
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {hasPosKit && (
                      <>
                        <div className="border-t pt-4 mt-6">
                          <h3 className="font-semibold mb-4">Versandadresse POS Kit</h3>
                          
                          <FormField
                            control={form.control}
                            name="shippingSameAsLocation"
                            render={({ field }) => (
                              <FormItem className="flex items-center gap-3 space-y-0 mb-4">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">
                                  Gleich wie Standortadresse
                                </FormLabel>
                              </FormItem>
                            )}
                          />
                          
                          {!form.watch("shippingSameAsLocation") && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-3 gap-4">
                                <FormField
                                  control={form.control}
                                  name="shippingStreet"
                                  render={({ field }) => (
                                    <FormItem className="col-span-2">
                                      <FormLabel>Strasse</FormLabel>
                                      <FormControl>
                                        <Input placeholder="Strasse" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name="shippingStreetNumber"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Nr.</FormLabel>
                                      <FormControl>
                                        <Input placeholder="1" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                              <div className="grid grid-cols-3 gap-4">
                                <FormField
                                  control={form.control}
                                  name="shippingPostalCode"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>PLZ</FormLabel>
                                      <FormControl>
                                        <Input placeholder="8000" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={form.control}
                                  name="shippingCity"
                                  render={({ field }) => (
                                    <FormItem className="col-span-2">
                                      <FormLabel>Ort</FormLabel>
                                      <FormControl>
                                        <Input placeholder="Zürich" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </motion.div>
                )}

                {/* Navigation */}
                <div className="flex justify-between mt-8 pt-6 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    disabled={currentStep === 0}
                  >
                    Zurück
                  </Button>
                  
                  {currentStep < steps.length - 1 ? (
                    <Button type="button" onClick={nextStep}>
                      Weiter
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  ) : (
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                          Wird gesendet...
                        </>
                      ) : (
                        <>
                          Onboarding abschliessen
                          <CheckCircle2 className="ml-2 w-4 h-4" />
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </form>
        </Form>

        {/* Kickoff Call CTA */}
        <div className="text-center mt-8">
          <p className="text-muted-foreground mb-2">Fragen? Buche einen Kickoff-Call.</p>
          <Button variant="link" asChild>
            <a href="#" target="_blank" rel="noopener noreferrer">
              15 Minuten Kickoff buchen →
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
