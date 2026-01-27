# Telnyx Campaign Form - Complete Filling Guide

This guide provides exact text to copy-paste into each field of the Telnyx campaign creation form.

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
**Required field**

**Copy this text:**
```
Onyx Transportation implements the following opt-in methods for transactional SMS notifications about transportation bookings:

1. Booking Portal (Primary): Customers check an explicit opt-in checkbox during booking submission, stating: "I agree to receive SMS notifications about my trip (booking confirmations, reminders, driver updates). Reply STOP to opt out at any time." An initial booking confirmation SMS serves as opt-in acknowledgment. Consent is recorded in database with timestamp.

2. In-App Settings: Existing customers can enable SMS notifications by toggling a switch in their account settings. A confirmation SMS is sent upon activation. System records opt-in with timestamp.

3. Keyword-Based: Customers can text START, YES, SUBSCRIBE, or OPTIN to our designated number. The system processes this via webhook, updates the customer record, and sends a confirmation SMS.

Messages include booking confirmations, booking acceptance, trip reminders (24h/1h before trip), driver assignment/status updates (en route/arrived), and trip completion. All messages are transactional, with a maximum of 5-6 messages per booking cycle. No marketing or promotional content.
```

---

### **Opt In Keywords**
**Current:** "START, YES"  
**Update to:**
```
START, YES, SUBSCRIBE, OPTIN
```

---

### **Opt Out Keywords**
**Current:** "STOP, UNSUBSCRIBE"  
**Update to:**
```
STOP, UNSUBSCRIBE, QUIT, END, CANCEL
```

---

### **Help Keywords**
**Current:** "HELP"  
**Keep as:** `HELP`

---

### **Opt In Message (Auto-response)**
**Current placeholder:** `[Brand name]: Thanks for subscribing to [use case(s)]! Reply HELP for help. Message frequency may vary. Msg&data rates may apply. Consent is not a condition of purchase.`

**Replace with:**
```
Onyx Transportation: You have been subscribed to SMS notifications about your trips. Reply STOP to unsubscribe at any time. Msg&data rates may apply. Reply HELP for help.
```

---

### **Opt Out Message (Auto-response)**
**Current placeholder:** `[Brand Name]: You are unsubscribed and will receive no further messages.`

**Replace with:**
```
Onyx Transportation: You have been unsubscribed from SMS notifications. You will receive no further messages. Reply START to resubscribe.
```

---

## Section 2: Campaign and Content Attributes

Answer **"No"** to all questions (as shown in your screenshot):

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

## Section 4: Help Message and Sample Messages

### **Help Message**
**Required**

**Placeholder:** `[Brand name]: Please reach out to us at [website/email/toll free number] for help.`

**Replace with:**
```
Onyx Transportation: Please reach out to us at onyxdispatch.us or email support@onyxdispatch.us for help.
```

**Note:** Replace `onyxdispatch.us` and `support@onyxdispatch.us` with your actual website/email if different.

---

### **Sample Messages**
**Required:** 2 messages for Mixed campaigns

#### **Message 1:**
**Placeholder:** `Marketing: Thanks for subscribing to our promotional program! Use promo code: 20OFF for $20 off your next order! Reply STOP to opt out.`

**Replace with:**
```
Booking received! Trip on Jan 26 at 2:00 PM from Buffalo Airport to Downtown Hotel. We'll confirm shortly. Reply STOP to opt out.
```

#### **Message 2:**
**Placeholder:** `Marketing: Thanks for subscribing to our promotional program! Use promo code: 20OFF for $20 off your next order! Reply STOP to opt out.`

**Replace with:**
```
Reminder: Trip AA1234 is tomorrow at 2:00 PM. Pickup: Buffalo Airport.
```

**Alternative Message 2 (if you prefer driver status example):**
```
Driver John is en route to Buffalo Airport for trip AA1234. ETA: 10-15 min.
```

**Note:** These are transactional messages (not marketing), which is correct for your Mixed/Customer Care use case.

---

## Section 5: Compliance Links

### **Privacy Policy**
**Required**

**Fill with:** Your privacy policy URL

**Example:**
```
https://onyxdispatch.us/privacy-policy
```

**Note:** If you don't have a privacy policy page yet, you'll need to create one. This is a compliance requirement.

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

**Note:** If you don't have a terms page yet, you'll need to create one. This is also a compliance requirement.

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
- [ ] **Opt In Workflow:** Complete description of all 3 opt-in methods
- [ ] **Opt In Keywords:** START, YES, SUBSCRIBE, OPTIN
- [ ] **Opt Out Keywords:** STOP, UNSUBSCRIBE, QUIT, END, CANCEL
- [ ] **Help Keywords:** HELP
- [ ] **Opt In Message:** Includes brand name, opt-out instructions, HELP info
- [ ] **Opt Out Message:** Includes brand name, confirms unsubscription, re-subscribe option
- [ ] **Campaign Attributes:** All set to "No"
- [ ] **Webhook URL:** Function URL (or placeholder to update later)
- [ ] **Help Message:** Includes contact information
- [ ] **Sample Messages:** 2 transactional examples (not marketing)
- [ ] **Privacy Policy:** Valid URL
- [ ] **Terms and Conditions:** Valid URL
- [ ] **Embedded Link:** Sample URL or explanation

---

## Important Notes

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

---

## After Submission

1. **Wait for approval** (typically 1-3 business days)
2. **Check campaign status** in Telnyx dashboard
3. **Update webhook URL** if you used a placeholder
4. **Test opt-in/opt-out** once approved
5. **Begin sending SMS** once campaign is active

---

## Need Help?

If Telnyx asks for clarification on any field:
- Refer to `docs/TELNYX_OPT_IN_WORKFLOW_DESCRIPTION.md` for detailed explanations
- All information is based on your actual implementation
- Everything is TCPA compliant
