# Subdomain Support - AWS Infrastructure Requirements

## Overview

This document outlines the AWS infrastructure requirements for implementing subdomain-based routing for a multi-tenant passenger booking portal (e.g., `acme-transport.onyxdispatch.us`).

## Current Setup

Your application is currently hosted on AWS Amplify:
- Main branch: `https://main.d1wxo3x0z5r1oq.amplifyapp.com`
- Amplify automatically provides SSL certificates
- CloudFront distribution handles CDN and routing

## Infrastructure Requirements

### 1. Domain Name & DNS Configuration

**What you need:**
- A registered domain (e.g., `onyxdispatch.us`)
- DNS hosting (Route 53 recommended, but any DNS provider works)

**DNS Configuration:**
```
Type: A (or CNAME)
Name: *.onyxdispatch.us (wildcard subdomain)
Value: [Amplify CloudFront distribution URL or ALB endpoint]
TTL: 300 (5 minutes)
```

**Also add:**
```
Type: A (or CNAME)
Name: onyxdispatch.us (root domain)
Value: [Same as above]
```

**Route 53 Setup (Recommended):**
1. Create hosted zone for `onyxdispatch.us`
2. Add wildcard A record: `*.onyxdispatch.us` → Amplify endpoint
3. Add root A record: `onyxdispatch.us` → Amplify endpoint
4. Update domain registrar nameservers to Route 53

**Alternative (External DNS Provider):**
- Add CNAME record: `*.onyxdispatch.us` → `main.d1wxo3x0z5r1oq.amplifyapp.com`
- Add CNAME record: `onyxdispatch.us` → `main.d1wxo3x0z5r1oq.amplifyapp.com`

**Cost:** 
- Route 53: $0.50/month per hosted zone + $0.40 per million queries
- External DNS: Usually free with domain registrar

---

### 2. AWS Amplify Custom Domain Setup

**Steps in Amplify Console:**

1. **Add Custom Domain:**
   - Go to Amplify Console → Your App → Domain Management
   - Click "Add domain"
   - Enter: `onyxdispatch.us`
   - Amplify will verify domain ownership

2. **Configure Subdomain Routing:**
   - Add domain: `onyxdispatch.us`
   - Add subdomain: `*.onyxdispatch.us` (wildcard)
   - Or add individual subdomains as needed

3. **SSL Certificate:**
   - AWS Amplify automatically provisions SSL certificates via AWS Certificate Manager (ACM)
   - Supports wildcard certificates: `*.onyxdispatch.us`
   - Automatic renewal (no manual intervention needed)
   - **Free** (included with Amplify)

**Important Notes:**
- Amplify supports wildcard subdomains
- SSL certificates are automatically managed
- DNS verification required (add CNAME records provided by Amplify)

**Cost:** Free (included with Amplify hosting)

---

### 3. Application Load Balancer (ALB) - Optional

**When needed:**
- If you need more advanced routing rules
- If you want to route to multiple backend services
- If you need path-based routing in addition to subdomain routing

**Current Setup:**
- **Not required** for basic subdomain support
- Amplify + CloudFront handles routing automatically

**If you need ALB:**
- Create ALB in same region as Amplify
- Configure listener rules based on host header
- Point Amplify custom domain to ALB
- **Cost:** ~$16/month + data transfer

**Recommendation:** Start without ALB, add only if needed for advanced routing.

---

### 4. CloudFront Distribution (Already Included)

**Current Status:**
- ✅ Already configured by Amplify
- ✅ Handles CDN and caching
- ✅ Supports custom domains

**What it does:**
- Routes requests based on `Host` header
- Caches static content
- Provides DDoS protection
- Global edge locations

**Configuration:**
- No additional configuration needed
- Amplify manages this automatically

**Cost:** Included with Amplify (first 1TB free, then $0.085/GB)

---

### 5. Application-Level Routing

**What's needed in your React app:**

1. **Extract Subdomain:**
```typescript
// Utility function to get subdomain
export function getSubdomain(): string | null {
  const hostname = window.location.hostname;
  const parts = hostname.split('.');
  
  // Handle: subdomain.onyxdispatch.us
  if (parts.length >= 3) {
    return parts[0];
  }
  
  // Handle: subdomain.localhost (for local dev)
  if (hostname.includes('localhost')) {
    return hostname.split('.')[0] || null;
  }
  
  return null;
}
```

2. **Load Company by Subdomain:**
```typescript
// In booking portal component
const subdomain = getSubdomain();

if (subdomain) {
  const { data: companies } = await client.models.Company.list({
    filter: {
      subdomain: { eq: subdomain },
      isActive: { eq: true },
      bookingEnabled: { eq: true }
    }
  });
  
  const company = companies?.[0];
}
```

3. **React Router Configuration:**
```typescript
// In App.tsx
<Routes>
  <Route path="/booking" element={<BookingPortal />} />
  <Route path="/booking/*" element={<BookingPortal />} />
  {/* ... other routes ... */}
</Routes>
```

**No additional AWS infrastructure needed** - this is application code.

---

### 6. AWS Certificate Manager (ACM) - Automatic

**Current Status:**
- ✅ Automatically used by Amplify
- ✅ No manual configuration needed

**What it does:**
- Provisions SSL certificates for custom domains
- Supports wildcard certificates
- Automatic renewal

**Cost:** Free (included with Amplify)

---

## Complete Setup Process

### Step 1: Domain Registration
1. Register `onyxdispatch.us` (or your chosen domain)
2. Use Route 53 or external registrar

### Step 2: Configure DNS
**Option A - Route 53 (Recommended):**
1. Create hosted zone in Route 53
2. Get nameservers from Route 53
3. Update domain registrar with Route 53 nameservers
4. Add wildcard A record: `*.onyxdispatch.us`

**Option B - External DNS:**
1. Add CNAME: `*.onyxdispatch.us` → `main.d1wxo3x0z5r1oq.amplifyapp.com`
2. Add CNAME: `onyxdispatch.us` → `main.d1wxo3x0z5r1oq.amplifyapp.com`

### Step 3: Configure Amplify Custom Domain
1. Go to Amplify Console → Domain Management
2. Click "Add domain"
3. Enter: `onyxdispatch.us`
4. Add subdomain: `*.onyxdispatch.us` (or individual subdomains)
5. Follow DNS verification steps
6. Wait for SSL certificate provisioning (5-30 minutes)

### Step 4: Update Application Code
1. Add subdomain extraction utility
2. Update booking portal to load company by subdomain
3. Add fallback for code-based access
4. Test with different subdomains

### Step 5: Update Company Records
1. Add `subdomain` field to Company model (already exists)
2. Set subdomain for each company (e.g., "acme-transport")
3. Enable booking portal for companies

---

## Cost Breakdown

### Monthly Costs:

| Service | Cost | Notes |
|---------|------|-------|
| **Domain Registration** | $10-15/year | One-time or annual |
| **Route 53 Hosted Zone** | $0.50/month | If using Route 53 |
| **Route 53 Queries** | $0.40/million | Usually < $1/month |
| **Amplify Custom Domain** | **FREE** | Included |
| **SSL Certificate (ACM)** | **FREE** | Included |
| **CloudFront** | **FREE** (first 1TB) | Included with Amplify |
| **Application Code Changes** | **FREE** | Development time only |

**Total Additional Cost:** ~$0.50-1.50/month (just DNS hosting)

---

## Alternative: Code-Based Approach (No Infrastructure Changes)

**If you want to avoid DNS/domain setup initially:**

Use path-based routing: `onyxdispatch.us/booking/ACME`

**Requirements:**
- ✅ No DNS changes needed
- ✅ No custom domain setup needed
- ✅ Works immediately with current Amplify URL
- ✅ Can add subdomain support later

**Implementation:**
- Add `bookingCode` field to Company model
- Route: `/booking/:code`
- Load company by code
- **Zero infrastructure changes**

**Migration Path:**
1. Launch with code-based routing
2. Add subdomain support later
3. Companies can use either method

---

## Testing Subdomain Support Locally

**For local development:**

1. **Edit `/etc/hosts` (Mac/Linux) or `C:\Windows\System32\drivers\etc\hosts` (Windows):**
```
127.0.0.1 acme-transport.localhost
127.0.0.1 premium-limo.localhost
127.0.0.1 localhost
```

2. **Access:**
- `http://acme-transport.localhost:5173/booking`
- `http://premium-limo.localhost:5173/booking`

3. **Vite Configuration (if needed):**
```typescript
// vite.config.ts
export default defineConfig({
  server: {
    host: '0.0.0.0', // Allow external connections
  },
});
```

---

## Security Considerations

1. **Subdomain Validation:**
   - Verify subdomain exists in database
   - Check company is active
   - Check booking is enabled
   - Prevent subdomain enumeration attacks

2. **Rate Limiting:**
   - Add rate limiting for booking endpoints
   - Prevent abuse/spam
   - Use AWS WAF (optional, $5/month)

3. **CORS Configuration:**
   - Ensure CORS allows subdomain requests
   - Configure allowed origins properly

4. **Data Isolation:**
   - Always filter by `companyId` in queries
   - Never expose data from other companies
   - Validate company context in all operations

---

## Monitoring & Troubleshooting

### Common Issues:

1. **DNS Propagation:**
   - Can take 24-48 hours globally
   - Use `dig *.onyxdispatch.us` to check
   - Route 53 is usually faster (minutes)

2. **SSL Certificate Provisioning:**
   - Takes 5-30 minutes after DNS verification
   - Check ACM console for status
   - Ensure DNS records are correct

3. **Subdomain Not Resolving:**
   - Verify wildcard DNS record exists
   - Check Amplify custom domain configuration
   - Ensure subdomain is added in Amplify console

4. **Application Not Loading Company:**
   - Check subdomain extraction logic
   - Verify company has `subdomain` field set
   - Check database query filters

### Monitoring Tools:

- **Route 53 Health Checks:** Monitor DNS resolution
- **CloudWatch Logs:** Application-level logging
- **Amplify Console:** Build and deployment status
- **ACM Console:** SSL certificate status

---

## Recommended Approach

### Phase 1: Code-Based (Immediate - No Infrastructure)
- Implement `/booking/:code` routing
- Zero AWS infrastructure changes
- Can launch immediately
- **Cost: $0 additional**

### Phase 2: Subdomain Support (Enhanced - Minimal Infrastructure)
- Register domain (if not already owned)
- Configure DNS wildcard
- Add custom domain in Amplify
- Update application code
- **Cost: ~$0.50-1.50/month**

### Phase 3: Custom Domains (Premium Feature)
- Allow companies to use their own domains
- CNAME to Amplify
- SSL via ACM
- **Cost: Same as Phase 2**

---

## Summary

**Minimum Requirements for Subdomain Support:**
1. ✅ Domain name (if not already owned)
2. ✅ DNS wildcard record (`*.yourdomain.com`)
3. ✅ Amplify custom domain configuration
4. ✅ Application code to extract subdomain
5. ✅ Company records with subdomain values

**AWS Services Used:**
- Amplify (already using)
- CloudFront (already included)
- ACM (automatic SSL)
- Route 53 (optional, for DNS)

**Additional Monthly Cost:** ~$0.50-1.50 (just DNS hosting)

**Time to Implement:** 
- DNS setup: 15-30 minutes
- Amplify configuration: 10-15 minutes
- Application code: 2-4 hours
- Testing: 1-2 hours

**Total:** ~4-6 hours of work + DNS propagation time

---

## Next Steps

1. **Decide on domain name** (if not already owned)
2. **Choose DNS provider** (Route 53 recommended)
3. **Configure DNS wildcard record**
4. **Add custom domain in Amplify Console**
5. **Update application code** to extract subdomain
6. **Test with sample subdomains**
7. **Update company records** with subdomain values

Would you like me to help implement the application-level code changes for subdomain support?
