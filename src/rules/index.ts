// ============================================================
// Open1040 — Rules Engine Router
// Resolves the correct year-specific rules module.
// ============================================================

import type { FilingYear, NormalizedReturnData, CalculationResult } from '@/domain/types';
import { calculate2025, STANDARD_DEDUCTION as SD_2025 } from './2025';

export function getStandardDeduction(year: FilingYear, status: string): number {
  switch (year) {
    case 2025:
      return SD_2025[status as keyof typeof SD_2025] ?? 0;
    default:
      throw new Error(`No rules implemented for filing year ${year}`);
  }
}

export function calculateTax(
  year: FilingYear,
  data: NormalizedReturnData
): CalculationResult {
  switch (year) {
    case 2025:
      return calculate2025(data);
    default:
      throw new Error(`No rules implemented for filing year ${year}`);
  }
}

export function isSupportedYear(year: number): year is FilingYear {
  return year === 2025;
}
