'use client';

import React, { useEffect, useState } from 'react';
import {
  Calendar,
  Check,
  Copy,
  Download,
  Mail,
  MapPin,
  Sparkles,
  Users,
  Utensils,
  X,
} from 'lucide-react';
import { formatDateReadable } from '@/domain/timeline';
import { EventDetails } from '@/domain/types';

interface InvitationPreviewModalProps {
  event: EventDetails;
  onClose: () => void;
}

export const InvitationPreviewModal: React.FC<InvitationPreviewModalProps> = ({
  event,
  onClose,
}) => {
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [copiedText, setCopiedText] = useState<boolean>(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const [customNote, setCustomNote] = useState<string>(
    'Together with our families, we joyfully invite you to celebrate our special day with an evening of dinner, music, and botanical luminescence.'
  );

  const rsvpUrl = `https://festifi.ai/rsvp/${event.id}`;

  const invitationWording = [
    `YOU ARE CORDIALLY INVITED TO`,
    event.title.toUpperCase(),
    ``,
    `THEME: ${event.theme}`,
    `DATE: ${formatDateReadable(event.targetDate)}`,
    event.location ? `LOCATION: ${event.location}` : '',
    ``,
    `"${customNote}"`,
    ``,
    `DIETARY NOTICE:`,
    `Please let us know of any dietary restrictions or allergies during your RSVP.`,
    ``,
    `KINDLY RSVP ONLINE BY: 30 DAYS PRIOR`,
    `RSVP LINK: ${rsvpUrl}`,
  ].filter(Boolean).join('\n');

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(rsvpUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleCopyText = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(invitationWording);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    }
  };

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="invitation-modal-title"
    >
      <div
        className="modal-content animate-fade-in"
        style={{
          maxWidth: '680px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '0',
          overflow: 'hidden',
        }}
      >
        {/* Modal Top Bar */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-card)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Mail size={20} color="var(--accent-gold)" aria-hidden="true" />
            <h3 id="invitation-modal-title" style={{ fontSize: '1.2rem', fontWeight: 700 }}>
              Digital Invitation Preview
            </h3>
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onClose}
            aria-label="Close invitation preview dialog"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        {/* Modal Content Scroll */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Card Frame */}
          <div
            style={{
              background: 'linear-gradient(135deg, #090e17 0%, #151c2e 50%, #090e17 100%)',
              border: '2px solid rgba(245, 158, 11, 0.5)',
              borderRadius: '20px',
              padding: '36px 32px',
              textAlign: 'center',
              boxShadow: '0 0 30px rgba(245, 158, 11, 0.15), inset 0 0 20px rgba(245, 158, 11, 0.05)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Decorative Corner Ornaments */}
            <div
              style={{
                position: 'absolute',
                top: '12px',
                left: '12px',
                width: '24px',
                height: '24px',
                borderTop: '2px solid var(--accent-gold)',
                borderLeft: '2px solid var(--accent-gold)',
              }}
              aria-hidden="true"
            />
            <div
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                width: '24px',
                height: '24px',
                borderTop: '2px solid var(--accent-gold)',
                borderRight: '2px solid var(--accent-gold)',
              }}
              aria-hidden="true"
            />
            <div
              style={{
                position: 'absolute',
                bottom: '12px',
                left: '12px',
                width: '24px',
                height: '24px',
                borderBottom: '2px solid var(--accent-gold)',
                borderLeft: '2px solid var(--accent-gold)',
              }}
              aria-hidden="true"
            />
            <div
              style={{
                position: 'absolute',
                bottom: '12px',
                right: '12px',
                width: '24px',
                height: '24px',
                borderBottom: '2px solid var(--accent-gold)',
                borderRight: '2px solid var(--accent-gold)',
              }}
              aria-hidden="true"
            />

            <span
              style={{
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.2em',
                color: 'var(--accent-gold)',
                fontWeight: 700,
                display: 'block',
                marginBottom: '10px',
              }}
            >
              You Are Cordially Invited To Celebrate
            </span>

            <h2
              style={{
                fontSize: '2rem',
                fontWeight: 800,
                color: '#ffffff',
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
                marginBottom: '8px',
                background: 'linear-gradient(to right, #fbbf24, #f8fafc, #fbbf24)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {event.title}
            </h2>

            <span
              style={{
                fontSize: '0.85rem',
                color: '#94a3b8',
                display: 'block',
                fontStyle: 'italic',
                marginBottom: '24px',
              }}
            >
              &ldquo;{event.theme}&rdquo;
            </span>

            {/* Event Key Logistics */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                flexWrap: 'wrap',
                gap: '24px',
                padding: '16px 0',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                marginBottom: '24px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ffffff', fontSize: '0.95rem' }}>
                <Calendar size={18} color="var(--accent-gold)" aria-hidden="true" />
                <strong>{formatDateReadable(event.targetDate)}</strong>
              </div>

              {event.location && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ffffff', fontSize: '0.95rem' }}>
                  <MapPin size={18} color="#f43f5e" aria-hidden="true" />
                  <span>{event.location}</span>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ffffff', fontSize: '0.95rem' }}>
                <Users size={18} color="#38bdf8" aria-hidden="true" />
                <span>{event.guestCount} Guests</span>
              </div>
            </div>

            {/* Custom Welcome Message */}
            <p
              style={{
                fontSize: '0.925rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
                maxWidth: '480px',
                margin: '0 auto 24px',
              }}
            >
              {customNote}
            </p>

            {/* Dietary Reminder Notice */}
            <div
              style={{
                background: 'rgba(245, 158, 11, 0.06)',
                border: '1px dashed rgba(245, 158, 11, 0.3)',
                borderRadius: '12px',
                padding: '12px 18px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.8rem',
                color: 'var(--accent-gold)',
                margin: '0 auto 20px',
              }}
            >
              <Utensils size={15} aria-hidden="true" />
              <span>Allergens &amp; dietary restrictions will be accommodated upon RSVP.</span>
            </div>

            {/* Simulated RSVP Link */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '10px',
                  padding: '8px 16px',
                  fontSize: '0.825rem',
                  color: 'var(--text-secondary)',
                  fontFamily: 'monospace',
                }}
              >
                {rsvpUrl}
              </div>
              <button
                type="button"
                className="btn btn-gold btn-sm"
                onClick={handleCopyLink}
                aria-label="Copy RSVP link"
              >
                {copiedLink ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
                <span>{copiedLink ? 'Copied Link' : 'Copy Link'}</span>
              </button>
            </div>
          </div>

          {/* Custom Message Field */}
          <div>
            <label className="input-label" htmlFor="custom-invitation-note">
              Personalized Host Message
            </label>
            <textarea
              id="custom-invitation-note"
              className="textarea-field"
              rows={2}
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder="Add your personalized warm greeting..."
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-card)',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleCopyText}
          >
            {copiedText ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
            <span>{copiedText ? 'Copied Invitation Text' : 'Copy All Text'}</span>
          </button>

          <button
            type="button"
            className="btn btn-gold btn-sm"
            onClick={onClose}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
