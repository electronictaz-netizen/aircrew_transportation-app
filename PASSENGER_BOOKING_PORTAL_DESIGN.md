# Passenger-Facing Booking Portal - Multi-Tenant Design

## Overview

This document outlines different approaches for implementing a passenger-facing booking portal in a multi-tenant environment where multiple transportation companies share the same application infrastructure.

## Current Multi-Tenant Setup

The application already has:
- `Company` model with `subdomain` field (currently not actively used)
- Company-based data isolation (all data scoped by `companyId`)
- User authentication via AWS Cognito
- CompanyUser model linking users to companies

## Design Options

### Option 1: Subdomain-Based Routing (Recommended) ⭐

**How it works:**
- Each company gets a unique subdomain: `company1.onyxdispatch.us`, `company2.onyxdispatch.us`
- Passengers visit their company's subdomain directly
- No code required - URL identifies the company

**Example URLs:**
- `https://acme-transport.onyxdispatch.us/booking`
- `https://premium-limo.onyxdispatch.us/booking`
- `https://airport-shuttle.onyxdispatch.us/booking`

**Implementation:**
1. Add `bookingSubdomain` field to Company model (or use existing `subdomain`)
2. Configure DNS wildcard: `*.onyxdispatch.us` → Amplify app
3. Route handler extracts subdomain and loads company data
4. Booking portal component reads company from context/subdomain

**Pros:**
- ✅ Professional, branded experience
- ✅ Easy to share: "Book at acme-transport.onyxdispatch.us"
- ✅ SEO-friendly (each company has unique URL)
- ✅ Can support custom domains later
- ✅ No codes to remember or share
- ✅ Works well for marketing/website integration

**Cons:**
- ⚠️ Requires DNS configuration
- ⚠️ Slightly more complex routing logic
- ⚠️ Need to handle subdomain validation

**Code Example:**
```typescript
// Extract subdomain from URL
const subdomain = window.location.hostname.split('.')[0];

// Load company by subdomain
const { data: companies } = await client.models.Company.list({
  filter: { 
    subdomain: { eq: subdomain },
    isActive: { eq: true }
  }
});

const company = companies?.[0];
```

---

### Option 2: Path-Based Routing with Company Code

**How it works:**
- Single domain with company code in path: `onyxdispatch.us/booking/ABC123`
- Company code is short, memorable identifier
- Passengers enter code or click link with code

**Example URLs:**
- `https://onyxdispatch.us/booking/ABC123`
- `https://onyxdispatch.us/booking/PREMIUM`
- `https://onyxdispatch.us/booking/ACME`

**Implementation:**
1. Add `bookingCode` field to Company model (unique, short code)
2. Route: `/booking/:code`
3. Booking portal component loads company by code
4. Optional: Allow companies to customize their code

**Pros:**
- ✅ Simple to implement
- ✅ No DNS configuration needed
- ✅ Easy to share via QR code or link
- ✅ Can be memorable (e.g., company initials)

**Cons:**
- ⚠️ Less professional than subdomain
- ⚠️ Code must be remembered/shared
- ⚠️ Risk of code guessing (mitigate with longer codes)
- ⚠️ Less SEO-friendly

**Code Example:**
```typescript
// Get code from URL path
const code = window.location.pathname.split('/booking/')[1];

// Load company by code
const { data: companies } = await client.models.Company.list({
  filter: { 
    bookingCode: { eq: code },
    isActive: { eq: true }
  }
});
```

---

### Option 3: Query Parameter with Company Code

**How it works:**
- Single booking page: `onyxdispatch.us/booking?code=ABC123`
- Code entered in form or passed via URL
- Landing page prompts for code if not provided

**Example URLs:**
- `https://onyxdispatch.us/booking?code=ABC123`
- `https://onyxdispatch.us/booking` (shows code input form)

**Implementation:**
1. Add `bookingCode` field to Company model
2. Route: `/booking` with optional `?code=` parameter
3. If code provided, load company and show booking form
4. If no code, show code input form

**Pros:**
- ✅ Very simple implementation
- ✅ Flexible - can work with or without code
- ✅ Easy to integrate into existing websites
- ✅ Can embed booking widget with code

**Cons:**
- ⚠️ Requires code entry (extra step)
- ⚠️ Less professional appearance
- ⚠️ Codes can be forgotten

**Code Example:**
```typescript
// Get code from query params
const searchParams = new URLSearchParams(window.location.search);
const code = searchParams.get('code');

if (code) {
  // Load company by code
  const { data: companies } = await client.models.Company.list({
    filter: { bookingCode: { eq: code } }
  });
}
```

---

### Option 4: Hybrid Approach (Subdomain + Code Fallback) ⭐⭐

**How it works:**
- Primary: Subdomain routing (`company1.onyxdispatch.us/booking`)
- Fallback: Code-based access (`onyxdispatch.us/booking?code=ABC123`)
- Best of both worlds

**Implementation:**
1. Check for subdomain first
2. If no subdomain, check for code in query params
3. If neither, show company selection/code input

**Pros:**
- ✅ Maximum flexibility
- ✅ Professional for companies with subdomains
- ✅ Accessible for companies without subdomain setup
- ✅ Can migrate companies from code to subdomain

**Cons:**
- ⚠️ More complex routing logic
- ⚠️ Need to handle both scenarios

---

### Option 5: Custom Domain Support (Premium Feature)

**How it works:**
- Companies can use their own domain: `booking.acmetransport.com`
- DNS CNAME points to Amplify app
- App detects custom domain and loads company

**Implementation:**
1. Add `customBookingDomain` field to Company model
2. Configure DNS CNAME: `booking.company.com` → `main.xxxxx.amplifyapp.com`
3. Route handler checks custom domain first, then subdomain, then code
4. Premium tier feature (requires SSL certificate management)

**Pros:**
- ✅ Fully white-labeled experience
- ✅ Maximum brand control
- ✅ Professional appearance
- ✅ Can be premium feature

**Cons:**
- ⚠️ Complex DNS/SSL setup
- ⚠️ Requires customer DNS access
- ⚠️ SSL certificate management
- ⚠️ Best as premium feature

---

## Recommended Implementation: Hybrid Approach

### Phase 1: Code-Based (Quick Launch)
1. Add `bookingCode` field to Company model
2. Implement `/booking?code=XXX` route
3. Generate unique codes for existing companies
4. Allow companies to customize codes in settings

### Phase 2: Subdomain Support (Enhanced Experience)
1. Use existing `subdomain` field or add `bookingSubdomain`
2. Configure wildcard DNS
3. Implement subdomain detection in routing
4. Migrate companies to subdomains

### Phase 3: Custom Domain (Premium Feature)
1. Add `customBookingDomain` field
2. Implement custom domain detection
3. Add to Premium tier features
4. Provide DNS setup instructions

---

## Data Model Changes Needed

```typescript
Company: a.model({
  // ... existing fields ...
  subdomain: a.string(), // Already exists
  bookingCode: a.string(), // NEW: Unique booking code (e.g., "ABC123")
  bookingSubdomain: a.string(), // NEW: Subdomain for booking (e.g., "acme-transport")
  customBookingDomain: a.string(), // NEW: Custom domain (e.g., "booking.acmetransport.com")
  bookingEnabled: a.boolean().default(false), // NEW: Enable/disable booking portal
  bookingSettings: a.string(), // NEW: JSON string with booking configuration
  // ... rest of fields ...
})
```

---

## Booking Portal Features

### Public Access (No Authentication Required)
- View company information
- Get pricing quotes
- Book trips
- Enter flight information
- Select vehicle types
- Choose pickup/dropoff locations

### Optional Customer Account
- Save payment methods
- View booking history
- Modify/cancel bookings
- Rebook favorite trips
- Receive booking confirmations

### Company Configuration
- Enable/disable booking portal
- Set booking code/subdomain
- Configure pricing rules
- Set available vehicle types
- Define service areas
- Customize booking form fields

---

## Security Considerations

1. **Code Uniqueness**: Ensure booking codes are unique and not easily guessable
2. **Rate Limiting**: Prevent abuse of booking endpoints
3. **Input Validation**: Validate all booking form inputs
4. **Company Verification**: Verify company is active and has booking enabled
5. **Data Isolation**: Ensure bookings are properly scoped to company
6. **Spam Protection**: Add CAPTCHA for public booking forms

---

## Implementation Steps

### Step 1: Add Booking Fields to Company Model
```typescript
// In amplify/data/resource.ts
bookingCode: a.string(), // Unique identifier
bookingEnabled: a.boolean().default(false),
bookingSettings: a.string(), // JSON configuration
```

### Step 2: Create Booking Portal Component
- Public route: `/booking/:code?` or `/booking?code=XXX`
- Extract company identifier (code/subdomain)
- Load company data
- Display booking form

### Step 3: Create Booking API/Service
- Validate booking data
- Create Trip record
- Send confirmation emails
- Handle payment (if applicable)

### Step 4: Add Company Settings UI
- Allow companies to enable/disable booking
- Set booking code
- Configure booking settings
- View booking statistics

---

## Example User Flows

### Flow 1: Subdomain Access
1. Passenger visits `acme-transport.onyxdispatch.us/booking`
2. System detects subdomain "acme-transport"
3. Loads ACME Transport company data
4. Shows booking form with company branding
5. Passenger books trip

### Flow 2: Code Access
1. Passenger visits `onyxdispatch.us/booking?code=ACME`
2. System detects code "ACME"
3. Loads ACME Transport company data
4. Shows booking form
5. Passenger books trip

### Flow 3: Code Input
1. Passenger visits `onyxdispatch.us/booking`
2. Sees code input form
3. Enters "ACME"
4. System loads company and shows booking form
5. Passenger books trip

---

## Recommendation

**Start with Option 2 (Path-Based with Code)** for quick implementation, then **migrate to Option 1 (Subdomain)** for better user experience.

**Why:**
- Code-based is fastest to implement
- Can generate codes automatically for all companies
- Easy to test and deploy
- Can add subdomain support later without breaking existing links
- Companies can share: "Book at onyxdispatch.us/booking/ACME"

**Migration Path:**
1. Launch with codes
2. Add subdomain support
3. Allow companies to choose: code, subdomain, or both
4. Eventually make subdomain default for new companies

---

## Questions to Consider

1. **Should booking be available to all companies or premium feature?**
   - Recommendation: Available to all, but advanced features (custom domain, white-label) for premium

2. **Should passengers need to create accounts?**
   - Recommendation: Optional - allow guest booking, but offer account creation for benefits

3. **How to handle payment?**
   - Recommendation: Integrate Stripe for passenger payments, separate from company subscriptions

4. **Should companies be able to customize booking form?**
   - Recommendation: Yes, allow custom fields and branding

5. **How to prevent spam/fake bookings?**
   - Recommendation: CAPTCHA, email verification, rate limiting
