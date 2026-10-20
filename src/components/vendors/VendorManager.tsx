'use client';

import React, { useState } from 'react';
import { Check, Copy, Mail, Plus, Send, ShieldCheck, Trash2, Users } from 'lucide-react';
import { CATEGORY_NAMES, formatCurrencyMinor } from '@/domain/budget';
import { BudgetCategory, EventDetails, VendorRecord, VendorStatus } from '@/domain/types';

interface VendorManagerProps {
  event: EventDetails;
  vendors: VendorRecord[];
  onUpdateVendors: (newVendors: VendorRecord[]) => void;
}

export const VendorManager: React.FC<VendorManagerProps> = ({
  event,
  vendors,
  onUpdateVendors,
}) => {
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [activeInquiryVendor, setActiveInquiryVendor] = useState<VendorRecord | null>(null);
  const [generatedMessage, setGeneratedMessage] = useState<string>('');
  const [safetyTips, setSafetyTips] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Form state
  const [vName, setVName] = useState<string>('');
  const [vCategory, setVCategory] = useState<BudgetCategory>('catering');
  const [vContact, setVContact] = useState<string>('');
  const [vEmail, setVEmail] = useState<string>('');
  const [vPhone, setVPhone] = useState<string>('');
  const [vNotes, setVNotes] = useState<string>('');

  const handleOpenAddModal = () => {
    setVName('');
    setVCategory('catering');
    setVContact('');
    setVEmail('');
    setVPhone('');
    setVNotes('');
    setShowAddModal(true);
  };

  const handleCreateVendor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vName.trim()) return;

    const newVendor: VendorRecord = {
      id: `v-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: vName.trim(),
      category: vCategory,
      contactPerson: vContact.trim(),
      email: vEmail.trim(),
      phone: vPhone.trim(),
      quotedPriceMinor: null,
      status: 'contacted',
      notes: vNotes.trim(),
      inquiryMessage: null,
    };

    onUpdateVendors([...vendors, newVendor]);
    setShowAddModal(false);
  };

  const handleDeleteVendor = (id: string) => {
    onUpdateVendors(vendors.filter((v) => v.id !== id));
  };

  const handleStatusChange = (id: string, newStatus: VendorStatus) => {
    onUpdateVendors(
      vendors.map((v) => (v.id === id ? { ...v, status: newStatus } : v))
    );
  };

  const handleGenerateInquiry = async (vendor: VendorRecord) => {
    setActiveInquiryVendor(vendor);
    setIsGenerating(true);
    setCopied(false);

    try {
      const res = await fetch('/api/ai/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event,
          vendor,
          specialRequests: vendor.notes || '',
        }),
      });

      if (res.ok) {
        const json = await res.json();
        setGeneratedMessage(json.data.inquiryMessage);
        setSafetyTips(json.data.checklistTips || []);
      } else {
        throw new Error('API request failed');
      }
    } catch {
      // Offline fallback: generate directly in client
      const fallbackMsg = [
        `Dear ${vendor.contactPerson || `${vendor.name} Team`},`,
        ``,
        `I am planning an upcoming ${event.type.replace('_', ' ')} titled "${event.title}" scheduled for ${event.targetDate} with an estimated ${event.guestCount} guests.`,
        ``,
        `We are currently shortlisting trusted partners for our ${CATEGORY_NAMES[vendor.category]} needs. We would love to request a formal quotation and inquire about your availability for this date.`,
        vendor.notes ? `Specific notes:\n- ${vendor.notes}\n` : '',
        `Could you kindly share your package inclusions, itemized pricing, and deposit terms?`,
        ``,
        `Warm regards,`,
        `Event Planning Team — ${event.title}`,
      ].filter(Boolean).join('\n');

      setGeneratedMessage(fallbackMsg);
      setSafetyTips([
        'Request proof of commercial general liability insurance for venue compliance.',
        'Confirm overtime hourly rates in writing before signing the contract.',
        'Ensure cancellation policy explicitly addresses weather disruptions and forced rescheduling.',
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyInquiry = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(generatedMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff' }}>
            Vendor Directory & AI Inquiry Generator
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Draft tailored negotiation inquiries, track quotes, and enforce contractual safety protocols.
          </p>
        </div>

        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={handleOpenAddModal}
          aria-label="Add new vendor contact"
        >
          <Plus size={16} aria-hidden="true" />
          <span>Add Vendor</span>
        </button>
      </div>

      {/* Demo Data Notice */}
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '10px',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '0.815rem',
          color: 'var(--text-secondary)',
        }}
      >
        <span className="badge badge-optional" style={{ fontSize: '0.7rem' }}>
          Demo Data
        </span>
        <span>
          Sample vendor contacts, service profiles, and quoted prices are synthetic demonstration records for testing negotiation inquiries and budgeting workflows.
        </span>
      </div>

      {/* Vendor Table */}
      <section className="glass-card" style={{ padding: '0', borderRadius: '16px', overflow: 'hidden' }} aria-labelledby="vendors-heading">
        <h3 id="vendors-heading" className="sr-only">Vendor Directory</h3>

        <div className="data-table-container" style={{ border: 'none' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Vendor & Category</th>
                <th scope="col">Contact Person</th>
                <th scope="col">Email / Phone</th>
                <th scope="col">Quoted (Demo)</th>
                <th scope="col">Status</th>
                <th scope="col" style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {vendors.length > 0 ? (
                vendors.map((vendor) => (
                  <tr key={vendor.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {vendor.name}
                      </div>
                      <div style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>
                        {CATEGORY_NAMES[vendor.category]}
                        {vendor.notes ? ` • ${vendor.notes}` : ''}
                      </div>
                    </td>
                    <td>{vendor.contactPerson || '—'}</td>
                    <td>
                      <div style={{ fontSize: '0.85rem' }}>{vendor.email || '—'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{vendor.phone || ''}</div>
                    </td>
                    <td>
                      {vendor.quotedPriceMinor ? (
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            {formatCurrencyMinor(vendor.quotedPriceMinor, event.currency)}
                          </div>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Demo Quote</span>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                    <td>
                      <select
                        className="form-select"
                        style={{ minHeight: '32px', padding: '4px 8px', fontSize: '0.8rem', width: 'auto' }}
                        value={vendor.status}
                        onChange={(e) => handleStatusChange(vendor.id, e.target.value as VendorStatus)}
                        aria-label={`Change status for ${vendor.name}`}
                      >
                        <option value="contacted">Contacted</option>
                        <option value="quoted">Quoted</option>
                        <option value="hired">Hired (Confirmed)</option>
                        <option value="declined">Declined</option>
                      </select>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '4px 10px', fontSize: '0.785rem', minHeight: '32px' }}
                          onClick={() => handleGenerateInquiry(vendor)}
                          aria-label={`Generate inquiry message for ${vendor.name}`}
                        >
                          <Send size={14} color="var(--accent-gold)" aria-hidden="true" />
                          <span>AI Inquiry</span>
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          style={{ padding: '4px 8px', minHeight: '32px' }}
                          onClick={() => handleDeleteVendor(vendor.id)}
                          aria-label={`Delete ${vendor.name}`}
                        >
                          <Trash2 size={14} aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    No vendors recorded yet. Click &quot;Add Vendor&quot; to start tracking suppliers.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* AI Inquiry Modal Dialog */}
      {activeInquiryVendor && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="inquiry-heading">
          <div className="modal-content animate-fade-in" style={{ maxWidth: '720px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Mail size={22} color="var(--accent-gold)" aria-hidden="true" />
                <h3 id="inquiry-heading" style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                  Tailored Vendor Inquiry — {activeInquiryVendor.name}
                </h3>
              </div>
            </div>

            {isGenerating ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                Generating structured inquiry message...
              </div>
            ) : (
              <>
                <div className="form-group">
                  <label htmlFor="inquiry-text" className="form-label">
                    Ready-to-Send Email / Message Draft
                  </label>
                  <textarea
                    id="inquiry-text"
                    className="form-textarea"
                    rows={10}
                    value={generatedMessage}
                    onChange={(e) => setGeneratedMessage(e.target.value)}
                    style={{ fontFamily: 'monospace', fontSize: '0.875rem', lineHeight: 1.5 }}
                  />
                </div>

                {safetyTips.length > 0 && (
                  <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '10px', padding: '14px', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: '#34d399', fontSize: '0.85rem', marginBottom: '6px' }}>
                      <ShieldCheck size={16} aria-hidden="true" />
                      <span>Contractual Safety Checklist</span>
                    </div>
                    <ul style={{ paddingLeft: '20px', fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {safetyTips.map((tip, idx) => (
                        <li key={idx}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setActiveInquiryVendor(null)}
                  >
                    Close
                  </button>

                  <button
                    type="button"
                    className="btn btn-gold"
                    onClick={handleCopyInquiry}
                    aria-label="Copy inquiry draft to clipboard"
                  >
                    {copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
                    <span>{copied ? 'Copied to Clipboard!' : 'Copy Inquiry Draft'}</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Add Vendor Modal */}
      {showAddModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="add-vendor-heading">
          <div className="modal-content animate-fade-in">
            <h3 id="add-vendor-heading" style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '18px' }}>
              Add Vendor Contact
            </h3>

            <form onSubmit={handleCreateVendor}>
              <div className="form-group">
                <label htmlFor="v-name" className="form-label">Business / Vendor Name</label>
                <input
                  id="v-name"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Bella Luna Florals"
                  value={vName}
                  onChange={(e) => setVName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="v-category" className="form-label">Category</label>
                <select
                  id="v-category"
                  className="form-select"
                  value={vCategory}
                  onChange={(e) => setVCategory(e.target.value as BudgetCategory)}
                >
                  {Object.entries(CATEGORY_NAMES).map(([id, name]) => (
                    <option key={id} value={id}>{name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label htmlFor="v-contact" className="form-label">Contact Person</label>
                  <input
                    id="v-contact"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Maria Rossi"
                    value={vContact}
                    onChange={(e) => setVContact(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="v-email" className="form-label">Email Address</label>
                  <input
                    id="v-email"
                    type="email"
                    className="form-input"
                    placeholder="e.g. info@bellaluna.com"
                    value={vEmail}
                    onChange={(e) => setVEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="v-phone" className="form-label">Phone Number</label>
                <input
                  id="v-phone"
                  type="tel"
                  className="form-input"
                  placeholder="e.g. +1 555-019-2834"
                  value={vPhone}
                  onChange={(e) => setVPhone(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="v-notes" className="form-label">Special Inquiries or Requirements</label>
                <input
                  id="v-notes"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Needs vegan cake tier and delivery before 2 PM"
                  value={vNotes}
                  onChange={(e) => setVNotes(e.target.value)}
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
                  Save Vendor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
