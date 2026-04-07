import { describe, it, expect } from 'vitest';
import { evaluateEligibility } from '@/services/eligibility';
import { validateReturnInput } from '@/services/validation';
import { normalizeReturnInput } from '@/services/normalization';
import { generateExplanations } from '@/services/explanation';
import { calculateTax } from '@/rules';
import type { EligibilityAnswers, ReturnInput } from '@/domain/types';

describe('End-to-End: Simple Return Pipeline', () => {
  it('completes the full flow for a valid simple return', () => {
    // Step 1: Eligibility
    const eligibility: EligibilityAnswers = {
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
    const scope = evaluateEligibility(eligibility);
    expect(scope.eligible).toBe(true);

    // Step 2: Input
    const input: ReturnInput = {
      taxpayer: {
        firstName: 'Jane',
        lastName: 'Smith',
        ssnLast4: '5678',
        dateOfBirth: '1988-03-22',
        filingStatus: 'single',
        filingYear: 2025,
      },
      w2s: [
        {
          id: 'w2_1',
          employerName: 'Tech Startup Inc',
          employerEin: '98-7654321',
          wagesBox1: 72000,
          federalWithheldBox2: 9800,
          socialSecurityWagesBox3: 72000,
          socialSecurityWithheldBox4: 4464,
          medicareWagesBox5: 72000,
          medicareWithheldBox6: 1044,
        },
      ],
      interestIncome: [
        { id: 'int_1', payerName: 'First National Bank', amount: 350 },
      ],
    };

    // Step 3: Validate
    const validation = validateReturnInput(input);
    expect(validation.valid).toBe(true);

    // Step 4: Normalize
    const normalized = normalizeReturnInput(input);
    expect(normalized.totalWages).toBe(72000);
    expect(normalized.totalInterestIncome).toBe(350);
    expect(normalized.totalIncome).toBe(72350);

    // Step 5: Calculate
    const calc = calculateTax(2025, normalized);
    expect(calc.totalIncome).toBe(72350);
    expect(calc.standardDeduction).toBe(15750);
    expect(calc.taxableIncome).toBe(56600);
    expect(calc.totalTax).toBeGreaterThan(0);
    expect(calc.totalTax).toBeLessThan(calc.totalIncome);
    expect(calc.steps.length).toBeGreaterThanOrEqual(5);

    // Step 6: Explain
    const explanations = generateExplanations(calc, input);
    expect(explanations.length).toBeGreaterThanOrEqual(5);
    expect(explanations.some((e) => e.lineItem === 'Total Wages')).toBe(true);
    expect(explanations.some((e) => e.lineItem === 'Areas Not Evaluated')).toBe(true);

    // Verify refund/owed makes sense
    const expectedRefundOrOwed = calc.totalWithheld - calc.totalTax;
    expect(calc.refundOrOwed).toBeCloseTo(expectedRefundOrOwed, 2);
  });

  it('rejects an unsupported return at eligibility', () => {
    const eligibility: EligibilityAnswers = {
      isSingleFiler: true,
      onlyW2Income: true,
      hasSelfEmploymentIncome: true, // disqualifier
      soldStocksCryptoProperty: false,
      plansToItemize: false,
      hasRentalIncome: false,
      hasForeignIncome: false,
      hasComplexCredits: false,
      hasDependents: false,
    };
    const scope = evaluateEligibility(eligibility);
    expect(scope.eligible).toBe(false);
    expect(scope.reasons[0].code).toBe('SELF_EMPLOYMENT');
  });
});
