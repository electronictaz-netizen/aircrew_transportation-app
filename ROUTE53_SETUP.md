# Route 53 Setup Guide for AWS Amplify Custom Domain

When AWS Amplify requires Route 53, it means you need to create a hosted zone in Route 53 and point your domain's name servers to Route 53. This guide will walk you through the process.

## Prerequisites

- Your domain registered (can be with any registrar: GoDaddy, Namecheap, etc.)
- AWS account with Route 53 access
- Domain access to update name servers

## Step-by-Step Instructions

### Step 1: Create a Hosted Zone in Route 53

1. **Go to Route 53 Console**
   - Navigate to [AWS Route 53 Console](https://console.aws.amazon.com/route53)
   - Or search for "Route 53" in AWS Console

2. **Create Hosted Zone**
   - Click **"Hosted zones"** in the left sidebar
   - Click **"Create hosted zone"** button

3. **Configure Hosted Zone**
   - **Domain name**: Enter your domain (e.g., `yourcompany.com`)
     - **Important**: Enter the root domain, not a subdomain
   - **Type**: Select **"Public hosted zone"** (unless you need private)
   - **Description** (optional): Add a description like "Amplify App Domain"
   - Click **"Create hosted zone"**

4. **Note the Name Servers**
   - After creation, Route 53 will provide **4 name servers**
   - They look like:
     ```
     ns-123.awsdns-12.com
     ns-456.awsdns-45.net
     ns-789.awsdns-78.org
     ns-012.awsdns-01.co.uk
     ```
   - **Copy these name servers** - you'll need them in the next step
   - You can find them in the hosted zone details under **"Name servers"**

### Step 2: Update Name Servers at Your Domain Registrar

You need to tell your domain registrar to use Route 53's name servers instead of their default ones.

#### For GoDaddy:

1. Log in to [GoDaddy](https://www.godaddy.com)
2. Go to **"My Products"**
3. Find your domain and click **"DNS"** or **"Manage DNS"**
4. Scroll down to **"Nameservers"** section
5. Click **"Change"** or **"Edit"**
6. Select **"Custom"** (not "Default")
7. Delete the existing name servers
8. Add the 4 Route 53 name servers (one per line):
   ```
   ns-123.awsdns-12.com
   ns-456.awsdns-45.net
   ns-789.awsdns-78.org
   ns-012.awsdns-01.co.uk
   ```
9. Click **"Save"**
10. Wait for confirmation

#### For Namecheap:

1. Log in to [Namecheap](https://www.namecheap.com)
2. Go to **"Domain List"**
3. Click **"Manage"** next to your domain
4. Go to **"Advanced DNS"** tab
5. Scroll to **"Nameservers"** section
6. Select **"Custom DNS"**
7. Enter the 4 Route 53 name servers:
   ```
   ns-123.awsdns-12.com
   ns-456.awsdns-45.net
   ns-789.awsdns-78.org
   ns-012.awsdns-01.co.uk
   ```
8. Click the checkmark to save
9. Wait for confirmation

#### For Other Registrars:

The process is similar:
1. Find DNS/Nameserver settings
2. Change from default to custom nameservers
3. Enter the 4 Route 53 name servers
4. Save changes

### Step 3: Wait for Name Server Propagation

1. **Wait 5-30 minutes** (can take up to 48 hours, but usually faster)
2. **Verify propagation** using:
   - [whatsmydns.net](https://www.whatsmydns.net) - Enter your domain and check "NS" records
   - [dnschecker.org](https://dnschecker.org) - Check NS record propagation
3. The name servers should show the Route 53 name servers globally

### Step 4: Verify Hosted Zone in Route 53

1. Go back to Route 53 Console
2. Click on your hosted zone
3. Verify it shows:
   - **4 NS records** (name servers)
   - **1 SOA record** (start of authority)
4. The hosted zone should be **"Active"**

### Step 5: Add Domain in AWS Amplify

Now that Route 53 is set up, you can add the domain in Amplify:

1. **Go to AWS Amplify Console**
   - Navigate to [AWS Amplify Console](https://console.aws.amazon.com/amplify)
   - Select your app

2. **Add Domain**
   - Click **"Domain management"** in left sidebar
   - Click **"Add domain"**
   - Enter your domain (e.g., `yourcompany.com` or `transportation.yourcompany.com`)

3. **Configure Domain**
   - Amplify will detect the Route 53 hosted zone
   - Select your domain from the dropdown
   - Click **"Configure domain"**

4. **SSL Certificate**
   - Amplify will automatically request an SSL certificate
   - This takes 5-30 minutes
   - Wait for status to show "Certificate provisioned"

5. **DNS Records**
   - Amplify will automatically create the necessary DNS records in Route 53
   - You don't need to manually add CNAME records - Amplify does this for you!

6. **Wait for Activation**
   - Domain status will change from "Pending" to "Active"
   - This usually takes 5-30 minutes after SSL certificate is provisioned

## Important Notes

### Using Subdomains

If you want to use a subdomain (e.g., `transportation.yourcompany.com`):

1. **Create hosted zone for root domain** (`yourcompany.com`) - as described above
2. **In Amplify**, you can still use subdomains
3. Amplify will automatically create the necessary DNS records for the subdomain
4. You don't need a separate hosted zone for the subdomain

### Cost Considerations

- **Hosted Zone**: $0.50 per month per hosted zone
- **DNS Queries**: First 1 billion queries per month are free, then $0.40 per million queries
- For most apps, costs are minimal (under $1/month)

### Multiple Domains

If you have multiple domains:
- Create a separate hosted zone for each root domain
- Each hosted zone costs $0.50/month
- Amplify can manage multiple domains

## Troubleshooting

### "Hosted Zone Not Found" Error

**Issue**: Amplify can't find your hosted zone

**Solutions**:
1. Ensure the hosted zone is created for the **root domain** (not subdomain)
2. Verify you're in the correct AWS region (Route 53 is global, but check region settings)
3. Wait a few minutes after creating the hosted zone
4. Refresh the Amplify page

### Name Servers Not Propagating

**Issue**: Name servers still showing old values after 24+ hours

**Solutions**:
1. Double-check name servers are correctly entered at registrar
2. Verify no typos in name server addresses
3. Contact your domain registrar support
4. Some registrars require you to remove all old name servers first

### Domain Status Stays "Pending"

**Issue**: Domain doesn't activate in Amplify

**Solutions**:
1. Verify name servers have propagated (use dnschecker.org)
2. Check Route 53 hosted zone is active
3. Ensure SSL certificate provisioning completed
4. Check Amplify Console for specific error messages
5. Wait up to 48 hours for full propagation

### "Access Denied" When Creating Hosted Zone

**Issue**: Can't create hosted zone due to permissions

**Solutions**:
1. Ensure your AWS user/role has Route 53 permissions:
   - `route53:CreateHostedZone`
   - `route53:GetHostedZone`
   - `route53:ListHostedZones`
2. Contact your AWS administrator to grant permissions
3. Or use an account with Route 53 access

## Quick Checklist

- [ ] Created Route 53 hosted zone for root domain
- [ ] Copied the 4 name servers from Route 53
- [ ] Updated name servers at domain registrar
- [ ] Waited for name server propagation (verified with dnschecker.org)
- [ ] Verified hosted zone is active in Route 53
- [ ] Added domain in Amplify Console
- [ ] Selected the Route 53 hosted zone
- [ ] Waited for SSL certificate provisioning
- [ ] Verified domain status is "Active" in Amplify
- [ ] Tested accessing app via custom domain

## Alternative: Use Existing DNS (Without Route 53)

If you prefer to keep your DNS with your current registrar:

1. **In Amplify**, when adding domain, you may see an option to "Use existing DNS"
2. You'll need to manually add CNAME records at your registrar
3. This is more complex but avoids Route 53 costs

**Note**: Some Amplify configurations require Route 53, so this may not be available in all cases.

## Next Steps

After your domain is set up:

1. **Test the domain**: Access your app via the custom domain
2. **Set up redirects** (if needed): Redirect www to non-www or vice versa
3. **Configure branch mappings**: Map different branches to different subdomains
4. **Monitor**: Check Route 53 metrics for DNS query volume

---

**Need Help?** If you encounter issues, check the troubleshooting section or refer to:
- [AWS Route 53 Documentation](https://docs.aws.amazon.com/route53/)
- [AWS Amplify Custom Domain Documentation](https://docs.aws.amazon.com/amplify/latest/userguide/custom-domains.html)
