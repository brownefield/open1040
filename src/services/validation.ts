// ============================================================
// Open1040 — Validation Service
// Layers: schema validation (Zod) + business-rule checks.
// Returns a unified ValidationResult.
// ============================================================

import type { ReturnInput, ValidationIssue, ValidationResult } from '@/domain/types';
import { returnInputSchema } from '@/domain/types/schemas';
import { SUPPORTED_FILING_YEARS } from '@/domain/types';

/**
 * Run Zod schema validation on raw input.
 */
function schemaValidation(input: unknown): ValidationIssue[] {
  const result = returnInputSchema.safeParse(input);
  if (result.success) return [];

  return result.error.issues.map((issue) => ({
    severity: 'error' as const,
    field: issue.path.join('.'),
    code: 'SCHEMA_' + issue.code.toUpperCase(),
    message: issue.message,
  }));
}

/**
 * Business-rule validation on parsed input.
 */
function businessRuleValidation(input: ReturnInput): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // Filing year must be implemented
  if (!SUPPORTED_FILING_YEARS.includes(input.taxpayer.filingYear as any)) {
    issues.push({
      severity: 'error',
      field: 'taxpayer.filingYear',
      code: 'UNSUPPORTED_YEAR',
      message: `Filing year ${input.taxpayer.filingYear} is not yet supported.`,
      suggestion: `Supported years: ${SUPPORTED_FILING_YEARS.join(', ')}`,
    });
  }

  // At least one W-2
  if (input.w2s.length === 0) {
    issues.push({
      severity: 'error',
      field: 'w2s',
      code: 'NO_W2',
      message: 'At least one W-2 is required for a simple return.',
    });
  }

  // Per-W-2 sanity checks
  for (let i = 0; i < input.w2s.length; i++) {
    const w2 = input.w2s[i];

    // Federal withholding should not exceed wages
    if (w2.federalWithheldBox2 > w2.wagesBox1) {
      issues.push({
        severity: 'warning',
        field: `w2s[${i}].federalWithheldBox2`,
        code: 'WITHHOLDING_EXCEEDS_WAGES',
        message: `W-2 #${i + 1}: Federal withholding ($${w2.federalWithheldBox2.toLocaleString()}) exceeds wages ($${w2.wagesBox1.toLocaleString()}). Please verify.`,
        suggestion: 'Double-check Box 1 and Box 2 on your W-2.',
      });
    }

    // Social Security wages have an annual limit
    // TODO: Update SS wage base for each year
    const ssWageBase2025 = 176_100;
    if (w2.socialSecurityWagesBox3 > ssWageBase2025) {
      issues.push({
        severity: 'warning',
        field: `w2s[${i}].socialSecurityWagesBox3`,
        code: 'SS_WAGES_EXCEED_BASE',
        message: `W-2 #${i + 1}: Social Security wages exceed the ${input.taxpayer.filingYear} wage base of $${ssWageBase2025.toLocaleString()}.`,
        suggestion: 'This may be correct if you had multiple employers, but verify your W-2.',
      });
    }

    // Zero wages is technically valid but suspicious
    if (w2.wagesBox1 === 0) {
      issues.push({
        severity: 'info',
        field: `w2s[${i}].wagesBox1`,
        code: 'ZERO_WAGES',
        message: `W-2 #${i + 1}: Wages are $0. If this is intentional, you may continue.`,
      });
    }
  }

  // Interest income sanity
  for (let i = 0; i < input.interestIncome.length; i++) {
    if (input.interestIncome[i].amount === 0) {
      issues.push({
        severity: 'info',
        field: `interestIncome[${i}].amount`,
        code: 'ZERO_INTEREST',
        message: `Interest entry #${i + 1}: Amount is $0. You can remove this entry if not needed.`,
      });
    }
  }

  return issues;
}

/**
 * Full validation pipeline.
 */
export function validateReturnInput(input: unknown): ValidationResult {
  // Phase 1: Schema
  const schemaIssues = schemaValidation(input);
  if (schemaIssues.some((i) => i.severity === 'error')) {
    return { valid: false, issues: schemaIssues };
  }

  // Phase 2: Business rules (only if schema passes)
  const typedInput = input as ReturnInput;
  const businessIssues = businessRuleValidation(typedInput);

  const allIssues = [...schemaIssues, ...businessIssues];
  const hasErrors = allIssues.some((i) => i.severity === 'error');

  return { valid: !hasErrors, issues: allIssues };
}
