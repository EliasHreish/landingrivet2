# WhatsApp and SMS reminders: provider, templates, quiet hours

Status: reminders run in the sandbox. This document is what has to be decided and done before they go live for real gyms. Owner: RIVET product. Decisions marked **[decide]** need a sign-off.

## 1. What we send

Operational messages on behalf of a gym, to that gym's own members. Four families:

| Family | Trigger | Channel | Category (Meta) |
|---|---|---|---|
| Renewal reminder | Membership ends in 7 days, 3 days, today, and 3 days after expiry | WhatsApp, SMS fallback | Utility |
| Payment reminder | Installment or balance due in 3 days, today, and 3 days overdue | WhatsApp, SMS fallback | Utility |
| Booking confirmation | Class booked, cancelled, or waitlist promoted | WhatsApp only | Utility |
| Gym notice | Opening hours change, Ramadan schedule, closure | WhatsApp, SMS fallback | Utility |

Marketing broadcasts (offers, referral pushes) are a separate feature with separate consent, out of scope for this go-live.

## 2. Provider

Constraints that matter in Jordan:

- WhatsApp is the channel members actually read. Reminders must work there first.
- SMS in Jordan needs a registered alphanumeric sender ID with the local operators (Zain, Orange, Umniah); unregistered or international routes get filtered or arrive as a random number. Sender ID registration is done through a local or regional aggregator and takes days to weeks.
- Costs are per message (SMS) or per 24-hour conversation (WhatsApp, utility category). Utility conversations are cheaper than marketing ones; keep templates in the utility category.

Options:

| Option | WhatsApp | SMS in Jordan | Notes |
|---|---|---|---|
| Meta WhatsApp Cloud API, direct | Yes, no BSP markup | No | Cheapest WhatsApp. Needs Meta Business verification for RIVET, one WhatsApp Business Account, one phone number per sender (RIVET's number, or the gym's if the gym wants its own name). |
| Unifonic | Yes (BSP) | Yes, regional aggregator with Jordan routes and sender ID registration | One vendor for both channels; MENA support in Arabic; used widely in the Gulf and Jordan. |
| Infobip | Yes (BSP) | Yes, with local sender ID registration | Strong delivery reporting; larger contracts. |
| Twilio | Yes (BSP) | International routes only; sender ID support for Jordan is limited | Easy API, weaker Jordan SMS delivery. |

**Recommendation:** WhatsApp through the Meta Cloud API directly, with SMS fallback through Unifonic (or Infobip if Unifonic's Jordan pricing is worse). Abstract both behind one `MessageProvider` interface in the app so a provider can be swapped without touching reminder logic.

**[decide]** One RIVET sender ("RIVET for Gold's Gym") vs. each gym registering its own WhatsApp number. Recommendation: one RIVET sender at launch, per-gym senders as a Pro option later. Every template names the gym in the first line either way.

## 3. Template catalogue

Every template exists in Arabic and English; the member's language preference decides which is sent (default Arabic). Variables in `{{n}}` order per Meta's rules. Each utility template ends with the opt-out line.

Opt-out line, EN: `Reply STOP to stop reminders from {{gym}}.`
Opt-out line, AR: `للتوقف عن استلام التذكيرات من {{gym}} أرسل إيقاف.`

### renewal_7d
EN: `{{gym}}: Hi {{name}}, your membership ends on {{date}}. Renew at the front desk or reply RENEW and we'll call you. {{opt_out}}`
AR: `{{gym}}: مرحباً {{name}}، ينتهي اشتراكك بتاريخ {{date}}. جدّد على الاستقبال أو أرسل تجديد لنتواصل معك. {{opt_out}}`

### renewal_today
EN: `{{gym}}: Hi {{name}}, your membership ends today. Renew today to keep your access without a break. {{opt_out}}`
AR: `{{gym}}: مرحباً {{name}}، ينتهي اشتراكك اليوم. جدّد اليوم للاستمرار بدون انقطاع. {{opt_out}}`

### renewal_lapsed_3d
EN: `{{gym}}: Hi {{name}}, your membership ended on {{date}}. Your place is still here when you're ready. {{opt_out}}`
AR: `{{gym}}: مرحباً {{name}}، انتهى اشتراكك بتاريخ {{date}}. مكانك محفوظ عند جهوزيتك. {{opt_out}}`

### payment_due_3d
EN: `{{gym}}: Hi {{name}}, a payment of JOD {{amount}} is due on {{date}}. You can pay at the desk or by CliQ. {{opt_out}}`
AR: `{{gym}}: مرحباً {{name}}، دفعة بقيمة {{amount}} دينار مستحقة بتاريخ {{date}}. يمكنك الدفع على الاستقبال أو عبر كليك. {{opt_out}}`

### payment_overdue_3d
EN: `{{gym}}: Hi {{name}}, a payment of JOD {{amount}} was due on {{date}}. Please settle it at the desk to keep your access. {{opt_out}}`
AR: `{{gym}}: مرحباً {{name}}، دفعة بقيمة {{amount}} دينار كانت مستحقة بتاريخ {{date}}. يرجى تسديدها على الاستقبال للحفاظ على دخولك. {{opt_out}}`

### booking_confirmed
EN: `{{gym}}: {{name}}, you're booked for {{class}} on {{date}} at {{time}} with {{coach}}. Reply CANCEL if you can't make it.`
AR: `{{gym}}: {{name}}، تم حجزك في {{class}} يوم {{date}} الساعة {{time}} مع {{coach}}. أرسل إلغاء إذا لم تتمكن من الحضور.`

### booking_cancelled
EN: `{{gym}}: {{name}}, your booking for {{class}} on {{date}} at {{time}} is cancelled.`
AR: `{{gym}}: {{name}}، تم إلغاء حجزك في {{class}} يوم {{date}} الساعة {{time}}.`

### gym_notice
EN: `{{gym}}: {{message}} {{opt_out}}`
AR: `{{gym}}: {{message}} {{opt_out}}`

Notes:
- Amounts in JOD with three decimals where fils matter (`45.000`); dates in `d MMMM` in the member's language.
- Submit each template to Meta in both languages; approval takes hours to days. Keep the approved names in config, not in code.
- SMS versions are the same text without formatting, kept under 160 GSM characters or 70 Arabic characters per segment where possible; Arabic reminders will usually be two segments, which is fine.

## 4. Quiet hours and sending rules

Defaults per gym, editable in gym settings:

- **Quiet hours:** no reminders between 21:00 and 09:00 Amman time. Messages scheduled inside the window are queued and sent at 09:00.
- **Friday:** nothing between 11:30 and 13:30.
- **Ramadan profile** (switched on by the gym for the month): quiet window becomes 16:00 to 20:30 and 02:00 to 10:00; renewals and payment reminders go out 20:30 to 23:30 when gyms are busy anyway.
- **Booking confirmations** bypass quiet hours only when the member triggered the booking themselves in the last five minutes.
- **Frequency cap:** at most one reminder per member per day, and at most three per week, across all families. Booking confirmations are exempt.
- **Opt-out:** `STOP` or `إيقاف` (and common variants) on either channel marks the member as opted out of reminders for that gym; the gym sees it on the member record and cannot override it from the UI. Booking confirmations continue, because the member asked for them.
- **Fallback:** if WhatsApp fails (no account, undelivered after 6 hours), send the SMS version once. Never send both.
- **Retries:** provider errors retry three times with backoff; template rejections do not retry and raise an alert.

## 5. Sandbox to production

The app already has a `MESSAGING_MODE` of `sandbox`. Production is gated on the checklist below.

- [ ] Meta Business verification for RIVET completed
- [ ] WhatsApp Business Account created; display name "RIVET" approved; phone number registered
- [ ] All templates above approved in AR and EN; names recorded in config
- [ ] SMS provider contract signed **[decide: Unifonic vs Infobip]**; sender ID `RIVET` registered with Zain, Orange and Umniah
- [ ] `MessageProvider` implemented for both providers with delivery webhooks
- [ ] Quiet hours, frequency cap and opt-out enforced in the scheduler, with tests
- [ ] Cost controls: per-gym monthly message budget with alerts at 80% and hard stop at 120% **[decide: included messages per plan vs. pass-through]**
- [ ] Monitoring: delivery rate per provider, failures by error code, daily volume
- [ ] Privacy policy section 06 matches the rules above (it does today)
- [ ] `MESSAGING_MODE=production` set per environment, never in code
- [ ] Pilot with two gyms for two weeks before enabling for all
