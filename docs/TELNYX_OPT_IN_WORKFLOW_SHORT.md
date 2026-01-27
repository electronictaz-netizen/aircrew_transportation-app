# Telnyx Opt-In Workflow Description (Short Version for Form)

## Opt-In Methods

**1. Booking Portal (Primary):**
Customer checks opt-in checkbox during booking: "I agree to receive SMS notifications about my trip (booking confirmations, reminders, driver updates). Reply STOP to opt out at any time." Initial confirmation SMS serves as opt-in acknowledgment.

**2. In-App Settings:**
Customer toggles "Enable SMS Notifications" in account settings. System records opt-in with timestamp and sends confirmation SMS.

**3. Keyword-Based:**
Customer texts START, YES, SUBSCRIBE, or OPTIN to our number. System processes via webhook, updates database, and sends confirmation.

## Message Types (All Transactional)

- Booking confirmations (immediate after booking)
- Booking acceptance notifications (when manager confirms)
- Trip reminders (24h and 1h before trip - max 2 per trip)
- Driver assignment/status updates (en route, arrived)
- Trip completion notifications

**Frequency:** 5-6 messages maximum per booking cycle. No marketing or promotional content.

## Opt-Out Process

Customer texts STOP, UNSUBSCRIBE, QUIT, END, or CANCEL. System immediately processes via webhook, updates database (records opt-out timestamp), stops all future messages, and sends one-time confirmation: "You have been unsubscribed from SMS notifications. Reply START to resubscribe."

## Compliance

- Explicit consent required (checkbox, toggle, or keyword)
- Every message includes "Reply STOP to opt out"
- Opt-out processed immediately (within seconds)
- All opt-ins/opt-outs recorded with timestamps
- No messages sent after opt-out unless customer opts back in
- All messages are transactional (booking-related only)

## Sample Messages

"Booking received! Trip on Jan 26 at 2:00 PM from Airport to Hotel. We'll confirm shortly. Reply STOP to opt out."

"Reminder: Trip AA1234 is tomorrow at 2:00 PM. Pickup: Airport."

"Driver John is en route to Airport for trip AA1234. ETA: 10-15 min."

## Use Case

**Campaign Use Case:** Mixed / Customer Care

**Justification:** Transactional notifications for trip bookings and customer service updates. All messages directly related to customer's active booking. No marketing content.

**Expected Volume:** 100-1,000 messages/month initially, growing to 1,000-5,000/month within 6 months.
