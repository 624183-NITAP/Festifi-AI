'use client';

import React, { useState } from 'react';
import {
  Clock,
  Edit3,
  Mail,
  Phone,
  Search,
  Trash2,
  UserCheck,
  UserPlus,
  UserX,
} from 'lucide-react';
import {
  calculateGuestStats,
  DIETARY_LABELS,
} from '@/domain/guests';
import {
  DietaryRestriction,
  EventDetails,
  GuestRecord,
  RsvpStatus,
} from '@/domain/types';
import { GuestFormModal } from './GuestFormModal';
import { GuestStatsCards } from './GuestStatsCards';

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
    setShowAddModal(true);
  };

  const handleOpenEditModal = (guest: GuestRecord) => {
    setEditingGuest(guest);
    setShowAddModal(true);
  };

  const handleSaveGuest = (saved: Omit<GuestRecord, 'id'> | GuestRecord) => {
    if ('id' in saved && saved.id) {
      const updated = guests.map((g) => (g.id === saved.id ? (saved as GuestRecord) : g));
      onUpdateGuests(updated);
    } else {
      const newGuest: GuestRecord = {
        ...saved,
        id: `g-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      };
      onUpdateGuests([...guests, newGuest]);
    }
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
      <GuestStatsCards
        stats={stats}
        targetCapacity={event.guestCount}
      />

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
                                ? 'badge-declined'
                                : 'badge-pending'
                            }`}
                            style={{ textTransform: 'capitalize' }}
                          >
                            {guest.rsvpStatus}
                          </span>

                          <div style={{ display: 'inline-flex', gap: '4px' }}>
                            {guest.rsvpStatus !== 'attending' && (
                              <button
                                type="button"
                                className="btn-icon text-success"
                                onClick={() => handleQuickStatusChange(guest.id, 'attending')}
                                title="Mark as Attending"
                                aria-label={`Mark ${guest.fullName} as attending`}
                              >
                                <UserCheck size={14} />
                              </button>
                            )}
                            {guest.rsvpStatus !== 'declined' && (
                              <button
                                type="button"
                                className="btn-icon text-danger"
                                onClick={() => handleQuickStatusChange(guest.id, 'declined')}
                                title="Mark as Declined"
                                aria-label={`Mark ${guest.fullName} as declined`}
                              >
                                <UserX size={14} />
                              </button>
                            )}
                            {guest.rsvpStatus !== 'pending' && (
                              <button
                                type="button"
                                className="btn-icon"
                                onClick={() => handleQuickStatusChange(guest.id, 'pending')}
                                title="Reset to Pending"
                                aria-label={`Reset ${guest.fullName} to pending`}
                              >
                                <Clock size={14} />
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
        <GuestFormModal
          editingGuest={editingGuest}
          onClose={() => setShowAddModal(false)}
          onSave={handleSaveGuest}
        />
      )}
    </div>
  );
};
