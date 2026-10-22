'use client';

import React, { useState } from 'react';
import { CATEGORY_NAMES, parseDecimalToMinor } from '@/domain/budget';
import {
  BudgetCategory,
  EventDetails,
  ExpenseItem,
  isBudgetCategory,
  isPriorityLevel,
  PriorityLevel,
} from '@/domain/types';

interface ExpenseFormModalProps {
  event: EventDetails;
  editingItem: ExpenseItem | null;
  onClose: () => void;
  onSave: (expense: Omit<ExpenseItem, 'id'> | ExpenseItem) => void;
}

export const ExpenseFormModal: React.FC<ExpenseFormModalProps> = ({
  event,
  editingItem,
  onClose,
  onSave,
}) => {
  const [formCategory, setFormCategory] = useState<BudgetCategory>(
    editingItem?.categoryId || 'venue'
  );
  const [formName, setFormName] = useState<string>(editingItem?.name || '');
  const [formCostDecimal, setFormCostDecimal] = useState<string>(
    editingItem ? (editingItem.estimatedCostMinor / 100).toFixed(2) : '1000.00'
  );
  const [formPriority, setFormPriority] = useState<PriorityLevel>(
    editingItem?.priority || 'must_have'
  );
  const [formNotes, setFormNotes] = useState<string>(editingItem?.notes || '');
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formName.trim()) {
      setFormError('Expense name is required.');
      return;
    }

    let costMinor: number;
    try {
      costMinor = parseDecimalToMinor(formCostDecimal);
    } catch {
      setFormError('Please enter a valid, positive financial amount.');
      return;
    }

    if (editingItem) {
      onSave({
        ...editingItem,
        categoryId: formCategory,
        name: formName.trim(),
        estimatedCostMinor: costMinor,
        priority: formPriority,
        notes: formNotes.trim(),
      });
    } else {
      onSave({
        categoryId: formCategory,
        name: formName.trim(),
        estimatedCostMinor: costMinor,
        actualCostMinor: null,
        paidMinor: 0,
        status: 'planned',
        priority: formPriority,
        notes: formNotes.trim(),
      });
    }
    onClose();
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="expense-modal-title">
      <div className="modal-content animate-fade-in">
        <h3 id="expense-modal-title" style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '18px' }}>
          {editingItem ? 'Edit Expense Item' : 'Add New Expense Item'}
        </h3>

        <form onSubmit={handleSubmit}>
          {formError && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#f87171',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '0.85rem',
                marginBottom: '16px',
              }}
              role="alert"
            >
              {formError}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="exp-category" className="form-label">Budget Category</label>
            <select
              id="exp-category"
              className="form-select"
              value={formCategory}
              onChange={(e) => {
                const val = e.target.value;
                if (isBudgetCategory(val)) setFormCategory(val);
              }}
            >
              {Object.entries(CATEGORY_NAMES).map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="exp-name" className="form-label">Item / Service Name</label>
            <input
              id="exp-name"
              type="text"
              className="form-input"
              placeholder="e.g. Master of Ceremonies & DJ"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              maxLength={100}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label htmlFor="exp-cost" className="form-label">Estimated Cost ({event.currency})</label>
              <input
                id="exp-cost"
                type="number"
                step="0.01"
                min="0"
                className="form-input"
                value={formCostDecimal}
                onChange={(e) => setFormCostDecimal(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="exp-priority" className="form-label">Planning Priority</label>
              <select
                id="exp-priority"
                className="form-select"
                value={formPriority}
                onChange={(e) => {
                  const val = e.target.value;
                  if (isPriorityLevel(val)) setFormPriority(val);
                }}
              >
                <option value="must_have">Must-Have (Essential)</option>
                <option value="nice_to_have">Nice-To-Have (Enhancement)</option>
                <option value="optional">Optional (Stretch Goal)</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="exp-notes" className="form-label">Notes or Vendor Details (Optional)</label>
            <input
              id="exp-notes"
              type="text"
              className="form-input"
              placeholder="e.g. Package includes 4 hours of music and wireless mics"
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              maxLength={300}
            />
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
              {editingItem ? 'Save Changes' : 'Add Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
