# Postmark Email Delivery Troubleshooting

## Problem: Email Shows in Postmark but Not Delivered

If emails appear in Postmark's Activity dashboard but aren't actually being delivered, check the following:

## Common Causes

### 1. Domain Not Verified (Most Common)

**Symptom**: Emails show as "Sent" in Postmark but never arrive.

**Solution**:
1. Go to Postmark Dashboard → **Sending** → **Domains**
2. Check if `onyxdispatch.us` shows as **"Verified"** (green checkmark)
3. If not verified:
   - Click on the domain
   - Add the DNS records Postmark provides:
     - **SPF record** (authorizes Postmark to send)
     - **DKIM records** (signs emails for deliverability)
     - **Return-Path record** (handles bounces)
   - Wait 5-30 minutes for DNS propagation
   - Click **"Verify"** in Postmark
   - Status should change to "Verified"

**Important**: Emails will NOT be delivered until the domain is verified.

### 2. Sandbox Mode / Test Server

**Symptom**: Emails only work for specific test email addresses.

**Solution**:
1. Go to Postmark Dashboard → Your Server
2. Check if you're using a **Test Server** (sandbox mode)
3. Test servers can only send to:
   - Email addresses you've verified in Postmark
   - The email address you signed up with
4. To send to any email:
   - Create a **Production Server** (not Test Server)
   - Verify your domain in the production server
   - Use the production server's API token

### 3. Sender Email Not Verified

**Symptom**: Domain is verified but specific sender email isn't.

**Solution**:
1. Go to Postmark Dashboard → **Sending** → **Signatures**
2. Verify that `noreply@onyxdispatch.us` is listed and verified
3. If not:
   - Click **"Add Signature"**
   - Enter `noreply@onyxdispatch.us`
   - Verify the email (Postmark will send a verification email)
   - Or use a verified signature from your verified domain

### 4. Email Going to Spam

**Symptom**: Email is sent but recipient doesn't see it (check spam folder).

**Solution**:
- Check recipient's spam/junk folder
- Verify domain has proper SPF/DKIM records (see #1)
- Use a reputable sender email (not `noreply@` if possible)
- Include proper email content (not just links)

### 5. Check Postmark Activity Dashboard

**How to Check**:
1. Go to Postmark Dashboard → **Activity**
2. Find your email
3. Check the **Status**:
   - **"Sent"** = Email was sent to recipient's mail server
   - **"Bounced"** = Recipient's mail server rejected it
   - **"Delivered"** = Confirmed delivery (if recipient supports it)
   - **"Opened"** = Recipient opened the email

4. Click on the email to see details:
   - **Delivery status**
   - **Bounce reason** (if bounced)
   - **Recipient email**

### 6. Check Lambda Logs

**How to Check**:
1. Go to AWS Lambda Console
2. Find your `sendInvitationEmail` function
3. Go to **Monitor** → **Logs**
4. Look for:
   - Postmark API responses
   - Error messages
   - Message IDs

## Quick Diagnostic Steps

1. **Check Domain Verification**:
   - Postmark Dashboard → Sending → Domains
   - Must show "Verified" status

2. **Check Server Type**:
   - Postmark Dashboard → Your Server
   - Should be "Production Server" (not Test Server)

3. **Check Activity**:
   - Postmark Dashboard → Activity
   - Look at email status and any error messages

4. **Test with Verified Email**:
   - Try sending to your own verified email address first
   - If that works, domain/server is fine
   - If not, check domain verification

5. **Check DNS Records**:
   - Use a DNS lookup tool (like `dig` or online tools)
   - Verify SPF/DKIM records are present and correct

## Common Error Messages

### "Sender signature not verified"
- **Fix**: Verify your domain in Postmark (see #1 above)

### "Invalid 'From' address"
- **Fix**: Use an email address from your verified domain (e.g., `noreply@onyxdispatch.us`)

### "Message rejected: sandbox mode"
- **Fix**: Create a Production Server or verify the recipient email in Postmark

### "Bounced: Invalid recipient"
- **Fix**: Check that the recipient email address is valid

## Verification Checklist

- [ ] Domain `onyxdispatch.us` is verified in Postmark
- [ ] DNS records (SPF, DKIM, Return-Path) are added and verified
- [ ] Using a Production Server (not Test Server)
- [ ] `POSTMARK_API_KEY` is from the correct server
- [ ] `POSTMARK_FROM_EMAIL` is from verified domain
- [ ] Email shows in Postmark Activity dashboard
- [ ] Checked recipient's spam folder
- [ ] Tested with a known-good email address

## Next Steps

1. **Verify your domain** in Postmark (most common fix)
2. **Check Postmark Activity** dashboard for delivery status
3. **Test with your own email** to confirm it's working
4. **Check Lambda logs** for any errors

## Still Not Working?

If emails still aren't being delivered after checking all of the above:

1. **Contact Postmark Support**: They can check server logs and delivery issues
2. **Check recipient email**: Make sure it's a valid, active email address
3. **Try different recipient**: Test with a Gmail/Outlook address to rule out recipient server issues
4. **Check Postmark account status**: Ensure your account isn't suspended or limited
