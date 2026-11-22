import { describe, it, expect } from 'vitest';
import { nextGetDeadlines, getDeadlinesForYears } from '@/lib/hawaiiGet';

const ymd = (d: Date) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

describe('Hawaii GET deadlines', () => {
  it('semiannual: Jan–Jun due Jul 20, Jul–Dec due Jan 20 next year', () => {
    const all = getDeadlinesForYears('semiannual', 2026, 2026);
    const g45 = all.filter((d) => d.form === 'G-45').map((d) => ymd(d.due));
    expect(g45).toEqual(['2026-7-20', '2027-1-20']);
  });

  it('annual G-49 is due April 20 of the next year', () => {
    const g49 = getDeadlinesForYears('quarterly', 2026, 2026).find((d) => d.form === 'G-49')!;
    expect(ymd(g49.due)).toBe('2027-4-20');
  });

  it('next deadlines from Nov 21, 2026 for a semiannual filer', () => {
    const next = nextGetDeadlines(new Date(2026, 10, 21), 'semiannual', 3);
    expect(next.map((d) => [d.form, ymd(d.due)])).toEqual([
      ['G-45', '2027-1-20'],
      ['G-49', '2027-4-20'],
      ['G-45', '2027-7-20'],
    ]);
    expect(next[0].label).toBe('Periodic return (G-45) for Jul–Dec 2026');
  });

  it('includes a deadline that falls today', () => {
    const next = nextGetDeadlines(new Date(2027, 0, 20), 'semiannual', 1);
    expect(ymd(next[0].due)).toBe('2027-1-20');
  });

  it('monthly filer: December period is due January 20', () => {
    const next = nextGetDeadlines(new Date(2026, 11, 25), 'monthly', 1);
    expect(next[0].label).toBe('Periodic return (G-45) for Dec 2026');
    expect(ymd(next[0].due)).toBe('2027-1-20');
  });
});
