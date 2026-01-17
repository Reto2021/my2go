import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Building2, 
  User, 
  Mail, 
  Phone, 
  Search, 
  Loader2,
  MapPin,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { QuizAnswers } from '@/lib/partner-quiz-calculations';

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
  address?: {
    street?: string;
    houseNumber?: string;
    swissZipCode?: string;
    city?: string;
  };
}

export function LeadCaptureStep({ answers, updateAnswers, onContinue }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<ZefixCompany[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchZefix = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setError(null);
    
    try {
      const isUID = /^CHE-?\d{3}\.\d{3}\.\d{3}$/i.test(searchQuery.trim());
      
      const { data, error: fnError } = await supabase.functions.invoke('zefix-lookup', {
        body: isUID 
          ? { uid: searchQuery.trim() }
          : { query: searchQuery.trim() }
      });

      if (fnError) throw fnError;
      
      if (data?.companies && data.companies.length > 0) {
        setSearchResults(data.companies);
        setShowResults(true);
      } else {
        setSearchResults([]);
        setShowResults(true);
        setError('Keine Firma gefunden. Bitte manuell eingeben.');
      }
    } catch (err) {
      console.error('Zefix search error:', err);
      setError('Suche fehlgeschlagen. Bitte manuell eingeben.');
      setShowResults(false);
    } finally {
      setIsSearching(false);
    }
  };

  const selectCompany = (company: ZefixCompany) => {
    const address = company.address 
      ? `${company.address.street || ''} ${company.address.houseNumber || ''}`.trim()
      : '';
    
    updateAnswers({
      companyName: company.name,
      companyAddress: address,
      companyPostalCode: company.address?.swissZipCode || '',
      companyCity: company.address?.city || company.legalSeat || ''
    });
    
    setShowResults(false);
    setSearchQuery(company.name);
  };

  const isValid = 
    answers.contactPerson?.trim() &&
    answers.contactEmail?.trim() &&
    answers.contactPhone?.trim() &&
    acceptedTerms;

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

      {/* Contact Person */}
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
        />
      </div>

      {/* Company Search */}
      <div className="pt-4 border-t border-border">
        <Label className="text-sm font-medium flex items-center gap-2 mb-2">
          <Building2 className="w-4 h-4 text-muted-foreground" />
          Firma (optional, via Zefix)
        </Label>
        <div className="flex gap-2">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Firmenname oder UID (CHE-123.456.789)"
            className="h-12 flex-1"
            onKeyDown={(e) => e.key === 'Enter' && searchZefix()}
          />
          <Button 
            variant="outline" 
            size="lg"
            onClick={searchZefix}
            disabled={isSearching || !searchQuery.trim()}
            className="h-12 px-4"
          >
            {isSearching ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Search className="w-5 h-5" />
            )}
          </Button>
        </div>
        
        {error && (
          <p className="text-sm text-amber-600 mt-2">{error}</p>
        )}

        {/* Search Results */}
        {showResults && searchResults.length > 0 && (
          <Card className="mt-3 p-2 max-h-60 overflow-y-auto">
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

        {/* Manual Input */}
        {answers.companyName && (
          <div className="mt-4 p-4 bg-muted/50 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium">{answers.companyName}</span>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  updateAnswers({ 
                    companyName: '', 
                    companyAddress: '', 
                    companyPostalCode: '', 
                    companyCity: '' 
                  });
                  setSearchQuery('');
                }}
              >
                Ändern
              </Button>
            </div>
            {answers.companyAddress && (
              <p className="text-sm text-muted-foreground">
                {answers.companyAddress}, {answers.companyPostalCode} {answers.companyCity}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Terms */}
      <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-xl">
        <Checkbox
          id="terms"
          checked={acceptedTerms}
          onCheckedChange={(c) => setAcceptedTerms(c === true)}
          className="mt-0.5"
        />
        <label htmlFor="terms" className="text-sm text-muted-foreground cursor-pointer">
          Ich bin einverstanden, dass meine Daten zur Erstellung einer personalisierten Empfehlung 
          verwendet werden. <a href="/go/legal/datenschutz" target="_blank" className="underline">Datenschutz</a>
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
