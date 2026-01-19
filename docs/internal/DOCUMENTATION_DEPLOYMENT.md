# Documentation Deployment Guide

## Overview

This guide explains where and how to make user documentation available to your customers.

## Documentation Status

### ✅ Updated Documentation

All documentation has been updated with recent changes:

1. **SUBSCRIPTION_AND_TRIAL_GUIDE.md** - NEW comprehensive guide covering:
   - Free trial system (14-day trial)
   - Subscription plans (Free, Basic, Premium)
   - Feature access by plan
   - Subscription management
   - FAQ

2. **COMPANY_ONBOARDING_GUIDE.md** - Updated with:
   - Free trial sign-up process
   - Subscription management instructions
   - Links to subscription guide

3. **MANAGER_USER_GUIDE.md** - Updated with:
   - Subscription management section
   - Feature gating information
   - Plan-based feature access

4. **README.md** (main) - Updated with:
   - Subscription and trial information
   - Plan details

5. **docs/README.md** - Updated with:
   - Link to subscription guide
   - Updated documentation index

---

## Where to Make Documentation Available

### Option 1: In-App Help (Recommended)

**Best for**: Quick access, contextual help, reduced support requests

**Implementation**:
- Add a "Help" or "Documentation" link in the navigation
- Create a help modal or page that links to documentation
- Add contextual help tooltips throughout the app
- Link from trial banner to subscription guide

**Location in App**:
- Navigation menu
- Footer
- Trial banner (link to subscription guide)
- Subscription Management page (link to subscription guide)

**Files to Host**:
- Convert markdown to HTML or use a markdown viewer
- Host in `public/docs/` folder
- Or link to external documentation site

### Option 2: Marketing Website (tazsoftware.biz)

**Best for**: Public access, SEO, marketing

**Implementation**:
- Add a "Documentation" or "Help" section to your website
- Create a `/docs` or `/help` page
- Link from main navigation
- Include in footer

**Recommended Pages**:
- `/docs` - Main documentation index
- `/docs/getting-started` - Quick start guide
- `/docs/subscription` - Subscription and trial guide
- `/docs/user-guide` - Manager user guide
- `/docs/driver-guide` - Driver user guide

**Benefits**:
- Publicly accessible (no login required)
- Good for SEO
- Can be shared via email
- Professional appearance

### Option 3: GitHub Pages or Documentation Site

**Best for**: Version control, easy updates, professional hosting

**Options**:
- **GitHub Pages**: Free hosting for markdown documentation
- **GitBook**: Professional documentation platform
- **Read the Docs**: Open-source documentation hosting
- **Notion**: Easy-to-use documentation platform

**Setup**:
1. Create a separate repository for documentation
2. Use a static site generator (Jekyll, Hugo, Docusaurus)
3. Deploy to GitHub Pages or similar
4. Link from app and website

### Option 4: Email Distribution

**Best for**: Onboarding, direct communication

**Implementation**:
- Send documentation PDFs during onboarding
- Include links to online documentation
- Attach quick reference guides
- Send updates when documentation changes

**When to Use**:
- Initial company onboarding
- New user invitations
- Feature announcements
- Subscription reminders

### Option 5: Shared Drive (Google Drive, Dropbox)

**Best for**: Internal teams, controlled access

**Implementation**:
- Upload documentation PDFs to shared drive
- Organize by role (Managers, Drivers, Admins)
- Share folder with new companies
- Update files as needed

**Best For**:
- Companies that prefer file-based documentation
- Internal documentation
- Custom documentation per company

---

## Recommended Approach: Hybrid

**Best Practice**: Use a combination of methods

1. **In-App Help** (Primary)
   - Quick access from dashboard
   - Contextual help links
   - Trial banner links to subscription guide

2. **Marketing Website** (Secondary)
   - Public documentation pages
   - SEO-friendly
   - Shareable links

3. **Email Distribution** (Onboarding)
   - Send during initial setup
   - Include in welcome emails
   - Subscription reminders

---

## Implementation Steps

### Step 1: Add In-App Help Link

Add to `Navigation.tsx` or `ManagementDashboard.tsx`:

```tsx
// Add help/documentation link
<a href="/docs" target="_blank" rel="noopener noreferrer">
  Help & Documentation
</a>
```

Or create a help modal/page component.

### Step 2: Create Documentation Pages on Website

1. Create `/docs` folder in your marketing website
2. Convert markdown files to HTML
3. Add navigation links
4. Style consistently with your website

### Step 3: Set Up Documentation Hosting

**Option A: Static HTML Pages**
- Convert markdown to HTML
- Host in `public/docs/` in your app
- Access at `https://your-app.com/docs`

**Option B: External Documentation Site**
- Use GitHub Pages, GitBook, or similar
- Link from app and website
- Keep documentation separate from app code

### Step 4: Add Contextual Links

Add documentation links in key places:
- Trial banner: "Learn more about subscriptions"
- Subscription Management: "View subscription guide"
- Feature-locked items: "Upgrade to access this feature"
- Help menu: "Documentation"

---

## Documentation Files to Deploy

### Essential Files (Deploy First)

1. **SUBSCRIPTION_AND_TRIAL_GUIDE.md** - Critical for trial users
2. **COMPANY_QUICK_START.md** - Getting started guide
3. **MANAGER_USER_GUIDE.md** - Main user guide
4. **DRIVER_USER_GUIDE.md** - Driver-specific guide

### Supporting Files

5. **COMPANY_ONBOARDING_GUIDE.md** - Comprehensive onboarding
6. **DRIVER_QUICK_REFERENCE.md** - Quick reference card
7. **MANAGER_QUICK_REFERENCE.md** - Quick reference card
8. **internal/ADMIN_ONBOARDING_CHECKLIST.md** - Admin setup guide (Internal)

---

## Quick Implementation: Add Help Link to App

### Minimal Implementation

Add a help link to the navigation:

```tsx
// In Navigation.tsx or ManagementDashboard.tsx
<a 
  href="https://tazsoftware.biz/docs" 
  target="_blank" 
  rel="noopener noreferrer"
  className="help-link"
>
  📚 Help & Documentation
</a>
```

### Better Implementation

Create a help modal or page:

```tsx
// Create src/components/HelpModal.tsx
// Link from navigation
// Include links to:
// - Getting Started
// - Subscription Guide
// - User Guides
// - Support Contact
```

---

## Documentation URLs

### Recommended Structure

**Marketing Website (tazsoftware.biz)**:
- `https://tazsoftware.biz/docs` - Documentation index
- `https://tazsoftware.biz/docs/getting-started` - Quick start
- `https://tazsoftware.biz/docs/subscription` - Subscription guide
- `https://tazsoftware.biz/docs/user-guide` - Manager guide
- `https://tazsoftware.biz/docs/driver-guide` - Driver guide

**In-App**:
- `/docs` - Documentation page (if hosting in app)
- Or link to external documentation site

---

## Maintenance

### Keep Documentation Updated

1. **When Adding Features**: Update relevant guides
2. **When Changing Plans**: Update subscription guide
3. **When Fixing Bugs**: Update troubleshooting sections
4. **Quarterly Review**: Review all documentation for accuracy

### Version Control

- Keep documentation in Git repository
- Tag releases with documentation versions
- Maintain changelog of documentation updates

---

## Support Contact

For questions about documentation:
- **Email**: eric@tazsoftware.biz
- **Website**: https://tazsoftware.biz

---

**Last Updated**: January 2025
