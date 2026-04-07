import { describe, it, expect } from 'vitest';
import { validateReturnInput } from '@/services/validation';
import type { ReturnInput } from '@/domain/types';

const VALID_INPUT: ReturnInput = {
  taxpayer: {
    firstName: 'John',
    lastName: 'Doe',
    ssnLast4: '1234',
    dateOfBirth: '1990-05-15',
    filingStatus: 'single',
    filingYear: 2025,
  },
  w2s: [
    {
      id: 'w2_1',
      employerName: 'Acme Corp',
      employerEin: '12-3456789',
      wagesBox1: 55000,
      federalWithheldBox2: 6500,
      socialSecurityWagesBox3: 55000,
      socialSecurityWithheldBox4: 3410,
      medicareWagesBox5: 55000,
      medicareWithheldBox6: 797.5,
    },
  ],
  interestIncome: [],
};

describe('Validation Service', () => {
  it('passes a valid simple return', () => {
    const result = validateReturnInput(VALID_INPUT);
    expect(result.valid).toBe(true);
    expect(result.issues.filter((i) => i.severity === 'error')).toHaveLength(0);
  });

  it('fails when first name is missing', () => {
    const input = {
      ...VALID_INPUT,
      taxpayer: { ...VALID_INPUT.taxpayer, firstName: '' },
    };
    const result = validateReturnInput(input);
    expect(result.valid).toBe(false);
  });

  it('fails when SSN format is wrong', () => {
    const input = {
      ...VALID_INPUT,
      taxpayer: { ...VALID_INPUT.taxpayer, ssnLast4: 'abcd' },
    };
    const result = validateReturnInput(input);
    expect(result.valid).toBe(false);
  });

  it('fails when no W-2 is provided', () => {
    const input = { ...VALID_INPUT, w2s: [] };
    const result = validateReturnInput(input);
    expect(result.valid).toBe(false);
  });

  it('fails on negative wages', () => {
    const input = {
      ...VALID_INPUT,
      w2s: [{ ...VALID_INPUT.w2s[0], wagesBox1: -5000 }],
    };
    const result = validateReturnInput(input);
    expect(result.valid).toBe(false);
  });

  it('warns when withholding exceeds wages', () => {
    const input: ReturnInput = {
      ...VALID_INPUT,
      w2s: [
        {
          ...VALID_INPUT.w2s[0],
          wagesBox1: 30000,
          federalWithheldBox2: 50000,
        },
      ],
    };
    const result = validateReturnInput(input);
    // Should pass schema but have a business-rule warning
    const warnings = result.issues.filter((i) => i.severity === 'warning');
    expect(warnings.some((w) => w.code === 'WITHHOLDING_EXCEEDS_WAGES')).toBe(true);
  });

  it('fails on unsupported filing year', () => {
    const input = {
      ...VALID_INPUT,
      taxpayer: { ...VALID_INPUT.taxpayer, filingYear: 2020 },
    };
    const result = validateReturnInput(input);
    expect(result.valid).toBe(false);
  });

  it('handles contradictory input — EIN format wrong', () => {
    const input = {
      ...VALID_INPUT,
      w2s: [{ ...VALID_INPUT.w2s[0], employerEin: 'NOTANEIN' }],
    };
    const result = validateReturnInput(input);
    expect(result.valid).toBe(false);
  });
});
