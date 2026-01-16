# GoDaddy ANAME Record Instructions

## Important: GoDaddy Doesn't Support ANAME Records

GoDaddy **does not support** ANAME or ALIAS record types. If AWS Amplify is asking you to add an ANAME record, here are your options:

---

## ✅ Option 1: Use a Subdomain with CNAME (Easiest - Recommended)

**Best Solution**: Use a subdomain like `app.yourcompany.com` or `transportation.yourcompany.com`

### Steps:

1. **In AWS Amplify**:
   - When adding domain, use a subdomain (e.g., `app.yourcompany.com`)
   - Amplify will provide a **CNAME record** (not ANAME)

2. **In GoDaddy DNS**:
   - Go to **"My Products"** → Click **"DNS"** next to your domain
   - Scroll to **"Records"** section
   - Click **"Add"** → Select **"CNAME"**
   - **Name**: `app` (just the subdomain part)
   - **Value**: The CloudFront domain from Amplify (e.g., `d1234567890.cloudfront.net`)
   - **TTL**: 1 Hour
   - Click **"Save"**

3. **Result**: Your app will be accessible at `https://app.yourcompany.com`

---

## ✅ Option 2: Forward Root Domain to Subdomain

If you want `yourcompany.com` to work (not just the subdomain):

1. **First, set up subdomain** (follow Option 1 above)

2. **In GoDaddy DNS**:
   - Scroll to **"Forwarding"** section
   - Click **"Add"** next to "Domain"
   - **Forward from**: `yourcompany.com`
   - **Forward to**: `https://app.yourcompany.com` (your subdomain)
   - **Forward type**: **Permanent (301)**
   - **Settings**: Check **"Forward only"** (important!)
   - Click **"Save"**

3. **Result**: 
   - `yourcompany.com` forwards to `app.yourcompany.com`
   - `app.yourcompany.com` uses CNAME to point to Amplify

---

## ✅ Option 3: Use Route 53 for DNS (Supports ALIAS/ANAME)

If you absolutely need ANAME/ALIAS functionality:

1. **Set up Route 53** (see ROUTE53_SETUP.md):
   - Create hosted zone in Route 53
   - Update name servers at GoDaddy to point to Route 53

2. **In Amplify**:
   - Add domain
   - Select Route 53 hosted zone
   - Amplify will automatically create ALIAS records

3. **Result**: Full ANAME/ALIAS support with Route 53

**Note**: This costs $0.50/month for the hosted zone, but gives you full DNS control.

---

## 📍 Where to Add Records in GoDaddy

### For CNAME Records (Subdomain):

1. Log in to [GoDaddy.com](https://www.godaddy.com)
2. Click **"My Products"** at the top
3. Find your domain → Click **"DNS"** button
4. Scroll to **"Records"** section
5. Click **"Add"** button
6. Select **"CNAME"** from dropdown
7. Enter:
   - **Name**: Your subdomain (e.g., `app`, `transportation`, `www`)
   - **Value**: CloudFront domain from Amplify
   - **TTL**: 1 Hour
8. Click **"Save"**

### For Domain Forwarding (Root Domain):

1. In the same DNS management page
2. Scroll to **"Forwarding"** section (below Records)
3. Click **"Add"** next to "Domain"
4. Enter forwarding details
5. Click **"Save"**

---

## 🚫 What You CANNOT Do in GoDaddy

- ❌ Add ANAME records (not supported)
- ❌ Add ALIAS records (not supported)
- ❌ Use CNAME for root domain (DNS standard limitation, not GoDaddy-specific)

---

## 💡 Recommendation

**Use Option 1 (Subdomain with CNAME)** - It's the easiest and most reliable:
- Simple setup
- No additional costs
- Works immediately
- Most common approach

Example: Use `app.yourcompany.com` or `transportation.yourcompany.com` instead of just `yourcompany.com`

---

## Need Help?

If you're still having issues:
1. Check what record type Amplify is asking for
2. If it's ANAME/ALIAS, use one of the options above
3. If it's CNAME, follow the CNAME instructions
4. Consider using Route 53 if you need advanced DNS features
