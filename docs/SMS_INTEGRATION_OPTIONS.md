# SMS Integration Options

Options for implementing the **SMS Notifications** capabilities from the [Competitive Features Analysis](../COMPETITIVE_FEATURES_ANALYSIS.md) (Section 5):

- SMS booking confirmations  
- SMS trip reminders (24 hours, 1 hour before)  
- SMS driver assignment notifications  
- SMS "Driver En Route" / "Driver Arrived" / completion  
- SMS payment receipts  
- **Two-way SMS** for customer support  
- **SMS opt-in/opt-out** (TCPA compliance)

---

## Summary Table

| Provider | Two-Way SMS | Outbound Est. (US) | Inbound | AWS Native | Good For |
|----------|-------------|--------------------|---------|------------|----------|
| **AWS SNS** | ❌ No | ~$0.006/msg | N/A | ✅ Yes | One-way only, lowest cost, already on AWS |
| **AWS Pinpoint / End User Messaging** | ✅ Yes | ~$0.006–0.01/msg | ✅ Yes | ✅ Yes | Two-way, stays in AWS |
| **Twilio** | ✅ Yes | ~$0.0075/msg | ✅ Yes | ❌ No | Two-way, best docs, industry standard |
| **Telnyx** | ✅ Yes | ~$0.004/part + fees | ✅ Yes | ❌ No | Two-way, low cost, dev-friendly |
| **Plivo** | ✅ Yes | ~$0.007/msg | ✅ Yes | ❌ No | Two-way, low cost |
| **Vonage (Nexmo)** | ✅ Yes | ~$0.0075/msg | ✅ Yes | ❌ No | Two-way, solid API |
| **MessageBird** | ✅ Yes | ~$0.007/msg | ✅ Yes | ❌ No | Two-way, strong internationally |

*Rough US pricing; carrier/10DLC fees apply for all. Check each provider for current rates.*

---

## 1. AWS Options

### A. **AWS SNS (Simple Notification Service)**  
**Best for: one-way transactional SMS only**

- **Two-way SMS:** ❌ No inbound. SNS is outbound-only.
- **Pricing:** ~$0.0058–0.0065/SMS in US (varies by destination + origination: long code, toll-free, short code).
- **Pros:**
  - Already in your stack; no new vendor.
  - Integrates directly with Lambda, EventBridge, Amplify.
  - Pay per message, no monthly minimum.
  - Good for: booking confirmations, reminders, driver-assigned, en-route, arrived, completion, payment receipts.
- **Cons:**
  - Cannot support **two-way SMS** or **in-app style “reply to support”**.
- **Compliance:** You handle opt-in/opt-out and 10DLC in your app; SNS does not provide built-in consent management.

**Use when:** You are okay with one-way only and want to stay 100% on AWS with the lowest cost.

---

### B. **AWS Pinpoint / AWS End User Messaging**  
**Best for: two-way SMS and staying on AWS**

- **Two-way SMS:** ✅ Yes. Inbound messages can be delivered to SNS → Lambda for handling.
- **Pricing:** Similar to SNS for outbound; inbound has its own pricing. See [End User Messaging pricing](https://aws.amazon.com/end-user-messaging/pricing/).
- **Pros:**
  - Two-way SMS, templates, delivery receipts.
  - Same AWS account, IAM, and region as Amplify/Lambda.
  - SMS/voice/OTP continue under **AWS End User Messaging**; Pinpoint’s *engagement* features (campaigns, journeys) are being retired by Oct 2026, but **SMS APIs stay**.
- **Cons:**
  - More setup than SNS (phone number provisioning, two-way config, SNS topic + Lambda for inbound).
  - You still build opt-in/opt-out and 10DLC workflows yourself.

**Use when:** You need two-way SMS and want to keep everything on AWS.

---

## 2. Non‑AWS Options (Work with Lambda/Amplify)

All of these work by calling their REST APIs from **Lambda** or an **Amplify/AppSync** backend. Never put API keys in the frontend.

---

### A. **Twilio**  
**Best for: full feature set and two-way, with great docs**

- **Two-way SMS:** ✅ Yes. Inbound webhooks to your API/Lambda.
- **Pricing:** ~$0.0075/SMS US outbound; inbound often included or low cost. [Twilio pricing](https://www.twilio.com/sms/pricing).
- **Pros:**
  - Industry standard; excellent docs, SDKs, and support.
  - Two-way, opt-in/opt-out workflows, and “reply STOP to opt out” are well documented.
  - Messaging Insights (delivery status, errors).
  - Phone number management, toll-free, short codes, 10DLC.
- **Cons:**
  - Slightly higher per-message cost than SNS or Telnyx.
  - External vendor (data leaves AWS, but you control what you send).

**Integration:** Lambda (or API route) with `twilio` SDK; store `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN` in SSM/Secrets Manager.

---

### B. **Telnyx**  
**Best for: low cost and two-way, with a clear API**

- **Two-way SMS:** ✅ Yes. Webhooks for inbound and delivery status.
- **Pricing:** ~$0.004/message part + carrier fees; often 30–50% cheaper than Twilio at scale. [Telnyx messaging pricing](https://telnyx.com/pricing/messaging).
- **Pros:**
  - Very competitive US and international pricing.
  - Two-way, webhooks, good for automation and support flows.
  - Developer-focused; works well from Lambda/Node.
- **Cons:**
  - Smaller ecosystem than Twilio; fewer third-party integrations.

**Integration:** Lambda calling Telnyx REST API; store API key in SSM/Secrets Manager.

---

### C. **Plivo**  
**Best for: low-cost two-way with straightforward API**

- **Two-way SMS:** ✅ Yes. Inbound via webhook to your endpoint.
- **Pricing:** ~$0.007/SMS US (with carrier fees). [Plivo SMS pricing](https://www.plivo.com/sms/pricing/).
- **Pros:**
  - Simple HTTP API; easy to call from Lambda.
  - Two-way, number provisioning, 10DLC support.
- **Cons:**
  - Fewer extras (e.g., ready-made opt-out helpers) than Twilio.

**Integration:** Lambda + `plivo` SDK or raw `https`; credentials in SSM/Secrets Manager.

---

### D. **Vonage (Nexmo)**  
**Best for: proven API and global coverage**

- **Two-way SMS:** ✅ Yes. Inbound via webhook.
- **Pricing:** ~$0.0075/SMS US. [Vonage pricing](https://www.vonage.com/communications-apis/sms/pricing/).
- **Pros:**
  - Mature, widely used; good international coverage.
  - Two-way and number management.
- **Cons:**
  - Pricing in line with Twilio; no strong cost advantage.

**Integration:** Lambda + `@vonage/server-sdk` or REST; API key/secret in SSM/Secrets Manager.

---

### E. **MessageBird**  
**Best for: international and regional routes**

- **Two-way SMS:** ✅ Yes. Inbound and flows for support.
- **Pricing:** ~$0.007/SMS US; often better in EU and other regions. [MessageBird pricing](https://messagebird.com/pricing).
- **Pros:**
  - Strong outside US; good if you plan EU or other expansion.
  - Two-way, Conversations API for threaded messaging.
- **Cons:**
  - US pricing similar to Twilio/Plivo.

**Integration:** Lambda + MessageBird REST API; API key in SSM/Secrets Manager.

---

## 3. Compliance (TCPA / 10DLC) – All Providers

For **US** A2P (application-to-person) SMS:

- **10DLC:** Sending from a 10‑digit long code in the US generally requires:
  - Brand registration
  - Campaign registration  
  Fees and timing vary by provider; all major ones (AWS, Twilio, Telnyx, Plivo, Vonage, MessageBird) support 10DLC.
- **Opt-in / opt-out:** The competitive analysis requires “SMS opt-in/opt-out.” All providers give you the *mechanism* (inbound webhooks, your database); you must:
  - Store consent and opt-out in your DB.
  - Honor STOP/UNSTOP (and similar) and support keywords.
  - Not market to users who have opted out.

This is the same whether you use AWS or a third-party; the provider does not replace your consent logic.

---

## 4. Recommended Paths

### Path A: **One-way only, lowest cost, stay on AWS**  
→ **AWS SNS**  
- Fits: booking confirmations, trip reminders, driver-assigned, en-route, arrived, completion, payment receipts.  
- Does **not** fit: two-way support, “reply to this number” flows.

### Path B: **Two-way SMS and stay on AWS**  
→ **AWS Pinpoint / AWS End User Messaging**  
- Use SendTextMessage (and eventually v2 APIs as recommended by AWS).  
- Provision a number, set up SNS topic + Lambda for inbound, and implement opt-in/opt-out in your data model and logic.

### Path C: **Two-way SMS, best DX and flexibility**  
→ **Twilio**  
- Easiest to implement two-way, webhooks, and status callbacks.  
- Slightly higher cost; worth it if you want the most polished integration and documentation.

### Path D: **Two-way SMS, lowest cost off‑AWS**  
→ **Telnyx**  
- Cheaper than Twilio at similar capabilities; good if volume will grow and cost matters.

---

## 5. Architecture (Applies to All)

- **Backend-only:** All SMS sends (and inbound handling) in **Lambda** or an **Amplify/AppSync** backend. Frontend never has provider API keys.
- **Store secrets:** `TWILIO_*`, `TELNYX_*`, etc. in **AWS SSM Parameter Store** or **Secrets Manager**; pass into Lambda via env.
- **Opt-in/opt-out:** New fields on `Customer` (and/or `Driver`): e.g. `smsOptIn: Boolean`, `smsOptOutAt: DateTime`. Update from:
  - In-app toggles.
  - Inbound webhook when user texts STOP/UNSUBSCRIBE (and UNSTOP if you support it).
- **Templates:** Keep copy in your code or DB; pass into provider’s API (all support parameterized messages).
- **Idempotency:** For important sends (e.g. booking confirmation), use a `messageId` or idempotency key to avoid duplicates on retries.

---

## 6. References

- [COMPETITIVE_FEATURES_ANALYSIS.md](../COMPETITIVE_FEATURES_ANALYSIS.md) – Section 5 (SMS), Technical Considerations (SNS/Twilio, TCPA).
- [DAILY_ASSIGNMENT_EMAILS.md](../DAILY_ASSIGNMENT_EMAILS.md) – Current SMS (mailto/sms:) and “Production SMS Options” (SNS, Twilio, etc.).
- [AWS SNS SMS](https://docs.aws.amazon.com/sns/latest/dg/sms_publish-to-phone.html)
- [AWS End User Messaging SMS](https://aws.amazon.com/end-user-messaging/sms/)
- [AWS End User Messaging SMS – Setup Guide](./AWS_END_USER_MESSAGING_SMS_SETUP.md) (step-by-step for this app)
- [Twilio SMS](https://www.twilio.com/docs/sms)
- [Telnyx Messaging](https://developers.telnyx.com/docs/messaging)
