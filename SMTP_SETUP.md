# Microsoft 365 SMTP Setup Guide

## Overview

This guide explains how to verify and enable SMTP AUTH for your Microsoft 365 account (`noreply@onyxdispatch.us`) so that the Lambda function can send emails via SMTP.

## What is SMTP AUTH?

SMTP AUTH (SMTP Authentication) allows applications to send emails using your Microsoft 365 mailbox credentials. This is required for the Lambda function to send invitation emails, trip assignments, and daily summaries.

## Verifying SMTP AUTH is Enabled

### Method 1: Microsoft 365 Admin Center (Recommended)

1. **Sign in to Microsoft 365 Admin Center**
   - Go to [admin.microsoft.com](https://admin.microsoft.com)
   - Sign in with your admin account

2. **Navigate to Exchange Admin Center**
   - In the left sidebar, expand **Admin centers**
   - Click **Exchange**

3. **Check Mail Flow Settings**
   - In the Exchange Admin Center, go to **Mail flow** → **Connectors**
   - Look for any SMTP connectors that might restrict SMTP AUTH

4. **Check Authentication Policies (Modern Authentication)**
   - Go to **Settings** → **Mail flow** → **Settings**
   - Look for **SMTP AUTH** settings

### Method 2: PowerShell (Most Reliable)

Use Exchange Online PowerShell to check and configure SMTP AUTH:

1. **Install Exchange Online PowerShell Module** (if not already installed)
   ```powershell
   Install-Module -Name ExchangeOnlineManagement -Scope CurrentUser
   ```

2. **Connect to Exchange Online**
   ```powershell
   Connect-ExchangeOnline
   ```
   - Sign in with your admin credentials

3. **Check SMTP AUTH Status for Your Mailbox**
   ```powershell
   Get-CASMailbox -Identity noreply@onyxdispatch.us | Select-Object SmtpClientAuthenticationDisabled
   ```
   - If `SmtpClientAuthenticationDisabled` is `False`, SMTP AUTH is **enabled** ✅
   - If `SmtpClientAuthenticationDisabled` is `True`, SMTP AUTH is **disabled** ❌

4. **Enable SMTP AUTH (if disabled)**
   ```powershell
   Set-CASMailbox -Identity noreply@onyxdispatch.us -SmtpClientAuthenticationDisabled $false
   ```

5. **Verify the Change**
   ```powershell
   Get-CASMailbox -Identity noreply@onyxdispatch.us | Select-Object SmtpClientAuthenticationDisabled
   ```

### Method 3: Azure AD / Entra ID (Organization-Wide)

If you need to enable SMTP AUTH organization-wide:

1. **Sign in to Azure Portal**
   - Go to [portal.azure.com](https://portal.azure.com)
   - Navigate to **Azure Active Directory** (or **Microsoft Entra ID**)

2. **Check Authentication Methods**
   - Go to **Security** → **Authentication methods** → **Policies**
   - Look for SMTP AUTH policies

3. **Check Conditional Access Policies**
   - Go to **Security** → **Conditional Access**
   - Ensure no policies are blocking SMTP AUTH

## Enabling SMTP AUTH (If Disabled)

### For Individual Mailbox (PowerShell)

```powershell
# Connect to Exchange Online
Connect-ExchangeOnline

# Enable SMTP AUTH for specific mailbox
Set-CASMailbox -Identity noreply@onyxdispatch.us -SmtpClientAuthenticationDisabled $false

# Verify
Get-CASMailbox -Identity noreply@onyxdispatch.us | Select-Object SmtpClientAuthenticationDisabled
```

### For Organization-Wide (PowerShell)

```powershell
# Connect to Exchange Online
Connect-ExchangeOnline

# Enable SMTP AUTH for all mailboxes (organization-wide)
Get-CASMailbox -ResultSize Unlimited | Set-CASMailbox -SmtpClientAuthenticationDisabled $false
```

**Note**: Organization-wide changes may require admin approval and can take time to propagate.

## Microsoft 365 SMTP Settings

Once SMTP AUTH is enabled, use these settings:

- **SMTP Server**: `smtp.office365.com`
- **Port**: `587` (STARTTLS) or `465` (SSL/TLS)
- **Encryption**: STARTTLS (recommended) or SSL/TLS
- **Authentication**: Required (username and password)
- **Username**: Full email address (e.g., `noreply@onyxdispatch.us`)
- **Password**: Account password or App Password (if MFA is enabled)

## App Passwords (If MFA is Enabled)

If Multi-Factor Authentication (MFA) is enabled on your Microsoft 365 account, you'll need to create an **App Password** instead of using your regular password:

1. **Sign in to Microsoft Account Security**
   - Go to [account.microsoft.com/security](https://account.microsoft.com/security)
   - Or go to [myaccount.microsoft.com](https://myaccount.microsoft.com) → **Security**

2. **Create App Password**
   - Click **Security** → **Advanced security options**
   - Under **App passwords**, click **Create a new app password**
   - Give it a name (e.g., "Lambda SMTP")
   - Copy the generated password (you won't see it again!)

3. **Use App Password in Lambda**
   - Set `SMTP_PASS` environment variable to the app password (not your regular password)

## Testing SMTP Connection

### Using PowerShell

```powershell
# Test SMTP connection
$smtpServer = "smtp.office365.com"
$smtpPort = 587
$username = "noreply@onyxdispatch.us"
$password = "your-password-or-app-password"

$securePassword = ConvertTo-SecureString $password -AsPlainText -Force
$credential = New-Object System.Management.Automation.PSCredential($username, $securePassword)

# Test connection (requires System.Net.Mail)
$smtp = New-Object System.Net.Mail.SmtpClient($smtpServer, $smtpPort)
$smtp.EnableSsl = $true
$smtp.Credentials = $credential

try {
    $smtp.Send("noreply@onyxdispatch.us", "test@example.com", "Test", "Test email")
    Write-Host "SMTP connection successful!" -ForegroundColor Green
} catch {
    Write-Host "SMTP connection failed: $_" -ForegroundColor Red
} finally {
    $smtp.Dispose()
}
```

### Using Node.js (Same as Lambda)

```javascript
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.office365.com',
  port: 587,
  secure: false, // STARTTLS
  auth: {
    user: 'noreply@onyxdispatch.us',
    pass: 'your-password-or-app-password'
  }
});

transporter.verify((error, success) => {
  if (error) {
    console.error('SMTP connection failed:', error);
  } else {
    console.log('SMTP connection successful!');
  }
});
```

## Common Issues

### "Authentication failed" Error

- **Check credentials**: Ensure username and password are correct
- **Check MFA**: If MFA is enabled, use an App Password instead of regular password
- **Check SMTP AUTH**: Verify SMTP AUTH is enabled for the mailbox

### "Connection timeout" Error

- **Check firewall**: Ensure port 587 is not blocked
- **Check network**: Ensure Lambda has internet access
- **Try port 465**: If 587 doesn't work, try port 465 with `secure: true`

### "Relay access denied" Error

- **Check SMTP AUTH**: Ensure SMTP AUTH is enabled
- **Check mailbox permissions**: Ensure the account has permission to send emails
- **Check organization policies**: Ensure no policies are blocking SMTP

## Security Best Practices

1. **Use App Passwords**: If MFA is enabled, always use App Passwords for SMTP
2. **Store Credentials Securely**: Use AWS Secrets Manager or SSM Parameter Store (not hardcoded)
3. **Limit Scope**: Only enable SMTP AUTH for the specific mailbox that needs it
4. **Monitor Usage**: Regularly check email logs for suspicious activity
5. **Rotate Passwords**: Periodically rotate App Passwords

## Next Steps

After verifying SMTP AUTH is enabled:

1. **Set Lambda Environment Variables** in Amplify:
   - `SMTP_USER=noreply@onyxdispatch.us`
   - `SMTP_PASS=<your-password-or-app-password>`
   - `SMTP_HOST=smtp.office365.com` (optional, already default)
   - `SMTP_PORT=587` (optional, already default)
   - `SMTP_SECURE=false` (optional, already default)
   - `SMTP_FROM=noreply@onyxdispatch.us` (optional, already default)

2. **Deploy the Lambda Function** with the updated SMTP configuration

3. **Test the Invitation Email** by sending a test invitation from your app

## References

- [Microsoft 365 SMTP Settings](https://support.microsoft.com/en-us/office/pop-imap-and-smtp-settings-8361e398-8af4-4e97-b147-6c6c4ac95353)
- [Enable or Disable SMTP AUTH](https://learn.microsoft.com/en-us/exchange/clients-and-mobile-in-exchange-online/authenticated-client-smtp-submission)
- [Create App Passwords](https://support.microsoft.com/en-us/account-billing/using-app-passwords-with-apps-that-don-t-support-two-step-verification-5896ed9b-7683-4e55-9f92-76278904cbb0)
