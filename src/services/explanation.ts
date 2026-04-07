// ============================================================
// Open1040 — Explanation Engine
// Produces structured, human-readable explanations for
// every major calculated value. Critical for transparency.
// ============================================================

import type { CalculationResult, ExplanationNode, ReturnInput } from '@/domain/types';

const NOT_EVALUATED = [
  'Itemized deductions (standard deduction used)',
  'Self-employment tax',
  'Capital gains or losses',
  'Rental income or expenses',
  'Foreign income or credits',
  'Education credits',
  'Child tax credit',
  'Earned income credit',
  'State and local tax calculations',
];

export function generateExplanations(
  calc: CalculationResult,
  input: ReturnInput
): ExplanationNode[] {
  const nodes: ExplanationNode[] = [];

  // Total Wages
  const w2Details = input.w2s
    .map((w, i) => `W-2 #${i + 1} (${w.employerName}): $${w.wagesBox1.toLocaleString()}`)
    .join('; ');

  nodes.push({
    lineItem: 'Total Wages',
    value: calc.totalWages,
    explanation: `Total wages were calculated by summing Box 1 wages from all ${input.w2s.length} W-2 form(s) you entered. ${w2Details}.`,
    formula: 'Sum of all W-2 Box 1 amounts',
    sourceInputs: input.w2s.map((w) => `${w.employerName} Box 1: $${w.wagesBox1.toLocaleString()}`),
  });

  // Interest Income
  if (calc.totalInterestIncome > 0) {
    const intDetails = input.interestIncome
      .map((int, i) => `#${i + 1} (${int.payerName}): $${int.amount.toLocaleString()}`)
      .join('; ');

    nodes.push({
      lineItem: 'Total Interest Income',
      value: calc.totalInterestIncome,
      explanation: `Interest income totals from ${input.interestIncome.length} source(s): ${intDetails}.`,
      formula: 'Sum of all 1099-INT Box 1 amounts',
      sourceInputs: input.interestIncome.map(
        (int) => `${int.payerName}: $${int.amount.toLocaleString()}`
      ),
    });
  } else {
    nodes.push({
      lineItem: 'Total Interest Income',
      value: 0,
      explanation: 'No interest income was entered.',
    });
  }

  // Total Income
  nodes.push({
    lineItem: 'Total Income',
    value: calc.totalIncome,
    explanation: `Total income equals your total wages ($${calc.totalWages.toLocaleString()}) plus interest income ($${calc.totalInterestIncome.toLocaleString()}).`,
    formula: 'Total Wages + Total Interest Income',
    sourceInputs: [
      `Total Wages: $${calc.totalWages.toLocaleString()}`,
      `Total Interest: $${calc.totalInterestIncome.toLocaleString()}`,
    ],
  });

  // Standard Deduction
  nodes.push({
    lineItem: 'Standard Deduction',
    value: calc.standardDeduction,
    explanation: `The standard deduction for a ${calc.filingStatus} filer in ${calc.filingYear} is $${calc.standardDeduction.toLocaleString()}. This tool does not evaluate itemized deductions.`,
    formula: `IRS standard deduction for ${calc.filingStatus} filer, ${calc.filingYear}`,
    warnings: [
      'If your itemized deductions exceed the standard deduction, you may benefit from using a different tool.',
    ],
    notEvaluated: ['Itemized deductions'],
  });

  // Taxable Income
  nodes.push({
    lineItem: 'Taxable Income',
    value: calc.taxableIncome,
    explanation: `Taxable income equals your total income ($${calc.totalIncome.toLocaleString()}) minus the standard deduction ($${calc.standardDeduction.toLocaleString()}). If this would be negative, it is set to $0.`,
    formula: 'max(0, Total Income − Standard Deduction)',
    sourceInputs: [
      `Total Income: $${calc.totalIncome.toLocaleString()}`,
      `Standard Deduction: $${calc.standardDeduction.toLocaleString()}`,
    ],
  });

  // Tax by bracket
  for (const bracket of calc.taxByBracket) {
    const topLabel =
      bracket.bracketTop !== null
        ? `$${bracket.bracketTop.toLocaleString()}`
        : 'and above';
    nodes.push({
      lineItem: `Tax at ${(bracket.rate * 100).toFixed(0)}% Rate`,
      value: bracket.taxForBracket,
      explanation: `$${bracket.taxableInBracket.toLocaleString()} of your taxable income falls in the ${(bracket.rate * 100).toFixed(0)}% bracket ($${bracket.bracketBottom.toLocaleString()} to ${topLabel}), producing $${bracket.taxForBracket.toLocaleString()} in tax.`,
      formula: `$${bracket.taxableInBracket.toLocaleString()} × ${(bracket.rate * 100).toFixed(0)}%`,
    });
  }

  // Total Tax
  nodes.push({
    lineItem: 'Total Federal Tax',
    value: calc.totalTax,
    explanation: `Your total federal income tax is the sum of tax from each bracket: $${calc.totalTax.toLocaleString()}.`,
    formula: 'Sum of tax from all applicable brackets',
  });

  // Withholding
  const whDetails = input.w2s
    .map((w, i) => `W-2 #${i + 1}: $${w.federalWithheldBox2.toLocaleString()}`)
    .join('; ');

  nodes.push({
    lineItem: 'Total Federal Withholding',
    value: calc.totalWithheld,
    explanation: `Total federal tax withheld from your paychecks: ${whDetails}.`,
    formula: 'Sum of all W-2 Box 2 amounts',
    sourceInputs: input.w2s.map(
      (w) => `${w.employerName} Box 2: $${w.federalWithheldBox2.toLocaleString()}`
    ),
  });

  // Refund or Owed
  const refundOwedLabel =
    calc.refundOrOwed >= 0 ? 'Estimated Refund' : 'Estimated Amount Owed';
  const refundOwedExpl =
    calc.refundOrOwed >= 0
      ? `Your employer(s) withheld $${calc.totalWithheld.toLocaleString()} in federal taxes, which is $${Math.abs(calc.refundOrOwed).toLocaleString()} more than your calculated tax of $${calc.totalTax.toLocaleString()}. You may receive a refund of approximately $${Math.abs(calc.refundOrOwed).toLocaleString()}.`
      : `Your employer(s) withheld $${calc.totalWithheld.toLocaleString()} in federal taxes, which is $${Math.abs(calc.refundOrOwed).toLocaleString()} less than your calculated tax of $${calc.totalTax.toLocaleString()}. You may owe approximately $${Math.abs(calc.refundOrOwed).toLocaleString()}.`;

  nodes.push({
    lineItem: refundOwedLabel,
    value: calc.refundOrOwed,
    explanation: refundOwedExpl,
    formula: 'Total Withheld − Total Tax',
    sourceInputs: [
      `Total Withheld: $${calc.totalWithheld.toLocaleString()}`,
      `Total Tax: $${calc.totalTax.toLocaleString()}`,
    ],
    warnings: [
      'This is an estimate for educational purposes only. Your actual refund or amount owed may differ.',
    ],
  });

  // Effective Rate
  nodes.push({
    lineItem: 'Effective Tax Rate',
    value: `${(calc.effectiveRate * 100).toFixed(2)}%`,
    explanation: `Your effective federal tax rate is ${(calc.effectiveRate * 100).toFixed(2)}%, calculated as total tax divided by total income.`,
    formula: 'Total Tax ÷ Total Income × 100',
  });

  // Not Evaluated section
  nodes.push({
    lineItem: 'Areas Not Evaluated',
    value: 'N/A',
    explanation:
      'The following areas were NOT evaluated by this tool. If any apply to your situation, your actual tax liability may differ.',
    notEvaluated: NOT_EVALUATED,
  });

  return nodes;
}
