// ============================================================
// Open1040 — Core Domain Types
// All data structures used across the application.
// Raw inputs, normalized data, calculations, explanations, audit.
// ============================================================

// ---- Filing Year ----
export type FilingYear = 2025 | 2026;

export const SUPPORTED_FILING_YEARS: FilingYear[] = [2025];
// TODO: Add 2026 when rules are implemented

// ---- Filing Status ----
export type FilingStatus = 'single';
// Future: 'married_filing_jointly' | 'married_filing_separately' | 'head_of_household' | 'qualifying_surviving_spouse'

export const SUPPORTED_FILING_STATUSES: FilingStatus[] = ['single'];

// ---- Eligibility ----
export interface EligibilityAnswers {
  isSingleFiler: boolean;
  onlyW2Income: boolean;
  hasSelfEmploymentIncome: boolean;
  soldStocksCryptoProperty: boolean;
  plansToItemize: boolean;
  hasRentalIncome: boolean;
  hasForeignIncome: boolean;
  hasComplexCredits: boolean;
  hasDependents: boolean;
}

export interface ScopeDecision {
  eligible: boolean;
  reasons: UnsupportedReason[];
  timestamp: string;
}

export interface UnsupportedReason {
  code: string;
  field: string;
  message: string;
  recommendation: string;
}

// ---- Taxpayer Profile ----
export interface TaxpayerProfile {
  firstName: string;
  lastName: string;
  /** Last 4 digits only — we do NOT store full SSN in MVP */
  ssnLast4: string;
  dateOfBirth: string; // ISO date string
  filingStatus: FilingStatus;
  filingYear: FilingYear;
}

// ---- W-2 Input ----
export interface W2Input {
  id: string;
  employerName: string;
  employerEin: string; // Employer Identification Number
  wagesBox1: number;
  federalWithheldBox2: number;
  socialSecurityWagesBox3: number;
  socialSecurityWithheldBox4: number;
  medicareWagesBox5: number;
  medicareWithheldBox6: number;
  stateWages?: number;
  stateWithheld?: number;
}

// ---- Interest Income ----
export interface InterestIncomeInput {
  id: string;
  payerName: string;
  amount: number; // 1099-INT Box 1
}

// ---- Combined Return Input (raw) ----
export interface ReturnInput {
  taxpayer: TaxpayerProfile;
  w2s: W2Input[];
  interestIncome: InterestIncomeInput[];
}

// ---- Normalized Return Data (processed) ----
export interface NormalizedReturnData {
  filingYear: FilingYear;
  filingStatus: FilingStatus;
  totalWages: number;
  totalInterestIncome: number;
  totalIncome: number;
  totalFederalWithheld: number;
  standardDeduction: number;
  taxableIncome: number;
  w2Count: number;
  interestCount: number;
}

// ---- Validation ----
export type ValidationSeverity = 'error' | 'warning' | 'info';

export interface ValidationIssue {
  severity: ValidationSeverity;
  field: string;
  code: string;
  message: string;
  suggestion?: string;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}

// ---- Calculation ----
export interface TaxBracketResult {
  bracketBottom: number;
  bracketTop: number | null; // null = unlimited
  rate: number;
  taxableInBracket: number;
  taxForBracket: number;
}

export interface CalculationStep {
  label: string;
  formula: string;
  inputs: Record<string, number | string>;
  result: number;
  notes?: string;
}

export interface CalculationResult {
  filingYear: FilingYear;
  filingStatus: FilingStatus;
  totalWages: number;
  totalInterestIncome: number;
  totalIncome: number;
  standardDeduction: number;
  taxableIncome: number;
  taxByBracket: TaxBracketResult[];
  totalTax: number;
  totalWithheld: number;
  refundOrOwed: number; // positive = refund, negative = owed
  effectiveRate: number;
  steps: CalculationStep[];
  timestamp: string;
}

// ---- Explanation ----
export interface ExplanationNode {
  lineItem: string;
  value: number | string;
  explanation: string;
  formula?: string;
  sourceInputs?: string[];
  warnings?: string[];
  notEvaluated?: string[];
}

// ---- Audit ----
export type AuditEventType =
  | 'eligibility_check'
  | 'scope_decision'
  | 'intake_started'
  | 'intake_completed'
  | 'validation_run'
  | 'calculation_run'
  | 'review_started'
  | 'review_acknowledged'
  | 'export_generated'
  | 'error';

export interface AuditEvent {
  id: string;
  type: AuditEventType;
  timestamp: string;
  data?: Record<string, unknown>;
  message: string;
}

// ---- Review ----
export interface ReviewSummary {
  calculationResult: CalculationResult;
  explanations: ExplanationNode[];
  validationResult: ValidationResult;
  auditTrail: AuditEvent[];
  completenessScore: number; // 0-100
  acknowledged: boolean;
  acknowledgedAt?: string;
}

// ---- App State ----
export type AppStep =
  | 'landing'
  | 'eligibility'
  | 'intake'
  | 'validation'
  | 'calculation'
  | 'review'
  | 'export';

export interface AppState {
  currentStep: AppStep;
  eligibilityAnswers: EligibilityAnswers | null;
  scopeDecision: ScopeDecision | null;
  returnInput: ReturnInput | null;
  validationResult: ValidationResult | null;
  calculationResult: CalculationResult | null;
  explanations: ExplanationNode[] | null;
  reviewSummary: ReviewSummary | null;
  auditTrail: AuditEvent[];
}
