// ============================================================
// Open1040 — Zod Schemas
// Runtime validation for all user inputs.
// These enforce structure, types, and basic sanity checks.
// Business-rule validation is handled separately in services.
// ============================================================

import { z } from 'zod';
import { SUPPORTED_FILING_YEARS, SUPPORTED_FILING_STATUSES } from './index';

export const eligibilitySchema = z.object({
  isSingleFiler: z.boolean(),
  onlyW2Income: z.boolean(),
  hasSelfEmploymentIncome: z.boolean(),
  soldStocksCryptoProperty: z.boolean(),
  plansToItemize: z.boolean(),
  hasRentalIncome: z.boolean(),
  hasForeignIncome: z.boolean(),
  hasComplexCredits: z.boolean(),
  hasDependents: z.boolean(),
});

export const taxpayerProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  ssnLast4: z
    .string()
    .regex(/^\d{4}$/, 'Enter the last 4 digits of your SSN'),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD format'),
  filingStatus: z.enum(SUPPORTED_FILING_STATUSES as [string, ...string[]]),
  filingYear: z.number().refine(
    (y) => SUPPORTED_FILING_YEARS.includes(y as any),
    { message: `Supported filing years: ${SUPPORTED_FILING_YEARS.join(', ')}` }
  ),
});

export const w2Schema = z.object({
  id: z.string().min(1),
  employerName: z.string().min(1, 'Employer name is required').max(100),
  employerEin: z
    .string()
    .regex(/^\d{2}-\d{7}$/, 'EIN format: XX-XXXXXXX'),
  wagesBox1: z.number().min(0, 'Wages cannot be negative').max(10_000_000, 'Wages exceed reasonable limit'),
  federalWithheldBox2: z.number().min(0, 'Withholding cannot be negative').max(5_000_000),
  socialSecurityWagesBox3: z.number().min(0).max(500_000),
  socialSecurityWithheldBox4: z.number().min(0).max(50_000),
  medicareWagesBox5: z.number().min(0).max(10_000_000),
  medicareWithheldBox6: z.number().min(0).max(500_000),
  stateWages: z.number().min(0).optional(),
  stateWithheld: z.number().min(0).optional(),
});

export const interestIncomeSchema = z.object({
  id: z.string().min(1),
  payerName: z.string().min(1, 'Payer name is required').max(100),
  amount: z.number().min(0, 'Interest amount cannot be negative').max(1_000_000),
});

export const returnInputSchema = z.object({
  taxpayer: taxpayerProfileSchema,
  w2s: z.array(w2Schema).min(1, 'At least one W-2 is required'),
  interestIncome: z.array(interestIncomeSchema),
});
