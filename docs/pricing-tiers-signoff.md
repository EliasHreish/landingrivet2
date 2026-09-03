# Pricing tiers: sign-off sheet

Starter, Growth and Pro are live in the product as tier names and feature gates, but the numbers and limits are provisional. The website now shows the three tiers with "Pricing shared at your walkthrough" in place of a price. Nothing goes public until this sheet is signed.

## What the website says today

| | Starter | Growth | Pro |
|---|---|---|---|
| Positioning | One desk, straight records | The whole stack, one branch | Every branch, one owner view |
| Modules | Sales, Memberships, Payments, Reception | All six | All six |
| Branches | 1 | 1 | Multiple |
| Staff accounts | up to 3 | unlimited | unlimited |
| Reminders (WhatsApp/SMS) | no | yes | yes |
| Reports | daily close | owner reports | cross-branch reports |
| Roles and permissions | basic | basic | per branch and per job |
| Support | WhatsApp, working hours | WhatsApp, 7 days | named contact, on-site onboarding |

If any row is wrong, change `index.html` (section `#plans`) and this table together.

## Decisions needed

| # | Decision | Options | Recommendation |
|---|---|---|---|
| 1 | Monthly price per tier (JOD, ex tax) | | Anchor Growth as the default; Starter at roughly 55–60% of Growth; Pro as a base plus per-branch |
| 2 | Yearly price | 10 or 12 months for the price of 12 | Two months free on yearly; it funds onboarding |
| 3 | Pro: per-branch pricing | flat vs. base + per branch | Base + per branch after the second |
| 4 | Setup / onboarding fee | none, flat, waived on yearly | Waived on yearly, flat on monthly |
| 5 | Messages | included allowance per tier vs. pass-through at cost | Included allowance (e.g. 500/1,500 per month) then pass-through |
| 6 | Trial | none, 14 days, first month free | 14-day trial on Growth only, card or CliQ on file |
| 7 | Tax | show ex-tax (B2B norm) | Ex-tax, "sales tax added" note stays |
| 8 | Payment methods for RIVET's invoices | bank transfer, CliQ, card, cash | All four; cash only against a receipt in the platform |
| 9 | Staff account limit on Starter | 3 vs 5 | 3 |
| 10 | Support hours | as published | 09:00–21:00 Sat–Thu Amman time, matches Terms of service section 10 |

## Where the numbers live

- `index.html`, each `.plan__price` has `data-price=""` and `data-period="per month"`. Put the number in `data-price` (for example `data-price="89"`) and the page renders `JOD 89 per month`. Leave empty to keep "Pricing shared at your walkthrough".
- `terms.html` section 05 and the subscription agreement section 02 refer to the written quote for fees; they do not need editing when prices change.

## Sign-off

| Role | Name | Date | Signature |
|---|---|---|---|
| Founder | | | |
| Sales | | | |
| Finance | | | |
