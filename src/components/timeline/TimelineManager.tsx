'use client';

import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Calendar,
  CheckCircle,
  Clock,
  Edit3,
  Filter,
  Plus,
  Trash2,
  AlertCircle,
  Sparkles,
  X,
} from 'lucide-react';
import {
  areTaskDependenciesSatisfied,
  calculateDeadline,
  calculateTimelineProgress,
  formatDateReadable,
  isValidIsoDate,
} from '@/domain/timeline';
import { BudgetCategory, EventDetails, PriorityLevel, TimelineTask } from '@/domain/types';

interface TimelineManagerProps {
  event: EventDetails;
  tasks: TimelineTask[];
  onUpdateTasks: (newTasks: TimelineTask[]) => void;
}

export const TimelineManager: React.FC<TimelineManagerProps> = ({
  event,
  tasks,
  onUpdateTasks,
}) => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed' | 'overdue'>('all');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingTask, setEditingTask] = useState<TimelineTask | null>(null);

  // Form state
  const [taskTitle, setTaskTitle] = useState<string>('');
  const [taskDescription, setTaskDescription] = useState<string>('');
  const [taskCategory, setTaskCategory] = useState<TimelineTask['category']>('general');
  const [taskDaysBefore, setTaskDaysBefore] = useState<number>(30);
  const [taskPriority, setTaskPriority] = useState<PriorityLevel>('must_have');
  const [taskMilestone, setTaskMilestone] = useState<string>('Key Milestone');
  const [formError, setFormError] = useState<string | null>(null);

  const progress = calculateTimelineProgress(tasks);

  const filteredTasks = tasks.filter((t) => {
    if (filterStatus === 'completed') return t.completed;
    if (filterStatus === 'pending') return !t.completed;
    if (filterStatus === 'overdue') {
      const today = new Date().toISOString().split('T')[0];
      return !t.completed && t.deadline < today;
    }
    return true;
  });

  const handleOpenAddModal = () => {
    setEditingTask(null);
    setTaskTitle('');
    setTaskDescription('');
    setTaskCategory('general');
    setTaskDaysBefore(30);
    setTaskPriority('must_have');
    setTaskMilestone('Key Milestone');
    setFormError(null);
    setShowAddModal(true);
  };

  const handleOpenEditModal = (task: TimelineTask) => {
    setEditingTask(task);
    setTaskTitle(task.title);
    setTaskDescription(task.description);
    setTaskCategory(task.category);
    setTaskDaysBefore(task.daysBeforeEvent);
    setTaskPriority(task.priority);
    setTaskMilestone(task.milestone);
    setFormError(null);
    setShowAddModal(true);
  };

  const handleToggleTask = (taskId: string) => {
    const target = tasks.find((t) => t.id === taskId);
    const willComplete = !target?.completed;

    const updated = tasks.map((t) =>
      t.id === taskId
        ? {
            ...t,
            completed: willComplete,
            completedAt: willComplete ? new Date().toISOString() : null,
          }
        : t
    );
    onUpdateTasks(updated);

    // Celebratory micro-animation when completing a task
    if (willComplete && typeof window !== 'undefined') {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#f59e0b', '#8b5cf6', '#10b981'],
        });
      } catch {
        // Safe fallback in test environments
      }
    }
  };

  const handleDeleteTask = (taskId: string) => {
    onUpdateTasks(tasks.filter((t) => t.id !== taskId));
  };

  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!taskTitle.trim()) {
      setFormError('Task title is required.');
      return;
    }

    if (taskDaysBefore < 0) {
      setFormError('Days before event cannot be negative (chronological violation: deadline cannot be after the event).');
      return;
    }

    if (!isValidIsoDate(event.targetDate)) {
      setFormError('Event target date is invalid.');
      return;
    }

    const deadline = calculateDeadline(event.targetDate, taskDaysBefore);

    if (editingTask) {
      const updated = tasks.map((t) =>
        t.id === editingTask.id
          ? {
              ...t,
              title: taskTitle.trim(),
              description: taskDescription.trim(),
              category: taskCategory,
              deadline,
              daysBeforeEvent: taskDaysBefore,
              priority: taskPriority,
              milestone: taskMilestone.trim() || 'Key Milestone',
            }
          : t
      );
      onUpdateTasks(updated);
    } else {
      const newTask: TimelineTask = {
        id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        title: taskTitle.trim(),
        description: taskDescription.trim(),
        category: taskCategory,
        deadline,
        daysBeforeEvent: taskDaysBefore,
        completed: false,
        completedAt: null,
        priority: taskPriority,
        dependencies: [],
        milestone: taskMilestone.trim() || 'Key Milestone',
      };
      onUpdateTasks([...tasks, newTask]);
    }

    setShowAddModal(false);
  };

  // Group filtered tasks by milestone
  const milestoneMap = new Map<string, TimelineTask[]>();
  for (const t of filteredTasks) {
    const m = t.milestone || 'Key Action Items';
    if (!milestoneMap.has(m)) {
      milestoneMap.set(m, []);
    }
    milestoneMap.get(m)!.push(t);
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff' }}>
            Event Timeline & Milestones
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Deterministic date calculations with leap-year and timezone resilience.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={handleOpenAddModal}
          aria-label="Add custom milestone task"
        >
          <Plus size={16} aria-hidden="true" />
          <span>Add Task</span>
        </button>
      </div>

      {/* Progress Bar & Metric Gauges */}
      <section
        className="glass-card"
        style={{ padding: '24px', borderRadius: '18px' }}
        aria-label="Timeline progress status"
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} color="var(--accent-gold)" aria-hidden="true" />
            <strong style={{ fontSize: '1rem', color: '#ffffff' }}>
              Overall Timeline Progress
            </strong>
          </div>
          <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#34d399' }}>
            {progress.completionPercentage}% Complete
          </span>
        </div>

        {/* Progress bar line */}
        <div
          style={{
            width: '100%',
            height: '10px',
            background: 'rgba(255, 255, 255, 0.08)',
            borderRadius: '999px',
            overflow: 'hidden',
            marginBottom: '16px',
          }}
          role="progressbar"
          aria-valuenow={progress.completionPercentage}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            style={{
              width: `${progress.completionPercentage}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #10b981 0%, #38bdf8 100%)',
              transition: 'width 0.4s ease',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', fontSize: '0.85rem' }}>
          <div>Total Tasks: <strong style={{ color: '#ffffff' }}>{progress.totalTasks}</strong></div>
          <div>Completed: <strong style={{ color: '#34d399' }}>{progress.completedTasks}</strong></div>
          <div>Pending: <strong style={{ color: '#60a5fa' }}>{progress.pendingTasks}</strong></div>
          {progress.overdueTasks > 0 && (
            <div>Overdue: <strong style={{ color: '#f87171' }}>{progress.overdueTasks}</strong></div>
          )}
        </div>
      </section>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
        <Filter size={16} color="var(--text-secondary)" aria-hidden="true" />
        {(['all', 'pending', 'completed', 'overdue'] as const).map((filter) => (
          <button
            key={filter}
            type="button"
            className={`btn btn-sm ${filterStatus === filter ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilterStatus(filter)}
            aria-pressed={filterStatus === filter}
          >
            {filter.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Grouped Tasks by Milestone */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {Array.from(milestoneMap.entries()).map(([milestone, items]) => (
          <section
            key={milestone}
            className="glass-card"
            style={{ padding: '22px', borderRadius: '16px' }}
            aria-labelledby={`milestone-${milestone.replace(/\s+/g, '-').toLowerCase()}`}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px' }}>
              <Calendar size={18} color="var(--accent-gold)" aria-hidden="true" />
              <h3
                id={`milestone-${milestone.replace(/\s+/g, '-').toLowerCase()}`}
                style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--accent-gold)' }}
              >
                {milestone}
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {items.map((task) => {
                const depsSatisfied = areTaskDependenciesSatisfied(task, tasks);
                const isOverdue = !task.completed && task.deadline < new Date().toISOString().split('T')[0];

                return (
                  <div
                    key={task.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: task.completed ? 'rgba(16, 185, 129, 0.05)' : 'rgba(15, 23, 42, 0.6)',
                      border: isOverdue ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid var(--border-subtle)',
                      borderRadius: '12px',
                      padding: '12px 16px',
                      gap: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => handleToggleTask(task.id)}
                        id={`check-${task.id}`}
                        style={{
                          width: '20px',
                          height: '20px',
                          cursor: 'pointer',
                          accentColor: 'var(--accent-gold)',
                        }}
                        aria-label={`Mark "${task.title}" as ${task.completed ? 'incomplete' : 'complete'}`}
                      />

                      <div>
                        <label
                          htmlFor={`check-${task.id}`}
                          style={{
                            fontWeight: 600,
                            fontSize: '0.925rem',
                            color: task.completed ? 'var(--text-muted)' : 'var(--text-primary)',
                            textDecoration: task.completed ? 'line-through' : 'none',
                            cursor: 'pointer',
                          }}
                        >
                          {task.title}
                        </label>

                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', marginTop: '4px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={12} aria-hidden="true" />
                            Target: {formatDateReadable(task.deadline)} ({task.daysBeforeEvent}d before)
                          </span>
                          <span className={`badge badge-${task.priority.replace(/_/g, '-')}`}>
                            {task.priority.replace(/_/g, ' ')}
                          </span>
                          {!depsSatisfied && (
                            <span style={{ color: '#f87171', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <AlertCircle size={12} aria-hidden="true" />
                              Prerequisites pending
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '4px 8px', minHeight: '30px' }}
                        onClick={() => handleOpenEditModal(task)}
                        aria-label={`Edit task ${task.title}`}
                      >
                        <Edit3 size={14} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        style={{ padding: '4px 8px', minHeight: '30px' }}
                        onClick={() => handleDeleteTask(task.id)}
                        aria-label={`Delete task ${task.title}`}
                      >
                        <Trash2 size={14} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      {/* Add / Edit Task Modal */}
      {showAddModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="task-modal-heading">
          <div className="modal-content animate-fade-in" style={{ maxWidth: '520px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 id="task-modal-heading" style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                {editingTask ? 'Edit Milestone Task' : 'Add Timeline Task'}
              </h3>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setShowAddModal(false)}
                aria-label="Close task dialog"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>

            {formError && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  color: '#fca5a5',
                  fontSize: '0.85rem',
                  marginBottom: '16px',
                }}
                role="alert"
              >
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveTask}>
              <div className="form-group">
                <label htmlFor="task-title" className="form-label">Task Title *</label>
                <input
                  id="task-title"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Schedule final floral walkthrough"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="task-desc" className="form-label">Description / Instructions</label>
                <input
                  id="task-desc"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Confirm table height and lighting setup with florist"
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="task-milestone" className="form-label">Milestone Group</label>
                <input
                  id="task-milestone"
                  type="text"
                  className="form-input"
                  placeholder="e.g. 1 Month Before"
                  value={taskMilestone}
                  onChange={(e) => setTaskMilestone(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label htmlFor="task-days" className="form-label">Days Before Event</label>
                  <input
                    id="task-days"
                    type="number"
                    min="0"
                    max="730"
                    className="form-input"
                    value={taskDaysBefore}
                    onChange={(e) => setTaskDaysBefore(Number(e.target.value))}
                    required
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                    Deadline: {isValidIsoDate(event.targetDate) ? calculateDeadline(event.targetDate, taskDaysBefore) : 'N/A'}
                  </span>
                </div>

                <div className="form-group">
                  <label htmlFor="task-priority" className="form-label">Priority</label>
                  <select
                    id="task-priority"
                    className="form-select"
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as PriorityLevel)}
                  >
                    <option value="must_have">Must-Have</option>
                    <option value="nice_to_have">Nice-To-Have</option>
                    <option value="optional">Optional</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingTask ? 'Save Changes' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
