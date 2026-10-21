/**
 * FestiFi AI — Client-Ready PDF Proposal Export Engine
 * Generates structured, publication-grade client proposals using jsPDF.
 * Implements auto-pagination, running headers/footers, financial schedules,
 * guest catering summaries, milestone timelines, and governance disclaimers.
 */

import { jsPDF } from 'jspdf';
import { calculateBudgetSummary, formatCurrencyMinor } from '../budget';
import { calculateGuestStats, DIETARY_LABELS } from '../guests';
import { formatDateReadable } from '../timeline';
import { EventPlanState } from '../types';

export interface PdfGenerationOptions {
  includeConcepts?: boolean;
  includeExpenses?: boolean;
  includeTimeline?: boolean;
  includeGuests?: boolean;
  includeVendors?: boolean;
}

export function generateClientProposalPdf(
  state: EventPlanState,
  options: PdfGenerationOptions = {}
): jsPDF {
  const {
    includeConcepts = true,
    includeExpenses = true,
    includeTimeline = true,
    includeGuests = true,
    includeVendors = true,
  } = options;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;

  let currentY = margin;

  const summary = calculateBudgetSummary(state.event, state.expenses);
  const guestStats = calculateGuestStats(state.guests || []);

  // Helper for page break checks
  const ensureSpace = (neededHeight: number) => {
    if (currentY + neededHeight > pageHeight - margin - 30) {
      doc.addPage();
      currentY = margin + 20;
      drawRunningHeader();
    }
  };

  const drawRunningHeader = () => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // Slate 400
    doc.text(`FestiFi AI — Client Proposal: ${state.event.title}`, margin, margin - 10);
    doc.setDrawColor(226, 232, 240); // Slate 200
    doc.setLineWidth(0.5);
    doc.line(margin, margin - 5, pageWidth - margin, margin - 5);
  };

  // ==========================================
  // SECTION 1: COVER & EXECUTIVE BANNER
  // ==========================================
  // Header Banner Background
  doc.setFillColor(15, 23, 42); // Navy #0f172a
  doc.roundedRect(margin, currentY, contentWidth, 120, 8, 8, 'F');

  // Brand Eyebrow
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(245, 158, 11); // Amber / Gold
  doc.text('FESTIFI AI — EVENT INTELLIGENCE & CLIENT PROPOSAL', margin + 20, currentY + 28);

  // Event Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  const titleText = doc.splitTextToSize(state.event.title, contentWidth - 40);
  doc.text(titleText, margin + 20, currentY + 54);

  // Subtitle / Theme
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(203, 213, 225); // Slate 300
  doc.text(`Theme: ${state.event.theme || 'Bespoke Celebration'} • Type: ${state.event.type.toUpperCase()}`, margin + 20, currentY + 76);

  // Key Event Specs Badge Row
  doc.setFontSize(9);
  doc.setTextColor(226, 232, 240);
  const specsText = `Target Date: ${formatDateReadable(state.event.targetDate)}   |   Expected Guests: ${state.event.guestCount}   |   Location: ${state.event.location || 'Selected Venue'}`;
  doc.text(specsText, margin + 20, currentY + 98);

  currentY += 135;

  // Key Financial Metric Highlights Grid
  const colWidth = (contentWidth - 20) / 3;

  // Box 1: Total Budget
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, currentY, colWidth, 54, 6, 6, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('TOTAL EVENT BUDGET', margin + 12, currentY + 18);
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text(formatCurrencyMinor(state.event.totalBudgetMinor, state.event.currency), margin + 12, currentY + 40);

  // Box 2: Contingency Reserve
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin + colWidth + 10, currentY, colWidth, 54, 6, 6, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`CONTINGENCY RESERVE (${state.event.contingencyPercentage}%)`, margin + colWidth + 22, currentY + 18);
  doc.setFontSize(14);
  doc.setTextColor(217, 119, 6); // Amber
  doc.text(formatCurrencyMinor(summary.contingencyReserveMinor, state.event.currency), margin + colWidth + 22, currentY + 40);

  // Box 3: Per-Guest Target
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin + (colWidth + 10) * 2, currentY, colWidth, 54, 6, 6, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('ESTIMATED PER GUEST', margin + (colWidth + 10) * 2 + 12, currentY + 18);
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text(formatCurrencyMinor(summary.perPersonEstimateMinor, state.event.currency), margin + (colWidth + 10) * 2 + 12, currentY + 40);

  currentY += 70;

  // ==========================================
  // SECTION 2: CREATIVE CONCEPTS & THEMES
  // ==========================================
  if (includeConcepts && state.generatedIdeas) {
    ensureSpace(120);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text('1. Creative Direction & Event Vibe', margin, currentY);
    currentY += 16;

    if (state.generatedIdeas.concepts && state.generatedIdeas.concepts.length > 0) {
      for (const concept of state.generatedIdeas.concepts.slice(0, 2)) {
        ensureSpace(50);
        doc.setFillColor(241, 245, 249);
        doc.roundedRect(margin, currentY, contentWidth, 42, 4, 4, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(30, 41, 59);
        doc.text(`Concept: ${concept.title}`, margin + 12, currentY + 16);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(71, 85, 105);
        const desc = doc.splitTextToSize(concept.description, contentWidth - 24);
        doc.text(desc.slice(0, 2), margin + 12, currentY + 30);

        currentY += 48;
      }
    }

    if (state.generatedIdeas.themes && state.generatedIdeas.themes.length > 0) {
      ensureSpace(40);
      const theme = state.generatedIdeas.themes[0];
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(`COLOR PALETTE & ATMOSPHERE: ${theme.name}`, margin, currentY);
      currentY += 14;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);
      doc.text(`Palette Swatches: ${theme.colorPalette.join('  •  ')}   |   Decor Highlights: ${theme.decorIdeas.join(', ')}`, margin, currentY);
      currentY += 22;
    }
  }

  // ==========================================
  // SECTION 3: ITEMIZED BUDGET SCHEDULE
  // ==========================================
  if (includeExpenses && state.expenses.length > 0) {
    ensureSpace(120);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text('2. Itemized Financial Schedule & Commitments', margin, currentY);
    currentY += 16;

    // Table Header
    doc.setFillColor(30, 41, 59);
    doc.rect(margin, currentY, contentWidth, 20, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text('CATEGORY', margin + 8, currentY + 13);
    doc.text('ITEM DESCRIPTION', margin + 100, currentY + 13);
    doc.text('PRIORITY', margin + 270, currentY + 13);
    doc.text('STATUS', margin + 340, currentY + 13);
    doc.text('ESTIMATED', margin + 410, currentY + 13);
    doc.text('PAID', margin + 475, currentY + 13);
    currentY += 20;

    // Table Rows
    state.expenses.forEach((item, index) => {
      ensureSpace(20);
      const isEven = index % 2 === 0;
      doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
      doc.rect(margin, currentY, contentWidth, 18, 'F');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);

      // Category
      doc.text((item.categoryId || '').toUpperCase(), margin + 8, currentY + 12);

      // Truncated Item Name
      const itemName = item.name.length > 32 ? item.name.substring(0, 30) + '...' : item.name;
      doc.text(itemName, margin + 100, currentY + 12);

      // Priority
      doc.text(item.priority.replace('_', ' '), margin + 270, currentY + 12);

      // Status
      doc.text(item.status.toUpperCase(), margin + 340, currentY + 12);

      // Estimated Cost
      doc.setFont('helvetica', 'bold');
      doc.text(formatCurrencyMinor(item.estimatedCostMinor, state.event.currency), margin + 410, currentY + 12);

      // Paid
      doc.setFont('helvetica', 'normal');
      doc.text(formatCurrencyMinor(item.paidMinor, state.event.currency), margin + 475, currentY + 12);

      currentY += 18;
    });

    // Budget Balance Summary Row
    ensureSpace(24);
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, currentY, contentWidth, 22, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`TOTAL PLANNED: ${formatCurrencyMinor(summary.plannedMinor, state.event.currency)}`, margin + 8, currentY + 15);
    doc.text(`PAID DISBURSED: ${formatCurrencyMinor(summary.paidMinor, state.event.currency)}`, margin + 200, currentY + 15);
    const balanceColor = summary.isOverBudget ? [220, 38, 38] : [16, 185, 129];
    doc.setTextColor(balanceColor[0], balanceColor[1], balanceColor[2]);
    doc.text(
      `REMAINING SOLVENCY: ${formatCurrencyMinor(summary.remainingMinor, state.event.currency)}`,
      margin + 360,
      currentY + 15
    );
    currentY += 32;
  }

  // ==========================================
  // SECTION 4: GUEST & CATERING REQUIREMENTS
  // ==========================================
  if (includeGuests && state.guests && state.guests.length > 0) {
    ensureSpace(110);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text('3. Guest RSVP & Dietary Catering Breakdown', margin, currentY);
    currentY += 16;

    // Headcount stats line
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(51, 65, 85);
    doc.text(
      `Total Invited: ${guestStats.totalInvited}   |   Confirmed Attending: ${guestStats.attending} (+${guestStats.plusOnesCount} plus-ones = ${guestStats.totalExpectedHeadcount} seats)   |   Declined: ${guestStats.declined}   |   Pending: ${guestStats.pending}`,
      margin,
      currentY
    );
    currentY += 18;

    // Dietary Restrictions Table
    const dietaryItems = Object.entries(guestStats.dietaryBreakdown).filter(([, count]) => count > 0);
    if (dietaryItems.length > 0) {
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(margin, currentY, contentWidth, 20 + dietaryItems.length * 15, 4, 4, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('DIETARY PREFERENCE', margin + 12, currentY + 14);
      doc.text('CHEF MEAL PORTIONS REQUIRED', margin + 260, currentY + 14);
      currentY += 20;

      dietaryItems.forEach(([key, count]) => {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(30, 41, 59);
        doc.text(DIETARY_LABELS[key as keyof typeof DIETARY_LABELS] || key, margin + 12, currentY + 10);
        doc.setFont('helvetica', 'bold');
        doc.text(`${count} portion(s)`, margin + 260, currentY + 10);
        currentY += 15;
      });

      currentY += 14;
    }
  }

  // ==========================================
  // SECTION 5: TIMELINE TASKS & MILESTONES
  // ==========================================
  if (includeTimeline && state.tasks.length > 0) {
    ensureSpace(120);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text('4. Execution Timeline & Critical Path Milestones', margin, currentY);
    currentY += 16;

    // Header
    doc.setFillColor(30, 41, 59);
    doc.rect(margin, currentY, contentWidth, 18, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text('TARGET DATE', margin + 8, currentY + 12);
    doc.text('TASK / MILESTONE TITLE', margin + 110, currentY + 12);
    doc.text('CATEGORY', margin + 340, currentY + 12);
    doc.text('PRIORITY', margin + 420, currentY + 12);
    doc.text('STATUS', margin + 480, currentY + 12);
    currentY += 18;

    // Sorted chronological tasks
    const sortedTasks = [...state.tasks].sort((a, b) => a.deadline.localeCompare(b.deadline));
    sortedTasks.slice(0, 15).forEach((task, index) => {
      ensureSpace(18);
      const isEven = index % 2 === 0;
      doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
      doc.rect(margin, currentY, contentWidth, 16, 'F');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      doc.text(task.deadline, margin + 8, currentY + 11);

      const title = task.title.length > 40 ? task.title.substring(0, 38) + '...' : task.title;
      doc.text(title, margin + 110, currentY + 11);
      doc.text(task.category.toUpperCase(), margin + 340, currentY + 11);
      doc.text(task.priority.replace('_', ' '), margin + 420, currentY + 11);
      doc.setFont('helvetica', task.completed ? 'bold' : 'normal');
      doc.setTextColor(task.completed ? 16 : 100, task.completed ? 185 : 116, task.completed ? 129 : 139);
      doc.text(task.completed ? 'COMPLETED' : 'PENDING', margin + 480, currentY + 11);

      currentY += 16;
    });

    currentY += 14;
  }

  // ==========================================
  // SECTION 6: VENDORS & INQUIRIES
  // ==========================================
  if (includeVendors && state.vendors.length > 0) {
    ensureSpace(90);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text('5. Vendor Engagements & Contract Quotes', margin, currentY);
    currentY += 16;

    state.vendors.forEach((vendor) => {
      ensureSpace(24);
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(margin, currentY, contentWidth, 22, 3, 3, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text(`${vendor.name} (${vendor.category.toUpperCase()})`, margin + 10, currentY + 14);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(`Contact: ${vendor.contactPerson || 'N/A'} • ${vendor.email || ''}`, margin + 190, currentY + 14);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(vendor.status === 'hired' ? 16 : 217, vendor.status === 'hired' ? 185 : 119, vendor.status === 'hired' ? 129 : 6);
      const quoteStr = vendor.quotedPriceMinor !== null
        ? formatCurrencyMinor(vendor.quotedPriceMinor, state.event.currency)
        : 'Quotation Pending';
      doc.text(
        `${vendor.status.toUpperCase()} — ${quoteStr}`,
        margin + 410,
        currentY + 14
      );

      currentY += 26;
    });

    currentY += 10;
  }

  // ==========================================
  // SECTION 7: GOVERNANCE, AUDIT & DISCLAIMERS
  // ==========================================
  ensureSpace(70);
  doc.setFillColor(254, 243, 199); // Amber 100
  doc.setDrawColor(245, 158, 11);
  doc.roundedRect(margin, currentY, contentWidth, 54, 4, 4, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(146, 64, 14); // Amber 800
  doc.text('GOVERNANCE & ESTIMATION DISCLAIMER', margin + 12, currentY + 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(180, 83, 9);
  const disclaimer = doc.splitTextToSize(
    'This client proposal is compiled by FestiFi AI Event Intelligence. Cost allocations marked "planned" reflect statistical regional benchmarks and simulated estimates; items marked "confirmed" or "paid" reflect signed supplier quotes. Total budget figures incorporate contingency reserves to cushion market price volatility. All bookings remain subject to formal vendor service agreements.',
    contentWidth - 24
  );
  doc.text(disclaimer, margin + 12, currentY + 28);

  currentY += 66;

  // Stamp footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Generated by FestiFi AI Platform  •  Exported on ${new Date().toLocaleDateString()}  •  Page ${i} of ${totalPages}`,
      margin,
      pageHeight - 16
    );
  }

  return doc;
}

/**
 * Convenience helper to generate and trigger browser file download.
 */
export function downloadClientProposalPdf(state: EventPlanState): void {
  const doc = generateClientProposalPdf(state);
  const safeFilename = `${state.event.id || 'event'}-client-proposal.pdf`;
  doc.save(safeFilename);
}
