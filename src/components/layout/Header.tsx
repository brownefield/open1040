'use client';

import { APP_NAME, isYearExpired, isYearExpiringSoon } from '@/lib/constants';
import { SUPPORTED_FILING_YEARS } from '@/domain/types';
import type { AppStep } from '@/domain/types';

const STEPS: { key: AppStep; label: string }[] = [
  { key: 'eligibility', label: 'Eligibility' },
  { key: 'intake', label: 'Enter Info' },
  { key: 'review', label: 'Review' },
  { key: 'export', label: 'Results' },
];

interface HeaderProps {
  currentStep: AppStep;
  onReset: () => void;
}

export function Header({ currentStep, onReset }: HeaderProps) {
  const stepIndex = STEPS.findIndex((s) => s.key === currentStep);
  const currentYear = SUPPORTED_FILING_YEARS[SUPPORTED_FILING_YEARS.length - 1];
  const expired = isYearExpired(currentYear);
  const expiringSoon = isYearExpiringSoon(currentYear);

  return (
    <header className="border-b border-navy-100 bg-white" role="banner">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <button
            onClick={onReset}
            className="flex items-center gap-2 group"
            aria-label={`${APP_NAME} — return to home`}
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-navy-800 rounded-lg flex items-center justify-center" aria-hidden="true">
              <span className="text-white font-display font-bold text-xs sm:text-sm">10</span>
            </div>
            <span className="font-display font-semibold text-navy-900 text-base sm:text-lg group-hover:text-navy-600 transition-colors">
              {APP_NAME}
            </span>
          </button>

          {currentStep !== 'landing' && (
            <button
              onClick={onReset}
              className="text-xs sm:text-sm text-navy-400 hover:text-navy-600 transition-colors"
            >
              Start Over
            </button>
          )}
        </div>

        {/* Progress bar */}
        {currentStep !== 'landing' && stepIndex >= 0 && (
          <nav aria-label="Progress">
            <div className="flex gap-1.5" role="list">
              {STEPS.map((step, i) => (
                <div
                  key={step.key}
                  role="listitem"
                  aria-label={`${step.label}${i <= stepIndex ? ' — complete' : ''}`}
                  className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                    i <= stepIndex ? 'bg-navy-700' : 'bg-navy-100'
                  }`}
                />
              ))}
            </div>
            <p className="sr-only">
              Step {stepIndex + 1} of {STEPS.length}: {STEPS[stepIndex]?.label}
            </p>
          </nav>
        )}
      </div>

      {/* Year expiration warning */}
      {expired && (
        <div className="bg-red-600 text-white px-4 py-2 text-center text-xs sm:text-sm" role="alert">
          <strong>Warning:</strong> The tax rules in this version may be outdated. Please verify
          all calculations against current IRS publications before relying on them.
        </div>
      )}
      {!expired && expiringSoon && (
        <div className="bg-yellow-500 text-navy-900 px-4 py-2 text-center text-xs sm:text-sm" role="status">
          Tax year {currentYear} rules will expire soon. An updated version is being prepared.
        </div>
      )}
    </header>
  );
}
