# Routing: Main App vs Booking Portal

## Key Distinction

**Main App (Management/Driver Dashboards):**
- ✅ **No code/subdomain routing needed** - Company determined by authentication
- Users log in → App looks up their `CompanyUser` record → Finds company automatically

**Booking Portal (Public):**
- ✅ **Code/subdomain routing needed** - Company determined by URL
- No authentication required → Need to identify company from URL

---

## Current Main App Flow

### How Company is Determined (No Routing Needed)

1. **User logs in** via AWS Cognito
2. **App loads user's company** via `CompanyUser` lookup:
   ```typescript
   // In CompanyContext.tsx
   const { data: companyUsers } = await client.models.CompanyUser.list({
     filter: { 
       userId: { eq: user.userId },
       isActive: { eq: true }
     }
   });
   ```
3. **Company is automatically determined** from the authenticated user's record
4. **User sees their company's dashboard** - no code needed

### Current URLs:
- `https://main.d1wxo3x0z5r1oq.amplifyapp.com/management`
- `https://main.d1wxo3x0z5r1oq.amplifyapp.com/driver`
- All users go to the same URL, company is determined by authentication

---

## Optional: Code/Subdomain Routing for Main App

While **not required**, you could add code/subdomain routing to the main app for:

### Benefits:

1. **Branded Login Pages:**
   - `acme-transport.onyxdispatch.us/login` → Shows ACME branding
   - `premium-limo.onyxdispatch.us/login` → Shows Premium Limo branding
   - Better user experience, feels more professional

2. **Direct Company Links:**
   - Companies can share: "Login at acme-transport.onyxdispatch.us"
   - Easier for users to remember their company's URL
   - Reduces confusion about which app to use

3. **Pre-select Company Context:**
   - If user belongs to multiple companies, pre-select based on subdomain
   - Faster access to the right company

4. **Marketing/Branding:**
   - Each company gets their own branded URL
   - Can customize login page per company
   - More professional appearance

### Implementation (If Desired):

**Option 1: Subdomain-Based Login**
```
acme-transport.onyxdispatch.us/login
→ Extract subdomain "acme-transport"
→ Load company by subdomain
→ Show branded login page
→ After login, verify user belongs to this company
```

**Option 2: Code-Based Login**
```
onyxdispatch.us/login?code=ACME
→ Extract code "ACME"
→ Load company by code
→ Show branded login page
→ After login, verify user belongs to this company
```

**Code Example:**
```typescript
// In login component
const subdomain = getSubdomain(); // or code from URL

if (subdomain) {
  // Load company for branding
  const { data: companies } = await client.models.Company.list({
    filter: { subdomain: { eq: subdomain } }
  });
  
  const company = companies?.[0];
  
  // Show branded login page with company logo/colors
  // After login, verify user belongs to this company
}
```

### Security Consideration:
- **Must verify** user belongs to company after login
- Don't trust subdomain/code alone for authentication
- Always check `CompanyUser` relationship

---

## Booking Portal Flow (Requires Routing)

### Why Routing is Needed:

1. **No Authentication Required:**
   - Booking portal is public
   - Anyone can access it
   - Need to identify company before user logs in

2. **Company Identification:**
   - Must know which company's booking form to show
   - Must know pricing rules, vehicle types, etc.
   - Must know where to send booking confirmation

### Implementation:

**Option 1: Subdomain**
```
acme-transport.onyxdispatch.us/booking
→ Extract subdomain "acme-transport"
→ Load company by subdomain
→ Show booking form for that company
```

**Option 2: Code**
```
onyxdispatch.us/booking/ACME
→ Extract code "ACME"
→ Load company by code
→ Show booking form for that company
```

---

## Comparison Table

| Feature | Main App | Booking Portal |
|---------|----------|----------------|
| **Authentication Required** | ✅ Yes | ❌ No |
| **Company Determined By** | User's `CompanyUser` record | URL (subdomain/code) |
| **Routing Needed** | ❌ Optional (for branding) | ✅ Required |
| **Current Implementation** | Works without routing | Needs routing |
| **Security** | Verified by auth | Must validate company exists |

---

## Recommended Approach

### For Main App:
**Keep current approach (no routing required):**
- ✅ Already works perfectly
- ✅ Simpler architecture
- ✅ No additional infrastructure needed
- ✅ Company automatically determined by authentication

**Optional Enhancement (Future):**
- Add subdomain routing for branded login pages
- Pre-select company based on subdomain
- Still verify user belongs to company after login

### For Booking Portal:
**Implement routing (required):**
- ✅ Code-based: `/booking/ACME` (quick to implement)
- ✅ Subdomain-based: `acme-transport.onyxdispatch.us/booking` (better UX)
- ✅ Hybrid: Support both methods

---

## Implementation Scenarios

### Scenario 1: Main App Only (Current)
```
User visits: onyxdispatch.us/login
→ Logs in
→ App looks up CompanyUser
→ Shows their company's dashboard
✅ No routing needed
```

### Scenario 2: Main App with Subdomain (Optional)
```
User visits: acme-transport.onyxdispatch.us/login
→ Sees ACME-branded login page
→ Logs in
→ App verifies user belongs to ACME
→ Shows ACME dashboard
⚠️ Routing needed for branding only
```

### Scenario 3: Booking Portal (Required)
```
User visits: acme-transport.onyxdispatch.us/booking
→ App extracts subdomain "acme-transport"
→ Loads ACME company data
→ Shows ACME booking form
→ User books (no login required)
✅ Routing required
```

### Scenario 4: Booking Portal with Code (Required)
```
User visits: onyxdispatch.us/booking/ACME
→ App extracts code "ACME"
→ Loads ACME company data
→ Shows ACME booking form
→ User books (no login required)
✅ Routing required
```

---

## Code Structure

### Current Main App (No Routing):
```typescript
// App.tsx
<Routes>
  <Route path="/login" element={<Login />} />
  <Route path="/management" element={<ManagementDashboard />} />
  <Route path="/driver" element={<DriverDashboard />} />
</Routes>

// CompanyContext.tsx
// Automatically loads company from authenticated user
const company = await loadUserCompany(); // Based on CompanyUser record
```

### Main App with Subdomain (Optional):
```typescript
// App.tsx
<Routes>
  <Route path="/login" element={<BrandedLogin />} />
  <Route path="/management" element={<ManagementDashboard />} />
</Routes>

// BrandedLogin.tsx
const subdomain = getSubdomain();
const company = await loadCompanyBySubdomain(subdomain);
// Show branded login, then verify user belongs to company after login
```

### Booking Portal (Required):
```typescript
// App.tsx
<Routes>
  <Route path="/booking/:code?" element={<BookingPortal />} />
  <Route path="/booking" element={<BookingPortal />} />
</Routes>

// BookingPortal.tsx
const code = useParams().code || getCodeFromURL();
const company = await loadCompanyByCode(code);
// Show booking form for this company
```

---

## Summary

### Main App:
- **Current:** No routing needed ✅
- **Optional:** Add subdomain routing for branded login pages
- **Company determined by:** Authentication (CompanyUser record)

### Booking Portal:
- **Required:** Routing needed ✅
- **Company determined by:** URL (subdomain or code)
- **No authentication:** Public access

### Recommendation:
1. **Keep main app as-is** (no routing needed)
2. **Add routing to booking portal** (required)
3. **Optionally add branded login** later (nice-to-have)

---

## Questions to Consider

1. **Do companies want branded login pages?**
   - If yes: Add subdomain routing to main app
   - If no: Keep current approach

2. **Do companies want their own URLs?**
   - If yes: Implement subdomain routing
   - If no: Code-based is sufficient

3. **Priority:**
   - **High:** Booking portal routing (required)
   - **Low:** Main app routing (optional, for branding)

---

## Next Steps

1. **Implement booking portal routing** (required)
   - Start with code-based: `/booking/:code`
   - Add subdomain support later

2. **Keep main app as-is** (works fine without routing)
   - Company determined by authentication
   - No changes needed

3. **Consider branded login** (optional future enhancement)
   - Add subdomain detection to login page
   - Show company branding
   - Verify user belongs to company after login
