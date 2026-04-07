'use client';

import { useState } from 'react';
import type { ReviewSummary } from '@/domain/types';
import { formatCurrency, formatPercent } from '@/lib/utils';
import { DISCLAIMERS } from '@/lib/constants';

interface ReviewScreenProps {
  summary: ReviewSummary;
  onAcknowledge: () => void;
  onGoBack: () => void;
}

export function ReviewScreen({ summary, onAcknowledge, onGoBack }: ReviewScreenProps) {
  const [agreed, setAgreed] = useState(false);
  const [showAllExplanations, setShowAllExplanations] = useState(false);
  const calc = summary.calculationResult;
  const isRefund = calc.refundOrOwed >= 0;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <h2 className="font-display text-xl sm:text-2xl font-semibold text-navy-900 mb-2">
        Review Your Return
      </h2>
      <p className="text-sm sm:text-base text-navy-500 mb-6 sm:mb-8">
        Review every number below. Each calculation is explained in plain English.
      </p>

      {/* Big Result Card */}
      <div
        className={`card mb-5 sm:mb-6 text-center ${
          isRefund ? 'bg-sage-50 border-sage-200' : 'bg-warm-50 border-warm-200'
        }`}
        role="status"
        aria-label={isRefund
          ? `Estimated federal refund: ${formatCurrency(Math.abs(calc.refundOrOwed))}`
          : `Estimated amount owed: ${formatCurrency(Math.abs(calc.refundOrOwed))}`
        }
      >
        <p className="text-xs sm:text-sm font-medium text-navy-500 mb-1">
          {isRefund ? 'Estimated Federal Refund' : 'Estimated Amount Owed'}
        </p>
        <p className={`font-display text-3xl sm:text-5xl font-bold ${isRefund ? 'text-sage-700' : 'text-red-700'}`}>
          {formatCurrency(Math.abs(calc.refundOrOwed))}
        </p>
        <p className="text-xs text-navy-400 mt-2">
          This is an estimate for educational purposes only.
        </p>
      </div>

      {/* Summary Table */}
      <section className="card mb-5 sm:mb-6" aria-labelledby="calc-summary-heading">
        <h3 id="calc-summary-heading" className="font-display text-base sm:text-lg font-semibold text-navy-800 mb-4">
          Calculation Summary
        </h3>
        <div className="space-y-2.5 sm:space-y-3" role="table" aria-label="Tax calculation breakdown">
          <SummaryRow label="Total Wages" value={formatCurrency(calc.totalWages)} />
          <SummaryRow label="Interest Income" value={formatCurrency(calc.totalInterestIncome)} />
          <SummaryRow label="Total Income" value={formatCurrency(calc.totalIncome)} bold />
          <div className="border-t border-navy-100 my-2" role="separator" />
          <SummaryRow
            label={`Standard Deduction (${calc.filingStatus}, ${calc.filingYear})`}
            value={`− ${formatCurrency(calc.standardDeduction)}`}
          />
          <SummaryRow label="Taxable Income" value={formatCurrency(calc.taxableIncome)} bold />
          <div className="border-t border-navy-100 my-2" role="separator" />
          {calc.taxByBracket.map((b, i) => (
            <SummaryRow
              key={i}
              label={`Tax at ${formatPercent(b.rate)}`}
              value={formatCurrency(b.taxForBracket)}
              sub={`on ${formatCurrency(b.taxableInBracket)}`}
            />
          ))}
          <SummaryRow label="Total Federal Tax" value={formatCurrency(calc.totalTax)} bold />
          <div className="border-t border-navy-100 my-2" role="separator" />
          <SummaryRow label="Federal Tax Withheld (from W-2s)" value={formatCurrency(calc.totalWithheld)} />
          <SummaryRow
            label={isRefund ? 'Estimated Refund' : 'Estimated Amount Owed'}
            value={formatCurrency(Math.abs(calc.refundOrOwed))}
            bold
            highlight={isRefund ? 'green' : 'red'}
          />
          <SummaryRow label="Effective Tax Rate" value={formatPercent(calc.effectiveRate)} />
        </div>
      </section>

      {/* Explanations */}
      <section className="card mb-5 sm:mb-6" aria-labelledby="explanations-heading">
        <div className="flex items-center justify-between mb-4">
          <h3 id="explanations-heading" className="font-display text-base sm:text-lg font-semibold text-navy-800">
            Line-by-Line Explanations
          </h3>
          <button
            onClick={() => setShowAllExplanations(!showAllExplanations)}
            className="text-xs sm:text-sm text-navy-500 hover:text-navy-700"
            aria-label={showAllExplanations ? 'Collapse all explanations' : 'Expand all explanations'}
          >
            {showAllExplanations ? 'Collapse' : 'Expand All'}
          </button>
        </div>

        <div className="space-y-2 sm:space-y-3">
          {summary.explanations.map((node, i) => (
            <ExplanationItem key={i} node={node} defaultOpen={showAllExplanations} />
          ))}
        </div>
      </section>

      {/* Warnings */}
      {summary.validationResult.issues.filter((i) => i.severity === 'warning').length > 0 && (
        <div className="bg-warm-50 border border-warm-200 rounded-lg p-3 sm:p-4 mb-5 sm:mb-6" role="alert">
          <p className="font-medium text-yellow-800 mb-2 text-sm">Warnings</p>
          {summary.validationResult.issues
            .filter((i) => i.severity === 'warning')
            .map((w, i) => (
              <p key={i} className="text-xs sm:text-sm text-yellow-700 mb-1">• {w.message}</p>
            ))}
        </div>
      )}

      {/* Completeness */}
      <div className="card mb-5 sm:mb-6">
        <h3 className="font-display text-base sm:text-lg font-semibold text-navy-800 mb-2">
          Completeness
        </h3>
        <div
          className="w-full bg-navy-100 rounded-full h-2 mb-2"
          role="progressbar"
          aria-valuenow={summary.completenessScore}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${summary.completenessScore}% complete`}
        >
          <div
            className="bg-navy-700 h-2 rounded-full transition-all duration-500"
            style={{ width: `${summary.completenessScore}%` }}
          />
        </div>
        <p className="text-xs sm:text-sm text-navy-500">
          {summary.completenessScore}% of required fields are complete
        </p>
      </div>

      {/* Disclaimer + Acknowledgement */}
      <div className="card mb-5 sm:mb-6">
        <div className="disclaimer-box mb-4">
          <p className="leading-relaxed text-xs sm:text-sm">{DISCLAIMERS.acknowledgement}</p>
        </div>

        <label className="flex items-start gap-3 cursor-pointer" htmlFor="acknowledge-checkbox">
          <input
            id="acknowledge-checkbox"
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 w-5 h-5 rounded border-navy-300 text-navy-700
                       focus:ring-navy-500 cursor-pointer flex-shrink-0"
          />
          <span className="text-xs sm:text-sm text-navy-700">
            I have read and understand the above disclaimer. I acknowledge that
            this is a preparation tool only.
          </span>
        </label>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <button onClick={onGoBack} className="btn-secondary w-full sm:w-auto order-2 sm:order-1">
          ← Edit Inputs
        </button>
        <button
          onClick={onAcknowledge}
          disabled={!agreed}
          className="btn-primary flex-1 order-1 sm:order-2"
          aria-disabled={!agreed}
        >
          Confirm & View Results →
        </button>
      </div>
    </div>
  );
}

// ---- Sub-Components ----

function SummaryRow({
  label,
  value,
  sub,
  bold,
  highlight,
}: {
  label: string;
  value: string;
  sub?: string;
  bold?: boolean;
  highlight?: 'green' | 'red';
}) {
  const valueColor =
    highlight === 'green' ? 'text-sage-700' :
    highlight === 'red' ? 'text-red-700' :
    'text-navy-900';

  return (
    <div className="flex items-baseline justify-between gap-2" role="row">
      <span className={`text-xs sm:text-sm ${bold ? 'font-semibold text-navy-900' : 'text-navy-600'}`} role="rowheader">
        {label}
      </span>
      <div className="text-right flex-shrink-0" role="cell">
        <span className={`text-xs sm:text-sm font-mono ${bold ? 'font-semibold' : ''} ${valueColor}`}>
          {value}
        </span>
        {sub && <span className="text-xs text-navy-400 ml-1 sm:ml-2 hidden sm:inline">{sub}</span>}
      </div>
    </div>
  );
}

function ExplanationItem({
  node,
  defaultOpen,
}: {
  node: { lineItem: string; explanation: string; formula?: string; notEvaluated?: string[] };
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border border-navy-100 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 text-left
                   hover:bg-navy-50 transition-colors"
        aria-expanded={open}
        aria-controls={`explanation-${node.lineItem.replace(/\s+/g, '-').toLowerCase()}`}
      >
        <span className="text-xs sm:text-sm font-medium text-navy-800">{node.lineItem}</span>
        <span className="text-navy-400 text-xs ml-2 flex-shrink-0" aria-hidden="true">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div
          id={`explanation-${node.lineItem.replace(/\s+/g, '-').toLowerCase()}`}
          className="px-3 sm:px-4 pb-3 sm:pb-4 border-t border-navy-50"
        >
          <p className="text-xs sm:text-sm text-navy-600 mt-2.5 sm:mt-3 leading-relaxed">
            {node.explanation}
          </p>
          {node.formula && (
            <p className="text-xs text-navy-400 mt-2 font-mono bg-navy-50 px-2 py-1 rounded break-all">
              Formula: {node.formula}
            </p>
          )}
          {node.notEvaluated && node.notEvaluated.length > 0 && (
            <div className="mt-2.5">
              <p className="text-xs font-medium text-navy-500 mb-1">Not evaluated:</p>
              {node.notEvaluated.map((item, i) => (
                <p key={i} className="text-xs text-navy-400">• {item}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
