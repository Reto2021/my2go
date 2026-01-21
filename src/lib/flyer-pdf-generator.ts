import jsPDF from 'jspdf';

// Brand Colors - Radio 2Go
const COLORS = {
  petrol: { r: 12, g: 74, b: 86 },      // #0C4A56
  gold: { r: 247, g: 181, b: 0 },        // #F7B500
  white: { r: 255, g: 255, b: 255 },
  dark: { r: 30, g: 30, b: 30 },
  lightGray: { r: 245, g: 245, b: 245 },
  mediumGray: { r: 120, g: 120, b: 120 },
  lightPetrol: { r: 122, g: 184, b: 214 }, // #7AB8D6 Sky Blue
};

// Font: We use Helvetica as it's built into jsPDF
const FONT_FAMILY = 'helvetica';

// URLs
const APP_URL = 'www.my2go.app';
const PARTNER_URL = 'www.my2go.app/go';

// Helper to draw a simple icon using basic shapes
function drawIcon(doc: jsPDF, type: 'radio' | 'coin' | 'gift' | 'check' | 'star' | 'chart', x: number, y: number, size: number, color: { r: number; g: number; b: number }) {
  doc.setDrawColor(color.r, color.g, color.b);
  doc.setFillColor(color.r, color.g, color.b);
  doc.setLineWidth(0.5);
  
  switch (type) {
    case 'radio':
      // Headphones shape
      doc.circle(x, y, size * 0.4, 'S');
      doc.setLineWidth(1);
      doc.line(x - size * 0.3, y - size * 0.1, x - size * 0.3, y + size * 0.3);
      doc.line(x + size * 0.3, y - size * 0.1, x + size * 0.3, y + size * 0.3);
      break;
    case 'coin':
      // Taler coin
      doc.circle(x, y, size * 0.4, 'F');
      doc.setTextColor(COLORS.petrol.r, COLORS.petrol.g, COLORS.petrol.b);
      doc.setFontSize(size * 0.5);
      doc.setFont(FONT_FAMILY, 'bold');
      doc.text('T', x, y + size * 0.15, { align: 'center' });
      break;
    case 'gift':
      // Gift box
      doc.rect(x - size * 0.3, y - size * 0.1, size * 0.6, size * 0.5, 'F');
      doc.rect(x - size * 0.35, y - size * 0.25, size * 0.7, size * 0.2, 'F');
      doc.setDrawColor(COLORS.white.r, COLORS.white.g, COLORS.white.b);
      doc.setLineWidth(0.4);
      doc.line(x, y - size * 0.25, x, y + size * 0.4);
      break;
    case 'check':
      // Checkmark
      doc.setLineWidth(0.8);
      doc.line(x - size * 0.25, y, x - size * 0.05, y + size * 0.2);
      doc.line(x - size * 0.05, y + size * 0.2, x + size * 0.3, y - size * 0.2);
      break;
    case 'star':
      // Simple star (5 lines from center)
      const starPoints = 5;
      for (let i = 0; i < starPoints; i++) {
        const angle = (i * 2 * Math.PI / starPoints) - Math.PI / 2;
        doc.line(x, y, x + Math.cos(angle) * size * 0.35, y + Math.sin(angle) * size * 0.35);
      }
      break;
    case 'chart':
      // Bar chart
      doc.rect(x - size * 0.3, y + size * 0.1, size * 0.15, size * 0.3, 'F');
      doc.rect(x - size * 0.1, y - size * 0.1, size * 0.15, size * 0.5, 'F');
      doc.rect(x + size * 0.1, y - size * 0.3, size * 0.15, size * 0.7, 'F');
      break;
  }
}

// Helper to draw QR code placeholder with actual URL text
function drawQRPlaceholder(doc: jsPDF, x: number, y: number, size: number, url: string, label: string) {
  // QR Background
  doc.setFillColor(COLORS.white.r, COLORS.white.g, COLORS.white.b);
  doc.setDrawColor(COLORS.petrol.r, COLORS.petrol.g, COLORS.petrol.b);
  doc.setLineWidth(0.3);
  doc.roundedRect(x - size / 2, y, size, size, 2, 2, 'FD');
  
  // Grid pattern to simulate QR
  const gridSize = size / 7;
  const startX = x - size / 2 + gridSize;
  const startY = y + gridSize;
  
  doc.setFillColor(COLORS.petrol.r, COLORS.petrol.g, COLORS.petrol.b);
  
  // Corner patterns (characteristic of QR codes)
  // Top-left
  doc.rect(startX, startY, gridSize * 2, gridSize * 2, 'F');
  // Top-right
  doc.rect(startX + gridSize * 3, startY, gridSize * 2, gridSize * 2, 'F');
  // Bottom-left
  doc.rect(startX, startY + gridSize * 3, gridSize * 2, gridSize * 2, 'F');
  // Center dot
  doc.rect(startX + gridSize * 2, startY + gridSize * 2, gridSize, gridSize, 'F');
  
  // URL under QR
  doc.setFontSize(7);
  doc.setFont(FONT_FAMILY, 'bold');
  doc.setTextColor(COLORS.petrol.r, COLORS.petrol.g, COLORS.petrol.b);
  doc.text(label, x, y + size + 5, { align: 'center' });
  
  doc.setFontSize(6);
  doc.setFont(FONT_FAMILY, 'normal');
  doc.setTextColor(COLORS.mediumGray.r, COLORS.mediumGray.g, COLORS.mediumGray.b);
  doc.text(url, x, y + size + 9, { align: 'center' });
}

// Draw the Radio 2Go logo
function drawLogo(doc: jsPDF, x: number, y: number, width: number) {
  const height = width * 0.4;
  
  // Logo background pill
  doc.setFillColor(COLORS.white.r, COLORS.white.g, COLORS.white.b);
  doc.roundedRect(x, y, width, height, height / 2, height / 2, 'F');
  
  // Radio 2Go text
  doc.setFont(FONT_FAMILY, 'bold');
  doc.setFontSize(height * 0.45);
  doc.setTextColor(COLORS.petrol.r, COLORS.petrol.g, COLORS.petrol.b);
  doc.text('Radio', x + 4, y + height * 0.62);
  
  doc.setTextColor(COLORS.gold.r, COLORS.gold.g, COLORS.gold.b);
  doc.text('2Go', x + width * 0.5, y + height * 0.62);
}

export function generateMarketingFlyer(): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a5', // 148 x 210 mm
  });

  const pageWidth = 148;
  const pageHeight = 210;
  const margin = 10;
  const contentWidth = pageWidth - (margin * 2);

  // ============================================
  // PAGE 1: ENDKUNDEN (Front) - Petrol Background
  // ============================================
  
  // Full petrol background
  doc.setFillColor(COLORS.petrol.r, COLORS.petrol.g, COLORS.petrol.b);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  
  // Gold accent bar at top
  doc.setFillColor(COLORS.gold.r, COLORS.gold.g, COLORS.gold.b);
  doc.rect(0, 0, pageWidth, 6, 'F');
  
  // Logo
  drawLogo(doc, margin, 14, 45);
  
  // Main Headline
  let y = 42;
  doc.setFont(FONT_FAMILY, 'bold');
  doc.setFontSize(26);
  doc.setTextColor(COLORS.white.r, COLORS.white.g, COLORS.white.b);
  doc.text('Hör Radio.', margin, y);
  
  y += 11;
  doc.text('Sammle Taler.', margin, y);
  
  y += 11;
  doc.setTextColor(COLORS.gold.r, COLORS.gold.g, COLORS.gold.b);
  doc.text('Geniess vor Ort.', margin, y);
  
  // Subheadline
  y += 12;
  doc.setFont(FONT_FAMILY, 'normal');
  doc.setFontSize(10);
  doc.setTextColor(COLORS.white.r, COLORS.white.g, COLORS.white.b);
  const subtext = 'Dein lokales Bonusprogramm – beim Radiohören Punkte sammeln und bei deinen Lieblings-Cafés, Restaurants & Shops einlösen.';
  const subtextLines = doc.splitTextToSize(subtext, contentWidth);
  doc.text(subtextLines, margin, y);
  
  // Feature boxes with icons
  y += 24;
  const boxHeight = 20;
  const boxSpacing = 4;
  
  const features: Array<{ icon: 'radio' | 'coin' | 'gift'; title: string; desc: string }> = [
    { icon: 'radio', title: 'Hören', desc: 'Starte den Livestream und sammle automatisch Taler' },
    { icon: 'coin', title: 'Sammeln', desc: 'Je länger du hörst, desto mehr verdienst du' },
    { icon: 'gift', title: 'Einlösen', desc: 'Rabatte & Gratis-Goodies bei lokalen Partnern' },
  ];
  
  features.forEach((feature, index) => {
    const boxY = y + (index * (boxHeight + boxSpacing));
    
    // Box with gold border (white with low opacity simulated with light petrol)
    doc.setFillColor(20, 85, 95); // Slightly lighter petrol for box bg
    doc.roundedRect(margin, boxY, contentWidth, boxHeight, 3, 3, 'F');
    
    doc.setDrawColor(COLORS.gold.r, COLORS.gold.g, COLORS.gold.b);
    doc.setLineWidth(0.4);
    doc.roundedRect(margin, boxY, contentWidth, boxHeight, 3, 3, 'S');
    
    // Icon circle
    const iconX = margin + 10;
    const iconY = boxY + boxHeight / 2;
    doc.setFillColor(COLORS.gold.r, COLORS.gold.g, COLORS.gold.b);
    doc.circle(iconX, iconY, 5, 'F');
    
    // Draw icon
    drawIcon(doc, feature.icon, iconX, iconY, 8, COLORS.petrol);
    
    // Feature text
    doc.setFont(FONT_FAMILY, 'bold');
    doc.setFontSize(10);
    doc.setTextColor(COLORS.white.r, COLORS.white.g, COLORS.white.b);
    doc.text(feature.title, margin + 20, boxY + 7);
    
    doc.setFont(FONT_FAMILY, 'normal');
    doc.setFontSize(8);
    doc.setTextColor(220, 220, 220);
    doc.text(feature.desc, margin + 20, boxY + 14);
  });
  
  // CTA Box
  y += (features.length * (boxHeight + boxSpacing)) + 10;
  
  doc.setFillColor(COLORS.gold.r, COLORS.gold.g, COLORS.gold.b);
  doc.roundedRect(margin, y, contentWidth, 24, 4, 4, 'F');
  
  doc.setFont(FONT_FAMILY, 'bold');
  doc.setFontSize(12);
  doc.setTextColor(COLORS.petrol.r, COLORS.petrol.g, COLORS.petrol.b);
  doc.text('JETZT KOSTENLOS STARTEN', pageWidth / 2, y + 10, { align: 'center' });
  
  doc.setFont(FONT_FAMILY, 'normal');
  doc.setFontSize(10);
  doc.text(APP_URL, pageWidth / 2, y + 18, { align: 'center' });
  
  // QR Code
  y += 30;
  drawQRPlaceholder(doc, pageWidth / 2, y, 32, APP_URL, 'App herunterladen');
  
  // Footer
  doc.setFont(FONT_FAMILY, 'normal');
  doc.setFontSize(8);
  doc.setTextColor(180, 180, 180);
  doc.text('Keine Karte. Keine Stempel. Kein Stress.', pageWidth / 2, pageHeight - 8, { align: 'center' });
  
  // ============================================
  // PAGE 2: PARTNER (Back) - White Background
  // ============================================
  doc.addPage();
  
  // White background
  doc.setFillColor(COLORS.white.r, COLORS.white.g, COLORS.white.b);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  
  // Petrol header
  doc.setFillColor(COLORS.petrol.r, COLORS.petrol.g, COLORS.petrol.b);
  doc.rect(0, 0, pageWidth, 38, 'F');
  
  // Gold line
  doc.setFillColor(COLORS.gold.r, COLORS.gold.g, COLORS.gold.b);
  doc.rect(0, 38, pageWidth, 3, 'F');
  
  // Header content
  doc.setFont(FONT_FAMILY, 'bold');
  doc.setFontSize(9);
  doc.setTextColor(COLORS.gold.r, COLORS.gold.g, COLORS.gold.b);
  doc.text('FÜR PARTNER & GASTRONOMEN', pageWidth / 2, 12, { align: 'center' });
  
  doc.setFontSize(15);
  doc.setTextColor(COLORS.white.r, COLORS.white.g, COLORS.white.b);
  doc.text('Mehr Stammkunden.', pageWidth / 2, 24, { align: 'center' });
  doc.text('Bessere Bewertungen.', pageWidth / 2, 33, { align: 'center' });
  
  // Intro
  y = 50;
  doc.setFont(FONT_FAMILY, 'normal');
  doc.setFontSize(9);
  doc.setTextColor(COLORS.dark.r, COLORS.dark.g, COLORS.dark.b);
  const introText = 'Wussten Sie, dass 70% der Neukunden nie wiederkommen? Mit der My 2Go App ändern Sie das – ganz ohne Aufwand.';
  const introLines = doc.splitTextToSize(introText, contentWidth);
  doc.text(introLines, margin, y);
  
  // So funktioniert's
  y += 16;
  doc.setFont(FONT_FAMILY, 'bold');
  doc.setFontSize(10);
  doc.setTextColor(COLORS.petrol.r, COLORS.petrol.g, COLORS.petrol.b);
  doc.text('SO FUNKTIONIERT ES:', margin, y);
  
  y += 6;
  const steps = [
    '1. Kunden hören Radio 2Go und sammeln automatisch Taler',
    '2. Sie bieten Prämien – z.B. 10% Rabatt oder Gratis-Getränk',
    '3. Kunden lösen bei Ihnen ein – und kommen wieder',
  ];
  
  doc.setFont(FONT_FAMILY, 'normal');
  doc.setFontSize(8);
  doc.setTextColor(COLORS.dark.r, COLORS.dark.g, COLORS.dark.b);
  
  steps.forEach((step, index) => {
    doc.text(step, margin, y + (index * 5));
  });
  
  // Benefits section
  y += 22;
  doc.setFont(FONT_FAMILY, 'bold');
  doc.setFontSize(10);
  doc.setTextColor(COLORS.petrol.r, COLORS.petrol.g, COLORS.petrol.b);
  doc.text('IHRE VORTEILE:', margin, y);
  
  y += 6;
  const benefits = [
    { icon: 'check' as const, text: 'Mehr Stammkunden – Taler-System bringt Kunden zurück' },
    { icon: 'star' as const, text: 'Bessere Google-Bewertungen – automatische Review-Anfragen' },
    { icon: 'radio' as const, text: 'Radio-Präsenz – Ihr Name im Radio, ohne Werbebudget' },
    { icon: 'chart' as const, text: 'Live-Dashboard – Scans, Einlösungen & Reviews im Blick' },
    { icon: 'gift' as const, text: 'Alles inklusive – QR-Steller, Aufkleber, Onboarding' },
  ];
  
  doc.setFont(FONT_FAMILY, 'normal');
  doc.setFontSize(8);
  doc.setTextColor(COLORS.dark.r, COLORS.dark.g, COLORS.dark.b);
  
  benefits.forEach((benefit, index) => {
    const benefitY = y + (index * 6);
    
    // Draw small icon
    doc.setFillColor(COLORS.gold.r, COLORS.gold.g, COLORS.gold.b);
    doc.circle(margin + 2, benefitY - 1, 2, 'F');
    
    drawIcon(doc, benefit.icon, margin + 2, benefitY - 1, 4, COLORS.petrol);
    
    doc.text(benefit.text, margin + 7, benefitY);
  });
  
  // Stats box
  y += 36;
  doc.setFillColor(COLORS.lightGray.r, COLORS.lightGray.g, COLORS.lightGray.b);
  doc.roundedRect(margin, y, contentWidth, 20, 3, 3, 'F');
  
  const stats = [
    { value: '12.400+', label: 'Nutzer' },
    { value: '47', label: 'Partner' },
    { value: '4.8★', label: 'Bewertung' },
  ];
  
  const statWidth = contentWidth / 3;
  stats.forEach((stat, index) => {
    const statX = margin + (index * statWidth) + (statWidth / 2);
    doc.setFont(FONT_FAMILY, 'bold');
    doc.setFontSize(12);
    doc.setTextColor(COLORS.petrol.r, COLORS.petrol.g, COLORS.petrol.b);
    doc.text(stat.value, statX, y + 8, { align: 'center' });
    
    doc.setFont(FONT_FAMILY, 'normal');
    doc.setFontSize(7);
    doc.setTextColor(COLORS.mediumGray.r, COLORS.mediumGray.g, COLORS.mediumGray.b);
    doc.text(stat.label, statX, y + 15, { align: 'center' });
  });
  
  // Pricing
  y += 26;
  doc.setFillColor(COLORS.petrol.r, COLORS.petrol.g, COLORS.petrol.b);
  doc.roundedRect(margin, y, contentWidth, 28, 4, 4, 'F');
  
  doc.setFont(FONT_FAMILY, 'bold');
  doc.setFontSize(8);
  doc.setTextColor(COLORS.gold.r, COLORS.gold.g, COLORS.gold.b);
  doc.text('KOSTENLOS STARTEN', pageWidth / 2, y + 6, { align: 'center' });
  
  doc.setFont(FONT_FAMILY, 'bold');
  doc.setFontSize(14);
  doc.setTextColor(COLORS.white.r, COLORS.white.g, COLORS.white.b);
  doc.text('Starter ab CHF 0/Mt.', pageWidth / 2, y + 14, { align: 'center' });
  
  doc.setFont(FONT_FAMILY, 'normal');
  doc.setFontSize(9);
  doc.text('Partner ab CHF 249/Mt. (exkl. MwSt.) • 30 Tage Geld-zurück', pageWidth / 2, y + 22, { align: 'center' });
  
  // CTA Button
  y += 34;
  doc.setFillColor(COLORS.gold.r, COLORS.gold.g, COLORS.gold.b);
  doc.roundedRect(margin, y, contentWidth, 18, 4, 4, 'F');
  
  doc.setFont(FONT_FAMILY, 'bold');
  doc.setFontSize(11);
  doc.setTextColor(COLORS.petrol.r, COLORS.petrol.g, COLORS.petrol.b);
  doc.text('JETZT PARTNER WERDEN →', pageWidth / 2, y + 11, { align: 'center' });
  
  // QR Code
  y += 24;
  drawQRPlaceholder(doc, pageWidth / 2, y, 28, PARTNER_URL, 'Partner werden');
  
  // Footer with links
  doc.setFont(FONT_FAMILY, 'normal');
  doc.setFontSize(7);
  doc.setTextColor(COLORS.mediumGray.r, COLORS.mediumGray.g, COLORS.mediumGray.b);
  doc.text('Fragen? partner@radio2go.ch • ' + APP_URL, pageWidth / 2, pageHeight - 6, { align: 'center' });
  
  // Save the PDF
  const date = new Date().toISOString().split('T')[0];
  doc.save(`Radio2Go_Flyer_${date}.pdf`);
}