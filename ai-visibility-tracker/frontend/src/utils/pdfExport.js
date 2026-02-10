import jsPDF from 'jspdf';

// Color definitions for PDF
const COLORS = {
  // Branding
  blissDrive: [255, 149, 0],
  primary: [0, 102, 255],

  // Status colors
  green: [63, 185, 80],
  yellow: [210, 153, 34],
  red: [248, 81, 73],
  gray: [125, 133, 144],

  // Text colors
  title: [26, 26, 46],
  text: [55, 65, 81],
  muted: [107, 114, 128],
  light: [156, 163, 175],

  // Background
  bgDark: [13, 17, 23],
  bgCard: [22, 27, 34],
  white: [255, 255, 255],

  // Engine colors
  chatgpt: [16, 163, 127],
  perplexity: [32, 178, 170],
  googleAio: [66, 133, 244],
};

const ENGINE_COLORS = {
  CHATGPT: COLORS.chatgpt,
  PERPLEXITY: COLORS.perplexity,
  GOOGLE_AIO: COLORS.googleAio,
};

const ENGINE_NAMES = {
  CHATGPT: 'ChatGPT',
  PERPLEXITY: 'Perplexity',
  GOOGLE_AIO: 'Google AIO',
};

const MENTION_COLORS = {
  FEATURED: COLORS.green,
  MENTIONED: COLORS.yellow,
  COMPETITOR_ONLY: COLORS.red,
  NOT_FOUND: COLORS.gray,
};

const MENTION_LABELS = {
  FEATURED: 'Featured',
  MENTIONED: 'Mentioned',
  COMPETITOR_ONLY: 'Competitor Only',
  NOT_FOUND: 'Not Found',
};

/**
 * Export report to PDF - main entry point
 */
export async function exportToPdf(elementId, filename = 'report', reportData = null) {
  // If reportData is passed directly, use it
  if (reportData) {
    return exportReportToPdf(reportData, { filename });
  }

  // Try to get report data from window (set by React component)
  if (window.__reportData) {
    return exportReportToPdf(window.__reportData, { filename });
  }

  // Fallback: use html2canvas for simple capture
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with ID "${elementId}" not found`);
  }

  const { default: html2canvas } = await import('html2canvas');
  return captureElementToPdf(element, elementId, filename);
}

/**
 * Capture element using html2canvas (fallback)
 */
async function captureElementToPdf(element, elementId, filename) {
  const { default: html2canvas } = await import('html2canvas');

  const originalStyle = element.style.cssText;

  try {
    element.style.width = '1200px';
    element.style.maxWidth = '1200px';

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#0D1117',
      logging: false,
      windowWidth: 1200,
    });

    const imgWidth = 210;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const imgData = canvas.toDataURL('image/png');
    let heightLeft = imgHeight;
    let position = 0;
    const pageHeightMM = pdf.internal.pageSize.getHeight();

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeightMM;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeightMM;
    }

    addFooterToAllPages(pdf);
    pdf.save(`${filename}.pdf`);
    return true;
  } finally {
    element.style.cssText = originalStyle;
  }
}

/**
 * Export report data to comprehensive PDF
 */
export async function exportReportToPdf(reportData, options = {}) {
  const {
    filename = `${reportData.client?.name || 'report'}-ai-visibility`,
  } = options;

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);
  let y = margin;

  // Helper functions
  const addPage = () => {
    pdf.addPage();
    y = margin + 10;
  };

  const checkPageBreak = (neededHeight) => {
    if (y + neededHeight > pageHeight - 25) {
      addPage();
      return true;
    }
    return false;
  };

  const setColor = (color) => {
    pdf.setTextColor(...color);
  };

  const setFillColor = (color) => {
    pdf.setFillColor(...color);
  };

  const drawRoundedRect = (x, y, w, h, r) => {
    pdf.roundedRect(x, y, w, h, r, r, 'F');
  };

  // ===== COVER PAGE =====
  setFillColor(COLORS.bgDark);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');

  // Top accent line
  setFillColor(COLORS.blissDrive);
  pdf.rect(0, 0, pageWidth, 3, 'F');

  // Main title
  setColor(COLORS.white);
  pdf.setFontSize(32);
  pdf.setFont('helvetica', 'bold');
  pdf.text('AI Visibility Report', pageWidth / 2, 55, { align: 'center' });

  // Client name
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'normal');
  setColor([200, 200, 200]);
  pdf.text(reportData.client?.name || 'Client Report', pageWidth / 2, 70, { align: 'center' });

  // Domain
  pdf.setFontSize(12);
  setColor(COLORS.muted);
  pdf.text(reportData.client?.domain || '', pageWidth / 2, 82, { align: 'center' });

  // Score circle
  const scoreX = pageWidth / 2;
  const scoreY = 130;
  const scoreRadius = 35;

  const scoreColor = reportData.overallScore >= 60 ? COLORS.green :
                     reportData.overallScore >= 30 ? COLORS.yellow : COLORS.red;

  setFillColor([30, 35, 42]);
  pdf.circle(scoreX, scoreY, scoreRadius + 3, 'F');
  setFillColor(scoreColor);
  pdf.circle(scoreX, scoreY, scoreRadius, 'F');
  setFillColor(COLORS.bgDark);
  pdf.circle(scoreX, scoreY, scoreRadius - 6, 'F');

  // Score text
  setColor(COLORS.white);
  pdf.setFontSize(42);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`${reportData.overallScore}`, scoreX, scoreY + 5, { align: 'center' });

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  setColor(COLORS.muted);
  pdf.text('VISIBILITY SCORE', scoreX, scoreY + 18, { align: 'center' });

  // Quick stats boxes
  const statBoxY = 185;
  const statBoxWidth = 40;
  const statBoxGap = 5;
  const totalStatsWidth = (statBoxWidth * 4) + (statBoxGap * 3);
  let statX = (pageWidth - totalStatsWidth) / 2;

  const quickStats = [
    { label: 'Featured', value: reportData.featuredCount, color: COLORS.green },
    { label: 'Mentioned', value: reportData.mentionedCount, color: COLORS.yellow },
    { label: 'Competitor', value: reportData.competitorOnlyCount, color: COLORS.red },
    { label: 'Not Found', value: reportData.notFoundCount, color: COLORS.gray },
  ];

  quickStats.forEach((stat) => {
    setFillColor([30, 35, 42]);
    drawRoundedRect(statX, statBoxY, statBoxWidth, 35, 3);

    setColor(stat.color);
    pdf.setFontSize(22);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${stat.value}`, statX + statBoxWidth / 2, statBoxY + 18, { align: 'center' });

    setColor(COLORS.muted);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text(stat.label, statX + statBoxWidth / 2, statBoxY + 28, { align: 'center' });

    statX += statBoxWidth + statBoxGap;
  });

  // Report date
  pdf.setFontSize(11);
  setColor(COLORS.muted);
  pdf.text(
    `Generated on ${new Date(reportData.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })}`,
    pageWidth / 2,
    240,
    { align: 'center' }
  );

  // Bliss Drive branding
  setColor(COLORS.blissDrive);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Powered by Bliss Drive', pageWidth / 2, pageHeight - 30, { align: 'center' });

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  setColor(COLORS.muted);
  pdf.text('AI Visibility Tracker Pro', pageWidth / 2, pageHeight - 22, { align: 'center' });

  // ===== EXECUTIVE SUMMARY PAGE =====
  addPage();
  setFillColor(COLORS.white);
  pdf.rect(0, 0, pageWidth, pageHeight, 'F');

  drawPageHeader(pdf, 'Executive Summary', margin, contentWidth);
  y = 35;

  // Key metrics section
  setColor(COLORS.title);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Key Metrics', margin, y);
  y += 10;

  // Metrics grid
  const metricBoxWidth = (contentWidth - 10) / 2;
  const metricBoxHeight = 25;

  const metrics = [
    { label: 'Total Prompts Scanned', value: reportData.promptCount },
    { label: 'AI Engines Analyzed', value: '3' },
    { label: 'Best Performing Engine', value: ENGINE_NAMES[reportData.bestEngine] || 'N/A' },
    { label: 'New Competitors Found', value: reportData.newCompetitorsDetected?.length || 0 },
  ];

  metrics.forEach((metric, i) => {
    const col = i % 2;
    if (i > 0 && col === 0) {
      y += metricBoxHeight + 5;
    }

    const metricX = margin + (col * (metricBoxWidth + 10));

    setFillColor([248, 250, 252]);
    drawRoundedRect(metricX, y, metricBoxWidth, metricBoxHeight, 3);

    setColor(COLORS.text);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(metric.label, metricX + 8, y + 10);

    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    setColor(COLORS.primary);
    pdf.text(`${metric.value}`, metricX + 8, y + 20);
  });

  y += metricBoxHeight + 20;

  // Visibility breakdown
  checkPageBreak(80);
  setColor(COLORS.title);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Visibility Breakdown', margin, y);
  y += 10;

  // Draw pie chart
  const pieX = margin + 40;
  const pieY = y + 35;
  const pieRadius = 30;

  const total = reportData.featuredCount + reportData.mentionedCount +
                reportData.competitorOnlyCount + reportData.notFoundCount;

  if (total > 0) {
    const pieData = [
      { value: reportData.featuredCount, color: COLORS.green, label: 'Featured' },
      { value: reportData.mentionedCount, color: COLORS.yellow, label: 'Mentioned' },
      { value: reportData.competitorOnlyCount, color: COLORS.red, label: 'Competitor Only' },
      { value: reportData.notFoundCount, color: COLORS.gray, label: 'Not Found' },
    ].filter(d => d.value > 0);

    let startAngle = -90;
    pieData.forEach((segment) => {
      const sweepAngle = (segment.value / total) * 360;
      setFillColor(segment.color);
      drawPieSegment(pdf, pieX, pieY, pieRadius, startAngle, startAngle + sweepAngle);
      startAngle += sweepAngle;
    });

    // Legend
    let legendY = y + 10;
    const legendX = margin + 90;

    pieData.forEach((item) => {
      setFillColor(item.color);
      pdf.rect(legendX, legendY - 3, 8, 8, 'F');

      setColor(COLORS.text);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const percentage = Math.round((item.value / total) * 100);
      pdf.text(`${item.label}: ${item.value} (${percentage}%)`, legendX + 12, legendY + 3);
      legendY += 12;
    });
  }

  y += 80;

  // Engine Performance
  checkPageBreak(70);
  setColor(COLORS.title);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Engine Performance', margin, y);
  y += 12;

  const engineStats = reportData.engineStats || {};
  const engineIds = ['CHATGPT', 'PERPLEXITY', 'GOOGLE_AIO'];

  engineIds.forEach((engineId) => {
    const stats = engineStats[engineId] || {};
    const featured = stats.featured || 0;
    const mentioned = stats.mentioned || 0;
    const engineTotal = Object.values(stats).reduce((a, b) => a + b, 0) || 1;
    const visibilityRate = Math.round(((featured + mentioned) / engineTotal) * 100);

    setColor(ENGINE_COLORS[engineId] || COLORS.text);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text(ENGINE_NAMES[engineId], margin, y);

    const barX = margin + 50;
    const barWidth = contentWidth - 70;
    const barHeight = 8;

    setFillColor([230, 230, 230]);
    drawRoundedRect(barX, y - 6, barWidth, barHeight, 2);

    setFillColor(ENGINE_COLORS[engineId] || COLORS.primary);
    if (visibilityRate > 0) {
      drawRoundedRect(barX, y - 6, (barWidth * visibilityRate) / 100, barHeight, 2);
    }

    setColor(COLORS.text);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${visibilityRate}%`, margin + contentWidth - 15, y, { align: 'right' });

    y += 16;
  });

  // ===== PROMPT RESULTS PAGE(S) =====
  if (reportData.promptResults?.length > 0) {
    addPage();
    drawPageHeader(pdf, 'Prompt Results', margin, contentWidth);
    y = 35;

    reportData.promptResults.forEach((pr, promptIndex) => {
      const neededHeight = 60 + (pr.engineResults?.length || 0) * 50;
      if (checkPageBreak(Math.min(neededHeight, 80))) {
        drawPageHeader(pdf, 'Prompt Results (continued)', margin, contentWidth);
        y = 35;
      }

      // Prompt box
      setFillColor([248, 250, 252]);
      const promptTextLines = pdf.splitTextToSize(`"${pr.prompt}"`, contentWidth - 20);
      const promptBoxHeight = Math.max(20, promptTextLines.length * 5 + 15);

      drawRoundedRect(margin, y, contentWidth, promptBoxHeight, 3);

      // Prompt number badge
      setFillColor(COLORS.primary);
      drawRoundedRect(margin + 5, y + 5, 20, 12, 2);
      setColor(COLORS.white);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`#${promptIndex + 1}`, margin + 15, y + 12, { align: 'center' });

      // Prompt text
      setColor(COLORS.title);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(promptTextLines, margin + 30, y + 12);

      y += promptBoxHeight + 5;

      // Engine results
      if (pr.engineResults) {
        pr.engineResults.forEach((er) => {
          if (checkPageBreak(45)) {
            drawPageHeader(pdf, 'Prompt Results (continued)', margin, contentWidth);
            y = 35;
          }

          const engineColor = ENGINE_COLORS[er.engine] || COLORS.text;
          const mentionColor = MENTION_COLORS[er.mentionType] || COLORS.gray;

          // Engine result box
          setFillColor([252, 252, 253]);
          pdf.setDrawColor(...engineColor);
          pdf.setLineWidth(0.5);
          pdf.roundedRect(margin + 5, y, contentWidth - 10, 40, 2, 2, 'FD');

          // Engine name
          setColor(engineColor);
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'bold');
          pdf.text(ENGINE_NAMES[er.engine] || er.engine, margin + 10, y + 8);

          // Mention type badge
          setFillColor(mentionColor);
          const badgeText = MENTION_LABELS[er.mentionType] || er.mentionType;
          const badgeWidth = pdf.getTextWidth(badgeText) + 8;
          drawRoundedRect(margin + contentWidth - badgeWidth - 15, y + 3, badgeWidth, 10, 2);
          setColor(COLORS.white);
          pdf.setFontSize(8);
          pdf.text(badgeText, margin + contentWidth - badgeWidth / 2 - 11, y + 9, { align: 'center' });

          // Response excerpt
          setColor(COLORS.text);
          pdf.setFontSize(8);
          pdf.setFont('helvetica', 'normal');
          const responseText = er.responseText || 'No response';
          const excerpt = responseText.length > 300 ? responseText.substring(0, 300) + '...' : responseText;
          const responseLines = pdf.splitTextToSize(excerpt, contentWidth - 25);
          pdf.text(responseLines.slice(0, 4), margin + 10, y + 16);

          // Competitors mentioned
          if (er.competitorsMentioned?.length > 0) {
            setColor(COLORS.muted);
            pdf.setFontSize(7);
            pdf.text(`Competitors: ${er.competitorsMentioned.join(', ')}`, margin + 10, y + 36);
          }

          y += 45;
        });
      }

      y += 10;
    });
  }

  // ===== GAP ANALYSIS PAGE =====
  addPage();
  drawPageHeader(pdf, 'Gap Analysis', margin, contentWidth);
  y = 35;

  const gapData = (reportData.promptResults || []).map(pr => {
    const clientVisible = (pr.engineResults || []).filter(
      er => er.mentionType === 'FEATURED' || er.mentionType === 'MENTIONED'
    ).length;
    const competitorMentions = (pr.engineResults || []).reduce(
      (sum, er) => sum + (er.competitorsMentioned?.length || 0), 0
    );
    const hasGap = competitorMentions > 0 && clientVisible < 3;

    return { prompt: pr.prompt, clientVisibility: clientVisible, competitorMentions, hasGap };
  });

  const alertGaps = gapData.filter(g => g.hasGap);

  if (alertGaps.length > 0) {
    setColor(COLORS.red);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${alertGaps.length} Visibility Gap${alertGaps.length > 1 ? 's' : ''} Detected`, margin, y);
    y += 10;

    alertGaps.forEach((gap, i) => {
      if (checkPageBreak(25)) {
        drawPageHeader(pdf, 'Gap Analysis (continued)', margin, contentWidth);
        y = 35;
      }

      setFillColor([254, 242, 242]);
      pdf.setDrawColor(...COLORS.red);
      pdf.setLineWidth(0.3);
      const gapPrompt = gap.prompt.length > 80 ? gap.prompt.substring(0, 80) + '...' : gap.prompt;
      pdf.roundedRect(margin, y, contentWidth, 20, 2, 2, 'FD');

      setColor(COLORS.red);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Gap #${i + 1}`, margin + 5, y + 7);

      setColor(COLORS.text);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`"${gapPrompt}"`, margin + 5, y + 14);

      setColor(COLORS.muted);
      pdf.text(
        `Visible: ${gap.clientVisibility}/3 engines | Competitors: ${gap.competitorMentions}`,
        margin + contentWidth - 5, y + 7, { align: 'right' }
      );

      y += 25;
    });
  } else {
    setColor(COLORS.green);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('No Critical Visibility Gaps Detected', margin, y);
    y += 10;

    setColor(COLORS.text);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Your brand maintains consistent visibility across all analyzed prompts.', margin, y);
  }

  // ===== COMPETITOR ANALYSIS PAGE =====
  addPage();
  drawPageHeader(pdf, 'Competitor Analysis', margin, contentWidth);
  y = 35;

  if (reportData.competitorData?.length > 0) {
    setColor(COLORS.title);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Competitor Frequency', margin, y);
    y += 12;

    const sortedCompetitors = [...reportData.competitorData].sort((a, b) => b.count - a.count);
    const maxCount = sortedCompetitors[0]?.count || 1;

    sortedCompetitors.slice(0, 10).forEach((comp) => {
      if (checkPageBreak(15)) {
        drawPageHeader(pdf, 'Competitor Analysis (continued)', margin, contentWidth);
        y = 35;
      }

      setColor(COLORS.text);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      const compName = comp.name?.length > 25 ? comp.name.substring(0, 25) + '...' : comp.name;
      pdf.text(compName || 'Unknown', margin, y);

      const barX = margin + 55;
      const barWidth = contentWidth - 80;
      const barHeight = 6;

      setFillColor([230, 230, 230]);
      drawRoundedRect(barX, y - 5, barWidth, barHeight, 1);

      setFillColor(COLORS.red);
      const fillWidth = (comp.count / maxCount) * barWidth;
      if (fillWidth > 0) {
        drawRoundedRect(barX, y - 5, fillWidth, barHeight, 1);
      }

      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${comp.count}`, margin + contentWidth - 5, y, { align: 'right' });

      y += 12;
    });
  } else {
    setColor(COLORS.muted);
    pdf.setFontSize(10);
    pdf.text('No competitor data available.', margin, y);
  }

  y += 15;

  // New competitors detected
  if (reportData.newCompetitorsDetected?.length > 0) {
    checkPageBreak(40);

    setColor(COLORS.title);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('New Competitors Discovered', margin, y);
    y += 8;

    setColor(COLORS.muted);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.text('These competitors were found in AI responses but not in your original list.', margin, y);
    y += 10;

    let chipX = margin;
    const chipHeight = 10;
    const chipPadding = 8;

    reportData.newCompetitorsDetected.forEach((comp) => {
      const chipWidth = pdf.getTextWidth(comp) + chipPadding * 2;

      if (chipX + chipWidth > margin + contentWidth) {
        chipX = margin;
        y += chipHeight + 5;
      }

      setFillColor([255, 247, 237]);
      pdf.setDrawColor(...COLORS.blissDrive);
      pdf.setLineWidth(0.3);
      pdf.roundedRect(chipX, y - 7, chipWidth, chipHeight, 2, 2, 'FD');

      setColor(COLORS.blissDrive);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'bold');
      pdf.text(comp, chipX + chipPadding, y);

      chipX += chipWidth + 5;
    });
  }

  // Add footer to all pages
  addFooterToAllPages(pdf);

  // Save
  pdf.save(`${filename}.pdf`);
  return true;
}

/**
 * Draw page header
 */
function drawPageHeader(pdf, title, margin, contentWidth) {
  const pageWidth = pdf.internal.pageSize.getWidth();

  pdf.setFillColor(...COLORS.primary);
  pdf.rect(margin, 10, contentWidth, 1, 'F');

  pdf.setTextColor(...COLORS.title);
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text(title, margin, 22);

  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(...COLORS.blissDrive);
  pdf.text('Bliss Drive', pageWidth - margin, 22, { align: 'right' });
}

/**
 * Add footer to all pages
 */
function addFooterToAllPages(pdf) {
  const totalPages = pdf.internal.getNumberOfPages();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);

    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.3);
    pdf.line(15, pageHeight - 15, pageWidth - 15, pageHeight - 15);

    pdf.setFontSize(8);
    pdf.setTextColor(128, 128, 128);
    pdf.text(
      `AI Visibility Tracker Pro | Powered by Bliss Drive | Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' }
    );
  }
}

/**
 * Draw a pie segment
 */
function drawPieSegment(pdf, cx, cy, radius, startAngle, endAngle) {
  const steps = Math.max(1, Math.ceil(Math.abs(endAngle - startAngle) / 5));
  const angleStep = (endAngle - startAngle) / steps;

  for (let i = 0; i < steps; i++) {
    const a1 = (startAngle + i * angleStep) * Math.PI / 180;
    const a2 = (startAngle + (i + 1) * angleStep) * Math.PI / 180;

    const x1 = cx + radius * Math.cos(a1);
    const y1 = cy + radius * Math.sin(a1);
    const x2 = cx + radius * Math.cos(a2);
    const y2 = cy + radius * Math.sin(a2);

    pdf.triangle(cx, cy, x1, y1, x2, y2, 'F');
  }
}

export default exportToPdf;
