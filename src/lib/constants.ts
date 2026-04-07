// ============================================================
// Open1040 — Application Constants
// Centralized copy, disclaimers, and configuration.
// ============================================================

export const APP_NAME = 'Open1040';
export const APP_VERSION = '0.1.0-mvp';
export const APP_TAGLINE = 'Free, transparent tax preparation for simple federal returns.';

export const DISCLAIMERS = {
  primary: `${APP_NAME} is a free, open-source educational tool that helps you understand your simple federal tax return. It is NOT a tax filing service. It does NOT submit returns to the IRS. It does NOT constitute tax advice, legal advice, or financial advice. Always consult a qualified tax professional for your specific situation.`,

  notTaxAdvice:
    'This tool provides estimates for educational and preparation purposes only. It is not a substitute for professional tax advice.',

  noGuarantee:
    'Open1040 does not guarantee the accuracy of its calculations or the acceptance of any tax return by the IRS.',

  scopeLimit:
    'This tool is designed exclusively for very simple federal returns: single filers with W-2 income and the standard deduction. If your tax situation is more complex, please use a comprehensive tax preparation service.',

  privacy:
    'Your data stays in your browser. Open1040 does not transmit personal information to any server in this version. No data is stored after you close your browser tab.',

  acknowledgement:
    'I understand that Open1040 is an educational preparation tool only. It is not tax advice, not legal advice, and not a guarantee of accuracy. I have reviewed the calculations and explanations, and I take responsibility for verifying this information before using it for any purpose.',
};

export const ELIGIBILITY_QUESTIONS = [
  {
    id: 'isSingleFiler',
    question: 'Are you filing as a single individual?',
    helpText: 'This means you are unmarried, or legally separated, and do not qualify for another filing status.',
    yesIsEligible: true,
  },
  {
    id: 'onlyW2Income',
    question: 'Did you only earn wages from employers (reported on W-2 forms)?',
    helpText: 'W-2 forms are provided by employers. Simple bank interest is also okay.',
    yesIsEligible: true,
  },
  {
    id: 'hasSelfEmploymentIncome',
    question: 'Did you have any self-employment, freelance, or gig economy income?',
    helpText: 'This includes 1099-NEC income, side businesses, freelancing, rideshare driving, etc.',
    yesIsEligible: false,
  },
  {
    id: 'soldStocksCryptoProperty',
    question: 'Did you sell any stocks, cryptocurrency, or property this year?',
    helpText: 'Any sale of investments or property, even at a loss, is not currently supported.',
    yesIsEligible: false,
  },
  {
    id: 'plansToItemize',
    question: 'Do you plan to itemize your deductions instead of taking the standard deduction?',
    helpText: 'Itemizing means listing individual deductions like mortgage interest, medical expenses, etc.',
    yesIsEligible: false,
  },
  {
    id: 'hasRentalIncome',
    question: 'Do you have income from rental properties?',
    helpText: 'This includes any rent received from property you own.',
    yesIsEligible: false,
  },
  {
    id: 'hasForeignIncome',
    question: 'Do you have foreign income or foreign financial accounts?',
    helpText: 'This includes income earned abroad, foreign bank accounts over $10,000, or FBAR requirements.',
    yesIsEligible: false,
  },
  {
    id: 'hasComplexCredits',
    question: 'Are you claiming any special tax credits (education, adoption, foreign tax, etc.)?',
    helpText: 'Standard credits like the basic withholding credit are handled. Complex credits are not.',
    yesIsEligible: false,
  },
  {
    id: 'hasDependents',
    question: 'Are you claiming any dependents on your return?',
    helpText: 'Children or other qualifying individuals you support financially.',
    yesIsEligible: false,
  },
] as const;

export const SUPPORTED_SCENARIOS = [
  'Single filer',
  'W-2 wage income only',
  'Simple bank interest income (optional)',
  'Standard deduction',
  'Federal return only',
  'Tax year 2025',
];

export const UNSUPPORTED_SCENARIOS = [
  'Married filing jointly/separately',
  'Head of household',
  'Self-employment / 1099-NEC',
  'Capital gains (stocks, crypto, property)',
  'Rental income',
  'Foreign income',
  'Itemized deductions',
  'Dependents',
  'Complex tax credits',
  'State tax returns',
  'E-filing',
  'Prior year amendments',
];

// ---- Legal Entity ----
export const LEGAL_ENTITY = {
  name: 'Brownefield Holdings',
  type: 'Holding Company',
  tagline: 'Systems. Automation. Public-service technology.',
};

// ---- About Page Copy ----
export const ABOUT_COPY = {
  mission: `${APP_NAME} exists because preparing a simple tax return shouldn't cost money. The math is public. The brackets are published by the IRS every year. There is no reason a single filer with one W-2 should pay $50–$200 to learn what they owe or what they're owed.`,

  whyFree: `This tool is free because it's built on a principle: transparency in public systems should be accessible to everyone. There is no upsell. There is no "premium tier." There is no advertising. There is no data harvesting. The source code is open on GitHub for anyone to inspect, audit, or improve.`,

  whoBuiltThis: `${APP_NAME} is built and maintained by ${LEGAL_ENTITY.name}. We focus on systems, automation, and tools that serve real people — not just paying customers.`,

  directFileNote: `The IRS launched its own free filing tool called Direct File for select states. We support that effort. If Direct File is available in your state, it's an excellent option. ${APP_NAME} exists for everyone else — and for anyone who wants to understand their return before they file it, regardless of where they live.`,

  sustainability: `Maintaining accurate tax rules costs time every year. If ${APP_NAME} has helped you, consider supporting the project through GitHub Sponsors. Your support keeps this free for the next person.`,
};

// ---- Year Expiration ----
/**
 * Defines when a tax year's rules should be considered expired.
 * After this date, the app warns users that the rules may be outdated.
 * Format: { [filingYear]: expirationDateISO }
 */
export const YEAR_EXPIRATION: Record<number, string> = {
  2025: '2027-04-15', // After the extended filing deadline for TY2025
};

/**
 * Check if a filing year's rules are still current.
 */
export function isYearExpired(filingYear: number): boolean {
  const expiration = YEAR_EXPIRATION[filingYear];
  if (!expiration) return true; // Unknown year = expired
  return new Date() > new Date(expiration);
}

/**
 * Check if a filing year is approaching expiration (within 60 days).
 */
export function isYearExpiringSoon(filingYear: number): boolean {
  const expiration = YEAR_EXPIRATION[filingYear];
  if (!expiration) return false;
  const expirationDate = new Date(expiration);
  const warningDate = new Date(expirationDate);
  warningDate.setDate(warningDate.getDate() - 60);
  return new Date() > warningDate && new Date() <= expirationDate;
}

// ---- Terms of Service ----
export const TERMS_OF_SERVICE = `Terms of Use — ${APP_NAME}

Last updated: 2025

${APP_NAME} is provided by ${LEGAL_ENTITY.name} as a free, open-source educational tool.

1. NOT TAX ADVICE. ${APP_NAME} is not a tax preparation service, tax advisor, or legal advisor. It provides estimates for educational purposes only. You are responsible for verifying all information before using it for any purpose.

2. NO WARRANTY. This tool is provided "as is" without warranty of any kind. ${LEGAL_ENTITY.name} makes no guarantees about the accuracy, reliability, or completeness of any calculation.

3. NO FILING. ${APP_NAME} does not file tax returns with the IRS or any state agency. To file your return, use IRS Free File, a licensed tax preparer, or mail a paper return.

4. YOUR DATA. In the current version, all data stays in your browser and is not transmitted to any server (unless you explicitly opt in to the AI-powered W-2 reader). No personal information is stored after you close your browser.

5. LIMITATION OF LIABILITY. ${LEGAL_ENTITY.name} and its contributors shall not be liable for any damages arising from the use of this tool, including but not limited to errors in tax calculations, missed deductions, or penalties from the IRS.

6. OPEN SOURCE. The source code is available under the MIT License. You may inspect, copy, modify, and distribute it under the terms of that license.

By using ${APP_NAME}, you agree to these terms.`;

