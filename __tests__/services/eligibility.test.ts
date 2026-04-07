import { describe, it, expect } from 'vitest';
import { evaluateEligibility } from '@/services/eligibility';
import type { EligibilityAnswers } from '@/domain/types';

const ELIGIBLE_ANSWERS: EligibilityAnswers = {
  isSingleFiler: true,
  onlyW2Income: true,
  hasSelfEmploymentIncome: false,
  soldStocksCryptoProperty: false,
  plansToItemize: false,
  hasRentalIncome: false,
  hasForeignIncome: false,
  hasComplexCredits: false,
  hasDependents: false,
};

describe('Eligibility Service', () => {
  it('accepts a fully eligible simple return', () => {
    const decision = evaluateEligibility(ELIGIBLE_ANSWERS);
    expect(decision.eligible).toBe(true);
    expect(decision.reasons).toHaveLength(0);
  });

  it('rejects married filer', () => {
    const decision = evaluateEligibility({
      ...ELIGIBLE_ANSWERS,
      isSingleFiler: false,
    });
    expect(decision.eligible).toBe(false);
    expect(decision.reasons.some((r) => r.code === 'UNSUPPORTED_FILING_STATUS')).toBe(true);
  });

  it('rejects self-employment income', () => {
    const decision = evaluateEligibility({
      ...ELIGIBLE_ANSWERS,
      hasSelfEmploymentIncome: true,
    });
    expect(decision.eligible).toBe(false);
    expect(decision.reasons.some((r) => r.code === 'SELF_EMPLOYMENT')).toBe(true);
  });

  it('rejects capital gains', () => {
    const decision = evaluateEligibility({
      ...ELIGIBLE_ANSWERS,
      soldStocksCryptoProperty: true,
    });
    expect(decision.eligible).toBe(false);
    expect(decision.reasons.some((r) => r.code === 'CAPITAL_GAINS')).toBe(true);
  });

  it('rejects itemized deductions', () => {
    const decision = evaluateEligibility({
      ...ELIGIBLE_ANSWERS,
      plansToItemize: true,
    });
    expect(decision.eligible).toBe(false);
    expect(decision.reasons.some((r) => r.code === 'ITEMIZED_DEDUCTIONS')).toBe(true);
  });

  it('accumulates multiple rejection reasons', () => {
    const decision = evaluateEligibility({
      isSingleFiler: false,
      onlyW2Income: false,
      hasSelfEmploymentIncome: true,
      soldStocksCryptoProperty: true,
      plansToItemize: true,
      hasRentalIncome: true,
      hasForeignIncome: true,
      hasComplexCredits: true,
      hasDependents: true,
    });
    expect(decision.eligible).toBe(false);
    expect(decision.reasons.length).toBeGreaterThanOrEqual(5);
  });
});
