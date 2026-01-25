# AWS End User Messaging SMS – Setup Guide

Step-by-step instructions to set up SMS using **AWS End User Messaging** (SMS and Voice v2 API) for the Onyx Transportation App. This supports one-way SMS (confirmations, reminders, driver alerts) and, with a two-way number, reply handling for customer support.

> **Paused** – Further SMS setup (10DLC campaign, requesting a number, production, wiring `ORIGINATION_IDENTITY`) is on hold until **US 10DLC brand registration** (`US_TEN_DLC_BRAND_REGISTRATION`) is approved. The `sendSms` Lambda and this guide are ready to resume once that is complete.

---

## Overview

| What | Details |
|------|---------|
| **Service** | AWS End User Messaging (SMS and Voice v2); API/CLI name: `pinpoint-sms-voice-v2` |
| **Console** | https://console.aws.amazon.com/sms-voice/ |
| **Region** | Use one region (e.g. `us-east-1`) for pools, config sets, and numbers |
| **Sandbox** | New accounts start in sandbox; you can only send to verified destinations or simulator numbers until you request production |

---

## Part 1: First-Time Setup (Sandbox Testing)

### Step 1.1 – Create a pool

1. Open: https://console.aws.amazon.com/sms-voice/
2. In the left **Overview** → **Quick start**, click **Create pool**.
3. **Pool name**: e.g. `onyx-sms-pool`.
4. **Origination identity**:
   - **For testing**: choose **Phone number** → **Request simulator number** → select **Country** (e.g. United States) → **Request number**.
   - Simulator numbers can only send to other simulator destination numbers; they do not use the real carrier network.
5. Click **Create phone pool**.

---

### Step 1.2 – Create a configuration set

Configuration sets route events (delivery, failures, etc.) to CloudWatch, SNS, or Firehose.

1. In **Overview** → **Quick start**, click **Create set**.
2. **Configuration set name**: e.g. `onyx-sms-config`.
3. **Event destination**:
   - **Set up CloudFormation (Recommended)**:  
     - **Event destination name**: e.g. `onyx-sms-events`.  
     - Click **Launch stack** → in the new tab, accept and **Create stack**.  
     - Wait until the stack status is **CREATE_COMPLETE** (a few minutes).  
     - Back on the config set page, when it shows **Stack created**, click **Create**.
   - **Or** **Setup event destination** and choose CloudWatch, Firehose, or SNS and the event types (e.g. **All SMS events (Recommended)**).
4. Click **Create configuration set**.

---

### Step 1.3 – Create a protect configuration

Protect configurations control which countries you can send to (block, filter, or allow).

1. In **Overview** → **Quick start**, click **Create configuration**.
2. **Protect configuration name**: e.g. `onyx-sms-protect`.
3. **Country rules**: For each country:
   - **Block**: Do not send (e.g. countries you don’t serve).
   - **Filter**: Apply extra checks (e.g. high-cost or high‑risk countries).
   - **Allow**: No filter.
   - For testing, ensure the destination country (e.g. United States) is **not** blocked.
4. **Protect configuration associates**:
   - **Association type**: **Configuration set association**.
   - **Configuration sets**: Select the set from Step 1.2 (e.g. `onyx-sms-config`).
5. Click **Create configuration**.

---

### Step 1.4 – Send a test message (sandbox)

1. In **Overview** → **Quick start**, click **Test SMS sending**.
2. **Originator**:
   - Type: **Phone pool** (or **Phone number** / **Sender ID** if you prefer).
   - Select the pool or number from Step 1.1.
   - If needed: **Request simulator number** for your country.
3. **Destination number**:
   - **Simulator number**: Pick a simulator destination in the same country as the originator.
   - **Or Verified number**: Only after you add and verify a real destination (see **Step 1.5** below).
4. **Configuration set**: e.g. `onyx-sms-config`.
5. **Message body**: e.g. `Test from Onyx Transportation.`
6. Click **Send test message**.
7. In **Event logs: CloudWatch**, refresh after ~10 seconds to see delivery/failure events.

---

### Step 1.5 – Add verified destination numbers (sandbox only)

In sandbox, to send to **real** phones you must verify each destination (up to 10 per account).

**Using the console**

1. In **Test SMS sending**, under **Destination number** → **Manage verified destination number** → **Verify new number**.
2. **Destination phone number**: E.164, e.g. `+12065550142` (no spaces, dashes, or parentheses).
3. **Send verification code** → enter the code on the device → **Verify number**.

**Using the AWS CLI**

```bash
# 1. Create the verified destination
aws pinpoint-sms-voice-v2 create-verified-destination-number \
  --destination-phone-number +12065550142

# Note the VerifiedDestinationNumberId from the output.

# 2. Send verification code (TEXT or VOICE)
aws pinpoint-sms-voice-v2 send-destination-number-verification-code \
  --verified-destination-number-id <VerifiedDestinationNumberId> \
  --verification-channel TEXT

# 3. Verify with the code received on the device
aws pinpoint-sms-voice-v2 verify-destination-number \
  --verified-destination-number-id <VerifiedDestinationNumberId> \
  --verification-code 123456
```

You need an **Active** origination identity (non‑simulator) that can send to that country to verify a real destination. Simulator numbers cannot verify real destinations.

---

## Part 2: Production – US 10DLC (required for US long codes)

To send to **real US numbers** from a **10‑digit long code (10DLC)**, you must complete 10DLC registration **before** the number can be used in production.

### Step 2.1 – 10DLC brand (company) registration

1. In the console: **Configurations** → **Registrations** (or **10DLC**).
2. Start **10DLC company/brand registration**.
3. Submit:
   - Company legal name, EIN, address, website, etc.
   - **Timeline**: ~1–2 business days (US) or up to ~3 weeks (international).

### Step 2.2 – 10DLC brand vetting (optional, for higher throughput)

- External vetting can increase throughput (e.g. AT&T, T‑Mobile).
- One‑time fee; see [10DLC brand vetting](https://docs.aws.amazon.com/sms-voice/latest/userguide/registrations-10dlc-vetting.html).

### Step 2.3 – 10DLC campaign registration

1. In **Configurations** → **Registrations** → **10DLC** (or equivalent).
2. Create a **10DLC campaign** and associate it with your brand.
3. Set:
   - **Campaign use case** (e.g. **Account notification**, **Customer care**, **Mixed** for trip alerts + support).
   - **Sample messages** (e.g. booking confirmation, driver en route, reply‑to‑support).
   - **Opt‑in process** (how customers agree to receive SMS).
4. **Timeline**: up to ~4 weeks for campaign approval.

### Step 2.4 – Request a 10DLC phone number

1. **Configurations** → **Phone numbers** → **Request originator**.
2. **Message destination country**: **United States** → **Next**.
3. **Messaging use case**:
   - **Estimated monthly message volume** (optional).
   - **Company headquarters**: **Local** or **International**.
   - **Two-way messaging**: **Yes** if you want customers to reply to this number.
4. **Next** → **Originator type**: choose **10DLC** (or the recommended type).
5. **Associate to registered brand** and **Associate to registered campaign** (from 2.1 and 2.3).
6. **Resource policy** (if you use Pinpoint or SNS in the same account): optionally add **Pinpoint campaign orchestration** and/or **Simple Notification Service (Amazon SNS)**.
7. **Next** → **Review and request** → **Request**.
8. If a **Registration Required** window appears, complete it; the number cannot send until that registration is approved.
9. **Timeline**: number provisioning can take up to ~10 days; you are charged the monthly lease once it’s requested.

**Important**: The number’s **Status** must be **ACTIVE** before you can send. Until then it may show **PENDING**.

---

## Part 3: Non‑US or toll‑free (alternative to 10DLC)

- **Toll‑free (US)**: In **Request originator**, choose **Toll-free** when offered. Toll‑free has its own registration/verification; see AWS docs.
- **Other countries**: In **Request originator**, choose the destination country and the recommended originator type (e.g. long code, sender ID). Registration rules depend on the country (e.g. India Entity ID / Template ID).

---

## Part 4: Send SMS from Lambda (Node.js)

### Step 4.1 – IAM permissions

The Lambda execution role needs `SendTextMessage` and (optionally) `DescribePhoneNumbers` or similar for the resources you use.

**Minimal policy for sending only**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "SendSMS",
      "Effect": "Allow",
      "Action": [
        "sms-voice:SendTextMessage"
      ],
      "Resource": [
        "arn:aws:sms-voice:us-east-1:ACCOUNT_ID:phone-number/*",
        "arn:aws:sms-voice:us-east-1:ACCOUNT_ID:pool/*",
        "arn:aws:sms-voice:us-east-1:ACCOUNT_ID:configuration-set/onyx-sms-config"
      ]
    }
  ]
}
```

Replace `ACCOUNT_ID` and `us-east-1` if different. If you use a pool ARN or phone number ARN, you can restrict `Resource` to those. For broader access (e.g. for multiple pools/config sets), use `"Resource": "*"` only if acceptable for your security model.

**Using an AWS managed policy**

- Attach **AmazonPinpointSMSV2FullAccess** (or a custom policy scoped to `SendTextMessage` and the resources above) to the Lambda role.

### Step 4.2 – Install SDK (Lambda / Node)

In your Lambda’s `package.json` (or the layer you use):

```json
"dependencies": {
  "@aws-sdk/client-pinpoint-sms-voice-v2": "^3.700.0"
}
```

Then `npm install` in that package (or equivalent in your build).

### Step 4.3 – Example: send from Lambda

```javascript
const {
  PinpointSMSVoiceV2Client,
  SendTextMessageCommand,
} = require('@aws-sdk/client-pinpoint-sms-voice-v2');

const client = new PinpointSMSVoiceV2Client({ region: 'us-east-1' });

async function sendSms(destinationPhone, messageBody) {
  const command = new SendTextMessageCommand({
    DestinationPhoneNumber: destinationPhone,   // E.164, e.g. +12065550142
    OriginationIdentity: '+12065550183',        // Your pool ID, phone number, or ARN
    MessageBody: messageBody,
    MessageType: 'TRANSACTIONAL',               // or 'PROMOTIONAL'
    ConfigurationSetName: 'onyx-sms-config',
    // ProtectConfigurationId: 'your-protect-config-id',  // optional
    TimeToLive: 72 * 3600,                      // 72 hours (optional, default)
    MaxPrice: '0.50',                           // optional, USD per message part
  });

  const { MessageId } = await client.send(command);
  return MessageId;
}

exports.handler = async (event) => {
  const { phone, message } = event; // or from body, etc.
  const e164 = phone.startsWith('+') ? phone : `+1${phone.replace(/\D/g, '')}`;
  const id = await sendSms(e164, message);
  return { messageId: id };
};
```

**Parameters**

| Parameter | Required | Notes |
|-----------|----------|-------|
| `DestinationPhoneNumber` | Yes | E.164, e.g. `+12065550142` |
| `OriginationIdentity` | Yes* | Pool ID, phone number, PhoneNumberArn, or PoolArn. Omit only if the pool has a single number and the console/API allows it. |
| `MessageBody` | Yes | Up to 1600 chars; long messages become multiple parts. |
| `MessageType` | No | `TRANSACTIONAL` (default for alerts/confirmations) or `PROMOTIONAL`. |
| `ConfigurationSetName` | No | For events (delivery, etc.). |
| `ProtectConfigurationId` | No | If you use a protect configuration. |
| `TimeToLive` | No | 5–259200 seconds; default 72 hours. |
| `MaxPrice` | No | Max USD per message part, e.g. `"0.50"`. |
| `DryRun` | No | `true` = validate only, do not send. |

\* For shared or cross‑account resources, use the full ARN for `OriginationIdentity`.

### Step 4.4 – Amplify `sendSms` Lambda (in this repo)

The Amplify backend includes a `sendSms` Lambda at `amplify/functions/sendSms/`. IAM for `sms-voice:SendTextMessage` is added in `amplify/backend.ts`.

#### 1. Set environment variables

`amplify/backend.ts` passes these into the Lambda from **build-time** env:

| Build-time env (Amplify or `export` before `ampx sandbox`) | Lambda env | Required | Example |
|------------------------------------------------------------|------------|----------|---------|
| `SMS_ORIGINATION_IDENTITY` | `ORIGINATION_IDENTITY` | **Yes** | Pool ID, E.164 (e.g. `+12065550183`), or ARN |
| `SMS_CONFIGURATION_SET_NAME` | `CONFIGURATION_SET_NAME` | No | `onyx-sms-config` |
| `SMS_PROTECT_CONFIGURATION_ID` | `PROTECT_CONFIGURATION_ID` | No | Protect config ID |

- **Amplify Hosting / CI**: In Amplify Console → **App settings** → **Environment variables**, add `SMS_ORIGINATION_IDENTITY` (and optional `SMS_CONFIGURATION_SET_NAME`, `SMS_PROTECT_CONFIGURATION_ID`). Rebuild/redeploy.
- **Local `ampx sandbox`**: `export SMS_ORIGINATION_IDENTITY=+12065550183` (and optional `SMS_CONFIGURATION_SET_NAME`, etc.) before running `ampx sandbox`.

`MESSAGE_TYPE` is set in `amplify/functions/sendSms/resource.ts` (default `TRANSACTIONAL`); override in the Lambda console if needed.

#### 2. Invocation

**Direct (from another Lambda, Step Function, EventBridge):**

```json
{ "phone": "+12065550142", "message": "Your trip is confirmed for 3pm." }
```

or

```json
{ "destinationPhoneNumber": "+12065550142", "messageBody": "Your trip is confirmed for 3pm." }
```

**Function URL (HTTP POST):**

If you add a **Function URL** to `sendSms` in the Lambda console (or via CDK), send:

```
POST /
Content-Type: application/json

{ "phone": "+12065550142", "message": "Your trip is confirmed for 3pm." }
```

Response: `{ "success": true, "messageId": "…" }` or `{ "success": false, "error": "…" }`.

Use **Auth type: IAM** or **NONE** and protect the URL (e.g. VPC, API Gateway in front, or IAM-signed requests from a backend).

#### 3. Enabling a Function URL

In **Lambda** → **sendSms** → **Configuration** → **Function URL** → **Create function URL**:

- **Auth type**: **IAM** (recommended; then sign with SigV4 from a backend) or **NONE** only if the URL is not publicly exposed.
- **CORS**: optional; if the browser will call it, set `Access-Control-Allow-Origin` etc. (the handler does not set CORS; configure in the Function URL or put API Gateway in front).

#### 4. Phone format

The handler normalizes `phone`: 10-digit US → `+1` + 10 digits; `+` already present is kept. Non-US numbers should be in E.164 (e.g. `+44…`).

---

## Part 5: Two-way SMS (optional)

If you requested **Two-way messaging: Yes** when ordering the number:

1. **Inbound**: AWS routes inbound SMS to an **SNS topic** or similar. Configure this in the **Phone number** or **Pool** settings for two‑way in the SMS-Voice console (or the equivalent in Pinpoint/End User Messaging, if still in use).
2. **Lambda**: Subscribe a Lambda to that SNS topic. The Lambda receives the incoming message (sender, body, etc.) and can:
   - Implement opt‑out (e.g. `STOP`, `UNSUBSCRIBE`) and store in your DB.
   - Forward to staff or a ticketing system for support.
   - Auto‑reply (e.g. “Reply HELP for help, STOP to opt out”).
3. **Opt‑out list**: You can create an **Opt-out list** in AWS End User Messaging and associate it with the pool/number so AWS can help enforce opt‑outs. You still must handle **STOP** in your Lambda and add numbers to that list (or your own DB) as required for TCPA.

Detailed two‑way and SNS wiring: [Set up two-way SMS](https://docs.aws.amazon.com/sms-voice/latest/userguide/sms-two-way.html) (or the current End User Messaging / Pinpoint doc for two‑way).

---

## Part 6: Request production (leave sandbox)

1. Open: https://support.console.aws.amazon.com/support/home#/case/create?issueType=service-limit-increase  
2. **Looking for service limit increases?** → use the guided form.
3. **Service**: **AWS End User Messaging SMS (Pinpoint)**.
4. Fill in:
   - **Link to site or app** that will send SMS.
   - **Message type**: e.g. **Transactional** (trip confirmations, driver updates, support).
   - **AWS Region** you send from.
   - **Countries** you send to.
   - **Opt‑in process**.
   - **Sample message templates**.
5. Under **Requests**:
   - **Region**: same as above.
   - **Resource Type**: **General Limits**.
   - **Quota**: **SMS Production Access**.
   - **New quota value**: `1`.
6. **Submit**.

After approval, you can send to any verified E.164 number (subject to protect configuration and 10DLC/carrier rules). You no longer need to pre‑verify each destination.

---

## Part 7: Checklist

- [ ] Pool created and phone number (simulator or 10DLC) in the pool.
- [ ] Configuration set created and linked to CloudWatch/SNS/Firehose.
- [ ] Protect configuration created and associated with the configuration set; destination countries allowed.
- [ ] 10DLC (US): Brand and campaign registered, 10DLC number requested and **ACTIVE**.
- [ ] Lambda: `@aws-sdk/client-pinpoint-sms-voice-v2`, `SendTextMessageCommand`, correct `OriginationIdentity` and `ConfigurationSetName`.
- [ ] Lambda role: `sms-voice:SendTextMessage` (and any `Describe*` you need) on the right resources.
- [ ] Production: **SMS Production Access** limit increase requested and approved.
- [ ] (Optional) Two-way: Two‑way enabled on the number, SNS topic, Lambda for inbound and opt‑out.

---

## References

- [AWS End User Messaging SMS User Guide](https://docs.aws.amazon.com/sms-voice/latest/userguide/)
- [SendTextMessage API](https://docs.aws.amazon.com/pinpoint/latest/apireference_smsvoicev2/API_SendTextMessage.html)
- [10DLC registration](https://docs.aws.amazon.com/sms-voice/latest/userguide/registrations-10dlc.html)
- [Request a phone number](https://docs.aws.amazon.com/sms-voice/latest/userguide/phone-numbers-request.html)
- [SMS Integration Options (this repo)](./SMS_INTEGRATION_OPTIONS.md)
