import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  ChevronRight, 
  ChevronLeft, 
  SkipForward,
  CheckCircle2,
  Target,
  Calculator,
  TrendingUp,
  Sparkles,
  User
} from 'lucide-react';
import { LeadCaptureStep } from './LeadCaptureStep';
import { QuizStep1Fit } from './QuizStep1Fit';
import { QuizStep2Refinancing } from './QuizStep2Refinancing';
import { QuizStep3Uplift } from './QuizStep3Uplift';
import { QuizResult } from './QuizResult';
import { QuizAnswers } from '@/lib/partner-quiz-calculations';
import { TEXTS } from '@/lib/partner-quiz-config';

const STORAGE_KEY = 'my2go_partner_quiz';

const initialAnswers: QuizAnswers = {
  // Step 0: Role & Size
  userRole: null,
  employees: null,
  
  // Step 1: Fit
  businessType: null,
  transactionsPerMonth: null,
  avgTicket: null,
  loyaltyShare: null,
  incentivePossible: null,
  locations: null,
  
  // Step 2: Fixcosts
  fixcosts: {},
  processMaturity: {
    hasCRM: false,
    requestsReviews: false,
    followsUpLeads: false,
    capturesCustomers: false,
    canRedeem: false
  },
  energyViaNebenkosten: null,
  hasOwnEnergyContract: null,
  yearlyConsumption: null,
  unknownHoster: false,
  emailViaHoster: false,
  openToSponsoring: null,
  sponsorCategories: [],
  sponsorSlots: [],
  contactsPerMonth: null,
  rentNegotiationPossible: false,
  
  // Step 3: Uplift
  leadsPerMonth: null,
  consistentFollowUp: null,
  conversionRate: null,
  partnerCommitment: null,
  unknownLeads: false,
  unknownConversion: false,
  
  // Company data
  companyName: '',
  companyAddress: '',
  companyPostalCode: '',
  companyCity: '',
  contactPerson: '',
  contactEmail: '',
  contactPhone: '',
  contractNumbers: {}
};

export function PartnerFitQuiz() {
  const [showLeadCapture, setShowLeadCapture] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [answers, setAnswers] = useState<QuizAnswers>(initialAnswers);
  const [showResult, setShowResult] = useState(false);
  const [dbPercent, setDbPercent] = useState(0.5);

  // Load from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setAnswers(prev => ({ ...prev, ...parsed }));
        // If we have lead data, skip lead capture
        if (parsed.contactPerson && parsed.contactEmail && parsed.contactPhone) {
          setShowLeadCapture(false);
        }
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
    } catch {
      // Ignore storage errors
    }
  }, [answers]);

  const updateAnswers = (updates: Partial<QuizAnswers>) => {
    setAnswers(prev => ({ ...prev, ...updates }));
  };

  const steps = [
    { id: 0, title: 'Kontakt', icon: User, color: 'text-secondary' },
    { id: 1, title: TEXTS.stepTitles[1], icon: Target, color: 'text-primary' },
    { id: 2, title: TEXTS.stepTitles[2], icon: Calculator, color: 'text-accent' },
    { id: 3, title: TEXTS.stepTitles[3], icon: TrendingUp, color: 'text-green-500' }
  ];

  // Progress calculation: 0 = lead capture, 1-3 = quiz steps, 4 = result
  const totalSteps = 4; // lead + 3 quiz steps
  const currentProgress = showLeadCapture ? 0 : currentStep;
  const progress = showResult ? 100 : (currentProgress / totalSteps) * 100;

  const scrollToBuy = () => {
    const pricingSection = document.getElementById('pricing-section');
    if (pricingSection) {
      pricingSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleLeadCaptureComplete = () => {
    setShowLeadCapture(false);
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(prev => prev + 1);
    } else {
      setShowResult(true);
    }
  };

  const handlePrev = () => {
    if (showResult) {
      setShowResult(false);
    } else if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    } else if (currentStep === 1) {
      setShowLeadCapture(true);
    }
  };

  const handleSkip = () => {
    setShowResult(true);
  };

  const handleReset = () => {
    setAnswers(initialAnswers);
    setCurrentStep(1);
    setShowResult(false);
    setShowLeadCapture(true);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <section className="py-12 md:py-20 bg-gradient-to-b from-muted/30 to-background">
      <div className="container max-w-4xl mx-auto px-4">
        {/* Header */}
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wide mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            Interaktiver Check
          </span>
          <h2 className="text-2xl md:text-3xl font-bold mb-3">
            Passt My2Go zu Ihrem Betrieb?
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            In 3 Minuten erfahren Sie, ob My2Go zu Ihnen passt und wie Sie es risikolos finanzieren können.
          </p>
        </motion.div>

        {/* Main Card */}
        <Card className="overflow-hidden border-2 border-border/50 shadow-xl">
          {/* Stepper Header - only show after lead capture */}
          {!showLeadCapture && (
            <div className="bg-muted/50 p-4 border-b border-border">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {steps.slice(1).map((step) => (
                    <button
                      key={step.id}
                      onClick={() => {
                        if (!showResult) setCurrentStep(step.id);
                        if (showResult) setShowResult(false);
                      }}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        (showResult && step.id <= 3) || currentStep === step.id
                          ? 'bg-card border border-border shadow-sm'
                          : currentStep > step.id
                            ? 'text-muted-foreground'
                            : 'text-muted-foreground/50'
                      }`}
                    >
                      {currentStep > step.id || showResult ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <step.icon className={`w-4 h-4 ${currentStep === step.id ? step.color : ''}`} />
                      )}
                      <span className="hidden sm:inline">{step.title}</span>
                      <span className="sm:hidden">{step.id}</span>
                    </button>
                  ))}
                </div>
                
                {!showResult && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSkip}
                    className="text-muted-foreground"
                  >
                    <SkipForward className="w-4 h-4 mr-1" />
                    <span className="hidden sm:inline">Zum Ergebnis</span>
                  </Button>
                )}
              </div>
              
              <Progress value={progress} className="h-1.5" />
            </div>
          )}

          {/* Content */}
          <div className="p-6">
            <AnimatePresence mode="wait">
              {showLeadCapture ? (
                <motion.div
                  key="lead-capture"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <LeadCaptureStep
                    answers={answers}
                    updateAnswers={updateAnswers}
                    onContinue={handleLeadCaptureComplete}
                  />
                </motion.div>
              ) : !showResult ? (
                <motion.div
                  key={`step-${currentStep}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {currentStep === 1 && (
                    <QuizStep1Fit 
                      answers={answers} 
                      updateAnswers={updateAnswers} 
                    />
                  )}
                  {currentStep === 2 && (
                    <QuizStep2Refinancing 
                      answers={answers} 
                      updateAnswers={updateAnswers}
                      dbPercent={dbPercent}
                      setDbPercent={setDbPercent}
                    />
                  )}
                  {currentStep === 3 && (
                    <QuizStep3Uplift 
                      answers={answers} 
                      updateAnswers={updateAnswers} 
                    />
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                >
                  <QuizResult 
                    answers={answers}
                    updateAnswers={updateAnswers}
                    dbPercent={dbPercent}
                    onScrollToBuy={scrollToBuy}
                    onReset={handleReset}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer Navigation - only for quiz steps */}
          {!showLeadCapture && !showResult && (
            <div className="bg-muted/30 p-4 border-t border-border flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={handlePrev}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Zurück
              </Button>
              
              <div className="text-sm text-muted-foreground">
                Schritt {currentStep} von 3
              </div>
              
              <Button onClick={handleNext}>
                {currentStep === 3 ? 'Ergebnis anzeigen' : 'Weiter'}
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}
        </Card>

        {/* Disclaimer */}
        <p className="text-xs text-muted-foreground text-center mt-4 max-w-2xl mx-auto">
          {TEXTS.disclaimer}
        </p>
      </div>
    </section>
  );
}
