# Operational email: the go-live flag

Operational email means the messages the platform sends to gym staff and to RIVET: invoices, signed agreements, daily close summaries, password resets, alerts. Not member messaging (see `messaging-whatsapp-sms.md`) and not marketing.

## The flag

One environment variable, read once at boot:

```
EMAIL_MODE = off | sandbox | allowlist | live
```

| Mode | Behaviour | Where |
|---|---|---|
| `off` | Emails are rendered and logged, never sent. | Tests, local dev by default |
| `sandbox` | Emails are sent to the provider's sandbox or a catch-all inbox (`EMAIL_SANDBOX_TO`), original recipient in the subject. | Staging |
| `allowlist` | Emails are sent only to addresses or domains in `EMAIL_ALLOWLIST`; everything else is logged and dropped. | Production before go-live; internal pilots |
| `live` | Emails are sent to real recipients. | Production after go-live |

Rules:
- Default is `off`. Missing or unrecognised value means `off` and a startup warning.
- The mode is shown on the admin status page and in every email log line.
- Password resets and security alerts are the only category allowed in `allowlist` mode regardless of the list, because a locked-out user cannot wait.
- Every send writes an audit row: message id, template, recipient, mode, provider response.

## Before flipping to `live`

- [ ] Sending domain chosen **[decide: which domain RIVET will send from]** with SPF, DKIM and DMARC (`p=quarantine` at minimum) published and verified
- [ ] Provider account created and API key stored in the secret manager, not in the repo
- [ ] Bounce and complaint webhooks handled: hard bounces mark the address as bad; complaints suppress it
- [ ] Templates reviewed in Arabic and English, with RIVET's contact details and a plain-text version
- [ ] Reply-to routed to a monitored inbox
- [ ] Rate limits configured (invoices batch nightly, alerts immediate)
- [ ] Two weeks in `allowlist` with RIVET staff and one pilot gym, zero unexplained failures
- [ ] Runbook: how to switch back to `allowlist` in under five minutes
