# Custom Domain Setup Guide for AWS Amplify

This guide will walk you through setting up a custom domain for your Onyx Transportation App in AWS Amplify.

## Prerequisites

- Your domain registered with a domain registrar (e.g., GoDaddy, Namecheap, Route 53, etc.)
- Access to your domain's DNS management panel
- AWS Amplify app already deployed

## Step-by-Step Instructions

### Step 1: Access Domain Management in Amplify

1. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify)
2. Select your app (e.g., "aircrew-transportation-app")
3. In the left sidebar, click on **"Domain management"**
4. Click the **"Add domain"** button

### Step 2: Enter Your Domain

1. Enter your domain name (e.g., `transportation.yourcompany.com` or `app.yourcompany.com`)
   - **Note**: You can use either:
     - A subdomain (recommended): `transportation.yourcompany.com`
     - The root domain: `yourcompany.com` (requires additional DNS configuration)
   
2. Click **"Configure domain"**

### Step 3: Choose Domain Configuration

Amplify will offer two options:

#### Option A: Subdomain (Recommended)
- Use a subdomain like `transportation.yourcompany.com` or `app.yourcompany.com`
- Easier to set up
- Doesn't affect your main website

#### Option B: Root Domain
- Use your root domain like `yourcompany.com`
- Requires more DNS configuration
- May affect your existing website

**Recommendation**: Use a subdomain for easier setup.

### Step 4: SSL Certificate Provisioning

1. Amplify will automatically request an SSL certificate from AWS Certificate Manager (ACM)
2. This process takes **5-30 minutes**
3. You'll see a status indicator showing "Certificate provisioning..."
4. **Wait for this to complete** before proceeding

### Step 5: Configure DNS Records

Once the certificate is provisioned, Amplify will provide DNS records you need to add:

#### For Subdomain Setup:

You'll see something like:
```
Type: CNAME
Name: transportation (or your subdomain)
Value: d1234567890.cloudfront.net
```

**Steps to add DNS record:**

1. Log in to your domain registrar's DNS management panel
2. Find the DNS settings for your domain
3. Add a new CNAME record:
   - **Name/Host**: `transportation` (or your subdomain name)
   - **Value/Target**: The CloudFront domain provided by Amplify (e.g., `d1234567890.cloudfront.net`)
   - **TTL**: 3600 (or use default)
4. Save the record

#### For Root Domain Setup:

You'll need to add:
- An **A record** or **ALIAS record** pointing to Amplify's CloudFront distribution
- The exact records will be provided by Amplify

**Important**: Some registrars (like GoDaddy) require you to use their specific format. Follow your registrar's instructions.

### Step 6: Wait for DNS Propagation

1. After adding the DNS record, wait for DNS propagation
2. This typically takes:
   - **5-30 minutes** for most cases
   - **Up to 48 hours** in rare cases (usually much faster)
3. You can check propagation status using tools like:
   - [whatsmydns.net](https://www.whatsmydns.net)
   - [dnschecker.org](https://dnschecker.org)

### Step 7: Verify Domain Connection

1. In Amplify Console, go back to **"Domain management"**
2. You should see the domain status change from "Pending" to "Active"
3. Once active, your app will be accessible at your custom domain

### Step 8: Configure Branch Mapping (Optional)

If you have multiple branches (e.g., `main`, `staging`):

1. In Domain management, click on your domain
2. Click **"Manage subdomains"**
3. Map branches to subdomains:
   - `main` branch → `transportation.yourcompany.com`
   - `staging` branch → `staging.yourcompany.com` (if you want)

## Common DNS Provider Instructions

### GoDaddy

1. Log in to GoDaddy
2. Go to **"My Products"** → **"DNS"**
3. Click **"Add"** under Records
4. Select **"CNAME"**
5. Enter:
   - **Name**: `transportation` (or your subdomain)
   - **Value**: The CloudFront domain from Amplify
   - **TTL**: 1 Hour
6. Click **"Save"**

### Namecheap

1. Log in to Namecheap
2. Go to **"Domain List"** → Select your domain → **"Advanced DNS"**
3. Click **"Add New Record"**
4. Select **"CNAME Record"**
5. Enter:
   - **Host**: `transportation` (or your subdomain)
   - **Value**: The CloudFront domain from Amplify
   - **TTL**: Automatic
6. Click the checkmark to save

### Route 53 (AWS)

1. Go to [Route 53 Console](https://console.aws.amazon.com/route53)
2. Select your hosted zone
3. Click **"Create record"**
4. Enter:
   - **Record name**: `transportation` (or your subdomain)
   - **Record type**: CNAME
   - **Value**: The CloudFront domain from Amplify
5. Click **"Create records"**

### Cloudflare

1. Log in to Cloudflare
2. Select your domain
3. Go to **"DNS"** → **"Records"**
4. Click **"Add record"**
5. Enter:
   - **Type**: CNAME
   - **Name**: `transportation` (or your subdomain)
   - **Target**: The CloudFront domain from Amplify
   - **Proxy status**: DNS only (gray cloud) - **Important**: Don't proxy CloudFront
6. Click **"Save"**

## Troubleshooting

### Domain Status Stays "Pending"

**Issue**: Domain status doesn't change to "Active"

**Solutions**:
1. Verify DNS record is correctly added
2. Check DNS propagation using [whatsmydns.net](https://www.whatsmydns.net)
3. Ensure CNAME value matches exactly (no trailing dots or spaces)
4. Wait up to 48 hours for full propagation
5. Check your DNS provider's documentation for any special requirements

### SSL Certificate Fails

**Issue**: SSL certificate provisioning fails

**Solutions**:
1. Ensure DNS records are correctly configured
2. Verify domain ownership (Amplify does this automatically via DNS)
3. Check that your domain registrar allows CNAME records
4. Contact AWS Support if issues persist

### Domain Not Resolving

**Issue**: Custom domain doesn't load the app

**Solutions**:
1. Check DNS propagation status
2. Verify CNAME record is correct
3. Clear your browser cache
4. Try accessing from a different network/device
5. Check Amplify Console for any error messages

### "Domain Already in Use" Error

**Issue**: Amplify says domain is already configured

**Solutions**:
1. Check if domain is used in another Amplify app
2. Remove domain from the other app first
3. Or use a different subdomain

## Best Practices

1. **Use Subdomains**: Easier to manage and doesn't affect your main website
2. **Wait for Propagation**: Be patient - DNS changes can take time
3. **Keep Records**: Save the DNS records Amplify provides for reference
4. **Test First**: Test with a subdomain before using your root domain
5. **Monitor Status**: Check Amplify Console regularly for domain status updates

## Additional Resources

- [AWS Amplify Custom Domain Documentation](https://docs.aws.amazon.com/amplify/latest/userguide/custom-domains.html)
- [AWS Certificate Manager Documentation](https://docs.aws.amazon.com/acm/)
- [DNS Propagation Checker](https://www.whatsmydns.net)

## Quick Checklist

- [ ] Domain registered with a registrar
- [ ] Access to DNS management panel
- [ ] Added domain in Amplify Console
- [ ] SSL certificate provisioned (wait 5-30 minutes)
- [ ] Added CNAME record in DNS provider
- [ ] Waited for DNS propagation (5-30 minutes)
- [ ] Verified domain is "Active" in Amplify
- [ ] Tested accessing app via custom domain

---

**Need Help?** If you encounter issues, check the troubleshooting section above or refer to AWS Amplify documentation.
