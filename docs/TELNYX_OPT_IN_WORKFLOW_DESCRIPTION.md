# Telnyx 10DLC Campaign - Opt-In Workflow Description

## Overview

Onyx Transportation provides SMS notifications to customers and drivers for trip management, booking confirmations, and service updates. All SMS communications are transactional in nature and require explicit opt-in from recipients.

## Opt-In Methods

### 1. Booking Portal Opt-In (Primary Method)

**Workflow:**
- Customer visits public booking portal (e.g., `onyxdispatch.us/booking/COMPANYCODE`)
- Customer fills out booking form with required information including phone number
- During booking submission, customer is presented with opt-in checkbox:
  - **"I agree to receive SMS notifications about my trip (booking confirmations, reminders, driver updates). Reply STOP to opt out at any time."**
- Customer must check the box to complete booking
- Upon booking submission, customer receives initial SMS confirmation:
  - **"Booking received! Trip on [date] from [location] to [location]. We'll confirm shortly. Reply STOP to opt out."**
- This initial message serves as both confirmation and opt-in acknowledgment

**Compliance:**
- ✅ Explicit consent via checkbox
- ✅ Clear description of message types
- ✅ Opt-out instructions included
- ✅ Consent is recorded in database (`smsOptIn = true`, `smsOptInAt = timestamp`)

### 2. In-App Opt-In (Secondary Method)

**Workflow:**
- Customer account exists in system (created via booking or manual entry)
- Customer accesses account settings or profile
- Customer sees SMS notification preferences section
- Customer toggles "Enable SMS Notifications" switch
- System records opt-in: `smsOptIn = true`, `smsOptInAt = timestamp`
- Customer receives confirmation SMS:
  - **"You have been subscribed to SMS notifications. Reply STOP to unsubscribe at any time."**

**Compliance:**
- ✅ Explicit action required (toggle switch)
- ✅ Clear opt-out instructions
- ✅ Consent timestamp recorded

### 3. Keyword-Based Opt-In (Tertiary Method)

**Workflow:**
- Customer sends SMS with keyword: **START**, **YES**, **SUBSCRIBE**, or **OPTIN**
- System receives inbound SMS via webhook
- System identifies customer by phone number
- System updates customer record: `smsOptIn = true`, `smsOptInAt = timestamp`, clears `smsOptOutAt`
- System sends confirmation SMS:
  - **"You have been subscribed to SMS notifications. Reply STOP to unsubscribe at any time."**

**Compliance:**
- ✅ Explicit keyword action
- ✅ Confirmation message sent
- ✅ Consent recorded with timestamp

## Message Types and Frequency

### Transactional Messages (A2P)

1. **Booking Confirmations**
   - **When:** Immediately after booking submission
   - **Frequency:** One-time per booking
   - **Example:** "Booking received! Trip on Jan 26 at 2:00 PM from Airport to Hotel. We'll confirm shortly. Reply STOP to opt out."

2. **Booking Acceptance Notifications**
   - **When:** When manager accepts/confirms booking
   - **Frequency:** One-time per booking
   - **Example:** "Booking confirmed! Trip on Jan 26 at 2:00 PM. Pickup: Airport. We'll send driver details soon."

3. **Trip Reminders**
   - **When:** 24 hours before trip, 1 hour before trip
   - **Frequency:** Maximum 2 messages per trip
   - **Example (24h):** "Reminder: Trip AA1234 is tomorrow at 2:00 PM. Pickup: Airport."
   - **Example (1h):** "Trip AA1234 is in 1 hour. Driver will arrive at Airport."

4. **Driver Assignment Notifications**
   - **When:** When driver is assigned to trip
   - **Frequency:** One-time per assignment
   - **Example:** "Driver John is en route to Airport for trip AA1234. ETA: 10-15 min."

5. **Driver Arrival Notifications**
   - **When:** When driver arrives at pickup location
   - **Frequency:** One-time per trip
   - **Example:** "Driver John has arrived at Airport for trip AA1234."

6. **Trip Completion Notifications**
   - **When:** When trip is marked as completed
   - **Frequency:** One-time per trip
   - **Example:** "Trip AA1234 completed. Thank you for choosing our service!"

### Driver Notifications (Internal)

- **Driver Assignment:** "New trip: AA1234 on Jan 26. Pickup: Airport. Reply STOP to opt out."
- **Driver Reassignment:** "Trip reassigned: AA1234 on Jan 26. Pickup: Airport."
- **Driver Unassignment:** "You've been unassigned from trip AA1234. Contact management with questions."

**Note:** Driver notifications are sent to employees/contractors (not customers) and are part of operational communications.

## Opt-Out Process

### Keyword-Based Opt-Out

**Workflow:**
- Customer sends SMS with keyword: **STOP**, **UNSUBSCRIBE**, **QUIT**, **END**, or **CANCEL**
- System receives inbound SMS via webhook
- System identifies customer by phone number
- System updates customer record: `smsOptOutAt = timestamp`, `smsOptIn = false`
- System immediately stops sending SMS to that number
- System sends one-time confirmation SMS:
  - **"You have been unsubscribed from SMS notifications. Reply START to resubscribe."**

**Compliance:**
- ✅ Immediate opt-out processing
- ✅ Confirmation message sent
- ✅ Opt-out timestamp recorded
- ✅ No further messages sent after opt-out

### In-App Opt-Out

**Workflow:**
- Customer accesses account settings
- Customer disables "SMS Notifications" toggle
- System updates: `smsOptOutAt = timestamp`, `smsOptIn = false`
- No further SMS sent to that number

## Sample Messages

### Initial Opt-In Message (Booking Confirmation)
```
Booking received! Trip on Jan 26 at 2:00 PM from Buffalo Airport to Downtown Hotel. We'll confirm shortly. Reply STOP to opt out.
```

### Trip Reminder (24 Hours)
```
Reminder: Trip AA1234 is tomorrow at 2:00 PM. Pickup: Buffalo Airport.
```

### Driver En Route
```
Driver John is en route to Buffalo Airport for trip AA1234. ETA: 10-15 min.
```

### Trip Completion
```
Trip AA1234 completed. Thank you for choosing our service!
```

### Opt-Out Confirmation
```
You have been unsubscribed from SMS notifications. Reply START to resubscribe.
```

### Opt-In Confirmation
```
You have been subscribed to SMS notifications. Reply STOP to unsubscribe at any time.
```

## Compliance Measures

### TCPA Compliance
- ✅ **Explicit Consent Required:** All customers must explicitly opt-in via checkbox, toggle, or keyword
- ✅ **Clear Opt-Out Instructions:** Every message includes "Reply STOP to opt out"
- ✅ **Immediate Opt-Out Processing:** Opt-out requests processed within seconds
- ✅ **No Marketing Messages:** All messages are transactional (booking-related only)
- ✅ **Consent Records:** All opt-ins and opt-outs recorded with timestamps
- ✅ **No Re-engagement:** Customers who opt-out are not contacted again unless they opt back in

### Data Retention
- Opt-in timestamps stored: `smsOptInAt`
- Opt-out timestamps stored: `smsOptOutAt`
- Records maintained for compliance and audit purposes

### Message Frequency Limits
- **Maximum per customer:** 5-6 messages per booking cycle
  - 1 booking confirmation
  - 1 booking acceptance (if applicable)
  - 2 trip reminders (24h and 1h)
  - 1-2 driver status updates (en route, arrived)
  - 1 trip completion
- **No unsolicited messages**
- **No promotional content**

## Use Case Classification

**Campaign Use Case:** **Mixed** or **Customer Care**

**Justification:**
- Primary purpose: Transactional notifications for trip bookings
- Secondary purpose: Customer service updates (driver status, trip reminders)
- All messages directly related to customer's active booking
- No marketing or promotional content

## Technical Implementation

### Opt-In Storage
- Database fields: `Customer.smsOptIn` (boolean), `Customer.smsOptInAt` (datetime)
- Checked before every SMS send
- Only sends if `smsOptIn = true` AND `smsOptOutAt` is null or expired

### Opt-Out Processing
- Webhook handler processes inbound SMS
- Keyword detection: STOP, UNSUBSCRIBE, QUIT, END, CANCEL
- Database update: `smsOptOutAt = current_timestamp`, `smsOptIn = false`
- Confirmation SMS sent immediately
- No further messages sent to opted-out numbers

### Message Sending
- All SMS sent via Telnyx API v2
- Backend Lambda function handles sending
- Frontend never has access to API keys
- All messages logged for audit purposes

## Expected Message Volume

- **Low to Medium Volume:** 100-1,000 messages per month initially
- **Growth Projection:** 1,000-5,000 messages per month within 6 months
- **Peak Times:** Business hours, booking submission times
- **Message Types:** 90% transactional confirmations, 10% reminders/updates

## Contact Information

- **Company:** Onyx Transportation / Onyx Dispatch
- **Business Type:** Transportation Service Provider
- **Primary Use:** Airport and ground transportation services
- **Customer Base:** Airline crews, corporate clients, general public

---

**This workflow ensures full TCPA compliance and provides clear, transactional SMS communications to customers who have explicitly opted in to receive notifications about their transportation bookings.**
