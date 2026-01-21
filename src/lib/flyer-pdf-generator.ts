import jsPDF from 'jspdf';

// Brand Colors
const COLORS = {
  petrol: { r: 12, g: 74, b: 86 },      // #0C4A56
  gold: { r: 247, g: 181, b: 0 },        // #F7B500
  white: { r: 255, g: 255, b: 255 },
  dark: { r: 30, g: 30, b: 30 },
  lightGray: { r: 245, g: 245, b: 245 },
  mediumGray: { r: 120, g: 120, b: 120 },
};

export function generateMarketingFlyer(): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a5', // 148 x 210 mm - compact flyer format
  });

  const pageWidth = 148;
  const pageHeight = 210;
  const margin = 12;
  const contentWidth = pageWidth - (margin * 2);

  // ============================================
  // PAGE 1: USER / ENDKUNDEN (Front)
  // ============================================
  
  // Background gradient effect (petrol)
  doc.setFillColor(COLORS.petrol.r, COLORS.petrol.g, COLORS.petrol.b);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  
  // Decorative gold accent bar at top
  doc.setFillColor(COLORS.gold.r, COLORS.gold.g, COLORS.gold.b);
  doc.rect(0, 0, pageWidth, 8, 'F');
  
  // Logo area placeholder
  doc.setFillColor(COLORS.white.r, COLORS.white.g, COLORS.white.b);
  doc.roundedRect(margin, 18, 40, 16, 3, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(COLORS.petrol.r, COLORS.petrol.g, COLORS.petrol.b);
  doc.text('Radio 2Go', margin + 4, 28);
  
  // Main Headline
  let y = 50;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(COLORS.white.r, COLORS.white.g, COLORS.white.b);
  doc.text('Hör Radio.', margin, y);
  y += 12;
  doc.text('Sammle Taler.', margin, y);
  y += 12;
  doc.setTextColor(COLORS.gold.r, COLORS.gold.g, COLORS.gold.b);
  doc.text('Geniess vor Ort.', margin, y);
  
  // Subheadline
  y += 14;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(COLORS.white.r, COLORS.white.g, COLORS.white.b);
  const subtext = 'Dein lokales Bonusprogramm – einfach beim Radiohören Punkte sammeln und bei deinen Lieblings-Cafés, Restaurants & Shops einlösen.';
  const subtextLines = doc.splitTextToSize(subtext, contentWidth);
  doc.text(subtextLines, margin, y);
  
  // Feature boxes
  y += 28;
  const boxHeight = 22;
  const boxSpacing = 4;
  
  const features = [
    { icon: '🎧', title: 'Hören', desc: 'Starte den Livestream und sammle automatisch Taler' },
    { icon: '💰', title: 'Sammeln', desc: 'Je länger du hörst, desto mehr verdienst du' },
    { icon: '🎁', title: 'Einlösen', desc: 'Rabatte & Gratis-Goodies bei lokalen Partnern' },
  ];
  
  features.forEach((feature, index) => {
    const boxY = y + (index * (boxHeight + boxSpacing));
    
    // Box background
    doc.setFillColor(255, 255, 255, 0.1);
    doc.setDrawColor(COLORS.gold.r, COLORS.gold.g, COLORS.gold.b);
    doc.setLineWidth(0.5);
    doc.roundedRect(margin, boxY, contentWidth, boxHeight, 3, 3, 'FD');
    
    // Icon circle
    doc.setFillColor(COLORS.gold.r, COLORS.gold.g, COLORS.gold.b);
    doc.circle(margin + 10, boxY + boxHeight/2, 6, 'F');
    
    // Feature text
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(COLORS.white.r, COLORS.white.g, COLORS.white.b);
    doc.text(feature.title, margin + 20, boxY + 8);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(220, 220, 220);
    doc.text(feature.desc, margin + 20, boxY + 15);
  });
  
  // CTA Section
  y += (features.length * (boxHeight + boxSpacing)) + 12;
  
  // CTA Box
  doc.setFillColor(COLORS.gold.r, COLORS.gold.g, COLORS.gold.b);
  doc.roundedRect(margin, y, contentWidth, 28, 4, 4, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(COLORS.petrol.r, COLORS.petrol.g, COLORS.petrol.b);
  doc.text('JETZT STARTEN', pageWidth / 2, y + 10, { align: 'center' });
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text('my2go.lovable.app', pageWidth / 2, y + 20, { align: 'center' });
  
  // QR Code placeholder
  y += 36;
  doc.setFillColor(COLORS.white.r, COLORS.white.g, COLORS.white.b);
  doc.roundedRect(pageWidth/2 - 18, y, 36, 36, 2, 2, 'F');
  doc.setFontSize(8);
  doc.setTextColor(COLORS.mediumGray.r, COLORS.mediumGray.g, COLORS.mediumGray.b);
  doc.text('QR-Code', pageWidth/2, y + 20, { align: 'center' });
  doc.text('einfügen', pageWidth/2, y + 26, { align: 'center' });
  
  // Footer
  doc.setFontSize(8);
  doc.setTextColor(180, 180, 180);
  doc.text('Keine Karte. Keine Stempel. Kein Stress.', pageWidth / 2, pageHeight - 10, { align: 'center' });
  
  // ============================================
  // PAGE 2: PARTNER (Back)
  // ============================================
  doc.addPage();
  
  // White background with petrol accents
  doc.setFillColor(COLORS.white.r, COLORS.white.g, COLORS.white.b);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  
  // Petrol header bar
  doc.setFillColor(COLORS.petrol.r, COLORS.petrol.g, COLORS.petrol.b);
  doc.rect(0, 0, pageWidth, 35, 'F');
  
  // Gold accent line
  doc.setFillColor(COLORS.gold.r, COLORS.gold.g, COLORS.gold.b);
  doc.rect(0, 35, pageWidth, 3, 'F');
  
  // Header text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(COLORS.gold.r, COLORS.gold.g, COLORS.gold.b);
  doc.text('FÜR PARTNER & GASTRONOMEN', pageWidth / 2, 12, { align: 'center' });
  
  doc.setFontSize(16);
  doc.setTextColor(COLORS.white.r, COLORS.white.g, COLORS.white.b);
  doc.text('Mehr Laufkundschaft.', pageWidth / 2, 23, { align: 'center' });
  doc.text('Weniger Aufwand.', pageWidth / 2, 31, { align: 'center' });
  
  // Main content
  y = 48;
  
  // Intro text
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(COLORS.dark.r, COLORS.dark.g, COLORS.dark.b);
  const introText = 'Werden Sie Teil von Radio 2Go – dem lokalen Bonusprogramm, das Kunden direkt zu Ihnen führt. Ohne Aufwand, ohne Risiko.';
  const introLines = doc.splitTextToSize(introText, contentWidth);
  doc.text(introLines, margin, y);
  
  // Benefits section
  y += 18;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(COLORS.petrol.r, COLORS.petrol.g, COLORS.petrol.b);
  doc.text('IHRE VORTEILE', margin, y);
  
  y += 8;
  const benefits = [
    '✓ Mehr Stammkunden – Kunden sammeln und kommen wieder',
    '✓ Bessere Google-Bewertungen automatisch',
    '✓ Radio-Präsenz ohne eigenes Werbebudget',
    '✓ Live-Dashboard mit Analysen & Statistiken',
    '✓ Alles inklusive: QR-Steller, Aufkleber, Onboarding',
  ];
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(COLORS.dark.r, COLORS.dark.g, COLORS.dark.b);
  
  benefits.forEach((benefit, index) => {
    doc.text(benefit, margin, y + (index * 7));
  });
  
  // Stats box
  y += 44;
  doc.setFillColor(COLORS.lightGray.r, COLORS.lightGray.g, COLORS.lightGray.b);
  doc.roundedRect(margin, y, contentWidth, 24, 3, 3, 'F');
  
  const stats = [
    { value: '12.400+', label: 'Nutzer' },
    { value: '47', label: 'Partner' },
    { value: '4.8★', label: 'Bewertung' },
  ];
  
  const statWidth = contentWidth / 3;
  stats.forEach((stat, index) => {
    const statX = margin + (index * statWidth) + (statWidth / 2);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(COLORS.petrol.r, COLORS.petrol.g, COLORS.petrol.b);
    doc.text(stat.value, statX, y + 10, { align: 'center' });
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(COLORS.mediumGray.r, COLORS.mediumGray.g, COLORS.mediumGray.b);
    doc.text(stat.label, statX, y + 18, { align: 'center' });
  });
  
  // Pricing teaser
  y += 32;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(COLORS.petrol.r, COLORS.petrol.g, COLORS.petrol.b);
  doc.text('30 TAGE KOSTENLOS TESTEN', margin, y);
  
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(COLORS.dark.r, COLORS.dark.g, COLORS.dark.b);
  doc.text('Ab CHF 249/Monat • 30 Tage Geld-zurück-Garantie', margin, y);
  
  // CTA Section
  y += 14;
  doc.setFillColor(COLORS.petrol.r, COLORS.petrol.g, COLORS.petrol.b);
  doc.roundedRect(margin, y, contentWidth, 26, 4, 4, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(COLORS.gold.r, COLORS.gold.g, COLORS.gold.b);
  doc.text('JETZT PARTNER WERDEN', pageWidth / 2, y + 9, { align: 'center' });
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(COLORS.white.r, COLORS.white.g, COLORS.white.b);
  doc.text('my2go.lovable.app/go', pageWidth / 2, y + 19, { align: 'center' });
  
  // QR Code placeholder
  y += 32;
  doc.setFillColor(COLORS.white.r, COLORS.white.g, COLORS.white.b);
  doc.setDrawColor(COLORS.petrol.r, COLORS.petrol.g, COLORS.petrol.b);
  doc.setLineWidth(0.5);
  doc.roundedRect(pageWidth/2 - 16, y, 32, 32, 2, 2, 'FD');
  doc.setFontSize(7);
  doc.setTextColor(COLORS.mediumGray.r, COLORS.mediumGray.g, COLORS.mediumGray.b);
  doc.text('QR-Code', pageWidth/2, y + 14, { align: 'center' });
  doc.text('einfügen', pageWidth/2, y + 20, { align: 'center' });
  
  // Footer
  doc.setFontSize(8);
  doc.setTextColor(COLORS.mediumGray.r, COLORS.mediumGray.g, COLORS.mediumGray.b);
  doc.text('Fragen? partner@radio2go.ch', pageWidth / 2, pageHeight - 10, { align: 'center' });
  
  // Save the PDF
  const date = new Date().toISOString().split('T')[0];
  doc.save(`Radio2Go_Flyer_${date}.pdf`);
}
