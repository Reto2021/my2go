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

  // Create HTML content for PDF
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>My2Go Fit-Check Ergebnis</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          padding: 40px;
          max-width: 800px;
          margin: 0 auto;
          color: #1a1a1a;
          line-height: 1.5;
        }
        .header { 
          text-align: center; 
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #e5e5e5;
        }
        .logo { font-size: 24px; font-weight: bold; color: #FF6B00; }
        .date { color: #666; font-size: 14px; margin-top: 8px; }
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
        }
        .fit-score {
          display: inline-block;
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: bold;
          margin-bottom: 10px;
        }
        .fit-A { background: #dcfce7; color: #166534; }
        .fit-B { background: #fef3c7; color: #92400e; }
        .fit-C { background: #fee2e2; color: #991b1b; }
        .plan-box {
          background: linear-gradient(135deg, #FF6B00 0%, #FF8533 100%);
          color: white;
          padding: 20px;
          border-radius: 12px;
          text-align: center;
          margin-bottom: 20px;
        }
        .plan-name { font-size: 24px; font-weight: bold; }
        .plan-price { font-size: 32px; font-weight: bold; margin-top: 8px; }
        .plan-period { font-size: 14px; opacity: 0.8; }
        .progress-bar {
          height: 20px;
          background: #e5e5e5;
          border-radius: 10px;
          overflow: hidden;
          margin: 15px 0;
        }
        .progress-fill {
          height: 100%;
          background: ${isCovered ? '#22c55e' : '#FF6B00'};
          width: ${coveragePercent}%;
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
        .uplift-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
        }
        .uplift-card {
          text-align: center;
          padding: 15px;
          background: white;
          border-radius: 8px;
        }
        .uplift-label { font-size: 12px; color: #666; margin-bottom: 5px; }
        .uplift-value { font-size: 20px; font-weight: bold; color: #22c55e; }
        .company-info {
          background: #f3f4f6;
          padding: 15px;
          border-radius: 8px;
        }
        .disclaimer {
          font-size: 12px;
          color: #666;
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e5e5e5;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          color: #666;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">My 2Go</div>
        <div>Partner Fit-Check Ergebnis</div>
        <div class="date">Erstellt am ${formatDate(new Date())}</div>
      </div>

      ${answers.companyName ? `
      <div class="company-info">
        <strong>${answers.companyName}</strong><br>
        ${answers.contactPerson}<br>
        ${answers.companyAddress ? `${answers.companyAddress}, ` : ''}${answers.companyPostalCode} ${answers.companyCity}<br>
        ${answers.contactEmail} • ${answers.contactPhone}
      </div>
      ` : ''}

      <div class="plan-box">
        <div class="fit-score fit-${fitResult.score}">${fitLabel.title}</div>
        <div class="plan-name">${planName}</div>
        <div class="plan-price">${formatCHF(planPrice)}</div>
        <div class="plan-period">pro Monat</div>
      </div>

      <div class="section">
        <div class="section-title">🎯 0-Risiko Refinanzierung</div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
          <span>Abdeckung</span>
          <strong style="color: ${isCovered ? '#22c55e' : '#f59e0b'}">${formatPercent(coveragePercent / 100)}</strong>
        </div>
        <div class="progress-bar">
          <div class="progress-fill"></div>
        </div>
        
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
        
        <div class="breakdown-item" style="font-weight: bold; border-top: 2px solid #e5e5e5; margin-top: 10px; padding-top: 15px;">
          <span>Total Einsparungen</span>
          <span class="breakdown-amount">${formatCHF(refinancing.totalSavings)}</span>
        </div>
        
        ${!isCovered && refinancing.miniPriceLever ? `
          <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin-top: 15px;">
            <strong>Mini-Preishebel:</strong> 
            Nur ${formatCHF(refinancing.miniPriceLever.requiredExtraRevenue)} Mehrumsatz/Mt. benötigt 
            (≈ ${formatCHF(refinancing.miniPriceLever.priceIncreasePerSale)} pro Transaktion)
          </div>
        ` : ''}
      </div>

      <div class="section">
        <div class="section-title">✨ Empfohlene Module</div>
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

      <div class="section">
        <div class="section-title">📈 Uplift-Potenzial (Bonus)</div>
        <div class="uplift-grid">
          <div class="uplift-card">
            <div class="uplift-label">Konservativ</div>
            <div class="uplift-value">+${formatCHF(uplift.total.conservative)}/Mt.</div>
          </div>
          <div class="uplift-card" style="border: 2px solid #22c55e;">
            <div class="uplift-label">Realistisch</div>
            <div class="uplift-value">+${formatCHF(uplift.total.realistic)}/Mt.</div>
          </div>
          <div class="uplift-card">
            <div class="uplift-label">Ambitioniert</div>
            <div class="uplift-value">+${formatCHF(uplift.total.ambitious)}/Mt.</div>
          </div>
        </div>
        <p style="text-align: center; font-size: 12px; color: #666; margin-top: 10px;">
          Basis: ${formatCHF(uplift.baselineRevenue)} geschätzter Monatsumsatz
        </p>
      </div>

      <div class="disclaimer">
        ${TEXTS.disclaimer}
      </div>

      <div class="footer">
        <strong>My 2Go</strong> – Das Loyalitäts-Netzwerk für lokale Betriebe<br>
        www.my2go.app/go
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
