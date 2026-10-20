'use client';

import React, { useState } from 'react';
import { Calendar, DollarSign, Sparkles, Users, X } from 'lucide-react';
import { CreateEventInputSchema } from '@/domain/schemas';
import { CurrencyCode, EventDetails, EventType } from '@/domain/types';

interface CreateEventModalProps {
  onClose: () => void;
  onCreateEvent: (event: EventDetails) => void;
}

export const CreateEventModal: React.FC<CreateEventModalProps> = ({
  onClose,
  onCreateEvent,
}) => {
  const [title, setTitle] = useState<string>('Grand Spring Gala & Celebration');
  const [type, setType] = useState<EventType>('community');
  const [theme, setTheme] = useState<string>('Spring Blossoms & Luminary Lights');
  const [targetDate, setTargetDate] = useState<string>('2027-05-15');
  const [guestCount, setGuestCount] = useState<number>(150);
  const [currency, setCurrency] = useState<CurrencyCode>('USD');
  const [budgetDecimal, setBudgetDecimal] = useState<string>('25000.00');
  const [contingencyPercentage, setContingencyPercentage] = useState<number>(10);
  const [location, setLocation] = useState<string>('Civic Center Plaza');
  const [notes, setNotes] = useState<string>('Need eco-friendly catering and ADA ramp access.');
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const budgetNum = Number(budgetDecimal.replace(/,/g, ''));

    const parseResult = CreateEventInputSchema.safeParse({
      title,
      type,
      theme,
      targetDate,
      guestCount,
      currency,
      totalBudgetDecimal: budgetNum,
      contingencyPercentage,
      location,
      notes,
    });

    if (!parseResult.success) {
      const issue = parseResult.error.issues[0]?.message || 'Invalid form input';
      setFormError(issue);
      return;
    }

    const newEvent: EventDetails = {
      id: `ev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: parseResult.data.title,
      type: parseResult.data.type,
      theme: parseResult.data.theme || 'Celebration',
      targetDate: parseResult.data.targetDate,
      guestCount: parseResult.data.guestCount,
      currency: parseResult.data.currency,
      totalBudgetMinor: Math.round(parseResult.data.totalBudgetDecimal * 100),
      contingencyPercentage: parseResult.data.contingencyPercentage,
      location: parseResult.data.location,
      notes: parseResult.data.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onCreateEvent(newEvent);
    onClose();
  };

  const handleLoadPreset = (presetType: EventType) => {
    setType(presetType);
    if (presetType === 'wedding') {
      setTitle('Emerald & White Rose Garden Wedding');
      setTheme('Botanical Elegance & Romantic Candlelight');
      setTargetDate('2027-06-20');
      setGuestCount(120);
      setBudgetDecimal('35000.00');
      setLocation('Kew Botanical Conservatory');
      setNotes('Cocktail hour on lawn, sit-down dinner in glasshouse.');
    } else if (presetType === 'birthday') {
      setTitle('Milestone 30th Neon Rooftop Soirée');
      setTheme('Cyberpunk Neon & Retro Beats');
      setTargetDate('2026-12-18');
      setGuestCount(60);
      setBudgetDecimal('8500.00');
      setLocation('Skyline Terrace Lounge');
      setNotes('Signature gin cocktails and gourmet sliders.');
    } else {
      setTitle('Annual Community Summer Solstice Festival');
      setTheme('Sunflowers & Acoustic Folk');
      setTargetDate('2027-06-21');
      setGuestCount(300);
      setBudgetDecimal('20000.00');
      setLocation('Oakridge Memorial Park');
      setNotes('All-ages welcome, waste recycling stations mandatory.');
    }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="create-event-heading">
      <div className="modal-content animate-fade-in" style={{ maxWidth: '680px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sparkles size={22} color="var(--accent-gold)" aria-hidden="true" />
            <h3 id="create-event-heading" style={{ fontSize: '1.3rem', fontWeight: 800 }}>
              Plan a New Celebration
            </h3>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        {/* Quick Demo Presets */}
        <div style={{ marginBottom: '18px', background: 'rgba(255, 255, 255, 0.03)', padding: '12px 16px', borderRadius: '12px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
            ⚡ Instant Competition Demo Presets:
          </span>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.785rem', padding: '4px 10px' }}
              onClick={() => handleLoadPreset('wedding')}
            >
              💍 Luxury Wedding
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.785rem', padding: '4px 10px' }}
              onClick={() => handleLoadPreset('birthday')}
            >
              🎂 30th Birthday Party
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.785rem', padding: '4px 10px' }}
              onClick={() => handleLoadPreset('community')}
            >
              🎪 Community Festival
            </button>
          </div>
        </div>

        {formError && (
          <div style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', padding: '12px 14px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '16px' }} role="alert">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="ev-title" className="form-label">Event Title</label>
            <input
              id="ev-title"
              type="text"
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label htmlFor="ev-type" className="form-label">Celebration Type</label>
              <select
                id="ev-type"
                className="form-select"
                value={type}
                onChange={(e) => setType(e.target.value as EventType)}
              >
                <option value="wedding">Wedding & Reception</option>
                <option value="birthday">Milestone Birthday</option>
                <option value="community">Community Festival</option>
                <option value="anniversary">Anniversary Celebration</option>
                <option value="corporate">Corporate Gala / Conference</option>
                <option value="baby_shower">Baby Shower</option>
                <option value="other">Other Celebration</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="ev-theme" className="form-label">Theme / Aesthetic Vibe</label>
              <input
                id="ev-theme"
                type="text"
                className="form-input"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                maxLength={100}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label htmlFor="ev-date" className="form-label">Target Celebration Date</label>
              <input
                id="ev-date"
                type="date"
                className="form-input"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="ev-guests" className="form-label">Estimated Guest Count</label>
              <input
                id="ev-guests"
                type="number"
                min="1"
                max="100000"
                className="form-input"
                value={guestCount}
                onChange={(e) => setGuestCount(Number(e.target.value))}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label htmlFor="ev-currency" className="form-label">Currency</label>
              <select
                id="ev-currency"
                className="form-select"
                value={currency}
                onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="INR">INR (₹)</option>
                <option value="CAD">CAD (C$)</option>
                <option value="AUD">AUD (A$)</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="ev-budget" className="form-label">Total Budget</label>
              <input
                id="ev-budget"
                type="number"
                step="0.01"
                min="0"
                className="form-input"
                value={budgetDecimal}
                onChange={(e) => setBudgetDecimal(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="ev-contingency" className="form-label">Contingency Buffer (%)</label>
              <input
                id="ev-contingency"
                type="number"
                min="0"
                max="50"
                className="form-input"
                value={contingencyPercentage}
                onChange={(e) => setContingencyPercentage(Number(e.target.value))}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="ev-location" className="form-label">Venue / City Location (Optional)</label>
            <input
              id="ev-location"
              type="text"
              className="form-input"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              maxLength={120}
            />
          </div>

          <div className="form-group">
            <label htmlFor="ev-notes" className="form-label">Special Preferences & Dietary Guidelines</label>
            <textarea
              id="ev-notes"
              className="form-textarea"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={500}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-gold">
              Generate & Save Plan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
