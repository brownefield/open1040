'use client';

import type { ReviewSummary, ReturnInput } from '@/domain/types';
import { formatCurrency, formatPercent } from '@/lib/utils';
import { APP_NAME, DISCLAIMERS, LEGAL_ENTITY } from '@/lib/constants';

interface ExportScreenProps {
  summary: ReviewSummary;
  returnInput: ReturnInput;
  onStartOver: () => void;
}

export function ExportScreen({ summary, returnInput, onStartOver }: ExportScreenProps) {
  const calc = summary.calculationResult;
  const isRefund = calc.refundOrOwed >= 0;

  function downloadJSON() {
    const exportData = {
      meta: {
        tool: APP_NAME,
        version: '0.1.0-mvp',
        provider: LEGAL_ENTITY.name,
        exportedAt: new Date().toISOString(),
        disclaimer: DISCLAIMERS.primary,
      },
      calculationResult: calc,
      explanations: summary.explanations,
      validationIssues: summary.validationResult.issues,
      auditTrail: summary.auditTrail,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `open1040_${calc.filingYear}_summary.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function printSummary() {
    window.print();
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="text-center mb-6 sm:mb-8">
        <div
          className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
            isRefund ? 'bg-sage-100' : 'bg-warm-100'
          }`}
          aria-hidden="true"
        >
          <span className="text-2xl sm:text-3xl">{isRefund ? '✓' : '!'}</span>
        </div>
        <h2 className="font-display text-xl sm:text-2xl font-semibold text-navy-900 mb-2">
          Your {calc.filingYear} Return Summary
        </h2>
        <p className="text-sm sm:text-base text-navy-500">
          Review complete. You can download or print this summary.
        </p>
      </div>

      {/* Final Numbers */}
      <div
        className={`card mb-5 sm:mb-6 text-center ${
          isRefund ? 'bg-sage-50 border-sage-200' : 'bg-warm-50 border-warm-200'
        }`}
        role="status"
        aria-label={`${isRefund ? 'Estimated refund' : 'Estimated amount owed'}: ${formatCurrency(Math.abs(calc.refundOrOwed))}`}
      >
        <p className="text-xs sm:text-sm font-medium text-navy-500 mb-1">
          {isRefund ? 'Estimated Federal Refund' : 'Estimated Amount Owed'}
        </p>
        <p className={`font-display text-3xl sm:text-4xl font-bold mb-2 ${isRefund ? 'text-sage-700' : 'text-red-700'}`}>
          {formatCurrency(Math.abs(calc.refundOrOwed))}
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-1 sm:gap-6 text-xs sm:text-sm text-navy-500">
          <span>Income: {formatCurrency(calc.totalIncome)}</span>
          <span>Tax: {formatCurrency(calc.totalTax)}</span>
          <span>Rate: {formatPercent(calc.effectiveRate)}</span>
        </div>
      </div>

      {/* Printable Worksheet */}
      <section className="card mb-5 sm:mb-6 print:shadow-none print:border-0" id="printable-summary" aria-labelledby="worksheet-heading">
        <h3 id="worksheet-heading" className="font-display text-base sm:text-lg font-semibold text-navy-800 mb-4">
          Federal Tax Worksheet — {calc.filingYear}
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm" role="table" aria-label="Tax worksheet line items">
            <thead className="sr-only">
              <tr>
                <th>Line</th>
                <th>Description</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              <WorksheetLine num="1" label="Wages, salaries, tips (W-2 Box 1)" value={calc.totalWages} />
              <WorksheetLine num="2" label="Interest income (1099-INT)" value={calc.totalInterestIncome} />
              <WorksheetLine num="3" label="Total income (Line 1 + Line 2)" value={calc.totalIncome} bold />
              <WorksheetLine num="4" label={`Standard deduction (${calc.filingStatus})`} value={calc.standardDeduction} />
              <WorksheetLine num="5" label="Taxable income (Line 3 − Line 4)" value={calc.taxableIncome} bold />
              <WorksheetLine num="6" label="Federal income tax" value={calc.totalTax} bold />
              <WorksheetLine num="7" label="Federal tax withheld (W-2 Box 2)" value={calc.totalWithheld} />
              <WorksheetLine
                num="8"
                label={isRefund ? 'Estimated refund (Line 7 − Line 6)' : 'Estimated amount owed (Line 6 − Line 7)'}
                value={Math.abs(calc.refundOrOwed)}
                bold
                highlight={isRefund ? 'green' : 'red'}
              />
            </tbody>
          </table>
        </div>
      </section>

      {/* Disclaimer */}
      <div className="disclaimer-box mb-5 sm:mb-6 print:block" role="note">
        <p className="text-xs leading-relaxed">{DISCLAIMERS.primary}</p>
      </div>

      {/* Next Steps */}
      <section className="card mb-5 sm:mb-6" aria-labelledby="next-steps-heading">
        <h3 id="next-steps-heading" className="font-display text-base sm:text-lg font-semibold text-navy-800 mb-3">
          What to do next
        </h3>
        <div className="space-y-3 text-xs sm:text-sm text-navy-600">
          <p>
            <span className="font-semibold text-navy-800">1. Review the numbers above</span> — make sure
            everything matches your W-2 forms.
          </p>
          <p>
            <span className="font-semibold text-navy-800">2. File your actual return</span> — use{' '}
            <a
              href="https://www.irs.gov/filing/free-file-do-your-federal-taxes-for-free"
              target="_blank"
              rel="noopener noreferrer"
              className="text-navy-600 underline hover:text-navy-800"
            >
              IRS Free File
            </a>{' '}
            to e-file for free, or print and mail Form 1040.
          </p>
          <p>
            <span className="font-semibold text-navy-800">3. Keep records</span> — save your W-2s and this
            summary for at least 3 years.
          </p>
        </div>
      </section>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 print:hidden">
        <button onClick={downloadJSON} className="btn-secondary flex-1" aria-label="Download calculation summary as JSON file">
          Download JSON Summary
        </button>
        <button onClick={printSummary} className="btn-secondary flex-1" aria-label="Print tax worksheet">
          Print Worksheet
        </button>
      </div>

      <div className="text-center mt-6 print:hidden">
        <button onClick={onStartOver} className="text-xs sm:text-sm text-navy-400 hover:text-navy-600">
          Start a new return
        </button>
      </div>

      {/* Attribution */}
      <p className="text-center text-xs text-navy-300 mt-8 print:mt-4">
        Prepared with {APP_NAME} · A {LEGAL_ENTITY.name} project · Not tax advice
      </p>
    </div>
  );
}

function WorksheetLine({
  num,
  label,
  value,
  bold,
  highlight,
}: {
  num: string;
  label: string;
  value: number;
  bold?: boolean;
  highlight?: 'green' | 'red';
}) {
  const valueColor =
    highlight === 'green' ? 'text-sage-700' :
    highlight === 'red' ? 'text-red-700' :
    'text-navy-900';

  return (
    <tr className={`border-b border-navy-50 ${bold ? 'bg-navy-50' : ''}`}>
      <td className="py-2 pr-2 sm:pr-3 text-navy-400 font-mono w-6 sm:w-8">{num}</td>
      <td className={`py-2 ${bold ? 'font-semibold text-navy-900' : 'text-navy-700'}`}>
        {label}
      </td>
      <td className={`py-2 text-right font-mono whitespace-nowrap ${bold ? 'font-semibold' : ''} ${valueColor}`}>
        {formatCurrency(value)}
      </td>
    </tr>
  );
}
