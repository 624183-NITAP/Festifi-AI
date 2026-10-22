'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import {
  ALL_DIETARY_OPTIONS,
  DIETARY_LABELS,
} from '@/domain/guests';
import {
  DietaryRestriction,
  GuestRecord,
  isDietaryRestriction,
  isRsvpStatus,
  RsvpStatus,
} from '@/domain/types';

interface GuestFormModalProps {
  editingGuest: GuestRecord | null;
  onClose: () => void;
  onSave: (guest: Omit<GuestRecord, 'id'> | GuestRecord) => void;
}

export const GuestFormModal: React.FC<GuestFormModalProps> = ({
  editingGuest,
  onClose,
  onSave,
}) => {
  const [fullName, setFullName] = useState<string>(editingGuest?.fullName || '');
  const [email, setEmail] = useState<string>(editingGuest?.email || '');
  const [phone, setPhone] = useState<string>(editingGuest?.phone || '');
  const [rsvpStatus, setRsvpStatus] = useState<RsvpStatus>(editingGuest?.rsvpStatus || 'pending');
  const [dietary, setDietary] = useState<DietaryRestriction>(editingGuest?.dietaryPreference || 'none');
  const [dietaryNotes, setDietaryNotes] = useState<string>(editingGuest?.dietaryNotes || '');
  const [plusOne, setPlusOne] = useState<boolean>(editingGuest?.plusOne || false);
  const [tableAssignment, setTableAssignment] = useState<string>(editingGuest?.tableAssignment || '');
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!fullName.trim()) {
      setFormError('Guest name is required.');
      return;
    }

    if (editingGuest) {
      onSave({
        ...editingGuest,
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        rsvpStatus,
        dietaryPreference: dietary,
        dietaryNotes: dietaryNotes.trim(),
        plusOne,
        tableAssignment: tableAssignment.trim(),
        updatedAt: new Date().toISOString(),
      });
    } else {
      onSave({
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
      });
    }

    onClose();
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="guest-modal-title">
      <div className="modal-content animate-fade-in" style={{ maxWidth: '520px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <h3 id="guest-modal-title" style={{ fontSize: '1.2rem', fontWeight: 700 }}>
            {editingGuest ? 'Edit Guest Record' : 'Add New Guest'}
          </h3>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onClose}
            aria-label="Close guest dialog"
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

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
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
                onChange={(e) => {
                  const val = e.target.value;
                  if (isRsvpStatus(val)) setRsvpStatus(val);
                }}
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
              onChange={(e) => {
                const val = e.target.value;
                if (isDietaryRestriction(val)) setDietary(val);
              }}
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
              onClick={onClose}
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
  );
};
