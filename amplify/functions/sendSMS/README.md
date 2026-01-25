# sendSms Lambda

Sends SMS via **AWS End User Messaging** (Pinpoint SMS Voice v2 / `SendTextMessage`).

> **Paused** – SMS setup is on hold until US 10DLC brand registration is approved. Do not set `ORIGINATION_IDENTITY` or production SMS until then.

## Config

- **ORIGINATION_IDENTITY** (required): from `SMS_ORIGINATION_IDENTITY` in Amplify env or `backend.addEnvironment`.
- **CONFIGURATION_SET_NAME**, **PROTECT_CONFIGURATION_ID** (optional): from `SMS_CONFIGURATION_SET_NAME`, `SMS_PROTECT_CONFIGURATION_ID`.
- **MESSAGE_TYPE**: `TRANSACTIONAL` (default) or `PROMOTIONAL`.

## Input

- `{ "phone": "+12065550142", "message": "Hello" }`  
- or `{ "destinationPhoneNumber": "+12065550142", "messageBody": "Hello" }`

For HTTP (Function URL), same JSON in `POST` body.

## Output

- Direct: `{ "success": true, "messageId": "…" }`
- HTTP: `200` with that JSON, or `4xx/5xx` with `{ "success": false, "error": "…" }`

## Setup

See [docs/AWS_END_USER_MESSAGING_SMS_SETUP.md](../../docs/AWS_END_USER_MESSAGING_SMS_SETUP.md).
