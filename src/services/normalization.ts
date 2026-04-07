// ============================================================
// Open1040 — Normalization Service
// Transforms validated raw inputs into a clean NormalizedReturnData
// structure that the rules engine can consume.
// ============================================================

import type { ReturnInput, NormalizedReturnData } from '@/domain/types';
import { getStandardDeduction } from '@/rules';

/**
 * Normalize raw return input into calculation-ready data.
 * Assumes input has already passed validation.
 */
export function normalizeReturnInput(input: ReturnInput): NormalizedReturnData {
  const totalWages = input.w2s.reduce((sum, w2) => sum + w2.wagesBox1, 0);
  const totalInterestIncome = input.interestIncome.reduce(
    (sum, int) => sum + int.amount,
    0
  );
  const totalIncome = totalWages + totalInterestIncome;
  const totalFederalWithheld = input.w2s.reduce(
    (sum, w2) => sum + w2.federalWithheldBox2,
    0
  );
  const standardDeduction = getStandardDeduction(
    input.taxpayer.filingYear,
    input.taxpayer.filingStatus
  );
  const taxableIncome = Math.max(0, totalIncome - standardDeduction);

  return {
    filingYear: input.taxpayer.filingYear,
    filingStatus: input.taxpayer.filingStatus,
    totalWages: round2(totalWages),
    totalInterestIncome: round2(totalInterestIncome),
    totalIncome: round2(totalIncome),
    totalFederalWithheld: round2(totalFederalWithheld),
    standardDeduction,
    taxableIncome: round2(taxableIncome),
    w2Count: input.w2s.length,
    interestCount: input.interestIncome.length,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
