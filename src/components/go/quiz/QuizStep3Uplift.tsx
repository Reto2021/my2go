import { QuizAnswers } from '@/lib/partner-quiz-calculations';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { TrendingUp, Users, Handshake, Zap } from 'lucide-react';

interface Props {
  answers: QuizAnswers;
  updateAnswers: (updates: Partial<QuizAnswers>) => void;
}

export function QuizStep3Uplift({ answers, updateAnswers }: Props) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-4">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-100 text-green-700 text-sm font-medium mb-3">
          <TrendingUp className="w-4 h-4" />
          Optional – Bonus-Potenzial
        </div>
        <h3 className="font-semibold text-lg mb-1">Uplift berechnen</h3>
        <p className="text-sm text-muted-foreground">
          Schätzen Sie das zusätzliche Umsatzpotenzial (keine Garantie, nur Orientierung).
        </p>
      </div>

      {/* Leads per month */}
      <div>
        <Label className="text-sm font-semibold mb-3 block flex items-center gap-2">
          <Users className="w-4 h-4 text-muted-foreground" />
          Leads/Anfragen pro Monat
        </Label>
        <div className="flex flex-wrap gap-2">
          {['<10', '10-49', '50-199', '200+'].map(opt => (
            <button
              key={opt}
              type="button"
              onClick={() => updateAnswers({ leadsPerMonth: opt, unknownLeads: false })}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex-1 min-w-[80px] ${
                answers.leadsPerMonth === opt && !answers.unknownLeads
                  ? 'bg-primary text-primary-foreground border-2 border-primary'
                  : 'bg-card border-2 border-border hover:border-primary/50'
              }`}
            >
              {opt.replace('-', ' – ')}
            </button>
          ))}
          {/* Weiss nicht Option */}
          <button
            type="button"
            onClick={() => updateAnswers({ leadsPerMonth: null, unknownLeads: true })}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              answers.unknownLeads
                ? 'bg-amber-200 text-amber-900 border-2 border-amber-400'
                : 'bg-card border-2 border-border hover:border-amber-300 text-muted-foreground'
            }`}
          >
            Weiss nicht
          </button>
        </div>
      </div>

      {/* Consistent follow-up */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">Konsequentes Nachfassen?</p>
            <p className="text-sm text-muted-foreground">
              Werden Offerten/Anfragen systematisch nachverfolgt?
            </p>
          </div>
        </div>
        <Switch
          checked={answers.consistentFollowUp === true}
          onCheckedChange={(checked) => updateAnswers({ consistentFollowUp: checked })}
        />
      </div>

      {/* Conversion rate */}
      <div>
        <Label className="text-sm font-semibold mb-3 block">
          Lead → Sale Conversion (grob)
        </Label>
        <div className="flex flex-wrap gap-2">
          {['<10%', '10-24%', '25-49%', '50%+'].map(opt => (
            <button
              key={opt}
              type="button"
              onClick={() => updateAnswers({ conversionRate: opt, unknownConversion: false })}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex-1 min-w-[80px] ${
                answers.conversionRate === opt && !answers.unknownConversion
                  ? 'bg-primary text-primary-foreground border-2 border-primary'
                  : 'bg-card border-2 border-border hover:border-primary/50'
              }`}
            >
              {opt}
            </button>
          ))}
          {/* Weiss nicht Option */}
          <button
            type="button"
            onClick={() => updateAnswers({ conversionRate: null, unknownConversion: true })}
            className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              answers.unknownConversion
                ? 'bg-amber-200 text-amber-900 border-2 border-amber-400'
                : 'bg-card border-2 border-border hover:border-amber-300 text-muted-foreground'
            }`}
          >
            Weiss nicht
          </button>
        </div>
      </div>

      {/* Partner commitment */}
      <div>
        <Label className="text-sm font-semibold mb-3 block flex items-center gap-2">
          <Handshake className="w-4 h-4 text-muted-foreground" />
          Wie aktiv möchten Sie Deals bewerben?
        </Label>
        <div className="space-y-2">
          {[
            { value: 'action', label: 'Aktiv: Deals 1–2× pro Monat pushen', desc: 'Sie bewerben Angebote aktiv über Social Media, Newsletter etc.' },
            { value: 'listing', label: 'Passiv: Nur Präsenz im Netzwerk', desc: 'Ihre Deals sind sichtbar, aber Sie machen keine aktive Werbung' },
            { value: 'unclear', label: 'Weiss noch nicht', desc: 'Entscheide ich später' }
          ].map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => updateAnswers({ partnerCommitment: opt.value as any })}
              className={`w-full text-left p-4 rounded-xl transition-all ${
                answers.partnerCommitment === opt.value
                  ? 'bg-primary/10 border-2 border-primary'
                  : 'bg-card border-2 border-border hover:border-primary/50'
              }`}
            >
              <p className="font-medium">{opt.label}</p>
              <p className="text-sm text-muted-foreground">{opt.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Info box */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
        <p className="text-sm text-amber-800">
          <strong>Hinweis:</strong> Automatische Reminder (E-Mail, SMS, WhatsApp) sind erst ab dem Plan "Growth" enthalten. 
          Der Rechner berücksichtigt das automatisch bei der Empfehlung.
        </p>
      </div>
    </div>
  );
}
