// ============================================================
// Open1040 — useAppState Hook
// Central state manager for the entire tax prep flow.
// Keeps all state in-memory (browser). Nothing leaves the client.
// ============================================================

'use client';

import { useState, useCallback } from 'react';
import type {
  AppState,
  AppStep,
  EligibilityAnswers,
  ReturnInput,
  ReviewSummary,
} from '@/domain/types';
import {
  evaluateEligibility,
  validateReturnInput,
  normalizeReturnInput,
  generateExplanations,
  createAuditEvent,
} from '@/services';
import { calculateTax } from '@/rules';

const INITIAL_STATE: AppState = {
  currentStep: 'landing',
  eligibilityAnswers: null,
  scopeDecision: null,
  returnInput: null,
  validationResult: null,
  calculationResult: null,
  explanations: null,
  reviewSummary: null,
  auditTrail: [],
};

export function useAppState() {
  const [state, setState] = useState<AppState>(INITIAL_STATE);

  const addAudit = useCallback(
    (type: Parameters<typeof createAuditEvent>[0], message: string, data?: Record<string, unknown>) => {
      const event = createAuditEvent(type, message, data);
      setState((prev) => ({
        ...prev,
        auditTrail: [...prev.auditTrail, event],
      }));
    },
    []
  );

  const goToStep = useCallback((step: AppStep) => {
    setState((prev) => ({ ...prev, currentStep: step }));
  }, []);

  const startFlow = useCallback(() => {
    addAudit('intake_started', 'User started eligibility screening');
    goToStep('eligibility');
  }, [addAudit, goToStep]);

  const submitEligibility = useCallback(
    (answers: EligibilityAnswers) => {
      const decision = evaluateEligibility(answers);
      addAudit('eligibility_check', 'Eligibility screening completed', {
        eligible: decision.eligible,
        reasonCount: decision.reasons.length,
      });
      addAudit('scope_decision', decision.eligible ? 'Return is in scope' : 'Return is out of scope', {
        reasons: decision.reasons.map((r) => r.code),
      });

      setState((prev) => ({
        ...prev,
        eligibilityAnswers: answers,
        scopeDecision: decision,
        currentStep: decision.eligible ? 'intake' : 'eligibility',
      }));

      return decision;
    },
    [addAudit]
  );

  const submitIntake = useCallback(
    (input: ReturnInput) => {
      // Validate
      const validationResult = validateReturnInput(input);
      addAudit('validation_run', 'Validation completed', {
        valid: validationResult.valid,
        issueCount: validationResult.issues.length,
      });

      if (!validationResult.valid) {
        setState((prev) => ({
          ...prev,
          returnInput: input,
          validationResult,
          currentStep: 'intake',
        }));
        return { success: false, validationResult };
      }

      // Normalize
      const normalized = normalizeReturnInput(input);

      // Calculate
      const calculationResult = calculateTax(input.taxpayer.filingYear, normalized);
      addAudit('calculation_run', 'Tax calculation completed', {
        totalTax: calculationResult.totalTax,
        refundOrOwed: calculationResult.refundOrOwed,
      });

      // Explain
      const explanations = generateExplanations(calculationResult, input);

      // Build review summary
      const reviewSummary: ReviewSummary = {
        calculationResult,
        explanations,
        validationResult,
        auditTrail: state.auditTrail,
        completenessScore: calculateCompleteness(input),
        acknowledged: false,
      };

      setState((prev) => ({
        ...prev,
        returnInput: input,
        validationResult,
        calculationResult,
        explanations,
        reviewSummary,
        currentStep: 'review',
      }));

      return { success: true, validationResult, calculationResult };
    },
    [addAudit, state.auditTrail]
  );

  const acknowledgeReview = useCallback(() => {
    addAudit('review_acknowledged', 'User acknowledged review and disclaimers');
    setState((prev) => ({
      ...prev,
      reviewSummary: prev.reviewSummary
        ? {
            ...prev.reviewSummary,
            acknowledged: true,
            acknowledgedAt: new Date().toISOString(),
          }
        : null,
      currentStep: 'export',
    }));
  }, [addAudit]);

  const resetApp = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  return {
    state,
    startFlow,
    submitEligibility,
    submitIntake,
    acknowledgeReview,
    goToStep,
    resetApp,
  };
}

function calculateCompleteness(input: ReturnInput): number {
  let score = 0;
  const checks = [
    !!input.taxpayer.firstName,
    !!input.taxpayer.lastName,
    !!input.taxpayer.ssnLast4,
    !!input.taxpayer.dateOfBirth,
    !!input.taxpayer.filingStatus,
    !!input.taxpayer.filingYear,
    input.w2s.length > 0,
    input.w2s.every((w) => w.wagesBox1 >= 0),
    input.w2s.every((w) => w.federalWithheldBox2 >= 0),
    input.w2s.every((w) => !!w.employerName),
  ];
  for (const check of checks) {
    if (check) score += 10;
  }
  return score;
}
