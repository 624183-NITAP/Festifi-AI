/**
 * FestiFi AI — What-If Scenario Simulator
 * Pure, deterministic mathematical evaluations of unexpected event changes.
 * Calculates financial deltas, category impacts, risk levels, and contingency
 * absorption without mutating current saved state.
 */

import { calculateBudgetSummary, formatCurrencyMinor } from '../budget';
import {
  BudgetCategory,
  EventDetails,
  ExpenseItem,
  ScenarioImpact,
  ScenarioType,
} from '../types';

export interface ScenarioDefinition {
  type: ScenarioType;
  title: string;
  defaultDescription: string;
}

export const SCENARIO_DEFINITIONS: Record<ScenarioType, ScenarioDefinition> = {
  guest_count_change: {
    type: 'guest_count_change',
    title: 'Surge in Guest Count (+25%)',
    defaultDescription: 'Simulates the budget and capacity impact of a 25% increase in confirmed attendees.',
  },
  budget_reduction: {
    type: 'budget_reduction',
    title: 'Sudden Budget Cut (-15%)',
    defaultDescription: 'Evaluates required trade-offs if overall available funding is trimmed by 15%.',
  },
  rain_contingency: {
    type: 'rain_contingency',
    title: 'Outdoor Rain & Inclement Weather Backup',
    defaultDescription: 'Adds tenting, covered walkways, and indoor backup climate control.',
  },
  vendor_cancellation: {
    type: 'vendor_cancellation',
    title: 'Critical Vendor Cancellation (Emergency Replacement)',
    defaultDescription: 'Models rush booking fees (+20%) and deposit loss if a key vendor cancels.',
  },
  date_change: {
    type: 'date_change',
    title: 'Event Date Reschedule (+30 Days)',
    defaultDescription: 'Calculates administrative rebooking fees and seasonal rate adjustments.',
  },
  dietary_requirements: {
    type: 'dietary_requirements',
    title: 'Specialty Dietary & Allergen Protocols',
    defaultDescription: 'Incorporates dedicated vegan, gluten-free, and cross-contamination kitchen costs.',
  },
};

/**
 * Simulates the deterministic impact of a specific What-If scenario.
 * Returns the exact financial delta, adjusted expense items, before/after summaries,
 * and clear trade-off explanations. Does NOT mutate input data.
 */
export function simulateScenario(
  event: EventDetails,
  currentExpenses: ExpenseItem[],
  scenarioType: ScenarioType,
  customParams: Record<string, unknown> = {}
): ScenarioImpact {
  const summaryBefore = calculateBudgetSummary(event, currentExpenses);
  const adjustedExpenses: ExpenseItem[] = JSON.parse(JSON.stringify(currentExpenses));
  const proposedAdjustments: Array<{ description: string; costDeltaMinor: number }> = [];
  const affectedCategories: BudgetCategory[] = [];
  const recommendations: string[] = [];

  let costDeltaMinor = 0;
  let riskLevel: 'low' | 'medium' | 'high' = 'medium';
  let title = SCENARIO_DEFINITIONS[scenarioType]?.title || 'Scenario Simulation';
  let description = SCENARIO_DEFINITIONS[scenarioType]?.defaultDescription || '';

  switch (scenarioType) {
    case 'guest_count_change': {
      const multiplier = typeof customParams.multiplier === 'number' ? customParams.multiplier : 0.25;
      const additionalGuests = Math.max(1, Math.round(event.guestCount * multiplier));
      title = `Surge in Guest Count (+${additionalGuests} guests)`;
      description = `Simulating +${Math.round(multiplier * 100)}% attendance (${additionalGuests} additional guests).`;
      affectedCategories.push('catering', 'logistics', 'invitations');

      // Marginal cost per guest: catering estimate (~ $45/guest = 4500 minor)
      const cateringDeltaPerGuest = 4500;
      const cateringDelta = additionalGuests * cateringDeltaPerGuest;

      // Table & chair rentals (~ $12/guest = 1200 minor)
      const rentalDelta = additionalGuests * 1200;

      // Stationery / favors (~ $5/guest = 500 minor)
      const stationeryDelta = additionalGuests * 500;

      costDeltaMinor = cateringDelta + rentalDelta + stationeryDelta;

      // Adjust existing catering item or add incremental line item
      const cateringItem = adjustedExpenses.find((e) => e.categoryId === 'catering');
      if (cateringItem) {
        cateringItem.estimatedCostMinor += cateringDelta;
      } else {
        adjustedExpenses.push({
          id: `sim-cat-${Date.now()}`,
          categoryId: 'catering',
          name: `Additional Catering (${additionalGuests} guests)`,
          estimatedCostMinor: cateringDelta,
          actualCostMinor: null,
          paidMinor: 0,
          status: 'planned',
          priority: 'must_have',
          notes: 'Estimated marginal catering cost for guest count surge',
        });
      }

      // Add rentals line item
      adjustedExpenses.push({
        id: `sim-rent-${Date.now()}`,
        categoryId: 'logistics',
        name: `Extra Tables, Chairs & Place Settings (${additionalGuests} guests)`,
        estimatedCostMinor: rentalDelta,
        actualCostMinor: null,
        paidMinor: 0,
        status: 'planned',
        priority: 'must_have',
        notes: 'Rental expansion for seating',
      });

      proposedAdjustments.push(
        { description: `Per-plate catering expansion (${additionalGuests} guests @ ${formatCurrencyMinor(cateringDeltaPerGuest, event.currency)})`, costDeltaMinor: cateringDelta },
        { description: `Additional table/chair rentals & dinnerware`, costDeltaMinor: rentalDelta },
        { description: `Extra favors, name cards & printed programs`, costDeltaMinor: stationeryDelta }
      );

      recommendations.push(
        'Verify maximum fire code capacity with your venue before confirming additional guests.',
        'Request guaranteed headcount deadline with caterer 14 days before the event.',
        `Use contingency reserve (${formatCurrencyMinor(summaryBefore.contingencyReserveMinor, event.currency)}) to absorb marginal rental costs.`
      );

      riskLevel = costDeltaMinor > summaryBefore.contingencyReserveMinor ? 'high' : 'medium';
      break;
    }

    case 'budget_reduction': {
      const cutPercent = typeof customParams.percent === 'number' ? customParams.percent : 15;
      const cutMinor = Math.round((event.totalBudgetMinor * cutPercent) / 100);
      title = `Budget Trim (-${cutPercent}%)`;
      description = `Targeting a reduction of ${formatCurrencyMinor(cutMinor, event.currency)} across non-essential categories.`;
      affectedCategories.push('decor', 'entertainment', 'miscellaneous');

      let currentSavings = 0;

      // Safeguard must-haves, reduce optional by 50% and nice-to-have by 25%
      for (const item of adjustedExpenses) {
        if (item.status === 'confirmed' || item.status === 'paid' || item.priority === 'must_have') {
          continue; // Protected
        }

        const initial = item.estimatedCostMinor;
        const discountRatio = item.priority === 'optional' ? 0.5 : 0.25;
        const savings = Math.round(initial * discountRatio);

        if (savings > 0) {
          item.estimatedCostMinor -= savings;
          currentSavings += savings;
          proposedAdjustments.push({
            description: `Trimmed ${item.name} (${item.priority === 'optional' ? '-50%' : '-25%'})`,
            costDeltaMinor: -savings,
          });
        }

        if (currentSavings >= cutMinor) break;
      }

      costDeltaMinor = -currentSavings;

      if (currentSavings === 0) {
        recommendations.push(
          'All current items are must-haves or confirmed contracts. To achieve this budget cut, consider reducing scope or renegotiating confirmed contracts directly.'
        );
        riskLevel = 'high';
      } else {
        recommendations.push(
          'Must-have vendors and confirmed contracts were preserved without modification.',
          'Consider digital invitations and simplified floral centerpieces to meet target reduction.',
          'Negotiate off-peak playlist duration with entertainment.'
        );
        riskLevel = currentSavings < cutMinor ? 'high' : 'low';
      }
      break;
    }

    case 'rain_contingency': {
      title = 'Rain & Weather Contingency Activation';
      description = 'Secures weather protection for outdoor areas including commercial marquee, side-walls, and heaters.';
      affectedCategories.push('venue', 'logistics');

      // Commercial Marquee Canopy Rental: $1,200 (120000 minor)
      const marqueeMinor = 120000;
      // Industrial Heaters / Misting Units: $350 (35000 minor)
      const climateMinor = 35000;
      // Covered Walkway & Rubber Matting: $200 (20000 minor)
      const walkwayMinor = 20000;

      costDeltaMinor = marqueeMinor + climateMinor + walkwayMinor;

      adjustedExpenses.push(
        {
          id: `sim-tent-${Date.now()}`,
          categoryId: 'logistics',
          name: 'Commercial Weather Canopy & Clear Sidewalls',
          estimatedCostMinor: marqueeMinor,
          actualCostMinor: null,
          paidMinor: 0,
          status: 'planned',
          priority: 'must_have',
          isContingency: true,
          notes: 'Weather contingency hold package with delivery guarantee',
        },
        {
          id: `sim-clim-${Date.now()}`,
          categoryId: 'venue',
          name: 'Covered Walkways & Temperature Control Units',
          estimatedCostMinor: climateMinor + walkwayMinor,
          actualCostMinor: null,
          paidMinor: 0,
          status: 'planned',
          priority: 'nice_to_have',
          isContingency: true,
          notes: 'Prevents guest discomfort during precipitation',
        }
      );

      proposedAdjustments.push(
        { description: 'Commercial event tent rental with anchor ballasts', costDeltaMinor: marqueeMinor },
        { description: 'Portable heaters / outdoor fans and rain umbrellas', costDeltaMinor: climateMinor },
        { description: 'Covered carpeted walkway from parking to reception', costDeltaMinor: walkwayMinor }
      );

      recommendations.push(
        'Check venue contract: many venues require tent permits 7 days in advance.',
        'Confirm if tent vendor requires a non-refundable weather deposit.',
        'Check sound absorption inside tenting for speech clarity.'
      );

      riskLevel = costDeltaMinor <= summaryBefore.contingencyReserveMinor ? 'low' : 'medium';
      break;
    }

    case 'vendor_cancellation': {
      title = 'Primary Vendor Cancellation (Rush Booking)';
      description = 'Simulates replacement catering/venue vendor with an emergency 20% rush fee on that segment.';
      affectedCategories.push('catering');

      const cateringItem = adjustedExpenses.find((e) => e.categoryId === 'catering') || adjustedExpenses[0];
      const baseCost = cateringItem ? cateringItem.estimatedCostMinor : 200000;
      const rushSurchargeMinor = Math.round(baseCost * 0.2); // +20% rush replacement fee

      costDeltaMinor = rushSurchargeMinor;

      if (cateringItem) {
        cateringItem.estimatedCostMinor += rushSurchargeMinor;
        cateringItem.status = 'quoted';
        cateringItem.notes = `Replacement vendor quote (includes 20% emergency rush scheduling fee)`;
      } else {
        adjustedExpenses.push({
          id: `sim-rush-${Date.now()}`,
          categoryId: 'catering',
          name: 'Emergency Replacement Vendor (Rush Booking)',
          estimatedCostMinor: rushSurchargeMinor,
          actualCostMinor: null,
          paidMinor: 0,
          status: 'quoted',
          priority: 'must_have',
          notes: 'Replacement vendor quote includes rush scheduling fee',
        });
      }

      proposedAdjustments.push({
        description: `Emergency replacement surcharge (+20% rush on ${cateringItem ? cateringItem.name : 'Primary Service'})`,
        costDeltaMinor: rushSurchargeMinor,
      });

      recommendations.push(
        'Immediately request non-performance deposit refund from the cancelling vendor.',
        'Keep 2 vetted backup vendors on your standby vendor checklist.',
        'Verify replacement contract covers identical equipment and staffing ratios.'
      );

      riskLevel = 'high';
      break;
    }

    case 'date_change': {
      title = 'Event Date Rescheduling (+30 Days)';
      description = 'Evaluates re-contracting admin fees and date change fees across booked suppliers.';
      affectedCategories.push('venue', 'logistics');

      // Typical rebooking fees: venue admin fee $300 + vendor calendar change fees $250
      const venueFeeMinor = 30000;
      const vendorFeesMinor = 25000;
      costDeltaMinor = venueFeeMinor + vendorFeesMinor;

      adjustedExpenses.push({
        id: `sim-date-${Date.now()}`,
        categoryId: 'venue',
        name: 'Venue & Vendor Rescheduling Administration Fees',
        estimatedCostMinor: costDeltaMinor,
        actualCostMinor: null,
        paidMinor: 0,
        status: 'planned',
        priority: 'must_have',
        notes: 'Contract amendment fees for moving calendar date',
      });

      proposedAdjustments.push(
        { description: 'Venue administrative calendar transfer fee', costDeltaMinor: venueFeeMinor },
        { description: 'Photographer & entertainment date-hold adjustment', costDeltaMinor: vendorFeesMinor }
      );

      recommendations.push(
        'Verify vendor availability for the alternative date before signing contract amendments.',
        'Issue a digital "Change of Date" update to all invited guests immediately.',
        'Check whether permits need to be re-filed with local municipal offices.'
      );

      riskLevel = 'medium';
      break;
    }

    case 'dietary_requirements': {
      title = 'Specialty Dietary & Allergen Protocols';
      description = 'Models 20% of guests requiring specialized gourmet preparation (celiac, vegan, halal, nut-free).';
      affectedCategories.push('catering');

      const specialtyGuests = Math.max(2, Math.round(event.guestCount * 0.2));
      const specialtyPerHeadMinor = 1500; // $15 per specialized meal
      costDeltaMinor = specialtyGuests * specialtyPerHeadMinor;

      const cateringItem = adjustedExpenses.find((e) => e.categoryId === 'catering');
      if (cateringItem) {
        cateringItem.estimatedCostMinor += costDeltaMinor;
      } else {
        adjustedExpenses.push({
          id: `sim-diet-${Date.now()}`,
          categoryId: 'catering',
          name: `Specialty Dietary & Allergen Catering (${specialtyGuests} custom meals)`,
          estimatedCostMinor: costDeltaMinor,
          actualCostMinor: null,
          paidMinor: 0,
          status: 'planned',
          priority: 'must_have',
          notes: 'Specialized dietary allergen protocol',
        });
      }

      proposedAdjustments.push({
        description: `Specialized culinary preparation (${specialtyGuests} custom meals @ ${formatCurrencyMinor(specialtyPerHeadMinor, event.currency)})`,
        costDeltaMinor,
      });

      recommendations.push(
        'Collect detailed allergy disclosures on your RSVP form.',
        'Request separated food station or sealed culinary boxes to prevent cross-contact.',
        'Label all buffet food placards with universal allergen icons.'
      );

      riskLevel = 'low';
      break;
    }
  }

  const summaryAfter = calculateBudgetSummary(event, adjustedExpenses);
  const contingencyImpactMinor = Math.min(
    summaryBefore.contingencyReserveMinor,
    Math.max(0, costDeltaMinor)
  );

  return {
    scenarioType,
    title,
    description,
    costDeltaMinor,
    affectedCategories,
    riskLevel,
    contingencyImpactMinor,
    summaryBefore,
    summaryAfter,
    proposedAdjustments,
    adjustedExpenses,
    recommendations,
  };
}

/**
 * Atomically applies an approved scenario to the active expenses list.
 * Pure function: returns a new updated array without mutating the original.
 */
export function applyScenarioAdjustments(
  currentExpenses: ExpenseItem[],
  scenarioImpact: ScenarioImpact
): ExpenseItem[] {
  return JSON.parse(JSON.stringify(scenarioImpact.adjustedExpenses));
}
