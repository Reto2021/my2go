import { Card } from '@/components/ui/card';
import { QuizAnswers } from '@/lib/partner-quiz-calculations';
import { MISSING_INFO_ITEMS, FIXCOST_ITEMS } from '@/lib/partner-quiz-config';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

interface Props {
  answers: QuizAnswers;
  userRole: string | null;
}

export interface MissingItem {
  key: string;
  label: string;
  forRole: string;
}

export function getMissingInfo(answers: QuizAnswers): MissingItem[] {
  const missing: MissingItem[] = [];

  // Check fixcosts
  FIXCOST_ITEMS.forEach(item => {
    const fixcost = answers.fixcosts[item.key];
    if (fixcost?.unknown || (!fixcost?.selected && !fixcost?.range)) {
      const info = MISSING_INFO_ITEMS[item.key as keyof typeof MISSING_INFO_ITEMS];
      if (info) {
        missing.push({ key: item.key, label: info.label, forRole: info.forRole });
      }
    }
  });

  // Check energy
  if (answers.energyViaNebenkosten === null || answers.hasOwnEnergyContract === null) {
    missing.push({ 
      key: 'energy', 
      label: MISSING_INFO_ITEMS.energy.label, 
      forRole: MISSING_INFO_ITEMS.energy.forRole 
    });
  }

  // Check uplift fields
  if (answers.unknownLeads || !answers.leadsPerMonth) {
    missing.push({ 
      key: 'leads', 
      label: MISSING_INFO_ITEMS.leads.label, 
      forRole: MISSING_INFO_ITEMS.leads.forRole 
    });
  }

  if (answers.unknownConversion || !answers.conversionRate) {
    missing.push({ 
      key: 'conversion', 
      label: MISSING_INFO_ITEMS.conversion.label, 
      forRole: MISSING_INFO_ITEMS.conversion.forRole 
    });
  }

  // Check basic business info
  if (!answers.transactionsPerMonth) {
    missing.push({ 
      key: 'transactions', 
      label: MISSING_INFO_ITEMS.transactions.label, 
      forRole: MISSING_INFO_ITEMS.transactions.forRole 
    });
  }

  if (!answers.avgTicket) {
    missing.push({ 
      key: 'avgTicket', 
      label: MISSING_INFO_ITEMS.avgTicket.label, 
      forRole: MISSING_INFO_ITEMS.avgTicket.forRole 
    });
  }

  return missing;
}

export function MissingInfoChecklist({ answers, userRole }: Props) {
  const missingItems = getMissingInfo(answers);
  
  if (missingItems.length === 0) {
    return (
      <Card className="p-4 bg-green-50 border-green-200">
        <div className="flex items-center gap-2 text-green-700">
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-medium">Alle Angaben vollständig</span>
        </div>
      </Card>
    );
  }

  // Sort by role relevance
  const financeItems = missingItems.filter(i => i.forRole === 'finance');
  const opsItems = missingItems.filter(i => i.forRole === 'operations');
  const marketingItems = missingItems.filter(i => i.forRole === 'marketing');

  const isOperationsRole = userRole === 'operations';
  const isFinanceRole = userRole === 'finance';

  return (
    <Card className="p-4 border-amber-200 bg-amber-50/50">
      <div className="flex items-start gap-2 mb-3">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-amber-900">
            Für eine saubere Freigabe fehlen nur noch:
          </p>
        </div>
      </div>

      <div className="space-y-3 ml-7">
        {financeItems.length > 0 && (
          <div>
            {isOperationsRole && (
              <p className="text-xs font-semibold text-amber-700 mb-1 flex items-center gap-1">
                <Info className="w-3 h-3" />
                Bitte Finanzen ergänzen:
              </p>
            )}
            <ul className="space-y-1">
              {financeItems.map(item => (
                <li key={item.key} className="text-sm text-amber-800 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  {item.label}
                </li>
              ))}
            </ul>
          </div>
        )}

        {opsItems.length > 0 && (
          <div>
            {isFinanceRole && (
              <p className="text-xs font-semibold text-amber-700 mb-1 flex items-center gap-1">
                <Info className="w-3 h-3" />
                Bitte Operations ergänzen:
              </p>
            )}
            <ul className="space-y-1">
              {opsItems.map(item => (
                <li key={item.key} className="text-sm text-amber-800 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  {item.label}
                </li>
              ))}
            </ul>
          </div>
        )}

        {marketingItems.length > 0 && (
          <ul className="space-y-1">
            {marketingItems.map(item => (
              <li key={item.key} className="text-sm text-amber-800 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                {item.label}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}
