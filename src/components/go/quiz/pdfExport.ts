import html2canvas from 'html2canvas';
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

export async function generatePDFReport(data: ExportData): Promise<void> {
  const { answers, fitResult, refinancing, uplift, planName, planPrice } = data;
  const fitLabel = TEXTS.fitLabels[fitResult.score];
  const isCovered = refinancing.gap <= 0;
  const coveragePercent = Math.min(100, (refinancing.totalSavings / planPrice) * 100);
  
  // Calculate chart data for visual representation
  const maxSavings = Math.max(
    refinancing.totalSavings,
    planPrice,
    uplift.total.ambitious
  );
  const savingsBarWidth = (refinancing.totalSavings / maxSavings) * 100;
  const planBarWidth = (planPrice / maxSavings) * 100;
  
  // Uplift chart bars
  const upliftMax = uplift.total.ambitious;
  const conservativeWidth = (uplift.total.conservative / upliftMax) * 100;
  const realisticWidth = (uplift.total.realistic / upliftMax) * 100;
  const ambitiousWidth = 100;

  // Create HTML content for PDF
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>2Go Partner Fit-Check Report</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          padding: 0;
          max-width: 800px;
          margin: 0 auto;
          color: #1a1a1a;
          line-height: 1.5;
          background: white;
        }
        
        /* Letterhead Header */
        .letterhead {
          background: linear-gradient(135deg, #FF6B00 0%, #FF8533 100%);
          color: white;
          padding: 30px 40px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .letterhead-logo {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .logo-icon {
          width: 50px;
          height: 50px;
          background: white;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 20px;
          color: #FF6B00;
        }
        .logo-text {
          font-size: 28px;
          font-weight: bold;
        }
        .logo-tagline {
          font-size: 12px;
          opacity: 0.9;
        }
        .sender-info {
          text-align: right;
          font-size: 12px;
          line-height: 1.6;
        }
        .sender-info strong {
          font-size: 14px;
        }
        
        .content {
          padding: 40px;
        }
        
        /* Document Title */
        .doc-title {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #e5e5e5;
        }
        .doc-title h1 {
          font-size: 24px;
          color: #333;
          margin-bottom: 8px;
        }
        .doc-title .date {
          color: #666;
          font-size: 14px;
        }
        .doc-title .privacy-note {
          font-size: 11px;
          color: #888;
          margin-top: 8px;
          font-style: italic;
        }
        
        .section { 
          margin-bottom: 30px; 
          padding: 20px;
          background: #f9f9f9;
          border-radius: 12px;
        }
        .section-title { 
          font-size: 18px; 
          font-weight: bold; 
          margin-bottom: 15px;
          color: #333;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .fit-badge {
          display: inline-block;
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: bold;
          font-size: 14px;
        }
        .fit-A { background: #dcfce7; color: #166534; }
        .fit-B { background: #fef3c7; color: #92400e; }
        .fit-C { background: #fee2e2; color: #991b1b; }
        
        .plan-box {
          background: linear-gradient(135deg, #FF6B00 0%, #FF8533 100%);
          color: white;
          padding: 25px;
          border-radius: 12px;
          text-align: center;
          margin-bottom: 25px;
          position: relative;
          overflow: hidden;
        }
        .plan-box::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -50%;
          width: 100%;
          height: 200%;
          background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 60%);
        }
        .plan-name { font-size: 26px; font-weight: bold; position: relative; }
        .plan-price { font-size: 36px; font-weight: bold; margin-top: 8px; position: relative; }
        .plan-period { font-size: 14px; opacity: 0.8; position: relative; }
        
        /* Visual Charts */
        .chart-container {
          background: white;
          border-radius: 8px;
          padding: 20px;
          margin: 15px 0;
        }
        .chart-title {
          font-size: 14px;
          font-weight: 600;
          color: #555;
          margin-bottom: 15px;
        }
        .bar-chart {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .bar-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .bar-label {
          width: 120px;
          font-size: 12px;
          color: #666;
          text-align: right;
        }
        .bar-track {
          flex: 1;
          height: 28px;
          background: #e5e5e5;
          border-radius: 6px;
          overflow: hidden;
          position: relative;
        }
        .bar-fill {
          height: 100%;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          padding-right: 10px;
          font-size: 12px;
          font-weight: bold;
          color: white;
          min-width: 80px;
        }
        .bar-fill.savings { background: linear-gradient(90deg, #22c55e 0%, #16a34a 100%); }
        .bar-fill.cost { background: linear-gradient(90deg, #f59e0b 0%, #d97706 100%); }
        .bar-fill.conservative { background: linear-gradient(90deg, #94a3b8 0%, #64748b 100%); }
        .bar-fill.realistic { background: linear-gradient(90deg, #22c55e 0%, #16a34a 100%); }
        .bar-fill.ambitious { background: linear-gradient(90deg, #3b82f6 0%, #2563eb 100%); }
        
        /* Comparison Visual */
        .comparison-visual {
          display: flex;
          justify-content: center;
          align-items: flex-end;
          gap: 40px;
          padding: 20px;
          background: white;
          border-radius: 8px;
          margin: 15px 0;
        }
        .comparison-column {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }
        .comparison-bar {
          width: 80px;
          border-radius: 8px 8px 0 0;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          padding-bottom: 10px;
          font-weight: bold;
          color: white;
          font-size: 14px;
          min-height: 40px;
        }
        .comparison-bar.savings-bar {
          background: linear-gradient(180deg, #22c55e 0%, #16a34a 100%);
          height: ${Math.max(40, savingsBarWidth * 1.5)}px;
        }
        .comparison-bar.cost-bar {
          background: linear-gradient(180deg, #f59e0b 0%, #d97706 100%);
          height: ${Math.max(40, planBarWidth * 1.5)}px;
        }
        .comparison-label {
          font-size: 12px;
          color: #666;
          text-align: center;
        }
        .comparison-amount {
          font-size: 16px;
          font-weight: bold;
          color: #333;
        }
        
        .coverage-indicator {
          text-align: center;
          padding: 15px;
          background: ${isCovered ? '#dcfce7' : '#fef3c7'};
          border-radius: 8px;
          margin-top: 15px;
        }
        .coverage-indicator strong {
          color: ${isCovered ? '#166534' : '#92400e'};
          font-size: 18px;
        }
        
        .breakdown-item {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid #e5e5e5;
        }
        .breakdown-item:last-child { border-bottom: none; }
        .breakdown-amount { font-weight: bold; color: #22c55e; }
        
        .module-item {
          padding: 12px;
          background: white;
          border-radius: 8px;
          margin-bottom: 8px;
          border-left: 4px solid #FF6B00;
        }
        .module-title { font-weight: bold; }
        .module-desc { font-size: 14px; color: #666; }
        
        /* Uplift Chart Section */
        .uplift-chart {
          background: white;
          border-radius: 8px;
          padding: 20px;
        }
        .uplift-bar-row {
          display: flex;
          align-items: center;
          margin-bottom: 12px;
        }
        .uplift-bar-row:last-child { margin-bottom: 0; }
        .uplift-label {
          width: 100px;
          font-size: 13px;
          color: #666;
        }
        .uplift-track {
          flex: 1;
          height: 32px;
          background: #f3f4f6;
          border-radius: 6px;
          overflow: hidden;
          margin: 0 15px;
        }
        .uplift-fill {
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          padding-right: 12px;
          font-weight: bold;
          color: white;
          font-size: 13px;
        }
        .uplift-fill.conservative { background: linear-gradient(90deg, #94a3b8, #64748b); width: ${conservativeWidth}%; }
        .uplift-fill.realistic { background: linear-gradient(90deg, #22c55e, #16a34a); width: ${realisticWidth}%; }
        .uplift-fill.ambitious { background: linear-gradient(90deg, #3b82f6, #2563eb); width: ${ambitiousWidth}%; }
        .uplift-amount {
          width: 120px;
          font-weight: bold;
          color: #333;
          text-align: right;
        }
        
        .company-info {
          background: #f3f4f6;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        
        .disclaimer {
          font-size: 11px;
          color: #888;
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e5e5e5;
        }
        
        .footer {
          background: #f8f9fa;
          padding: 20px 40px;
          text-align: center;
          border-top: 1px solid #e5e5e5;
        }
        .footer-logo {
          font-size: 18px;
          font-weight: bold;
          color: #FF6B00;
          margin-bottom: 5px;
        }
        .footer-tagline {
          font-size: 12px;
          color: #666;
        }
        .footer-contact {
          font-size: 11px;
          color: #888;
          margin-top: 10px;
        }
      </style>
    </head>
    <body>
      <!-- Professional Letterhead -->
      <div class="letterhead">
        <div class="letterhead-logo">
          <div class="logo-icon">2Go</div>
          <div>
            <div class="logo-text">My 2Go</div>
            <div class="logo-tagline">Das Loyalitäts-Netzwerk</div>
          </div>
        </div>
        <div class="sender-info">
          <strong>2Go GmbH</strong><br>
          Bahnhofstrasse 10<br>
          8001 Zürich<br>
          Schweiz<br><br>
          <strong>Tel:</strong> +41 44 123 45 67<br>
          <strong>E-Mail:</strong> partner@my2go.app<br>
          <strong>Web:</strong> www.my2go.app
        </div>
      </div>
      
      <div class="content">
        <!-- Document Title -->
        <div class="doc-title">
          <h1>🎯 Ihr persönlicher Partner Fit-Check Report</h1>
          <div class="date">Erstellt am ${formatDate(new Date())}</div>
          <div class="privacy-note">Ihre Angaben werden nur für die Analyse und das Zusenden des Reports verwendet.</div>
        </div>

        ${answers.companyName ? `
        <div class="company-info">
          <strong style="font-size: 16px;">${answers.companyName}</strong><br>
          ${answers.contactPerson}<br>
          ${answers.companyAddress ? `${answers.companyAddress}, ` : ''}${answers.companyPostalCode} ${answers.companyCity}<br>
          📧 ${answers.contactEmail} &nbsp;•&nbsp; 📞 ${answers.contactPhone}
        </div>
        ` : ''}

        <div class="plan-box">
          <div class="fit-badge fit-${fitResult.score}">${fitLabel.title}</div>
          <div class="plan-name">${planName}</div>
          <div class="plan-price">${formatCHF(planPrice)}</div>
          <div class="plan-period">pro Monat</div>
        </div>

        <!-- Visual Comparison Chart -->
        <div class="section">
          <div class="section-title">📊 Kosten vs. Einsparungen auf einen Blick</div>
          <div class="comparison-visual">
            <div class="comparison-column">
              <div class="comparison-bar savings-bar">${formatPercent(coveragePercent / 100)}</div>
              <div class="comparison-amount" style="color: #22c55e;">${formatCHF(refinancing.totalSavings)}</div>
              <div class="comparison-label">Ihre Einsparungen</div>
            </div>
            <div class="comparison-column">
              <div class="comparison-bar cost-bar">100%</div>
              <div class="comparison-amount" style="color: #f59e0b;">${formatCHF(planPrice)}</div>
              <div class="comparison-label">Plankosten/Mt.</div>
            </div>
          </div>
          <div class="coverage-indicator">
            <strong>${isCovered ? '✅ Vollständig refinanziert!' : `⚡ ${formatPercent(coveragePercent / 100)} bereits gedeckt`}</strong>
            ${!isCovered ? `<br><span style="font-size: 13px; color: #666;">Nur noch ${formatCHF(refinancing.gap)} Mehrumsatz benötigt</span>` : ''}
          </div>
        </div>

        <div class="section">
          <div class="section-title">💰 Detaillierte Einsparungen</div>
          
          ${refinancing.fixcostBreakdown.map(item => `
            <div class="breakdown-item">
              <span>${item.label}</span>
              <span class="breakdown-amount">+${formatCHF(item.amount)}</span>
            </div>
          `).join('')}
          
          ${refinancing.timeSavings > 0 ? `
            <div class="breakdown-item">
              <span>Zeit-Einsparungen (${refinancing.timeHours}h × CHF 90)</span>
              <span class="breakdown-amount">+${formatCHF(refinancing.timeSavings)}</span>
            </div>
          ` : ''}
          
          ${refinancing.sponsoringSavings > 0 ? `
            <div class="breakdown-item">
              <span>Sponsoring-Potenzial</span>
              <span class="breakdown-amount">+${formatCHF(refinancing.sponsoringSavings)}</span>
            </div>
          ` : ''}
          
          <div class="breakdown-item" style="font-weight: bold; border-top: 2px solid #22c55e; margin-top: 10px; padding-top: 15px; background: #dcfce7; margin: 10px -20px -20px; padding: 15px 20px; border-radius: 0 0 12px 12px;">
            <span>🎉 Total Einsparungen</span>
            <span class="breakdown-amount" style="font-size: 18px;">${formatCHF(refinancing.totalSavings)}</span>
          </div>
        </div>
        
        ${!isCovered && refinancing.miniPriceLever ? `
          <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 20px; border-radius: 12px; margin-bottom: 25px; border-left: 4px solid #f59e0b;">
            <strong style="font-size: 16px;">💡 Mini-Preishebel Tipp:</strong><br>
            <span style="font-size: 14px;">Nur <strong>${formatCHF(refinancing.miniPriceLever.requiredExtraRevenue)}</strong> Mehrumsatz/Mt. benötigt – 
            das sind ca. <strong>${formatCHF(refinancing.miniPriceLever.priceIncreasePerSale)}</strong> pro Transaktion!</span>
          </div>
        ` : ''}

        <!-- Uplift Potential Chart -->
        <div class="section">
          <div class="section-title">📈 Ihr Uplift-Potenzial (Zusätzlicher Gewinn)</div>
          <div class="uplift-chart">
            <div class="uplift-bar-row">
              <div class="uplift-label">Konservativ</div>
              <div class="uplift-track">
                <div class="uplift-fill conservative">+${formatPercent(0.02)}</div>
              </div>
              <div class="uplift-amount">+${formatCHF(uplift.total.conservative)}/Mt.</div>
            </div>
            <div class="uplift-bar-row">
              <div class="uplift-label" style="font-weight: bold;">Realistisch</div>
              <div class="uplift-track" style="border: 2px solid #22c55e; border-radius: 8px;">
                <div class="uplift-fill realistic">+${formatPercent(0.05)}</div>
              </div>
              <div class="uplift-amount" style="color: #22c55e;">+${formatCHF(uplift.total.realistic)}/Mt.</div>
            </div>
            <div class="uplift-bar-row">
              <div class="uplift-label">Ambitioniert</div>
              <div class="uplift-track">
                <div class="uplift-fill ambitious">+${formatPercent(0.10)}</div>
              </div>
              <div class="uplift-amount">+${formatCHF(uplift.total.ambitious)}/Mt.</div>
            </div>
          </div>
          <p style="text-align: center; font-size: 12px; color: #666; margin-top: 15px;">
            Basierend auf geschätztem Monatsumsatz von ${formatCHF(uplift.baselineRevenue)}
          </p>
        </div>

        <div class="section">
          <div class="section-title">✨ Empfohlene Module für Sie</div>
          ${fitResult.modules.map(moduleKey => {
            const module = MODULES[moduleKey as ModuleKey];
            if (!module) return '';
            return `
              <div class="module-item">
                <div class="module-title">${module.title}</div>
                <div class="module-desc">${module.desc}</div>
              </div>
            `;
          }).join('')}
        </div>

        <div class="disclaimer">
          ${TEXTS.disclaimer}
        </div>
      </div>
      
      <!-- Footer -->
      <div class="footer">
        <div class="footer-logo">My 2Go</div>
        <div class="footer-tagline">Das Loyalitäts-Netzwerk für lokale Betriebe in der Schweiz</div>
        <div class="footer-contact">
          2Go GmbH • Bahnhofstrasse 10 • 8001 Zürich • partner@my2go.app • www.my2go.app
        </div>
      </div>
    </body>
    </html>
  `;

  // Create a hidden iframe to render the HTML
  const iframe = document.createElement('iframe');
  iframe.style.position = 'absolute';
  iframe.style.left = '-9999px';
  iframe.style.width = '800px';
  iframe.style.height = '1200px';
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!iframeDoc) {
    document.body.removeChild(iframe);
    throw new Error('Could not create iframe document');
  }

  iframeDoc.open();
  iframeDoc.write(htmlContent);
  iframeDoc.close();

  // Wait for content to render
  await new Promise(resolve => setTimeout(resolve, 500));

  try {
    // Capture as canvas
    const canvas = await html2canvas(iframeDoc.body, {
      scale: 2,
      useCORS: true,
      logging: false,
      width: 800,
      windowWidth: 800
    });

    // Convert to image and trigger download
    const imgData = canvas.toDataURL('image/png');
    
    // Create download link
    const link = document.createElement('a');
    link.download = `My2Go-FitCheck-${answers.companyName || 'Ergebnis'}-${formatDate(new Date()).replace(/\./g, '-')}.png`;
    link.href = imgData;
    link.click();

    // For actual PDF, you could use jsPDF:
    // const pdf = new jsPDF('p', 'mm', 'a4');
    // const imgWidth = 210;
    // const imgHeight = (canvas.height * imgWidth) / canvas.width;
    // pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    // pdf.save('My2Go-FitCheck.pdf');

  } finally {
    document.body.removeChild(iframe);
  }
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

TOTAL: ${formatCHF(refinancing.totalSavings)}
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

www.my2go.app/go
═══════════════════════════════════════
  `.trim();
}
