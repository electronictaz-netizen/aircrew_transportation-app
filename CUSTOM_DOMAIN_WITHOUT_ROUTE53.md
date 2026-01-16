# Custom Domain Setup Without Route 53 (Using Existing DNS)

This guide shows you how to set up a custom domain in AWS Amplify using your existing DNS provider (GoDaddy, Namecheap, etc.) without needing to set up Route 53.

## Prerequisites

- Domain registered with a registrar (GoDaddy, Namecheap, etc.)
- Access to your domain's DNS management panel
- AWS Amplify app already deployed

## Step-by-Step Instructions

### Step 1: Add Domain in AWS Amplify

1. **Go to AWS Amplify Console**
   - Navigate to [AWS Amplify Console](https://console.aws.amazon.com/amplify)
   - Select your app

2. **Access Domain Management**
   - Click **"Domain management"** in the left sidebar
   - Click **"Add domain"** button

3. **Enter Your Domain**
   - Enter your domain name (e.g., `transportation.yourcompany.com` or `yourcompany.com`)
   - Click **"Configure domain"**

4. **Choose DNS Provider**
   - Amplify will ask about your DNS provider
   - Select **"I'll use my existing DNS provider"** or **"Use existing DNS"**
   - This option may appear as a toggle or checkbox
   - If you don't see this option, you may need to use Route 53 (see ROUTE53_SETUP.md)

### Step 2: Get DNS Records from Amplify

After selecting "Use existing DNS", Amplify will provide you with DNS records to add:

1. **Note the Records Provided**
   - Amplify will show you one or more DNS records
   - Typically, you'll see:
     - **CNAME record** for subdomains
     - **A record** or **ALIAS record** for root domains
   - The record will look like:
     ```
     Type: CNAME
     Name: transportation (or your subdomain)
     Value: d1234567890.cloudfront.net
     ```
   - **Copy these values** - you'll need them in the next step

2. **Wait for SSL Certificate**
   - Amplify will start provisioning an SSL certificate
   - This takes 5-30 minutes
   - The domain status will show "Certificate provisioning..."
   - **You can add DNS records while waiting**, but the domain won't work until both are complete

### Step 3: Add DNS Records at Your Registrar

Now you need to add the DNS records at your domain registrar. The steps vary by provider:

---

## Detailed Instructions by DNS Provider

### GoDaddy

**Important Note**: GoDaddy does NOT support ANAME or ALIAS records. If Amplify is asking for an ANAME record, you have these options:

#### Option A: Use a Subdomain (Recommended - Easiest)

1. **Log in to GoDaddy**
   - Go to [GoDaddy.com](https://www.godaddy.com)
   - Sign in to your account

2. **Access DNS Management**
   - Click **"My Products"** at the top
   - Find your domain in the list
   - Click **"DNS"** button next to your domain
   - Or click the three dots (⋯) → **"Manage DNS"**

3. **Add CNAME Record**
   - Scroll down to the **"Records"** section
   - Click **"Add"** button
   - Select **"CNAME"** from the dropdown

4. **Enter Record Details**
   - **Name**: Enter your subdomain (e.g., `transportation` or `app`)
     - **Important**: 
       - For subdomain `transportation.yourcompany.com`, enter just `transportation`
       - Don't include the full domain name
       - Don't include a trailing dot
   - **Value**: Paste the CloudFront domain from Amplify (e.g., `d1234567890.cloudfront.net`)
     - **Important**: 
       - Include the full CloudFront domain
       - Don't add `http://` or `https://`
       - Don't add a trailing dot
   - **TTL**: Select **"1 Hour"** (or use default)

5. **Save the Record**
   - Click **"Save"** or **"Add Record"**
   - The record should appear in your DNS records list

6. **Verify the Record**
   - Check that the record shows:
     - Correct name (subdomain)
     - Correct value (CloudFront domain)
     - Type: CNAME

#### Option B: Use Root Domain with Domain Forwarding

If you MUST use the root domain (`yourcompany.com`) instead of a subdomain:

1. **Set up subdomain first** (follow Option A above for `www` or `app` subdomain)

2. **Set up Domain Forwarding in GoDaddy**
   - In GoDaddy DNS management, scroll to **"Forwarding"** section
   - Click **"Add"** next to "Domain"
   - Enter:
     - **Forward from**: `yourcompany.com` (root domain)
     - **Forward to**: `https://www.yourcompany.com` (or your subdomain)
     - **Forward type**: Select **"Permanent (301)"**
     - **Settings**: Check **"Forward only"** (don't forward with masking)
   - Click **"Save"**

3. **Note**: This forwards the root domain to your subdomain, which then uses CNAME to point to Amplify

#### Option C: Use Route 53 (Supports ALIAS/ANAME)

If you need true ANAME/ALIAS support for root domain:
- Follow the Route 53 setup guide (ROUTE53_SETUP.md)
- Route 53 supports ALIAS records which work like ANAME
- You can keep GoDaddy as registrar but use Route 53 for DNS

---

### Namecheap

1. **Log in to Namecheap**
   - Go to [Namecheap.com](https://www.namecheap.com)
   - Sign in to your account

2. **Access DNS Management**
   - Go to **"Domain List"** from the left sidebar
   - Find your domain and click **"Manage"** button
   - Click on **"Advanced DNS"** tab

3. **Add CNAME Record**
   - Scroll down to **"Host Records"** section
   - Click **"Add New Record"** button
   - Select **"CNAME Record"** from the type dropdown

4. **Enter Record Details**
   - **Host**: Enter your subdomain (e.g., `transportation`)
     - **Important**: Just the subdomain part, not the full domain
   - **Value**: Paste the CloudFront domain from Amplify (e.g., `d1234567890.cloudfront.net`)
   - **TTL**: Select **"Automatic"** or **"30 min"**

5. **Save the Record**
   - Click the checkmark (✓) to save
   - The record should appear in the Host Records list

6. **Verify the Record**
   - Ensure the record shows:
     - Type: CNAME
     - Host: your subdomain
     - Value: CloudFront domain

---

### Cloudflare

1. **Log in to Cloudflare**
   - Go to [Cloudflare.com](https://www.cloudflare.com)
   - Sign in to your account

2. **Select Your Domain**
   - Click on your domain from the dashboard

3. **Access DNS Settings**
   - Click on **"DNS"** in the top navigation
   - Or go to **"DNS"** → **"Records"**

4. **Add CNAME Record**
   - Click **"Add record"** button
   - Select **"CNAME"** from the type dropdown

5. **Enter Record Details**
   - **Name**: Enter your subdomain (e.g., `transportation`)
     - **Important**: Just the subdomain, not the full domain
   - **Target**: Paste the CloudFront domain from Amplify (e.g., `d1234567890.cloudfront.net`)
   - **Proxy status**: Click to turn OFF (gray cloud) - **CRITICAL**: Must be DNS only
     - **Why**: CloudFront doesn't work with Cloudflare's proxy
     - The cloud icon should be gray, not orange
   - **TTL**: Select **"Auto"** or specific time

6. **Save the Record**
   - Click **"Save"**
   - The record should appear in the DNS records list

7. **Verify Proxy is OFF**
   - Check that the cloud icon next to your CNAME record is **gray** (not orange)
   - If it's orange, click it to turn off the proxy

---

### Google Domains

1. **Log in to Google Domains**
   - Go to [domains.google.com](https://domains.google.com)
   - Sign in to your account

2. **Access DNS Settings**
   - Click on your domain
   - Click **"DNS"** in the left sidebar

3. **Add CNAME Record**
   - Scroll to **"Custom resource records"** section
   - Click **"Manage custom records"**

4. **Enter Record Details**
   - Click **"Add new record"**
   - **Name**: Enter your subdomain (e.g., `transportation`)
   - **Type**: Select **"CNAME"**
   - **Data**: Paste the CloudFront domain from Amplify (e.g., `d1234567890.cloudfront.net`)
   - **TTL**: Use default or set to 3600

5. **Save the Record**
   - Click **"Save"**
   - The record should appear in your custom records

---

### AWS Route 53 (If You Have It)

If you already have Route 53 but want to manually manage records:

1. **Go to Route 53 Console**
   - Navigate to [Route 53 Console](https://console.aws.amazon.com/route53)
   - Click **"Hosted zones"**

2. **Select Your Hosted Zone**
   - Click on your domain's hosted zone

3. **Create Record**
   - Click **"Create record"**

4. **Enter Record Details**
   - **Record name**: Enter your subdomain (e.g., `transportation`)
   - **Record type**: Select **"CNAME - Routes traffic to another domain name"**
   - **Value**: Paste the CloudFront domain from Amplify (e.g., `d1234567890.cloudfront.net`)
   - **TTL**: 300 (or your preference)

5. **Save the Record**
   - Click **"Create records"**

---

## For Root Domain (yourcompany.com)

If you want to use the root domain instead of a subdomain:

### Option 1: Use ALIAS Record (Route 53 Only)

If using Route 53:
- Create an **ALIAS record** (not CNAME) pointing to the CloudFront distribution
- Amplify will provide the ALIAS target

### Option 2: Use A Record (Other Providers)

For other DNS providers:
1. Amplify may provide an **A record** instead of CNAME
2. Add the A record with the IP address provided by Amplify
3. **Note**: This is less flexible than CNAME and may require updates if IPs change

### Option 3: Use Subdomain (Recommended)

**Best Practice**: Use a subdomain like `app.yourcompany.com` or `transportation.yourcompany.com`
- Easier to set up
- Doesn't affect your main website
- More flexible

---

## Step 4: Wait for DNS Propagation

1. **Wait for DNS Changes**
   - DNS changes typically take **5-30 minutes** to propagate
   - Can take up to **48 hours** in rare cases (usually much faster)

2. **Verify DNS Propagation**
   - Use [whatsmydns.net](https://www.whatsmydns.net)
     - Enter your domain (e.g., `transportation.yourcompany.com`)
     - Select **"CNAME"** record type
     - Check if it shows your CloudFront domain globally
   - Or use [dnschecker.org](https://dnschecker.org)
     - Enter your domain
     - Select **"CNAME"** record type
     - Verify it resolves to the CloudFront domain

3. **Check Amplify Status**
   - Go back to Amplify Console → **"Domain management"**
   - Check the domain status
   - It should change from "Pending" to "Active" once:
     - DNS records are propagated
     - SSL certificate is provisioned

---

## Step 5: Verify Domain is Active

1. **Check Amplify Console**
   - Domain status should show **"Active"** (green checkmark)
   - If still "Pending", wait a bit longer

2. **Test Your Domain**
   - Open a browser
   - Navigate to your custom domain (e.g., `https://transportation.yourcompany.com`)
   - Your app should load
   - Check that the SSL certificate is valid (lock icon in browser)

3. **Verify SSL Certificate**
   - Click the lock icon in your browser's address bar
   - Should show "Connection is secure"
   - Certificate should be issued by AWS Certificate Manager

---

## Troubleshooting

### DNS Record Not Working

**Issue**: Domain doesn't resolve or shows wrong content

**Solutions**:
1. **Verify CNAME Record**:
   - Check the record name is correct (just subdomain, not full domain)
   - Check the value is the exact CloudFront domain from Amplify
   - Ensure no typos or extra spaces

2. **Check DNS Propagation**:
   - Use [whatsmydns.net](https://www.whatsmydns.net) to verify
   - Wait longer if propagation is still in progress

3. **Clear DNS Cache**:
   - Windows: `ipconfig /flushdns` in Command Prompt
   - Mac: `sudo dscacheutil -flushcache` in Terminal
   - Or use a different network/device

### SSL Certificate Issues

**Issue**: SSL certificate not provisioning or invalid

**Solutions**:
1. **Wait for Certificate**:
   - SSL certificate provisioning takes 5-30 minutes
   - Check Amplify Console for certificate status

2. **Verify DNS Records**:
   - Certificate validation requires DNS records to be correct
   - Ensure CNAME record is properly configured

3. **Check Certificate Status**:
   - In Amplify Console, check domain details
   - Look for any certificate errors

### Cloudflare Proxy Issues

**Issue**: Domain doesn't work with Cloudflare

**Solutions**:
1. **Turn OFF Proxy**:
   - The cloud icon must be **gray** (DNS only)
   - Orange cloud means proxy is ON (will break CloudFront)

2. **Verify Settings**:
   - Go to Cloudflare DNS settings
   - Ensure CNAME record has proxy disabled
   - Wait for changes to propagate

### "Domain Already in Use" Error

**Issue**: Amplify says domain is already configured

**Solutions**:
1. **Check Other Apps**:
   - Domain might be used in another Amplify app
   - Remove it from the other app first

2. **Check Route 53**:
   - If domain was previously in Route 53, remove old records
   - Or use a different subdomain

### Domain Status Stays "Pending"

**Issue**: Domain doesn't activate after 24+ hours

**Solutions**:
1. **Verify DNS Records**:
   - Double-check CNAME record is correct
   - Verify DNS propagation globally

2. **Check Certificate**:
   - Ensure SSL certificate provisioning completed
   - Look for any certificate errors in Amplify

3. **Contact Support**:
   - If all else fails, contact AWS Support
   - Provide domain name and error messages

---

## Quick Checklist

- [ ] Added domain in Amplify Console
- [ ] Selected "Use existing DNS" option
- [ ] Copied CNAME record from Amplify
- [ ] Added CNAME record at domain registrar
- [ ] Verified record details (name and value are correct)
- [ ] For Cloudflare: Turned OFF proxy (gray cloud)
- [ ] Waited for DNS propagation (verified with whatsmydns.net)
- [ ] Waited for SSL certificate provisioning (5-30 minutes)
- [ ] Verified domain status is "Active" in Amplify
- [ ] Tested accessing app via custom domain
- [ ] Verified SSL certificate is valid (lock icon in browser)

---

## Important Notes

1. **CNAME Record Format**:
   - **Name**: Just the subdomain (e.g., `transportation`)
   - **Value**: Full CloudFront domain (e.g., `d1234567890.cloudfront.net`)
   - No trailing dots, no `http://` or `https://`

2. **Cloudflare Users**:
   - **MUST** turn off proxy (gray cloud)
   - CloudFront doesn't work with Cloudflare's proxy enabled

3. **Root Domain**:
   - Using root domain is more complex
   - Consider using a subdomain instead

4. **Propagation Time**:
   - Be patient - DNS changes take time
   - Use DNS checker tools to verify

---

**Need Help?** If you encounter issues:
1. Check the troubleshooting section above
2. Verify DNS records using [whatsmydns.net](https://www.whatsmydns.net)
3. Check Amplify Console for specific error messages
4. Refer to your DNS provider's documentation
