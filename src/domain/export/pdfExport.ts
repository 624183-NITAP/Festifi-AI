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
import {
  BudgetSummary,
  EventDetails,
  EventPlanState,
  GeneratedEventPlan,
  GuestRecord,
  TimelineTask,
} from '../types';

export const PDF_THEME = {
  colors: {
    primaryNavy: [15, 23, 42] as [number, number, number],
    slateDark: [30, 41, 59] as [number, number, number],
    slateBody: [51, 65, 85] as [number, number, number],
    slateSubtle: [71, 85, 105] as [number, number, number],
    slateMuted: [100, 116, 139] as [number, number, number],
    slateLight: [148, 163, 184] as [number, number, number],
    slateBorder: [226, 232, 240] as [number, number, number],
    bgLight: [248, 250, 252] as [number, number, number],
    bgCard: [241, 245, 249] as [number, number, number],
    goldAccent: [245, 158, 11] as [number, number, number],
    goldDark: [217, 119, 6] as [number, number, number],
    amberBg: [254, 243, 199] as [number, number, number],
    amberText: [146, 64, 14] as [number, number, number],
    emeraldText: [16, 185, 129] as [number, number, number],
    roseText: [220, 38, 38] as [number, number, number],
    white: [255, 255, 255] as [number, number, number],
  },
  layout: {
    margin: 40,
    headerHeight: 120,
    kpiCardHeight: 54,
  },
  fonts: {
    family: 'helvetica',
  },
} as const;

export interface PdfGenerationOptions {
  includeConcepts?: boolean;
  includeExpenses?: boolean;
  includeTimeline?: boolean;
  includeGuests?: boolean;
  includeVendors?: boolean;
}

export interface PdfRenderContext {
  doc: jsPDF;
  pageWidth: number;
  pageHeight: number;
  margin: number;
  contentWidth: number;
  currentY: number;
  ensureSpace: (neededHeight: number) => void;
}

export function drawRunningHeader(
  doc: jsPDF,
  eventTitle: string,
  margin: number,
  pageWidth: number
): void {
  const { colors, fonts } = PDF_THEME;
  doc.setFont(fonts.family, 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...colors.slateLight);
  doc.text(`FestiFi AI — Client Proposal: ${eventTitle}`, margin, margin - 10);
  doc.setDrawColor(...colors.slateBorder);
  doc.setLineWidth(0.5);
  doc.line(margin, margin - 5, pageWidth - margin, margin - 5);
}

export function renderCoverBanner(ctx: PdfRenderContext, event: EventDetails): void {
  const { doc, margin, contentWidth } = ctx;
  const { colors, fonts } = PDF_THEME;

  // Header Banner Background
  doc.setFillColor(...colors.primaryNavy);
  doc.roundedRect(margin, ctx.currentY, contentWidth, 120, 8, 8, 'F');

  // Brand Eyebrow
  doc.setFont(fonts.family, 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...colors.goldAccent);
  doc.text('FESTIFI AI — EVENT INTELLIGENCE & CLIENT PROPOSAL', margin + 20, ctx.currentY + 28);

  // Event Title
  doc.setFont(fonts.family, 'bold');
  doc.setFontSize(20);
  doc.setTextColor(...colors.white);
  const titleText = doc.splitTextToSize(event.title, contentWidth - 40);
  doc.text(titleText, margin + 20, ctx.currentY + 54);

  // Subtitle / Theme
  doc.setFont(fonts.family, 'normal');
  doc.setFontSize(10);
  doc.setTextColor(203, 213, 225);
  doc.text(
    `Theme: ${event.theme || 'Bespoke Celebration'} • Type: ${event.type.toUpperCase()}`,
    margin + 20,
    ctx.currentY + 76
  );

  // Key Event Specs Badge Row
  doc.setFontSize(9);
  doc.setTextColor(...colors.slateBorder);
  const specsText = `Target Date: ${formatDateReadable(event.targetDate)}   |   Expected Guests: ${event.guestCount}   |   Location: ${event.location || 'Selected Venue'}`;
  doc.text(specsText, margin + 20, ctx.currentY + 98);

  ctx.currentY += 135;
}

export function renderFinancialMetricCards(
  ctx: PdfRenderContext,
  event: EventDetails,
  summary: BudgetSummary
): void {
  const { doc, margin, contentWidth } = ctx;
  const { colors, fonts } = PDF_THEME;
  const colWidth = (contentWidth - 20) / 3;

  // Box 1: Total Budget
  doc.setFillColor(...colors.bgLight);
  doc.setDrawColor(...colors.slateBorder);
  doc.roundedRect(margin, ctx.currentY, colWidth, 54, 6, 6, 'FD');
  doc.setFont(fonts.family, 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...colors.slateMuted);
  doc.text('TOTAL EVENT BUDGET', margin + 12, ctx.currentY + 18);
  doc.setFontSize(14);
  doc.setTextColor(...colors.primaryNavy);
  doc.text(formatCurrencyMinor(event.totalBudgetMinor, event.currency), margin + 12, ctx.currentY + 40);

  // Box 2: Contingency Reserve
  doc.setFillColor(...colors.bgLight);
  doc.roundedRect(margin + colWidth + 10, ctx.currentY, colWidth, 54, 6, 6, 'FD');
  doc.setFont(fonts.family, 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...colors.slateMuted);
  doc.text(`CONTINGENCY RESERVE (${event.contingencyPercentage}%)`, margin + colWidth + 22, ctx.currentY + 18);
  doc.setFontSize(14);
  doc.setTextColor(...colors.goldDark);
  doc.text(formatCurrencyMinor(summary.contingencyReserveMinor, event.currency), margin + colWidth + 22, ctx.currentY + 40);

  // Box 3: Per-Guest Target
  doc.setFillColor(...colors.bgLight);
  doc.roundedRect(margin + (colWidth + 10) * 2, ctx.currentY, colWidth, 54, 6, 6, 'FD');
  doc.setFont(fonts.family, 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...colors.slateMuted);
  doc.text('ESTIMATED PER GUEST', margin + (colWidth + 10) * 2 + 12, ctx.currentY + 18);
  doc.setFontSize(14);
  doc.setTextColor(...colors.primaryNavy);
  doc.text(formatCurrencyMinor(summary.perPersonEstimateMinor, event.currency), margin + (colWidth + 10) * 2 + 12, ctx.currentY + 40);

  ctx.currentY += 70;
}

export function renderCreativeDirection(
  ctx: PdfRenderContext,
  generatedIdeas: GeneratedEventPlan
): void {
  const { doc, margin, contentWidth } = ctx;
  const { colors, fonts } = PDF_THEME;

  ctx.ensureSpace(120);

  doc.setFont(fonts.family, 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...colors.primaryNavy);
  doc.text('1. Creative Direction & Event Vibe', margin, ctx.currentY);
  ctx.currentY += 16;

  if (generatedIdeas.concepts && generatedIdeas.concepts.length > 0) {
    for (const concept of generatedIdeas.concepts.slice(0, 2)) {
      ctx.ensureSpace(50);
      doc.setFillColor(...colors.bgCard);
      doc.roundedRect(margin, ctx.currentY, contentWidth, 42, 4, 4, 'F');

      doc.setFont(fonts.family, 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(...colors.slateDark);
      doc.text(`Concept: ${concept.title}`, margin + 12, ctx.currentY + 16);

      doc.setFont(fonts.family, 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(...colors.slateSubtle);
      const desc = doc.splitTextToSize(concept.description, contentWidth - 24);
      doc.text(desc.slice(0, 2), margin + 12, ctx.currentY + 30);

      ctx.currentY += 48;
    }
  }

  if (generatedIdeas.themes && generatedIdeas.themes.length > 0) {
    ctx.ensureSpace(40);
    const theme = generatedIdeas.themes[0];
    doc.setFont(fonts.family, 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...colors.slateMuted);
    doc.text(`COLOR PALETTE & ATMOSPHERE: ${theme.name}`, margin, ctx.currentY);
    ctx.currentY += 14;

    doc.setFont(fonts.family, 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...colors.slateBody);
    doc.text(
      `Palette Swatches: ${theme.colorPalette.join('  •  ')}   |   Decor Highlights: ${theme.decorIdeas.join(', ')}`,
      margin,
      ctx.currentY
    );
    ctx.currentY += 22;
  }
}

export function renderBudgetSchedule(
  ctx: PdfRenderContext,
  state: EventPlanState,
  summary: BudgetSummary
): void {
  const { doc, margin, contentWidth } = ctx;
  const { colors, fonts } = PDF_THEME;

  ctx.ensureSpace(120);

  doc.setFont(fonts.family, 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...colors.primaryNavy);
  doc.text('2. Itemized Financial Schedule & Commitments', margin, ctx.currentY);
  ctx.currentY += 16;

  // Table Header
  doc.setFillColor(...colors.slateDark);
  doc.rect(margin, ctx.currentY, contentWidth, 20, 'F');
  doc.setFont(fonts.family, 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...colors.white);
  doc.text('CATEGORY', margin + 8, ctx.currentY + 13);
  doc.text('ITEM DESCRIPTION', margin + 100, ctx.currentY + 13);
  doc.text('PRIORITY', margin + 270, ctx.currentY + 13);
  doc.text('STATUS', margin + 340, ctx.currentY + 13);
  doc.text('ESTIMATED', margin + 410, ctx.currentY + 13);
  doc.text('PAID', margin + 475, ctx.currentY + 13);
  ctx.currentY += 20;

  // Table Rows
  state.expenses.forEach((item, index) => {
    ctx.ensureSpace(20);
    const isEven = index % 2 === 0;
    doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
    doc.rect(margin, ctx.currentY, contentWidth, 18, 'F');

    doc.setFont(fonts.family, 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...colors.slateBody);

    // Category
    doc.text((item.categoryId || '').toUpperCase(), margin + 8, ctx.currentY + 12);

    // Truncated Item Name
    const itemName = item.name.length > 32 ? item.name.substring(0, 30) + '...' : item.name;
    doc.text(itemName, margin + 100, ctx.currentY + 12);

    // Priority
    doc.text(item.priority.replace('_', ' '), margin + 270, ctx.currentY + 12);

    // Status
    doc.text(item.status.toUpperCase(), margin + 340, ctx.currentY + 12);

    // Estimated Cost
    doc.setFont(fonts.family, 'bold');
    doc.text(formatCurrencyMinor(item.estimatedCostMinor, state.event.currency), margin + 410, ctx.currentY + 12);

    // Paid
    doc.setFont(fonts.family, 'normal');
    doc.text(formatCurrencyMinor(item.paidMinor, state.event.currency), margin + 475, ctx.currentY + 12);

    ctx.currentY += 18;
  });

  // Budget Balance Summary Row
  ctx.ensureSpace(24);
  doc.setFillColor(...colors.bgCard);
  doc.rect(margin, ctx.currentY, contentWidth, 22, 'F');
  doc.setFont(fonts.family, 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...colors.primaryNavy);
  doc.text(`TOTAL PLANNED: ${formatCurrencyMinor(summary.plannedMinor, state.event.currency)}`, margin + 8, ctx.currentY + 15);
  doc.text(`PAID DISBURSED: ${formatCurrencyMinor(summary.paidMinor, state.event.currency)}`, margin + 200, ctx.currentY + 15);

  const balanceColor = summary.isOverBudget ? colors.roseText : colors.emeraldText;
  doc.setTextColor(...balanceColor);
  doc.text(
    `REMAINING SOLVENCY: ${formatCurrencyMinor(summary.remainingMinor, state.event.currency)}`,
    margin + 360,
    ctx.currentY + 15
  );
  ctx.currentY += 32;
}

export function renderGuestRequirements(ctx: PdfRenderContext, guests: GuestRecord[]): void {
  const { doc, margin, contentWidth } = ctx;
  const { colors, fonts } = PDF_THEME;
  const guestStats = calculateGuestStats(guests);

  ctx.ensureSpace(110);

  doc.setFont(fonts.family, 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...colors.primaryNavy);
  doc.text('3. Guest RSVP & Dietary Catering Breakdown', margin, ctx.currentY);
  ctx.currentY += 16;

  // Headcount stats line
  doc.setFont(fonts.family, 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...colors.slateBody);
  doc.text(
    `Total Invited: ${guestStats.totalInvited}   |   Confirmed Attending: ${guestStats.attending} (+${guestStats.plusOnesCount} plus-ones = ${guestStats.totalExpectedHeadcount} seats)   |   Declined: ${guestStats.declined}   |   Pending: ${guestStats.pending}`,
    margin,
    ctx.currentY
  );
  ctx.currentY += 18;

  // Dietary Restrictions Table
  const dietaryItems = Object.entries(guestStats.dietaryBreakdown).filter(([, count]) => count > 0);
  if (dietaryItems.length > 0) {
    doc.setFillColor(...colors.bgLight);
    doc.setDrawColor(...colors.slateBorder);
    doc.roundedRect(margin, ctx.currentY, contentWidth, 20 + dietaryItems.length * 15, 4, 4, 'FD');

    doc.setFont(fonts.family, 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...colors.slateMuted);
    doc.text('DIETARY PREFERENCE', margin + 12, ctx.currentY + 14);
    doc.text('CHEF MEAL PORTIONS REQUIRED', margin + 260, ctx.currentY + 14);
    ctx.currentY += 20;

    dietaryItems.forEach(([key, count]) => {
      doc.setFont(fonts.family, 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(...colors.slateDark);
      doc.text(DIETARY_LABELS[key as keyof typeof DIETARY_LABELS] || key, margin + 12, ctx.currentY + 10);
      doc.setFont(fonts.family, 'bold');
      doc.text(`${count} portion(s)`, margin + 260, ctx.currentY + 10);
      ctx.currentY += 15;
    });

    ctx.currentY += 14;
  }
}

export function renderTimelineSchedule(ctx: PdfRenderContext, tasks: TimelineTask[]): void {
  const { doc, margin, contentWidth } = ctx;
  const { colors, fonts } = PDF_THEME;

  ctx.ensureSpace(120);

  doc.setFont(fonts.family, 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...colors.primaryNavy);
  doc.text('4. Execution Timeline & Critical Path Milestones', margin, ctx.currentY);
  ctx.currentY += 16;

  // Header
  doc.setFillColor(...colors.slateDark);
  doc.rect(margin, ctx.currentY, contentWidth, 18, 'F');
  doc.setFont(fonts.family, 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...colors.white);
  doc.text('TARGET DATE', margin + 8, ctx.currentY + 12);
  doc.text('TASK / MILESTONE TITLE', margin + 110, ctx.currentY + 12);
  doc.text('CATEGORY', margin + 340, ctx.currentY + 12);
  doc.text('PRIORITY', margin + 420, ctx.currentY + 12);
  doc.text('STATUS', margin + 480, ctx.currentY + 12);
  ctx.currentY += 18;

  // Sorted chronological tasks
  const sortedTasks = [...tasks].sort((a, b) => a.deadline.localeCompare(b.deadline));
  sortedTasks.slice(0, 15).forEach((task, index) => {
    ctx.ensureSpace(18);
    const isEven = index % 2 === 0;
    doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
    doc.rect(margin, ctx.currentY, contentWidth, 16, 'F');

    doc.setFont(fonts.family, 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...colors.slateBody);
    doc.text(task.deadline, margin + 8, ctx.currentY + 11);

    const title = task.title.length > 40 ? task.title.substring(0, 38) + '...' : task.title;
    doc.text(title, margin + 110, ctx.currentY + 11);
    doc.text(task.category.toUpperCase(), margin + 340, ctx.currentY + 11);
    doc.text(task.priority.replace('_', ' '), margin + 420, ctx.currentY + 11);
    doc.setFont(fonts.family, task.completed ? 'bold' : 'normal');
    doc.setTextColor(
      task.completed ? colors.emeraldText[0] : colors.slateMuted[0],
      task.completed ? colors.emeraldText[1] : colors.slateMuted[1],
      task.completed ? colors.emeraldText[2] : colors.slateMuted[2]
    );
    doc.text(task.completed ? 'COMPLETED' : 'PENDING', margin + 480, ctx.currentY + 11);

    ctx.currentY += 16;
  });

  ctx.currentY += 14;
}

export function renderVendorContracts(ctx: PdfRenderContext, state: EventPlanState): void {
  const { doc, margin, contentWidth } = ctx;
  const { colors, fonts } = PDF_THEME;

  ctx.ensureSpace(90);

  doc.setFont(fonts.family, 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...colors.primaryNavy);
  doc.text('5. Vendor Engagements & Contract Quotes', margin, ctx.currentY);
  ctx.currentY += 16;

  state.vendors.forEach((vendor) => {
    ctx.ensureSpace(24);
    doc.setFillColor(...colors.bgLight);
    doc.setDrawColor(...colors.slateBorder);
    doc.roundedRect(margin, ctx.currentY, contentWidth, 22, 3, 3, 'FD');

    doc.setFont(fonts.family, 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...colors.primaryNavy);
    doc.text(`${vendor.name} (${vendor.category.toUpperCase()})`, margin + 10, ctx.currentY + 14);

    doc.setFont(fonts.family, 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...colors.slateMuted);
    doc.text(`Contact: ${vendor.contactPerson || 'N/A'} • ${vendor.email || ''}`, margin + 190, ctx.currentY + 14);

    doc.setFont(fonts.family, 'bold');
    const isHired = vendor.status === 'hired';
    doc.setTextColor(
      isHired ? colors.emeraldText[0] : colors.goldDark[0],
      isHired ? colors.emeraldText[1] : colors.goldDark[1],
      isHired ? colors.emeraldText[2] : colors.goldDark[2]
    );
    const quoteStr =
      vendor.quotedPriceMinor !== null
        ? formatCurrencyMinor(vendor.quotedPriceMinor, state.event.currency)
        : 'Quotation Pending';
    doc.text(`${vendor.status.toUpperCase()} — ${quoteStr}`, margin + 410, ctx.currentY + 14);

    ctx.currentY += 26;
  });

  ctx.currentY += 10;
}

export function renderGovernanceDisclaimer(ctx: PdfRenderContext): void {
  const { doc, margin, contentWidth } = ctx;
  const { colors, fonts } = PDF_THEME;

  ctx.ensureSpace(70);
  doc.setFillColor(...colors.amberBg);
  doc.setDrawColor(...colors.goldAccent);
  doc.roundedRect(margin, ctx.currentY, contentWidth, 54, 4, 4, 'FD');

  doc.setFont(fonts.family, 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...colors.amberText);
  doc.text('GOVERNANCE & ESTIMATION DISCLAIMER', margin + 12, ctx.currentY + 16);

  doc.setFont(fonts.family, 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(180, 83, 9);
  const disclaimer = doc.splitTextToSize(
    'This client proposal is compiled by FestiFi AI Event Intelligence. Cost allocations marked "planned" reflect statistical regional benchmarks and simulated estimates; items marked "confirmed" or "paid" reflect signed supplier quotes. Total budget figures incorporate contingency reserves to cushion market price volatility. All bookings remain subject to formal vendor service agreements.',
    contentWidth - 24
  );
  doc.text(disclaimer, margin + 12, ctx.currentY + 28);

  ctx.currentY += 66;
}

export function applyPageFooters(doc: jsPDF, margin: number, pageHeight: number): void {
  const { colors, fonts } = PDF_THEME;
  const totalPages = doc.getNumberOfPages();
  const dateStr = new Date().toLocaleDateString();

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont(fonts.family, 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...colors.slateLight);
    doc.text(
      `Generated by FestiFi AI Platform  •  Exported on ${dateStr}  •  Page ${i} of ${totalPages}`,
      margin,
      pageHeight - 16
    );
  }
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
  const margin = PDF_THEME.layout.margin;
  const contentWidth = pageWidth - margin * 2;

  const summary = calculateBudgetSummary(state.event, state.expenses);

  const ctx: PdfRenderContext = {
    doc,
    pageWidth,
    pageHeight,
    margin,
    contentWidth,
    currentY: margin,
    ensureSpace: (neededHeight: number) => {
      if (ctx.currentY + neededHeight > pageHeight - margin - 30) {
        doc.addPage();
        ctx.currentY = margin + 20;
        drawRunningHeader(doc, state.event.title, margin, pageWidth);
      }
    },
  };

  // Section 1: Cover Banner & Metric Cards
  renderCoverBanner(ctx, state.event);
  renderFinancialMetricCards(ctx, state.event, summary);

  // Section 2: Creative Concepts & Themes
  if (includeConcepts && state.generatedIdeas) {
    renderCreativeDirection(ctx, state.generatedIdeas);
  }

  // Section 3: Itemized Budget Schedule
  if (includeExpenses && state.expenses.length > 0) {
    renderBudgetSchedule(ctx, state, summary);
  }

  // Section 4: Guest RSVP & Catering Requirements
  if (includeGuests && state.guests && state.guests.length > 0) {
    renderGuestRequirements(ctx, state.guests);
  }

  // Section 5: Timeline Tasks & Milestones
  if (includeTimeline && state.tasks.length > 0) {
    renderTimelineSchedule(ctx, state.tasks);
  }

  // Section 6: Vendors & Quotes
  if (includeVendors && state.vendors.length > 0) {
    renderVendorContracts(ctx, state);
  }

  // Section 7: Governance & Disclaimers
  renderGovernanceDisclaimer(ctx);

  // Running footers across all generated pages
  applyPageFooters(doc, margin, pageHeight);

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
