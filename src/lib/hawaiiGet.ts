/**
 * Hawaii General Excise Tax (GET) filing calendar — deterministic, no advice.
 *
 * Source (verified 2026-11-21): Hawaii Department of Taxation GET information page
 * (tax.hawaii.gov). Periodic returns (Form G-45) are due on the 20th day of the month
 * after the filing period ends; the annual return (Form G-49) is due on the 20th day
 * of the 4th month after the tax year closes (April 20 for calendar-year filers).
 * A return is required every period, even with $0 income.
 *
 * Due dates that land on a weekend or state holiday may move to the next business day —
 * the UI tells people to confirm exact dates in Hawaii Tax Online.
 */

export type GetFrequency = 'monthly' | 'quarterly' | 'semiannual';

export interface GetDeadline {
  form: 'G-45' | 'G-49';
  label: string;
  due: Date;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Period-end months (0-indexed) for each filing frequency. */
const PERIOD_END_MONTHS: Record<GetFrequency, number[]> = {
  monthly: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  quarterly: [2, 5, 8, 11],
  semiannual: [5, 11],
};

const PERIOD_LENGTH: Record<GetFrequency, number> = { monthly: 1, quarterly: 3, semiannual: 6 };

function periodLabel(freq: GetFrequency, year: number, endMonth: number): string {
  const startMonth = endMonth - PERIOD_LENGTH[freq] + 1;
  if (startMonth === endMonth) return `${MONTHS[endMonth]} ${year}`;
  return `${MONTHS[startMonth]}–${MONTHS[endMonth]} ${year}`;
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Every GET deadline for tax years `fromYear`..`toYear`, unsorted. */
export function getDeadlinesForYears(
  freq: GetFrequency,
  fromYear: number,
  toYear: number
): GetDeadline[] {
  const out: GetDeadline[] = [];
  for (let y = fromYear; y <= toYear; y++) {
    for (const m of PERIOD_END_MONTHS[freq]) {
      out.push({
        form: 'G-45',
        label: `Periodic return (G-45) for ${periodLabel(freq, y, m)}`,
        due: new Date(y, m + 1, 20), // JS rolls month 12 into January of next year
      });
    }
    out.push({ form: 'G-49', label: `Annual return (G-49) for ${y}`, due: new Date(y + 1, 3, 20) });
  }
  return out;
}

/** The next `count` GET deadlines on or after `today`. */
export function nextGetDeadlines(today: Date, freq: GetFrequency, count = 3): GetDeadline[] {
  const t = startOfDay(today);
  return getDeadlinesForYears(freq, t.getFullYear() - 1, t.getFullYear() + 1)
    .filter((d) => d.due >= t)
    .sort((a, b) => a.due.getTime() - b.due.getTime())
    .slice(0, count);
}

export function formatDue(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
