'use client';

import { useState } from 'react';
import type { EligibilityAnswers, ScopeDecision } from '@/domain/types';
import { ELIGIBILITY_QUESTIONS } from '@/lib/constants';

interface EligibilityScreenProps {
  onSubmit: (answers: EligibilityAnswers) => ScopeDecision;
}

const DEFAULT_ANSWERS: EligibilityAnswers = {
  isSingleFiler: false,
  onlyW2Income: false,
  hasSelfEmploymentIncome: false,
  soldStocksCryptoProperty: false,
  plansToItemize: false,
  hasRentalIncome: false,
  hasForeignIncome: false,
  hasComplexCredits: false,
  hasDependents: false,
};

export function EligibilityScreen({ onSubmit }: EligibilityScreenProps) {
  const [answers, setAnswers] = useState<EligibilityAnswers>(DEFAULT_ANSWERS);
  const [decision, setDecision] = useState<ScopeDecision | null>(null);
  const [currentQ, setCurrentQ] = useState(0);

  const questions = ELIGIBILITY_QUESTIONS;
  const isLastQuestion = currentQ === questions.length - 1;

  function handleAnswer(value: boolean) {
    const q = questions[currentQ];
    setAnswers((prev) => ({ ...prev, [q.id]: value }));

    if (isLastQuestion) {
      const updated = { ...answers, [q.id]: value };
      const result = onSubmit(updated);
      if (!result.eligible) {
        setDecision(result);
      }
    } else {
      setCurrentQ((prev) => prev + 1);
    }
  }

  // Rejection screen
  if (decision && !decision.eligible) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="card" role="alert">
          <div className="w-12 h-12 bg-warm-100 rounded-xl flex items-center justify-center mb-4" aria-hidden="true">
            <span className="text-2xl">⚠</span>
          </div>
          <h2 className="font-display text-xl sm:text-2xl font-semibold text-navy-900 mb-3">
            This return is outside our scope
          </h2>
          <p className="text-sm sm:text-base text-navy-600 mb-6 leading-relaxed">
            Based on your answers, your tax situation includes elements that Open1040 cannot
            accurately handle. We want to be honest about our limits rather than risk giving
            you incomplete results.
          </p>

          <div className="space-y-3 sm:space-y-4 mb-6" role="list" aria-label="Reasons your return is not supported">
            {decision.reasons.map((reason) => (
              <div
                key={reason.code}
                role="listitem"
                className="bg-red-50 border border-red-100 rounded-lg p-3 sm:p-4"
              >
                <p className="font-medium text-red-800 mb-1 text-sm sm:text-base">{reason.message}</p>
                <p className="text-xs sm:text-sm text-red-600">{reason.recommendation}</p>
              </div>
            ))}
          </div>

          <div className="bg-navy-50 rounded-lg p-4 mb-6">
            <p className="text-sm font-medium text-navy-700 mb-2">
              Free alternatives for complex returns
            </p>
            <p className="text-xs sm:text-sm text-navy-600">
              <a href="https://www.irs.gov/filing/free-file-do-your-federal-taxes-for-free" target="_blank" rel="noopener noreferrer" className="underline hover:text-navy-800">IRS Free File</a> offers
              free tax preparation if you qualify. <a href="https://www.irs.gov/individuals/free-tax-return-preparation-for-qualifying-taxpayers" target="_blank" rel="noopener noreferrer" className="underline hover:text-navy-800">VITA</a> provides
              free in-person help at locations nationwide.
            </p>
          </div>

          <button
            onClick={() => {
              setDecision(null);
              setCurrentQ(0);
              setAnswers(DEFAULT_ANSWERS);
            }}
            className="btn-secondary w-full sm:w-auto"
          >
            Start Over
          </button>
        </div>
      </div>
    );
  }

  // Screening questions
  const q = questions[currentQ];
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <div className="mb-6 sm:mb-8">
        <p className="text-xs sm:text-sm text-navy-400 mb-1.5" aria-live="polite">
          Question {currentQ + 1} of {questions.length}
        </p>
        <div className="flex gap-1" role="progressbar" aria-valuenow={currentQ + 1} aria-valuemin={1} aria-valuemax={questions.length}>
          {questions.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors duration-200 ${
                i <= currentQ ? 'bg-navy-600' : 'bg-navy-100'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="card">
        <h2 className="font-display text-xl sm:text-2xl font-semibold text-navy-900 mb-2">
          {q.question}
        </h2>
        <p className="text-navy-400 text-xs sm:text-sm mb-6 sm:mb-8">{q.helpText}</p>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <button
            onClick={() => handleAnswer(true)}
            className="btn-primary flex-1 py-3 sm:py-4"
            autoFocus
          >
            Yes
          </button>
          <button
            onClick={() => handleAnswer(false)}
            className="btn-secondary flex-1 py-3 sm:py-4"
          >
            No
          </button>
        </div>
      </div>

      {currentQ > 0 && (
        <button
          onClick={() => setCurrentQ((prev) => prev - 1)}
          className="mt-4 text-xs sm:text-sm text-navy-400 hover:text-navy-600 transition-colors"
          aria-label="Go to previous question"
        >
          ← Previous question
        </button>
      )}
    </div>
  );
}
