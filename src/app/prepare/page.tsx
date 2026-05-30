'use client';

import { useState, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

type DocStatus = 'uploaded' | 'have' | 'need' | 'na' | 'unsure' | '';

interface Dependent {
  id: string;
  name: string;
  age: string;
  relationship: string;
  notes: string;
}

interface W2Entry {
  id: string;
  employer: string;
  state: string;
  wages: string;
  withheld: string;
  notes: string;
}

interface Income1099 {
  id: string;
  type: string;
  payer: string;
  amount: string;
  state: string;
  notes: string;
}

interface Property {
  id: string;
  address: string;
  state: string;
  type: 'primary' | 'rental' | 'both';
  ownershipPct: string;
  rentalIncome: string;
  mortgageInterest: string;
  propertyTax: string;
  insurance: string;
  repairs: string;
  maintenance: string;
  utilities: string;
  hoa: string;
  mgmtFees: string;
  depreciation: string;
  priorDepreciation: string;
  improvements: string;
  closingDoc: DocStatus;
  form1098: DocStatus;
  notes: string;
}

interface FormState {
  // Step 1 - Household
  primaryName: string;
  spouseName: string;
  filingStatus: string;
  taxYear: string;
  primaryState: string;
  otherStates: string[];
  dependents: Dependent[];

  // Step 2 - Income
  w2s: W2Entry[];
  has1099: boolean;
  entries1099: Income1099[];
  hasCrypto: boolean;
  cryptoNotes: string;
  hasRetirement: boolean;
  retirementNotes: string;
  investmentIncome: string;
  otherIncome: string;

  // Step 3 - Real Estate
  properties: Property[];

  // Step 4 - Deductions
  charitableCash: string;
  charitableNonCash: string;
  medicalExpenses: string;
  studentLoanInterest: string;
  educationExpenses: string;
  childcareExpenses: string;
  estimatedTaxPayments: string;
  irsNotices: boolean;
  irsNoticesNotes: string;
  deductionNotes: string;

  // Step 5 - Documents
  docStatuses: Record<string, DocStatus>;

  // Step 6 - Notes
  userNotes: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY','DC'
];

const TAX_BRACKETS_2025 = [
  { min: 0, max: 11925, rate: 0.10 },
  { min: 11925, max: 48475, rate: 0.12 },
  { min: 48475, max: 103350, rate: 0.22 },
  { min: 103350, max: 197300, rate: 0.24 },
  { min: 197300, max: 250525, rate: 0.32 },
  { min: 250525, max: 626350, rate: 0.35 },
  { min: 626350, max: Infinity, rate: 0.37 },
];

const STANDARD_DEDUCTION_2025: Record<string, number> = {
  single: 15000,
  mfj: 30000,
  mfs: 15000,
  hoh: 22500,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const uid = () => Math.random().toString(36).slice(2, 9);

const calcFederalTax = (taxableIncome: number): number => {
  let tax = 0;
  for (const bracket of TAX_BRACKETS_2025) {
    if (taxableIncome <= bracket.min) break;
    const taxable = Math.min(taxableIncome, bracket.max) - bracket.min;
    tax += taxable * bracket.rate;
  }
  return tax;
};

const fmt = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

const num = (s: string) => parseFloat(s.replace(/[^0-9.]/g, '')) || 0;

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatusSelect = ({
  value, onChange, label,
}: { value: DocStatus; onChange: (v: DocStatus) => void; label: string }) => (
  <div style={{ marginBottom: '0.75rem' }}>
    <label style={{ fontSize: '13px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>{label}</label>
    <select
      value={value}
      onChange={e => onChange(e.target.value as DocStatus)}
      style={{
        background: '#1e2a3a', border: '1px solid #2d3f55', borderRadius: '7px',
        color: value ? '#e2e8f0' : '#64748b', padding: '8px 12px', fontSize: '13px',
        width: '100%', cursor: 'pointer',
      }}
    >
      <option value="">— Select status —</option>
      <option value="uploaded">✅ Uploaded</option>
      <option value="have">📁 Have it, not uploaded</option>
      <option value="need">🔍 Need to find it</option>
      <option value="na">➖ Not applicable</option>
      <option value="unsure">❓ Not sure</option>
    </select>
  </div>
);

const Input = ({
  label, value, onChange, placeholder = '', type = 'text', hint = '',
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; hint?: string;
}) => (
  <div style={{ marginBottom: '1rem' }}>
    <label style={{ fontSize: '13px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
      {label}
      {hint && <span style={{ color: '#475569', marginLeft: '6px', fontStyle: 'italic' }}>{hint}</span>}
    </label>
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: '100%', background: '#1e2a3a', border: '1px solid #2d3f55',
        borderRadius: '7px', color: '#e2e8f0', padding: '10px 12px',
        fontSize: '14px', outline: 'none',
      }}
    />
  </div>
);

const Select = ({
  label, value, onChange, options,
}: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) => (
  <div style={{ marginBottom: '1rem' }}>
    <label style={{ fontSize: '13px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>{label}</label>
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        width: '100%', background: '#1e2a3a', border: '1px solid #2d3f55',
        borderRadius: '7px', color: value ? '#e2e8f0' : '#64748b',
        padding: '10px 12px', fontSize: '14px',
      }}
    >
      <option value="">— Select —</option>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);

const Textarea = ({
  label, value, onChange, placeholder = '',
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) => (
  <div style={{ marginBottom: '1rem' }}>
    <label style={{ fontSize: '13px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>{label}</label>
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={3}
      style={{
        width: '100%', background: '#1e2a3a', border: '1px solid #2d3f55',
        borderRadius: '7px', color: '#e2e8f0', padding: '10px 12px',
        fontSize: '14px', resize: 'vertical', outline: 'none',
      }}
    />
  </div>
);

const Toggle = ({
  label, value, onChange, hint = '',
}: { label: string; value: boolean; onChange: (v: boolean) => void; hint?: string }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', padding: '12px 16px', background: '#1a2535', borderRadius: '10px', border: '1px solid #2d3f55' }}>
    <div>
      <div style={{ fontSize: '14px', color: '#e2e8f0', fontWeight: 500 }}>{label}</div>
      {hint && <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>{hint}</div>}
    </div>
    <button
      onClick={() => onChange(!value)}
      style={{
        width: '44px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer',
        background: value ? '#c8973a' : '#2d3f55', position: 'relative', transition: 'background 0.2s', flexShrink: 0,
      }}
    >
      <span style={{
        position: 'absolute', top: '2px', left: value ? '22px' : '2px',
        width: '20px', height: '20px', borderRadius: '50%', background: '#fff',
        transition: 'left 0.2s', display: 'block',
      }} />
    </button>
  </div>
);

const Card = ({ children, title, accent = false }: { children: React.ReactNode; title?: string; accent?: boolean }) => (
  <div style={{
    background: accent ? 'rgba(200,151,58,0.05)' : '#131c28',
    border: `1px solid ${accent ? 'rgba(200,151,58,0.2)' : '#1e2d40'}`,
    borderRadius: '14px', padding: '1.5rem', marginBottom: '1.25rem',
  }}>
    {title && <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#e2e8f0', marginBottom: '1.25rem', letterSpacing: '-0.3px' }}>{title}</h3>}
    {children}
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const STEPS = ['Household', 'Income', 'Real Estate', 'Deductions', 'Documents', 'Summary'];

const defaultForm = (): FormState => ({
  primaryName: '', spouseName: '', filingStatus: '', taxYear: '2025',
  primaryState: '', otherStates: [], dependents: [],
  w2s: [{ id: uid(), employer: '', state: '', wages: '', withheld: '', notes: '' }],
  has1099: false, entries1099: [], hasCrypto: false, cryptoNotes: '',
  hasRetirement: false, retirementNotes: '', investmentIncome: '', otherIncome: '',
  properties: [],
  charitableCash: '', charitableNonCash: '', medicalExpenses: '',
  studentLoanInterest: '', educationExpenses: '', childcareExpenses: '',
  estimatedTaxPayments: '', irsNotices: false, irsNoticesNotes: '', deductionNotes: '',
  docStatuses: {},
  userNotes: '',
});

export default function PreparePage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(defaultForm());

  const set = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  }, []);

  const setDoc = (key: string, value: DocStatus) => {
    setForm(prev => ({ ...prev, docStatuses: { ...prev.docStatuses, [key]: value } }));
  };

  // ── Estimate Calculator ──────────────────────────────────────────────────────

  const calcEstimate = () => {
    const totalW2 = form.w2s.reduce((s, w) => s + num(w.wages), 0);
    const totalW2Withheld = form.w2s.reduce((s, w) => s + num(w.withheld), 0);
    const total1099 = form.entries1099.reduce((s, e) => s + num(e.amount), 0);
    const totalRentalIncome = form.properties.filter(p => p.type === 'rental' || p.type === 'both')
      .reduce((s, p) => s + num(p.rentalIncome), 0);
    const totalRentalExpenses = form.properties.filter(p => p.type === 'rental' || p.type === 'both')
      .reduce((s, p) => s + num(p.mortgageInterest) + num(p.propertyTax) + num(p.insurance) +
        num(p.repairs) + num(p.maintenance) + num(p.utilities) + num(p.hoa) +
        num(p.mgmtFees) + num(p.depreciation), 0);
    const netRental = Math.max(0, totalRentalIncome - totalRentalExpenses);
    const seTax = total1099 > 400 ? total1099 * 0.9235 * 0.153 : 0;
    const seDeduction = seTax / 2;
    const grossIncome = totalW2 + total1099 + netRental + num(form.investmentIncome) + num(form.otherIncome);
    const stdDed = STANDARD_DEDUCTION_2025[form.filingStatus] || 15000;
    const mortgageInterestTotal = form.properties.filter(p => p.type === 'primary')
      .reduce((s, p) => s + num(p.mortgageInterest), 0);
    const itemized = mortgageInterestTotal + num(form.charitableCash) +
      num(form.charitableNonCash) + num(form.studentLoanInterest);
    const deduction = Math.max(stdDed, itemized);
    const taxableIncome = Math.max(0, grossIncome - deduction - seDeduction - num(form.studentLoanInterest));
    const federalTax = calcFederalTax(taxableIncome);
    const effectiveRate = grossIncome > 0 ? (federalTax / grossIncome) * 100 : 0;
    const estimatedPayments = num(form.estimatedTaxPayments);
    const balance = federalTax - totalW2Withheld - estimatedPayments;
    return {
      totalW2, totalW2Withheld, total1099, totalRentalIncome, totalRentalExpenses,
      netRental, seTax, grossIncome, deduction, stdDed, itemized,
      taxableIncome, federalTax, effectiveRate, estimatedPayments, balance,
      usedItemized: itemized > stdDed,
    };
  };

  // ── CPA Questions Generator ──────────────────────────────────────────────────

  const generateCPAQuestions = () => {
    const qs: string[] = [];
    const hasRental = form.properties.some(p => p.type === 'rental' || p.type === 'both');
    const hasFreelance = form.entries1099.some(e => ['1099-NEC', '1099-MISC', '1099-K'].includes(e.type));
    const multiState = new Set([...form.w2s.map(w => w.state), form.primaryState, ...form.otherStates]).size > 2;
    const hasDepreciation = form.properties.some(p => num(p.depreciation) > 0 || num(p.priorDepreciation) > 0);
    const multiStateW2 = new Set(form.w2s.map(w => w.state).filter(Boolean)).size > 1;
    const multiStateProps = new Set(form.properties.map(p => p.state).filter(Boolean)).size > 1;

    if (hasRental) {
      qs.push('Should rental property income and expenses be reported on Schedule E?');
      qs.push('Are there depreciation records from prior years for each rental property?');
      qs.push('Were any repair expenses actually capital improvements that should be depreciated?');
      qs.push('Is any rental property subject to passive activity loss limitations?');
    }
    if (hasDepreciation) {
      qs.push('What depreciation method was used in prior years (straight-line, MACRS)?');
      qs.push('Has a cost segregation study ever been performed on any property?');
      qs.push('Are there any Section 179 or bonus depreciation elections to consider?');
    }
    if (hasFreelance) {
      qs.push('Should freelance/contractor income be reported on Schedule C or through an entity?');
      qs.push('Are home office or equipment expenses deductible for this income?');
      qs.push('Were quarterly estimated tax payments required and made for self-employment income?');
      qs.push('Is there a qualified business income (QBI) deduction available under Section 199A?');
    }
    if (multiStateW2) {
      qs.push('Do non-resident state filings need to be submitted for states where W-2 income was earned?');
      qs.push('Are there reciprocity agreements between the states where W-2 income was earned?');
    }
    if (multiStateProps) {
      qs.push('Do state filings need to be submitted in each state where rental property is located?');
      qs.push('How should multi-state rental income be allocated between state returns?');
    }
    if (multiState) {
      qs.push('Are there credits available in the primary state for taxes paid to other states?');
    }
    if (form.hasCrypto) {
      qs.push('Are crypto transactions subject to capital gains tax? What records are available?');
      qs.push('Were any crypto assets received as income (mining, staking, airdrops)?');
    }
    if (form.dependents.length > 0) {
      qs.push('Are any dependents eligible for Child Tax Credit or Child and Dependent Care Credit?');
      qs.push('Are there education credits (American Opportunity, Lifetime Learning) available?');
    }
    if (form.irsNotices) {
      qs.push('IRS or state notices were received — please review all notices before the appointment.');
    }
    if (num(form.estimatedTaxPayments) > 0) {
      qs.push('Were estimated tax payments applied correctly to federal and/or state accounts?');
    }
    qs.push('Should standard deduction or itemized deduction be used based on actual figures?');
    qs.push('Are there any carryforward losses (capital losses, rental losses) from prior years?');
    return qs;
  };

  // ── Missing Documents ────────────────────────────────────────────────────────

  const getMissingDocs = () => {
    const missing: string[] = [];
    Object.entries(form.docStatuses).forEach(([key, status]) => {
      if (status === 'need' || status === 'unsure' || status === 'have') missing.push(key);
    });
    form.w2s.forEach((w, i) => {
      if (!w.wages) missing.push(`W-2 wages for employer ${i + 1}${w.employer ? ` (${w.employer})` : ''}`);
    });
    form.properties.forEach((p, i) => {
      if (p.form1098 === 'need' || p.form1098 === 'unsure') missing.push(`Form 1098 for property ${i + 1}`);
      if (p.closingDoc === 'need' || p.closingDoc === 'unsure') missing.push(`Closing disclosure for property ${i + 1}`);
      if ((p.type === 'rental' || p.type === 'both') && !p.priorDepreciation) {
        missing.push(`Prior depreciation records for ${p.address || `property ${i + 1}`}`);
      }
    });
    return missing;
  };

  // ── Render Steps ─────────────────────────────────────────────────────────────

  const renderStep1 = () => (
    <div>
      <Card title="👤 Taxpayer Information">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
          <Input label="Primary Taxpayer Name" value={form.primaryName} onChange={v => set('primaryName', v)} placeholder="Full name" />
          <Input label="Spouse Name (if applicable)" value={form.spouseName} onChange={v => set('spouseName', v)} placeholder="Leave blank if single" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
          <Select label="Filing Status" value={form.filingStatus} onChange={v => set('filingStatus', v)} options={[
            { value: 'single', label: 'Single' },
            { value: 'mfj', label: 'Married Filing Jointly' },
            { value: 'mfs', label: 'Married Filing Separately' },
            { value: 'hoh', label: 'Head of Household' },
            { value: 'unsure', label: 'Not Sure' },
          ]} />
          <Select label="Tax Year" value={form.taxYear} onChange={v => set('taxYear', v)} options={[
            { value: '2025', label: '2025' },
            { value: '2024', label: '2024' },
          ]} />
        </div>
        <Select label="Primary State of Residence" value={form.primaryState} onChange={v => set('primaryState', v)}
          options={US_STATES.map(s => ({ value: s, label: s }))} />
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ fontSize: '13px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
            Other States (worked in or earned income from)
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
            {form.otherStates.map(s => (
              <span key={s} style={{ background: 'rgba(200,151,58,0.15)', border: '1px solid rgba(200,151,58,0.3)', color: '#e8b85a', padding: '4px 10px', borderRadius: '100px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {s}
                <button onClick={() => set('otherStates', form.otherStates.filter(x => x !== s))}
                  style={{ background: 'none', border: 'none', color: '#c8973a', cursor: 'pointer', fontSize: '14px', lineHeight: 1 }}>×</button>
              </span>
            ))}
          </div>
          <select onChange={e => { if (e.target.value && !form.otherStates.includes(e.target.value)) { set('otherStates', [...form.otherStates, e.target.value]); e.target.value = ''; } }}
            style={{ background: '#1e2a3a', border: '1px solid #2d3f55', borderRadius: '7px', color: '#64748b', padding: '10px 12px', fontSize: '14px', width: '100%' }}>
            <option value="">+ Add a state</option>
            {US_STATES.filter(s => !form.otherStates.includes(s) && s !== form.primaryState).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </Card>

      <Card title="👨‍👩‍👧 Dependents">
        {form.dependents.map((dep, i) => (
          <div key={dep.id} style={{ background: '#1a2535', border: '1px solid #2d3f55', borderRadius: '10px', padding: '1rem', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '13px', color: '#c8973a', fontWeight: 600 }}>Dependent {i + 1}</span>
              <button onClick={() => set('dependents', form.dependents.filter(d => d.id !== dep.id))}
                style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171', padding: '3px 10px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>Remove</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 1rem' }}>
              <Input label="Name" value={dep.name} onChange={v => set('dependents', form.dependents.map(d => d.id === dep.id ? { ...d, name: v } : d))} placeholder="Full name" />
              <Input label="Age" value={dep.age} onChange={v => set('dependents', form.dependents.map(d => d.id === dep.id ? { ...d, age: v } : d))} placeholder="Age" type="number" />
              <Input label="Relationship" value={dep.relationship} onChange={v => set('dependents', form.dependents.map(d => d.id === dep.id ? { ...d, relationship: v } : d))} placeholder="Child, parent..." />
            </div>
          </div>
        ))}
        <button onClick={() => set('dependents', [...form.dependents, { id: uid(), name: '', age: '', relationship: '', notes: '' }])}
          style={{ background: 'rgba(200,151,58,0.1)', border: '1px dashed rgba(200,151,58,0.3)', color: '#c8973a', padding: '10px 20px', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', width: '100%' }}>
          + Add Dependent
        </button>
      </Card>
    </div>
  );

  const renderStep2 = () => (
    <div>
      <Card title="💼 W-2 Employment Income">
        <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '1rem' }}>Add one entry per W-2. Include all states.</p>
        {form.w2s.map((w, i) => (
          <div key={w.id} style={{ background: '#1a2535', border: '1px solid #2d3f55', borderRadius: '10px', padding: '1rem', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '13px', color: '#c8973a', fontWeight: 600 }}>W-2 #{i + 1}</span>
              {form.w2s.length > 1 && (
                <button onClick={() => set('w2s', form.w2s.filter(x => x.id !== w.id))}
                  style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171', padding: '3px 10px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>Remove</button>
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0 1rem' }}>
              <Input label="Employer Name" value={w.employer} onChange={v => set('w2s', form.w2s.map(x => x.id === w.id ? { ...x, employer: v } : x))} placeholder="Company name" />
              <Select label="State" value={w.state} onChange={v => set('w2s', form.w2s.map(x => x.id === w.id ? { ...x, state: v } : x))} options={US_STATES.map(s => ({ value: s, label: s }))} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
              <Input label="Box 1 — Wages" value={w.wages} onChange={v => set('w2s', form.w2s.map(x => x.id === w.id ? { ...x, wages: v } : x))} placeholder="$0.00" />
              <Input label="Box 2 — Federal Tax Withheld" value={w.withheld} onChange={v => set('w2s', form.w2s.map(x => x.id === w.id ? { ...x, withheld: v } : x))} placeholder="$0.00" />
            </div>
            <Textarea label="Notes (overtime, bonuses, multiple states, etc.)" value={w.notes} onChange={v => set('w2s', form.w2s.map(x => x.id === w.id ? { ...x, notes: v } : x))} placeholder="Any special circumstances..." />
          </div>
        ))}
        <button onClick={() => set('w2s', [...form.w2s, { id: uid(), employer: '', state: '', wages: '', withheld: '', notes: '' }])}
          style={{ background: 'rgba(200,151,58,0.1)', border: '1px dashed rgba(200,151,58,0.3)', color: '#c8973a', padding: '10px 20px', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', width: '100%' }}>
          + Add Another W-2
        </button>
      </Card>

      <Toggle label="Do you have 1099 / Freelance / Contractor Income?" value={form.has1099} onChange={v => set('has1099', v)} hint="1099-NEC, 1099-K, 1099-MISC, invoices, gig work" />

      {form.has1099 && (
        <Card title="🧾 1099 / Contractor Income">
          {form.entries1099.map((e, i) => (
            <div key={e.id} style={{ background: '#1a2535', border: '1px solid #2d3f55', borderRadius: '10px', padding: '1rem', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '13px', color: '#c8973a', fontWeight: 600 }}>Entry #{i + 1}</span>
                <button onClick={() => set('entries1099', form.entries1099.filter(x => x.id !== e.id))}
                  style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171', padding: '3px 10px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>Remove</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0 1rem' }}>
                <Select label="Type" value={e.type} onChange={v => set('entries1099', form.entries1099.map(x => x.id === e.id ? { ...x, type: v } : x))}
                  options={[
                    { value: '1099-NEC', label: '1099-NEC' }, { value: '1099-K', label: '1099-K' },
                    { value: '1099-MISC', label: '1099-MISC' }, { value: 'Invoice', label: 'Invoice/Other' },
                  ]} />
                <Input label="Payer" value={e.payer} onChange={v => set('entries1099', form.entries1099.map(x => x.id === e.id ? { ...x, payer: v } : x))} placeholder="Company" />
                <Input label="Amount" value={e.amount} onChange={v => set('entries1099', form.entries1099.map(x => x.id === e.id ? { ...x, amount: v } : x))} placeholder="$0" />
                <Select label="State" value={e.state} onChange={v => set('entries1099', form.entries1099.map(x => x.id === e.id ? { ...x, state: v } : x))} options={US_STATES.map(s => ({ value: s, label: s }))} />
              </div>
            </div>
          ))}
          <button onClick={() => set('entries1099', [...form.entries1099, { id: uid(), type: '', payer: '', amount: '', state: '', notes: '' }])}
            style={{ background: 'rgba(200,151,58,0.1)', border: '1px dashed rgba(200,151,58,0.3)', color: '#c8973a', padding: '10px 20px', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', width: '100%' }}>
            + Add 1099 Entry
          </button>
        </Card>
      )}

      <Toggle label="Cryptocurrency transactions?" value={form.hasCrypto} onChange={v => set('hasCrypto', v)} hint="Sales, trades, staking, airdrops, mining" />
      {form.hasCrypto && <Card><Textarea label="Crypto Notes" value={form.cryptoNotes} onChange={v => set('cryptoNotes', v)} placeholder="Exchanges used, approximate total transactions, staking income..." /></Card>}

      <Toggle label="Retirement distributions (1099-R, pension, SSA)?" value={form.hasRetirement} onChange={v => set('hasRetirement', v)} />
      {form.hasRetirement && <Card><Textarea label="Retirement Notes" value={form.retirementNotes} onChange={v => set('retirementNotes', v)} placeholder="Type of distribution, approximate amount, early withdrawal?" /></Card>}

      <Card title="📈 Other Income">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
          <Input label="Investment / Dividend Income (1099-DIV, 1099-INT)" value={form.investmentIncome} onChange={v => set('investmentIncome', v)} placeholder="$0" />
          <Input label="Other Income" value={form.otherIncome} onChange={v => set('otherIncome', v)} placeholder="$0" hint="alimony, prizes, etc." />
        </div>
      </Card>
    </div>
  );

  const renderStep3 = () => (
    <div>
      <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '1.5rem', lineHeight: 1.6 }}>
        Add each property separately. For multi-state portfolios, track each property independently — your CPA will need state-level detail for Schedule E and state returns.
      </p>
      {form.properties.map((p, i) => (
        <Card key={p.id}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#e2e8f0' }}>
              🏠 Property {i + 1} {p.address ? `— ${p.address}` : ''}
            </h3>
            <button onClick={() => set('properties', form.properties.filter(x => x.id !== p.id))}
              style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', color: '#f87171', padding: '4px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>Remove</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '0 1rem' }}>
            <Input label="Property Address" value={p.address} onChange={v => set('properties', form.properties.map(x => x.id === p.id ? { ...x, address: v } : x))} placeholder="123 Main St, City" />
            <Select label="State" value={p.state} onChange={v => set('properties', form.properties.map(x => x.id === p.id ? { ...x, state: v } : x))} options={US_STATES.map(s => ({ value: s, label: s }))} />
            <Select label="Property Type" value={p.type} onChange={v => set('properties', form.properties.map(x => x.id === p.id ? { ...x, type: v as Property['type'] } : x))} options={[
              { value: 'primary', label: 'Primary Residence' },
              { value: 'rental', label: 'Rental Property' },
              { value: 'both', label: 'Both (partial rental)' },
            ]} />
          </div>

          {(p.type === 'rental' || p.type === 'both') && (
            <>
              <div style={{ borderTop: '1px solid #1e2d40', paddingTop: '1rem', marginTop: '0.5rem', marginBottom: '1rem' }}>
                <p style={{ fontSize: '12px', color: '#c8973a', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Rental Income</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
                  <Input label="Gross Rental Income" value={p.rentalIncome} onChange={v => set('properties', form.properties.map(x => x.id === p.id ? { ...x, rentalIncome: v } : x))} placeholder="$0" />
                  <Input label="Ownership %" value={p.ownershipPct} onChange={v => set('properties', form.properties.map(x => x.id === p.id ? { ...x, ownershipPct: v } : x))} placeholder="100" hint="if co-owned" />
                </div>
              </div>
              <div style={{ borderTop: '1px solid #1e2d40', paddingTop: '1rem', marginBottom: '1rem' }}>
                <p style={{ fontSize: '12px', color: '#c8973a', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Rental Expenses</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 1rem' }}>
                  <Input label="Mortgage Interest" value={p.mortgageInterest} onChange={v => set('properties', form.properties.map(x => x.id === p.id ? { ...x, mortgageInterest: v } : x))} placeholder="$0" />
                  <Input label="Property Taxes" value={p.propertyTax} onChange={v => set('properties', form.properties.map(x => x.id === p.id ? { ...x, propertyTax: v } : x))} placeholder="$0" />
                  <Input label="Insurance" value={p.insurance} onChange={v => set('properties', form.properties.map(x => x.id === p.id ? { ...x, insurance: v } : x))} placeholder="$0" />
                  <Input label="Repairs" value={p.repairs} onChange={v => set('properties', form.properties.map(x => x.id === p.id ? { ...x, repairs: v } : x))} placeholder="$0" />
                  <Input label="Maintenance" value={p.maintenance} onChange={v => set('properties', form.properties.map(x => x.id === p.id ? { ...x, maintenance: v } : x))} placeholder="$0" />
                  <Input label="Utilities (owner-paid)" value={p.utilities} onChange={v => set('properties', form.properties.map(x => x.id === p.id ? { ...x, utilities: v } : x))} placeholder="$0" />
                  <Input label="HOA Fees" value={p.hoa} onChange={v => set('properties', form.properties.map(x => x.id === p.id ? { ...x, hoa: v } : x))} placeholder="$0" />
                  <Input label="Property Management" value={p.mgmtFees} onChange={v => set('properties', form.properties.map(x => x.id === p.id ? { ...x, mgmtFees: v } : x))} placeholder="$0" />
                  <Input label="Major Improvements" value={p.improvements} onChange={v => set('properties', form.properties.map(x => x.id === p.id ? { ...x, improvements: v } : x))} placeholder="$0" hint="may need to be capitalized" />
                </div>
              </div>
              <div style={{ borderTop: '1px solid #1e2d40', paddingTop: '1rem', marginBottom: '1rem' }}>
                <p style={{ fontSize: '12px', color: '#c8973a', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Depreciation</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
                  <Input label="Current Year Depreciation (if known)" value={p.depreciation} onChange={v => set('properties', form.properties.map(x => x.id === p.id ? { ...x, depreciation: v } : x))} placeholder="$0" hint="CPA can calculate" />
                  <Input label="Prior Year Accumulated Depreciation" value={p.priorDepreciation} onChange={v => set('properties', form.properties.map(x => x.id === p.id ? { ...x, priorDepreciation: v } : x))} placeholder="$0" hint="from prior returns" />
                </div>
              </div>
            </>
          )}

          <div style={{ borderTop: '1px solid #1e2d40', paddingTop: '1rem' }}>
            <p style={{ fontSize: '12px', color: '#c8973a', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Document Status</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
              <StatusSelect label="Form 1098 (Mortgage Interest Statement)" value={p.form1098} onChange={v => set('properties', form.properties.map(x => x.id === p.id ? { ...x, form1098: v } : x))} />
              <StatusSelect label="Closing Disclosure (if bought/sold this year)" value={p.closingDoc} onChange={v => set('properties', form.properties.map(x => x.id === p.id ? { ...x, closingDoc: v } : x))} />
            </div>
          </div>
          <Textarea label="Property Notes" value={p.notes} onChange={v => set('properties', form.properties.map(x => x.id === p.id ? { ...x, notes: v } : x))} placeholder="Anything your CPA should know about this property..." />
        </Card>
      ))}

      <button onClick={() => set('properties', [...form.properties, {
        id: uid(), address: '', state: '', type: 'rental', ownershipPct: '100',
        rentalIncome: '', mortgageInterest: '', propertyTax: '', insurance: '',
        repairs: '', maintenance: '', utilities: '', hoa: '', mgmtFees: '',
        depreciation: '', priorDepreciation: '', improvements: '',
        closingDoc: '', form1098: '', notes: '',
      }])}
        style={{ background: 'rgba(200,151,58,0.1)', border: '1px dashed rgba(200,151,58,0.3)', color: '#c8973a', padding: '14px 20px', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', width: '100%' }}>
        + Add Property
      </button>
    </div>
  );

  const renderStep4 = () => (
    <div>
      <Card title="🎁 Charitable Contributions">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
          <Input label="Cash Donations" value={form.charitableCash} onChange={v => set('charitableCash', v)} placeholder="$0" />
          <Input label="Non-Cash Donations (est. value)" value={form.charitableNonCash} onChange={v => set('charitableNonCash', v)} placeholder="$0" hint="clothing, goods, vehicles" />
        </div>
      </Card>
      <Card title="🏥 Medical & Other Deductions">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
          <Input label="Medical Expenses (out-of-pocket)" value={form.medicalExpenses} onChange={v => set('medicalExpenses', v)} placeholder="$0" hint=">7.5% AGI threshold" />
          <Input label="Student Loan Interest" value={form.studentLoanInterest} onChange={v => set('studentLoanInterest', v)} placeholder="$0" />
          <Input label="Education Expenses" value={form.educationExpenses} onChange={v => set('educationExpenses', v)} placeholder="$0" />
          <Input label="Childcare / Dependent Care" value={form.childcareExpenses} onChange={v => set('childcareExpenses', v)} placeholder="$0" />
          <Input label="Estimated Tax Payments Made" value={form.estimatedTaxPayments} onChange={v => set('estimatedTaxPayments', v)} placeholder="$0" hint="federal + state combined" />
        </div>
      </Card>
      <Toggle label="Did you receive any IRS or state tax notices?" value={form.irsNotices} onChange={v => set('irsNotices', v)} />
      {form.irsNotices && <Card><Textarea label="Describe the notice(s)" value={form.irsNoticesNotes} onChange={v => set('irsNoticesNotes', v)} placeholder="Type of notice, year it relates to, any response deadline..." /></Card>}
      <Card><Textarea label="Additional Deduction Notes" value={form.deductionNotes} onChange={v => set('deductionNotes', v)} placeholder="Business expenses, union dues, professional licenses, energy credits, moving expenses, anything else..." /></Card>
    </div>
  );

  const renderStep5 = () => {
    const docs = [
      { key: 'w2-all', label: 'All W-2 forms received' },
      { key: 'last-paystub', label: 'Last paystub of the year' },
      { key: '1099-nec', label: '1099-NEC (contractor income)' },
      { key: '1099-k', label: '1099-K (payment processor)' },
      { key: '1099-int', label: '1099-INT (bank interest)' },
      { key: '1099-div', label: '1099-DIV (dividends)' },
      { key: '1099-b', label: '1099-B (investment sales)' },
      { key: '1099-r', label: '1099-R (retirement distributions)' },
      { key: 'ssa-1099', label: 'SSA-1099 (Social Security)' },
      { key: '1099-g', label: '1099-G (unemployment)' },
      { key: 'crypto-records', label: 'Crypto transaction records' },
      { key: 'prior-return', label: 'Prior year tax return' },
      { key: 'id', label: 'Government-issued ID' },
      { key: 'estimated-payments', label: 'Estimated tax payment records' },
    ];
    return (
      <div>
        <Card title="📂 Document Checklist">
          <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '1.25rem' }}>Mark the status of each document.</p>
          {docs.map(d => (
            <StatusSelect key={d.key} label={d.label} value={form.docStatuses[d.key] || ''} onChange={v => setDoc(d.key, v)} />
          ))}
        </Card>
        <Card><Textarea label="Additional Notes for CPA" value={form.userNotes} onChange={v => set('userNotes', v)} placeholder="Anything else your CPA should know before your appointment..." /></Card>
      </div>
    );
  };

  const renderStep6 = () => {
    const est = calcEstimate();
    const questions = generateCPAQuestions();
    const missing = getMissingDocs();
    const allStates = [...new Set([form.primaryState, ...form.otherStates, ...form.w2s.map(w => w.state), ...form.properties.map(p => p.state)].filter(Boolean))];

    return (
      <div>
        {/* Disclaimer */}
        <div style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: '10px', padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
          <p style={{ fontSize: '13px', color: '#fca5a5', lineHeight: 1.6 }}>
            <strong>Disclaimer:</strong> TaxClarity is an organization and readiness tool. It does not file tax returns, calculate final tax liability, or provide legal, accounting, or tax advice. The estimate below is educational only. Please review all information with a qualified tax professional before making any financial decisions.
          </p>
        </div>

        {/* Household Overview */}
        <Card title="👤 Household Overview" accent>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem 2rem' }}>
            {[
              ['Primary Taxpayer', form.primaryName || '—'],
              ['Spouse', form.spouseName || 'N/A'],
              ['Filing Status', form.filingStatus || '—'],
              ['Tax Year', form.taxYear],
              ['Primary State', form.primaryState || '—'],
              ['States Involved', allStates.join(', ') || '—'],
              ['Dependents', form.dependents.length.toString()],
              ['Properties', form.properties.length.toString()],
            ].map(([k, v]) => (
              <div key={k} style={{ padding: '8px 0', borderBottom: '1px solid #1e2d40' }}>
                <div style={{ fontSize: '11px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{k}</div>
                <div style={{ fontSize: '14px', color: '#e2e8f0', fontWeight: 500, marginTop: '2px' }}>{v}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Income Summary */}
        <Card title="💰 Income Summary">
          {form.w2s.map((w, i) => w.wages && (
            <div key={w.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #1e2d40', fontSize: '14px' }}>
              <span style={{ color: '#94a3b8' }}>W-2 #{i + 1} {w.employer ? `(${w.employer})` : ''} — {w.state}</span>
              <span style={{ color: '#e2e8f0', fontWeight: 500 }}>{fmt(num(w.wages))}</span>
            </div>
          ))}
          {form.entries1099.map((e, i) => e.amount && (
            <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #1e2d40', fontSize: '14px' }}>
              <span style={{ color: '#94a3b8' }}>{e.type} — {e.payer || `Entry ${i + 1}`}</span>
              <span style={{ color: '#e2e8f0', fontWeight: 500 }}>{fmt(num(e.amount))}</span>
            </div>
          ))}
          {est.totalRentalIncome > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #1e2d40', fontSize: '14px' }}>
              <span style={{ color: '#94a3b8' }}>Net Rental Income ({form.properties.length} {form.properties.length === 1 ? 'property' : 'properties'})</span>
              <span style={{ color: '#e2e8f0', fontWeight: 500 }}>{fmt(est.netRental)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontSize: '15px', fontWeight: 600 }}>
            <span style={{ color: '#c8973a' }}>Estimated Gross Income</span>
            <span style={{ color: '#c8973a' }}>{fmt(est.grossIncome)}</span>
          </div>
        </Card>

        {/* Real Estate Summary */}
        {form.properties.length > 0 && (
          <Card title="🏠 Real Estate Summary">
            {form.properties.map((p, i) => (
              <div key={p.id} style={{ marginBottom: '1rem', padding: '1rem', background: '#1a2535', borderRadius: '10px' }}>
                <div style={{ fontWeight: 600, fontSize: '14px', color: '#e2e8f0', marginBottom: '8px' }}>
                  {p.address || `Property ${i + 1}`} — {p.state} ({p.type})
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 2rem', fontSize: '13px' }}>
                  {p.rentalIncome && <div><span style={{ color: '#64748b' }}>Rental Income: </span><span style={{ color: '#4ade80' }}>{fmt(num(p.rentalIncome))}</span></div>}
                  {p.mortgageInterest && <div><span style={{ color: '#64748b' }}>Mortgage Interest: </span><span style={{ color: '#e2e8f0' }}>{fmt(num(p.mortgageInterest))}</span></div>}
                  {p.propertyTax && <div><span style={{ color: '#64748b' }}>Property Tax: </span><span style={{ color: '#e2e8f0' }}>{fmt(num(p.propertyTax))}</span></div>}
                  {p.depreciation && <div><span style={{ color: '#64748b' }}>Depreciation: </span><span style={{ color: '#e2e8f0' }}>{fmt(num(p.depreciation))}</span></div>}
                  {p.priorDepreciation && <div><span style={{ color: '#64748b' }}>Prior Depreciation: </span><span style={{ color: '#f87171' }}>{fmt(num(p.priorDepreciation))}</span></div>}
                </div>
              </div>
            ))}
          </Card>
        )}

        {/* Ballpark Federal Estimate */}
        <div style={{ background: 'linear-gradient(135deg, rgba(200,151,58,0.08), rgba(45,212,191,0.04))', border: '1px solid rgba(200,151,58,0.25)', borderRadius: '16px', padding: '1.75rem', marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '11px', color: '#c8973a', fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '0.75rem' }}>📊 Ballpark Federal Estimate — Educational Only</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem 2rem', marginBottom: '1.25rem' }}>
            {[
              ['Gross Income', fmt(est.grossIncome)],
              [est.usedItemized ? 'Itemized Deduction' : 'Standard Deduction', fmt(est.deduction)],
              ['Estimated Taxable Income', fmt(est.taxableIncome)],
              ['Estimated Federal Tax', fmt(est.federalTax)],
              ['Effective Rate', `~${est.effectiveRate.toFixed(1)}%`],
              ['W-2 Withholding', fmt(est.totalW2Withheld)],
              ['Estimated Payments', fmt(est.estimatedPayments)],
              [est.balance >= 0 ? 'Estimated Balance Due' : 'Estimated Refund', fmt(Math.abs(est.balance))],
            ].map(([k, v]) => (
              <div key={k} style={{ padding: '8px 0', borderBottom: '1px solid rgba(200,151,58,0.1)' }}>
                <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{k}</div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: k.includes('Balance') ? '#f87171' : k.includes('Refund') ? '#4ade80' : '#e2e8f0', marginTop: '2px' }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '8px', padding: '10px 14px', fontSize: '12px', color: '#475569', lineHeight: 1.6 }}>
            ⚠️ This is a rough federal estimate based on your inputs. It does not account for all credits, carryforwards, AMT, state taxes, or complex situations. Your CPA may arrive at a significantly different figure. Do not use this to make financial decisions.
          </div>
        </div>

        {/* Missing Documents */}
        {missing.length > 0 && (
          <Card title="🔍 Documents Still Needed">
            {missing.map((m, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: '1px solid #1e2d40', fontSize: '14px', color: '#fbbf24' }}>
                <span>⚠️</span><span>{m}</span>
              </div>
            ))}
          </Card>
        )}

        {/* CPA Questions */}
        <Card title="❓ Questions for Your CPA">
          {questions.map((q, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '8px 0', borderBottom: '1px solid #1e2d40', fontSize: '14px', color: '#94a3b8', lineHeight: 1.5 }}>
              <span style={{ color: '#c8973a', fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span><span>{q}</span>
            </div>
          ))}
        </Card>

        {/* User Notes */}
        {form.userNotes && (
          <Card title="📝 Your Notes">
            <p style={{ fontSize: '14px', color: '#94a3b8', lineHeight: 1.6 }}>{form.userNotes}</p>
          </Card>
        )}

        {/* Brownefield Footer */}
        <div style={{ textAlign: 'center', padding: '1rem', fontSize: '12px', color: '#334155', marginTop: '1rem' }}>
          TaxClarity · A Brownefield Holdings Project · Not tax advice
        </div>

        {/* Print Button */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '1.5rem' }}>
          <button onClick={() => window.print()}
            style={{ background: '#c8973a', color: '#0a0e14', padding: '14px 32px', borderRadius: '8px', fontWeight: 600, fontSize: '15px', border: 'none', cursor: 'pointer' }}>
            🖨️ Print / Save as PDF
          </button>
          <button onClick={() => {
            const text = `TaxClarity CPA Summary — ${form.primaryName}\n\nGross Income: ${fmt(est.grossIncome)}\nEst. Federal Tax: ${fmt(est.federalTax)}\nEst. Balance/Refund: ${fmt(Math.abs(est.balance))}\n\nCPA Questions:\n${questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}\n\nMissing Documents:\n${missing.join('\n')}`;
            navigator.clipboard.writeText(text);
          }}
            style={{ background: 'transparent', color: '#94a3b8', padding: '14px 24px', borderRadius: '8px', fontWeight: 500, fontSize: '14px', border: '1px solid #2d3f55', cursor: 'pointer' }}>
            📋 Copy Summary
          </button>
        </div>
      </div>
    );
  };

  const steps = [renderStep1, renderStep2, renderStep3, renderStep4, renderStep5, renderStep6];

  return (
    <div style={{ minHeight: '100vh', background: '#0d1521', color: '#e2e8f0', fontFamily: "'DM Sans', system-ui, sans-serif" }}>

      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(13,21,33,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid #1e2d40', padding: '0 2rem' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
            <div style={{ width: '28px', height: '28px', background: 'linear-gradient(135deg,#c8973a,#e8b85a)', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '12px', color: '#0a0e14' }}>TC</div>
            <span style={{ fontWeight: 700, fontSize: '15px', color: '#e2e8f0' }}>Tax<span style={{ color: '#c8973a' }}>Clarity</span> <span style={{ color: '#475569', fontWeight: 400 }}>/ Prepare</span></span>
          </a>
          <div style={{ fontSize: '13px', color: '#475569' }}>Step {step + 1} of {STEPS.length}</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{ height: '3px', background: '#1e2d40' }}>
        <div style={{ height: '100%', background: 'linear-gradient(90deg,#c8973a,#e8b85a)', width: `${((step + 1) / STEPS.length) * 100}%`, transition: 'width 0.3s ease' }} />
      </div>

      {/* Step Tabs */}
      <div style={{ background: '#0f1824', borderBottom: '1px solid #1e2d40', overflowX: 'auto' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto', display: 'flex', padding: '0 2rem' }}>
          {STEPS.map((s, i) => (
            <button key={s} onClick={() => setStep(i)}
              style={{
                padding: '12px 16px', fontSize: '13px', fontWeight: i === step ? 600 : 400,
                color: i === step ? '#c8973a' : i < step ? '#64748b' : '#334155',
                background: 'none', border: 'none', borderBottom: `2px solid ${i === step ? '#c8973a' : 'transparent'}`,
                cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s',
              }}>
              {i < step ? '✓ ' : ''}{s}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '2rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, letterSpacing: '-0.5px', marginBottom: '0.35rem' }}>{STEPS[step]}</h1>
          <p style={{ fontSize: '14px', color: '#475569' }}>
            {['Tell us about your household and filing situation.',
              'List all sources of income for the tax year.',
              'Enter details for each property you own.',
              'Identify potential deductions and credits.',
              'Track the status of each required document.',
              'Your CPA-ready summary with ballpark federal estimate.'][step]}
          </p>
        </div>

        {steps[step]()}

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #1e2d40' }}>
          <button
            onClick={() => setStep(s => Math.max(0, s - 1))}
            disabled={step === 0}
            style={{ background: 'transparent', border: '1px solid #2d3f55', color: step === 0 ? '#334155' : '#94a3b8', padding: '12px 24px', borderRadius: '8px', fontSize: '14px', cursor: step === 0 ? 'default' : 'pointer' }}>
            ← Back
          </button>
          {step < STEPS.length - 1 ? (
            <button onClick={() => setStep(s => Math.min(STEPS.length - 1, s + 1))}
              style={{ background: '#c8973a', color: '#0a0e14', padding: '12px 28px', borderRadius: '8px', fontWeight: 600, fontSize: '14px', border: 'none', cursor: 'pointer' }}>
              Continue →
            </button>
          ) : (
            <button onClick={() => window.print()}
              style={{ background: '#c8973a', color: '#0a0e14', padding: '12px 28px', borderRadius: '8px', fontWeight: 600, fontSize: '14px', border: 'none', cursor: 'pointer' }}>
              🖨️ Save Summary
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
