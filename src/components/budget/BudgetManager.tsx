'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle,
  DollarSign,
  Edit3,
  Filter,
  Layers,
  PieChart,
  Plus,
  Sparkles,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import {
  CATEGORY_NAMES,
  applyBudgetAlternative,
  calculateBudgetSummary,
  formatCurrencyMinor,
  generateBudgetAlternatives,
  parseDecimalToMinor,
} from '@/domain/budget';
import {
  BudgetAlternativeOption,
  BudgetCategory,
  BudgetTier,
  EventDetails,
  ExpenseItem,
  PriorityLevel,
} from '@/domain/types';

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

  // Form state for add/edit modal
  const [formCategory, setFormCategory] = useState<BudgetCategory>('venue');
  const [formName, setFormName] = useState<string>('');
  const [formCostDecimal, setFormCostDecimal] = useState<string>('1000.00');
  const [formPriority, setFormPriority] = useState<PriorityLevel>('must_have');
  const [formNotes, setFormNotes] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  const budgetSummary = calculateBudgetSummary(event, expenses);

  const filteredExpenses = expenses.filter((item) => {
    if (filterCategory !== 'all' && item.categoryId !== filterCategory) return false;
    if (filterPriority !== 'all' && item.priority !== filterPriority) return false;
    return true;
  });

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormCategory('venue');
    setFormName('');
    setFormCostDecimal('1000.00');
    setFormPriority('must_have');
    setFormNotes('');
    setFormError(null);
    setShowAddModal(true);
  };

  const handleOpenEditModal = (item: ExpenseItem) => {
    setEditingItem(item);
    setFormCategory(item.categoryId);
    setFormName(item.name);
    setFormCostDecimal((item.estimatedCostMinor / 100).toFixed(2));
    setFormPriority(item.priority);
    setFormNotes(item.notes || '');
    setFormError(null);
    setShowAddModal(true);
  };

  const handleSaveExpense = (e: React.FormEvent) => {
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
      // Update existing item
      const updated = expenses.map((item) =>
        item.id === editingItem.id
          ? {
              ...item,
              categoryId: formCategory,
              name: formName.trim(),
              estimatedCostMinor: costMinor,
              priority: formPriority,
              notes: formNotes.trim(),
            }
          : item
      );
      onUpdateExpenses(updated);
    } else {
      // Create new item
      const newItem: ExpenseItem = {
        id: `exp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        categoryId: formCategory,
        name: formName.trim(),
        estimatedCostMinor: costMinor,
        actualCostMinor: null,
        paidMinor: 0,
        status: 'planned',
        priority: formPriority,
        notes: formNotes.trim(),
      };
      onUpdateExpenses([...expenses, newItem]);
    }

    setShowAddModal(false);
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

  // Color map for donut chart segments
  const categoryColors: Record<BudgetCategory, string> = {
    venue: '#f59e0b',
    catering: '#10b981',
    entertainment: '#8b5cf6',
    photography: '#06b6d4',
    decor: '#ec4899',
    attire: '#a855f7',
    invitations: '#3b82f6',
    logistics: '#eab308',
    miscellaneous: '#64748b',
  };

  // Compute SVG Donut Chart Slices
  let accumulatedAngle = 0;
  const nonZeroCategories = budgetSummary.categoryBreakdown.filter((c) => c.allocatedMinor > 0);
  const totalAllocated = budgetSummary.plannedMinor + budgetSummary.confirmedMinor;

  const donutSlices = nonZeroCategories.map((cat) => {
    const fraction = totalAllocated > 0 ? cat.allocatedMinor / totalAllocated : 0;
    const angle = fraction * 360;
    const startAngle = accumulatedAngle;
    accumulatedAngle += angle;

    const x1 = 100 + 70 * Math.cos((Math.PI * (startAngle - 90)) / 180);
    const y1 = 100 + 70 * Math.sin((Math.PI * (startAngle - 90)) / 180);
    const x2 = 100 + 70 * Math.cos((Math.PI * (startAngle + angle - 90)) / 180);
    const y2 = 100 + 70 * Math.sin((Math.PI * (startAngle + angle - 90)) / 180);

    const largeArc = angle > 180 ? 1 : 0;
    const pathData =
      angle >= 359.9
        ? `M 100 30 A 70 70 0 1 1 99.9 30`
        : `M 100 100 L ${x1} ${y1} A 70 70 0 ${largeArc} 1 ${x2} ${y2} Z`;

    return {
      categoryId: cat.categoryId,
      name: cat.categoryName,
      color: categoryColors[cat.categoryId] || '#64748b',
      percentage: ((cat.allocatedMinor / (totalAllocated || 1)) * 100).toFixed(1),
      amount: formatCurrencyMinor(cat.allocatedMinor, event.currency),
      pathData,
    };
  });

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
      <section
        className="glass-card"
        style={{ padding: '24px', borderRadius: '18px' }}
        aria-labelledby="planning-alternatives-heading"
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={20} color="var(--accent-gold)" aria-hidden="true" />
            <h3 id="planning-alternatives-heading" style={{ fontSize: '1.15rem', fontWeight: 700 }}>
              Planning Alternatives (Economical • Balanced • Premium)
            </h3>
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Deterministic financial modeling across 3 tier scopes
          </span>
        </div>

        {(() => {
          const alternatives = generateBudgetAlternatives(event, expenses);
          const tiers: BudgetTier[] = ['economical', 'balanced', 'premium'];

          return (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
              {tiers.map((tKey) => {
                const alt = alternatives[tKey];
                const isSelected = selectedTier === tKey;
                const isBalanced = tKey === 'balanced';
                const isPremium = tKey === 'premium';

                return (
                  <div
                    key={tKey}
                    style={{
                      background: isSelected ? 'rgba(245, 158, 11, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                      border: isSelected
                        ? '2px solid var(--accent-gold)'
                        : '1px solid var(--border-subtle)',
                      borderRadius: '14px',
                      padding: '18px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '14px',
                      boxShadow: isSelected ? '0 0 15px rgba(245, 158, 11, 0.2)' : undefined,
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span
                          className="badge"
                          style={{
                            background: isBalanced ? 'rgba(56, 189, 248, 0.2)' : isPremium ? 'rgba(192, 132, 252, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                            color: isBalanced ? '#38bdf8' : isPremium ? '#c084fc' : '#34d399',
                            textTransform: 'capitalize',
                          }}
                        >
                          {alt.tier}
                        </span>
                        {isBalanced && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--accent-gold)', fontWeight: 700 }}>
                            RECOMMENDED
                          </span>
                        )}
                      </div>

                      <strong style={{ fontSize: '1.05rem', color: '#ffffff', display: 'block' }}>
                        {alt.name}
                      </strong>
                      <p style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', margin: '4px 0 12px' }}>
                        {alt.subtitle}
                      </p>

                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff' }}>
                        {formatCurrencyMinor(alt.totalEstimatedMinor, event.currency)}
                      </div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Contingency: {formatCurrencyMinor(alt.contingencyReserveMinor, event.currency)}
                      </span>

                      <ul style={{ margin: '12px 0 0 16px', fontSize: '0.775rem', color: 'var(--text-secondary)' }}>
                        {alt.keyHighlights.map((hl, i) => (
                          <li key={i} style={{ marginBottom: '4px' }}>{hl}</li>
                        ))}
                      </ul>
                    </div>

                    <button
                      type="button"
                      className={`btn ${isSelected ? 'btn-gold' : 'btn-secondary'} btn-sm`}
                      onClick={() => {
                        setSelectedTier(tKey);
                        const updated = applyBudgetAlternative(expenses, alt);
                        onUpdateExpenses(updated);
                        setTierAppliedMessage(`Applied ${alt.name} planning alternative to current expenses!`);
                        setTimeout(() => setTierAppliedMessage(null), 4000);
                      }}
                      style={{ width: '100%' }}
                    >
                      <Check size={14} aria-hidden="true" />
                      <span>{isSelected ? 'Currently Selected' : `Apply ${alt.name}`}</span>
                    </button>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </section>

      {/* Visual Category Breakdown: Donut Chart + Accessible Data Table */}
      <section
        className="glass-card"
        style={{ padding: '24px', borderRadius: '18px' }}
        aria-labelledby="budget-breakdown-heading"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <PieChart size={20} color="var(--accent-gold)" aria-hidden="true" />
          <h3 id="budget-breakdown-heading" style={{ fontSize: '1.15rem', fontWeight: 700 }}>
            Category Distribution & Allocations
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', alignItems: 'center' }}>
          {/* SVG Donut Chart */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }} aria-hidden="true">
            <svg width="200" height="200" viewBox="0 0 200 200" style={{ transform: 'rotate(0deg)' }}>
              {donutSlices.length > 0 ? (
                donutSlices.map((slice, idx) => (
                  <path
                    key={idx}
                    d={slice.pathData}
                    fill={slice.color}
                    opacity="0.85"
                    stroke="#111827"
                    strokeWidth="2"
                  >
                    <title>{`${slice.name}: ${slice.percentage}% (${slice.amount})`}</title>
                  </path>
                ))
              ) : (
                <circle cx="100" cy="100" r="70" fill="rgba(255,255,255,0.05)" stroke="var(--border-subtle)" strokeWidth="2" />
              )}
              {/* Inner cutout for donut aesthetic */}
              <circle cx="100" cy="100" r="45" fill="#111827" />
              <text x="100" y="96" textAnchor="middle" fill="var(--text-secondary)" fontSize="10" fontWeight="600">
                COMMITTED
              </text>
              <text x="100" y="112" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="800">
                {formatCurrencyMinor(totalAllocated, event.currency)}
              </text>
            </svg>
          </div>

          {/* Accessible Table representation of chart */}
          <div className="data-table-container">
            <table className="data-table" aria-label="Category Budget Allocations and Percentages">
              <thead>
                <tr>
                  <th scope="col">Category</th>
                  <th scope="col">Items</th>
                  <th scope="col">Allocated</th>
                  <th scope="col">% of Budget</th>
                </tr>
              </thead>
              <tbody>
                {budgetSummary.categoryBreakdown.map((cat) => (
                  <tr key={cat.categoryId}>
                    <td style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          width: '10px',
                          height: '10px',
                          borderRadius: '50%',
                          backgroundColor: categoryColors[cat.categoryId],
                          display: 'inline-block',
                        }}
                        aria-hidden="true"
                      />
                      <strong>{cat.categoryName}</strong>
                    </td>
                    <td>{cat.itemCount}</td>
                    <td>{formatCurrencyMinor(cat.allocatedMinor, event.currency)}</td>
                    <td>{cat.percentageOfBudget}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

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
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <div className="modal-content animate-fade-in">
            <h3 id="modal-title" style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '18px' }}>
              {editingItem ? 'Edit Expense Item' : 'Add New Expense Item'}
            </h3>

            <form onSubmit={handleSaveExpense}>
              {formError && (
                <div style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '16px' }} role="alert">
                  {formError}
                </div>
              )}

              <div className="form-group">
                <label htmlFor="exp-category" className="form-label">Budget Category</label>
                <select
                  id="exp-category"
                  className="form-select"
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as BudgetCategory)}
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
                    onChange={(e) => setFormPriority(e.target.value as PriorityLevel)}
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
                  onClick={() => setShowAddModal(false)}
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
      )}
    </div>
  );
};
