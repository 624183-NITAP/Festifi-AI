# FestiFi AI — GenAI-Powered Celebration & Event Planner

[![Next.js](https://img.shields.io/badge/Next.js-14.2.35-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict%20Mode-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tests](https://img.shields.io/badge/Tests-62%2F62%20Passing-brightgreen?logo=vitest)](https://vitest.dev/)
[![Accessibility](https://img.shields.io/badge/WCAG-2.2%20AA%20Compliant-purple)](https://www.w3.org/WAI/standards-guidelines/wcag/)
[![Security](https://img.shields.io/badge/Security-Hardened%20API%20%26%20CWE--1236%20Defense-gold)](https://owasp.org/)

**FestiFi AI** is an enterprise-grade celebration planning platform engineered from first principles. It delivers deterministic integer-currency financial calculations, What-If contingency modeling, milestone timeline derivation, vendor contract tracking, and contextual AI-driven event concepts with zero float-drift or hallucination risks.

---

## 🌟 Key Capabilities

### 1. 💰 Deterministic Minor-Currency Budget Engine
- **Integer Minor Units**: All monetary values (`totalBudgetMinor`, `plannedMinor`, `confirmedMinor`, `paidMinor`, `unallocatedMinor`, `contingencyReserveMinor`) are stored and computed in integer cents/pence to eliminate floating-point representation drift.
- **Contract Tracking**: Distinguishes between planned, confirmed, and paid amounts without double-counting deposits.
- **Budget Optimization**: Structured, prioritized trade-off proposals protecting must-have items and confirmed vendor contracts.
- **Zero-Division Defense**: Mathematically handles events with 0 guests, guaranteeing `perPersonEstimateMinor === 0`.
- **Financial Variance**: Evaluates true variance between Total Budget and Total Committed: `varianceMinor = totalBudgetMinor - totalCommittedMinor`.

### 2. ⚡ What-If Contingency Simulator
Deterministic modeling across 6 volatility scenarios:
1. **Surge in Guest Count (+25%)**: Dynamic capacity and catering scaling.
2. **Sudden Budget Trim (-15%)**: Deficit resolution safeguarding locked contracts.
3. **Outdoor Rain Contingency**: Canopies, climate control, and covered walkway reserves.
4. **Vendor Cancellation**: Emergency replacement surcharge (+20% rush fee).
5. **Event Date Reschedule**: Administrative rebooking fees and vendor hold adjustments.
6. **Specialty Dietary Requirements**: Allergen station isolation and custom culinary prep.
- **Contingency Absorption**: Evaluates whether the contingency reserve absorbs costs or overflows into budget deficits.
- **Anti-Clobbering Rollback**: Merges adjustments by ID, ensuring concurrent edits made while simulating are never lost.

### 3. 📅 Timeline & Milestone Scheduling Engine
- **Gregorian Leap Year Handling**: Evaluates accurate 400-year cycle leap years (2024 vs 2023, 2000 vs 1900).
- **Timezone Safety**: Strict UTC millisecond arithmetic eliminates daylight savings jumps.
- **Schedule Compression**: Dynamically scales task milestones based on available planning duration.
- **Dependency Tracking**: Validates prerequisite tasks before unblocking dependent milestones.

### 4. 🛡️ Enterprise Security & Hardened Architecture
- **Centralized Security Middleware (`requestValidator.ts`)**:
  - Enforces `Content-Type: application/json` (HTTP 415).
  - Enforces 256 KB payload caps (HTTP 413) to protect against DoS memory exhaustion.
  - Safely handles malformed JSON bodies (HTTP 400).
  - Token Bucket rate limiter (HTTP 429 + `Retry-After`) with automated memory cache pruning.
- **Secret Isolation**: `GEMINI_API_KEY` is strictly accessed server-side and transmitted via `x-goog-api-key` HTTP headers rather than URL query parameters.
- **CSV Formula Injection Defense (OWASP CWE-1236)**: Neutralizes formula triggers (`=`, `+`, `-`, `@`, `\t`, `\r`) in exported CSVs.
- **Zero XSS**: Zero occurrences of `dangerouslySetInnerHTML` or `innerHTML`. All text rendered through React DOM escaping.
- **Hardened CSP**: Strict Content-Security-Policy with `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, and `'unsafe-eval'` dropped in production mode.

### 5. ♿ WCAG 2.2 AA Accessibility
- **Semantic Landmarks**: Full HTML5 `<header>`, `<nav>`, `<main>`, `<section>`, and `<div role="dialog">`.
- **Accessible Chart Alternatives**: SVG Donut Chart is hidden from screen readers (`aria-hidden="true"`) and accompanied by a semantic data table (`<table aria-label="...">`).
- **Skip Links & Focus Rings**: Visible `:focus-visible` ring (`outline: 2px solid #f59e0b; outline-offset: 3px`).
- **Reduced Motion**: Full `@media (prefers-reduced-motion: reduce)` support.

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js >= 18.17.0
- npm >= 9.0.0

### 2. Installation
```bash
git clone https://github.com/624183-NITAP/Festifi-AI.git
cd Festifi-AI
npm install
```

### 3. Configuration
Copy `.env.example` to `.env.local` (optional):
```bash
cp .env.example .env.local
```
```env
# Optional: Live Gemini API Key (If omitted, FestiFi runs in 100% offline deterministic demo mode)
GEMINI_API_KEY=your_gemini_api_key_here
```

### 4. Running Locally
```bash
# Start Next.js development server
npm run dev

# Open in browser: http://localhost:3000
```

---

## 🧪 Quality Gates & Verification

```bash
# 1. Strict TypeScript Typecheck (Zero Errors)
npm run typecheck

# 2. Automated Test Suite (62/62 tests passing across 8 suites)
npm test

# 3. Next.js Production Build
npm run build

# 4. Start Production Server
npm start
```

### Test Suite Summary
```
 ✓ src/__tests__/timeline.test.ts (7 tests)
 ✓ src/__tests__/budget.test.ts (8 tests)
 ✓ src/__tests__/ai-provider.test.ts (5 tests)
 ✓ src/__tests__/scenarios.test.ts (8 tests)
 ✓ src/__tests__/schemas.test.ts (6 tests)
 ✓ src/__tests__/e2e-workflow.test.ts (16 tests)
 ✓ src/__tests__/security.test.ts (9 tests)
 ✓ src/__tests__/accessibility.test.tsx (3 tests)

 Test Files  8 passed (8)
      Tests  62 passed (62)
```

For complete adversarial audit details, see the [Comprehensive Engineering Report](engineering_report.md).

---

## 📄 License
MIT License. Developed for competitive evaluation.
