/**
 * FestiFi AI — Core Timeline & Scheduling Engine
 * Pure, deterministic date derivations, leap-year handling,
 * milestone calculations, dependency tracking, and timezone safety.
 */

import { EventDetails, EventType, PriorityLevel, TimelineProgress, TimelineTask } from '../types';

/**
 * Checks if a given year is a Gregorian leap year.
 */
export function isLeapYear(year: number): boolean {
  if (!Number.isInteger(year) || year <= 0) return false;
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Validates whether an ISO YYYY-MM-DD string is a mathematically genuine calendar day.
 */
export function isValidIsoDate(dateString: string): boolean {
  if (!/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(dateString)) {
    return false;
  }
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

/**
 * Calculates a task deadline ISO string by subtracting `daysBefore` from the event date.
 * Uses strict UTC arithmetic to eliminate daylight savings time shifts and timezone skew.
 */
export function calculateDeadline(eventDateIso: string, daysBefore: number): string {
  if (!isValidIsoDate(eventDateIso)) {
    throw new Error(`Invalid event date: "${eventDateIso}"`);
  }

  const [year, month, day] = eventDateIso.split('-').map(Number);
  const eventUtc = Date.UTC(year, month - 1, day);
  const targetUtc = eventUtc - Math.round(daysBefore) * 86400000;

  const targetDate = new Date(targetUtc);
  const y = targetDate.getUTCFullYear();
  const m = String(targetDate.getUTCMonth() + 1).padStart(2, '0');
  const d = String(targetDate.getUTCDate()).padStart(2, '0');

  return `${y}-${m}-${d}`;
}

/**
 * Computes calendar days between two ISO dates (dateB - dateA).
 */
export function daysBetween(dateA: string, dateB: string): number {
  if (!isValidIsoDate(dateA) || !isValidIsoDate(dateB)) {
    throw new Error('Both dates must be valid ISO YYYY-MM-DD format');
  }
  const [y1, m1, d1] = dateA.split('-').map(Number);
  const [y2, m2, d2] = dateB.split('-').map(Number);

  const utcA = Date.UTC(y1, m1 - 1, d1);
  const utcB = Date.UTC(y2, m2 - 1, d2);

  return Math.round((utcB - utcA) / 86400000);
}

/**
 * Formats a date for accessible human-readable display.
 */
export function formatDateReadable(dateIso: string): string {
  if (!isValidIsoDate(dateIso)) return dateIso;
  const [year, month, day] = dateIso.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/**
 * Checks whether all prerequisite dependency tasks have been completed.
 */
export function areTaskDependenciesSatisfied(
  task: TimelineTask,
  allTasks: TimelineTask[]
): boolean {
  if (!task.dependencies || task.dependencies.length === 0) return true;
  const completedIds = new Set(
    allTasks.filter((t) => t.completed).map((t) => t.id)
  );
  return task.dependencies.every((depId) => completedIds.has(depId));
}

/**
 * Computes current progress statistics across all timeline tasks.
 */
export function calculateTimelineProgress(
  tasks: TimelineTask[],
  referenceDateIso: string = new Date().toISOString().split('T')[0]
): TimelineProgress {
  const totalTasks = tasks.length;
  if (totalTasks === 0) {
    return {
      totalTasks: 0,
      completedTasks: 0,
      pendingTasks: 0,
      overdueTasks: 0,
      completionPercentage: 0,
    };
  }

  let completedTasks = 0;
  let overdueTasks = 0;

  for (const task of tasks) {
    if (task.completed) {
      completedTasks += 1;
    } else if (isValidIsoDate(task.deadline) && isValidIsoDate(referenceDateIso)) {
      if (task.deadline < referenceDateIso) {
        overdueTasks += 1;
      }
    }
  }

  const pendingTasks = totalTasks - completedTasks;
  const completionPercentage = Math.round((completedTasks / totalTasks) * 100);

  return {
    totalTasks,
    completedTasks,
    pendingTasks,
    overdueTasks,
    completionPercentage,
  };
}

/**
 * Sorts tasks chronologically by deadline date (earliest first).
 */
export function sortTasksChronologically(tasks: TimelineTask[]): TimelineTask[] {
  return [...tasks].sort((a, b) => a.deadline.localeCompare(b.deadline));
}

interface TaskBlueprint {
  id: string;
  title: string;
  description: string;
  category: TimelineTask['category'];
  daysBeforeNormal: number;
  priority: PriorityLevel;
  milestone: string;
  dependencies: string[];
}

/**
 * Derives comprehensive, actionable event planning tasks tailored to event type.
 * Automatically adapts for compressed planning horizons (e.g. event in 2 weeks vs 6 months).
 */
export function deriveTasksFromEvent(
  event: EventDetails,
  todayIso: string = new Date().toISOString().split('T')[0]
): TimelineTask[] {
  const rawAvailable = isValidIsoDate(todayIso) && isValidIsoDate(event.targetDate)
    ? daysBetween(todayIso, event.targetDate)
    : 180;
  const availableDays = Math.max(0, rawAvailable);

  const blueprints: Record<EventType, TaskBlueprint[]> = {
    wedding: [
      { id: 't-wed-1', title: 'Define Vision & Guest List Draft', description: 'Establish guest count range and key priorities', category: 'general', daysBeforeNormal: 180, priority: 'must_have', milestone: '6 Months Before', dependencies: [] },
      { id: 't-wed-2', title: 'Secure Ceremony & Reception Venue', description: 'Inspect venue contracts, rain backup rules, deposit terms', category: 'venue', daysBeforeNormal: 150, priority: 'must_have', milestone: '5 Months Before', dependencies: ['t-wed-1'] },
      { id: 't-wed-3', title: 'Book Catering & Tasting Session', description: 'Sample menu items, confirm allergy protocols, beverage packages', category: 'catering', daysBeforeNormal: 120, priority: 'must_have', milestone: '4 Months Before', dependencies: ['t-wed-2'] },
      { id: 't-wed-4', title: 'Hire Photographer & Videographer', description: 'Review portfolio, timeline coverage, and shot lists', category: 'photography', daysBeforeNormal: 100, priority: 'must_have', milestone: '3 Months Before', dependencies: ['t-wed-2'] },
      { id: 't-wed-5', title: 'Send Invitations & RSVP Portal', description: 'Mail physical or digital invites, track dietary preferences', category: 'invitations', daysBeforeNormal: 60, priority: 'must_have', milestone: '2 Months Before', dependencies: ['t-wed-2'] },
      { id: 't-wed-6', title: 'Finalize Entertainment & Song Lists', description: 'Review playlist, processional music, and speech equipment', category: 'entertainment', daysBeforeNormal: 30, priority: 'nice_to_have', milestone: '1 Month Before', dependencies: [] },
      { id: 't-wed-7', title: 'Confirm Floral & Decor Setup Plan', description: 'Table arrangements, ceremony arch, lighting install time', category: 'decor', daysBeforeNormal: 21, priority: 'nice_to_have', milestone: '3 Weeks Before', dependencies: ['t-wed-2'] },
      { id: 't-wed-8', title: 'Final Headcount to Caterer & Venue', description: 'Lock in final attendee number and table seating chart', category: 'catering', daysBeforeNormal: 14, priority: 'must_have', milestone: '2 Weeks Before', dependencies: ['t-wed-3', 't-wed-5'] },
      { id: 't-wed-9', title: 'Rehearsal & Emergency Kit Preparation', description: 'Run walkthrough with bridal party; pack emergency items', category: 'general', daysBeforeNormal: 2, priority: 'must_have', milestone: 'Week Of', dependencies: ['t-wed-8'] },
      { id: 't-wed-10', title: 'Day-Of Coordination & Vendor Balance Payouts', description: 'Disburse final payments and celebrate smoothly', category: 'logistics', daysBeforeNormal: 0, priority: 'must_have', milestone: 'Day Of', dependencies: ['t-wed-9'] },
    ],
    birthday: [
      { id: 't-bday-1', title: 'Select Birthday Theme & Guest List', description: 'Define party vibe, color palette, and invited friends/family', category: 'general', daysBeforeNormal: 45, priority: 'must_have', milestone: '6 Weeks Before', dependencies: [] },
      { id: 't-bday-2', title: 'Reserve Venue or Space Arrangement', description: 'Book party hall, restaurant private room, or backyard setup', category: 'venue', daysBeforeNormal: 30, priority: 'must_have', milestone: '1 Month Before', dependencies: ['t-bday-1'] },
      { id: 't-bday-3', title: 'Order Custom Cake & Food Catering', description: 'Choose signature birthday cake design and specialty food platters', category: 'catering', daysBeforeNormal: 21, priority: 'must_have', milestone: '3 Weeks Before', dependencies: ['t-bday-2'] },
      { id: 't-bday-4', title: 'Send Invitations & Collect RSVPs', description: 'Distribute party invites and note allergy restrictions', category: 'invitations', daysBeforeNormal: 18, priority: 'must_have', milestone: '2 Weeks Before', dependencies: ['t-bday-2'] },
      { id: 't-bday-5', title: 'Book DJ / Entertainment or Games', description: 'Confirm playlist, party host, or interactive activities', category: 'entertainment', daysBeforeNormal: 14, priority: 'nice_to_have', milestone: '2 Weeks Before', dependencies: [] },
      { id: 't-bday-6', title: 'Purchase Decor, Balloons & Party Favors', description: 'Balloons, centerpieces, photo-booth props, gift bags', category: 'decor', daysBeforeNormal: 7, priority: 'nice_to_have', milestone: '1 Week Before', dependencies: ['t-bday-1'] },
      { id: 't-bday-7', title: 'Day-Of Venue Setup & Celebration', description: 'Decorate venue, welcome guests, and capture memories', category: 'logistics', daysBeforeNormal: 0, priority: 'must_have', milestone: 'Day Of', dependencies: ['t-bday-6'] },
    ],
    community: [
      { id: 't-comm-1', title: 'Form Committee & Define Community Goal', description: 'Establish purpose, expected attendees, and community impact', category: 'general', daysBeforeNormal: 90, priority: 'must_have', milestone: '3 Months Before', dependencies: [] },
      { id: 't-comm-2', title: 'Secure Municipal Permits & Venue Authorization', description: 'File park/street permits, insurance, and safety clearance', category: 'permits', daysBeforeNormal: 75, priority: 'must_have', milestone: '2.5 Months Before', dependencies: ['t-comm-1'] },
      { id: 't-comm-3', title: 'Recruit Community Food Stalls & Vendors', description: 'Onboard local food trucks, craft artisans, and sponsors', category: 'catering', daysBeforeNormal: 60, priority: 'must_have', milestone: '2 Months Before', dependencies: ['t-comm-2'] },
      { id: 't-comm-4', title: 'Arrange Stage, AV & Sound System', description: 'Microphones, power generators, sound technician booking', category: 'entertainment', daysBeforeNormal: 45, priority: 'must_have', milestone: '6 Weeks Before', dependencies: ['t-comm-2'] },
      { id: 't-comm-5', title: 'Launch Local Marketing & Flyers', description: 'Social media campaign, flyers at libraries/cafes, bulletin posts', category: 'invitations', daysBeforeNormal: 30, priority: 'must_have', milestone: '1 Month Before', dependencies: ['t-comm-3'] },
      { id: 't-comm-6', title: 'Volunteer Briefing & First Aid Setup', description: 'Assign volunteer stations, trash cleanup schedule, emergency plan', category: 'logistics', daysBeforeNormal: 7, priority: 'must_have', milestone: '1 Week Before', dependencies: ['t-comm-2'] },
      { id: 't-comm-7', title: 'Event Day Execution & Community Wrap-Up', description: 'Oversee festival operations, stage schedule, and park cleanup', category: 'logistics', daysBeforeNormal: 0, priority: 'must_have', milestone: 'Day Of', dependencies: ['t-comm-6'] },
    ],
    corporate: [
      { id: 't-corp-1', title: 'Define Event Objectives & Executive Approval', description: 'Align keynote topics, budget ceiling, and target outcomes', category: 'general', daysBeforeNormal: 90, priority: 'must_have', milestone: '3 Months Before', dependencies: [] },
      { id: 't-corp-2', title: 'Book Conference Center & Hotel Block', description: 'Conference hall, breakout rooms, and guest room allocations', category: 'venue', daysBeforeNormal: 75, priority: 'must_have', milestone: '2.5 Months Before', dependencies: ['t-corp-1'] },
      { id: 't-corp-3', title: 'Confirm Keynote Speakers & AV Setup', description: 'Technical riders, stage lighting, live-streaming equipment', category: 'entertainment', daysBeforeNormal: 50, priority: 'must_have', milestone: '7 Weeks Before', dependencies: ['t-corp-2'] },
      { id: 't-corp-4', title: 'Publish Agenda & Attendee Registration', description: 'Digital ticketing, badge print roster, dietary capture', category: 'invitations', daysBeforeNormal: 35, priority: 'must_have', milestone: '5 Weeks Before', dependencies: ['t-corp-2'] },
      { id: 't-corp-5', title: 'Contract Corporate Catering & Coffee Breaks', description: 'Working lunch, continuous beverage service, VIP dinner', category: 'catering', daysBeforeNormal: 20, priority: 'must_have', milestone: '3 Weeks Before', dependencies: ['t-corp-2'] },
      { id: 't-corp-6', title: 'Print Signage, Badges & Event Swag', description: 'Banners, sponsor backdrops, attendee welcome bags', category: 'decor', daysBeforeNormal: 10, priority: 'nice_to_have', milestone: '1.5 Weeks Before', dependencies: ['t-corp-4'] },
      { id: 't-corp-7', title: 'Event Day Execution & Live Coordination', description: 'Speaker green room, timekeeping, networking session management', category: 'logistics', daysBeforeNormal: 0, priority: 'must_have', milestone: 'Day Of', dependencies: ['t-corp-5'] },
    ],
    anniversary: [
      { id: 't-anni-1', title: 'Select Anniversary Theme & Story Elements', description: 'Gather milestone photos, choose dinner format, and guest list', category: 'general', daysBeforeNormal: 60, priority: 'must_have', milestone: '2 Months Before', dependencies: [] },
      { id: 't-anni-2', title: 'Reserve Intimate Venue or Banquet Room', description: 'Confirm private dining room or garden venue', category: 'venue', daysBeforeNormal: 45, priority: 'must_have', milestone: '6 Weeks Before', dependencies: ['t-anni-1'] },
      { id: 't-anni-3', title: 'Design Multi-Course Dinner & Toast Menu', description: 'Fine dining wine pairings, celebration cake, champagne toast', category: 'catering', daysBeforeNormal: 30, priority: 'must_have', milestone: '1 Month Before', dependencies: ['t-anni-2'] },
      { id: 't-anni-4', title: 'Create Retrospective Slideshow & Music', description: 'Curate couple retrospective video, acoustic musicians', category: 'entertainment', daysBeforeNormal: 15, priority: 'nice_to_have', milestone: '2 Weeks Before', dependencies: [] },
      { id: 't-anni-5', title: 'Send Personalized Invitations', description: 'Invite close friends and family, capture RSVPs', category: 'invitations', daysBeforeNormal: 25, priority: 'must_have', milestone: '3.5 Weeks Before', dependencies: ['t-anni-2'] },
      { id: 't-anni-6', title: 'Day-Of Celebration & Toast', description: 'Enjoy commemorative evening with loved ones', category: 'logistics', daysBeforeNormal: 0, priority: 'must_have', milestone: 'Day Of', dependencies: ['t-anni-3'] },
    ],
    baby_shower: [
      { id: 't-baby-1', title: 'Determine Baby Shower Theme & Registry', description: 'Pick theme, color palette, and baby gift registry link', category: 'general', daysBeforeNormal: 45, priority: 'must_have', milestone: '6 Weeks Before', dependencies: [] },
      { id: 't-baby-2', title: 'Reserve Venue or Living Space', description: 'Confirm venue or home host arrangement', category: 'venue', daysBeforeNormal: 35, priority: 'must_have', milestone: '5 Weeks Before', dependencies: ['t-baby-1'] },
      { id: 't-baby-3', title: 'Send Invites & Collect RSVPs', description: 'Digital or postal invitations with registry details', category: 'invitations', daysBeforeNormal: 25, priority: 'must_have', milestone: '3.5 Weeks Before', dependencies: ['t-baby-2'] },
      { id: 't-baby-4', title: 'Order Brunch / Tea Catering & Sweets', description: 'Finger foods, mocktails, custom dessert table', category: 'catering', daysBeforeNormal: 20, priority: 'must_have', milestone: '3 Weeks Before', dependencies: ['t-baby-2'] },
      { id: 't-baby-5', title: 'Prepare Shower Games & Keepsake Book', description: 'Advice cards, baby trivia, guest signature frame', category: 'entertainment', daysBeforeNormal: 10, priority: 'nice_to_have', milestone: '1.5 Weeks Before', dependencies: [] },
      { id: 't-baby-6', title: 'Host Shower & Celebrate Parents-to-be', description: 'Welcome guests, enjoy games, open gifts', category: 'logistics', daysBeforeNormal: 0, priority: 'must_have', milestone: 'Day Of', dependencies: ['t-baby-4'] },
    ],
    other: [
      { id: 't-oth-1', title: 'Establish Event Concept & Goals', description: 'Define expected outcome and guest roster', category: 'general', daysBeforeNormal: 30, priority: 'must_have', milestone: '1 Month Before', dependencies: [] },
      { id: 't-oth-2', title: 'Lock Location & Rental Equipment', description: 'Reserve venue, chairs, tables, and lighting', category: 'venue', daysBeforeNormal: 21, priority: 'must_have', milestone: '3 Weeks Before', dependencies: ['t-oth-1'] },
      { id: 't-oth-3', title: 'Arrange Food, Drinks & Hospitality', description: 'Confirm food service style and menu options', category: 'catering', daysBeforeNormal: 14, priority: 'must_have', milestone: '2 Weeks Before', dependencies: ['t-oth-2'] },
      { id: 't-oth-4', title: 'Distribute Invitations & Track RSVPs', description: 'Send details to all invited guests', category: 'invitations', daysBeforeNormal: 12, priority: 'must_have', milestone: '1.5 Weeks Before', dependencies: ['t-oth-2'] },
      { id: 't-oth-5', title: 'Event Day Setup & Execution', description: 'Manage setup and enjoy the celebration', category: 'logistics', daysBeforeNormal: 0, priority: 'must_have', milestone: 'Day Of', dependencies: ['t-oth-3'] },
    ],
  };

  const list = blueprints[event.type] || blueprints.other;
  const maxNormalDays = Math.max(...list.map((b) => b.daysBeforeNormal), 1);

  // Compress schedule gracefully if time remaining is less than standard planning cycle
  const scale = availableDays > 0 && availableDays < maxNormalDays
    ? (availableDays * 0.85) / maxNormalDays
    : availableDays === 0
    ? 0
    : 1;

  return list.map((blueprint) => {
    let scaledDaysBefore = blueprint.daysBeforeNormal === 0
      ? 0
      : Math.round(blueprint.daysBeforeNormal * scale);

    // Ensure scaled days never pushes the deadline earlier than today when planning window is compressed
    if (availableDays > 0) {
      scaledDaysBefore = Math.min(availableDays, Math.max(0, scaledDaysBefore));
    } else {
      scaledDaysBefore = 0;
    }

    const deadline = calculateDeadline(event.targetDate, scaledDaysBefore);

    return {
      id: `${event.id}-${blueprint.id}`,
      title: blueprint.title,
      description: blueprint.description,
      category: blueprint.category,
      deadline,
      daysBeforeEvent: scaledDaysBefore,
      completed: false,
      completedAt: null,
      priority: blueprint.priority,
      dependencies: blueprint.dependencies.map((dep) => `${event.id}-${dep}`),
      milestone: blueprint.milestone,
    };
  });
}
