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
  ModuleKey,
  FIXCOST_ITEMS
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

// 2Go Logo as embedded Base64 (PNG with transparency)
const LOGO_2GO_BASE64 = 'data:image/png;base64,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';

// Function to convert image URL to Base64
async function loadLogoBase64(): Promise<string> {
  try {
    const response = await fetch('/src/assets/logo-2go.png');
    if (response.ok) {
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    }
  } catch (e) {
    // Fallback to embedded Base64
  }
  return LOGO_2GO_BASE64;
}

// Format number for visits display
function formatVisits(value: number): string {
  return value.toFixed(1).replace('.0', '');
}

export async function generatePDFReport(data: ExportData): Promise<void> {
  const { answers, fitResult, refinancing, uplift, planName, planPrice } = data;
  const fitLabel = TEXTS.fitLabels[fitResult.score];
  const isCovered = refinancing.gap <= 0;
  const coveragePercent = Math.min(100, (refinancing.totalSavings / planPrice) * 100);
  const mehrbesuche = uplift.mehrbesuche;
  
  // Load logo
  const logoBase64 = await loadLogoBase64();
  
  // Create PDF document (A4)
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;

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

  const addHeader = (pageNum: number) => {
    drawRect(0, 0, pageWidth, 35, COLORS.secondary);
    
    try {
      pdf.addImage(logoBase64, 'PNG', margin, 8, 30, 20);
    } catch {
      drawRect(margin, 8, 30, 20, COLORS.white, 3);
      addText('2Go', margin + 15, 20, { fontSize: 12, fontStyle: 'bold', color: COLORS.secondary, align: 'center' });
    }
    
    addText('Partner Fit-Check', margin + 38, 18, { fontSize: 16, fontStyle: 'bold', color: COLORS.white });
    addText(`Seite ${pageNum}`, margin + 38, 26, { fontSize: 9, color: COLORS.primary });
    
    addText('2Go Media AG', pageWidth - margin, 12, { fontSize: 9, fontStyle: 'bold', color: COLORS.white, align: 'right' });
    addText('Industriestrasse 19', pageWidth - margin, 18, { fontSize: 8, color: COLORS.white, align: 'right' });
    addText('5200 Brugg', pageWidth - margin, 24, { fontSize: 8, color: COLORS.white, align: 'right' });
    addText('www.2gomedia.ch', pageWidth - margin, 30, { fontSize: 8, color: COLORS.accent, align: 'right' });
  };

  const addFooter = (pageNum: number, totalPages: number) => {
    const footerY = pageHeight - 12;
    drawRect(0, footerY - 5, pageWidth, 17, COLORS.background);
    addText(`Seite ${pageNum} von ${totalPages}`, pageWidth / 2, footerY, { fontSize: 8, color: COLORS.textLight, align: 'center' });
    addText('2Go Media GmbH • partner@my2go.app • www.2gomedia.ch', pageWidth / 2, footerY + 5, { 
      fontSize: 7, color: COLORS.textLight, align: 'center' 
    });
  };

  // ============== PAGE 1: OVERVIEW ==============
  let y = 0;
  addHeader(1);
  y = 45;

  addText('Ihr persönlicher Partner Fit-Check Report', pageWidth / 2, y, { 
    fontSize: 18, fontStyle: 'bold', color: COLORS.secondary, align: 'center' 
  });
  y += 6;
  addText(`Erstellt am ${formatDate(new Date())}`, pageWidth / 2, y, { 
    fontSize: 10, color: COLORS.textMuted, align: 'center' 
  });
  y += 12;

  // Company Info Box
  if (answers.companyName) {
    drawRect(margin, y, contentWidth, 28, COLORS.background, 4);
    y += 8;
    addText('📍 Ihre Firmendaten', margin + 5, y, { fontSize: 10, fontStyle: 'bold', color: COLORS.secondary });
    y += 6;
    addText(answers.companyName, margin + 5, y, { fontSize: 11, fontStyle: 'bold' });
    y += 5;
    if (answers.contactPerson) {
      addText(`Kontakt: ${answers.contactPerson}`, margin + 5, y, { fontSize: 9, color: COLORS.textMuted });
      y += 4;
    }
    const address = [answers.companyAddress, `${answers.companyPostalCode} ${answers.companyCity}`].filter(Boolean).join(', ');
    if (address.trim()) {
      addText(address, margin + 5, y, { fontSize: 9, color: COLORS.textMuted });
    }
    y += 12;
  }

  // Main Recommendation Box
  y += 2;
  drawRect(margin, y, contentWidth, 48, COLORS.secondary, 6);
  
  const fitBadgeColor = fitResult.score === 'A' ? '#dcfce7' : fitResult.score === 'B' ? '#fef3c7' : '#fee2e2';
  const fitTextColor = fitResult.score === 'A' ? '#166534' : fitResult.score === 'B' ? '#92400e' : '#991b1b';
  drawRect(pageWidth / 2 - 30, y + 6, 60, 10, fitBadgeColor, 5);
  addText(`⭐ ${fitLabel.title}`, pageWidth / 2, y + 13, { fontSize: 11, fontStyle: 'bold', color: fitTextColor, align: 'center' });
  
  addText('Empfohlener Plan', pageWidth / 2, y + 24, { fontSize: 10, color: COLORS.primary, align: 'center' });
  addText(planName, pageWidth / 2, y + 32, { fontSize: 18, fontStyle: 'bold', color: COLORS.white, align: 'center' });
  addText(formatCHF(planPrice) + ' /Monat', pageWidth / 2, y + 42, { fontSize: 14, fontStyle: 'bold', color: COLORS.accent, align: 'center' });
  
  y += 58;

  // Quick Summary Cards - Updated to show Mehrbesuche
  const cardWidth = (contentWidth - 10) / 3;
  
  // Card 1: Mehrbesuche (NEW - primary metric)
  drawRect(margin, y, cardWidth, 32, '#3b82f6' + '15', 4);
  drawRect(margin, y, 4, 32, '#3b82f6', 2);
  addText('👥', margin + 8, y + 12, { fontSize: 14 });
  addText('Mehrbesuche/Jahr', margin + 20, y + 10, { fontSize: 9, color: COLORS.textMuted });
  addText('+' + formatVisits(mehrbesuche.totalVisitsPerYear.realistic), margin + 20, y + 20, { fontSize: 14, fontStyle: 'bold', color: '#3b82f6' });
  addText('Besuche', margin + 20, y + 26, { fontSize: 8, color: COLORS.textMuted });
  
  // Card 2: Absicherung
  drawRect(margin + cardWidth + 5, y, cardWidth, 32, isCovered ? COLORS.success + '15' : COLORS.warning + '15', 4);
  drawRect(margin + cardWidth + 5, y, 4, 32, isCovered ? COLORS.success : COLORS.warning, 2);
  addText('🛡️', margin + cardWidth + 13, y + 12, { fontSize: 14 });
  addText('Absicherung', margin + cardWidth + 25, y + 10, { fontSize: 9, color: COLORS.textMuted });
  addText(Math.round(coveragePercent) + '%', margin + cardWidth + 25, y + 20, { fontSize: 14, fontStyle: 'bold', color: isCovered ? COLORS.success : COLORS.warning });
  addText(isCovered ? 'Gedeckt!' : 'teilweise', margin + cardWidth + 25, y + 26, { fontSize: 8, color: COLORS.textMuted });
  
  // Card 3: Einsparungen
  drawRect(margin + 2 * (cardWidth + 5), y, cardWidth, 32, COLORS.success + '15', 4);
  drawRect(margin + 2 * (cardWidth + 5), y, 4, 32, COLORS.success, 2);
  addText('💰', margin + 2 * (cardWidth + 5) + 8, y + 12, { fontSize: 14 });
  addText('Einsparungen', margin + 2 * (cardWidth + 5) + 20, y + 10, { fontSize: 9, color: COLORS.textMuted });
  addText(formatCHF(refinancing.totalSavings), margin + 2 * (cardWidth + 5) + 20, y + 20, { fontSize: 14, fontStyle: 'bold', color: COLORS.success });
  addText('/Monat', margin + 2 * (cardWidth + 5) + 20, y + 26, { fontSize: 8, color: COLORS.textMuted });
  
  y += 42;

  // Recommended Modules Preview
  addText('🎯 Empfohlene Module für Sie', margin, y, { fontSize: 12, fontStyle: 'bold', color: COLORS.secondary });
  y += 8;

  fitResult.modules.slice(0, 4).forEach((moduleKey, idx) => {
    const module = MODULES[moduleKey as ModuleKey];
    if (!module) return;
    
    drawRect(margin, y - 1, 3, 8, COLORS.primary);
    drawRect(margin + 3, y - 1, contentWidth - 3, 8, COLORS.background);
    addText(`${idx + 1}. ${module.title}`, margin + 6, y + 4, { fontSize: 9, fontStyle: 'bold', color: COLORS.text });
    addText(module.desc, margin + 60, y + 4, { fontSize: 8, color: COLORS.textMuted, maxWidth: contentWidth - 65 });
    y += 10;
  });

  if (fitResult.modules.length > 4) {
    addText(`+ ${fitResult.modules.length - 4} weitere Module (siehe Seite 3)`, margin + 6, y, { fontSize: 8, color: COLORS.textMuted });
    y += 8;
  }

  y += 5;

  // What's inside hint
  drawRect(margin, y, contentWidth, 18, COLORS.primary + '20', 4);
  addText('📄 Was dieser Report enthält:', margin + 5, y + 7, { fontSize: 9, fontStyle: 'bold', color: COLORS.secondary });
  addText('Seite 2: Mehrbesuche & 12-Monats-Projektion  •  Seite 3: Absicherung & Module', margin + 5, y + 13, { fontSize: 8, color: COLORS.textMuted });

  addFooter(1, 4);

  // ============== PAGE 2: MEHRBESUCHE & 12-MONTH PROJECTION ==============
  pdf.addPage();
  y = 0;
  addHeader(2);
  y = 45;

  addText('👥 Mehrbesuche nach 12 Monaten', pageWidth / 2, y, { 
    fontSize: 16, fontStyle: 'bold', color: COLORS.secondary, align: 'center' 
  });
  y += 5;
  addText('So sieht My2Go bei Ihnen nach 12 Monaten aus', pageWidth / 2, y, { 
    fontSize: 10, color: COLORS.textMuted, align: 'center' 
  });
  y += 15;

  // Scenario Cards for Mehrbesuche
  const scenarios = [
    { 
      label: 'Konservativ', 
      monthVisits: mehrbesuche.totalVisitsPerMonth.conservative,
      yearVisits: mehrbesuche.totalVisitsPerYear.conservative,
      chf: mehrbesuche.upliftCHFPerMonth.conservative,
      color: '#94a3b8', 
      desc: 'Minimale Aktivität' 
    },
    { 
      label: 'Realistisch', 
      monthVisits: mehrbesuche.totalVisitsPerMonth.realistic,
      yearVisits: mehrbesuche.totalVisitsPerYear.realistic,
      chf: mehrbesuche.upliftCHFPerMonth.realistic,
      color: '#3b82f6', 
      desc: 'Normale Nutzung' 
    },
    { 
      label: 'Ambitioniert', 
      monthVisits: mehrbesuche.totalVisitsPerMonth.ambitious,
      yearVisits: mehrbesuche.totalVisitsPerYear.ambitious,
      chf: mehrbesuche.upliftCHFPerMonth.ambitious,
      color: COLORS.success, 
      desc: 'Volle Aktivität' 
    }
  ];
  
  const scenarioWidth = (contentWidth - 10) / 3;
  scenarios.forEach((scenario, idx) => {
    const x = margin + idx * (scenarioWidth + 5);
    const isRealistic = idx === 1;
    
    if (isRealistic) {
      drawRect(x, y, scenarioWidth, 65, scenario.color + '20', 4);
      pdf.setDrawColor(scenario.color);
      pdf.setLineWidth(1.5);
      pdf.roundedRect(x, y, scenarioWidth, 65, 4, 4, 'S');
    } else {
      drawRect(x, y, scenarioWidth, 65, COLORS.background, 4);
    }
    
    addText(scenario.label, x + scenarioWidth / 2, y + 8, { fontSize: 10, fontStyle: isRealistic ? 'bold' : 'normal', color: scenario.color, align: 'center' });
    
    // Monthly visits
    addText('Mehrbesuche/Monat', x + scenarioWidth / 2, y + 18, { fontSize: 8, color: COLORS.textMuted, align: 'center' });
    addText('+' + formatVisits(scenario.monthVisits), x + scenarioWidth / 2, y + 27, { fontSize: 14, fontStyle: 'bold', color: scenario.color, align: 'center' });
    
    // Yearly visits
    addText('Mehrbesuche/Jahr', x + scenarioWidth / 2, y + 38, { fontSize: 8, color: COLORS.textMuted, align: 'center' });
    addText('+' + formatVisits(scenario.yearVisits), x + scenarioWidth / 2, y + 47, { fontSize: 16, fontStyle: 'bold', color: scenario.color, align: 'center' });
    
    addText(scenario.desc, x + scenarioWidth / 2, y + 58, { fontSize: 7, color: COLORS.textLight, align: 'center' });
  });
  
  y += 75;

  // 12-Month Growth Chart
  addText('📈 12-Monats-Wachstumsprognose (Realistisch)', margin, y, { fontSize: 12, fontStyle: 'bold', color: COLORS.secondary });
  y += 10;

  // Draw chart area
  const chartWidth = contentWidth;
  const chartHeight = 60;
  const chartX = margin;
  const chartY = y;
  
  drawRect(chartX, chartY, chartWidth, chartHeight, COLORS.background, 4);
  
  // Calculate monthly cumulative visits for chart
  const monthlyIncrement = mehrbesuche.totalVisitsPerMonth.realistic;
  const months = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
  const barWidth = (chartWidth - 30) / 12;
  const maxVisits = monthlyIncrement * 12;
  const barMaxHeight = chartHeight - 20;
  
  months.forEach((month, idx) => {
    const cumulativeVisits = monthlyIncrement * (idx + 1);
    const barHeight = maxVisits > 0 ? (cumulativeVisits / maxVisits) * barMaxHeight : 0;
    const barX = chartX + 10 + idx * barWidth;
    const barY = chartY + chartHeight - 10 - barHeight;
    
    // Draw bar
    drawRect(barX, barY, barWidth - 4, barHeight, '#3b82f6' + (idx === 11 ? '' : '80'), 2);
    
    // Month label
    addText(month, barX + (barWidth - 4) / 2, chartY + chartHeight - 3, { fontSize: 6, color: COLORS.textMuted, align: 'center' });
    
    // Value on top of last bar
    if (idx === 11) {
      addText('+' + formatVisits(cumulativeVisits), barX + (barWidth - 4) / 2, barY - 3, { fontSize: 8, fontStyle: 'bold', color: '#3b82f6', align: 'center' });
    }
  });
  
  y += chartHeight + 10;

  // Assumptions Box
  addText('📋 Annahmen', margin, y, { fontSize: 11, fontStyle: 'bold', color: COLORS.secondary });
  y += 8;
  
  drawRect(margin, y, contentWidth, 35, COLORS.background, 4);
  y += 6;
  
  const assumptions = mehrbesuche.assumptions;
  addText(`• Transaktionen/Monat: ${assumptions.transactionsPerMonth}`, margin + 5, y, { fontSize: 8, color: COLORS.text });
  y += 5;
  addText(`• Ø Bon: ${formatCHF(assumptions.avgBasket)}`, margin + 5, y, { fontSize: 8, color: COLORS.text });
  y += 5;
  addText(`• Stammkundenanteil: ${formatPercent(assumptions.repeatShare)}`, margin + 5, y, { fontSize: 8, color: COLORS.text });
  y += 5;
  addText(`• Enrollment-Rate: ${assumptions.enrollmentRate} • Aktiv-Rate: ${assumptions.activeRate}`, margin + 5, y, { fontSize: 8, color: COLORS.text });
  y += 5;
  if (assumptions.hasReviewGap) {
    addText(`• inkl. Review-Turbo (konservativ) bei Review-Gap erkannt`, margin + 5, y, { fontSize: 8, color: '#f59e0b' });
  }
  
  y += 12;

  // CHF Estimate (optional/collapsed info)
  drawRect(margin, y, contentWidth, 25, '#3b82f6' + '10', 4);
  y += 6;
  addText('💡 CHF-Schätzung (optional)', margin + 5, y, { fontSize: 9, fontStyle: 'bold', color: COLORS.secondary });
  y += 7;
  addText(`Bei Ø Bon von ${formatCHF(assumptions.avgBasket)}: ~${formatCHF(mehrbesuche.upliftCHFPerMonth.realistic)}/Monat zusätzlich (realistisch)`, margin + 5, y, { fontSize: 8, color: COLORS.text });
  y += 5;
  addText('Schätzung. Keine Garantie. CHF-Schätzung basiert auf Ø Bon.', margin + 5, y, { fontSize: 7, color: COLORS.textLight });

  addFooter(2, 4);

  // ============== PAGE 3: ABSICHERUNG ==============
  pdf.addPage();
  y = 0;
  addHeader(3);
  y = 45;

  addText('🛡️ Absicherung (ohne Wachstum)', pageWidth / 2, y, { 
    fontSize: 16, fontStyle: 'bold', color: COLORS.secondary, align: 'center' 
  });
  y += 5;
  addText('Fixkosten-Einsparungen, Zeit-Einsparungen & Sponsoring', pageWidth / 2, y, { 
    fontSize: 10, color: COLORS.textMuted, align: 'center' 
  });
  y += 12;

  // Comparison Chart
  drawRect(margin, y, contentWidth, 45, COLORS.background, 4);
  y += 8;
  addText('Kosten vs. Einsparungen auf einen Blick', margin + 5, y, { fontSize: 11, fontStyle: 'bold', color: COLORS.secondary });
  y += 10;

  // Savings bar
  addText('Ihre Einsparungen', margin + 5, y, { fontSize: 9, color: COLORS.textMuted });
  const savingsBarWidth = Math.max(30, (coveragePercent / 100) * (contentWidth - 80));
  drawRect(margin + 45, y - 4, savingsBarWidth, 10, COLORS.success, 3);
  addText(formatCHF(refinancing.totalSavings), margin + 48 + savingsBarWidth, y + 1, { fontSize: 10, fontStyle: 'bold', color: COLORS.success });
  y += 14;

  // Cost bar
  addText('Plan-Kosten', margin + 5, y, { fontSize: 9, color: COLORS.textMuted });
  const costBarWidth = contentWidth - 80;
  drawRect(margin + 45, y - 4, costBarWidth, 10, COLORS.warning, 3);
  addText(formatCHF(planPrice), margin + 48 + costBarWidth, y + 1, { fontSize: 10, fontStyle: 'bold', color: COLORS.warning });
  y += 12;

  // Coverage status
  const statusIcon = isCovered ? '✅' : '⚠️';
  const statusText = isCovered 
    ? 'Vollständig refinanziert!' 
    : `${formatPercent(coveragePercent / 100)} gedeckt - Restbetrag: ${formatCHF(refinancing.gap)}`;
  addText(statusIcon + ' ' + statusText, pageWidth / 2, y, { 
    fontSize: 10, fontStyle: 'bold', color: isCovered ? COLORS.success : COLORS.warning, align: 'center' 
  });
  y += 15;

  // Detailed Breakdown
  addText('📋 Ihre Einsparpositionen im Detail', margin, y, { fontSize: 12, fontStyle: 'bold', color: COLORS.secondary });
  y += 8;

  refinancing.fixcostBreakdown.forEach((item, idx) => {
    const bgColor = idx % 2 === 0 ? COLORS.background : COLORS.white;
    drawRect(margin, y - 2, contentWidth, 12, bgColor, 2);
    
    const fixcostItem = FIXCOST_ITEMS.find(f => f.label === item.label);
    const unitInfo = fixcostItem && 'unit' in fixcostItem ? ` (${(fixcostItem as any).unit})` : '';
    
    addText(`• ${item.label}${unitInfo}`, margin + 5, y + 4, { fontSize: 9, color: COLORS.text });
    addText(`+${formatCHF(item.amount)}`, pageWidth - margin - 5, y + 4, { fontSize: 10, fontStyle: 'bold', color: COLORS.success, align: 'right' });
    y += 12;
  });

  if (refinancing.timeSavings > 0) {
    drawRect(margin, y - 2, contentWidth, 12, COLORS.background, 2);
    addText(`• Zeit-Einsparungen (${refinancing.timeHours} Stunden × CHF 90)`, margin + 5, y + 4, { fontSize: 9, color: COLORS.text });
    addText(`+${formatCHF(refinancing.timeSavings)}`, pageWidth - margin - 5, y + 4, { fontSize: 10, fontStyle: 'bold', color: COLORS.success, align: 'right' });
    y += 12;
  }

  if (refinancing.sponsoringSavings > 0) {
    drawRect(margin, y - 2, contentWidth, 12, COLORS.background, 2);
    addText(`• Sponsoring-Potenzial (geschätzt)`, margin + 5, y + 4, { fontSize: 9, color: COLORS.text });
    addText(`+${formatCHF(refinancing.sponsoringSavings)}`, pageWidth - margin - 5, y + 4, { fontSize: 10, fontStyle: 'bold', color: COLORS.success, align: 'right' });
    y += 12;
  }

  // Total
  y += 3;
  drawRect(margin, y, contentWidth, 16, COLORS.success + '20', 4);
  addText('🎉 TOTAL EINSPARUNGEN', margin + 5, y + 10, { fontSize: 11, fontStyle: 'bold', color: COLORS.text });
  addText(formatCHF(refinancing.totalSavings) + ' /Monat', pageWidth - margin - 5, y + 10, { fontSize: 14, fontStyle: 'bold', color: COLORS.success, align: 'right' });

  addFooter(3, 4);

  // ============== PAGE 4: MODULES ==============
  pdf.addPage();
  y = 0;
  addHeader(4);
  y = 45;

  addText('🎯 Ihre empfohlenen Module im Detail', pageWidth / 2, y, { 
    fontSize: 16, fontStyle: 'bold', color: COLORS.secondary, align: 'center' 
  });
  y += 12;

  fitResult.modules.forEach((moduleKey, idx) => {
    const module = MODULES[moduleKey as ModuleKey];
    if (!module) return;
    
    if (y > pageHeight - 60) {
      pdf.addPage();
      addHeader(4);
      y = 45;
    }
    
    drawRect(margin, y, contentWidth, 18, COLORS.background, 4);
    drawRect(margin, y, 4, 18, COLORS.primary, 2);
    
    addText(`${idx + 1}`, margin + 10, y + 11, { fontSize: 12, fontStyle: 'bold', color: COLORS.secondary, align: 'center' });
    addText(module.title, margin + 22, y + 7, { fontSize: 10, fontStyle: 'bold', color: COLORS.text });
    addText(module.desc, margin + 22, y + 14, { fontSize: 8, color: COLORS.textMuted, maxWidth: contentWidth - 30 });
    y += 22;
  });

  // Review Booster Recommendation
  if (fitResult.recommendReviewBooster) {
    y += 10;
    drawRect(margin, y, contentWidth, 25, '#f59e0b' + '20', 4);
    drawRect(margin, y, 4, 25, '#f59e0b', 2);
    y += 8;
    addText('⭐ Review-Booster empfohlen', margin + 10, y, { fontSize: 10, fontStyle: 'bold', color: '#92400e' });
    y += 7;
    addText('Wir haben eine Review-Lücke erkannt. Mit dem Review-Booster Modul können Sie systematisch Bewertungen sammeln.', margin + 10, y, { fontSize: 8, color: COLORS.text, maxWidth: contentWidth - 20 });
    y += 15;
  }

  y += 10;

  // Key Message
  drawRect(margin, y, contentWidth, 35, '#3b82f6' + '15', 4);
  y += 8;
  addText('💡 Mehrbesuche sind der Kernhebel im Gastro/Retail', margin + 5, y, { fontSize: 10, fontStyle: 'bold', color: COLORS.secondary });
  y += 8;
  addText('• Stammkunden-Aktivierung: Mehr Wiederkäufe durch Taler-Punkte', margin + 5, y, { fontSize: 8, color: COLORS.text });
  y += 5;
  addText('• Netzwerk-Effekt: Neukunden durch Partner-Cross-Promotion', margin + 5, y, { fontSize: 8, color: COLORS.text });
  y += 5;
  addText('• Review-Booster: Bessere Online-Reputation = mehr Neukunden', margin + 5, y, { fontSize: 8, color: COLORS.text });

  // Disclaimer
  y = pageHeight - 50;
  pdf.setDrawColor('#e5e5e5');
  pdf.setLineWidth(0.2);
  pdf.line(margin, y, pageWidth - margin, y);
  y += 5;
  addText('Hinweis:', margin, y, { fontSize: 8, fontStyle: 'bold', color: COLORS.textLight });
  y += 4;
  addText(TEXTS.disclaimer, margin, y, { fontSize: 7, color: COLORS.textLight, maxWidth: contentWidth });

  addFooter(4, 4);

  // Save PDF
  const filename = `My2Go-FitCheck-${answers.companyName || 'Report'}-${formatDate(new Date()).replace(/\./g, '-')}.pdf`;
  pdf.save(filename);
}

// Simple text export for clipboard - Updated to Mehrbesuche
export function generateTextReport(data: ExportData): string {
  const { answers, fitResult, refinancing, uplift, planName, planPrice } = data;
  const fitLabel = TEXTS.fitLabels[fitResult.score];
  const isCovered = refinancing.gap <= 0;
  const mehrbesuche = uplift.mehrbesuche;

  return `
═══════════════════════════════════════
MY2GO PARTNER FIT-CHECK ERGEBNIS
2Go Media GmbH | www.2gomedia.ch
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

MEHRBESUCHE NACH 12 MONATEN
───────────────────────────────────────
Konservativ:  +${formatVisits(mehrbesuche.totalVisitsPerMonth.conservative)} Besuche/Mt. | +${formatVisits(mehrbesuche.totalVisitsPerYear.conservative)} Besuche/Jahr
Realistisch:  +${formatVisits(mehrbesuche.totalVisitsPerMonth.realistic)} Besuche/Mt. | +${formatVisits(mehrbesuche.totalVisitsPerYear.realistic)} Besuche/Jahr
Ambitioniert: +${formatVisits(mehrbesuche.totalVisitsPerMonth.ambitious)} Besuche/Mt. | +${formatVisits(mehrbesuche.totalVisitsPerYear.ambitious)} Besuche/Jahr

Annahmen:
• Transaktionen/Monat: ${mehrbesuche.assumptions.transactionsPerMonth}
• Ø Bon: ${formatCHF(mehrbesuche.assumptions.avgBasket)}
• Stammkundenanteil: ${formatPercent(mehrbesuche.assumptions.repeatShare)}
${mehrbesuche.assumptions.hasReviewGap ? '• inkl. Review-Turbo (konservativ)' : ''}

CHF-Schätzung (optional):
Realistisch: ~${formatCHF(mehrbesuche.upliftCHFPerMonth.realistic)}/Mt. zusätzlich

ABSICHERUNG (OHNE WACHSTUM)
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
  return module ? `• ${module.title}: ${module.desc}` : '';
}).filter(Boolean).join('\n')}

═══════════════════════════════════════
${TEXTS.disclaimer}

2Go Media AG
Industriestrasse 19, 5200 Brugg
www.2gomedia.ch | partner@my2go.app
═══════════════════════════════════════
  `.trim();
}
