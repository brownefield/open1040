/**
 * TaxClarity seasonal product modes (see docs/TAXCLARITY_2027_BUILD_SPEC.md §7).
 *
 * The homepage emphasis shifts with the tax calendar. Mode is derived from
 * the date, with a manual override via NEXT_PUBLIC_TC_MODE for staging/previews.
 *
 *   Jan 1  – Feb 28/29  → organize
 *   Mar 1  – Apr 15     → finish
 *   Apr 16 – Oct 15     → late
 *   Oct 16 – Dec 31     → getready   (spec's "Plan" + "Get Ready" windows; 365 not built yet)
 */

export type SeasonMode = 'getready' | 'organize' | 'finish' | 'late';

export const SEASON_MODES: readonly SeasonMode[] = ['getready', 'organize', 'finish', 'late'];

export interface SeasonCopy {
  label: string;
  headline: string;
  body: string;
}

export const SEASON_COPY: Record<SeasonMode, SeasonCopy> = {
  getready: {
    label: 'Get ready',
    headline: 'Tax season is coming.',
    body: 'Check what you’ll need now, while it’s calm — so January is a checklist, not a scramble.',
  },
  organize: {
    label: 'Organize',
    headline: 'What are you still waiting for?',
    body: 'Forms arrive in waves. Track what’s in, what’s missing, and who to ask.',
  },
  finish: {
    label: 'Finish',
    headline: 'Are you ready to file?',
    body: 'Check for gaps before you hand things off to your software or your preparer.',
  },
  late: {
    label: 'Late or extended',
    headline: 'Missed Tax Day? You still have options.',
    body: 'Sort out what’s filed, what’s paid, and what’s still open — one step at a time.',
  },
};

function isSeasonMode(value: unknown): value is SeasonMode {
  return typeof value === 'string' && (SEASON_MODES as readonly string[]).includes(value);
}

/** Pure date → mode mapping. Month is 0-indexed (JS Date). */
export function modeForDate(date: Date): SeasonMode {
  const month = date.getMonth();
  const day = date.getDate();

  if (month <= 1) return 'organize'; // Jan, Feb
  if (month === 2 || (month === 3 && day <= 15)) return 'finish'; // Mar 1 – Apr 15
  if (month < 9 || (month === 9 && day <= 15)) return 'late'; // Apr 16 – Oct 15
  return 'getready'; // Oct 16 – Dec 31
}

/** Current mode, honoring NEXT_PUBLIC_TC_MODE when set to a valid mode. */
export function getSeasonMode(now: Date = new Date(), override?: string): SeasonMode {
  const forced = override ?? process.env.NEXT_PUBLIC_TC_MODE;
  if (isSeasonMode(forced)) return forced;
  return modeForDate(now);
}
