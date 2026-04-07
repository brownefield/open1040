import { describe, it, expect } from 'vitest';
import { computeTaxByBrackets, calculate2025, STANDARD_DEDUCTION } from '@/rules/2025';
import type { NormalizedReturnData } from '@/domain/types';

describe('2025 Tax Brackets — Single Filer', () => {
  it('computes zero tax on zero income', () => {
    const { total, brackets } = computeTaxByBrackets(0, 'single');
    expect(total).toBe(0);
    expect(brackets).toHaveLength(0);
  });

  it('computes tax in first bracket only', () => {
    const { total, brackets } = computeTaxByBrackets(10_000, 'single');
    expect(total).toBe(1_000); // 10000 × 10%
    expect(brackets).toHaveLength(1);
    expect(brackets[0].rate).toBe(0.10);
  });

  it('computes tax across two brackets', () => {
    const { total, brackets } = computeTaxByBrackets(20_000, 'single');
    // First bracket: 11_925 × 10% = 1_192.50
    // Second bracket: (20_000 - 11_925) × 12% = 8_075 × 12% = 969.00
    expect(total).toBeCloseTo(2_161.50, 2);
    expect(brackets).toHaveLength(2);
  });

  it('computes tax for $50,000 taxable income', () => {
    const { total } = computeTaxByBrackets(50_000, 'single');
    // 11_925 × 10% = 1_192.50
    // (48_475 - 11_925) × 12% = 36_550 × 12% = 4_386.00
    // (50_000 - 48_475) × 22% = 1_525 × 22% = 335.50
    expect(total).toBeCloseTo(5_914.00, 2);
  });

  it('never returns negative tax', () => {
    const { total } = computeTaxByBrackets(-5_000, 'single');
    expect(total).toBe(0);
  });
});

describe('calculate2025 — Full Pipeline', () => {
  it('calculates a simple return correctly', () => {
    const data: NormalizedReturnData = {
      filingYear: 2025,
      filingStatus: 'single',
      totalWages: 55_000,
      totalInterestIncome: 200,
      totalIncome: 55_200,
      totalFederalWithheld: 6_500,
      standardDeduction: STANDARD_DEDUCTION.single,
      taxableIncome: 55_200 - STANDARD_DEDUCTION.single,
      w2Count: 1,
      interestCount: 1,
    };

    const result = calculate2025(data);

    expect(result.filingYear).toBe(2025);
    expect(result.totalIncome).toBe(55_200);
    expect(result.standardDeduction).toBe(15_750);
    expect(result.taxableIncome).toBe(39_450);
    expect(result.totalTax).toBeGreaterThan(0);
    expect(result.steps.length).toBeGreaterThanOrEqual(5);
    expect(result.timestamp).toBeTruthy();
  });

  it('produces a refund when withholding exceeds tax', () => {
    const data: NormalizedReturnData = {
      filingYear: 2025,
      filingStatus: 'single',
      totalWages: 30_000,
      totalInterestIncome: 0,
      totalIncome: 30_000,
      totalFederalWithheld: 5_000,
      standardDeduction: STANDARD_DEDUCTION.single,
      taxableIncome: 30_000 - STANDARD_DEDUCTION.single,
      w2Count: 1,
      interestCount: 0,
    };

    const result = calculate2025(data);
    // Taxable: 14_250, tax should be ~1_425
    // Withheld: 5_000 → refund
    expect(result.refundOrOwed).toBeGreaterThan(0);
  });

  it('shows amount owed when withholding is insufficient', () => {
    const data: NormalizedReturnData = {
      filingYear: 2025,
      filingStatus: 'single',
      totalWages: 80_000,
      totalInterestIncome: 0,
      totalIncome: 80_000,
      totalFederalWithheld: 2_000,
      standardDeduction: STANDARD_DEDUCTION.single,
      taxableIncome: 80_000 - STANDARD_DEDUCTION.single,
      w2Count: 1,
      interestCount: 0,
    };

    const result = calculate2025(data);
    expect(result.refundOrOwed).toBeLessThan(0);
  });

  it('handles income below standard deduction', () => {
    const data: NormalizedReturnData = {
      filingYear: 2025,
      filingStatus: 'single',
      totalWages: 10_000,
      totalInterestIncome: 0,
      totalIncome: 10_000,
      totalFederalWithheld: 500,
      standardDeduction: STANDARD_DEDUCTION.single,
      taxableIncome: 0, // below deduction
      w2Count: 1,
      interestCount: 0,
    };

    const result = calculate2025(data);
    expect(result.taxableIncome).toBe(0);
    expect(result.totalTax).toBe(0);
    expect(result.refundOrOwed).toBe(500); // full withholding refunded
  });
});
