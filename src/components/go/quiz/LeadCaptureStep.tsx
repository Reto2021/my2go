import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
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
  X
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
            companyName: company.name // For Google Places fallback
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
          // Store persons for contact selection
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
    // Set the search query as company name for manual entry
    if (searchQuery.trim()) {
      updateAnswers({ companyName: searchQuery.trim() });
    }
  };

  const isValid = 
    answers.contactPerson?.trim() &&
    answers.contactEmail?.trim() &&
    answers.contactPhone?.trim() &&
    answers.userRole &&
    acceptedTerms;

  const roleHint = answers.userRole ? ROLE_HINTS[answers.userRole] : null;

  return (
    <div className="space-y-6">
      <motion.div 
        className="text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-semibold mb-4">
          <Sparkles className="w-4 h-4" />
          Kostenloser Check
        </div>
        <h3 className="text-xl font-bold mb-2">
          Wer sind Sie?
        </h3>
        <p className="text-muted-foreground">
          Damit wir Ihnen ein massgeschneidertes Ergebnis liefern können.
        </p>
      </motion.div>

      {/* Company Search / Selection - AT THE TOP */}
      <div>
        <Label className="text-sm font-semibold flex items-center gap-2 mb-2">
          <Building2 className="w-4 h-4 text-muted-foreground" />
          Ihre Firma
        </Label>

        {/* Selected Company Display - with editable address fields */}
        {answers.companyName && !manualMode ? (
          <div className="space-y-3">
            <div className="p-4 bg-primary/5 rounded-xl border border-primary/20">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 flex-1">
                  <Check className="w-4 h-4 text-primary shrink-0" />
                  <span className="font-semibold">{answers.companyName}</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={clearCompany}
                  className="shrink-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            {/* Loading indicator for address fetch */}
            {isFetchingDetails ? (
              <p className="text-xs text-primary flex items-center gap-2">
                <Loader2 className="w-3 h-3 animate-spin" />
                Lade Adressdaten aus dem Handelsregister...
              </p>
            ) : (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Info className="w-3 h-3" />
                {answers.companyAddress ? 'Adresse aus HR übernommen (editierbar)' : 'Adresse bitte ergänzen'}
              </p>
            )}
            
            {/* Editable address fields after Zefix selection */}
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <Label className="text-xs text-muted-foreground mb-1 block">Strasse & Nr.</Label>
                <Input
                  value={answers.companyAddress || ''}
                  onChange={(e) => updateAnswers({ companyAddress: e.target.value })}
                  placeholder="z.B. Bahnhofstrasse 1"
                  className="h-10"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">PLZ</Label>
                <Input
                  value={answers.companyPostalCode || ''}
                  onChange={(e) => updateAnswers({ companyPostalCode: e.target.value })}
                  placeholder="z.B. 5200"
                  className="h-10"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Ort</Label>
              <Input
                value={answers.companyCity || ''}
                onChange={(e) => updateAnswers({ companyCity: e.target.value })}
                placeholder="Zürich"
                className="h-10"
              />
            </div>
          </div>
        ) : manualMode ? (
          /* Manual Mode */
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
              className="h-12"
            />
            <div className="grid grid-cols-3 gap-2">
              <Input
                value={answers.companyAddress || ''}
                onChange={(e) => updateAnswers({ companyAddress: e.target.value })}
                placeholder="Strasse & Nr."
                className="h-12 col-span-2"
              />
              <Input
                value={answers.companyPostalCode || ''}
                onChange={(e) => updateAnswers({ companyPostalCode: e.target.value })}
                placeholder="PLZ"
                className="h-12"
              />
            </div>
            <Input
              value={answers.companyCity || ''}
              onChange={(e) => updateAnswers({ companyCity: e.target.value })}
              placeholder="Ort"
              className="h-12"
            />
          </div>
        ) : (
          /* Zefix Autocomplete Search */
          <div className="relative">
            <div className="relative">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Firmenname oder UID suchen..."
                className="h-12 pr-10"
                autoComplete="off"
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
            
            {/* Skeleton Loader during search */}
            {isSearching && searchQuery.length >= 2 && (
              <Card className="absolute z-10 w-full mt-1 p-2 shadow-lg animate-fade-in">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-3 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-3 w-3 rounded-full" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                ))}
              </Card>
            )}

            {/* Autocomplete Dropdown */}
            {!isSearching && showResults && searchResults.length > 0 && (
              <Card className="absolute z-10 w-full mt-1 p-1 max-h-60 overflow-y-auto shadow-lg animate-fade-in">
                {searchResults.map((company) => (
                  <button
                    key={company.uid}
                    onClick={() => selectCompany(company)}
                    className="w-full text-left p-3 rounded-lg hover:bg-muted transition-colors"
                  >
                    <p className="font-medium">{company.name}</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {company.legalSeat} • {company.legalForm}
                    </p>
                    {company.address && (
                      <p className="text-xs text-muted-foreground">
                        {company.address.street} {company.address.houseNumber}, {company.address.swissZipCode} {company.address.city}
                      </p>
                    )}
                  </button>
                ))}
              </Card>
            )}

            {/* Manual Entry Link */}
            <div className="flex items-center justify-between mt-2">
              {error && (
                <p className="text-sm text-amber-600">{error}</p>
              )}
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
      </div>

      {/* Role Selection */}
      <div className="pt-4 border-t border-border">
        <Label className="text-sm font-semibold mb-3 block flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-muted-foreground" />
          Ihre Rolle im Unternehmen *
        </Label>
        <div className="space-y-2">
          {ROLE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => updateAnswers({ userRole: opt.value, userRoleOther: opt.value === 'other' ? answers.userRoleOther : undefined })}
              className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                answers.userRole === opt.value
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border hover:border-primary/50 text-foreground'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        
        {/* Free text field for "Sonstiges" */}
        {answers.userRole === 'other' && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-3"
          >
            <Input
              value={answers.userRoleOther || ''}
              onChange={(e) => updateAnswers({ userRoleOther: e.target.value })}
              placeholder="Ihre Rolle beschreiben..."
              className="h-12"
            />
          </motion.div>
        )}
        
        {/* Role Hint */}
        {roleHint && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-3 p-3 bg-primary/5 rounded-lg border border-primary/20"
          >
            <p className="text-sm text-primary flex items-start gap-2">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              {roleHint}
            </p>
          </motion.div>
        )}
      </div>

      {/* Employee Count */}
      <div>
        <Label className="text-sm font-semibold mb-3 block flex items-center gap-2">
          <Users className="w-4 h-4 text-muted-foreground" />
          Anzahl Mitarbeitende
        </Label>
        <ChipSelect
          options={EMPLOYEE_OPTIONS}
          value={answers.employees}
          onChange={(v) => updateAnswers({ employees: v as EmployeeRange })}
          columns={4}
        />
      </div>

      {/* Contact Details - SINGLE SECTION */}
      <div className="pt-4 border-t border-border space-y-4">
        {/* Person Selection from HR */}
        {foundPersons.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              Ansprechpartner aus HR auswählen
            </Label>
            <div className="grid gap-2">
              {foundPersons.map((person, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => updateAnswers({ contactPerson: person.name })}
                  className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                    answers.contactPerson === person.name
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{person.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {person.role}
                        {person.signature && ` • ${person.signature}`}
                      </p>
                    </div>
                    {answers.contactPerson === person.name && (
                      <Check className="w-5 h-5 text-primary" />
                    )}
                  </div>
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Oder Namen manuell eingeben:
            </p>
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium flex items-center gap-2 mb-2">
              <User className="w-4 h-4 text-muted-foreground" />
              Ihr Name *
            </Label>
            <Input
              value={answers.contactPerson}
              onChange={(e) => updateAnswers({ contactPerson: e.target.value })}
              placeholder="Max Muster"
              className="h-12"
              autoComplete="name"
            />
          </div>
          <div>
            <Label className="text-sm font-medium flex items-center gap-2 mb-2">
              <Phone className="w-4 h-4 text-muted-foreground" />
              Telefon *
            </Label>
            <Input
              type="tel"
              value={answers.contactPhone}
              onChange={(e) => updateAnswers({ contactPhone: e.target.value })}
              placeholder="+41 79 123 45 67"
              className="h-12"
              autoComplete="tel"
            />
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium flex items-center gap-2 mb-2">
            <Mail className="w-4 h-4 text-muted-foreground" />
            E-Mail *
          </Label>
          <Input
            type="email"
            value={answers.contactEmail}
            onChange={(e) => updateAnswers({ contactEmail: e.target.value })}
            placeholder="max@muster.ch"
            className="h-12"
            autoComplete="email"
          />
        </div>
      </div>

      {/* Terms */}
      <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-xl border border-primary/20">
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

      {/* Continue Button */}
      <Button
        size="lg"
        className="w-full h-14 text-base font-bold rounded-xl"
        disabled={!isValid}
        onClick={onContinue}
      >
        Quiz starten
        <ArrowRight className="w-5 h-5 ml-2" />
      </Button>
    </div>
  );
}
