// ============================================================
// Open1040 — Utility Helpers
// ============================================================

/** Format number as USD currency string */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** Format as percentage */
export function formatPercent(rate: number): string {
  return `${(rate * 100).toFixed(2)}%`;
}

/** Classname merge helper (simple version) */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

/** Generate a simple unique ID */
export function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
