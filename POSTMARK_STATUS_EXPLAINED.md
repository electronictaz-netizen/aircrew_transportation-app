# Postmark Email Status Explained

## Status: "Processed"

When an email shows as **"Processed"** in Postmark's Activity dashboard, it means:

✅ **Good News**:
- Postmark accepted your email
- Email was queued for delivery
- Postmark attempted to send it to the recipient's mail server

❓ **What to Check Next**:

### 1. Click on the Email in Activity Dashboard

Click on the email to see detailed information:
- **Delivery Status**: Should show "Delivered", "Bounced", or "Pending"
- **Recipient**: Verify the email address is correct
- **Message ID**: For tracking
- **Bounce Details**: If it bounced, you'll see the reason here

### 2. Check Delivery Status

After "Processed", the email should move to one of these statuses:

- **"Delivered"** ✅ = Successfully delivered to recipient's mail server
- **"Bounced"** ❌ = Recipient's server rejected it (check bounce reason)
- **"Pending"** ⏳ = Still being processed (wait a few minutes)
- **"Opened"** 👁️ = Recipient opened the email (if tracking enabled)

### 3. If Status Stays "Processed"

If it stays as "Processed" for more than a few minutes:

1. **Check recipient email address**:
   - Is it a valid, active email?
   - Try sending to a different email (like Gmail) to test

2. **Check recipient's spam folder**:
   - Even if delivered, it might be in spam
   - Ask the recipient to check spam/junk folder

3. **Check for bounces**:
   - Look in Postmark Dashboard → **Bounces**
   - See if there are any bounce messages

4. **Check recipient's mail server**:
   - Some mail servers have delays
   - Corporate email servers might have additional filtering

### 4. Common Issues After "Processed"

#### Issue: Email Bounced
- **Check**: Postmark Dashboard → **Bounces**
- **Common reasons**:
  - Invalid email address
  - Recipient's mailbox is full
  - Recipient's server blocked the email
  - Domain reputation issues

#### Issue: Email in Spam
- **Check**: Recipient's spam folder
- **Why**: Even with verified domain, some emails go to spam
- **Solution**: Ask recipient to mark as "Not Spam" and add sender to contacts

#### Issue: Delayed Delivery
- **Check**: Wait 5-10 minutes
- **Why**: Some mail servers have processing delays
- **Solution**: Normal delay, should arrive soon

### 5. Verify Domain Still Matters

Even if status shows "Processed", if your domain isn't verified:
- Emails may be rejected by recipient's server
- Emails may go to spam
- Delivery rates will be lower

**Always verify your domain** for best deliverability.

### 6. Test Delivery

To verify everything is working:

1. **Send to yourself**:
   - Use your own email address
   - Check inbox and spam folder
   - If you receive it, system is working

2. **Send to Gmail/Outlook**:
   - Test with a Gmail or Outlook address
   - These usually have good delivery rates
   - If it works, issue might be with specific recipient

3. **Check Postmark Activity**:
   - Look for "Delivered" status
   - Check bounce messages if any

### 7. Next Steps

1. **Click on the email** in Activity to see detailed status
2. **Check Bounces tab** for any rejection messages
3. **Ask recipient to check spam folder**
4. **Verify your domain** is verified in Postmark (if not already)
5. **Test with a different email address** to isolate the issue

### Quick Diagnostic

- ✅ Status: "Processed" = Postmark is working
- ❓ Status: "Bounced" = Check bounce reason
- ⏳ Status: "Pending" = Wait a few minutes
- ✅ Status: "Delivered" = Success! (Check spam if not received)
