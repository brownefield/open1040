# Security & Privacy Notes — Open1040

## Current Architecture (MVP)

### Data Handling
- **All data stays in-browser.** No server-side persistence, no database, no API calls that transmit PII.
- **Session-only memory.** Closing the browser tab destroys all data.
- **No full SSN collected.** Only the last 4 digits are requested, solely for the user's own reference.
- **No cookies, analytics, or tracking scripts.**

### Sensitive Data Classification
| Field | Sensitivity | Handling |
|-------|------------|----------|
| SSN (last 4) | HIGH | Stored in-memory only. Never logged. |
| Date of birth | HIGH | Stored in-memory only. Never logged. |
| Name | MEDIUM | In-memory only. Redacted in audit events. |
| W-2 wages | MEDIUM | In-memory only. Used for calculation. |
| Employer EIN | LOW | In-memory only. |

### Audit Logging
- Audit events are generated for significant application actions.
- The `redactForAudit()` function strips PII from any data attached to audit events.
- Audit logs exist in-memory only and are not persisted.

## Production Hardening Checklist

Before deploying to production, address the following:

- [ ] HTTPS enforcement (TLS 1.2+ only)
- [ ] Content Security Policy (CSP) headers
- [ ] X-Frame-Options / X-Content-Type-Options headers
- [ ] Rate limiting on any server-side endpoints
- [ ] Input sanitization review (XSS prevention)
- [ ] Dependency vulnerability audit (`npm audit`)
- [ ] WCAG 2.1 AA accessibility compliance
- [ ] Penetration testing
- [ ] Privacy policy page
- [ ] Terms of service page
- [ ] Cookie consent (if any cookies are added later)
- [ ] Secure build pipeline (CI/CD with signed artifacts)
- [ ] Error boundary implementation (no raw stack traces exposed)

## If Server-Side Persistence Is Added Later

- Encrypt PII at rest (AES-256 or equivalent)
- Encrypt PII in transit (TLS only)
- Implement data retention policies with automatic deletion
- Add user consent flow before storing any data
- Document data flows in a privacy impact assessment
- Consider SOC 2 Type II compliance if handling tax data at scale
- Never log raw PII to server logs

## Threat Model (High-Level)

| Threat | Mitigation |
|--------|-----------|
| XSS injection | Input validation via Zod; React's built-in escaping |
| CSRF | No server-side state changes in MVP |
| Data exfiltration | No server storage; no external API calls |
| Man-in-the-middle | HTTPS enforcement (production) |
| Malicious dependencies | Regular `npm audit`; minimal dependency tree |
| Social engineering | Clear disclaimers; no "official IRS" language |

## Responsible Disclosure

If you discover a security vulnerability, please email security@[your-domain].com with a description. Do not open a public issue.
