'use client';

import { useState } from 'react';
import type {
  ReturnInput,
  TaxpayerProfile,
  W2Input,
  InterestIncomeInput,
  ValidationResult,
} from '@/domain/types';
import { generateId } from '@/lib/utils';
import { W2Upload } from './upload/W2Upload';

interface IntakeFormProps {
  onSubmit: (input: ReturnInput) => { success: boolean; validationResult: ValidationResult };
  existingInput?: ReturnInput | null;
  validationResult?: ValidationResult | null;
}

function emptyW2(): W2Input {
  return {
    id: generateId(),
    employerName: '',
    employerEin: '',
    wagesBox1: 0,
    federalWithheldBox2: 0,
    socialSecurityWagesBox3: 0,
    socialSecurityWithheldBox4: 0,
    medicareWagesBox5: 0,
    medicareWithheldBox6: 0,
  };
}

function emptyInterest(): InterestIncomeInput {
  return { id: generateId(), payerName: '', amount: 0 };
}

/**
 * Parse a currency string input into a clean number.
 * Handles "$55,000", "55000.00", "55,000", etc.
 */
function parseCurrencyInput(value: string): number {
  const cleaned = value.replace(/[^0-9.]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : Math.round(num * 100) / 100;
}

export function IntakeForm({ onSubmit, existingInput, validationResult }: IntakeFormProps) {
  const [taxpayer, setTaxpayer] = useState<TaxpayerProfile>(
    existingInput?.taxpayer ?? {
      firstName: '',
      lastName: '',
      ssnLast4: '',
      dateOfBirth: '',
      filingStatus: 'single',
      filingYear: 2025,
    }
  );
  const [w2s, setW2s] = useState<W2Input[]>(existingInput?.w2s ?? [emptyW2()]);
  const [interestIncome, setInterestIncome] = useState<InterestIncomeInput[]>(
    existingInput?.interestIncome ?? []
  );
  const [showInterest, setShowInterest] = useState(
    (existingInput?.interestIncome?.length ?? 0) > 0
  );

  const errors = validationResult?.issues?.filter((i) => i.severity === 'error') ?? [];
  const warnings = validationResult?.issues?.filter((i) => i.severity === 'warning') ?? [];

  function handleSubmit() {
    const input: ReturnInput = { taxpayer, w2s, interestIncome };
    onSubmit(input);
    // Scroll to top if errors
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function updateW2(index: number, field: keyof W2Input, value: string | number) {
    setW2s((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }

  function updateW2Currency(index: number, field: keyof W2Input, rawValue: string) {
    const num = parseCurrencyInput(rawValue);
    updateW2(index, field, num);
  }

  function addW2() {
    setW2s((prev) => [...prev, emptyW2()]);
  }

  function removeW2(index: number) {
    if (w2s.length <= 1) return;
    setW2s((prev) => prev.filter((_, i) => i !== index));
  }

  function updateInterest(index: number, field: keyof InterestIncomeInput, value: string | number) {
    setInterestIncome((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <h2 className="font-display text-xl sm:text-2xl font-semibold text-navy-900 mb-2">
        Enter Your Information
      </h2>
      <p className="text-sm sm:text-base text-navy-500 mb-6 sm:mb-8">
        Fill in the details from your W-2 form(s). All data stays in your browser.
      </p>

      {/* Validation errors */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6" role="alert">
          <p className="font-medium text-red-800 mb-2">Please fix the following:</p>
          {errors.map((e, i) => (
            <p key={i} className="text-sm text-red-700">
              • {e.message}
              {e.suggestion && <span className="text-red-500"> — {e.suggestion}</span>}
            </p>
          ))}
        </div>
      )}

      {warnings.length > 0 && (
        <div className="bg-warm-50 border border-warm-200 rounded-lg p-4 mb-6" role="status">
          <p className="font-medium text-yellow-800 mb-2">Warnings:</p>
          {warnings.map((w, i) => (
            <p key={i} className="text-sm text-yellow-700">• {w.message}</p>
          ))}
        </div>
      )}

      {/* Taxpayer Info */}
      <fieldset className="card mb-5 sm:mb-6">
        <legend className="font-display text-lg font-semibold text-navy-800 mb-4">
          Taxpayer Information
        </legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="input-label">First Name</label>
            <input
              id="firstName"
              type="text"
              className="input-field"
              value={taxpayer.firstName}
              onChange={(e) => setTaxpayer((p) => ({ ...p, firstName: e.target.value }))}
              placeholder="John"
              autoComplete="given-name"
            />
          </div>
          <div>
            <label htmlFor="lastName" className="input-label">Last Name</label>
            <input
              id="lastName"
              type="text"
              className="input-field"
              value={taxpayer.lastName}
              onChange={(e) => setTaxpayer((p) => ({ ...p, lastName: e.target.value }))}
              placeholder="Doe"
              autoComplete="family-name"
            />
          </div>
          <div>
            <label htmlFor="ssnLast4" className="input-label">Last 4 of SSN</label>
            <input
              id="ssnLast4"
              type="text"
              inputMode="numeric"
              className="input-field"
              value={taxpayer.ssnLast4}
              onChange={(e) => setTaxpayer((p) => ({ ...p, ssnLast4: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
              placeholder="1234"
              maxLength={4}
              autoComplete="off"
              aria-describedby="ssn-help"
            />
            <p id="ssn-help" className="input-help">We only collect the last 4 digits for your reference.</p>
          </div>
          <div>
            <label htmlFor="dob" className="input-label">Date of Birth</label>
            <input
              id="dob"
              type="date"
              className="input-field"
              value={taxpayer.dateOfBirth}
              onChange={(e) => setTaxpayer((p) => ({ ...p, dateOfBirth: e.target.value }))}
              autoComplete="bday"
            />
          </div>
          <div>
            <label htmlFor="filingStatus" className="input-label">Filing Status</label>
            <select
              id="filingStatus"
              className="input-field"
              value={taxpayer.filingStatus}
              onChange={(e) => setTaxpayer((p) => ({ ...p, filingStatus: e.target.value as any }))}
            >
              <option value="single">Single</option>
            </select>
          </div>
          <div>
            <label htmlFor="filingYear" className="input-label">Tax Year</label>
            <select
              id="filingYear"
              className="input-field"
              value={taxpayer.filingYear}
              onChange={(e) => setTaxpayer((p) => ({ ...p, filingYear: Number(e.target.value) as any }))}
            >
              <option value={2025}>2025</option>
            </select>
          </div>
        </div>
      </fieldset>

      {/* W-2s */}
      {w2s.map((w2, index) => (
        <fieldset key={w2.id} className="card mb-5 sm:mb-6">
          <legend className="flex items-center justify-between w-full mb-4">
            <span className="font-display text-lg font-semibold text-navy-800">
              W-2 #{index + 1}
            </span>
            {w2s.length > 1 && (
              <button
                onClick={() => removeW2(index)}
                className="btn-danger text-sm"
                aria-label={`Remove W-2 number ${index + 1}`}
              >
                Remove
              </button>
            )}
          </legend>

          {/* W-2 Upload */}
          <W2Upload
            w2Index={index}
            onFieldsExtracted={(fields) => {
              setW2s((prev) => {
                const updated = [...prev];
                updated[index] = { ...updated[index], ...fields, id: updated[index].id };
                return updated;
              });
            }}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label htmlFor={`emp-name-${index}`} className="input-label">Employer Name</label>
              <input
                id={`emp-name-${index}`}
                type="text"
                className="input-field"
                value={w2.employerName}
                onChange={(e) => updateW2(index, 'employerName', e.target.value)}
                placeholder="Acme Corporation"
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor={`emp-ein-${index}`} className="input-label">Employer EIN</label>
              <input
                id={`emp-ein-${index}`}
                type="text"
                className="input-field"
                value={w2.employerEin}
                onChange={(e) => updateW2(index, 'employerEin', e.target.value)}
                placeholder="12-3456789"
                aria-describedby={`ein-help-${index}`}
              />
              <p id={`ein-help-${index}`} className="input-help">Found in Box b of your W-2</p>
            </div>
            <CurrencyField
              id={`box1-${index}`}
              label="Box 1 — Wages"
              value={w2.wagesBox1}
              onChange={(val) => updateW2(index, 'wagesBox1', val)}
            />
            <CurrencyField
              id={`box2-${index}`}
              label="Box 2 — Federal Tax Withheld"
              value={w2.federalWithheldBox2}
              onChange={(val) => updateW2(index, 'federalWithheldBox2', val)}
            />
            <CurrencyField
              id={`box3-${index}`}
              label="Box 3 — Social Security Wages"
              value={w2.socialSecurityWagesBox3}
              onChange={(val) => updateW2(index, 'socialSecurityWagesBox3', val)}
            />
            <CurrencyField
              id={`box4-${index}`}
              label="Box 4 — SS Tax Withheld"
              value={w2.socialSecurityWithheldBox4}
              onChange={(val) => updateW2(index, 'socialSecurityWithheldBox4', val)}
            />
            <CurrencyField
              id={`box5-${index}`}
              label="Box 5 — Medicare Wages"
              value={w2.medicareWagesBox5}
              onChange={(val) => updateW2(index, 'medicareWagesBox5', val)}
            />
            <CurrencyField
              id={`box6-${index}`}
              label="Box 6 — Medicare Tax Withheld"
              value={w2.medicareWithheldBox6}
              onChange={(val) => updateW2(index, 'medicareWithheldBox6', val)}
            />
          </div>
        </fieldset>
      ))}

      <button onClick={addW2} className="btn-secondary mb-6 sm:mb-8 w-full sm:w-auto">
        + Add Another W-2
      </button>

      {/* Interest Income */}
      <fieldset className="card mb-5 sm:mb-6">
        <legend className="flex items-center justify-between w-full mb-4">
          <span className="font-display text-lg font-semibold text-navy-800">
            Interest Income (Optional)
          </span>
          {!showInterest && (
            <button
              onClick={() => {
                setShowInterest(true);
                if (interestIncome.length === 0) setInterestIncome([emptyInterest()]);
              }}
              className="text-sm text-navy-500 hover:text-navy-700"
            >
              + Add
            </button>
          )}
        </legend>

        {!showInterest ? (
          <p className="text-xs sm:text-sm text-navy-400">
            If you received a 1099-INT for bank interest, you can add it here.
          </p>
        ) : (
          <>
            {interestIncome.map((int, index) => (
              <div key={int.id} className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor={`int-payer-${index}`} className="input-label">Payer Name</label>
                  <input
                    id={`int-payer-${index}`}
                    type="text"
                    className="input-field"
                    value={int.payerName}
                    onChange={(e) => updateInterest(index, 'payerName', e.target.value)}
                    placeholder="Bank of America"
                  />
                </div>
                <CurrencyField
                  id={`int-amount-${index}`}
                  label="Interest Amount"
                  value={int.amount}
                  onChange={(val) => updateInterest(index, 'amount', val)}
                />
              </div>
            ))}
            <button
              onClick={() => setInterestIncome((prev) => [...prev, emptyInterest()])}
              className="text-sm text-navy-500 hover:text-navy-700"
            >
              + Add another
            </button>
          </>
        )}
      </fieldset>

      {/* Submit */}
      <div className="flex justify-end">
        <button onClick={handleSubmit} className="btn-primary text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 w-full sm:w-auto">
          Calculate My Return →
        </button>
      </div>
    </div>
  );
}

// ---- Currency Input Component ----
// Handles "$55,000", "55000.00", "55,000" etc. and formats on blur.

function CurrencyField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  const [displayValue, setDisplayValue] = useState(value > 0 ? String(value) : '');
  const [focused, setFocused] = useState(false);

  function handleChange(raw: string) {
    setDisplayValue(raw);
    const cleaned = raw.replace(/[^0-9.]/g, '');
    const num = parseFloat(cleaned);
    if (!isNaN(num)) {
      onChange(Math.round(num * 100) / 100);
    } else if (raw === '' || raw === '$') {
      onChange(0);
    }
  }

  function handleBlur() {
    setFocused(false);
    // Format to 2 decimal places on blur
    if (value > 0) {
      setDisplayValue(value.toFixed(2));
    } else {
      setDisplayValue('');
    }
  }

  function handleFocus() {
    setFocused(true);
    // Show raw number on focus for easy editing
    if (value > 0) {
      setDisplayValue(String(value));
    }
  }

  return (
    <div>
      <label htmlFor={id} className="input-label">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-300 text-sm pointer-events-none">
          $
        </span>
        <input
          id={id}
          type="text"
          inputMode="decimal"
          className="input-field pl-7"
          value={focused ? displayValue : (value > 0 ? value.toFixed(2) : '')}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder="0.00"
          aria-label={`${label} in dollars`}
        />
      </div>
    </div>
  );
}
