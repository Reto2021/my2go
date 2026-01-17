import jsPDF from 'jspdf';
import { 
  QuizAnswers, 
  FitResult, 
  RefinancingResult, 
  UpliftResult 
} from '@/lib/partner-quiz-calculations';
import { 
  TEXTS, 
  MODULES, 
  formatCHF, 
  formatPercent,
  formatDate,
  ModuleKey
} from '@/lib/partner-quiz-config';

interface ExportData {
  answers: QuizAnswers;
  fitResult: FitResult;
  refinancing: RefinancingResult;
  uplift: UpliftResult;
  planName: string;
  planPrice: number;
}

// Corporate Colors (2Go Media Design System)
const COLORS = {
  primary: '#7AB8D6',      // Sky Blue
  secondary: '#023F5A',    // Deep Teal  
  accent: '#FCB900',       // Bright Yellow
  success: '#22c55e',      // Green
  warning: '#f59e0b',      // Amber
  text: '#1a1a1a',
  textMuted: '#666666',
  textLight: '#888888',
  background: '#f9f9f9',
  white: '#ffffff'
};

export async function generatePDFReport(data: ExportData): Promise<void> {
  const { answers, fitResult, refinancing, uplift, planName, planPrice } = data;
  const fitLabel = TEXTS.fitLabels[fitResult.score];
  const isCovered = refinancing.gap <= 0;
  const coveragePercent = Math.min(100, (refinancing.totalSavings / planPrice) * 100);
  
  // Create PDF document (A4)
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  let y = 0;

  // Helper functions
  const addText = (text: string, x: number, yPos: number, options: {
    fontSize?: number;
    fontStyle?: 'normal' | 'bold';
    color?: string;
    align?: 'left' | 'center' | 'right';
    maxWidth?: number;
  } = {}) => {
    const { fontSize = 12, fontStyle = 'normal', color = COLORS.text, align = 'left', maxWidth } = options;
    pdf.setFontSize(fontSize);
    pdf.setFont('helvetica', fontStyle);
    pdf.setTextColor(color);
    
    if (maxWidth) {
      const lines = pdf.splitTextToSize(text, maxWidth);
      pdf.text(lines, x, yPos, { align });
      return lines.length * (fontSize * 0.4);
    }
    pdf.text(text, x, yPos, { align });
    return fontSize * 0.4;
  };

  const drawRect = (x: number, yPos: number, width: number, height: number, color: string, radius = 0) => {
    pdf.setFillColor(color);
    if (radius > 0) {
      pdf.roundedRect(x, yPos, width, height, radius, radius, 'F');
    } else {
      pdf.rect(x, yPos, width, height, 'F');
    }
  };

  // === HEADER with Corporate Branding ===
  drawRect(0, 0, pageWidth, 45, COLORS.secondary);
  
  // Logo area (white box)
  drawRect(margin, 10, 35, 25, COLORS.white, 3);
  addText('2Go', margin + 17.5, 26, { fontSize: 14, fontStyle: 'bold', color: COLORS.secondary, align: 'center' });
  
  // Company name
  addText('My 2Go', margin + 42, 18, { fontSize: 20, fontStyle: 'bold', color: COLORS.white });
  addText('Das Loyalitäts-Netzwerk', margin + 42, 26, { fontSize: 10, color: COLORS.white });

  // Sender info (right side)
  addText('2Go Media GmbH', pageWidth - margin, 14, { fontSize: 10, fontStyle: 'bold', color: COLORS.white, align: 'right' });
  addText('c/o Impact Hub Zürich', pageWidth - margin, 20, { fontSize: 9, color: COLORS.white, align: 'right' });
  addText('Sihlquai 131, 8005 Zürich', pageWidth - margin, 26, { fontSize: 9, color: COLORS.white, align: 'right' });
  addText('www.2gomedia.ch', pageWidth - margin, 32, { fontSize: 9, color: COLORS.accent, align: 'right' });
  addText('partner@my2go.app', pageWidth - margin, 38, { fontSize: 9, color: COLORS.white, align: 'right' });

  y = 55;

  // === DOCUMENT TITLE ===
  addText('Ihr persönlicher Partner Fit-Check Report', pageWidth / 2, y, { 
    fontSize: 18, fontStyle: 'bold', color: COLORS.secondary, align: 'center' 
  });
  y += 8;
  addText(`Erstellt am ${formatDate(new Date())}`, pageWidth / 2, y, { 
    fontSize: 10, color: COLORS.textMuted, align: 'center' 
  });
  y += 12;

  // === COMPANY INFO (if available) ===
  if (answers.companyName) {
    drawRect(margin, y, contentWidth, 22, COLORS.background, 3);
    y += 6;
    addText(answers.companyName, margin + 5, y, { fontSize: 12, fontStyle: 'bold' });
    y += 5;
    if (answers.contactPerson) {
      addText(answers.contactPerson, margin + 5, y, { fontSize: 10, color: COLORS.textMuted });
      y += 4;
    }
    const address = [answers.companyAddress, `${answers.companyPostalCode} ${answers.companyCity}`].filter(Boolean).join(', ');
    if (address.trim()) {
      addText(address, margin + 5, y, { fontSize: 10, color: COLORS.textMuted });
    }
    y += 10;
  }

  // === PLAN RECOMMENDATION BOX ===
  y += 5;
  drawRect(margin, y, contentWidth, 40, COLORS.secondary, 5);
  
  // Fit badge
  const fitBadgeColor = fitResult.score === 'A' ? '#dcfce7' : fitResult.score === 'B' ? '#fef3c7' : '#fee2e2';
  const fitTextColor = fitResult.score === 'A' ? '#166534' : fitResult.score === 'B' ? '#92400e' : '#991b1b';
  drawRect(pageWidth / 2 - 25, y + 5, 50, 8, fitBadgeColor, 4);
  addText(fitLabel.title, pageWidth / 2, y + 11, { fontSize: 10, fontStyle: 'bold', color: fitTextColor, align: 'center' });
  
  addText(planName, pageWidth / 2, y + 22, { fontSize: 16, fontStyle: 'bold', color: COLORS.white, align: 'center' });
  addText(formatCHF(planPrice), pageWidth / 2, y + 32, { fontSize: 20, fontStyle: 'bold', color: COLORS.accent, align: 'center' });
  addText('pro Monat', pageWidth / 2, y + 38, { fontSize: 9, color: COLORS.white, align: 'center' });
  
  y += 50;

  // === COVERAGE COMPARISON ===
  drawRect(margin, y, contentWidth, 35, COLORS.background, 3);
  y += 6;
  addText('Kosten vs. Einsparungen auf einen Blick', margin + 5, y, { fontSize: 12, fontStyle: 'bold', color: COLORS.secondary });
  y += 8;

  // Einsparungen bar
  addText('Einsparungen', margin + 5, y, { fontSize: 9, color: COLORS.textMuted });
  const savingsBarWidth = Math.max(20, (coveragePercent / 100) * (contentWidth - 70));
  drawRect(margin + 35, y - 4, savingsBarWidth, 8, COLORS.success, 2);
  addText(formatCHF(refinancing.totalSavings), margin + 38 + savingsBarWidth, y, { fontSize: 9, fontStyle: 'bold', color: COLORS.success });
  y += 10;

  // Plankosten bar
  addText('Plankosten', margin + 5, y, { fontSize: 9, color: COLORS.textMuted });
  const costBarWidth = (contentWidth - 70);
  drawRect(margin + 35, y - 4, costBarWidth, 8, COLORS.warning, 2);
  addText(formatCHF(planPrice), margin + 38 + costBarWidth, y, { fontSize: 9, fontStyle: 'bold', color: COLORS.warning });
  y += 12;

  // Coverage status
  const statusColor = isCovered ? COLORS.success : COLORS.warning;
  const statusText = isCovered 
    ? '✓ Vollständig refinanziert!' 
    : `${formatPercent(coveragePercent / 100)} bereits gedeckt`;
  addText(statusText, pageWidth / 2, y, { fontSize: 11, fontStyle: 'bold', color: statusColor, align: 'center' });
  
  y += 15;

  // === DETAILED BREAKDOWN ===
  drawRect(margin, y, contentWidth, 8 + refinancing.fixcostBreakdown.length * 7 + 
    (refinancing.timeSavings > 0 ? 7 : 0) + 
    (refinancing.sponsoringSavings > 0 ? 7 : 0) + 12, COLORS.background, 3);
  y += 6;
  addText('Detaillierte Einsparungen pro Monat', margin + 5, y, { fontSize: 12, fontStyle: 'bold', color: COLORS.secondary });
  y += 8;

  refinancing.fixcostBreakdown.forEach(item => {
    addText(item.label, margin + 5, y, { fontSize: 10, color: COLORS.text });
    addText(`+${formatCHF(item.amount)}`, pageWidth - margin - 5, y, { fontSize: 10, fontStyle: 'bold', color: COLORS.success, align: 'right' });
    y += 6;
  });

  if (refinancing.timeSavings > 0) {
    addText(`Zeit-Einsparungen (${refinancing.timeHours}h × CHF 90)`, margin + 5, y, { fontSize: 10, color: COLORS.text });
    addText(`+${formatCHF(refinancing.timeSavings)}`, pageWidth - margin - 5, y, { fontSize: 10, fontStyle: 'bold', color: COLORS.success, align: 'right' });
    y += 6;
  }

  if (refinancing.sponsoringSavings > 0) {
    addText('Sponsoring-Potenzial', margin + 5, y, { fontSize: 10, color: COLORS.text });
    addText(`+${formatCHF(refinancing.sponsoringSavings)}`, pageWidth - margin - 5, y, { fontSize: 10, fontStyle: 'bold', color: COLORS.success, align: 'right' });
    y += 6;
  }

  // Total
  y += 2;
  pdf.setDrawColor(COLORS.success);
  pdf.setLineWidth(0.3);
  pdf.line(margin + 5, y, pageWidth - margin - 5, y);
  y += 6;
  addText('Total Einsparungen /Monat', margin + 5, y, { fontSize: 11, fontStyle: 'bold', color: COLORS.text });
  addText(formatCHF(refinancing.totalSavings), pageWidth - margin - 5, y, { fontSize: 12, fontStyle: 'bold', color: COLORS.success, align: 'right' });
  
  y += 15;

  // === UPLIFT POTENTIAL ===
  if (y + 45 > pageHeight - 40) {
    pdf.addPage();
    y = 20;
  }

  drawRect(margin, y, contentWidth, 42, COLORS.background, 3);
  y += 6;
  addText('Zusätzliches Umsatzpotenzial (Bonus)', margin + 5, y, { fontSize: 12, fontStyle: 'bold', color: COLORS.secondary });
  y += 10;

  // Uplift bars
  const scenarios = [
    { label: 'Konservativ', value: uplift.total.conservative, color: '#94a3b8' },
    { label: 'Realistisch', value: uplift.total.realistic, color: COLORS.success },
    { label: 'Ambitioniert', value: uplift.total.ambitious, color: '#3b82f6' }
  ];
  const maxUplift = Math.max(...scenarios.map(s => s.value), 1);

  scenarios.forEach((scenario, idx) => {
    addText(scenario.label, margin + 5, y, { fontSize: 9, color: idx === 1 ? COLORS.text : COLORS.textMuted, fontStyle: idx === 1 ? 'bold' : 'normal' });
    const barWidth = Math.max(10, (scenario.value / maxUplift) * 80);
    drawRect(margin + 35, y - 3, barWidth, 6, scenario.color, 2);
    addText(`+${formatCHF(scenario.value)}/Mt.`, pageWidth - margin - 5, y, { 
      fontSize: 9, fontStyle: 'bold', color: scenario.color, align: 'right' 
    });
    y += 8;
  });

  addText(`Basis: ${formatCHF(uplift.baselineRevenue)} geschätzter Monatsumsatz`, pageWidth / 2, y + 2, { 
    fontSize: 8, color: COLORS.textLight, align: 'center' 
  });
  
  y += 12;

  // === RECOMMENDED MODULES ===
  if (y + 10 + fitResult.modules.length * 12 > pageHeight - 40) {
    pdf.addPage();
    y = 20;
  }

  addText('Empfohlene Module für Sie', margin, y, { fontSize: 12, fontStyle: 'bold', color: COLORS.secondary });
  y += 8;

  fitResult.modules.forEach(moduleKey => {
    const module = MODULES[moduleKey as ModuleKey];
    if (!module) return;
    
    // Module box with accent border
    drawRect(margin, y - 2, 3, 10, COLORS.primary);
    drawRect(margin + 3, y - 2, contentWidth - 3, 10, COLORS.background);
    addText(module.title, margin + 8, y + 3, { fontSize: 10, fontStyle: 'bold', color: COLORS.text });
    addText(module.desc, margin + 8, y + 8, { fontSize: 8, color: COLORS.textMuted, maxWidth: contentWidth - 15 });
    y += 14;
  });

  // === DISCLAIMER ===
  y += 5;
  pdf.setDrawColor('#e5e5e5');
  pdf.setLineWidth(0.2);
  pdf.line(margin, y, pageWidth - margin, y);
  y += 5;
  addText(TEXTS.disclaimer, pageWidth / 2, y, { fontSize: 8, color: COLORS.textLight, align: 'center', maxWidth: contentWidth });

  // === FOOTER ===
  const footerY = pageHeight - 15;
  drawRect(0, footerY - 5, pageWidth, 20, COLORS.background);
  addText('My 2Go', pageWidth / 2, footerY, { fontSize: 12, fontStyle: 'bold', color: COLORS.primary, align: 'center' });
  addText('2Go Media GmbH • Sihlquai 131, 8005 Zürich • www.2gomedia.ch • partner@my2go.app', pageWidth / 2, footerY + 5, { 
    fontSize: 8, color: COLORS.textLight, align: 'center' 
  });

  // Save PDF
  const filename = `My2Go-FitCheck-${answers.companyName || 'Report'}-${formatDate(new Date()).replace(/\./g, '-')}.pdf`;
  pdf.save(filename);
}

// Simple text export for clipboard
export function generateTextReport(data: ExportData): string {
  const { answers, fitResult, refinancing, uplift, planName, planPrice } = data;
  const fitLabel = TEXTS.fitLabels[fitResult.score];
  const isCovered = refinancing.gap <= 0;

  return `
═══════════════════════════════════════
MY2GO PARTNER FIT-CHECK ERGEBNIS
═══════════════════════════════════════
Erstellt am: ${formatDate(new Date())}

${answers.companyName ? `
FIRMENDATEN
───────────────────────────────────────
${answers.companyName}
${answers.contactPerson}
${answers.companyAddress ? `${answers.companyAddress}, ` : ''}${answers.companyPostalCode} ${answers.companyCity}
${answers.contactEmail} • ${answers.contactPhone}
` : ''}

FIT-SCORE
───────────────────────────────────────
${fitLabel.title} (${fitResult.score})

EMPFOHLENER PLAN
───────────────────────────────────────
${planName}
${formatCHF(planPrice)} / Monat

0-RISIKO REFINANZIERUNG
───────────────────────────────────────
${refinancing.fixcostBreakdown.map(item => `• ${item.label}: +${formatCHF(item.amount)}`).join('\n')}
${refinancing.timeSavings > 0 ? `• Zeit-Einsparungen: +${formatCHF(refinancing.timeSavings)}` : ''}
${refinancing.sponsoringSavings > 0 ? `• Sponsoring: +${formatCHF(refinancing.sponsoringSavings)}` : ''}

TOTAL: ${formatCHF(refinancing.totalSavings)} /Monat
${isCovered ? '✓ Vollständig gedeckt!' : `Lücke: ${formatCHF(refinancing.gap)}`}

EMPFOHLENE MODULE
───────────────────────────────────────
${fitResult.modules.map(m => {
  const module = MODULES[m as ModuleKey];
  return module ? `• ${module.title}` : '';
}).filter(Boolean).join('\n')}

UPLIFT-POTENZIAL (BONUS)
───────────────────────────────────────
Konservativ:  +${formatCHF(uplift.total.conservative)}/Mt.
Realistisch:  +${formatCHF(uplift.total.realistic)}/Mt.
Ambitioniert: +${formatCHF(uplift.total.ambitious)}/Mt.

═══════════════════════════════════════
${TEXTS.disclaimer}

www.2gomedia.ch | www.my2go.app/go
═══════════════════════════════════════
  `.trim();
}
