// ============================================================
// Open1040 — Tax Year 2025 Rules
// All constants and calculation logic for the 2025 filing year.
//
// Sources:
//   - IRS Rev. Proc. 2024-40 (2025 tax year adjustments)
//   - IRS Form 1040 Instructions
//
// TODO: Verify all values against final IRS publications
//       before any real-world use. These are based on
//       publicly announced inflation-adjusted figures.
// ============================================================

import type {
  FilingStatus,
  TaxBracketResult,
  CalculationStep,
  CalculationResult,
  NormalizedReturnData,
} from '@/domain/types';

// ---- Constants ----

export const FILING_YEAR = 2025 as const;

/** Standard deduction by filing status for 2025 */
export const STANDARD_DEDUCTION: Record<FilingStatus, number> = {
  single: 15_750, // IRS Rev. Proc. 2024-40, confirmed on Form 1040 (2025)
  // TODO: Add other statuses when supported
  // married_filing_jointly: 30_000,
  // head_of_household: 22_500,
};

/**
 * Federal income tax brackets for 2025 — Single filer
 * Each entry: [lower bound (inclusive), upper bound (exclusive or null), marginal rate]
 *
 * Verified against IRS Rev. Proc. 2024-40 & OBBBA (July 2025).
 */
export const TAX_BRACKETS_SINGLE: [number, number | null, number][] = [
  [0, 11_925, 0.10],
  [11_925, 48_475, 0.12],
  [48_475, 103_350, 0.22],
  [103_350, 197_300, 0.24],
  [197_300, 250_525, 0.32],
  [250_525, 626_350, 0.35],
  [626_350, null, 0.37],
];

export const TAX_BRACKETS: Record<FilingStatus, [number, number | null, number][]> = {
  single: TAX_BRACKETS_SINGLE,
};

// ---- Calculation Functions ----

/**
 * Compute tax owed using progressive bracket system.
 * Returns both the total and a per-bracket breakdown.
 */
export function computeTaxByBrackets(
  taxableIncome: number,
  filingStatus: FilingStatus
): { total: number; brackets: TaxBracketResult[] } {
  const brackets = TAX_BRACKETS[filingStatus];
  if (!brackets) {
    throw new Error(`Unsupported filing status for 2025: ${filingStatus}`);
  }

  let remaining = Math.max(0, taxableIncome);
  let total = 0;
  const results: TaxBracketResult[] = [];

  for (const [bottom, top, rate] of brackets) {
    if (remaining <= 0) break;

    const bracketSize = top !== null ? top - bottom : Infinity;
    const taxableInBracket = Math.min(remaining, bracketSize);
    const taxForBracket = Math.round(taxableInBracket * rate * 100) / 100;

    results.push({
      bracketBottom: bottom,
      bracketTop: top,
      rate,
      taxableInBracket,
      taxForBracket,
    });

    total += taxForBracket;
    remaining -= taxableInBracket;
  }

  return { total: Math.round(total * 100) / 100, brackets: results };
}

/**
 * Full calculation pipeline for a normalized return.
 */
export function calculate2025(data: NormalizedReturnData): CalculationResult {
  const steps: CalculationStep[] = [];

  // Step 1: Total Income
  steps.push({
    label: 'Total Income',
    formula: 'Total Wages + Total Interest Income',
    inputs: {
      totalWages: data.totalWages,
      totalInterestIncome: data.totalInterestIncome,
    },
    result: data.totalIncome,
  });

  // Step 2: Standard Deduction
  const standardDeduction = STANDARD_DEDUCTION[data.filingStatus];
  steps.push({
    label: 'Standard Deduction',
    formula: `Standard deduction for ${data.filingStatus} filer in ${FILING_YEAR}`,
    inputs: { filingStatus: data.filingStatus, filingYear: FILING_YEAR },
    result: standardDeduction,
  });

  // Step 3: Taxable Income
  const taxableIncome = Math.max(0, data.totalIncome - standardDeduction);
  steps.push({
    label: 'Taxable Income',
    formula: 'max(0, Total Income - Standard Deduction)',
    inputs: { totalIncome: data.totalIncome, standardDeduction },
    result: taxableIncome,
  });

  // Step 4: Tax by brackets
  const { total: totalTax, brackets: taxByBracket } = computeTaxByBrackets(
    taxableIncome,
    data.filingStatus
  );

  for (const b of taxByBracket) {
    steps.push({
      label: `Tax at ${(b.rate * 100).toFixed(0)}% bracket`,
      formula: `min(remaining taxable, bracket size) × ${(b.rate * 100).toFixed(0)}%`,
      inputs: {
        bracketBottom: b.bracketBottom,
        bracketTop: b.bracketTop ?? 'unlimited',
        taxableInBracket: b.taxableInBracket,
      },
      result: b.taxForBracket,
    });
  }

  steps.push({
    label: 'Total Federal Tax',
    formula: 'Sum of tax from all brackets',
    inputs: { bracketCount: taxByBracket.length },
    result: totalTax,
  });

  // Step 5: Refund or Amount Owed
  const refundOrOwed = Math.round((data.totalFederalWithheld - totalTax) * 100) / 100;
  steps.push({
    label: 'Refund or Amount Owed',
    formula: 'Total Federal Withheld - Total Tax',
    inputs: {
      totalFederalWithheld: data.totalFederalWithheld,
      totalTax,
    },
    result: refundOrOwed,
    notes: refundOrOwed >= 0
      ? 'Positive value means you may receive a refund.'
      : 'Negative value means you may owe additional tax.',
  });

  // Effective rate
  const effectiveRate =
    data.totalIncome > 0
      ? Math.round((totalTax / data.totalIncome) * 10000) / 10000
      : 0;

  return {
    filingYear: FILING_YEAR,
    filingStatus: data.filingStatus,
    totalWages: data.totalWages,
    totalInterestIncome: data.totalInterestIncome,
    totalIncome: data.totalIncome,
    standardDeduction,
    taxableIncome,
    taxByBracket,
    totalTax,
    totalWithheld: data.totalFederalWithheld,
    refundOrOwed,
    effectiveRate,
    steps,
    timestamp: new Date().toISOString(),
  };
}
