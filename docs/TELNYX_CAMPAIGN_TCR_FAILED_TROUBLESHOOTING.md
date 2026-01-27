# Telnyx Campaign TCR_FAILED - Troubleshooting Guide

## Status: TCR_FAILED

**Campaign ID:** `4b30019c-0050-d99f-1e90-aea0379f82cd`  
**Brand:** Taz Software LLC  
**Created:** January 27, 2026 11:37

### ✅ **SPECIFIC FAILURE REASON RECEIVED:**

**Field:** `usecase`  
**Description:** "Brand does not qualify for submitted campaign use-case."

**This means:** Your brand registration doesn't qualify for the use case you selected in the campaign. The brand vertical and campaign use case must be compatible.

---

## 🎯 **IMMEDIATE FIX FOR YOUR ISSUE**

### Problem Identified
Your brand "Taz Software LLC" is likely registered with vertical **"Information Technology Services"**, but you selected a use case (probably "Mixed" or "Customer Care" for transportation) that doesn't qualify for that vertical.

### Solution Options

#### **Option 1: Re-register Brand with Correct Vertical (RECOMMENDED)** ⭐

**Best for:** Transportation-specific SMS messaging

1. **Register a new brand:**
   - Go to Telnyx Dashboard → **10DLC** → **Brands** → **Create New Brand**
   - **Brand Name:** "Taz Software LLC" (or "Onyx Transportation")
   - **Vertical:** Select **"Transportation"** or **"Logistics"**
   - Complete all required fields
   - Submit for approval

2. **Wait for brand approval:**
   - Typically 1-3 business days
   - Check status in Telnyx Dashboard

3. **Create campaign with new brand:**
   - Use the newly approved brand
   - **Use Case:** Select **"Mixed"** or **"Customer Care"**
   - This will allow transportation-specific messaging

**Pros:**
- ✅ Allows transportation-specific messaging
- ✅ Matches your actual business type
- ✅ Better approval rates for relevant use cases

**Cons:**
- ⏳ Requires waiting for brand approval (1-3 days)

---

#### **Option 2: Change Campaign Use Case to Match Current Brand**

**Best for:** Quick fix, generic notifications only

1. **Check your current brand vertical:**
   - Go to Telnyx Dashboard → **10DLC** → **Brands** → "Taz Software LLC"
   - Note the vertical (likely "Information Technology Services")

2. **Select a qualifying use case:**
   - For "Information Technology Services" vertical, try:
     - **"Transactional"** - Generic transactional notifications
     - **"Account Notifications"** - Account-related messages
     - **"Customer Care"** - Generic customer service (may work)

3. **Update your campaign:**
   - Change use case to one that qualifies
   - Keep all other details the same
   - Resubmit campaign

**Pros:**
- ✅ Quick fix, no waiting
- ✅ Uses existing brand

**Cons:**
- ❌ May not allow transportation-specific messaging
- ❌ May be rejected again if use case still doesn't qualify
- ❌ Less ideal for your business type

---

#### **Option 3: Contact Telnyx to Update Brand Vertical**

1. **Email Telnyx Support:** support@telnyx.com
2. **Request:**
   - Update brand "Taz Software LLC" vertical from "Information Technology Services" to "Transportation" or "Logistics"
   - Explain your business is transportation/ground transportation services
3. **Wait for response:**
   - They may approve the change
   - Or may require re-registration

**Pros:**
- ✅ Keeps existing brand
- ✅ May be faster than new registration

**Cons:**
- ⏳ Requires Telnyx approval
- ❌ May not be possible (depends on Telnyx policy)

---

### **Recommended Action Plan**

1. **Check your brand vertical first:**
   - Telnyx Dashboard → **10DLC** → **Brands** → "Taz Software LLC"
   - Confirm the vertical

2. **If brand is "Information Technology Services":**
   - **RECOMMENDED:** Register new brand as "Transportation" or "Logistics"
   - Wait for approval, then create campaign with "Mixed" use case

3. **If you need SMS working immediately:**
   - Try Option 2: Change campaign use case to "Transactional" or "Account Notifications"
   - May work for generic notifications
   - Can always create better campaign later with correct brand

---

## Common Causes of TCR_FAILED

### 1. **Brand Registration Not Approved** ⚠️ MOST COMMON
**Issue:** Your brand registration must be **APPROVED** before you can create campaigns.

**Check:**
1. Go to Telnyx Dashboard → **10DLC** → **Brands**
2. Find "Taz Software LLC"
3. Check the status:
   - ✅ **APPROVED** = Good, proceed to next checks
   - ⏳ **PENDING** = Wait for approval (1-3 business days)
   - ❌ **REJECTED** = Fix brand registration issues first
   - ⚠️ **INCOMPLETE** = Complete missing information

**Solution:**
- If brand is PENDING: Wait for approval, then resubmit campaign
- If brand is REJECTED: Fix brand issues first, then create campaign
- Brand must be APPROVED before campaign creation

---

### 2. **Vertical Mismatch** ⚠️ VERY COMMON
**Issue:** Campaign vertical doesn't match brand vertical.

**Check:**
1. Go to Telnyx Dashboard → **10DLC** → **Brands** → "Taz Software LLC"
2. Note the **Vertical** registered for your brand
3. Compare with campaign vertical you selected

**Common Issue:**
- Brand registered as: "Information Technology Services"
- Campaign selected: "Transportation" or "Logistics"
- **These don't match!**

**Solution:**
- **Option A:** Update brand vertical to match campaign (if possible)
- **Option B:** Select the same vertical in campaign as your brand registration
- **Option C:** Re-register brand with correct vertical (Transportation/Logistics)

**Recommended:** Use "Transportation" or "Logistics" for both brand and campaign.

---

### 3. **Use Case Mismatch** ⚠️ **YOUR ACTUAL ISSUE**
**Issue:** Campaign use case doesn't align with your opt-in workflow or message types.

**✅ CONFIRMED FAILURE REASON:** "Brand does not qualify for submitted campaign use-case."

**What This Means:**
- Your brand was registered with a specific vertical (likely "Information Technology Services")
- You selected a use case in the campaign that doesn't qualify for that vertical
- Telnyx's system rejected it because the brand vertical doesn't support that use case

**Check:**
1. Go to Telnyx Dashboard → **10DLC** → **Brands** → "Taz Software LLC"
2. Note the **Vertical** registered (likely "Information Technology Services")
3. Check what **use case** you selected in the campaign:
   - Mixed?
   - Customer Care?
   - Transactional?
   - Marketing?

**Common Issue:**
- Brand registered as: "Information Technology Services"
- Campaign use case selected: "Mixed" or "Customer Care" (for transportation)
- **These don't match!** IT Services vertical may not qualify for transportation-related use cases

**Solution Options:**

**Option A: Change Campaign Use Case to Match Brand Vertical**
1. Check what use cases your brand vertical supports
2. Select a use case that qualifies for "Information Technology Services"
3. Common IT Services use cases: "Transactional", "Customer Care" (generic), "Account Notifications"
4. **Note:** This may limit your messaging to generic notifications, not transportation-specific

**Option B: Re-register Brand with Correct Vertical (RECOMMENDED)**
1. Register a new brand with vertical: **"Transportation"** or **"Logistics"**
2. Wait for brand approval (1-3 business days)
3. Create campaign with use case: **"Mixed"** or **"Customer Care"**
4. This allows transportation-specific messaging

**Option C: Update Existing Brand Vertical (If Possible)**
1. Contact Telnyx support to update brand vertical
2. Change from "Information Technology Services" to "Transportation" or "Logistics"
3. May require re-verification
4. Then resubmit campaign with "Mixed" or "Customer Care" use case

**Recommended Action:**
- **For transportation SMS:** Re-register brand as "Transportation" or "Logistics"
- **For generic notifications:** Use "Transactional" or "Account Notifications" use case with current brand

---

### 4. **Privacy Policy or Terms URLs Not Accessible**
**Issue:** Telnyx cannot access your privacy policy or terms pages.

**Check:**
1. Test these URLs in an incognito browser:
   - Privacy Policy: `https://tazsoftware.biz/privacy-policy.html`
   - Terms: `https://tazsoftware.biz/terms-of-service.html`
   - OR: `https://onyxdispatch.us/privacy-policy.html`
   - OR: `https://onyxdispatch.us/terms-of-service.html`

2. Verify:
   - ✅ Page loads without errors
   - ✅ Page is publicly accessible (no login required)
   - ✅ Page mentions SMS/Telnyx data handling
   - ✅ HTTPS is working (not HTTP)

**Common Issues:**
- URL returns 404 (page not found)
- URL requires login/authentication
- URL is HTTP instead of HTTPS
- Page doesn't mention SMS services

**Solution:**
- Ensure pages are deployed and accessible
- Test URLs in incognito mode
- Verify HTTPS is working
- Ensure SMS sections are visible on pages

---

### 5. **Sample Messages Don't Match Use Case**
**Issue:** Sample messages look like marketing instead of transactional.

**Check:**
- Do your sample messages include:
  - Promotional content? ❌
  - Discount codes? ❌
  - Marketing language? ❌

**Solution:**
- Use only transactional examples:
  - ✅ "Booking received! Trip on Jan 26 at 2:00 PM..."
  - ✅ "Reminder: Trip AA1234 is tomorrow at 2:00 PM..."
  - ❌ "Thanks for subscribing! Use code 20OFF..."

---

### 6. **Opt-In Workflow Description Issues**
**Issue:** Description is unclear, incomplete, or doesn't match your implementation.

**Check:**
- Is your opt-in workflow description:
  - Clear and detailed? ✅
  - Mentions all 3 opt-in methods? ✅
  - Explains message types? ✅
  - States no marketing messages? ✅

**Common Issues:**
- Too vague or generic
- Doesn't explain how opt-in works
- Mentions marketing (should be transactional only)
- Doesn't match actual implementation

**Solution:**
- Use the detailed description from `docs/TELNYX_CAMPAIGN_FORM_FILLING_GUIDE.md`
- Ensure it matches your actual code implementation
- Be specific about opt-in methods

---

### 7. **Campaign Description Too Short or Vague**
**Issue:** Campaign description doesn't meet requirements or is unclear.

**Check:**
- Minimum 40 characters
- Clearly describes transactional nature
- Mentions transportation/booking context

**Solution:**
- Use the description from the filling guide
- Ensure it's at least 40 characters
- Be specific about your use case

---

### 8. **Brand Name Mismatch**
**Issue:** Campaign brand name doesn't exactly match registered brand name.

**Check:**
- Brand registration: "Taz Software LLC"
- Campaign brand: Should be exactly "Taz Software LLC"

**Solution:**
- Ensure exact match (case-sensitive)
- No extra spaces or characters
- Match the legal entity name

---

## Step-by-Step Fix Process

### Step 1: Check Brand Status
1. Go to Telnyx Dashboard → **10DLC** → **Brands**
2. Find "Taz Software LLC"
3. **If not APPROVED:**
   - Wait for approval (if PENDING)
   - Fix issues (if REJECTED)
   - Complete missing info (if INCOMPLETE)
4. **If APPROVED:** Proceed to Step 2

### Step 2: Fix Use Case Mismatch ⚠️ **YOUR ISSUE**
**Your brand doesn't qualify for the selected use case.**

1. **Check your brand vertical:**
   - Go to Telnyx Dashboard → **10DLC** → **Brands** → "Taz Software LLC"
   - Note the vertical (likely "Information Technology Services")

2. **Check what use case you selected:**
   - Look at your failed campaign
   - What use case did you choose? (Mixed, Customer Care, etc.)

3. **Choose a solution:**

   **Solution A: Re-register Brand (RECOMMENDED for Transportation)**
   - Register new brand with vertical: **"Transportation"** or **"Logistics"**
   - Wait for approval (1-3 business days)
   - Create campaign with use case: **"Mixed"** or **"Customer Care"**
   - This allows transportation-specific messaging

   **Solution B: Change Campaign Use Case**
   - Select a use case that qualifies for "Information Technology Services"
   - Options: "Transactional", "Account Notifications", "Customer Care" (generic)
   - **Note:** May not allow transportation-specific messaging

   **Solution C: Contact Telnyx to Update Brand**
   - Ask if brand vertical can be changed to "Transportation" or "Logistics"
   - May require re-verification
   - Then resubmit campaign

### Step 2B: Verify Vertical Match (If Applicable)
1. Check brand vertical
2. Check campaign vertical
3. **If they don't match:**
   - Update campaign to match brand, OR
   - Re-register brand with correct vertical

### Step 3: Test Compliance URLs
1. Test privacy policy URL in incognito:
   ```
   https://tazsoftware.biz/privacy-policy.html
   ```
2. Test terms URL in incognito:
   ```
   https://tazsoftware.biz/terms-of-service.html
   ```
3. **If not accessible:**
   - Deploy pages to website
   - Fix HTTPS issues
   - Ensure pages are public

### Step 4: Review Campaign Details
1. Compare your campaign submission with `docs/TELNYX_CAMPAIGN_FORM_FILLING_GUIDE.md`
2. Verify:
   - ✅ Vertical matches brand
   - ✅ Use case is "Mixed" or "Customer Care"
   - ✅ Sample messages are transactional
   - ✅ Opt-in workflow is detailed
   - ✅ All required fields completed

### Step 5: Contact Telnyx Support
**If all above checks pass, contact Telnyx:**

1. **Email:** support@telnyx.com
2. **Include:**
   - Campaign ID: `4b30019c-0050-d99f-1e90-aea0379f82cd`
   - Brand: Taz Software LLC
   - Brand ID: (from your brand registration)
   - Screenshot of campaign details
   - Ask: "What specific reason caused TCR_FAILED?"

3. **Request:**
   - Specific rejection reason
   - What needs to be fixed
   - Whether brand registration is the issue

---

## Most Likely Issues (In Order)

1. ✅ **Use case mismatch** - **CONFIRMED: Your brand doesn't qualify for the selected use case**
2. **Vertical mismatch** (brand vs campaign vertical)
3. **Brand not approved yet** (if you just registered)
4. **Privacy policy/Terms URLs not accessible**
5. **Sample messages look like marketing**

---

## Quick Checklist Before Resubmitting

- [ ] Brand status is **APPROVED** (not PENDING or REJECTED)
- [ ] Campaign vertical **matches** brand vertical
- [ ] Privacy policy URL is **accessible** (test in incognito)
- [ ] Terms URL is **accessible** (test in incognito)
- [ ] Use case is **"Mixed"** or **"Customer Care"**
- [ ] Sample messages are **transactional** (not marketing)
- [ ] Opt-in workflow description is **detailed and complete**
- [ ] Campaign description is **at least 40 characters**
- [ ] Brand name **exactly matches** registered brand

---

## Next Steps

1. **Check brand status first** - This is the #1 cause
2. **Verify vertical match** - Very common issue
3. **Test compliance URLs** - Ensure they're accessible
4. **Review campaign details** - Compare with guide
5. **Contact Telnyx** - If still unclear, ask for specific reason

---

## Contact Telnyx Support

**Email:** support@telnyx.com  
**Subject:** Campaign TCR_FAILED - Need Specific Rejection Reason

**Include in email:**
```
Campaign ID: 4b30019c-0050-d99f-1e90-aea0379f82cd
Brand: Taz Software LLC
Created: January 27, 2026 11:37
Status: TCR_FAILED

Could you please provide the specific reason why this campaign failed? 
I've verified:
- Brand registration status
- Vertical match
- Compliance URLs accessibility
- Campaign details completeness

What needs to be fixed to successfully create this campaign?
```

---

## Additional Resources

- Campaign Form Guide: `docs/TELNYX_CAMPAIGN_FORM_FILLING_GUIDE.md`
- Opt-In Workflow: `docs/TELNYX_OPT_IN_WORKFLOW_DESCRIPTION.md`
- Telnyx Support: https://support.telnyx.com
