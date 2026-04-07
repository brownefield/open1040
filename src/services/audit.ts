// ============================================================
// Open1040 — Audit Service
// Creates structured audit events for every significant action.
// In MVP, these are kept in-memory. Future: persist to secure log.
// ============================================================

import type { AuditEvent, AuditEventType } from '@/domain/types';

let counter = 0;

function generateId(): string {
  counter += 1;
  return `audit_${Date.now()}_${counter}`;
}

export function createAuditEvent(
  type: AuditEventType,
  message: string,
  data?: Record<string, unknown>
): AuditEvent {
  return {
    id: generateId(),
    type,
    timestamp: new Date().toISOString(),
    message,
    data,
  };
}

/**
 * Helper to redact sensitive fields before logging.
 * Never log raw PII in audit events.
 */
export function redactForAudit(obj: Record<string, unknown>): Record<string, unknown> {
  const redacted = { ...obj };
  const sensitiveKeys = ['ssnLast4', 'ssn', 'dateOfBirth', 'dob'];

  for (const key of sensitiveKeys) {
    if (key in redacted) {
      redacted[key] = '[REDACTED]';
    }
  }

  return redacted;
}
