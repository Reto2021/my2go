import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  QuizAnswers,
  calculateFitScore,
  calculateRefinancing,
  getPlanByKey
} from '@/lib/partner-quiz-calculations';
import { formatCHF } from '@/lib/partner-quiz-config';
import { 
  ArrowRight, 
  Calendar, 
  CreditCard, 
  Loader2,
  CheckCircle2,
  Phone,
  ExternalLink
} from 'lucide-react';

interface Props {
  answers: QuizAnswers;
  dbPercent: number;
  onScrollToBuy: () => void;
}

// HighLevel Calendar Embed URL - replace with your actual booking link
const HIGHLEVEL_CALENDAR_URL = 'https://api.leadconnectorhq.com/widget/booking/';

export function NextStepCTA({ answers, dbPercent, onScrollToBuy }: Props) {
  const [selectedOption, setSelectedOption] = useState<'direct' | 'appointment' | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);

  const fitResult = calculateFitScore(answers);
  const plan = getPlanByKey(fitResult.recommendedPlan);
  const refinancing = calculateRefinancing(answers, plan.priceCHF, dbPercent);
  
  const isCovered = refinancing.gap <= 0;

  const openHighLevelCalendar = () => {
    // Option 1: Open in new tab
    // window.open(HIGHLEVEL_CALENDAR_URL, '_blank');
    
    // Option 2: Show embedded calendar
    setShowCalendar(true);
  };

  return (
    <div className="space-y-4 pt-6 border-t border-border">
      <div className="text-center">
        <h4 className="font-bold text-lg mb-2">Wie möchten Sie weitermachen?</h4>
        <p className="text-sm text-muted-foreground">
          Wählen Sie die Option, die am besten zu Ihnen passt.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {/* Direct Purchase */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Card 
            className={`p-5 cursor-pointer transition-all h-full ${
              selectedOption === 'direct' 
                ? 'border-2 border-primary bg-primary/5' 
                : 'border-2 border-border hover:border-primary/50'
            }`}
            onClick={() => setSelectedOption('direct')}
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-primary/10">
                <CreditCard className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h5 className="font-bold mb-1">Direkt starten</h5>
                <p className="text-sm text-muted-foreground mb-3">
                  Jetzt online abschliessen und in 7 Tagen live gehen.
                </p>
                <div className="space-y-1 text-sm">
                  <p className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    30 Tage Geld-zurück Garantie
                  </p>
                  <p className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    Sofort-Onboarding inkl.
                  </p>
                </div>
              </div>
            </div>
            {selectedOption === 'direct' && (
              <Button 
                className="w-full mt-4" 
                size="lg"
                onClick={(e) => {
                  e.stopPropagation();
                  onScrollToBuy();
                }}
              >
                Zu den Paketen
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </Card>
        </motion.div>

        {/* Book Appointment */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Card 
            className={`p-5 cursor-pointer transition-all h-full ${
              selectedOption === 'appointment' 
                ? 'border-2 border-accent bg-accent/5' 
                : 'border-2 border-border hover:border-accent/50'
            }`}
            onClick={() => setSelectedOption('appointment')}
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-accent/10">
                <Calendar className="w-6 h-6 text-accent-foreground" />
              </div>
              <div className="flex-1">
                <h5 className="font-bold mb-1">Termin buchen</h5>
                <p className="text-sm text-muted-foreground mb-3">
                  Kostenlose 15-min Beratung mit unserem Team.
                </p>
                <div className="space-y-1 text-sm">
                  <p className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    Persönliche Beratung
                  </p>
                  <p className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    Alle Fragen klären
                  </p>
                </div>
              </div>
            </div>
            {selectedOption === 'appointment' && (
              <Button 
                variant="outline"
                className="w-full mt-4 border-accent hover:bg-accent hover:text-accent-foreground" 
                size="lg"
                onClick={(e) => {
                  e.stopPropagation();
                  openHighLevelCalendar();
                }}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Termin wählen
              </Button>
            )}
          </Card>
        </motion.div>
      </div>

      {/* HighLevel Calendar Embed */}
      {showCalendar && (
        <Card className="p-4 mt-4">
          <div className="flex items-center justify-between mb-4">
            <h5 className="font-bold">Termin buchen</h5>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowCalendar(false)}
            >
              Schliessen
            </Button>
          </div>
          
          {/* Calendar Embed Placeholder */}
          <div className="bg-muted rounded-lg p-8 text-center">
            <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              Kalender-Integration wird geladen...
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Für die vollständige Kalender-Integration benötigen wir Ihre HighLevel Calendar-ID.
            </p>
            
            {/* Fallback: Direct phone/email */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="outline" asChild>
                <a href="tel:+41443001500">
                  <Phone className="w-4 h-4 mr-2" />
                  +41 44 300 15 00
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a 
                  href="https://calendly.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Extern buchen
                </a>
              </Button>
            </div>
          </div>

          {/* Uncomment this when you have the actual HighLevel embed code */}
          {/* 
          <iframe
            src={`${HIGHLEVEL_CALENDAR_URL}YOUR_CALENDAR_ID`}
            style={{ width: '100%', height: '600px', border: 'none' }}
            scrolling="no"
            title="Termin buchen"
          />
          */}
        </Card>
      )}

      {/* Quick Contact */}
      <div className="text-center pt-4">
        <p className="text-sm text-muted-foreground">
          Fragen? Rufen Sie uns an: 
          <a href="tel:+41443001500" className="font-medium text-primary ml-1">
            +41 44 300 15 00
          </a>
        </p>
      </div>
    </div>
  );
}
