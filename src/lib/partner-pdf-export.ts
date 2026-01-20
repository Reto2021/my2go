/**
 * Partner Dashboard PDF Export Utility
 * Generates professional PDF reports for partners
 */

import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import type { PartnerStats, DailyStats } from './partner-helpers';

interface PartnerReportData {
  partnerName: string;
  stats: PartnerStats;
  dailyStats: DailyStats[];
  periodLabel: string;
}

export function generatePartnerReport(data: PartnerReportData): void {
  const { partnerName, stats, dailyStats, periodLabel } = data;
  const doc = new jsPDF();
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  let y = margin;
  
  // Helper functions
  const addText = (text: string, x: number, yPos: number, options?: { fontSize?: number; fontStyle?: 'normal' | 'bold'; color?: [number, number, number] }) => {
    doc.setFontSize(options?.fontSize || 12);
    doc.setFont('helvetica', options?.fontStyle || 'normal');
    if (options?.color) {
      doc.setTextColor(options.color[0], options.color[1], options.color[2]);
    } else {
      doc.setTextColor(0, 0, 0);
    }
    doc.text(text, x, yPos);
  };
  
  const addLine = (yPos: number) => {
    doc.setDrawColor(220, 220, 220);
    doc.line(margin, yPos, pageWidth - margin, yPos);
  };
  
  // Header
  doc.setFillColor(139, 92, 246); // Primary purple
  doc.rect(0, 0, pageWidth, 45, 'F');
  
  addText('My 2Go Partner Report', margin, 18, { fontSize: 20, fontStyle: 'bold', color: [255, 255, 255] });
  addText(partnerName, margin, 28, { fontSize: 14, color: [255, 255, 255] });
  addText(`Zeitraum: ${periodLabel}`, margin, 38, { fontSize: 10, color: [220, 220, 255] });
  addText(`Erstellt: ${format(new Date(), 'dd.MM.yyyy HH:mm', { locale: de })}`, pageWidth - margin - 50, 38, { fontSize: 10, color: [220, 220, 255] });
  
  y = 60;
  
  // Summary Section
  addText('Zusammenfassung', margin, y, { fontSize: 16, fontStyle: 'bold' });
  y += 12;
  addLine(y);
  y += 10;
  
  // Stats Grid (2x2)
  const statBoxWidth = (contentWidth - 10) / 2;
  const statBoxHeight = 35;
  
  const statsToShow = [
    { label: 'Einlösungen Gesamt', value: stats.totalRedemptions.toString(), sub: `${stats.pendingRedemptions} offen, ${stats.completedRedemptions} bestätigt` },
    { label: 'Taler Eingelöst', value: stats.totalTalerRedeemed.toString(), sub: 'Gesamt-Taler-Volumen' },
    { label: 'Aktive Rewards', value: `${stats.activeRewards} / ${stats.totalRewards}`, sub: 'Aktuell verfügbar' },
    { label: 'Bewertungen', value: stats.avgRating ? stats.avgRating.toFixed(1) : '-', sub: `${stats.totalReviews} Bewertungen (${stats.positiveReviews} positiv)` },
  ];
  
  statsToShow.forEach((stat, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const boxX = margin + col * (statBoxWidth + 10);
    const boxY = y + row * (statBoxHeight + 8);
    
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(boxX, boxY, statBoxWidth, statBoxHeight, 3, 3, 'F');
    
    addText(stat.label, boxX + 8, boxY + 12, { fontSize: 9, color: [100, 100, 100] });
    addText(stat.value, boxX + 8, boxY + 24, { fontSize: 16, fontStyle: 'bold' });
    addText(stat.sub, boxX + 8, boxY + 32, { fontSize: 8, color: [120, 120, 120] });
  });
  
  y += (statBoxHeight + 8) * 2 + 15;
  
  // Daily Performance Section
  addText('Tägliche Performance', margin, y, { fontSize: 16, fontStyle: 'bold' });
  y += 12;
  addLine(y);
  y += 8;
  
  // Table Header
  const colWidths = [35, 40, 40, 45];
  let tableX = margin;
  
  doc.setFillColor(139, 92, 246);
  doc.rect(margin, y, contentWidth, 10, 'F');
  
  const headers = ['Datum', 'Einlösungen', 'Taler', 'Bewertungen'];
  headers.forEach((header, i) => {
    addText(header, tableX + 3, y + 7, { fontSize: 9, fontStyle: 'bold', color: [255, 255, 255] });
    tableX += colWidths[i];
  });
  
  y += 12;
  
  // Table Rows (last 14 days)
  const recentStats = dailyStats.slice(-14);
  recentStats.forEach((day, index) => {
    tableX = margin;
    
    if (index % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, y - 3, contentWidth, 8, 'F');
    }
    
    const rowData = [
      format(new Date(day.date), 'dd.MM.yy', { locale: de }),
      day.redemptions.toString(),
      day.taler.toString(),
      day.reviews.toString(),
    ];
    
    rowData.forEach((cell, i) => {
      addText(cell, tableX + 3, y + 3, { fontSize: 9 });
      tableX += colWidths[i];
    });
    
    y += 8;
    
    // New page if needed
    if (y > 270) {
      doc.addPage();
      y = margin;
    }
  });
  
  // Footer
  y = 285;
  addLine(y);
  addText('Dieser Bericht wurde automatisch von My 2Go generiert.', margin, y + 8, { fontSize: 8, color: [150, 150, 150] });
  addText('© 2025 My 2Go', pageWidth - margin - 30, y + 8, { fontSize: 8, color: [150, 150, 150] });
  
  // Save
  const filename = `My2Go_Report_${partnerName.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
  doc.save(filename);
}
