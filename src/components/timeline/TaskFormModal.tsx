'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import {
  calculateDeadline,
  isValidIsoDate,
} from '@/domain/timeline';
import {
  EventDetails,
  isPriorityLevel,
  PriorityLevel,
  TimelineTask,
} from '@/domain/types';

interface TaskFormModalProps {
  event: EventDetails;
  editingTask: TimelineTask | null;
  onClose: () => void;
  onSave: (task: Omit<TimelineTask, 'id'> | TimelineTask) => void;
}

export const TaskFormModal: React.FC<TaskFormModalProps> = ({
  event,
  editingTask,
  onClose,
  onSave,
}) => {
  const [taskTitle, setTaskTitle] = useState<string>(editingTask?.title || '');
  const [taskDescription, setTaskDescription] = useState<string>(editingTask?.description || '');
  const [taskCategory, setTaskCategory] = useState<TimelineTask['category']>(editingTask?.category || 'general');
  const [taskDaysBefore, setTaskDaysBefore] = useState<number>(editingTask?.daysBeforeEvent ?? 30);
  const [taskPriority, setTaskPriority] = useState<PriorityLevel>(editingTask?.priority || 'must_have');
  const [taskMilestone, setTaskMilestone] = useState<string>(editingTask?.milestone || 'Key Milestone');
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
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
      onSave({
        ...editingTask,
        title: taskTitle.trim(),
        description: taskDescription.trim(),
        category: taskCategory,
        deadline,
        daysBeforeEvent: taskDaysBefore,
        priority: taskPriority,
        milestone: taskMilestone.trim() || 'Key Milestone',
      });
    } else {
      onSave({
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
      });
    }

    onClose();
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="task-modal-heading">
      <div className="modal-content animate-fade-in" style={{ maxWidth: '520px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <h3 id="task-modal-heading" style={{ fontSize: '1.25rem', fontWeight: 700 }}>
            {editingTask ? 'Edit Milestone Task' : 'Add Timeline Task'}
          </h3>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onClose}
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

        <form onSubmit={handleSubmit}>
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
                onChange={(e) => {
                  const val = e.target.value;
                  if (isPriorityLevel(val)) setTaskPriority(val);
                }}
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
              onClick={onClose}
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
  );
};
