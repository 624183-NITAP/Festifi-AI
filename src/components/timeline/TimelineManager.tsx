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
} from 'lucide-react';
import {
  areTaskDependenciesSatisfied,
  calculateTimelineProgress,
  formatDateReadable,
} from '@/domain/timeline';
import { EventDetails, TimelineTask } from '@/domain/types';
import { TaskFormModal } from './TaskFormModal';

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
    setShowAddModal(true);
  };

  const handleOpenEditModal = (task: TimelineTask) => {
    setEditingTask(task);
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

  const handleSaveTask = (saved: Omit<TimelineTask, 'id'> | TimelineTask) => {
    if ('id' in saved && saved.id) {
      const updated = tasks.map((t) => (t.id === saved.id ? (saved as TimelineTask) : t));
      onUpdateTasks(updated);
    } else {
      const newTask: TimelineTask = {
        ...saved,
        id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      };
      onUpdateTasks([...tasks, newTask]);
    }
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
          aria-label="Add new timeline task"
        >
          <Plus size={16} aria-hidden="true" />
          <span>Add Task</span>
        </button>
      </div>

      {/* Progress Metric Banner */}
      <section
        className="glass-card"
        style={{ padding: '24px', borderRadius: '18px' }}
        aria-labelledby="timeline-progress-heading"
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
          <div>
            <h3 id="timeline-progress-heading" style={{ fontSize: '1.15rem', fontWeight: 700 }}>
              Timeline Execution Progress: {progress.completionPercentage}%
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {progress.completedTasks} of {progress.totalTasks} milestones completed
            </span>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            {progress.overdueTasks > 0 && (
              <span className="badge badge-must-have" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <AlertCircle size={14} aria-hidden="true" />
                <span>{progress.overdueTasks} Overdue</span>
              </span>
            )}
            <span className="badge" style={{ background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8' }}>
              {progress.pendingTasks} Pending
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div
          style={{
            height: '8px',
            background: 'rgba(255, 255, 255, 0.08)',
            borderRadius: '8px',
            overflow: 'hidden',
          }}
          role="progressbar"
          aria-valuenow={progress.completionPercentage}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            style={{
              height: '100%',
              width: `${progress.completionPercentage}%`,
              background: 'linear-gradient(to right, #f59e0b, #10b981)',
              borderRadius: '8px',
              transition: 'width 0.4s ease',
            }}
          />
        </div>
      </section>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }} role="tablist" aria-label="Filter timeline milestones">
        {(['all', 'pending', 'completed', 'overdue'] as const).map((filterKey) => (
          <button
            key={filterKey}
            type="button"
            className={`btn ${filterStatus === filterKey ? 'btn-gold' : 'btn-secondary'} btn-sm`}
            onClick={() => setFilterStatus(filterKey)}
            style={{ textTransform: 'capitalize' }}
          >
            {filterKey === 'all'
              ? `All Tasks (${tasks.length})`
              : `${filterKey} (${
                  filterKey === 'completed'
                    ? progress.completedTasks
                    : filterKey === 'pending'
                    ? progress.pendingTasks
                    : progress.overdueTasks
                })`}
          </button>
        ))}
      </div>

      {/* Grouped Milestone Sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {Array.from(milestoneMap.entries()).map(([milestoneName, mTasks]) => (
          <section
            key={milestoneName}
            className="glass-card"
            style={{ padding: '20px 24px', borderRadius: '16px' }}
            aria-labelledby={`milestone-${milestoneName.replace(/\s+/g, '-').toLowerCase()}`}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Clock size={18} color="var(--accent-gold)" aria-hidden="true" />
              <h3
                id={`milestone-${milestoneName.replace(/\s+/g, '-').toLowerCase()}`}
                style={{ fontSize: '1.05rem', fontWeight: 700 }}
              >
                {milestoneName}
              </h3>
              <span className="badge" style={{ marginLeft: 'auto', background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-muted)' }}>
                {mTasks.length} {mTasks.length === 1 ? 'Task' : 'Tasks'}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {mTasks.map((task) => {
                const depsOk = areTaskDependenciesSatisfied(task, tasks);
                const isOverdue = !task.completed && task.deadline < new Date().toISOString().split('T')[0];

                return (
                  <div
                    key={task.id}
                    style={{
                      background: task.completed
                        ? 'rgba(16, 185, 129, 0.04)'
                        : isOverdue
                        ? 'rgba(239, 68, 68, 0.04)'
                        : 'rgba(255, 255, 255, 0.02)',
                      border: task.completed
                        ? '1px solid rgba(16, 185, 129, 0.2)'
                        : isOverdue
                        ? '1px solid rgba(239, 68, 68, 0.3)'
                        : '1px solid var(--border-subtle)',
                      borderRadius: '12px',
                      padding: '14px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1', minWidth: '240px' }}>
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => handleToggleTask(task.id)}
                        style={{
                          width: '18px',
                          height: '18px',
                          accentColor: 'var(--accent-gold)',
                          cursor: 'pointer',
                        }}
                        aria-label={`Mark "${task.title}" as ${task.completed ? 'incomplete' : 'completed'}`}
                      />

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span
                            style={{
                              fontWeight: 600,
                              color: task.completed ? 'var(--text-muted)' : 'var(--text-primary)',
                              textDecoration: task.completed ? 'line-through' : 'none',
                            }}
                          >
                            {task.title}
                          </span>
                          <span className={`badge badge-${task.priority.replace(/_/g, '-')}`}>
                            {task.priority.replace(/_/g, ' ')}
                          </span>
                          {isOverdue && (
                            <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#f87171' }}>
                              Overdue
                            </span>
                          )}
                        </div>

                        {task.description && (
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                            {task.description}
                          </p>
                        )}

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                          <span>Target: {formatDateReadable(task.deadline)} ({task.daysBeforeEvent} days before)</span>
                          {!depsOk && (
                            <span style={{ color: '#fbbf24' }}>
                              Prerequisites incomplete
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
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
        <TaskFormModal
          event={event}
          editingTask={editingTask}
          onClose={() => setShowAddModal(false)}
          onSave={handleSaveTask}
        />
      )}
    </div>
  );
};
