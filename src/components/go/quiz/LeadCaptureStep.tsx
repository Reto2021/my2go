import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Building2, 
  User, 
  Mail, 
  Phone, 
  Loader2,
  MapPin,
  ArrowRight,
  Sparkles,
  Briefcase,
  Users,
  Info,
  Check,
  X,
  ChevronDown
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { QuizAnswers, UserRole, EmployeeRange } from '@/lib/partner-quiz-calculations';
import { ROLE_OPTIONS, EMPLOYEE_OPTIONS, ROLE_HINTS } from '@/lib/partner-quiz-config';

interface Props {
  answers: QuizAnswers;
  updateAnswers: (updates: Partial<QuizAnswers>) => void;
  onContinue: () => void;
}

interface ZefixCompany {
  uid: string;
  name: string;
  legalSeat: string;
  legalForm: string;
  registryOfCommerceId?: number;
  address?: {
    street?: string;
    houseNumber?: string;
    swissZipCode?: string;
    city?: string;
  };
  persons?: {
    name: string;
    role: string;
    signature?: string;
  }[];
}

interface ChipOption<T> {
  value: T;
  label: string;
}

type AccordionSection = 'company' | 'contact' | 'role' | 'employees' | 'terms';

function ChipSelect<T extends string>({ 
  options, 
  value, 
  onChange,
  columns = 2
}: { 
  options: readonly ChipOption<T>[]; 
  value: T | null; 
  onChange: (v: T) => void;
  columns?: number;
}) {
  return (
    <div className={`grid gap-2 ${columns === 2 ? 'grid-cols-2' : columns === 3 ? 'grid-cols-3' : 'grid-cols-4'}`}>
      {options.map(opt => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
            value === opt.value
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border hover:border-primary/50 text-foreground'
          }`}
        >
          <span className="truncate">{opt.label}</span>
        </button>
      ))}
    </div>
  );
}

// Accordion Section Component
function AccordionItem({ 
  id,
  title, 
  icon: Icon,
  isOpen, 
  isCompleted,
  isDisabled,
  children,
  stepNumber,
  onHeaderClick
}: { 
  id: AccordionSection;
  title: string;
  icon: React.ElementType;
  isOpen: boolean;
  isCompleted: boolean;
  isDisabled: boolean;
  children: React.ReactNode;
  stepNumber: number;
  onHeaderClick?: () => void;
}) {
  const canClick = !isDisabled && (isCompleted || isOpen);
  
  return (
    <div className={`rounded-xl border-2 overflow-hidden transition-all ${
      isOpen ? 'border-primary bg-card shadow-lg' : 
      isCompleted ? 'border-green-500/50 bg-green-50/50 dark:bg-green-950/20' : 
      isDisabled ? 'border-border/50 bg-muted/30 opacity-60' :
      'border-border bg-card'
    }`}>
      {/* Header - Clickable when completed */}
      <button
        type="button"
        onClick={canClick ? onHeaderClick : undefined}
        disabled={isDisabled}
        className={`w-full flex items-center gap-3 p-4 text-left transition-colors ${
          canClick ? 'cursor-pointer hover:bg-muted/50' : 
          isDisabled ? 'cursor-not-allowed' : ''
        }`}
      >
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-all ${
          isCompleted ? 'bg-green-500 text-white' :
          isOpen ? 'bg-primary text-primary-foreground' :
          'bg-muted text-muted-foreground'
        }`}>
          {isCompleted ? <Check className="w-4 h-4" /> : stepNumber}
        </div>
        <div className="flex items-center gap-2 flex-1">
          <Icon className={`w-4 h-4 ${isCompleted ? 'text-green-600' : isOpen ? 'text-primary' : 'text-muted-foreground'}`} />
          <span className={`font-semibold ${isCompleted ? 'text-green-700 dark:text-green-400' : ''}`}>{title}</span>
        </div>
        {isCompleted && !isOpen && (
          <ChevronDown className="w-5 h-5 text-green-500 transition-transform" />
        )}
        {isOpen && (
          <ChevronDown className="w-5 h-5 text-primary rotate-180 transition-transform" />
        )}
      </button>
      
      {/* Content */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-2 border-t border-border/50">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function LeadCaptureStep({ answers, updateAnswers, onContinue }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);
  const [searchResults, setSearchResults] = useState<ZefixCompany[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualMode, setManualMode] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<ZefixCompany | null>(null);
  const [foundPersons, setFoundPersons] = useState<{ name: string; role: string; signature?: string }[]>([]);
  const [activeSection, setActiveSection] = useState<AccordionSection>('company');

  // Section validation
  const sectionValidation = useMemo(() => ({
    company: Boolean(
      answers.companyName?.trim() && 
      answers.companyCity?.trim()
    ),
    contact: Boolean(
      answers.contactPerson?.trim() &&
      answers.contactEmail?.trim() &&
      answers.contactPhone?.trim()
    ),
    role: Boolean(answers.userRole),
    employees: Boolean(answers.employees),
    terms: acceptedTerms
  }), [answers, acceptedTerms]);

  // Auto-advance to next section when current is completed
  useEffect(() => {
    const sections: AccordionSection[] = ['company', 'contact', 'role', 'employees', 'terms'];
    const currentIndex = sections.indexOf(activeSection);
    
    if (sectionValidation[activeSection] && currentIndex < sections.length - 1) {
      // Small delay for better UX
      const timer = setTimeout(() => {
        setActiveSection(sections[currentIndex + 1]);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [sectionValidation, activeSection]);

  // Debounced autocomplete search
  const searchZefix = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    
    setIsSearching(true);
    setError(null);
    
    try {
      const isUID = /^CHE-?\d{3}\.\d{3}\.\d{3}$/i.test(query.trim());
      
      const { data, error: fnError } = await supabase.functions.invoke('zefix-lookup', {
        body: isUID 
          ? { uid: query.trim() }
          : { query: query.trim() }
      });

      if (fnError) throw fnError;
      
      if (data?.companies && data.companies.length > 0) {
        setSearchResults(data.companies);
        setShowResults(true);
        setError(null);
      } else {
        setSearchResults([]);
        setShowResults(false);
        if (query.length >= 3) {
          setError('Keine Firma gefunden.');
        }
      }
    } catch (err) {
      console.error('Zefix search error:', err);
      setSearchResults([]);
      setShowResults(false);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Autocomplete effect with debounce
  useEffect(() => {
    if (manualMode || answers.companyName) return;
    
    const timeoutId = setTimeout(() => {
      if (searchQuery.length >= 2) {
        searchZefix(searchQuery);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, manualMode, answers.companyName, searchZefix]);

  const selectCompany = async (company: ZefixCompany) => {
    // Immediately set name and city from search results
    updateAnswers({
      companyName: company.name,
      companyCity: company.legalSeat || ''
    });
    
    setSelectedCompany(company);
    setShowResults(false);
    setSearchQuery('');
    setManualMode(false);
    
    // Fetch details (address, persons) in background
    if (company.uid && company.registryOfCommerceId) {
      setIsFetchingDetails(true);
      try {
        const { data, error: fnError } = await supabase.functions.invoke('zefix-lookup', {
          body: { 
            fetchDetails: true,
            uid: company.uid,
            registryOfCommerceId: company.registryOfCommerceId,
            legalSeat: company.legalSeat,
            companyName: company.name
          }
        });
        
        if (!fnError && data?.success) {
          if (data.address) {
            const addressStr = `${data.address.street || ''} ${data.address.houseNumber || ''}`.trim();
            updateAnswers({
              companyAddress: addressStr,
              companyPostalCode: data.address.swissZipCode || '',
              companyCity: data.address.city || company.legalSeat || ''
            });
          }
          if (data.persons && data.persons.length > 0) {
            console.log('Found persons:', data.persons);
            setFoundPersons(data.persons);
          } else {
            setFoundPersons([]);
          }
        }
      } catch (err) {
        console.error('Error fetching company details:', err);
      } finally {
        setIsFetchingDetails(false);
      }
    }
  };

  const clearCompany = () => {
    setSelectedCompany(null);
    setFoundPersons([]);
    updateAnswers({
      companyName: '', 
      companyAddress: '', 
      companyPostalCode: '', 
      companyCity: '',
      contactPerson: ''
    });
    setSearchQuery('');
    setManualMode(false);
    setError(null);
  };

  const enableManualMode = () => {
    setManualMode(true);
    setShowResults(false);
    setError(null);
    if (searchQuery.trim()) {
      updateAnswers({ companyName: searchQuery.trim() });
    }
  };

  const isValid = 
    sectionValidation.company &&
    sectionValidation.contact &&
    sectionValidation.role &&
    sectionValidation.employees &&
    sectionValidation.terms;

  const roleHint = answers.userRole ? ROLE_HINTS[answers.userRole] : null;

  // Calculate progress
  const sections: AccordionSection[] = ['company', 'contact', 'role', 'employees', 'terms'];
  const completedCount = sections.filter(s => sectionValidation[s]).length;
  const progressPercent = (completedCount / sections.length) * 100;

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Fortschritt</span>
          <span className="font-medium text-primary">{completedCount} von {sections.length}</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        </div>
      </div>

      <motion.div 
        className="text-center mb-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-semibold mb-3">
          <Sparkles className="w-4 h-4" />
          Kostenloser Check
        </div>
        <h3 className="text-xl font-bold mb-1">
          Wer sind Sie?
        </h3>
        <p className="text-muted-foreground text-sm">
          Bitte alle Felder ausfüllen für ein massgeschneidertes Ergebnis.
        </p>
      </motion.div>

      {/* SECTION 1: Company */}
      <AccordionItem
        id="company"
        title="Ihre Firma"
        icon={Building2}
        isOpen={activeSection === 'company'}
        isCompleted={sectionValidation.company && activeSection !== 'company'}
        isDisabled={false}
        stepNumber={1}
        onHeaderClick={() => setActiveSection('company')}
      >
        {answers.companyName && !manualMode ? (
          <div className="space-y-3">
            <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 flex-1">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  <span className="font-semibold text-sm">{answers.companyName}</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={clearCompany}
                  className="shrink-0 h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            {/* Enhanced Loading Animation */}
            {isFetchingDetails && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 rounded-lg border border-primary/20"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                    <MapPin className="w-4 h-4 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-primary">Adresse wird geladen...</p>
                    <p className="text-xs text-muted-foreground">Google Places & Handelsregister</p>
                  </div>
                </div>
                <div className="mt-2 space-y-1">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </motion.div>
            )}
            
            {!isFetchingDetails && (
              <>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  {answers.companyAddress ? 'Adresse übernommen (editierbar)' : 'Adresse bitte ergänzen'}
                </p>
                
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <Input
                      value={answers.companyAddress || ''}
                      onChange={(e) => updateAnswers({ companyAddress: e.target.value })}
                      placeholder="Strasse & Nr."
                      className="h-10 text-sm"
                    />
                  </div>
                  <Input
                    value={answers.companyPostalCode || ''}
                    onChange={(e) => updateAnswers({ companyPostalCode: e.target.value })}
                    placeholder="PLZ"
                    className="h-10 text-sm"
                  />
                </div>
                <Input
                  value={answers.companyCity || ''}
                  onChange={(e) => updateAnswers({ companyCity: e.target.value })}
                  placeholder="Ort"
                  className="h-10 text-sm"
                />
              </>
            )}
          </div>
        ) : manualMode ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Manuelle Eingabe</span>
              <Button variant="ghost" size="sm" onClick={() => setManualMode(false)}>
                Zefix-Suche
              </Button>
            </div>
            <Input
              value={answers.companyName || ''}
              onChange={(e) => updateAnswers({ companyName: e.target.value })}
              placeholder="Firmenname"
              className="h-10"
            />
            <div className="grid grid-cols-3 gap-2">
              <Input
                value={answers.companyAddress || ''}
                onChange={(e) => updateAnswers({ companyAddress: e.target.value })}
                placeholder="Strasse & Nr."
                className="h-10 col-span-2"
              />
              <Input
                value={answers.companyPostalCode || ''}
                onChange={(e) => updateAnswers({ companyPostalCode: e.target.value })}
                placeholder="PLZ"
                className="h-10"
              />
            </div>
            <Input
              value={answers.companyCity || ''}
              onChange={(e) => updateAnswers({ companyCity: e.target.value })}
              placeholder="Ort"
              className="h-10"
            />
          </div>
        ) : (
          <div className="relative">
            <div className="relative">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Firmenname oder UID suchen..."
                className="h-10 pr-10"
                autoComplete="off"
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
            
            {isSearching && searchQuery.length >= 2 && (
              <Card className="absolute z-10 w-full mt-1 p-2 shadow-lg animate-fade-in">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-3 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </Card>
            )}

            {!isSearching && showResults && searchResults.length > 0 && (
              <Card className="absolute z-10 w-full mt-1 p-1 max-h-48 overflow-y-auto shadow-lg animate-fade-in">
                {searchResults.map((company) => (
                  <button
                    key={company.uid}
                    onClick={() => selectCompany(company)}
                    className="w-full text-left p-3 rounded-lg hover:bg-muted transition-colors"
                  >
                    <p className="font-medium text-sm">{company.name}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {company.legalSeat} • {company.legalForm}
                    </p>
                  </button>
                ))}
              </Card>
            )}

            <div className="flex items-center justify-between mt-2">
              {error && <p className="text-sm text-amber-600">{error}</p>}
              <button
                type="button"
                onClick={enableManualMode}
                className="text-sm text-primary hover:underline ml-auto"
              >
                Manuell eingeben
              </button>
            </div>
          </div>
        )}
      </AccordionItem>

      {/* SECTION 2: Contact */}
      <AccordionItem
        id="contact"
        title="Ihre Kontaktdaten"
        icon={User}
        isOpen={activeSection === 'contact'}
        isCompleted={sectionValidation.contact && activeSection !== 'contact'}
        isDisabled={!sectionValidation.company}
        stepNumber={2}
        onHeaderClick={() => sectionValidation.company && setActiveSection('contact')}
      >
        <div className="space-y-3">
          {foundPersons.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">
                Aus Handelsregister:
              </Label>
              <div className="grid gap-1">
                {foundPersons.slice(0, 3).map((person, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => updateAnswers({ contactPerson: person.name })}
                    className={`w-full text-left p-2 rounded-lg border text-sm transition-all ${
                      answers.contactPerson === person.name
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <span className="font-medium">{person.name}</span>
                    <span className="text-muted-foreground ml-2 text-xs">{person.role}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <Label className="text-xs font-medium flex items-center gap-1 mb-1">
              <User className="w-3 h-3" /> Ihr Name *
            </Label>
            <Input
              value={answers.contactPerson || ''}
              onChange={(e) => updateAnswers({ contactPerson: e.target.value })}
              placeholder="Max Muster"
              className="h-10"
              autoComplete="name"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs font-medium flex items-center gap-1 mb-1">
                <Mail className="w-3 h-3" /> E-Mail *
              </Label>
              <Input
                type="email"
                value={answers.contactEmail || ''}
                onChange={(e) => updateAnswers({ contactEmail: e.target.value })}
                placeholder="max@firma.ch"
                className="h-10"
                autoComplete="email"
              />
            </div>
            <div>
              <Label className="text-xs font-medium flex items-center gap-1 mb-1">
                <Phone className="w-3 h-3" /> Telefon *
              </Label>
              <Input
                type="tel"
                value={answers.contactPhone || ''}
                onChange={(e) => updateAnswers({ contactPhone: e.target.value })}
                placeholder="+41 79 123 45 67"
                className="h-10"
                autoComplete="tel"
              />
            </div>
          </div>
        </div>
      </AccordionItem>

      {/* SECTION 3: Role */}
      <AccordionItem
        id="role"
        title="Ihre Rolle"
        icon={Briefcase}
        isOpen={activeSection === 'role'}
        isCompleted={sectionValidation.role && activeSection !== 'role'}
        isDisabled={!sectionValidation.contact}
        stepNumber={3}
        onHeaderClick={() => sectionValidation.contact && setActiveSection('role')}
      >
        <div className="space-y-2">
          {ROLE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => updateAnswers({ 
                userRole: opt.value, 
                userRoleOther: opt.value === 'other' ? answers.userRoleOther : undefined 
              })}
              className={`w-full text-left px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                answers.userRole === opt.value
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border hover:border-primary/50 text-foreground'
              }`}
            >
              {opt.label}
            </button>
          ))}
          
          {answers.userRole === 'other' && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="pt-2"
            >
              <Input
                value={answers.userRoleOther || ''}
                onChange={(e) => updateAnswers({ userRoleOther: e.target.value })}
                placeholder="Ihre Rolle beschreiben..."
                className="h-10"
              />
            </motion.div>
          )}
          
          {roleHint && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-2 bg-primary/5 rounded-lg border border-primary/20 mt-2"
            >
              <p className="text-xs text-primary flex items-start gap-2">
                <Info className="w-3 h-3 shrink-0 mt-0.5" />
                {roleHint}
              </p>
            </motion.div>
          )}
        </div>
      </AccordionItem>

      {/* SECTION 4: Employees */}
      <AccordionItem
        id="employees"
        title="Anzahl Mitarbeitende"
        icon={Users}
        isOpen={activeSection === 'employees'}
        isCompleted={sectionValidation.employees && activeSection !== 'employees'}
        isDisabled={!sectionValidation.role}
        stepNumber={4}
        onHeaderClick={() => sectionValidation.role && setActiveSection('employees')}
      >
        <ChipSelect
          options={EMPLOYEE_OPTIONS}
          value={answers.employees}
          onChange={(v) => updateAnswers({ employees: v as EmployeeRange })}
          columns={4}
        />
      </AccordionItem>

      {/* SECTION 5: Terms */}
      <AccordionItem
        id="terms"
        title="Einwilligung"
        icon={Check}
        isOpen={activeSection === 'terms'}
        isCompleted={sectionValidation.terms && activeSection !== 'terms'}
        isDisabled={!sectionValidation.employees}
        stepNumber={5}
        onHeaderClick={() => sectionValidation.employees && setActiveSection('terms')}
      >
        <div className="flex items-start gap-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
          <Checkbox
            id="terms"
            checked={acceptedTerms}
            onCheckedChange={(c) => setAcceptedTerms(c === true)}
            className="mt-0.5"
          />
          <label htmlFor="terms" className="text-sm cursor-pointer">
            <span className="font-medium text-foreground">Ja, ich will mein Sparpotenzial erfahren!</span>
            {' '}
            <span className="text-muted-foreground">
              Ihre Angaben werden nur für die Analyse verwendet. <a href="/go/legal/datenschutz" target="_blank" className="underline hover:text-primary">Datenschutz</a>
            </span>
          </label>
        </div>
      </AccordionItem>

      {/* Continue Button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isValid ? 1 : 0.5 }}
        className="pt-2"
      >
        <Button
          size="lg"
          className="w-full h-12 text-base font-bold rounded-xl"
          disabled={!isValid}
          onClick={onContinue}
        >
          Quiz starten
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </motion.div>
    </div>
  );
}
