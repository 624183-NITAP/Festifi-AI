'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle,
  DollarSign,
  Edit3,
  Filter,
  Plus,
  Trash2,
} from 'lucide-react';
import {
  CATEGORY_NAMES,
  calculateBudgetSummary,
  formatCurrencyMinor,
} from '@/domain/budget';
import {
  BudgetTier,
  EventDetails,
  ExpenseItem,
} from '@/domain/types';
import { BudgetDonutChart } from './BudgetDonutChart';
import { BudgetTierAlternatives } from './BudgetTierAlternatives';
import { ExpenseFormModal } from './ExpenseFormModal';

interface BudgetManagerProps {
  event: EventDetails;
  expenses: ExpenseItem[];
  onUpdateExpenses: (newExpenses: ExpenseItem[]) => void;
  onOpenOptimizerModal: () => void;
}

export const BudgetManager: React.FC<BudgetManagerProps> = ({
  event,
  expenses,
  onUpdateExpenses,
  onOpenOptimizerModal,
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<ExpenseItem | null>(null);
  const [selectedTier, setSelectedTier] = useState<BudgetTier>('balanced');
  const [tierAppliedMessage, setTierAppliedMessage] = useState<string | null>(null);

  const budgetSummary = calculateBudgetSummary(event, expenses);

  const filteredExpenses = expenses.filter((item) => {
    if (filterCategory !== 'all' && item.categoryId !== filterCategory) return false;
    if (filterPriority !== 'all' && item.priority !== filterPriority) return false;
    return true;
  });

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setShowAddModal(true);
  };

  const handleOpenEditModal = (item: ExpenseItem) => {
    setEditingItem(item);
    setShowAddModal(true);
  };

  const handleSaveExpense = (saved: Omit<ExpenseItem, 'id'> | ExpenseItem) => {
    if ('id' in saved && saved.id) {
      // Update existing item
      const updated = expenses.map((item) => (item.id === saved.id ? (saved as ExpenseItem) : item));
      onUpdateExpenses(updated);
    } else {
      // Create new item
      const newItem: ExpenseItem = {
        ...saved,
        id: `exp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      };
      onUpdateExpenses([...expenses, newItem]);
    }
  };

  const handleDeleteExpense = (id: string) => {
    onUpdateExpenses(expenses.filter((e) => e.id !== id));
  };

  const handleToggleConfirmed = (id: string) => {
    const updated = expenses.map((item) => {
      if (item.id === id) {
        if (item.status === 'planned' || item.status === 'quoted') {
          return {
            ...item,
            status: 'confirmed' as const,
            actualCostMinor: item.actualCostMinor !== null ? item.actualCostMinor : item.estimatedCostMinor,
          };
        }
        return { ...item, status: 'planned' as const };
      }
      return item;
    });
    onUpdateExpenses(updated);
  };

  const handleRecordPayment = (id: string) => {
    const item = expenses.find((e) => e.id === id);
    if (!item) return;

    const committed = item.actualCostMinor !== null ? item.actualCostMinor : item.estimatedCostMinor;
    const updated = expenses.map((e) =>
      e.id === id
        ? {
            ...e,
            paidMinor: committed,
            status: 'paid' as const,
          }
        : e
    );
    onUpdateExpenses(updated);
  };

  const handleApplyTier = (updatedExpenses: ExpenseItem[], tier: BudgetTier, message: string) => {
    setSelectedTier(tier);
    onUpdateExpenses(updatedExpenses);
    setTierAppliedMessage(message);
    setTimeout(() => setTierAppliedMessage(null), 4000);
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff' }}>
            Event Budget & Expense Manager
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Deterministic integer currency arithmetic with zero floating-point drift.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onOpenOptimizerModal}
            aria-label="Generate AI Budget Optimization Proposal"
          >
            <DollarSign size={16} aria-hidden="true" />
            <span>AI Budget Optimizer</span>
          </button>

          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleOpenAddModal}
            aria-label="Add new expense line item"
          >
            <Plus size={16} aria-hidden="true" />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* Over-Budget Alert Warning */}
      {budgetSummary.isOverBudget && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: '14px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
          role="alert"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AlertTriangle size={24} color="#f87171" aria-hidden="true" />
            <div>
              <strong style={{ fontSize: '0.95rem', color: '#fca5a5' }}>
                Budget Deficit Warning: Exceeds Total Ceiling
              </strong>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                Total committed expenses plus contingency ({formatCurrencyMinor(budgetSummary.plannedMinor + budgetSummary.confirmedMinor + budgetSummary.contingencyReserveMinor, event.currency)}) exceed available funding by {formatCurrencyMinor(Math.abs(budgetSummary.varianceMinor), event.currency)}.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-gold btn-sm"
            onClick={onOpenOptimizerModal}
          >
            <span>Resolve via AI Optimizer</span>
          </button>
        </div>
      )}

      {/* Tier Applied Notification */}
      {tierAppliedMessage && (
        <div
          style={{
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '10px',
            padding: '12px 16px',
            color: '#6ee7b7',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
          role="status"
        >
          <CheckCircle size={18} aria-hidden="true" />
          <span>{tierAppliedMessage}</span>
        </div>
      )}

      {/* 3-Tier Budget Planning Alternatives Section */}
      <BudgetTierAlternatives
        event={event}
        expenses={expenses}
        selectedTier={selectedTier}
        onApplyTier={handleApplyTier}
      />

      {/* Visual Category Breakdown: Donut Chart + Accessible Data Table */}
      <BudgetDonutChart
        event={event}
        budgetSummary={budgetSummary}
      />

      {/* Filter Toolbar */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          <Filter size={16} aria-hidden="true" />
          <span>Filters:</span>
        </div>

        {/* Category Filter */}
        <select
          className="form-select"
          style={{ width: 'auto', minHeight: '38px', padding: '6px 12px', fontSize: '0.85rem' }}
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          aria-label="Filter expenses by category"
        >
          <option value="all">All Categories ({expenses.length})</option>
          {Object.entries(CATEGORY_NAMES).map(([id, name]) => (
            <option key={id} value={id}>{name}</option>
          ))}
        </select>

        {/* Priority Filter */}
        <select
          className="form-select"
          style={{ width: 'auto', minHeight: '38px', padding: '6px 12px', fontSize: '0.85rem' }}
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          aria-label="Filter expenses by priority"
        >
          <option value="all">All Priorities</option>
          <option value="must_have">Must Have</option>
          <option value="nice_to_have">Nice To Have</option>
          <option value="optional">Optional</option>
        </select>
      </div>

      {/* Itemized Expenses Table */}
      <section className="glass-card" style={{ padding: '0', borderRadius: '16px', overflow: 'hidden' }} aria-labelledby="expenses-table-heading">
        <h3 id="expenses-table-heading" className="sr-only">
          Itemized Expenses
        </h3>

        <div className="data-table-container" style={{ border: 'none' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Category & Item</th>
                <th scope="col">Priority</th>
                <th scope="col">Status</th>
                <th scope="col">Estimated</th>
                <th scope="col">Actual / Confirmed</th>
                <th scope="col">Paid</th>
                <th scope="col" style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.length > 0 ? (
                filteredExpenses.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {item.name}
                        {item.isContingency && (
                          <span className="badge" style={{ marginLeft: '6px', background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24' }}>
                            Contingency
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        {CATEGORY_NAMES[item.categoryId]}
                        {item.notes ? ` • ${item.notes}` : ''}
                      </div>
                    </td>
                    <td>
                      <span className={`badge badge-${item.priority.replace(/_/g, '-')}`}>
                        {item.priority.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${item.status}`}>
                        {item.status}
                      </span>
                    </td>
                    <td>
                      {formatCurrencyMinor(item.estimatedCostMinor, event.currency)}
                    </td>
                    <td style={{ fontWeight: item.actualCostMinor !== null ? 700 : 400, color: item.actualCostMinor !== null ? '#34d399' : 'inherit' }}>
                      {item.actualCostMinor !== null
                        ? formatCurrencyMinor(item.actualCostMinor, event.currency)
                        : '—'}
                    </td>
                    <td>
                      {formatCurrencyMinor(item.paidMinor, event.currency)}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        {item.status !== 'confirmed' && item.status !== 'paid' && (
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '4px 8px', fontSize: '0.75rem', minHeight: '30px' }}
                            onClick={() => handleToggleConfirmed(item.id)}
                            title="Confirm contract with vendor"
                          >
                            <CheckCircle size={14} color="#34d399" aria-hidden="true" />
                            <span>Confirm</span>
                          </button>
                        )}
                        {item.paidMinor < (item.actualCostMinor || item.estimatedCostMinor) && (
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '4px 8px', fontSize: '0.75rem', minHeight: '30px' }}
                            onClick={() => handleRecordPayment(item.id)}
                            title="Mark as paid in full"
                          >
                            <DollarSign size={14} color="#38bdf8" aria-hidden="true" />
                            <span>Pay</span>
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '4px 8px', minHeight: '30px' }}
                          onClick={() => handleOpenEditModal(item)}
                          aria-label={`Edit ${item.name}`}
                        >
                          <Edit3 size={14} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          style={{ padding: '4px 8px', minHeight: '30px' }}
                          onClick={() => handleDeleteExpense(item.id)}
                          aria-label={`Delete ${item.name}`}
                        >
                          <Trash2 size={14} aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    No expenses match the selected filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Add / Edit Expense Modal Dialog */}
      {showAddModal && (
        <ExpenseFormModal
          event={event}
          editingItem={editingItem}
          onClose={() => setShowAddModal(false)}
          onSave={handleSaveExpense}
        />
      )}
    </div>
  );
};
