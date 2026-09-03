# Legal documents and the e-signature flow

## What exists

| Document | Where | Status |
|---|---|---|
| Privacy policy | `/privacy` (`privacy.html`) | Draft v1.0, 3 Sep 2026 |
| Terms of service, including the data processing addendum | `/terms` (`terms.html`) | Draft v1.0, 3 Sep 2026 |
| Subscription agreement, signed at onboarding | `/onboarding/sign` (`onboarding/sign.html`) | Draft v1.0, 3 Sep 2026 |

All three are drafts written to be reviewed by a Jordanian lawyer before the first real signature. They are consistent with each other (retention periods, support hours, notice periods, liability cap, governing law) and with what the website claims.

## Before a lawyer sees them

Fill in or confirm:

- RIVET's legal entity name, legal form, commercial registration number and registered address. The documents currently say "RIVET, Amman, Jordan".
- Whether RIVET needs to register or appoint a data protection officer under the Personal Data Protection Law No. 24 of 2023 and its regulations.
- Retention periods in the privacy policy section 09, especially for commercial and tax records.
- Support hours and the availability target (99.5%) in Terms section 10 and Agreement section 07.
- Payment terms (14 days), suspension notice (7 days), renewal notice (30 days), fee-change notice (60 days).
- Whether member ID numbers should be collected by gyms at all, and if so, the wording gyms must show members.

## Arabic versions

Jordanian courts work in Arabic. Ask the lawyer for Arabic versions of all three documents and decide which language prevails (Terms section 18 currently says English unless the law requires otherwise; the lawyer may reverse this). The site structure supports adding `privacy-ar.html`, `terms-ar.html` and an Arabic agreement with `dir="rtl"`.

## How the e-signature works

1. RIVET sends the gym a link: `/onboarding/sign?gym=Legal%20Name&owner=Full%20Name&plan=growth&start=2026-10-01&quote=Q-1042&email=owner@example.com&phone=07...`. Every parameter is optional; the signer can edit any field.
2. The page assigns a reference (`RVT-YYYYMMDD-XXXXX`) and shows the agreement text, version-stamped.
3. The signer fills in the gym's details, the signatory's details including national ID or passport number, the plan and start date, signs (drawn or typed), ticks four declarations, and submits.
4. The browser computes the SHA-256 fingerprint of the exact agreement text it displayed, builds the evidence record below, and POSTs it as JSON to the URL in the form's `data-endpoint` attribute.
5. The form is replaced by the signed record (with the ID masked) and a print button that produces the PDF copy. RIVET countersigns and returns the final copy.

Until `data-endpoint` is set, the page still completes the signing and tells the signer to send the PDF on WhatsApp. Set it before sending real links.

## The evidence record (JSON)

```json
{
  "kind": "rivet-subscription-agreement",
  "version": "1.0 · 3 September 2026",
  "reference": "RVT-20260903-K7M2Q",
  "document": { "url": "https://…/onboarding/sign", "sha256": "…", "characters": 6120 },
  "signedAt": "2026-09-03T11:42:10.000Z",
  "signedAtLocal": "3 September 2026, 14:42",
  "timezone": "Asia/Amman",
  "customer": { "legalName": "", "tradeName": "", "registrationNumber": "", "address": "", "city": "", "branches": "1" },
  "signatory": { "name": "", "title": "Owner", "idType": "national", "idNumber": "", "phone": "", "email": "" },
  "subscription": { "plan": "growth", "startDate": "2026-10-01", "term": "12", "quote": "" },
  "consents": { "agreement": true, "authority": true, "electronic": true, "accurate": true },
  "signature": { "method": "drawn", "image": "data:image/png;base64,…", "typedName": "" },
  "client": { "userAgent": "", "language": "", "viewport": "" }
}
```

## What the endpoint must do

- Accept the POST over HTTPS only; reject anything else.
- Record the caller's IP address and the receipt time server-side (the browser cannot be trusted for either).
- Store the record, the signature PNG and a server-rendered PDF of the agreement text at the stated version, in encrypted storage with access limited to contract admins. Encrypt the ID number field separately.
- Verify the `document.sha256` against the server's own copy of the agreement text for that version; if they differ, flag the signing for review rather than rejecting it silently.
- Email the signer a copy immediately (with the ID masked), and notify RIVET to countersign.
- Keep the agreement text of every published version in the repository; a signed hash is only useful if the text it refers to can be produced later.

## Retention

Signed agreements and their evidence are business records: keep for the life of the agreement plus the period Jordanian commercial and tax law requires (confirm with the lawyer; the privacy policy points to this). Delete the raw ID number once the retention period ends.
