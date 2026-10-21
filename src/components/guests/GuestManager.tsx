'use client';

import React, { useState } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle,
  Clock,
  Edit3,
  Filter,
  Mail,
  Phone,
  Plus,
  Search,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  UserX,
  Utensils,
  X,
} from 'lucide-react';
import {
  ALL_DIETARY_OPTIONS,
  calculateGuestStats,
  DIETARY_LABELS,
} from '@/domain/guests';
import {
  DietaryRestriction,
  EventDetails,
  GuestRecord,
  RsvpStatus,
} from '@/domain/types';

interface GuestManagerProps {
  event: EventDetails;
  guests: GuestRecord[];
  onUpdateGuests: (newGuests: GuestRecord[]) => void;
  onOpenInvitationPreview: () => void;
}

export const GuestManager: React.FC<GuestManagerProps> = ({
  event,
  guests,
  onUpdateGuests,
  onOpenInvitationPreview,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingGuest, setEditingGuest] = useState<GuestRecord | null>(null);

  // Form State
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [rsvpStatus, setRsvpStatus] = useState<RsvpStatus>('pending');
  const [dietary, setDietary] = useState<DietaryRestriction>('none');
  const [dietaryNotes, setDietaryNotes] = useState<string>('');
  const [plusOne, setPlusOne] = useState<boolean>(false);
  const [tableAssignment, setTableAssignment] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  const stats = calculateGuestStats(guests);

  const filteredGuests = guests.filter((g) => {
    if (filterStatus !== 'all' && g.rsvpStatus !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = g.fullName.toLowerCase().includes(q);
      const matchEmail = g.email.toLowerCase().includes(q);
      const matchNotes = (g.dietaryNotes || '').toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchNotes) return false;
    }
    return true;
  });

  const handleOpenAddModal = () => {
    setEditingGuest(null);
    setFullName('');
    setEmail('');
    setPhone('');
    setRsvpStatus('pending');
    setDietary('none');
    setDietaryNotes('');
    setPlusOne(false);
    setTableAssignment('');
    setFormError(null);
    setShowAddModal(true);
  };

  const handleOpenEditModal = (guest: GuestRecord) => {
    setEditingGuest(guest);
    setFullName(guest.fullName);
    setEmail(guest.email);
    setPhone(guest.phone || '');
    setRsvpStatus(guest.rsvpStatus);
    setDietary(guest.dietaryPreference);
    setDietaryNotes(guest.dietaryNotes || '');
    setPlusOne(guest.plusOne);
    setTableAssignment(guest.tableAssignment || '');
    setFormError(null);
    setShowAddModal(true);
  };

  const handleSaveGuest = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!fullName.trim()) {
      setFormError('Guest name is required.');
      return;
    }

    if (editingGuest) {
      const updated = guests.map((g) =>
        g.id === editingGuest.id
          ? {
              ...g,
              fullName: fullName.trim(),
              email: email.trim(),
              phone: phone.trim(),
              rsvpStatus,
              dietaryPreference: dietary,
              dietaryNotes: dietaryNotes.trim(),
              plusOne,
              tableAssignment: tableAssignment.trim(),
              updatedAt: new Date().toISOString(),
            }
          : g
      );
      onUpdateGuests(updated);
    } else {
      const newGuest: GuestRecord = {
        id: `g-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        rsvpStatus,
        dietaryPreference: dietary,
        dietaryNotes: dietaryNotes.trim(),
        plusOne,
        tableAssignment: tableAssignment.trim(),
        invitationSent: false,
        updatedAt: new Date().toISOString(),
      };
      onUpdateGuests([...guests, newGuest]);
    }

    setShowAddModal(false);
  };

  const handleDeleteGuest = (id: string) => {
    onUpdateGuests(guests.filter((g) => g.id !== id));
  };

  const handleQuickStatusChange = (id: string, newStatus: RsvpStatus) => {
    const updated = guests.map((g) =>
      g.id === id ? { ...g, rsvpStatus: newStatus, updatedAt: new Date().toISOString() } : g
    );
    onUpdateGuests(updated);
  };

  const getDietaryBadgeStyle = (diet: DietaryRestriction) => {
    switch (diet) {
      case 'vegan':
      case 'vegetarian':
        return { background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' };
      case 'gluten_free':
        return { background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)' };
      case 'nut_allergy':
        return { background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)' };
      case 'halal':
      case 'kosher':
        return { background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)' };
      case 'dairy_free':
        return { background: 'rgba(192, 132, 252, 0.15)', color: '#c084fc', border: '1px solid rgba(192, 132, 252, 0.3)' };
      default:
        return { background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-muted)' };
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff' }}>
            Guest List &amp; RSVP Tracking
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Real-time attendance tracking, plus-one accounting, and dietary allergen safeguards.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onOpenInvitationPreview}
            aria-label="Preview Digital Invitation Card"
          >
            <Mail size={16} aria-hidden="true" />
            <span>Preview Invitation</span>
          </button>

          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleOpenAddModal}
            aria-label="Add new guest"
          >
            <UserPlus size={16} aria-hidden="true" />
            <span>Add Guest</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <section
        aria-label="Guest RSVP Statistics"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}
      >
        <div className="glass-card" style={{ padding: '18px', borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.825rem' }}>
            <span>Total Invited</span>
            <Users size={18} color="#94a3b8" aria-hidden="true" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff', margin: '6px 0 2px' }}>
            {stats.totalInvited}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Target: {event.guestCount} capacity
          </span>
        </div>

        <div className="glass-card" style={{ padding: '18px', borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.825rem' }}>
            <span>Confirmed Attending</span>
            <UserCheck size={18} color="#34d399" aria-hidden="true" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#34d399', margin: '6px 0 2px' }}>
            {stats.attending}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            +{stats.plusOnesCount} plus-ones = {stats.totalExpectedHeadcount} total seats
          </span>
        </div>

        <div className="glass-card" style={{ padding: '18px', borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.825rem' }}>
            <span>Awaiting RSVP</span>
            <Clock size={18} color="#f59e0b" aria-hidden="true" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fbbf24', margin: '6px 0 2px' }}>
            {stats.pending}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Response rate: {stats.responseRatePercentage}%
          </span>
        </div>

        <div className="glass-card" style={{ padding: '18px', borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)', fontSize: '0.825rem' }}>
            <span>Dietary Restrictions</span>
            <Utensils size={18} color="#ec4899" aria-hidden="true" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ec4899', margin: '6px 0 2px' }}>
            {Object.entries(stats.dietaryBreakdown)
              .filter(([key, count]) => key !== 'none' && count > 0)
              .reduce((acc, [, c]) => acc + c, 0)}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Special meals required
          </span>
        </div>
      </section>

      {/* Filter and Search Bar */}
      <div
        className="glass-card"
        style={{
          padding: '16px 20px',
          borderRadius: '14px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        {/* Status Filters */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }} role="tablist" aria-label="Filter guests by RSVP">
          {['all', 'attending', 'pending', 'declined'].map((st) => (
            <button
              key={st}
              type="button"
              className={`btn ${filterStatus === st ? 'btn-gold' : 'btn-secondary'} btn-sm`}
              onClick={() => setFilterStatus(st)}
              style={{ textTransform: 'capitalize' }}
            >
              {st === 'all' ? `All Guests (${guests.length})` : `${st} (${guests.filter((g) => g.rsvpStatus === st).length})`}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative', minWidth: '220px' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} aria-hidden="true" />
          <input
            type="text"
            className="input-field"
            placeholder="Search by name, email, dietary..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '36px', height: '36px', fontSize: '0.85rem' }}
            aria-label="Search guest list"
          />
        </div>
      </div>

      {/* Guest Table */}
      <section className="glass-card" style={{ padding: '0', borderRadius: '18px', overflow: 'hidden' }}>
        <div className="table-container">
          <table className="data-table" aria-label="Event Guest List">
            <thead>
              <tr>
                <th scope="col">Guest Name</th>
                <th scope="col">RSVP Status</th>
                <th scope="col">Dietary Preference</th>
                <th scope="col">Plus-One</th>
                <th scope="col">Table</th>
                <th scope="col" style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredGuests.length > 0 ? (
                filteredGuests.map((guest) => {
                  const dietBadge = getDietaryBadgeStyle(guest.dietaryPreference);
                  return (
                    <tr key={guest.id}>
                      {/* Name & Contact */}
                      <td>
                        <strong style={{ fontSize: '0.925rem', color: '#ffffff', display: 'block' }}>
                          {guest.fullName}
                        </strong>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {guest.email && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Mail size={12} aria-hidden="true" />
                              {guest.email}
                            </span>
                          )}
                          {guest.phone && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Phone size={12} aria-hidden="true" />
                              {guest.phone}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* RSVP Status with Quick Toggle */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span
                            className={`badge ${
                              guest.rsvpStatus === 'attending'
                                ? 'badge-confirmed'
                                : guest.rsvpStatus === 'declined'
                                ? 'badge-overdue'
                                : 'badge-pending'
                            }`}
                            style={{ textTransform: 'capitalize' }}
                          >
                            {guest.rsvpStatus}
                          </span>
                          <div style={{ display: 'flex', gap: '2px' }}>
                            {guest.rsvpStatus !== 'attending' && (
                              <button
                                type="button"
                                className="btn-icon"
                                onClick={() => handleQuickStatusChange(guest.id, 'attending')}
                                title="Mark Attending"
                                aria-label={`Mark ${guest.fullName} attending`}
                              >
                                <Check size={14} color="#34d399" />
                              </button>
                            )}
                            {guest.rsvpStatus !== 'declined' && (
                              <button
                                type="button"
                                className="btn-icon"
                                onClick={() => handleQuickStatusChange(guest.id, 'declined')}
                                title="Mark Declined"
                                aria-label={`Mark ${guest.fullName} declined`}
                              >
                                <X size={14} color="#f87171" />
                              </button>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Dietary Requirement */}
                      <td>
                        <div>
                          <span className="badge" style={dietBadge}>
                            {DIETARY_LABELS[guest.dietaryPreference]}
                          </span>
                          {guest.dietaryNotes && (
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                              Note: {guest.dietaryNotes}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Plus-One */}
                      <td>
                        <span style={{ fontSize: '0.85rem', color: guest.plusOne ? '#34d399' : 'var(--text-muted)' }}>
                          {guest.plusOne ? '+1 Allowed' : 'Individual'}
                        </span>
                      </td>

                      {/* Table Assignment */}
                      <td>
                        <span style={{ fontSize: '0.85rem', color: guest.tableAssignment ? '#ffffff' : 'var(--text-muted)' }}>
                          {guest.tableAssignment || 'Unassigned'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            type="button"
                            className="btn-icon"
                            onClick={() => handleOpenEditModal(guest)}
                            aria-label={`Edit ${guest.fullName}`}
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            type="button"
                            className="btn-icon text-danger"
                            onClick={() => handleDeleteGuest(guest.id)}
                            aria-label={`Delete ${guest.fullName}`}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-secondary)' }}>
                    No guests found matching the selected filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Add / Edit Guest Modal */}
      {showAddModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="guest-modal-title">
          <div className="modal-content animate-fade-in" style={{ maxWidth: '520px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 id="guest-modal-title" style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                {editingGuest ? 'Edit Guest Record' : 'Add New Guest'}
              </h3>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setShowAddModal(false)}
                aria-label="Close guest dialog"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>

            {formError && (
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '10px 14px', borderRadius: '10px', color: '#fca5a5', fontSize: '0.85rem', marginBottom: '16px' }} role="alert">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveGuest} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="input-label" htmlFor="guest-name">Full Name *</label>
                <input
                  id="guest-name"
                  type="text"
                  className="input-field"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Dr. Jordan Hayes"
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="input-label" htmlFor="guest-email">Email Address</label>
                  <input
                    id="guest-email"
                    type="email"
                    className="input-field"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jordan@example.com"
                  />
                </div>
                <div>
                  <label className="input-label" htmlFor="guest-phone">Phone Number</label>
                  <input
                    id="guest-phone"
                    type="tel"
                    className="input-field"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 555-019-0022"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="input-label" htmlFor="guest-rsvp">RSVP Status</label>
                  <select
                    id="guest-rsvp"
                    className="select-field"
                    value={rsvpStatus}
                    onChange={(e) => setRsvpStatus(e.target.value as RsvpStatus)}
                  >
                    <option value="pending">Pending</option>
                    <option value="attending">Attending</option>
                    <option value="declined">Declined</option>
                  </select>
                </div>
                <div>
                  <label className="input-label" htmlFor="guest-table">Table Assignment</label>
                  <input
                    id="guest-table"
                    type="text"
                    className="input-field"
                    value={tableAssignment}
                    onChange={(e) => setTableAssignment(e.target.value)}
                    placeholder="e.g. Table 3 (Orchid)"
                  />
                </div>
              </div>

              <div>
                <label className="input-label" htmlFor="guest-diet">Dietary Requirement</label>
                <select
                  id="guest-diet"
                  className="select-field"
                  value={dietary}
                  onChange={(e) => setDietary(e.target.value as DietaryRestriction)}
                >
                  {ALL_DIETARY_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {DIETARY_LABELS[opt]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="input-label" htmlFor="guest-notes">Dietary Notes / Allergy Severity</label>
                <input
                  id="guest-notes"
                  type="text"
                  className="input-field"
                  value={dietaryNotes}
                  onChange={(e) => setDietaryNotes(e.target.value)}
                  placeholder="e.g. Severe peanut contact allergy; requires gluten-free cookware"
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0' }}>
                <input
                  id="guest-plus-one"
                  type="checkbox"
                  checked={plusOne}
                  onChange={(e) => setPlusOne(e.target.checked)}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--accent-gold)' }}
                />
                <label htmlFor="guest-plus-one" style={{ fontSize: '0.875rem', cursor: 'pointer' }}>
                  Includes Plus-One guest seating (+1)
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-gold">
                  {editingGuest ? 'Save Changes' : 'Add Guest'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
