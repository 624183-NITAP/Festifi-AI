import { describe, expect, it } from 'vitest';
import {
  areTaskDependenciesSatisfied,
  calculateDeadline,
  calculateTimelineProgress,
  daysBetween,
  deriveTasksFromEvent,
  isLeapYear,
  isValidIsoDate,
} from '@/domain/timeline';
import { EventDetails, TimelineTask } from '@/domain/types';

describe('Timeline Engine — Dates, Leap Years, Milestones & Progress', () => {
  it('correctly identifies leap years according to Gregorian rules', () => {
    expect(isLeapYear(2024)).toBe(true);
    expect(isLeapYear(2000)).toBe(true);
    expect(isLeapYear(2028)).toBe(true);

    expect(isLeapYear(2023)).toBe(false);
    expect(isLeapYear(2025)).toBe(false);
    expect(isLeapYear(1900)).toBe(false); // Century year not divisible by 400
    expect(isLeapYear(2100)).toBe(false);
  });

  it('validates genuine calendar dates and rejects invalid leap days or out-of-range dates', () => {
    expect(isValidIsoDate('2024-02-29')).toBe(true); // Valid leap year
    expect(isValidIsoDate('2023-02-29')).toBe(false); // Invalid leap day in non-leap year
    expect(isValidIsoDate('2024-04-31')).toBe(false); // April has 30 days
    expect(isValidIsoDate('2024-13-01')).toBe(false); // Invalid month 13
    expect(isValidIsoDate('invalid-date')).toBe(false);
  });

  it('calculates deadlines correctly crossing month and year boundaries with zero timezone skew', () => {
    // 15 days before March 1, 2024 (leap year: Feb has 29 days)
    // March 1 is day 61, 61 - 15 = day 46 => Feb 15
    expect(calculateDeadline('2024-03-01', 15)).toBe('2024-02-15');

    // 15 days before March 1, 2023 (non-leap: Feb has 28 days)
    // 60 - 15 = day 45 => Feb 14
    expect(calculateDeadline('2023-03-01', 15)).toBe('2023-02-14');

    // Boundary crossing over New Year: 10 days before Jan 5, 2025 => Dec 26, 2024
    expect(calculateDeadline('2025-01-05', 10)).toBe('2024-12-26');
  });

  it('computes elapsed calendar days between two ISO dates', () => {
    expect(daysBetween('2026-01-01', '2026-01-10')).toBe(9);
    expect(daysBetween('2024-02-28', '2024-03-01')).toBe(2); // 2024 has Feb 29
    expect(daysBetween('2023-02-28', '2023-03-01')).toBe(1);
  });

  it('derives tasks customized to event type and compresses schedule when planning window is short', () => {
    const weddingEvent: EventDetails = {
      id: 'ev-wed-1',
      title: 'Romantic Summer Wedding',
      type: 'wedding',
      theme: 'Botanical Garden',
      targetDate: '2027-06-15',
      guestCount: 150,
      currency: 'USD',
      totalBudgetMinor: 3500000,
      contingencyPercentage: 10,
      createdAt: '2026-10-20T00:00:00.000Z',
      updatedAt: '2026-10-20T00:00:00.000Z',
    };

    const tasks = deriveTasksFromEvent(weddingEvent, '2026-10-20');
    expect(tasks.length).toBeGreaterThan(5);

    const venueTask = tasks.find((t) => t.category === 'venue');
    expect(venueTask).toBeDefined();
    expect(venueTask?.title).toContain('Venue');
    expect(isValidIsoDate(venueTask!.deadline)).toBe(true);

    // Compressed timeline test: event in 10 days
    const rushEvent: EventDetails = {
      ...weddingEvent,
      id: 'ev-rush-1',
      targetDate: '2026-10-30',
    };
    const rushTasks = deriveTasksFromEvent(rushEvent, '2026-10-20');
    // None of the deadlines should be past the event date
    for (const t of rushTasks) {
      expect(t.deadline <= rushEvent.targetDate).toBe(true);
    }
  });

  it('evaluates task dependency satisfaction accurately', () => {
    const tasks: TimelineTask[] = [
      {
        id: 'task-1',
        title: 'Book Venue',
        description: '',
        category: 'venue',
        deadline: '2026-11-01',
        daysBeforeEvent: 30,
        completed: false,
        priority: 'must_have',
        dependencies: [],
        milestone: '1 Month Before',
      },
      {
        id: 'task-2',
        title: 'Send Invitations',
        description: '',
        category: 'invitations',
        deadline: '2026-11-15',
        daysBeforeEvent: 15,
        completed: false,
        priority: 'must_have',
        dependencies: ['task-1'],
        milestone: '2 Weeks Before',
      },
    ];

    // task-2 depends on task-1 which is incomplete
    expect(areTaskDependenciesSatisfied(tasks[1], tasks)).toBe(false);

    // Complete task-1
    tasks[0].completed = true;
    expect(areTaskDependenciesSatisfied(tasks[1], tasks)).toBe(true);
  });

  it('calculates timeline progress and identifies overdue tasks without errors', () => {
    const tasks: TimelineTask[] = [
      {
        id: 't1',
        title: 'Task Done',
        description: '',
        category: 'general',
        deadline: '2026-10-10',
        daysBeforeEvent: 10,
        completed: true,
        priority: 'must_have',
        dependencies: [],
        milestone: 'Milestone 1',
      },
      {
        id: 't2',
        title: 'Overdue Task',
        description: '',
        category: 'venue',
        deadline: '2026-10-15',
        daysBeforeEvent: 5,
        completed: false,
        priority: 'must_have',
        dependencies: [],
        milestone: 'Milestone 1',
      },
      {
        id: 't3',
        title: 'Future Pending Task',
        description: '',
        category: 'catering',
        deadline: '2026-10-30',
        daysBeforeEvent: 0,
        completed: false,
        priority: 'must_have',
        dependencies: [],
        milestone: 'Milestone 2',
      },
    ];

    // Reference date = 2026-10-20
    const progress = calculateTimelineProgress(tasks, '2026-10-20');

    expect(progress.totalTasks).toBe(3);
    expect(progress.completedTasks).toBe(1);
    expect(progress.overdueTasks).toBe(1);
    expect(progress.pendingTasks).toBe(2);
    expect(progress.completionPercentage).toBe(33);
  });
});
