// ============================================================
// Open1040 — Mock/Seed Data
// Example inputs for testing, demos, and development.
// These represent realistic but fictional taxpayers.
// ============================================================

import type { ReturnInput, EligibilityAnswers } from '@/domain/types';

/** Fully eligible single filer with one W-2 */
export const MOCK_ELIGIBLE_ANSWERS: EligibilityAnswers = {
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

/** Simple return: single filer, one W-2, no interest */
export const MOCK_SIMPLE_RETURN: ReturnInput = {
  taxpayer: {
    firstName: 'Alex',
    lastName: 'Rivera',
    ssnLast4: '7890',
    dateOfBirth: '1992-08-14',
    filingStatus: 'single',
    filingYear: 2025,
  },
  w2s: [
    {
      id: 'mock_w2_1',
      employerName: 'Pacific Engineering Co',
      employerEin: '99-1234567',
      wagesBox1: 58_000,
      federalWithheldBox2: 7_200,
      socialSecurityWagesBox3: 58_000,
      socialSecurityWithheldBox4: 3_596,
      medicareWagesBox5: 58_000,
      medicareWithheldBox6: 841,
    },
  ],
  interestIncome: [],
};

/** Return with two W-2s and interest income */
export const MOCK_TWO_W2_RETURN: ReturnInput = {
  taxpayer: {
    firstName: 'Jordan',
    lastName: 'Kealoha',
    ssnLast4: '4321',
    dateOfBirth: '1985-11-30',
    filingStatus: 'single',
    filingYear: 2025,
  },
  w2s: [
    {
      id: 'mock_w2_2a',
      employerName: 'Island Tech Solutions',
      employerEin: '88-7654321',
      wagesBox1: 42_000,
      federalWithheldBox2: 4_800,
      socialSecurityWagesBox3: 42_000,
      socialSecurityWithheldBox4: 2_604,
      medicareWagesBox5: 42_000,
      medicareWithheldBox6: 609,
    },
    {
      id: 'mock_w2_2b',
      employerName: 'Coastal Cafe LLC',
      employerEin: '77-1111111',
      wagesBox1: 12_000,
      federalWithheldBox2: 800,
      socialSecurityWagesBox3: 12_000,
      socialSecurityWithheldBox4: 744,
      medicareWagesBox5: 12_000,
      medicareWithheldBox6: 174,
    },
  ],
  interestIncome: [
    {
      id: 'mock_int_1',
      payerName: 'First Hawaiian Bank',
      amount: 285,
    },
  ],
};

/** Low-income return — income below standard deduction */
export const MOCK_LOW_INCOME_RETURN: ReturnInput = {
  taxpayer: {
    firstName: 'Sam',
    lastName: 'Chen',
    ssnLast4: '0001',
    dateOfBirth: '2003-04-22',
    filingStatus: 'single',
    filingYear: 2025,
  },
  w2s: [
    {
      id: 'mock_w2_low',
      employerName: 'Campus Bookstore',
      employerEin: '66-9999999',
      wagesBox1: 8_500,
      federalWithheldBox2: 425,
      socialSecurityWagesBox3: 8_500,
      socialSecurityWithheldBox4: 527,
      medicareWagesBox5: 8_500,
      medicareWithheldBox6: 123.25,
    },
  ],
  interestIncome: [],
};

/** Ineligible answers — self-employment */
export const MOCK_INELIGIBLE_SELF_EMPLOYED: EligibilityAnswers = {
  isSingleFiler: true,
  onlyW2Income: false,
  hasSelfEmploymentIncome: true,
  soldStocksCryptoProperty: false,
  plansToItemize: false,
  hasRentalIncome: false,
  hasForeignIncome: false,
  hasComplexCredits: false,
  hasDependents: false,
};
