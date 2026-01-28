# Telnyx Campaign Form - Complete Filling Guide

This guide provides exact text to copy-paste into each field of the Telnyx campaign creation form, following Telnyx's official requirements and TCPA compliance standards.

**Based on:**
- [Telnyx Guide to 10DLC Message Flow Field](https://support.telnyx.com/en/articles/10562019-guide-to-10dlc-message-flow-field)
- [Telnyx 10DLC Keywords and Confirmation Messages](https://support.telnyx.com/en/articles/10645338-10dlc-keywords-and-confirmation-messages)

---

## Section 1: Content Details

### **Vertical**
**Change from:** "Information Technology Services"  
**Select:** Look for one of these options (in order of preference):
- **"Transportation"** (if available)
- **"Logistics"** (if available)
- **"Travel"** (if available)
- **"Customer Service"** (if Transportation/Logistics not available)

**Note:** "Information Technology Services" is incorrect for your business type.

---

### **Campaign Description**
**Required:** Minimum 40 characters

**Copy this text:**
```
Onyx Transportation provides transactional SMS notifications to customers for real-time trip management, booking confirmations, important reminders, and driver status updates related to their ground transportation services. All messages are directly related to active bookings. No marketing or promotional content will be sent.
```

**Character count:** ~200 characters (well above the 40 character minimum)

---

### **Opt In Workflow Description (Message Flow/Call To Action)**
**Required field** - Must document EACH opt-in method with specific details

**IMPORTANT:** Telnyx requires detailed information for EACH opt-in method you use. You must include:
- Exact URLs or locations where opt-in occurs
- Exact text/scripts used
- Links to screenshots or forms
- Specific confirmation messages sent

**Copy this complete text (includes all 3 opt-in methods):**

```
Onyx Transportation implements the following opt-in methods for transactional SMS notifications about transportation bookings:

1. DIGITAL CONSENT (Booking Portal - Primary Method):
The user navigates to Onyx Transportation's booking portal at https://onyxdispatch.us/booking and subscribes via the booking form. The opt-in checkbox is located on the booking submission page.

The opt-in form clearly states:
"By providing your phone number and checking the SMS notifications checkbox, you agree to receive SMS notifications about your trip (booking confirmations, reminders, driver updates) from Onyx Transportation. Message frequency may vary. Standard Message and Data Rates may apply. Reply STOP to opt out. Reply HELP for help. Consent is not a condition of purchase. Your mobile information will not be sold or shared with third parties for promotional or marketing purposes. View our Privacy Policy at https://onyxdispatch.us/privacy-policy."

Once the customer submits the booking form with the SMS opt-in checkbox checked, their phone number is recorded in the database with a timestamp, and a confirmation SMS is sent:
"Onyx Transportation: Thanks for subscribing to trip notifications! Reply HELP for help. Message frequency may vary. Msg&data rates may apply. Consent is not a condition of purchase. Reply STOP to opt out."

Screenshot of booking form: [Link to screenshot of booking form showing opt-in checkbox]

2. DIGITAL CONSENT (In-App Settings - Secondary Method):
Existing customers can enable SMS notifications by navigating to their account settings at https://onyxdispatch.us/account/settings and toggling the SMS notifications switch to "ON".

The settings page includes the following disclaimer:
"By enabling SMS notifications, you agree to receive SMS updates about your trips (booking confirmations, reminders, driver status updates) from Onyx Transportation. Message frequency may vary. Standard Message and Data Rates may apply. Reply STOP to opt out. Reply HELP for help. Your mobile information will not be sold or shared with third parties for promotional or marketing purposes."

Once the customer toggles SMS notifications ON, the system records the opt-in with a timestamp, and a confirmation SMS is sent:
"Onyx Transportation: Thanks for subscribing to trip notifications! Reply HELP for help. Message frequency may vary. Msg&data rates may apply. Consent is not a condition of purchase. Reply STOP to opt out."

Screenshot of settings page: [Link to screenshot of account settings page showing SMS toggle]

3. OPT-IN BY KEYWORD (Tertiary Method):
Onyx Transportation provides keywords (START, YES, SUBSCRIBE, OPTIN) and the designated number [YOUR_TELNYX_NUMBER] via the booking portal at https://onyxdispatch.us/booking and customer support communications.

The keyword opt-in process includes a disclaimer on the website:
"Text START, YES, SUBSCRIBE, or OPTIN to [YOUR_TELNYX_NUMBER] to receive SMS notifications about your trips. By texting a keyword, you agree to receive SMS updates from Onyx Transportation. Message frequency may vary. Standard Message and Data Rates may apply. Reply STOP to opt out. Reply HELP for help. Your mobile information will not be sold or shared with third parties for promotional or marketing purposes."

When the user texts "START", "YES", "SUBSCRIBE", or "OPTIN" to [YOUR_TELNYX_NUMBER], the system processes this via webhook, updates the customer record with opt-in timestamp, and responds with:
"Onyx Transportation: Thanks for subscribing to trip notifications! Reply HELP for help. Message frequency may vary. Msg&data rates may apply. Consent is not a condition of purchase. Reply STOP to opt out."

Link to where keywords are advertised: https://onyxdispatch.us/booking

All messages sent are transactional and include: booking confirmations, booking acceptance, trip reminders (24h/1h before trip), driver assignment/status updates (en route/arrived), and trip completion. Maximum of 5-6 messages per booking cycle. No marketing or promotional content.
```

**IMPORTANT NOTES:**
- Replace `[YOUR_TELNYX_NUMBER]` with your actual Telnyx phone number
- Replace `[Link to screenshot...]` with actual screenshot URLs or remove if not available yet
- Each method must include the exact disclaimer text and confirmation message
- All URLs must be actual, accessible links

---

### **Opt In Keywords**
**Required field**

**Copy this text:**
```
START, YES, SUBSCRIBE, OPTIN
```

---

### **Opt Out Keywords**
**Required field**

**Copy this text:**
```
STOP, UNSUBSCRIBE, QUIT, END, CANCEL
```

---

### **Help Keywords**
**Required field**

**Copy this text:**
```
HELP
```

---

### **Opt In Message (Auto-response)**
**Required field** - Must follow Telnyx format exactly

**Telnyx Required Format:**
`[Brand name]: Thanks for subscribing to [use case(s)]! Reply HELP for help. Message frequency may vary. Msg&data rates may apply. Consent is not a condition of purchase. Reply STOP to opt out.`

**Copy this exact text:**
```
Onyx Transportation: Thanks for subscribing to trip notifications! Reply HELP for help. Message frequency may vary. Msg&data rates may apply. Consent is not a condition of purchase. Reply STOP to opt out.
```

**Note:** This matches Telnyx's required format exactly. Do not modify the structure.

---

### **Opt Out Message (Auto-response)**
**Required field** - Must follow Telnyx format exactly

**Telnyx Required Format:**
`[Brand Name]: You are unsubscribed and will receive no further messages.`

**Copy this exact text:**
```
Onyx Transportation: You are unsubscribed and will receive no further messages.
```

**Note:** Telnyx format does NOT include "Reply START to resubscribe" in the opt-out message. Keep it simple as shown above.

---

### **Help Message (Auto-response)**
**Required field** - Must follow Telnyx format exactly

**Telnyx Required Format:**
`[Brand name]: Please reach out to us at [website/email/phone number] for help.`

**Copy this exact text:**
```
Onyx Transportation: Please reach out to us at onyxdispatch.us or email support@onyxdispatch.us for help.
```

**Note:** Websites are permissible so long as they have clear contact information at the link provided.

---

## Section 2: Campaign and Content Attributes

Answer **"No"** to all questions:

- ✅ **Embedded Link:** **No**
- ✅ **Embedded Phone Number:** **No**
- ✅ **Number Pooling:** **No**
- ✅ **Age-Gated Content:** **No**
- ✅ **Direct Lending or Loan Arrangement:** **No**

**Justification:** Your SMS messages are simple text-based transactional notifications. You don't currently embed links or phone numbers in messages, don't use number pooling, don't have age restrictions, and are not a lending service.

---

## Section 3: Webhooks

### **Webhook URL**
**Placeholder:** "Where you will receive provisioning status up"

**Fill with:** Your `telnyxWebhook` Lambda Function URL (after you create it)

**Format:** `https://xxxxxxxxxxxx.lambda-url.us-east-1.on.aws/`

**Note:** You'll need to:
1. Deploy your code first
2. Create Function URL for `telnyxWebhook` Lambda
3. Copy the URL and paste it here

**If you don't have it yet:** You can leave this blank for now and update it later, or use a placeholder URL that you'll update after deployment.

---

### **Webhook Failover URL**
**Placeholder:** "Where you will receive provisioning status up"

**Fill with:** 
- Leave blank (optional), OR
- Same as Webhook URL if you don't have a failover endpoint

---

## Section 4: Sample Messages

### **Sample Messages**
**Required:** 2 messages for Mixed campaigns

#### **Message 1:**
**Copy this text:**
```
Booking received! Trip on Jan 26 at 2:00 PM from Buffalo Airport to Downtown Hotel. We'll confirm shortly. Reply STOP to opt out.
```

#### **Message 2:**
**Copy this text:**
```
Reminder: Trip AA1234 is tomorrow at 2:00 PM. Pickup: Buffalo Airport. Reply STOP to opt out.
```

**Alternative Message 2 (if you prefer driver status example):**
```
Driver John is en route to Buffalo Airport for trip AA1234. ETA: 10-15 min. Reply STOP to opt out.
```

**Note:** These are transactional messages (not marketing), which is correct for your Mixed/Customer Care use case. All sample messages should include "Reply STOP to opt out" for consistency.

---

## Section 5: Compliance Links

### **Privacy Policy**
**Required**

**Fill with:** Your privacy policy URL

**Example:**
```
https://onyxdispatch.us/privacy-policy
```

**Note:** If you don't have a privacy policy page yet, you'll need to create one. This is a compliance requirement. The privacy policy must mention SMS/Telnyx data collection.

**Quick options:**
- Create a simple privacy policy page on your website
- Use a privacy policy generator (many free tools available)
- Include SMS/Telnyx data handling in your existing privacy policy

---

### **Terms and Conditions**
**Required**

**Fill with:** Your terms and conditions URL

**Example:**
```
https://onyxdispatch.us/terms
```

**Note:** If you don't have a terms page yet, you'll need to create one. This is also a compliance requirement. The terms must mention SMS service terms.

**Quick options:**
- Create a simple terms of service page
- Use a terms generator
- Update existing terms to include SMS service terms

---

### **Embedded Link**
**Optional** (but recommended to fill)

**Current status:** You selected "No" for "Embedded Link" in attributes, but Telnyx may still ask for a sample.

**Options:**

**Option 1 (If you plan to add links later):**
```
https://onyxdispatch.us/trip/[trip-id]
```

**Option 2 (If you don't plan to use links):**
```
Not applicable - our transactional SMS messages do not currently include embedded links. All trip information is provided in the message text itself.
```

**Option 3 (Generic booking link):**
```
https://onyxdispatch.us/booking
```

**Recommendation:** Use Option 1 or 3 to show you have a valid website, even if you don't currently embed links in SMS.

---

## Summary Checklist

Before submitting, verify:

- [ ] **Vertical:** Changed to Transportation/Logistics/Travel (not IT Services)
- [ ] **Campaign Description:** At least 40 characters, describes transactional nature
- [ ] **Opt In Workflow:** Complete description of ALL opt-in methods with:
  - [ ] Exact URLs for each method
  - [ ] Exact disclaimer text for each method
  - [ ] Exact confirmation message for each method
  - [ ] Screenshot links or locations where advertised
  - [ ] Phone number for keyword opt-in
- [ ] **Opt In Keywords:** START, YES, SUBSCRIBE, OPTIN
- [ ] **Opt Out Keywords:** STOP, UNSUBSCRIBE, QUIT, END, CANCEL
- [ ] **Help Keywords:** HELP
- [ ] **Opt In Message:** Follows Telnyx format exactly: "[Brand]: Thanks for subscribing to [use case]! Reply HELP for help. Message frequency may vary. Msg&data rates may apply. Consent is not a condition of purchase. Reply STOP to opt out."
- [ ] **Opt Out Message:** Follows Telnyx format exactly: "[Brand]: You are unsubscribed and will receive no further messages."
- [ ] **Help Message:** Follows Telnyx format exactly: "[Brand]: Please reach out to us at [website/email/phone] for help."
- [ ] **Campaign Attributes:** All set to "No"
- [ ] **Webhook URL:** Function URL (or placeholder to update later)
- [ ] **Sample Messages:** 2 transactional examples (not marketing), include "Reply STOP to opt out"
- [ ] **Privacy Policy:** Valid URL that mentions SMS data collection
- [ ] **Terms and Conditions:** Valid URL that mentions SMS service terms
- [ ] **Embedded Link:** Sample URL or explanation

---

## Important Notes

### Telnyx Requirements for Multiple Opt-In Methods

When you document multiple opt-in methods (Digital, Keyword, etc.), Telnyx requires **specific details for EACH method**:

1. **Digital Consent:**
   - Exact URL where opt-in occurs
   - Exact disclaimer text from the form
   - Link to screenshot of the form
   - Exact confirmation message sent

2. **Keyword Opt-In:**
   - Where the keyword/number is advertised (URL, flyer, etc.)
   - Exact disclaimer text shown to users
   - Exact confirmation message sent
   - Link to where keyword/number is advertised

3. **In-App Settings:**
   - Exact URL to settings page
   - Exact disclaimer text on the page
   - Exact confirmation message sent
   - Link to screenshot of settings page

**Failure to provide these specific details will result in campaign rejection (TELNYX_FAILED status).**

### Confirmation Messages Must Match Telnyx Format

Telnyx has specific required formats for confirmation messages. Do NOT deviate from these formats:

- **Opt-In:** `[Brand]: Thanks for subscribing to [use case]! Reply HELP for help. Message frequency may vary. Msg&data rates may apply. Consent is not a condition of purchase. Reply STOP to opt out.`
- **Opt-Out:** `[Brand]: You are unsubscribed and will receive no further messages.`
- **Help:** `[Brand]: Please reach out to us at [website/email/phone] for help.`

### Privacy Policy & Terms Pages

If you don't have these pages yet, you need to create them before submitting. Telnyx requires these for compliance.

**Quick creation options:**
1. Use a free generator: https://www.privacypolicygenerator.info/
2. Use a terms generator: https://www.termsofservicegenerator.net/
3. Create simple pages on your website

**Minimum requirements:**
- Privacy Policy should mention SMS/Telnyx data collection
- Terms should mention SMS service terms
- Both should be publicly accessible

### Webhook URL

If you haven't deployed yet, you can:
1. Submit the form with a placeholder
2. Update the webhook URL after deployment
3. Or wait to submit until after deployment

### Screenshots and Links

For each opt-in method, you should provide:
- Screenshots of forms/pages (upload to a service like Dropbox, Imgur, or your website)
- Links to where keywords/numbers are advertised
- Actual URLs (not placeholders) for all digital opt-in locations

If you don't have screenshots yet, you can:
1. Create them before submitting
2. Use placeholder text like "[Screenshot will be provided]" and update later
3. Note: Telnyx may request these during review

---

## After Submission

1. **Wait for approval** (typically 1-3 business days)
2. **Check campaign status** in Telnyx dashboard
3. **If rejected (TELNYX_FAILED):**
   - Review the rejection reason carefully
   - Update the specific field(s) mentioned
   - Resubmit the campaign
4. **Update webhook URL** if you used a placeholder
5. **Test opt-in/opt-out** once approved
6. **Begin sending SMS** once campaign is active

---

## Common Rejection Reasons and Fixes

### "Opt-in workflow mentions multiple methods of opt-in, each requiring specific details"

**Fix:** Ensure each opt-in method includes:
- Exact URL where it occurs
- Exact disclaimer text
- Exact confirmation message
- Link to screenshot or location where advertised

### "Subscriber/Auto-response Opt-in Message needs updating"

**Fix:** Use the exact Telnyx format:
```
Onyx Transportation: Thanks for subscribing to trip notifications! Reply HELP for help. Message frequency may vary. Msg&data rates may apply. Consent is not a condition of purchase. Reply STOP to opt out.
```

Do NOT modify this format or add extra text.

---

## Need Help?

If Telnyx asks for clarification on any field:
- Refer to the official Telnyx guides:
  - [Guide to 10DLC Message Flow Field](https://support.telnyx.com/en/articles/10562019-guide-to-10dlc-message-flow-field)
  - [10DLC Keywords and Confirmation Messages](https://support.telnyx.com/en/articles/10645338-10dlc-keywords-and-confirmation-messages)
- All information is based on your actual implementation
- Everything is TCPA compliant

---

## References

- [Telnyx Guide to 10DLC Message Flow Field](https://support.telnyx.com/en/articles/10562019-guide-to-10dlc-message-flow-field)
- [Telnyx 10DLC Keywords and Confirmation Messages](https://support.telnyx.com/en/articles/10645338-10dlc-keywords-and-confirmation-messages)
- [10DLC Campaign Compliance Requirements](https://support.telnyx.com/en/articles/9940291-10dlc-campaign-compliance-requirements)
