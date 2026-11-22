import { describe, it, expect } from 'vitest';
import { modeForDate, getSeasonMode } from '@/lib/season';

const d = (m: number, day: number) => new Date(2026, m - 1, day, 12);

describe('modeForDate', () => {
  it('maps the tax calendar to modes', () => {
    expect(modeForDate(d(1, 1))).toBe('organize');
    expect(modeForDate(d(2, 28))).toBe('organize');
    expect(modeForDate(d(3, 1))).toBe('finish');
    expect(modeForDate(d(4, 15))).toBe('finish');
    expect(modeForDate(d(4, 16))).toBe('late');
    expect(modeForDate(d(10, 15))).toBe('late');
    expect(modeForDate(d(10, 16))).toBe('getready');
    expect(modeForDate(d(11, 21))).toBe('getready');
    expect(modeForDate(d(12, 31))).toBe('getready');
  });
});

describe('getSeasonMode', () => {
  it('honors a valid override', () => {
    expect(getSeasonMode(d(11, 21), 'late')).toBe('late');
  });
  it('ignores an invalid override', () => {
    expect(getSeasonMode(d(11, 21), 'bogus')).toBe('getready');
  });
});
