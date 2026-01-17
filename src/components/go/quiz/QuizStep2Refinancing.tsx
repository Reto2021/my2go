import { useState } from 'react';
import { QuizAnswers } from '@/lib/partner-quiz-calculations';
import { 
  FIXCOST_ITEMS, 
  SPONSOR_CATEGORIES, 
  SPONSOR_SLOTS, 
  DB_OPTIONS,
  ENERGY_QUICKWINS
} from '@/lib/partner-quiz-config';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { 
  Wifi, 
  Laptop, 
  FileText, 
  Shield, 
  Car, 
  CreditCard, 
  Home, 
  Globe,
  Zap,
  ChevronDown,
  ChevronUp,
  Handshake,
  Users
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface Props {
  answers: QuizAnswers;
  updateAnswers: (updates: Partial<QuizAnswers>) => void;
  dbPercent: number;
  setDbPercent: (v: number) => void;
}

const FIXCOST_ICONS: Record<string, React.ReactNode> = {
  telco: <Wifi className="w-4 h-4" />,
  software: <Laptop className="w-4 h-4" />,
  treuhand: <FileText className="w-4 h-4" />,
  insurance: <Shield className="w-4 h-4" />,
  mobility: <Car className="w-4 h-4" />,
  bank: <CreditCard className="w-4 h-4" />,
  rent: <Home className="w-4 h-4" />,
  web: <Globe className="w-4 h-4" />
};

export function QuizStep2Refinancing({ answers, updateAnswers, dbPercent, setDbPercent }: Props) {
  const [showEnergy, setShowEnergy] = useState(false);
  const [showSponsoring, setShowSponsoring] = useState(false);

  const toggleFixcost = (key: string, selected: boolean) => {
    updateAnswers({
      fixcosts: {
        ...answers.fixcosts,
        [key]: {
          ...answers.fixcosts[key],
          selected,
          range: selected ? (answers.fixcosts[key]?.range || null) : null,
          midpoint: 0,
          unknown: false
        }
      }
    });
  };

  const setFixcostRange = (key: string, range: string, midpoint: number) => {
    updateAnswers({
      fixcosts: {
        ...answers.fixcosts,
        [key]: {
          selected: true,
          range,
          midpoint,
          unknown: false
        }
      }
    });
  };

  const setFixcostUnknown = (key: string) => {
    updateAnswers({
      fixcosts: {
        ...answers.fixcosts,
        [key]: {
          selected: true,
          range: null,
          midpoint: 0,
          unknown: true
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-4">
        <h3 className="font-semibold text-lg mb-1">Fixkosten Quickcheck</h3>
        <p className="text-sm text-muted-foreground">
          Wählen Sie die Bereiche, in denen Sie aktuell Kosten haben.
        </p>
      </div>

      {/* Fixcost Items */}
      <div className="space-y-3">
        {FIXCOST_ITEMS.map(item => {
          const isSelected = answers.fixcosts[item.key]?.selected ?? false;
          const selectedRange = answers.fixcosts[item.key]?.range;
          const itemWithUnit = item as typeof item & { unit?: string; multipleAllowed?: boolean };
          
          return (
            <div 
              key={item.key}
              className={`rounded-xl border-2 p-4 transition-all ${
                isSelected ? 'border-primary bg-primary/5' : 'border-border'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                    {FIXCOST_ICONS[item.key]}
                  </div>
                  <div>
                    <span className="font-medium">{item.label}</span>
                    {itemWithUnit.unit && (
                      <span className="text-xs text-muted-foreground ml-1">({itemWithUnit.unit})</span>
                    )}
                  </div>
                </div>
                <Switch
                  checked={isSelected}
                  onCheckedChange={(checked) => toggleFixcost(item.key, checked)}
                />
              </div>
              
              {isSelected && (
                <>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {item.ranges.map((range, idx) => (
                      <button
                        key={range}
                        type="button"
                        onClick={() => setFixcostRange(item.key, range, item.midpoints[idx])}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                          selectedRange === range && !answers.fixcosts[item.key]?.unknown
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted hover:bg-muted/80 text-foreground'
                        }`}
                      >
                        CHF {range}
                      </button>
                    ))}
                    {/* Weiss nicht Option */}
                    <button
                      type="button"
                      onClick={() => setFixcostUnknown(item.key)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        answers.fixcosts[item.key]?.unknown
                          ? 'bg-amber-200 text-amber-900'
                          : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                      }`}
                    >
                      Weiss nicht
                    </button>
                  </div>
                  {itemWithUnit.multipleAllowed && (
                    <p className="text-xs text-muted-foreground mt-2">
                      💡 Tipp: Summieren Sie alle Versicherungen (UVG, BVG, Haftpflicht, etc.)
                    </p>
                  )}
                </>
              )}

              {/* Web/Hosting extras */}
              {item.key === 'web' && isSelected && (
                <div className="mt-3 pt-3 border-t border-border space-y-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="unknownHoster"
                      checked={answers.unknownHoster}
                      onCheckedChange={(c) => updateAnswers({ unknownHoster: c === true })}
                    />
                    <label htmlFor="unknownHoster" className="text-sm">
                      Ich weiss nicht, wer hostet
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="emailViaHoster"
                      checked={answers.emailViaHoster}
                      onCheckedChange={(c) => updateAnswers({ emailViaHoster: c === true })}
                    />
                    <label htmlFor="emailViaHoster" className="text-sm">
                      E-Mail läuft über den Hoster
                    </label>
                  </div>
                </div>
              )}

              {/* Rent extras */}
              {item.key === 'rent' && isSelected && (
                <div className="mt-3 pt-3 border-t border-border">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="rentNegotiation"
                      checked={answers.rentNegotiationPossible}
                      onCheckedChange={(c) => updateAnswers({ rentNegotiationPossible: c === true })}
                    />
                    <label htmlFor="rentNegotiation" className="text-sm">
                      Flächen-/Mietverhandlung möglich
                    </label>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Energy Section */}
      {(answers.fixcosts.rent?.selected) && (
        <Collapsible open={showEnergy} onOpenChange={setShowEnergy}>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 rounded-xl bg-amber-50 border-2 border-amber-200 hover:bg-amber-100 transition-all">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-600" />
              <span className="font-medium text-amber-900">Strom & Energie</span>
            </div>
            {showEnergy ? <ChevronUp className="w-5 h-5 text-amber-600" /> : <ChevronDown className="w-5 h-5 text-amber-600" />}
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3 space-y-4 p-4 bg-amber-50/50 rounded-xl border border-amber-100">
            {/* Energy via Nebenkosten */}
            <div>
              <Label className="text-sm font-medium mb-2 block">
                Wird Strom über Nebenkosten abgerechnet?
              </Label>
              <div className="flex gap-2">
                {['Ja', 'Nein', 'Weiss nicht'].map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => updateAnswers({ 
                      energyViaNebenkosten: opt === 'Ja' ? true : opt === 'Nein' ? false : null 
                    })}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      (answers.energyViaNebenkosten === true && opt === 'Ja') ||
                      (answers.energyViaNebenkosten === false && opt === 'Nein') ||
                      (answers.energyViaNebenkosten === null && opt === 'Weiss nicht')
                        ? 'bg-amber-200 text-amber-900'
                        : 'bg-white border border-amber-200 text-amber-800 hover:bg-amber-100'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Own contract */}
            {answers.energyViaNebenkosten === false && (
              <>
                <div>
                  <Label className="text-sm font-medium mb-2 block">
                    Haben Sie einen eigenen Stromvertrag?
                  </Label>
                  <div className="flex gap-2">
                    {['Ja', 'Nein', 'Weiss nicht'].map(opt => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => updateAnswers({ 
                          hasOwnEnergyContract: opt === 'Ja' ? true : opt === 'Nein' ? false : null 
                        })}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          (answers.hasOwnEnergyContract === true && opt === 'Ja') ||
                          (answers.hasOwnEnergyContract === false && opt === 'Nein') ||
                          (answers.hasOwnEnergyContract === null && opt === 'Weiss nicht')
                            ? 'bg-amber-200 text-amber-900'
                            : 'bg-white border border-amber-200 text-amber-800 hover:bg-amber-100'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Yearly consumption */}
                {answers.hasOwnEnergyContract === true && (
                  <div>
                    <Label className="text-sm font-medium mb-2 block">
                      Jahresverbrauch pro Standort (kWh)
                    </Label>
                    <div className="flex flex-wrap gap-2">
                      {['<30000', '30000-99999', '>=100000', 'weiss nicht'].map(opt => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => updateAnswers({ yearlyConsumption: opt })}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                            answers.yearlyConsumption === opt
                              ? 'bg-amber-200 text-amber-900'
                              : 'bg-white border border-amber-200 text-amber-800 hover:bg-amber-100'
                          }`}
                        >
                          {opt === '>=100000' ? '≥ 100\'000' : opt === 'weiss nicht' ? 'Weiss nicht' : opt.replace('-', ' – ')}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Energy Quickwins */}
            <div className="p-3 bg-white rounded-lg border border-amber-200">
              <p className="text-sm font-medium text-amber-900 mb-2">💡 Energie-Quickwins</p>
              <ul className="text-xs text-amber-800 space-y-1">
                {ENERGY_QUICKWINS.slice(0, 4).map(tip => (
                  <li key={tip}>• {tip}</li>
                ))}
              </ul>
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Sponsoring Section */}
      <Collapsible open={showSponsoring} onOpenChange={setShowSponsoring}>
        <CollapsibleTrigger className="flex items-center justify-between w-full p-4 rounded-xl bg-green-50 border-2 border-green-200 hover:bg-green-100 transition-all">
          <div className="flex items-center gap-2">
            <Handshake className="w-5 h-5 text-green-600" />
            <span className="font-medium text-green-900">Sponsoring (Finanzierungshebel)</span>
          </div>
          {showSponsoring ? <ChevronUp className="w-5 h-5 text-green-600" /> : <ChevronDown className="w-5 h-5 text-green-600" />}
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-3 space-y-4 p-4 bg-green-50/50 rounded-xl border border-green-100">
          {/* Open to sponsoring */}
          <div>
            <Label className="text-sm font-medium mb-2 block">
              Wären Sie offen für Sponsoring-Finanzierung?
            </Label>
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'yes-contacts', label: 'Ja, wir haben mögliche Sponsoren' },
                { value: 'yes-nocontacts', label: 'Ja, aber noch keine Kontakte' },
                { value: 'no', label: 'Nein' }
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => updateAnswers({ openToSponsoring: opt.value as any })}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    answers.openToSponsoring === opt.value
                      ? 'bg-green-200 text-green-900'
                      : 'bg-white border border-green-200 text-green-800 hover:bg-green-100'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sponsor categories */}
          {answers.openToSponsoring && answers.openToSponsoring !== 'no' && (
            <>
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Sponsoring-Kategorien (max. 3)
                </Label>
                <div className="flex flex-wrap gap-2">
                  {SPONSOR_CATEGORIES.map(cat => {
                    const isSelected = answers.sponsorCategories.includes(cat);
                    const canSelect = isSelected || answers.sponsorCategories.length < 3;
                    return (
                      <button
                        key={cat}
                        type="button"
                        disabled={!canSelect && !isSelected}
                        onClick={() => {
                          if (isSelected) {
                            updateAnswers({ sponsorCategories: answers.sponsorCategories.filter(c => c !== cat) });
                          } else if (canSelect) {
                            updateAnswers({ sponsorCategories: [...answers.sponsorCategories, cat] });
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          isSelected
                            ? 'bg-green-200 text-green-900'
                            : canSelect
                              ? 'bg-white border border-green-200 text-green-800 hover:bg-green-100'
                              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sponsor slots */}
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Sponsorflächen im Geschäft (max. 5)
                </Label>
                <div className="flex flex-wrap gap-2">
                  {SPONSOR_SLOTS.map(slot => {
                    const isSelected = answers.sponsorSlots.includes(slot);
                    const canSelect = isSelected || answers.sponsorSlots.length < 5;
                    return (
                      <button
                        key={slot}
                        type="button"
                        disabled={!canSelect && !isSelected}
                        onClick={() => {
                          if (isSelected) {
                            updateAnswers({ sponsorSlots: answers.sponsorSlots.filter(s => s !== slot) });
                          } else if (canSelect) {
                            updateAnswers({ sponsorSlots: [...answers.sponsorSlots, slot] });
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          isSelected
                            ? 'bg-green-200 text-green-900'
                            : canSelect
                              ? 'bg-white border border-green-200 text-green-800 hover:bg-green-100'
                              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Contacts per month */}
              <div>
                <Label className="text-sm font-medium mb-2 block flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Kontakte pro Monat (grob)
                </Label>
                <div className="flex flex-wrap gap-2">
                  {['<500', '500-1999', '2000-9999', '10000+'].map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => updateAnswers({ contactsPerMonth: opt })}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        answers.contactsPerMonth === opt
                          ? 'bg-green-200 text-green-900'
                          : 'bg-white border border-green-200 text-green-800 hover:bg-green-100'
                      }`}
                    >
                      {opt.replace('-', ' – ').replace('+', '+')}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </CollapsibleContent>
      </Collapsible>

      {/* DB% for mini price lever */}
      <div className="p-4 bg-muted/50 rounded-xl">
        <Label className="text-sm font-medium mb-2 block">
          Ihre Deckungsbeitragsmarge (für Mini-Preishebel)
        </Label>
        <div className="flex flex-wrap gap-2">
          {DB_OPTIONS.map(opt => (
            <button
              key={opt.label}
              type="button"
              onClick={() => setDbPercent(opt.value)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                dbPercent === opt.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card border border-border hover:border-primary/50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Wird verwendet, um den nötigen Mehrumsatz für die Deckung der Restkosten zu berechnen.
        </p>
      </div>
    </div>
  );
}
