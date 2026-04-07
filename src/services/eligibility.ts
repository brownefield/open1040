// ============================================================
// Open1040 — Eligibility Service
// Evaluates screening answers and returns a scope decision.
// If ANY unsupported condition is detected, the return is rejected.
// ============================================================

import type { EligibilityAnswers, ScopeDecision, UnsupportedReason } from '@/domain/types';

export function evaluateEligibility(answers: EligibilityAnswers): ScopeDecision {
  const reasons: UnsupportedReason[] = [];

  if (!answers.isSingleFiler) {
    reasons.push({
      code: 'UNSUPPORTED_FILING_STATUS',
      field: 'isSingleFiler',
      message: 'Open1040 currently supports single filers only.',
      recommendation:
        'Consider using IRS Free File, a commercial tax service, or consulting a tax professional for other filing statuses.',
    });
  }

  if (!answers.onlyW2Income) {
    reasons.push({
      code: 'UNSUPPORTED_INCOME_TYPE',
      field: 'onlyW2Income',
      message: 'Open1040 only supports wage income reported on W-2 forms (and simple bank interest).',
      recommendation:
        'If you have income from self-employment, investments, or other sources, please use a broader tax preparation service.',
    });
  }

  if (answers.hasSelfEmploymentIncome) {
    reasons.push({
      code: 'SELF_EMPLOYMENT',
      field: 'hasSelfEmploymentIncome',
      message: 'Self-employment income requires Schedule C and is outside our scope.',
      recommendation:
        'A tax professional or full-featured software can handle self-employment calculations including SE tax.',
    });
  }

  if (answers.soldStocksCryptoProperty) {
    reasons.push({
      code: 'CAPITAL_GAINS',
      field: 'soldStocksCryptoProperty',
      message: 'Sales of stocks, cryptocurrency, or property require Schedule D and are not supported.',
      recommendation:
        'Capital gains/losses reporting requires specialized forms. Please use a service that supports Schedule D.',
    });
  }

  if (answers.plansToItemize) {
    reasons.push({
      code: 'ITEMIZED_DEDUCTIONS',
      field: 'plansToItemize',
      message: 'Open1040 uses the standard deduction only. Itemized deductions are not supported.',
      recommendation:
        'If your itemized deductions exceed the standard deduction, a more comprehensive tool will better serve you.',
    });
  }

  if (answers.hasRentalIncome) {
    reasons.push({
      code: 'RENTAL_INCOME',
      field: 'hasRentalIncome',
      message: 'Rental income requires Schedule E and is not supported.',
      recommendation:
        'Rental property income involves depreciation and expense tracking. Please consult a tax professional.',
    });
  }

  if (answers.hasForeignIncome) {
    reasons.push({
      code: 'FOREIGN_INCOME',
      field: 'hasForeignIncome',
      message: 'Foreign income or foreign financial accounts are not supported.',
      recommendation:
        'Foreign income may require Form 2555, FBAR, or FATCA reporting. Please seek specialized assistance.',
    });
  }

  if (answers.hasComplexCredits) {
    reasons.push({
      code: 'COMPLEX_CREDITS',
      field: 'hasComplexCredits',
      message: 'Complex tax credits are not supported in this version.',
      recommendation:
        'Credits like earned income credit, education credits, or child tax credit will be added in future versions.',
    });
  }

  if (answers.hasDependents) {
    reasons.push({
      code: 'DEPENDENTS',
      field: 'hasDependents',
      message: 'Claiming dependents is not supported in this version.',
      recommendation:
        'Dependent-related benefits (child tax credit, etc.) require additional forms. This will be supported in a future release.',
    });
  }

  return {
    eligible: reasons.length === 0,
    reasons,
    timestamp: new Date().toISOString(),
  };
}
