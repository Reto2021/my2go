import { useState, useEffect, useCallback, useMemo } from 'react';
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

export function LeadCaptureStep({ answers, updateAnswers, onContinue }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ZefixCompany[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualMode, setManualMode] = useState(false);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);
  const [foundPersons, setFoundPersons] = useState<{ name: string; role: string }[]>([]);

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
      } else {
        setSearchResults([]);
        setShowResults(false);
        if (query.length >= 3) {
          setError('Keine Firma gefunden');
        }
      }
    } catch (err) {
      console.error('Zefix search error:', err);
      setError('Suche fehlgeschlagen');
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Debounce effect for search
  useEffect(() => {
    if (answers.companyName && !manualMode) return;
    
    const timer = setTimeout(() => {
      if (searchQuery.length >= 2) {
        searchZefix(searchQuery);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, searchZefix, answers.companyName, manualMode]);

  const selectCompany = async (company: ZefixCompany) => {
    setShowResults(false);
    setSearchQuery('');
    
    updateAnswers({
      companyName: company.name,
      companyCity: company.legalSeat
    });

    if (company.persons && company.persons.length > 0) {
      setFoundPersons(company.persons.map(p => ({ name: p.name, role: p.role })));
    }

    if (company.registryOfCommerceId) {
      setIsFetchingDetails(true);
      try {
        const { data } = await supabase.functions.invoke('zefix-lookup', {
          body: { 
            fetchDetails: true,
            uid: company.uid,
            registryOfCommerceId: company.registryOfCommerceId,
            legalSeat: company.legalSeat,
            companyName: company.name
          }
        });

        if (data?.address) {
          const addr = data.address;
          const streetWithNumber = addr.street && addr.houseNumber 
            ? `${addr.street} ${addr.houseNumber}`
            : addr.street || '';
          
          updateAnswers({
            companyAddress: streetWithNumber,
            companyPostalCode: addr.swissZipCode || '',
            companyCity: addr.city || company.legalSeat
          });
        }

        if (data?.persons && data.persons.length > 0) {
          setFoundPersons(data.persons.map((p: any) => ({ name: p.name, role: p.role })));
        }
      } catch (err) {
        console.error('Failed to fetch company details:', err);
      } finally {
        setIsFetchingDetails(false);
      }
    }
  };

  const clearCompany = () => {
    updateAnswers({
      companyName: undefined,
      companyAddress: undefined,
      companyPostalCode: undefined,
      companyCity: undefined
    });
    setFoundPersons([]);
    setSearchQuery('');
    setManualMode(false);
  };

  const enableManualMode = () => {
    setManualMode(true);
    setSearchResults([]);
    setShowResults(false);
  };

  const isValid = 
    answers.companyName?.trim() && 
    answers.companyCity?.trim() &&
    answers.contactPerson?.trim() &&
    answers.contactEmail?.trim() &&
    answers.contactPhone?.trim() &&
    answers.userRole &&
    answers.employees &&
    acceptedTerms;

  const roleHint = answers.userRole ? ROLE_HINTS[answers.userRole] : null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">Ihre Angaben</h3>
        <span className="text-xs text-primary font-medium flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          Kostenloser Check
        </span>
      </div>

      {/* SECTION 1: Company */}
      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
          Ihre Firma
        </Label>
        
        {answers.companyName && !manualMode ? (
          <div className="space-y-2">
            <div className="p-2.5 bg-primary/5 rounded-lg border border-primary/20 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Check className="w-4 h-4 text-primary shrink-0" />
                <span className="font-medium text-sm truncate">{answers.companyName}</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={clearCompany}
                className="shrink-0 h-7 w-7 p-0"
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
            
            {isFetchingDetails && (
              <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span className="text-xs text-muted-foreground">Adresse wird geladen...</span>
              </div>
            )}
            
            {!isFetchingDetails && (
              <div className="grid grid-cols-3 gap-2">
                <Input
                  value={answers.companyAddress || ''}
                  onChange={(e) => updateAnswers({ companyAddress: e.target.value })}
                  placeholder="Strasse & Nr."
                  className="h-9 text-sm col-span-2"
                />
                <Input
                  value={answers.companyPostalCode || ''}
                  onChange={(e) => updateAnswers({ companyPostalCode: e.target.value })}
                  placeholder="PLZ"
                  className="h-9 text-sm"
                />
              </div>
            )}
            {!isFetchingDetails && (
              <Input
                value={answers.companyCity || ''}
                onChange={(e) => updateAnswers({ companyCity: e.target.value })}
                placeholder="Ort"
                className="h-9 text-sm"
              />
            )}
          </div>
        ) : manualMode ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Manuelle Eingabe</span>
              <button
                type="button"
                onClick={() => setManualMode(false)}
                className="text-xs text-primary hover:underline"
              >
                Zefix-Suche
              </button>
            </div>
            <Input
              value={answers.companyName || ''}
              onChange={(e) => updateAnswers({ companyName: e.target.value })}
              placeholder="Firmenname"
              className="h-9 text-sm"
            />
            <div className="grid grid-cols-3 gap-2">
              <Input
                value={answers.companyAddress || ''}
                onChange={(e) => updateAnswers({ companyAddress: e.target.value })}
                placeholder="Strasse & Nr."
                className="h-9 text-sm col-span-2"
              />
              <Input
                value={answers.companyPostalCode || ''}
                onChange={(e) => updateAnswers({ companyPostalCode: e.target.value })}
                placeholder="PLZ"
                className="h-9 text-sm"
              />
            </div>
            <Input
              value={answers.companyCity || ''}
              onChange={(e) => updateAnswers({ companyCity: e.target.value })}
              placeholder="Ort"
              className="h-9 text-sm"
            />
          </div>
        ) : (
          <div className="relative">
            <div className="relative">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Firmenname oder UID suchen..."
                className="h-9 text-sm pr-10"
                autoComplete="off"
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
            
            {isSearching && searchQuery.length >= 2 && (
              <Card className="absolute z-50 w-full mt-1 p-2 shadow-lg bg-card border">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-2 space-y-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </Card>
            )}

            {!isSearching && showResults && searchResults.length > 0 && (
              <Card className="absolute z-50 w-full mt-1 p-1 max-h-40 overflow-y-auto shadow-lg bg-card border">
                {searchResults.map((company) => (
                  <button
                    key={company.uid}
                    onClick={() => selectCompany(company)}
                    className="w-full text-left p-2 rounded-md hover:bg-muted transition-colors"
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

            <div className="flex items-center justify-between mt-1.5">
              {error && <p className="text-xs text-amber-600">{error}</p>}
              <button
                type="button"
                onClick={enableManualMode}
                className="text-xs text-primary hover:underline ml-auto"
              >
                Manuell eingeben
              </button>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: Contact */}
      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 text-muted-foreground" />
          Ihre Kontaktdaten
        </Label>

        {foundPersons.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {foundPersons.slice(0, 3).map((person, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => updateAnswers({ contactPerson: person.name })}
                className={`px-2 py-1 rounded text-xs border transition-all ${
                  answers.contactPerson === person.name
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                {person.name}
              </button>
            ))}
          </div>
        )}

        <Input
          value={answers.contactPerson || ''}
          onChange={(e) => updateAnswers({ contactPerson: e.target.value })}
          placeholder="Vor- und Nachname"
          className="h-9 text-sm"
        />
        <Input
          type="email"
          value={answers.contactEmail || ''}
          onChange={(e) => updateAnswers({ contactEmail: e.target.value })}
          placeholder="E-Mail-Adresse"
          className="h-9 text-sm"
        />
        <Input
          type="tel"
          value={answers.contactPhone || ''}
          onChange={(e) => updateAnswers({ contactPhone: e.target.value })}
          placeholder="Telefonnummer"
          className="h-9 text-sm"
        />
      </div>

      {/* SECTION 3: Role */}
      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-1.5">
          <Briefcase className="w-3.5 h-3.5 text-muted-foreground" />
          Ihre Rolle
        </Label>
        <div className="grid grid-cols-2 gap-1.5">
          {ROLE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => updateAnswers({ 
                userRole: opt.value, 
                userRoleOther: opt.value === 'other' ? answers.userRoleOther : undefined 
              })}
              className={`px-2 py-1.5 rounded-md border text-xs font-medium transition-all ${
                answers.userRole === opt.value
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border hover:border-primary/50 text-foreground'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {answers.userRole === 'other' && (
          <Input
            value={answers.userRoleOther || ''}
            onChange={(e) => updateAnswers({ userRoleOther: e.target.value })}
            placeholder="Ihre Rolle..."
            className="h-9 text-sm"
            autoFocus
          />
        )}
        {roleHint && (
          <p className="text-xs text-muted-foreground flex items-start gap-1">
            <Info className="w-3 h-3 mt-0.5 shrink-0" />
            {roleHint}
          </p>
        )}
      </div>

      {/* SECTION 4: Employees */}
      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-muted-foreground" />
          Anzahl Mitarbeitende
        </Label>
        <div className="grid grid-cols-4 gap-1.5">
          {EMPLOYEE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => updateAnswers({ employees: opt.value as EmployeeRange })}
              className={`px-2 py-1.5 rounded-md border text-xs font-medium transition-all ${
                answers.employees === opt.value
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border hover:border-primary/50 text-foreground'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* SECTION 5: Terms */}
      <div className="flex items-start gap-2 pt-1">
        <Checkbox
          id="terms"
          checked={acceptedTerms}
          onCheckedChange={(c) => setAcceptedTerms(c === true)}
          className="mt-0.5"
        />
        <label htmlFor="terms" className="text-xs cursor-pointer leading-relaxed">
          <span className="font-medium">Ja, ich will mein Sparpotenzial erfahren!</span>
          {' '}
          <a href="/go/legal/datenschutz" target="_blank" className="text-primary underline">Datenschutz</a>
        </label>
      </div>

      {/* Continue Button */}
      <Button
        className="w-full h-10 text-sm font-semibold rounded-lg"
        disabled={!isValid}
        onClick={onContinue}
      >
        Quiz starten
        <ArrowRight className="w-4 h-4 ml-1.5" />
      </Button>
    </div>
  );
}
