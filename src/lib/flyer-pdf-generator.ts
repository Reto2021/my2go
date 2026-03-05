import jsPDF from 'jspdf';

// Brand Colors - Radio 2Go
const COLORS = {
  petrol: { r: 12, g: 74, b: 86 },      // #0C4A56
  gold: { r: 247, g: 181, b: 0 },        // #F7B500
  white: { r: 255, g: 255, b: 255 },
  dark: { r: 30, g: 30, b: 30 },
  lightGray: { r: 245, g: 245, b: 245 },
  mediumGray: { r: 120, g: 120, b: 120 },
  lightPetrol: { r: 20, g: 85, b: 95 },
};

const FONT_FAMILY = 'helvetica';
const APP_URL = 'www.my2go.app';
const PARTNER_URL = 'www.my2go.app/go';

// Helper to draw a simple icon using basic shapes
function drawIcon(doc: jsPDF, type: 'radio' | 'coin' | 'gift' | 'check' | 'star' | 'chart', x: number, y: number, size: number, color: { r: number; g: number; b: number }) {
  doc.setDrawColor(color.r, color.g, color.b);
  doc.setFillColor(color.r, color.g, color.b);
  doc.setLineWidth(0.5);
  
  switch (type) {
    case 'radio':
      doc.circle(x, y, size * 0.4, 'S');
      doc.setLineWidth(1);
      doc.line(x - size * 0.3, y - size * 0.1, x - size * 0.3, y + size * 0.3);
      doc.line(x + size * 0.3, y - size * 0.1, x + size * 0.3, y + size * 0.3);
      break;
    case 'coin':
      doc.circle(x, y, size * 0.4, 'F');
      doc.setTextColor(COLORS.petrol.r, COLORS.petrol.g, COLORS.petrol.b);
      doc.setFontSize(size * 0.5);
      doc.setFont(FONT_FAMILY, 'bold');
      doc.text('T', x, y + size * 0.15, { align: 'center' });
      break;
    case 'gift':
      doc.rect(x - size * 0.3, y - size * 0.1, size * 0.6, size * 0.5, 'F');
      doc.rect(x - size * 0.35, y - size * 0.25, size * 0.7, size * 0.2, 'F');
      doc.setDrawColor(COLORS.white.r, COLORS.white.g, COLORS.white.b);
      doc.setLineWidth(0.4);
      doc.line(x, y - size * 0.25, x, y + size * 0.4);
      break;
    case 'check':
      doc.setLineWidth(0.8);
      doc.line(x - size * 0.25, y, x - size * 0.05, y + size * 0.2);
      doc.line(x - size * 0.05, y + size * 0.2, x + size * 0.3, y - size * 0.2);
      break;
    case 'star':
      const starPoints = 5;
      for (let i = 0; i < starPoints; i++) {
        const angle = (i * 2 * Math.PI / starPoints) - Math.PI / 2;
        doc.line(x, y, x + Math.cos(angle) * size * 0.35, y + Math.sin(angle) * size * 0.35);
      }
      break;
    case 'chart':
      doc.rect(x - size * 0.3, y + size * 0.1, size * 0.15, size * 0.3, 'F');
      doc.rect(x - size * 0.1, y - size * 0.1, size * 0.15, size * 0.5, 'F');
      doc.rect(x + size * 0.1, y - size * 0.3, size * 0.15, size * 0.7, 'F');
      break;
  }
}

// Helper to draw QR code placeholder
function drawQRPlaceholder(doc: jsPDF, x: number, y: number, size: number, url: string, label: string) {
  doc.setFillColor(COLORS.white.r, COLORS.white.g, COLORS.white.b);
  doc.setDrawColor(COLORS.petrol.r, COLORS.petrol.g, COLORS.petrol.b);
  doc.setLineWidth(0.3);
  doc.roundedRect(x - size / 2, y, size, size, 2, 2, 'FD');
  
  const gridSize = size / 7;
  const startX = x - size / 2 + gridSize;
  const startY = y + gridSize;
  
  doc.setFillColor(COLORS.petrol.r, COLORS.petrol.g, COLORS.petrol.b);
  doc.rect(startX, startY, gridSize * 2, gridSize * 2, 'F');
  doc.rect(startX + gridSize * 3, startY, gridSize * 2, gridSize * 2, 'F');
  doc.rect(startX, startY + gridSize * 3, gridSize * 2, gridSize * 2, 'F');
  doc.rect(startX + gridSize * 2, startY + gridSize * 2, gridSize, gridSize, 'F');
  
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
  
  doc.setFillColor(COLORS.white.r, COLORS.white.g, COLORS.white.b);
  doc.roundedRect(x, y, width, height, height / 2, height / 2, 'F');
  
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
    format: 'a5',
  });

  const pageWidth = 148;
  const pageHeight = 210;
  const margin = 12;
  const contentWidth = pageWidth - (margin * 2);

  // ============================================
  // PAGE 1: ENDKUNDEN (Front) - Petrol Background
  // ============================================
  
  doc.setFillColor(COLORS.petrol.r, COLORS.petrol.g, COLORS.petrol.b);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  
  // Gold accent bar at top
  doc.setFillColor(COLORS.gold.r, COLORS.gold.g, COLORS.gold.b);
  doc.rect(0, 0, pageWidth, 5, 'F');
  
  // Logo
  drawLogo(doc, margin, 12, 44);
  
  // Main Headline
  let y = 40;
  doc.setFont(FONT_FAMILY, 'bold');
  doc.setFontSize(24);
  doc.setTextColor(COLORS.white.r, COLORS.white.g, COLORS.white.b);
  doc.text('Lokal einkaufen.', margin, y);
  
  y += 10;
  doc.text('Taler sammeln.', margin, y);
  
  y += 10;
  doc.setTextColor(COLORS.gold.r, COLORS.gold.g, COLORS.gold.b);
  doc.text('Prämien geniessen.', margin, y);
  
  // Subheadline
  y += 10;
  doc.setFont(FONT_FAMILY, 'normal');
  doc.setFontSize(9);
  doc.setTextColor(COLORS.white.r, COLORS.white.g, COLORS.white.b);
  const subtext = 'Dein lokaler Alltags-Begleiter – bei Partnern Taler sammeln und für Gutscheine bei Cafés, Restaurants & Shops einlösen.';
  const subtextLines = doc.splitTextToSize(subtext, contentWidth);
  doc.text(subtextLines, margin, y);
  
  // Feature boxes
  y += 20;
  const boxHeight = 18;
  const boxSpacing = 3;
  
  const features = [
    { icon: 'radio' as const, title: 'Hören', desc: 'Starte den Livestream und sammle automatisch Taler' },
    { icon: 'coin' as const, title: 'Sammeln', desc: 'Je länger du hörst, desto mehr verdienst du' },
    { icon: 'gift' as const, title: 'Einlösen', desc: 'Rabatte & Gratis-Goodies bei lokalen Partnern' },
  ];
  
  features.forEach((feature, index) => {
    const boxY = y + (index * (boxHeight + boxSpacing));
    
    doc.setFillColor(COLORS.lightPetrol.r, COLORS.lightPetrol.g, COLORS.lightPetrol.b);
    doc.roundedRect(margin, boxY, contentWidth, boxHeight, 3, 3, 'F');
    
    doc.setDrawColor(COLORS.gold.r, COLORS.gold.g, COLORS.gold.b);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, boxY, contentWidth, boxHeight, 3, 3, 'S');
    
    const iconX = margin + 9;
    const iconY = boxY + boxHeight / 2;
    doc.setFillColor(COLORS.gold.r, COLORS.gold.g, COLORS.gold.b);
    doc.circle(iconX, iconY, 4.5, 'F');
    drawIcon(doc, feature.icon, iconX, iconY, 7, COLORS.petrol);
    
    doc.setFont(FONT_FAMILY, 'bold');
    doc.setFontSize(9);
    doc.setTextColor(COLORS.white.r, COLORS.white.g, COLORS.white.b);
    doc.text(feature.title, margin + 18, boxY + 6);
    
    doc.setFont(FONT_FAMILY, 'normal');
    doc.setFontSize(7);
    doc.setTextColor(220, 220, 220);
    doc.text(feature.desc, margin + 18, boxY + 12);
  });
  
  // CTA Box
  y += (features.length * (boxHeight + boxSpacing)) + 8;
  
  doc.setFillColor(COLORS.gold.r, COLORS.gold.g, COLORS.gold.b);
  doc.roundedRect(margin, y, contentWidth, 22, 4, 4, 'F');
  
  doc.setFont(FONT_FAMILY, 'bold');
  doc.setFontSize(11);
  doc.setTextColor(COLORS.petrol.r, COLORS.petrol.g, COLORS.petrol.b);
  doc.text('JETZT KOSTENLOS STARTEN', pageWidth / 2, y + 9, { align: 'center' });
  
  doc.setFont(FONT_FAMILY, 'normal');
  doc.setFontSize(9);
  doc.text(APP_URL, pageWidth / 2, y + 16, { align: 'center' });
  
  // QR Code
  y += 28;
  drawQRPlaceholder(doc, pageWidth / 2, y, 30, APP_URL, 'App herunterladen');
  
  // Footer
  doc.setFont(FONT_FAMILY, 'normal');
  doc.setFontSize(7);
  doc.setTextColor(180, 180, 180);
  doc.text('Keine Karte. Keine Stempel. Kein Stress.', pageWidth / 2, pageHeight - 8, { align: 'center' });
  
  // ============================================
  // PAGE 2: PARTNER (Back) - White Background
  // ============================================
  doc.addPage();
  
  doc.setFillColor(COLORS.white.r, COLORS.white.g, COLORS.white.b);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  
  // Petrol header
  doc.setFillColor(COLORS.petrol.r, COLORS.petrol.g, COLORS.petrol.b);
  doc.rect(0, 0, pageWidth, 36, 'F');
  
  // Gold line
  doc.setFillColor(COLORS.gold.r, COLORS.gold.g, COLORS.gold.b);
  doc.rect(0, 36, pageWidth, 2, 'F');
  
  // Header content
  doc.setFont(FONT_FAMILY, 'bold');
  doc.setFontSize(8);
  doc.setTextColor(COLORS.gold.r, COLORS.gold.g, COLORS.gold.b);
  doc.text('FÜR PARTNER & GASTRONOMEN', pageWidth / 2, 11, { align: 'center' });
  
  doc.setFontSize(14);
  doc.setTextColor(COLORS.white.r, COLORS.white.g, COLORS.white.b);
  doc.text('Mehr Stammkunden.', pageWidth / 2, 22, { align: 'center' });
  doc.text('Bessere Bewertungen.', pageWidth / 2, 31, { align: 'center' });
  
  // Intro
  y = 46;
  doc.setFont(FONT_FAMILY, 'normal');
  doc.setFontSize(8);
  doc.setTextColor(COLORS.dark.r, COLORS.dark.g, COLORS.dark.b);
  const introText = 'Wussten Sie, dass 70% der Neukunden nie wiederkommen? Mit der My 2Go App ändern Sie das – ganz ohne Aufwand.';
  const introLines = doc.splitTextToSize(introText, contentWidth);
  doc.text(introLines, margin, y);
  
  // So funktioniert's
  y += 14;
  doc.setFont(FONT_FAMILY, 'bold');
  doc.setFontSize(9);
  doc.setTextColor(COLORS.petrol.r, COLORS.petrol.g, COLORS.petrol.b);
  doc.text('SO FUNKTIONIERT ES:', margin, y);
  
  y += 5;
  const steps = [
    '1. Kunden hören Radio 2Go und sammeln automatisch Taler',
    '2. Sie bieten Prämien – z.B. 10% Rabatt oder Gratis-Getränk',
    '3. Kunden lösen bei Ihnen ein – und kommen wieder',
  ];
  
  doc.setFont(FONT_FAMILY, 'normal');
  doc.setFontSize(7);
  doc.setTextColor(COLORS.dark.r, COLORS.dark.g, COLORS.dark.b);
  
  steps.forEach((step, index) => {
    doc.text(step, margin, y + (index * 4.5));
  });
  
  // Benefits section
  y += 19;
  doc.setFont(FONT_FAMILY, 'bold');
  doc.setFontSize(9);
  doc.setTextColor(COLORS.petrol.r, COLORS.petrol.g, COLORS.petrol.b);
  doc.text('IHRE VORTEILE:', margin, y);
  
  y += 5;
  const benefits = [
    { icon: 'check' as const, text: 'Mehr Stammkunden – Taler-System bringt Kunden zurück' },
    { icon: 'star' as const, text: 'Bessere Google-Bewertungen – automatische Review-Anfragen' },
    { icon: 'radio' as const, text: 'Radio-Präsenz – Ihr Name im Radio, ohne Werbebudget' },
    { icon: 'chart' as const, text: 'Live-Dashboard – Scans, Einlösungen & Reviews im Blick' },
    { icon: 'gift' as const, text: 'Alles inklusive – QR-Steller, Aufkleber, Onboarding' },
  ];
  
  doc.setFont(FONT_FAMILY, 'normal');
  doc.setFontSize(7);
  doc.setTextColor(COLORS.dark.r, COLORS.dark.g, COLORS.dark.b);
  
  benefits.forEach((benefit, index) => {
    const benefitY = y + (index * 5.5);
    
    doc.setFillColor(COLORS.gold.r, COLORS.gold.g, COLORS.gold.b);
    doc.circle(margin + 2, benefitY - 1, 1.8, 'F');
    drawIcon(doc, benefit.icon, margin + 2, benefitY - 1, 3.5, COLORS.petrol);
    
    doc.text(benefit.text, margin + 7, benefitY);
  });
  
  // Stats box
  y += 33;
  doc.setFillColor(COLORS.lightGray.r, COLORS.lightGray.g, COLORS.lightGray.b);
  doc.roundedRect(margin, y, contentWidth, 18, 3, 3, 'F');
  
  const stats = [
    { value: '12.400+', label: 'Nutzer' },
    { value: '47', label: 'Partner' },
    { value: '4.8★', label: 'Bewertung' },
  ];
  
  const statWidth = contentWidth / 3;
  stats.forEach((stat, index) => {
    const statX = margin + (index * statWidth) + (statWidth / 2);
    doc.setFont(FONT_FAMILY, 'bold');
    doc.setFontSize(11);
    doc.setTextColor(COLORS.petrol.r, COLORS.petrol.g, COLORS.petrol.b);
    doc.text(stat.value, statX, y + 7, { align: 'center' });
    
    doc.setFont(FONT_FAMILY, 'normal');
    doc.setFontSize(6);
    doc.setTextColor(COLORS.mediumGray.r, COLORS.mediumGray.g, COLORS.mediumGray.b);
    doc.text(stat.label, statX, y + 13, { align: 'center' });
  });
  
  // Pricing
  y += 24;
  doc.setFillColor(COLORS.petrol.r, COLORS.petrol.g, COLORS.petrol.b);
  doc.roundedRect(margin, y, contentWidth, 26, 4, 4, 'F');
  
  doc.setFont(FONT_FAMILY, 'bold');
  doc.setFontSize(7);
  doc.setTextColor(COLORS.gold.r, COLORS.gold.g, COLORS.gold.b);
  doc.text('KOSTENLOS STARTEN', pageWidth / 2, y + 5, { align: 'center' });
  
  doc.setFont(FONT_FAMILY, 'bold');
  doc.setFontSize(12);
  doc.setTextColor(COLORS.white.r, COLORS.white.g, COLORS.white.b);
  doc.text('Starter ab CHF 0/Mt.', pageWidth / 2, y + 13, { align: 'center' });
  
  doc.setFont(FONT_FAMILY, 'normal');
  doc.setFontSize(8);
  doc.text('Partner ab CHF 249/Mt. (exkl. MwSt.)', pageWidth / 2, y + 20, { align: 'center' });
  
  // CTA Button
  y += 32;
  doc.setFillColor(COLORS.gold.r, COLORS.gold.g, COLORS.gold.b);
  doc.roundedRect(margin, y, contentWidth, 16, 4, 4, 'F');
  
  doc.setFont(FONT_FAMILY, 'bold');
  doc.setFontSize(10);
  doc.setTextColor(COLORS.petrol.r, COLORS.petrol.g, COLORS.petrol.b);
  doc.text('JETZT PARTNER WERDEN →', pageWidth / 2, y + 10, { align: 'center' });
  
  // QR Code
  y += 22;
  drawQRPlaceholder(doc, pageWidth / 2, y, 26, PARTNER_URL, 'Partner werden');
  
  // Footer
  doc.setFont(FONT_FAMILY, 'normal');
  doc.setFontSize(7);
  doc.setTextColor(COLORS.mediumGray.r, COLORS.mediumGray.g, COLORS.mediumGray.b);
  doc.text('Fragen? partner@radio2go.ch • ' + APP_URL, pageWidth / 2, pageHeight - 6, { align: 'center' });
  
  // Save
  const date = new Date().toISOString().split('T')[0];
  doc.save(`Radio2Go_Flyer_${date}.pdf`);
}
