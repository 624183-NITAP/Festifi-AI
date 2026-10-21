# FestiFi AI — GenAI-Powered Celebration & Event Planner

[![Next.js](https://img.shields.io/badge/Next.js-14.2.35-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict%20Mode-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tests](https://img.shields.io/badge/Tests-107%2F107%20Passing-brightgreen?logo=vitest)](https://vitest.dev/)
[![Accessibility](https://img.shields.io/badge/Accessibility-WCAG%202.2%20AA%20Aligned-purple)](https://www.w3.org/WAI/standards-guidelines/wcag/)
[![Security](https://img.shields.io/badge/Security-Hardened%20API%20%26%20CWE--1236%20Defense-gold)](https://owasp.org/)

**FestiFi AI** is an enterprise-grade celebration and event intelligence platform engineered from first principles. It delivers deterministic integer-currency financial calculations, multi-tier budget alternatives, an interactive AI Event Copilot with side-by-side diff previews, operational guest & RSVP accounting with chef dietary breakdowns, publication-grade client proposal PDF exports, and an interactive 3-minute guided judge evaluation tour.

---

## 🌟 Key Capabilities

### 1. 🤖 AI Event Copilot with Side-by-Side Diffs
- **6 Contextual Operations**:
  1. *Reduce Budget 15%*: Safeguards locked contracts and must-haves while reallocating discretionary expenses.
  2. *7-Day Prep Checklist*: Generates critical pre-event countdown tasks.
  3. *Rain Contingency Plan*: Allocates weather reserves, marquee rentals, and indoor floorplans.
  4. *Timeline Adjustment*: Compresses or expands task schedules dynamically.
  5. *Lower-Cost Alternatives*: Identifies vendor and service trade-offs.
  6. *Realism & Risk Audit*: Scores budget and timeline feasibility on a 0–100 scale.
- **Side-by-Side Diff Preview & Confirmation Gate**: Evaluates proposed expense deltas and schedule additions side-by-side with exact math before applying changes to the live plan.

### 2. 💰 Deterministic Budget Engine & 3-Tier Alternatives
- **Integer Minor Units**: All monetary values are computed in integer cents/pence to eliminate floating-point drift.
- **3-Tier Planning Alternatives**: One-click exploration between *Economical* (-18%), *Balanced* (-10%), and *Premium* (+12%) budget configurations.
- **Contract Tracking**: Distinguishes between planned, confirmed, and paid disbursements without double-counting deposits.
- **Zero-Division Defense**: Mathematically handles events with 0 guests, guaranteeing `perPersonEstimateMinor === 0`.

### 3. 👥 Operational Event Workflow & Chef Dietary Matrix
- **RSVP Management**: Real-time tracking of Attending, Declined, and Pending guests.
- **Plus-One Accounting**: Strictly isolates plus-one headcounts to attending guests for accurate seating and catering numbers.
- **Chef Dietary Matrix**: Aggregates portions across 9 dietary categories (vegan, vegetarian, gluten-free, nut allergies, halal, kosher, dairy-free).
- **Luxury Digital Invitation Modal**: Formats bespoke invitation text, displays event details, and copies custom RSVP links.

### 4. 📑 Publication-Grade Client PDF Proposal Export
- **7 Comprehensive Sections**: Executive cover banner, creative direction & color swatches, itemized budget schedule, milestone timeline roadmap, chef catering matrix, vendor contracts, and estimation governance disclaimers.
- **Auto-Pagination & Running Headers/Footers**: Implemented with `jspdf` and zero heavy dependencies.

### 5. 🏆 Guided Judge Demo Mode (3-Minute Tour)
- **Unmistakable Evaluator Header Button**: Dedicated "Judge Guide" button launches an interactive 6-step verification tour.
- **Non-Destructive Reset**: Restores pristine Emerald Forest Botanical Wedding demo data at any time without destroying custom user events in `localStorage`.

### 6. ⚡ What-If Contingency Simulator
- **6 Volatility Scenarios**: Guest surges (+25%), budget trims (-15%), rain contingencies, vendor cancellations (+20% rush fee), rescheduling, and specialty diets.
- **Contingency Absorption**: Tests whether the contingency reserve absorbs costs or overflows into deficits.
- **Anti-Clobbering Rollback**: Merges adjustments by ID so concurrent user edits are never overwritten.

### 7. 🛡️ Enterprise Security & Hardened Architecture
- **Centralized Security Middleware (`requestValidator.ts`)**: Stream-bounded body limit (256 KB), rate limiting with proxy trust defense, and safe JSON parsing.
- **CSV Formula Injection Defense (OWASP CWE-1236)**: Neutralizes formula triggers in CSV exports.
- **Strict Content-Security-Policy**: Enforced via HTTP headers in `next.config.mjs`.

### 8. ♿ Accessibility Verification (WCAG 2.2 AA Aligned)
- **Keyboard Navigation**: All modals dismiss cleanly via the `Escape` key (WCAG 2.1.2 No Keyboard Trap).
- **Accessible Chart Alternatives**: Donut chart paired with screen-reader data table.
- **Live Regions**: `aria-live="polite"` status announcements for async updates.
  - Enforces `Content-Type: application/json` (HTTP 415).
  - Enforces 256 KB stream-read payload caps (HTTP 413) to protect against DoS memory exhaustion.
  - Safely handles malformed JSON bodies (HTTP 400).
  - Token Bucket rate limiter (HTTP 429 + `Retry-After`) with automated memory cache pruning.
  - Proxy Trust Strategy: Rejects IP spoofing by selecting the rightmost untrusted upstream IP and strictly validating IP address formats.
- **Secret Isolation**: `GEMINI_API_KEY` is strictly accessed server-side and transmitted via `x-goog-api-key` HTTP headers rather than URL query parameters.
- **Truthful Provenance**: Automatically falls back to deterministic templates with truthful `isLive: false` status; never falsely claims live AI generation on fallback.
- **CSV Formula Injection Defense (OWASP CWE-1236)**: Neutralizes formula triggers (`=`, `+`, `-`, `@`, `\t`, `\r`) in exported CSVs.
- **Zero XSS**: Zero occurrences of `dangerouslySetInnerHTML` or `innerHTML`. All text rendered through React DOM escaping.
- **Hardened CSP**: Strict Content-Security-Policy with `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and `'unsafe-eval'` dropped in production mode.

### 5. ♿ Accessibility Verification (WCAG 2.2 AA Aligned)
- **Verified Landmarks**: Full HTML5 `<header role="banner">`, `<nav>`, `<main>`, `<section>`, and `<div role="dialog" aria-modal="true">`.
- **Accessible Chart Alternatives**: SVG Donut Chart is hidden from screen readers (`aria-hidden="true"`) and paired with an accessible HTML data table (`<table aria-label="...">`).
- **Skip Links & Focus Rings**: Visible `:focus-visible` ring (`outline: 2px solid #f59e0b; outline-offset: 3px`).
- **Reduced Motion**: Full `@media (prefers-reduced-motion: reduce)` support neutralizes animations.
- **Responsive Viewports**: Tested down to 360px mobile viewports.
- **Scope & Limitations**: Automated component tests verify semantic landmarks, tabular chart alternatives, and focus styles. Commercial screen reader testing (JAWS/NVDA) and high-contrast light theme modes were not verified. Canvas particle animations rely on adjacent `aria-live="polite"` status announcements.

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js >= 18.17.0
- npm >= 9.0.0

### 2. Installation
```bash
git clone https://github.com/624183-NITAP/Festifi-AI.git
cd Festifi-AI
npm ci
```

### 3. Configuration
Copy `.env.example` to `.env.local` (optional):
```bash
cp .env.example .env.local
```
```env
# Optional: Live Gemini API Key (If omitted, FestiFi runs in 100% offline deterministic demo mode)
GEMINI_API_KEY=your_gemini_api_key_here

# Optional: Gemini Model ID (Defaults to gemini-2.0-flash)
GEMINI_MODEL=gemini-2.0-flash
```

### 4. Running Locally
```bash
# Start Next.js development server
npm run dev

# Open in browser: http://localhost:3000
```

---

## 🧪 Quality Gates & Verification

All quality gates are enforced in local development and automatically verified on every push and pull request via [GitHub Actions CI](.github/workflows/ci.yml):

```bash
# 1. Clean Dependency Installation
npm ci

# 2. Static Analysis & Linting (ESLint next/core-web-vitals)
npm run lint

# 3. Strict TypeScript Typecheck (Zero Errors)
npm run typecheck

# 4. Automated Test Suite (107/107 tests passing across 14 test files)
npm test

# 5. Production Bundle Build (10/10 Static & Dynamic Routes)
npm run build

# 6. Start Production Server
npm start
```

### Test Suite Summary
```
 ✓ src/__tests__/timeline.test.ts (7 tests)
 ✓ src/__tests__/budget.test.ts (8 tests)
 ✓ src/__tests__/scenarios.test.ts (8 tests)
 ✓ src/__tests__/schemas.test.ts (6 tests)
 ✓ src/__tests__/copilot.test.ts (6 tests)
 ✓ src/__tests__/e2e-workflow.test.ts (16 tests)
 ✓ src/__tests__/budget-advanced.test.ts (10 tests)
 ✓ src/__tests__/ai-provider.test.ts (10 tests)
 ✓ src/__tests__/operational-workflow.test.ts (6 tests)
 ✓ src/__tests__/security.test.ts (15 tests)
 ✓ src/__tests__/pdf-export.test.ts (4 tests)
 ✓ src/__tests__/create-event-flow.test.tsx (2 tests)
 ✓ src/__tests__/judge-mode.test.tsx (5 tests)
 ✓ src/__tests__/accessibility.test.tsx (4 tests)

 Test Files  14 passed (14)
      Tests  107 passed (107)
   Duration  6.29s (100% pass rate)
```

### Production Build Metrics
```
Route (app)                              Size     First Load JS
┌ ○ /                                    51.2 kB         139 kB
├ ○ /_not-found                          873 B          88.2 kB
├ ƒ /api/ai/inquiry                      0 B                0 B
├ ƒ /api/ai/optimize                     0 B                0 B
├ ƒ /api/ai/plan                         0 B                0 B
├ ƒ /api/ai/scenario                     0 B                0 B
└ ○ /api/health                          0 B                0 B
+ First Load JS shared by all            87.3 kB
```

For complete engineering audit details, see the [Comprehensive Engineering Report](engineering_report.md).

---

## 📄 License
MIT License. Developed for competitive evaluation.
