'use client';

import { useState, useCallback, useEffect } from 'react';
import { nextGetDeadlines, formatDue, type GetFrequency } from '@/lib/hawaiiGet';

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

  // Step 2b - Hawaii business / GET
  hasGet: boolean;
  getFrequency: string;
  getStartDate: string;
  getHadIncome: string;
  getReturnsFiled: string;

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

const uid = () => Math.random().toString(36).slice(2, 9);

const fmt = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

const num = (s: string) => parseFloat(s.replace(/[^0-9.]/g, '')) || 0;

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatusSelect = ({
  value, onChange, label,
}: { value: DocStatus; onChange: (v: DocStatus) => void; label: string }) => (
  <div style={{ marginBottom: '0.75rem' }}>
    <label style={{ fontSize: '13px', color: '#6B5F52', display: 'block', marginBottom: '4px' }}>{label}</label>
    <select
      value={value}
      onChange={e => onChange(e.target.value as DocStatus)}
      style={{
        background: '#FFFDF8', border: '1px solid #CFC3AF', borderRadius: '7px',
        color: value ? '#2A241D' : '#7A6E60', padding: '8px 12px', fontSize: '13px',
        width: '100%', cursor: 'pointer',
      }}
    >
      <option value="">— Select status —</option>
      <option value="uploaded">✅ Already sent to my preparer</option>
      <option value="have">📁 Have it</option>
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
    <label style={{ fontSize: '13px', color: '#6B5F52', display: 'block', marginBottom: '4px' }}>
      {label}
      {hint && <span style={{ color: '#8A7E70', marginLeft: '6px', fontStyle: 'italic' }}>{hint}</span>}
    </label>
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: '100%', background: '#FFFDF8', border: '1px solid #CFC3AF',
        borderRadius: '7px', color: '#2A241D', padding: '10px 12px',
        fontSize: '14px', outline: 'none',
      }}
    />
  </div>
);

const Select = ({
  label, value, onChange, options,
}: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) => (
  <div style={{ marginBottom: '1rem' }}>
    <label style={{ fontSize: '13px', color: '#6B5F52', display: 'block', marginBottom: '4px' }}>{label}</label>
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        width: '100%', background: '#FFFDF8', border: '1px solid #CFC3AF',
        borderRadius: '7px', color: value ? '#2A241D' : '#7A6E60',
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
    <label style={{ fontSize: '13px', color: '#6B5F52', display: 'block', marginBottom: '4px' }}>{label}</label>
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={3}
      style={{
        width: '100%', background: '#FFFDF8', border: '1px solid #CFC3AF',
        borderRadius: '7px', color: '#2A241D', padding: '10px 12px',
        fontSize: '14px', resize: 'vertical', outline: 'none',
      }}
    />
  </div>
);

const Toggle = ({
  label, value, onChange, hint = '',
}: { label: string; value: boolean; onChange: (v: boolean) => void; hint?: string }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', padding: '12px 16px', background: '#F6F0E4', borderRadius: '10px', border: '1px solid #CFC3AF' }}>
    <div>
      <div style={{ fontSize: '14px', color: '#2A241D', fontWeight: 500 }}>{label}</div>
      {hint && <div style={{ fontSize: '12px', color: '#8A7E70', marginTop: '2px' }}>{hint}</div>}
    </div>
    <button
      onClick={() => onChange(!value)}
      style={{
        width: '44px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer',
        background: value ? '#B07F35' : '#CFC3AF', position: 'relative', transition: 'background 0.2s', flexShrink: 0,
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
    background: accent ? '#F1E4CC' : '#FBF8F1',
    border: '2px solid #2A241D',
    borderRadius: '22px', padding: '1.5rem', marginBottom: '1.25rem',
  }}>
    {title && <h3 style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: '18px', fontWeight: 600, color: '#2A241D', marginBottom: '1.25rem' }}>{title}</h3>}
    {children}
  </div>
);

const BASE_DOCS = [
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
const GET_DOC = { key: 'get-returns', label: 'Hawaii GET returns filed this year (G-45 / G-49)' };
const GET_LABELS: Record<string, string> = {
  monthly: 'Monthly', quarterly: 'Quarterly', semiannual: 'Twice a year', yes: 'Yes', no: 'None yet',
  all: 'All filed', some: 'Some missing', none: 'None filed yet', unsure: 'Not sure',
};
const getLabel = (v: string) => GET_LABELS[v] || v || '—';
const DOC_LABELS: Record<string, string> = Object.fromEntries([...BASE_DOCS, GET_DOC].map(d => [d.key, d.label]));

// ─── Main Component ───────────────────────────────────────────────────────────

const STEPS = ['Household', 'Income', 'Real Estate', 'Deductions', 'Documents', 'Summary'];

const defaultTaxYear = () => {
  const now = new Date();
  return String(now.getMonth() >= 9 ? now.getFullYear() : now.getFullYear() - 1);
};

const STORAGE_KEY = 'taxclarity.readiness.v1';

const defaultForm = (): FormState => ({
  primaryName: '', spouseName: '', filingStatus: '', taxYear: defaultTaxYear(),
  primaryState: '', otherStates: [], dependents: [],
  w2s: [{ id: uid(), employer: '', state: '', wages: '', withheld: '', notes: '' }],
  has1099: false, entries1099: [], hasCrypto: false, cryptoNotes: '',
  hasRetirement: false, retirementNotes: '', investmentIncome: '', otherIncome: '',
  hasGet: false, getFrequency: '', getStartDate: '', getHadIncome: '', getReturnsFiled: '',
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
  const [preparer, setPreparer] = useState<{ name: string; email: string }>({ name: '', email: '' });
  const [copied, setCopied] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Pilot links: /prepare?preparer=Name%20CPA&email=office@example.com — nothing is sent anywhere.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const name = (params.get('preparer') || '').slice(0, 80);
    const email = (params.get('email') || '').slice(0, 120);
    setPreparer({ name, email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : '' });
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) setForm({ ...defaultForm(), ...JSON.parse(saved) });
    } catch { /* storage unavailable — start fresh */ }
    setLoaded(true);
  }, []);

  // Draft stays on this device only, so a person can finish over several sittings.
  useEffect(() => {
    if (!loaded) return;
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(form)); } catch { /* ignore */ }
  }, [form, loaded]);

  useEffect(() => { setCopied(false); }, [form, step]);

  const clearDraft = () => {
    try { window.localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    setForm(defaultForm());
    setStep(0);
  };

  const set = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  }, []);

  const setDoc = (key: string, value: DocStatus) => {
    setForm(prev => ({ ...prev, docStatuses: { ...prev.docStatuses, [key]: value } }));
  };

  // ── Income Totals (no tax calculation — TaxClarity prepares the taxpayer, not the return) ──

  const calcTotals = () => {
    const totalW2 = form.w2s.reduce((s, w) => s + num(w.wages), 0);
    const total1099 = form.entries1099.reduce((s, e) => s + num(e.amount), 0);
    const rentals = form.properties.filter(p => p.type === 'rental' || p.type === 'both');
    const totalRentalIncome = rentals.reduce((s, p) => s + num(p.rentalIncome), 0);
    const totalRentalExpenses = rentals.reduce((s, p) => s + num(p.mortgageInterest) + num(p.propertyTax) +
      num(p.insurance) + num(p.repairs) + num(p.maintenance) + num(p.utilities) + num(p.hoa) +
      num(p.mgmtFees) + num(p.depreciation), 0);
    const netRental = Math.max(0, totalRentalIncome - totalRentalExpenses);
    const grossIncome = totalW2 + total1099 + netRental + num(form.investmentIncome) + num(form.otherIncome);
    return { totalW2, total1099, totalRentalIncome, netRental, grossIncome };
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
    if (form.hasGet) {
      qs.push('Hawaii GET: periodic returns (Form G-45) are required every period, even with $0 income. Have all of this year\'s periods been filed?');
      qs.push('Hawaii GET: is the annual return (Form G-49) for this year filed or scheduled?');
      qs.push('Should gross income on the GET returns be reconciled with business income on the federal return?');
    }
    qs.push('Should standard deduction or itemized deduction be used based on actual figures?');
    qs.push('Are there any carryforward losses (capital losses, rental losses) from prior years?');
    return qs;
  };

  // ── Missing Documents ────────────────────────────────────────────────────────

  const getMissingDocs = () => {
    const missing: string[] = [];
    Object.entries(form.docStatuses).forEach(([key, status]) => {
      if (status === 'need') missing.push(DOC_LABELS[key] || key);
      if (status === 'unsure') missing.push(`${DOC_LABELS[key] || key} — not sure if needed`);
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
    if (form.hasGet && (form.getReturnsFiled === 'some' || form.getReturnsFiled === 'none' || form.getReturnsFiled === 'unsure')) {
      missing.push('Hawaii GET periodic return(s) (G-45) not confirmed filed — file $0 returns for any period with no income');
    }
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
            { value: '2026', label: '2026' },
            { value: '2025', label: '2025' },
            { value: '2024', label: '2024' },
          ]} />
        </div>
        <Select label="Primary State of Residence" value={form.primaryState} onChange={v => set('primaryState', v)}
          options={US_STATES.map(s => ({ value: s, label: s }))} />
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ fontSize: '13px', color: '#6B5F52', display: 'block', marginBottom: '4px' }}>
            Other States (worked in or earned income from)
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
            {form.otherStates.map(s => (
              <span key={s} style={{ background: 'rgba(200,151,58,0.15)', border: '1px solid rgba(200,151,58,0.3)', color: '#C9974B', padding: '4px 10px', borderRadius: '100px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {s}
                <button onClick={() => set('otherStates', form.otherStates.filter(x => x !== s))}
                  style={{ background: 'none', border: 'none', color: '#B07F35', cursor: 'pointer', fontSize: '14px', lineHeight: 1 }}>×</button>
              </span>
            ))}
          </div>
          <select onChange={e => { if (e.target.value && !form.otherStates.includes(e.target.value)) { set('otherStates', [...form.otherStates, e.target.value]); e.target.value = ''; } }}
            style={{ background: '#FFFDF8', border: '1px solid #CFC3AF', borderRadius: '7px', color: '#7A6E60', padding: '10px 12px', fontSize: '14px', width: '100%' }}>
            <option value="">+ Add a state</option>
            {US_STATES.filter(s => !form.otherStates.includes(s) && s !== form.primaryState).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </Card>

      <Card title="👨‍👩‍👧 Dependents">
        {form.dependents.map((dep, i) => (
          <div key={dep.id} style={{ background: '#F6F0E4', border: '1px solid #CFC3AF', borderRadius: '10px', padding: '1rem', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '13px', color: '#B07F35', fontWeight: 600 }}>Dependent {i + 1}</span>
              <button onClick={() => set('dependents', form.dependents.filter(d => d.id !== dep.id))}
                style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid #D9A898', color: '#B4452F', padding: '3px 10px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>Remove</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 1rem' }}>
              <Input label="Name" value={dep.name} onChange={v => set('dependents', form.dependents.map(d => d.id === dep.id ? { ...d, name: v } : d))} placeholder="Full name" />
              <Input label="Age" value={dep.age} onChange={v => set('dependents', form.dependents.map(d => d.id === dep.id ? { ...d, age: v } : d))} placeholder="Age" type="number" />
              <Input label="Relationship" value={dep.relationship} onChange={v => set('dependents', form.dependents.map(d => d.id === dep.id ? { ...d, relationship: v } : d))} placeholder="Child, parent..." />
            </div>
          </div>
        ))}
        <button onClick={() => set('dependents', [...form.dependents, { id: uid(), name: '', age: '', relationship: '', notes: '' }])}
          style={{ background: 'rgba(200,151,58,0.1)', border: '1px dashed rgba(200,151,58,0.3)', color: '#B07F35', padding: '10px 20px', borderRadius: '999px', fontSize: '14px', cursor: 'pointer', width: '100%' }}>
          + Add Dependent
        </button>
      </Card>
    </div>
  );

  const renderStep2 = () => (
    <div>
      <Card title="💼 W-2 Employment Income">
        <p style={{ fontSize: '13px', color: '#7A6E60', marginBottom: '1rem' }}>Add one entry per W-2. Include all states.</p>
        {form.w2s.map((w, i) => (
          <div key={w.id} style={{ background: '#F6F0E4', border: '1px solid #CFC3AF', borderRadius: '10px', padding: '1rem', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '13px', color: '#B07F35', fontWeight: 600 }}>W-2 #{i + 1}</span>
              {form.w2s.length > 1 && (
                <button onClick={() => set('w2s', form.w2s.filter(x => x.id !== w.id))}
                  style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid #D9A898', color: '#B4452F', padding: '3px 10px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>Remove</button>
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
          style={{ background: 'rgba(200,151,58,0.1)', border: '1px dashed rgba(200,151,58,0.3)', color: '#B07F35', padding: '10px 20px', borderRadius: '999px', fontSize: '14px', cursor: 'pointer', width: '100%' }}>
          + Add Another W-2
        </button>
      </Card>

      <Toggle label="Do you have 1099 / Freelance / Contractor Income?" value={form.has1099} onChange={v => set('has1099', v)} hint="1099-NEC, 1099-K, 1099-MISC, invoices, gig work" />

      {form.has1099 && (
        <Card title="🧾 1099 / Contractor Income">
          {form.entries1099.map((e, i) => (
            <div key={e.id} style={{ background: '#F6F0E4', border: '1px solid #CFC3AF', borderRadius: '10px', padding: '1rem', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '13px', color: '#B07F35', fontWeight: 600 }}>Entry #{i + 1}</span>
                <button onClick={() => set('entries1099', form.entries1099.filter(x => x.id !== e.id))}
                  style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid #D9A898', color: '#B4452F', padding: '3px 10px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>Remove</button>
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
            style={{ background: 'rgba(200,151,58,0.1)', border: '1px dashed rgba(200,151,58,0.3)', color: '#B07F35', padding: '10px 20px', borderRadius: '999px', fontSize: '14px', cursor: 'pointer', width: '100%' }}>
            + Add 1099 Entry
          </button>
        </Card>
      )}

      <Toggle label="Do you have a Hawaii General Excise Tax (GET) license?" value={form.hasGet} onChange={v => set('hasGet', v)} hint="Any Hawaii business, side hustle, or rental with a GE license number" />

      {form.hasGet && (
        <Card title="🌺 Hawaii business — GET">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
            <Select label="How often do you file GET returns?" value={form.getFrequency} onChange={v => set('getFrequency', v)} options={[
              { value: 'monthly', label: 'Monthly' },
              { value: 'quarterly', label: 'Quarterly' },
              { value: 'semiannual', label: 'Semiannually (twice a year)' },
              { value: 'unsure', label: 'Not sure' },
            ]} />
            <Input label="License start date" value={form.getStartDate} onChange={v => set('getStartDate', v)} type="date" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
            <Select label="Any business income this year?" value={form.getHadIncome} onChange={v => set('getHadIncome', v)} options={[
              { value: 'yes', label: 'Yes' },
              { value: 'no', label: 'No — nothing yet' },
              { value: 'unsure', label: 'Not sure' },
            ]} />
            <Select label="Periodic returns (G-45) filed this year?" value={form.getReturnsFiled} onChange={v => set('getReturnsFiled', v)} options={[
              { value: 'all', label: 'All filed' },
              { value: 'some', label: 'Some missing' },
              { value: 'none', label: 'None filed yet' },
              { value: 'unsure', label: 'Not sure' },
            ]} />
          </div>
          <p style={{ fontSize: '13px', color: '#6B5F52', lineHeight: 1.6, borderLeft: '3px solid #B4694A', paddingLeft: '12px' }}>
            Good to know: Hawaii expects a GET return for every filing period, even when you earned nothing — a $0 return. Your summary will list your next due dates.
          </p>
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
      <p style={{ fontSize: '14px', color: '#7A6E60', marginBottom: '1.5rem', lineHeight: 1.6 }}>
        Add each property separately. For multi-state portfolios, track each property independently — your CPA will need state-level detail for Schedule E and state returns.
      </p>
      {form.properties.map((p, i) => (
        <Card key={p.id}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#2A241D' }}>
              🏠 Property {i + 1} {p.address ? `— ${p.address}` : ''}
            </h3>
            <button onClick={() => set('properties', form.properties.filter(x => x.id !== p.id))}
              style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid #D9A898', color: '#B4452F', padding: '4px 12px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>Remove</button>
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
              <div style={{ borderTop: '1px solid #E3D9C8', paddingTop: '1rem', marginTop: '0.5rem', marginBottom: '1rem' }}>
                <p style={{ fontSize: '12px', color: '#B07F35', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Rental Income</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
                  <Input label="Gross Rental Income" value={p.rentalIncome} onChange={v => set('properties', form.properties.map(x => x.id === p.id ? { ...x, rentalIncome: v } : x))} placeholder="$0" />
                  <Input label="Ownership %" value={p.ownershipPct} onChange={v => set('properties', form.properties.map(x => x.id === p.id ? { ...x, ownershipPct: v } : x))} placeholder="100" hint="if co-owned" />
                </div>
              </div>
              <div style={{ borderTop: '1px solid #E3D9C8', paddingTop: '1rem', marginBottom: '1rem' }}>
                <p style={{ fontSize: '12px', color: '#B07F35', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Rental Expenses</p>
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
              <div style={{ borderTop: '1px solid #E3D9C8', paddingTop: '1rem', marginBottom: '1rem' }}>
                <p style={{ fontSize: '12px', color: '#B07F35', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Depreciation</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 1rem' }}>
                  <Input label="Current Year Depreciation (if known)" value={p.depreciation} onChange={v => set('properties', form.properties.map(x => x.id === p.id ? { ...x, depreciation: v } : x))} placeholder="$0" hint="CPA can calculate" />
                  <Input label="Prior Year Accumulated Depreciation" value={p.priorDepreciation} onChange={v => set('properties', form.properties.map(x => x.id === p.id ? { ...x, priorDepreciation: v } : x))} placeholder="$0" hint="from prior returns" />
                </div>
              </div>
            </>
          )}

          <div style={{ borderTop: '1px solid #E3D9C8', paddingTop: '1rem' }}>
            <p style={{ fontSize: '12px', color: '#B07F35', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Document Status</p>
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
        style={{ background: 'rgba(200,151,58,0.1)', border: '1px dashed rgba(200,151,58,0.3)', color: '#B07F35', padding: '14px 20px', borderRadius: '999px', fontSize: '14px', cursor: 'pointer', width: '100%' }}>
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
    const docs = [...BASE_DOCS, ...(form.hasGet ? [GET_DOC] : [])];
    return (
      <div>
        <Card title="📂 Document Checklist">
          <p style={{ fontSize: '13px', color: '#7A6E60', marginBottom: '1.25rem' }}>Mark the status of each document.</p>
          {docs.map(d => (
            <StatusSelect key={d.key} label={d.label} value={form.docStatuses[d.key] || ''} onChange={v => setDoc(d.key, v)} />
          ))}
        </Card>
        <Card><Textarea label="Additional Notes for CPA" value={form.userNotes} onChange={v => set('userNotes', v)} placeholder="Anything else your preparer should know before your appointment..." /></Card>
      </div>
    );
  };

  const buildSummaryText = () => {
    const t = calcTotals();
    const questions = generateCPAQuestions();
    const missing = getMissingDocs();
    const lines: string[] = [];
    lines.push(`TaxClarity readiness summary — ${form.primaryName || 'Client'} (tax year ${form.taxYear})`);
    if (preparer.name) lines.push(`Prepared for: ${preparer.name}`);
    lines.push('');
    lines.push(`Filing status: ${form.filingStatus || 'not given'} · Primary state: ${form.primaryState || 'not given'} · Dependents: ${form.dependents.length}`);
    lines.push(`Income reported: W-2 ${fmt(t.totalW2)} · 1099 ${fmt(t.total1099)} · Net rental ${fmt(t.netRental)} · Total ${fmt(t.grossIncome)}`);
    if (form.hasGet) {
      lines.push(`Hawaii GET: files ${getLabel(form.getFrequency).toLowerCase()} · income this year: ${getLabel(form.getHadIncome).toLowerCase()} · periodic returns filed: ${getLabel(form.getReturnsFiled).toLowerCase()}`);
    }
    lines.push('');
    lines.push('Still needed:');
    lines.push(...(missing.length ? missing.map(m => `- ${m}`) : ['- Nothing flagged']));
    lines.push('');
    lines.push('Questions for my preparer:');
    lines.push(...questions.map((q, i) => `${i + 1}. ${q}`));
    if (form.userNotes) { lines.push(''); lines.push(`Notes: ${form.userNotes}`); }
    lines.push('');
    lines.push('Documents will be sent the way your office prefers (portal, email, or drop-off). TaxClarity does not store client documents. Not tax advice.');
    return lines.join('\n');
  };

  const renderStep6 = () => {
    const t = calcTotals();
    const questions = generateCPAQuestions();
    const missing = getMissingDocs();
    const allStates = [...new Set([form.primaryState, ...form.otherStates, ...form.w2s.map(w => w.state), ...form.properties.map(p => p.state)].filter(Boolean))];
    const getFreq = (['monthly', 'quarterly', 'semiannual'] as const).includes(form.getFrequency as GetFrequency) ? form.getFrequency as GetFrequency : null;
    const getDeadlines = form.hasGet && getFreq ? nextGetDeadlines(new Date(), getFreq, 3) : [];
    const summaryText = buildSummaryText();
    const subject = `Tax readiness summary — ${form.primaryName || 'new client'} (${form.taxYear})`;
    // mailto bodies over ~1,800 characters get cut off by some mail apps; the PDF carries the full version.
    const mailBody = summaryText.length > 1800 ? summaryText.slice(0, 1750) + '\n\n[Shortened — full summary attached as PDF]' : summaryText;
    const mailto = `mailto:${preparer.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(mailBody)}`;
    const pill = (primary: boolean): React.CSSProperties => ({
      background: primary ? '#B07F35' : 'transparent', color: primary ? '#FBF8F1' : '#2A241D',
      border: '2px solid #2A241D', borderRadius: '999px', padding: '12px 22px',
      fontWeight: 600, fontSize: '14px', cursor: 'pointer', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px',
    });

    return (
      <div>
        {/* Send to preparer */}
        <div className="no-print" style={{ background: '#FBF8F1', border: '2px solid #2A241D', borderRadius: '22px', padding: '1.5rem 1.5rem 1.5rem 2rem', marginBottom: '1.5rem', position: 'relative', overflow: 'hidden' }}>
          <span style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '8px', background: '#B07F35' }} />
          <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#6B5F52' }}>Send to your preparer</div>
          <div style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: '20px', fontWeight: 600, margin: '6px 0' }}>
            {preparer.name ? `Ready for ${preparer.name}.` : 'Your summary is ready.'}
          </div>
          <p style={{ fontSize: '14px', color: '#6B5F52', lineHeight: 1.6, marginBottom: '1rem' }}>
            Save it as a PDF and email it before your appointment. Send your actual documents the way your preparer asks — their portal, email, or drop-off. TaxClarity doesn&apos;t store anything you enter.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            <button onClick={() => window.print()} style={pill(true)}>Save as PDF</button>
            <a href={mailto} style={pill(false)}>{preparer.email ? `Email ${preparer.name || 'my preparer'}` : 'Email this summary'}</a>
            <button onClick={() => { navigator.clipboard?.writeText(summaryText).then(() => setCopied(true)).catch(() => {}); }} style={pill(false)}>
              {copied ? 'Copied ✓' : 'Copy text'}
            </button>
          </div>
        </div>

        {/* Household Overview */}
        <Card title="Household" accent>
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
              <div key={k} style={{ padding: '8px 0', borderBottom: '1px solid #E3D9C8' }}>
                <div style={{ fontSize: '11px', color: '#8A7E70', textTransform: 'uppercase', letterSpacing: '0.12em' }}>{k}</div>
                <div style={{ fontSize: '14px', color: '#2A241D', fontWeight: 500, marginTop: '2px' }}>{v}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Missing Documents — the most useful thing for a preparer, so it comes first */}
        <Card title={missing.length ? `Still needed (${missing.length})` : 'Still needed'}>
          {missing.length === 0 && <p style={{ fontSize: '14px', color: '#3F7A45' }}>Nothing flagged. Double-check the document checklist if you skipped it.</p>}
          {missing.map((m, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '8px 0', borderBottom: '1px solid #E3D9C8', fontSize: '14px', color: '#2A241D' }}>
              <span style={{ width: '4px', alignSelf: 'stretch', background: '#B4694A', borderRadius: '2px', flexShrink: 0 }} /><span>{m}</span>
            </div>
          ))}
        </Card>

        {/* Hawaii GET */}
        {form.hasGet && (
          <Card title="Hawaii GET">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem 2rem', marginBottom: '0.75rem' }}>
              {[
                ['Filing frequency', getLabel(form.getFrequency)],
                ['License start', form.getStartDate || '—'],
                ['Income this year', getLabel(form.getHadIncome)],
                ['Periodic returns filed', getLabel(form.getReturnsFiled)],
              ].map(([k, v]) => (
                <div key={k} style={{ padding: '8px 0', borderBottom: '1px solid #E3D9C8' }}>
                  <div style={{ fontSize: '11px', color: '#8A7E70', textTransform: 'uppercase', letterSpacing: '0.12em' }}>{k}</div>
                  <div style={{ fontSize: '14px', color: '#2A241D', fontWeight: 500, marginTop: '2px' }}>{v}</div>
                </div>
              ))}
            </div>
            {getDeadlines.length > 0 && (
              <>
                <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#6B5F52', margin: '1rem 0 0.5rem' }}>Next due dates</div>
                {getDeadlines.map(d => (
                  <div key={d.label} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', padding: '8px 0 8px 12px', borderLeft: `4px solid ${d.form === 'G-49' ? '#5D6B78' : '#76866A'}`, marginBottom: '6px', fontSize: '14px' }}>
                    <span>{d.label}</span><strong style={{ whiteSpace: 'nowrap' }}>{formatDue(d.due)}</strong>
                  </div>
                ))}
                <p style={{ fontSize: '12px', color: '#8A7E70', marginTop: '0.5rem' }}>A return is due every period, even with $0. Dates on a weekend or holiday may shift — confirm in Hawaii Tax Online.</p>
              </>
            )}
          </Card>
        )}

        {/* Income Summary */}
        <Card title="Income reported">
          {form.w2s.map((w, i) => w.wages && (
            <div key={w.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #E3D9C8', fontSize: '14px' }}>
              <span style={{ color: '#6B5F52' }}>W-2 #{i + 1} {w.employer ? `(${w.employer})` : ''} — {w.state}</span>
              <span style={{ color: '#2A241D', fontWeight: 500 }}>{fmt(num(w.wages))}</span>
            </div>
          ))}
          {form.entries1099.map((e, i) => e.amount && (
            <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #E3D9C8', fontSize: '14px' }}>
              <span style={{ color: '#6B5F52' }}>{e.type} — {e.payer || `Entry ${i + 1}`}</span>
              <span style={{ color: '#2A241D', fontWeight: 500 }}>{fmt(num(e.amount))}</span>
            </div>
          ))}
          {t.totalRentalIncome > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #E3D9C8', fontSize: '14px' }}>
              <span style={{ color: '#6B5F52' }}>Net rental income ({form.properties.length} {form.properties.length === 1 ? 'property' : 'properties'})</span>
              <span style={{ color: '#2A241D', fontWeight: 500 }}>{fmt(t.netRental)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontSize: '15px', fontWeight: 600 }}>
            <span style={{ color: '#B07F35' }}>Total reported</span>
            <span style={{ color: '#B07F35' }}>{fmt(t.grossIncome)}</span>
          </div>
          <p style={{ fontSize: '12px', color: '#8A7E70' }}>Totals of what you entered — not a tax calculation. Your preparer works out what you owe or get back.</p>
        </Card>

        {/* Real Estate Summary */}
        {form.properties.length > 0 && (
          <Card title="Real estate">
            {form.properties.map((p, i) => (
              <div key={p.id} style={{ marginBottom: '1rem', padding: '1rem', background: '#F6F0E4', borderRadius: '14px' }}>
                <div style={{ fontWeight: 600, fontSize: '14px', color: '#2A241D', marginBottom: '8px' }}>
                  {p.address || `Property ${i + 1}`} — {p.state} ({p.type})
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 2rem', fontSize: '13px' }}>
                  {p.rentalIncome && <div><span style={{ color: '#7A6E60' }}>Rental Income: </span><span>{fmt(num(p.rentalIncome))}</span></div>}
                  {p.mortgageInterest && <div><span style={{ color: '#7A6E60' }}>Mortgage Interest: </span><span>{fmt(num(p.mortgageInterest))}</span></div>}
                  {p.propertyTax && <div><span style={{ color: '#7A6E60' }}>Property Tax: </span><span>{fmt(num(p.propertyTax))}</span></div>}
                  {p.depreciation && <div><span style={{ color: '#7A6E60' }}>Depreciation: </span><span>{fmt(num(p.depreciation))}</span></div>}
                  {p.priorDepreciation && <div><span style={{ color: '#7A6E60' }}>Prior Depreciation: </span><span>{fmt(num(p.priorDepreciation))}</span></div>}
                </div>
              </div>
            ))}
          </Card>
        )}

        {/* Preparer Questions */}
        <Card title="Questions for your preparer">
          {questions.map((q, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '8px 0', borderBottom: '1px solid #E3D9C8', fontSize: '14px', color: '#2A241D', lineHeight: 1.5 }}>
              <span style={{ color: '#B07F35', fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span><span>{q}</span>
            </div>
          ))}
        </Card>

        {form.userNotes && (
          <Card title="Your notes">
            <p style={{ fontSize: '14px', color: '#2A241D', lineHeight: 1.6 }}>{form.userNotes}</p>
          </Card>
        )}

        {/* Disclaimer */}
        <div style={{ border: '1px solid #D9CFBF', borderRadius: '16px', padding: '1rem 1.25rem', fontSize: '13px', color: '#6B5F52', lineHeight: 1.6 }}>
          <strong style={{ color: '#2A241D' }}>TaxClarity prepares the taxpayer.</strong> It is an organization and readiness tool. It does not file returns, calculate tax owed, or provide legal, accounting, or tax advice. Review everything with a qualified tax professional.
        </div>
        <div style={{ textAlign: 'center', padding: '1rem', fontSize: '12px', color: '#8A7E70' }}>
          TaxClarity · taxclarity.io · A Brownefield Holdings project
        </div>
      </div>
    );
  };

  const steps = [renderStep1, renderStep2, renderStep3, renderStep4, renderStep5, renderStep6];

  return (
    <div className="tc-prepare" style={{ minHeight: '100vh', background: '#F4EEE3', color: '#2A241D', fontFamily: "'IBM Plex Sans', system-ui, sans-serif" }}>

      {/* Header */}
      <div className="no-print" style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(244,238,227,0.95)', backdropFilter: 'blur(12px)', borderBottom: '2px solid #2A241D', padding: '0 1.25rem' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', color: '#2A241D' }} aria-label="TaxClarity home">
            <svg width="32" height="32" viewBox="0 0 36 36" aria-hidden="true">
              <polygon points="18,2 32,10 32,26 18,34 4,26 4,10" fill="#B07F35" stroke="#2A241D" strokeWidth="2" strokeLinejoin="round" />
              <text x="18" y="22.5" textAnchor="middle" fontFamily="Source Serif 4, Georgia, serif" fontWeight="700" fontSize="12" fill="#FBF8F1">TC</text>
            </svg>
            <span style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontWeight: 600, fontSize: '17px' }}>TaxClarity <span style={{ color: '#8A7E70', fontWeight: 400 }}>/ Tax Readiness</span></span>
          </a>
          <div style={{ fontSize: '12px', color: '#6B5F52', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Step {step + 1} of {STEPS.length}</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="no-print" style={{ height: '4px', background: '#E3D9C8' }}>
        <div style={{ height: '100%', background: '#B07F35', width: `${((step + 1) / STEPS.length) * 100}%`, transition: 'width 0.3s ease' }} />
      </div>

      {/* Step Tabs */}
      <div className="no-print" style={{ background: '#FBF8F1', borderBottom: '1px solid #E3D9C8', overflowX: 'auto' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto', display: 'flex', padding: '0 1.25rem' }}>
          {STEPS.map((s, i) => (
            <button key={s} onClick={() => setStep(i)}
              style={{
                padding: '12px 14px', fontSize: '12px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase',
                color: i === step ? '#2A241D' : '#8A7E70',
                background: 'none', border: 'none', borderBottom: `3px solid ${i === step ? '#B07F35' : 'transparent'}`,
                cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s',
              }}>
              {i < step ? '✓ ' : ''}{s}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '2rem 1.25rem' }}>
        {preparer.name && step === 0 && (
          <div className="no-print" style={{ border: '2px solid #2A241D', borderRadius: '22px', background: '#F1E4CC', padding: '1rem 1.25rem', marginBottom: '1.5rem', fontSize: '14px', lineHeight: 1.6 }}>
            <strong>{preparer.name}</strong> asked you to get ready here before your appointment. Answer what you can — it takes about 15 minutes, and nothing leaves your device until you choose to send your summary.
          </div>
        )}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#6B5F52' }}>
            {step === STEPS.length - 1 ? 'Your readiness summary' : `Step ${step + 1}`}
          </div>
          <h1 style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: '2rem', fontWeight: 600, marginTop: '0.35rem', marginBottom: '0.35rem' }}>{STEPS[step]}</h1>
          <p style={{ fontSize: '15px', color: '#6B5F52' }}>
            {['Tell us about your household and filing situation.',
              'List your income — jobs, contract work, and any Hawaii business.',
              'Enter details for each property you own.',
              'Note possible deductions and credits.',
              'Mark which documents you have and which you still need.',
              'What you have, what’s missing, and what to ask — ready to send to your preparer.'][step]}
          </p>
        </div>

        {steps[step]()}

        {/* Navigation */}
        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #E3D9C8' }}>
          <button
            onClick={() => setStep(s => Math.max(0, s - 1))}
            disabled={step === 0}
            style={{ background: 'transparent', border: '2px solid #2A241D', color: '#2A241D', opacity: step === 0 ? 0.35 : 1, padding: '11px 22px', borderRadius: '999px', fontSize: '14px', fontWeight: 600, cursor: step === 0 ? 'default' : 'pointer' }}>
            ← Back
          </button>
          {step === 0 ? (
            <button onClick={clearDraft} style={{ background: 'none', border: 'none', color: '#8A7E70', fontSize: '13px', textDecoration: 'underline', cursor: 'pointer' }}>Start over</button>
          ) : <span />}
          {step < STEPS.length - 1 ? (
            <button onClick={() => setStep(s => Math.min(STEPS.length - 1, s + 1))}
              style={{ background: '#B07F35', color: '#FBF8F1', border: '2px solid #2A241D', padding: '11px 26px', borderRadius: '999px', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>
              Continue →
            </button>
          ) : (
            <button onClick={() => window.print()}
              style={{ background: '#B07F35', color: '#FBF8F1', border: '2px solid #2A241D', padding: '11px 26px', borderRadius: '999px', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>
              Save as PDF
            </button>
          )}
        </div>
        <p className="no-print" style={{ fontSize: '12px', color: '#8A7E70', textAlign: 'center', marginTop: '1.25rem' }}>
          Your answers are saved only in this browser. TaxClarity doesn&apos;t store them.
        </p>
      </div>
    </div>
  );
}
