import { QuizAnswers } from '@/lib/partner-quiz-calculations';
import { PROCESS_MATURITY_ITEMS } from '@/lib/partner-quiz-config';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Store, Calendar, Shuffle, Building2, Users, Percent, Gift, MapPin } from 'lucide-react';

interface Props {
  answers: QuizAnswers;
  updateAnswers: (updates: Partial<QuizAnswers>) => void;
}

interface ChipOption<T> {
  value: T;
  label: string;
  icon?: React.ReactNode;
}

function ChipSelect<T extends string>({ 
  options, 
  value, 
  onChange,
  columns = 2
}: { 
  options: ChipOption<T>[]; 
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
          className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
            value === opt.value
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border hover:border-primary/50 text-foreground'
          }`}
        >
          {opt.icon}
          <span className="truncate">{opt.label}</span>
        </button>
      ))}
    </div>
  );
}

export function QuizStep1Fit({ answers, updateAnswers }: Props) {
  return (
    <div className="space-y-6">
      {/* Business Type */}
      <div>
        <Label className="text-sm font-semibold mb-3 block">
          Wie ist Ihr Geschäftsmodell?
        </Label>
        <ChipSelect
          options={[
            { value: 'walk-in', label: 'Walk-in (Laufkundschaft)', icon: <Store className="w-4 h-4" /> },
            { value: 'termin', label: 'Terminbasiert', icon: <Calendar className="w-4 h-4" /> },
            { value: 'mischform', label: 'Mischform', icon: <Shuffle className="w-4 h-4" /> },
            { value: 'b2b', label: 'B2B / Projekte', icon: <Building2 className="w-4 h-4" /> }
          ]}
          value={answers.businessType}
          onChange={(v) => updateAnswers({ businessType: v })}
        />
      </div>

      {/* Transactions */}
      <div>
        <Label className="text-sm font-semibold mb-3 block">
          Transaktionen/Termine pro Monat
        </Label>
        <ChipSelect
          options={[
            { value: '<30', label: 'Unter 30' },
            { value: '30-79', label: '30 – 79' },
            { value: '80-199', label: '80 – 199' },
            { value: '200+', label: '200+' }
          ]}
          value={answers.transactionsPerMonth}
          onChange={(v) => updateAnswers({ transactionsPerMonth: v })}
          columns={4}
        />
      </div>

      {/* Avg Ticket */}
      <div>
        <Label className="text-sm font-semibold mb-3 block">
          Durchschnittlicher Bon / Auftragswert (CHF)
        </Label>
        <ChipSelect
          options={[
            { value: '<30', label: '< 30' },
            { value: '30-79', label: '30 – 79' },
            { value: '80-199', label: '80 – 199' },
            { value: '200+', label: '200+' }
          ]}
          value={answers.avgTicket}
          onChange={(v) => updateAnswers({ avgTicket: v })}
          columns={4}
        />
      </div>

      {/* Loyalty Share */}
      <div>
        <Label className="text-sm font-semibold mb-3 block flex items-center gap-2">
          <Users className="w-4 h-4 text-muted-foreground" />
          Stammkundenanteil
        </Label>
        <ChipSelect
          options={[
            { value: '<20%', label: '< 20%' },
            { value: '20-39%', label: '20 – 39%' },
            { value: '40-59%', label: '40 – 59%' },
            { value: '60%+', label: '60%+' }
          ]}
          value={answers.loyaltyShare}
          onChange={(v) => updateAnswers({ loyaltyShare: v })}
          columns={4}
        />
      </div>

      {/* Incentive Possible */}
      <div>
        <Label className="text-sm font-semibold mb-3 block flex items-center gap-2">
          <Gift className="w-4 h-4 text-muted-foreground" />
          Können Sie Kunden etwas anbieten (Rabatt, Goodie, Bonus)?
        </Label>
        <ChipSelect
          options={[
            { value: 'easy', label: 'Ja, einfach machbar' },
            { value: 'selten', label: 'Ja, aber selten' },
            { value: 'schwierig', label: 'Eher schwierig' }
          ]}
          value={answers.incentivePossible}
          onChange={(v) => updateAnswers({ incentivePossible: v })}
          columns={3}
        />
      </div>

      {/* Locations */}
      <div>
        <Label className="text-sm font-semibold mb-3 block flex items-center gap-2">
          <MapPin className="w-4 h-4 text-muted-foreground" />
          Anzahl Standorte
        </Label>
        <ChipSelect
          options={[
            { value: '1', label: '1 Standort' },
            { value: '2-3', label: '2 – 3 Standorte' },
            { value: '4+', label: '4+ Standorte' }
          ]}
          value={answers.locations}
          onChange={(v) => updateAnswers({ locations: v })}
          columns={3}
        />
      </div>

      {/* Process Maturity */}
      <div>
        <Label className="text-sm font-semibold mb-3 block">
          Prozess-Reife (mehrere möglich)
        </Label>
        <div className="space-y-3 bg-muted/50 rounded-xl p-4">
          {PROCESS_MATURITY_ITEMS.map(item => (
            <div key={item.key} className="flex items-center gap-3">
              <Checkbox
                id={item.key}
                checked={answers.processMaturity[item.key] ?? false}
                onCheckedChange={(checked) => {
                  updateAnswers({
                    processMaturity: {
                      ...answers.processMaturity,
                      [item.key]: checked === true
                    }
                  });
                }}
              />
              <label 
                htmlFor={item.key}
                className="text-sm cursor-pointer select-none"
              >
                {item.label}
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
