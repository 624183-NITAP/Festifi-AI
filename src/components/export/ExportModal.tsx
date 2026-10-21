'use client';

import React, { useEffect, useState } from 'react';
import { Check, Copy, Download, FileSpreadsheet, FileText, Sparkles, X } from 'lucide-react';
import { downloadClientProposalPdf } from '@/domain/export/pdfExport';
import {
  exportExpensesToCsv,
  exportStateToJson,
  exportToMarkdownSummary,
} from '@/domain/persistence';
import { EventPlanState } from '@/domain/types';

interface ExportModalProps {
  state: EventPlanState;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ state, onClose }) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportJson = () => {
    const jsonStr = exportStateToJson(state);
    downloadFile(jsonStr, `${state.event.id}-festifi-plan.json`, 'application/json');
  };

  const handleExportCsv = () => {
    const csvStr = exportExpensesToCsv(state.expenses, state.event.currency);
    downloadFile(csvStr, `${state.event.id}-budget-expenses.csv`, 'text/csv');
  };

  const handleExportMarkdown = () => {
    const md = exportToMarkdownSummary(state);
    downloadFile(md, `${state.event.id}-executive-summary.md`, 'text/markdown');
  };

  const handleCopyMarkdown = () => {
    const md = exportToMarkdownSummary(state);
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(md);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleExportPdf = () => {
    try {
      setIsExportingPdf(true);
      downloadClientProposalPdf(state);
    } catch (err) {
      console.error('Failed to generate proposal PDF:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="export-modal-title">
      <div className="modal-content animate-fade-in" style={{ maxWidth: '600px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Download size={22} color="var(--accent-gold)" aria-hidden="true" />
            <h3 id="export-modal-title" style={{ fontSize: '1.25rem', fontWeight: 700 }}>
              Export Event Plan & Budget
            </h3>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onClose}
            aria-label="Close export dialog"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
          Download clean, portable copies of your celebration plan, budget allocations, timeline tasks, and vendor roster.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Executive Client Proposal (PDF) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%)',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              borderRadius: '12px',
              padding: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Sparkles size={24} color="var(--accent-gold)" aria-hidden="true" />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <strong style={{ fontSize: '0.95rem', color: '#ffffff' }}>Executive Client Proposal (PDF)</strong>
                  <span
                    className="badge"
                    style={{
                      fontSize: '0.7rem',
                      background: 'rgba(245, 158, 11, 0.2)',
                      color: 'var(--accent-gold)',
                      border: '1px solid rgba(245, 158, 11, 0.4)',
                      padding: '2px 6px',
                    }}
                  >
                    Client-Ready
                  </span>
                </div>
                <p style={{ fontSize: '0.775rem', color: 'var(--text-secondary)' }}>
                  Publication-grade document with budget audit, guest catering requirements, and milestone roadmap.
                </p>
              </div>
            </div>
            <button
              type="button"
              className="btn btn-gold btn-sm"
              onClick={handleExportPdf}
              disabled={isExportingPdf}
              aria-label="Download executive client proposal PDF"
            >
              <Download size={14} aria-hidden="true" />
              <span>{isExportingPdf ? 'Generating...' : 'Download PDF'}</span>
            </button>
          </div>
          {/* CSV Export */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <FileSpreadsheet size={24} color="#10b981" aria-hidden="true" />
              <div>
                <strong style={{ fontSize: '0.95rem' }}>Spreadsheet (CSV)</strong>
                <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                  RFC 4180 compliant. Perfect for Excel, Google Sheets, or Apple Numbers.
                </p>
              </div>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleExportCsv}
              aria-label="Download budget as CSV"
            >
              Download CSV
            </button>
          </div>

          {/* JSON Export */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Download size={24} color="#8b5cf6" aria-hidden="true" />
              <div>
                <strong style={{ fontSize: '0.95rem' }}>Complete Event State (JSON)</strong>
                <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                  Full machine-readable backup of event, tasks, vendors, and ideas.
                </p>
              </div>
            </div>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleExportJson}
              aria-label="Download complete state as JSON"
            >
              Download JSON
            </button>
          </div>

          {/* Markdown Summary */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <FileText size={24} color="var(--accent-gold)" aria-hidden="true" />
              <div>
                <strong style={{ fontSize: '0.95rem' }}>Executive Summary (Markdown)</strong>
                <p style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                  Accessible, formatted executive briefing document with itemized tables.
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleCopyMarkdown}
                aria-label="Copy markdown summary to clipboard"
              >
                {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
              <button
                type="button"
                className="btn btn-gold btn-sm"
                onClick={handleExportMarkdown}
                aria-label="Download executive summary as Markdown file"
              >
                Download MD
              </button>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
