# Open1040

**Free, transparent tax preparation for simple U.S. federal returns.**

Open1040 is a free, open-source tool that helps individuals understand and prepare a simple Form 1040 federal income tax return. It shows every calculation, explains every number, and never hides anything behind a paywall.

> **This is NOT a tax filing service.** Open1040 does not submit returns to the IRS. It does not constitute tax advice, legal advice, or financial advice. Always consult a qualified tax professional for your specific situation.

---

## What This Supports (MVP)

- Single filers only
- W-2 wage income
- Simple bank interest income (1099-INT)
- Standard deduction only
- Federal return only
- Tax year 2025

## What This Does NOT Support

- Married filing jointly/separately
- Head of household
- Self-employment / 1099-NEC / Schedule C
- Capital gains (stocks, crypto, property)
- Rental income / Schedule E
- Foreign income / FBAR / FATCA
- Itemized deductions
- Dependents or child tax credit
- Education credits, earned income credit
- State tax returns
- E-filing / IRS submission
- Prior year amendments

**Unsupported cases are detected and blocked.** The app will not proceed if your situation falls outside its scope.

---

## Architecture

```
src/
├── app/                  # Next.js pages & layout
├── components/           # React UI components
│   ├── layout/           # Header, Footer, Landing
│   ├── eligibility/      # Screening flow
│   ├── intake/           # Data entry forms
│   ├── review/           # Calculation review & explanations
│   └── export/           # Results & download
├── domain/
│   └── types/            # TypeScript interfaces & Zod schemas
├── hooks/                # React state management
├── lib/                  # Constants, utilities
├── rules/                # Year-versioned tax rules engine
│   └── 2025/             # 2025 brackets, deductions, logic
└── services/             # Core business logic
    ├── eligibility.ts    # Scope gating
    ├── validation.ts     # Schema + business rule validation
    ├── normalization.ts  # Raw input → calculation-ready data
    ├── explanation.ts    # Human-readable explanations
    └── audit.ts          # Structured audit logging
```

### Key Design Decisions

1. **Year-versioned rules** — Tax constants and logic live in `src/rules/{year}/`. Adding a new year means adding a new folder.
2. **Separation of concerns** — Raw inputs, normalized data, calculations, and explanations are distinct types with clear boundaries.
3. **Deterministic calculations** — No AI, no guessing, no hidden logic. Pure math.
4. **Governance by design** — Eligibility gates, validation layers, explanation engine, audit trail, and mandatory user acknowledgement.
5. **Privacy first** — All data stays in the browser. No server persistence in MVP.

---

## Setup

### Prerequisites

- Node.js 18+
- npm or pnpm

### Install & Run

```bash
git clone https://github.com/your-org/open1040.git
cd open1040
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Test

```bash
npm test
```

### Lint & Format

```bash
npm run lint
npm run format
```

---

## User Journey

1. **Landing** — Read scope, disclaimers, supported/unsupported scenarios
2. **Eligibility** — Answer 9 yes/no screening questions
3. **Intake** — Enter taxpayer info, W-2 data, optional interest income
4. **Validation** — Automatic schema + business rule checks
5. **Review** — See every calculation with line-by-line explanations
6. **Acknowledge** — Read and accept the disclaimer
7. **Export** — Download JSON summary, print worksheet, see next steps

---

## Governance Philosophy

Open1040 embodies a "refuse when unsure" approach:

- **Never silently guess** — If something is ambiguous, the app stops and asks.
- **Never fabricate values** — Every number traces to user input or published IRS constants.
- **Never hide assumptions** — The explanation engine documents every formula.
- **Always explain what it did** — Every calculation step has a human-readable description.
- **Block unsupported cases** — If the return is complex, the app says so and stops.

---

## Updating for a New Tax Year

1. Create `src/rules/{year}/index.ts`
2. Update standard deduction, bracket thresholds, and wage bases from IRS publications
3. Add the year to `SUPPORTED_FILING_YEARS` in `src/domain/types/index.ts`
4. Add a case to the router in `src/rules/index.ts`
5. Write tests in `__tests__/rules/tax{year}.test.ts`
6. Update UI selectors to include the new year

Sources for constants:
- IRS Revenue Procedures (annual inflation adjustments)
- IRS Form 1040 Instructions
- IRS Publication 505

---

## Security & Privacy

- **No server-side data storage** in MVP — all data lives in browser memory
- **No PII logging** — audit events redact sensitive fields
- **Only last 4 SSN digits collected** — full SSN is never requested
- **No external API calls** — calculations are 100% client-side
- **No tracking, analytics, or cookies**

### Production Hardening (Future)

Before any real-world deployment:
- Add HTTPS enforcement
- Implement Content Security Policy headers
- Add rate limiting if server routes are used
- Consider encrypted session storage
- Conduct security audit
- Add WCAG accessibility compliance

---

## Future Roadmap

### Phase 2
- Married filing jointly support
- Head of household support
- Dependents and child tax credit
- Earned income credit

### Phase 3
- State tax modules (starting with Hawaii)
- W-2 import (PDF parsing)
- Multi-language support

### Phase 4
- IRS MeF e-file integration
- Form 1040 PDF generation
- Audit log export

---

## Disclaimers

**Open1040 is a free, open-source educational tool.** It is NOT a tax filing service. It does NOT submit returns to the IRS. It does NOT constitute tax advice, legal advice, or financial advice.

The calculations are based on published IRS rules and are provided for educational and preparation purposes only. Your actual tax liability may differ. Always consult a qualified tax professional.

---

## Contributing

Contributions welcome. Please:

1. Read the governance philosophy above
2. Write tests for any new logic
3. Keep scope discipline — don't add unsupported features without gating
4. Follow existing code patterns
5. Update the README if adding new capabilities

---

## License

MIT
