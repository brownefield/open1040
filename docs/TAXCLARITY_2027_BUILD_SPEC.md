# TaxClarity 2027 Build Specification

**Status:** Approved direction — implement against this doc  
**Owner:** Brownefield Holdings  
**Brand:** TaxClarity (`taxclarity.io`)  
**Positioning:** Know before you file — readiness, organization, professional handoff  
**Not:** A TurboTax competitor, paid return preparer, or e-file service  

This document is the build brief for Claude / Cursor agents. Prefer this over prior chat when scope conflicts.

---

## 0. Current baseline (as of this spec)

| Surface | Location today | Notes |
|---|---|---|
| TaxClarity homepage | `src/app/page.tsx` in **open1040** repo | Primary CTA is still **Start Free Return** → `/open1040` |
| Open1040 | `src/app/open1040/**` | Simple federal prep; TY2025; browser-local |
| Tax Diagnostic | `src/app/prepare/page.tsx` | Multi-step CPA-prep organizer; closest seed for Tax Readiness |
| OT Tax Calculator | Separate repo `ot-tax-calc` → `overtime.taxclarity.io` | Next 16 / React 19 vs Open1040 Next 14 / React 18 |
| ApplyReady | Separate product (`applyready`) | Philosophical twin: Destination → Requirements → Evidence → Gaps → Actions → Track |

**Implication:** TaxClarity already lives inside the Open1040 repo. Do not treat “open1040 = only Open1040” as true.

---

## 1. Product doctrine

### One-line

> TaxClarity gets you organized and ready before tax filing becomes a problem.

### Category (ownable)

> Understand your taxes before you file.  
> Know what you need. Know what you're missing. Know what happens next.

### Journey

```
Understand → Gather → Check → Prepare → File elsewhere / hand off → Track
```

### Hard non-goals (2027)

1. Do **not** compete on “file cheaper than TurboTax / FreeTaxUSA.”
2. Do **not** become a compensated tax return preparer (no PTIN/EFIN path yet).
3. Do **not** claim professional tax advice unless a qualified professional is actually in the loop.
4. Do **not** suddenly paywall free tools after April 15 — launch **paid late-filer workflows** instead.
5. Do **not** store tax document contents server-side in free browser tools without an explicit paid/account product decision.

### Trust promise (keep permanently)

- Free core tools
- No surprise paywalls on calculators / readiness score / Open1040
- Browser-first processing for free tools
- Charge only for optional services that organize, review, or move the situation forward

### Compliance boundary (copy + product)

> TaxClarity prepares the **taxpayer**.  
> Qualified software or professionals prepare/file the **return**.

Every paid and free surface needs a short disclaimer consistent with `/prepare` today: organization/readiness tool; not filing; not legal/tax advice.

---

## 2. Repo strategy (decide once, then build)

### Recommendation: hybrid — product repo + extractable free tools

**Do this:**

1. Treat **TaxClarity** as the product shell (homepage, readiness, packets, preparer intake, 365, late/extension).
2. Keep **Open1040** as an OSS-scoped tool under `/open1040` (or later `packages/open1040`) with its refuse-when-unsure governance.
3. Fold **OT Tax Calculator** into TaxClarity as a first-party route (e.g. `/overtime`) for one journey; keep `overtime.taxclarity.io` as a redirect/alias for SEO if needed.
4. Extract shared readiness primitives into a local package when duplication hurts:
   - document taxonomy
   - readiness scoring
   - state intelligence schema
   - disclaimer / acknowledgement components

**Do not do yet:**

- Full Brownefield monorepo merging ApplyReady + TaxClarity
- Publishing a private npm package across remotes
- Rewriting Open1040 into a different framework

### Why not stay pure multi-repo

Multi-repo is fine for independent public utilities. It fails when the money and UX live in orchestration (readiness → packet → handoff) and that shell currently has no dedicated home. Stack drift (Next 14 vs 16) is already real.

### Near-term working rule for agents

Until a `taxclarity` repo exists, **implement TaxClarity product work in this repo** (`open1040`), under clear routes:

| Route | Product |
|---|---|
| `/` | TaxClarity homepage |
| `/ready` or evolve `/prepare` | Tax Readiness |
| `/open1040` | Open1040 |
| `/overtime` | OT / overtime clarity (after fold-in) |
| `/packet` | Ready Packet (paid) |
| `/late` | Late / Extension Ready (seasonal) |
| `/p/[slug]` | Preparer branded intake |

---

## 3. Homepage rewrite (exact)

### Primary job of `/`

Answer: **Are you ready to file?**

### Replace current primary CTA

**Remove as primary:** `Start Free Return`  
**Primary CTA:** `Check My Tax Readiness` → `/ready` (or upgraded `/prepare`)  
**Secondary CTA:** `Prepare a Simple Return` → `/open1040`  
**Tertiary:** `See free tools` → `#tools` or `/tools`

### Suggested hero copy

**Eyebrow:** Free tools · Optional paid organization · Browser-first  

**H1:** Know before you file.  

**Subhead:** Check what you have, what you're missing, and what to do next — then file with software or a professional when you're ready.

**Trust line (near CTAs):** We charge only for optional services that organize, review, or help move your tax situation forward.

### Tools section framing

Do not lead the grid with Open1040 as the hero product.

Order:

1. **Tax Readiness** — Are you ready to file?
2. **What changed for 2026 taxes** — interactive explainers (OT, tips, senior, car-loan interest)
3. **OT / Overtime Clarity** — calculator + deduction explainer
4. **Open1040** — simple federal worksheet (scoped)
5. **For preparers** — send clients a branded intake link (waitlist or early access)

### Remove / soften

- Language that positions TaxClarity as “tax preparation” category-first
- “No Paywalls” absolute if paid optional packets exist — replace with **No surprise paywalls on free tools**
- Stat strip that implies filing product metrics

### Keep

- Free / open-source / local-first signals
- CPA/EA shoebox → organized intake pitch (this is B2B seed)

---

## 4. Product tiers

### FREE (permanent acquisition engine)

| Capability | Notes |
|---|---|
| Tax Readiness diagnostic | Score + gaps; no paywall on basic result |
| Basic document checklist | Personalized from answers |
| OT calculator + overtime explainer | Expand beyond net-pay calc |
| Tax-change explainers (TY2026) | Interactive, not blog posts |
| Simple Open1040 | Keep scope gates |
| Filing-deadline guidance | Federal + state when structured data exists |
| State requirement **lookups** | Start HI + high-traffic states; structured JSON |
| Refund/payment explainers | Educational |

**Brand line:** Tax tools should be free.

### PAID — Consumer

| Product | Test price | Trigger | Deliverable |
|---|---|---|---|
| **Ready Packet** | $19–$29 | After readiness result | Downloadable personalized checklist, missing-doc report, income-source summary, deduction/credit review areas, questions for preparer, CPA-ready structured summary |
| **TaxClarity Review** | $39–$69 | User already prepared elsewhere | Deterministic consistency checks + question surfacing — **not** “tax advice” |
| **Late / Extension Ready** | $29–$49 | Apr 16–Oct 15 mode | Late Filing Action Plan: extension?, owe?, paid?, missing docs?, prior unfiled? |
| **TaxClarity 365** | $3.99/mo or $29/yr | Post-file retention | Year-round readiness: estimated payments, life events, side income, W-4 review prompts, document vault checklist |

### PAID — B2B (priority revenue)

| Offer | Test price | Notes |
|---|---|---|
| Preparer Solo | $49/mo in season | ~50 client intakes |
| Preparer Practice | $99/mo | ~200 clients, branding, exports, team |
| Season Pass | $249–$399 | Jan–Apr |
| **Pay-per-intake pilot** | $3–$5 / completed intake | Lowest-friction B2B wedge — prefer for first 10 preparers |

**Preparer deliverable per client:**

- Client summary
- Likely filing complexity
- Missing documents
- Income-source list
- Life-event flags
- Questions needing professional judgment
- Client-ready checklist

Route: `taxclarity.io/p/{slug}`

### Explicitly deferred pricing

- Enterprise VITA / employer / counselor packages (design later)
- Any “we file for you” SKU

---

## 5. Tax Readiness — killer feature spec

### Entry question

> Are you ready to file?

### Inputs the diagnostic must cover

- Filing status
- Income types (W-2, 1099 variants, SE, investments, crypto, retirement, other)
- Dependents
- Education
- Retirement distributions/contributions
- Health coverage where relevant
- Homeownership / mortgage / rental
- Estimated payments
- State filing obligations / multi-state
- Major life changes
- Credits/deductions that may matter (incl. TY2026: tips, overtime premium, car-loan interest, senior)
- Document inventory + status

### Output shape (required)

```
Status: Ready | Almost Ready | Not Ready

You have:
- …

Still needed:
- …

Things worth checking:
- …   # e.g. qualified overtime deduction, vehicle-loan-interest eligibility

Next step:
- One concrete action sentence
```

### Implementation note vs today’s `/prepare`

`/prepare` is a long CPA intake with a ballpark federal estimate. Evolve it into readiness-first:

1. Shorter branching diagnostic up front → readiness result
2. Optional deep intake for packet / preparer handoff
3. Keep estimate clearly labeled **educational / ballpark** or move estimate behind packet
4. Rename UX from “Tax Diagnostic” to **Tax Readiness** in nav/homepage; keep `/prepare` redirect if needed

### Scoring (v1 — deterministic)

Suggested dimensions (0–100 composite):

| Dimension | Weight | Signal |
|---|---|---|
| Identity & filing status complete | 15 | status, name, residency |
| Income sources declared | 25 | each source type answered |
| Documents present | 35 | required docs not in need/unsure |
| State obligations addressed | 15 | primary + other states |
| Life events / credits reviewed | 10 | checklist of TY-relevant prompts |

Do not charge to see the score.

---

## 6. January 2027 launch features

### P0 — must ship for January

1. **Homepage rewrite** (CTA + category + trust line)
2. **Tax Readiness v1** (free score + gaps + next step)
3. **Ready Packet v1** ($19–$29) — PDF or well-formatted printable/download JSON+HTML
4. **Overtime Clarity v1** — fold or deep-link OT tool + explainer that premium OT ≠ entire OT paycheck; caps/phaseouts cited from IRS working-families materials
5. **“What changed for 2026 taxes?”** hub with 3–5 interactive explainers (standard deduction amounts, tips, OT, car-loan interest, senior)
6. **Preparer waitlist + pay-per-intake pilot scaffolding** (`/p/[slug]` stub, email capture, manual export OK)
7. **Compliance copy pass** across all surfaces
8. **Email capture** on readiness result (Get Ready → Organize funnel)

### P1 — February–April

1. Preparer dashboard (list intakes, status, export)
2. Season pass / Solo billing
3. TaxClarity Review (deterministic checks only)
4. State intelligence JSON for HI + CA + NY + TX + FL (minimum useful set; HI first)
5. Calendar-aware homepage modes (Organize → Finish)

### P2 — Apr 16+

1. Late / Extension Ready mode + paid Action Plan
2. Prior-year unfiled prompts
3. Payment-vs-filing distinction education

### P3 — post-season / year-round

1. TaxClarity 365
2. Broader state coverage
3. Enterprise org packages
4. Shared Brownefield readiness engine extraction with ApplyReady (conceptual alignment first; code share later)

---

## 7. Seasonal calendar (product modes)

| Window | Mode | Homepage emphasis | Sell |
|---|---|---|---|
| Nov–Dec 2026 | **Get Ready** | Tax season is coming; what changed | Email list; free readiness |
| Jan–Feb 2027 | **Organize** | What are you still waiting for? | Ready Packet; preparer intake |
| Mar–Apr 15 | **Finish** | Are you ready to file? | Packet; referral/review; preparer tools |
| Apr 16–Oct 15 | **Late / Extension** | Missed Tax Day? You still have options. | Extension Ready; Late Action Plan |
| Oct–Dec | **Plan** | Fix it before Dec 31 | 365; year-end checklist → Jan |

Implement mode as config driven by date (with manual override for staging).

---

## 8. Data & database model

### Principle

Free readiness can stay **browser-local** (localStorage) like today.  
Paid packet, preparer intake, and 365 require **accounts + server persistence**.

Do not silently upload document binaries in free mode.

### Suggested schema (Postgres / Supabase-friendly)

```text
users
  id, email, role (consumer|preparer|admin), created_at

profiles
  user_id, display_name, home_state, timezone

preparers
  id, user_id, slug, practice_name, plan (pilot|solo|practice|season),
  brand_color, logo_url, stripe_customer_id, created_at

tax_years
  year, label, is_current

readiness_sessions
  id, user_id nullable, preparer_id nullable, tax_year,
  status (in_progress|scored|packet_purchased|handed_off),
  score, score_breakdown jsonb,
  answers jsonb,          -- diagnostic answers
  document_statuses jsonb,
  flags jsonb,            -- life events, complexity
  next_action text,
  created_at, updated_at, completed_at

packets
  id, session_id, product (ready|late|review),
  price_cents, stripe_payment_id,
  payload jsonb,          -- generated packet content
  created_at

intakes
  id, preparer_id, session_id, client_label,
  complexity enum (simple|moderate|complex|unknown),
  export_snapshot jsonb,
  created_at

state_rules
  id, state, tax_year,
  filing_requirement text,
  deadline date,
  extension_rule text,
  income_threshold jsonb,
  residency_rules text,
  credits jsonb,
  forms jsonb,
  source_url text,
  effective_date date,
  last_verified date,
  UNIQUE(state, tax_year)

subscriptions
  id, user_id, product (tc365|preparer_solo|…),
  status, current_period_end, stripe_subscription_id

events_365
  id, user_id, tax_year, event_type, occurred_on, notes, created_at
```

### State rules content standard

Every `state_rules` row **must** include `source_url`, `effective_date`, `last_verified`.  
No unsourced static law dumps.

### Readiness answers JSON (v1 shape)

Align with ApplyReady pattern:

```json
{
  "destination": "file_correctly",
  "filing_status": "single",
  "tax_year": 2026,
  "residency": { "primary": "HI", "other": [] },
  "income_sources": ["w2", "1099_int"],
  "requirements": ["w2", "1099_int", "prior_return"],
  "evidence": [{ "doc": "w2", "status": "have" }],
  "gaps": ["1098_t", "1099_nec"],
  "actions": ["Locate 1098-T before filing"],
  "checks": ["qualified_overtime_deduction"]
}
```

### Migration path from `/prepare`

Map existing `FormState` fields into `readiness_sessions.answers` + `document_statuses`. Prefer extracting types from `prepare/page.tsx` into `src/domain/readiness/` rather than growing the 900+ line page further.

---

## 9. Overtime Clarity (expand OT tool)

Current OT calc focuses on net overtime pay / LES parsing. Expand to tax-readiness messaging:

1. Did you work **qualified** overtime in tax year 2026?
2. Explain: deduction generally applies to the **premium portion**, not the entire overtime paycheck
3. Show documentation to look for (pay stubs / LES / employer statements)
4. Surface caps / phaseouts as published by IRS for the year
5. Emit a readiness flag: `checks: ["qualified_overtime_deduction"]`

Keep calculator free. Optional: include OT worksheet page inside Ready Packet.

Cite IRS Working Families Tax Cuts materials in UI footnotes; version by tax year.

---

## 10. Engineering conventions for agents

1. **Next.js:** This repo’s Next version may differ from training data — read `node_modules/next/dist/docs/` before new APIs.
2. **Privacy:** Free tools remain browser-local unless feature is explicitly paid/account.
3. **Determinism:** Readiness scoring and Review checks are rules, not LLM guesses. LLMs may help explain UI copy, not invent tax liability.
4. **Year-versioned rules:** Follow Open1040 pattern `rules/{year}/` for constants.
5. **Copy:** Prefer calm, precise TaxClarity voice; no hype; no “guaranteed refund.”
6. **Tests:** Add vitest coverage for readiness scoring, document requirement derivation, and state rule lookups.
7. **Do not** add PTIN/EFIN flows, IRS submission, or “substantially prepare a return for compensation” features in 2027 scope.

---

## 11. Explicit defer list

Defer unless this spec is amended:

- Full 50-state exhaustive legal encyclopedia as prose
- AI that fills Form 1040 line-by-line for complex returns
- Paid human tax preparation by Brownefield
- Automatic IRS e-file
- Crypto tax lot engines
- Full Schedule C bookkeeping suite
- Mobile native apps
- Merging ApplyReady and TaxClarity codebases
- Sudden sitewide paywall after April 15
- Advertising “tax advice” without credentialed professionals

---

## 12. Success metrics (first season)

| Metric | Target signal |
|---|---|
| Readiness completions | Funnel health |
| Email captures from readiness | Get Ready acquisition |
| Ready Packet conversion | Free → paid work product |
| Preparer pilot intakes | B2B wedge validation ($3–$5) |
| OT explainer organic traffic | Hook for TY2026 changes |
| Support/compliance incidents | Must stay near zero |

Vanity metric to ignore: “returns filed on TaxClarity.”

---

## 13. Implementation order for Claude (checklist)

### Phase A — Positioning (days, not weeks of calendar; ship sequentially)

- [ ] Rewrite `src/app/page.tsx` per §3
- [ ] Update metadata/titles away from prep-first framing
- [ ] Add seasonal mode helper + Nov/Dec or Jan default
- [ ] Compliance/disclaimer consistency pass

### Phase B — Readiness v1

- [ ] Extract domain types from `/prepare` → `src/domain/readiness/`
- [ ] Build branching diagnostic → score + gaps UI
- [ ] Keep `/prepare` as deep intake or redirect
- [ ] localStorage persistence for free sessions
- [ ] Unit tests for scoring + required docs

### Phase C — Ready Packet

- [ ] Stripe (or existing Brownefield billing) checkout for packet
- [ ] Generate downloadable packet from session
- [ ] Thank-you + “share with preparer” affordance

### Phase D — Overtime Clarity + 2026 changes hub

- [ ] `/changes/2026` hub
- [ ] Integrate or redirect OT calc; add premium-portion explainer
- [ ] Wire checks into readiness

### Phase E — Preparer pilot

- [ ] `preparers` + `intakes` tables
- [ ] `/p/[slug]` public intake
- [ ] Manual export + $3–$5 invoicing OK for first customers
- [ ] Waitlist CTA on homepage

### Phase F — Only after A–E stable

- [ ] Review product
- [ ] Late mode
- [ ] TaxClarity 365
- [ ] Broader state_rules coverage

---

## 14. Copy snippets (approved direction)

**Homepage primary button:** Check My Tax Readiness  

**Homepage secondary:** Prepare a Simple Return  

**Paid boundary:** We charge only for optional services that organize, review, or help move your tax situation forward.  

**Late mode:** Missed Tax Day? You still have options.  

**365:** Let’s make next year easier.  

**Preparer:** Send clients here before the appointment — they arrive organized, not with a shoebox.  

**Category:** Know before you file.

---

## 15. Source anchors (verify before shipping year-specific numbers)

Agents must re-verify against primary IRS sources before hardcoding amounts:

- IRS individual tax filing / deadlines / extensions
- IRS Working Families Tax Cuts — individuals and workers (TY2026 provisions)
- IRS year-round tax planning reminders
- PTIN / EFIN requirements (boundary reminder — we are not crossing this yet)
- Competitor pricing only for strategy context, never scraped into product claims

When in doubt: link out, date-stamp `last_verified`, and refuse to invent.

---

*End of TaxClarity 2027 Build Specification*
