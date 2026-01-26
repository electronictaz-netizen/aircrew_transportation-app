# Marketing Website for tazsoftware.biz

## Overview

This is a complete marketing website for **tazsoftware.biz** that showcases the Onyx Transportation App. The website includes:

- **Hero Section** - Eye-catching introduction with call-to-action
- **Features Section** - Detailed breakdown of app capabilities
- **Pricing Section** - All subscription plans with features and costs
- **About Section** - Information about the app
- **Footer** - Company information and links

## Files Included

1. **index.html** - Main HTML file
2. **styles.css** - Complete styling
3. **script.js** - JavaScript for interactivity
4. **README.md** - This file

## Setup Instructions for GoDaddy

### Step 1: Get Your App URL

Replace `[YOUR-APP-URL]` in the HTML file with your actual app URL:

- If using Amplify domain: `https://main.d1wxo3x0z5r1oq.amplifyapp.com`
- If using custom domain: `https://app.onyxdispatch.us` (or your custom domain)

### Step 2: Upload Files to GoDaddy

1. **Log into GoDaddy**
   - Go to your GoDaddy account
   - Navigate to your website/hosting control panel

2. **Access File Manager**
   - Go to **Web Hosting** → **Manage**
   - Click **File Manager** or **FTP File Manager**

3. **Upload Files**
   - Navigate to your website's root directory (usually `public_html` or `www`)
   - Upload these files:
     - `index.html`
     - `styles.css`
     - `script.js`

4. **Set index.html as Homepage**
   - Make sure `index.html` is in the root directory
   - It should automatically become your homepage

### Step 3: Update App URL

**Before uploading**, update all instances of `[YOUR-APP-URL]` in `index.html`:

1. Open `index.html` in a text editor
2. Find and replace `[YOUR-APP-URL]` with your actual app URL
3. Save the file
4. Upload to GoDaddy

**Example:**
```html
<!-- Before -->
<a href="https://[YOUR-APP-URL]/?signup=true">Get Started</a>

<!-- After -->
<a href="https://app.onyxdispatch.us/?signup=true">Get Started</a>
```

### Step 4: Test

1. Visit your website: `https://tazsoftware.biz`
2. Click "Get Started" or "Subscribe" buttons
3. Verify they redirect to your app with sign-up form
4. Test all links and navigation

## Customization

### Update Company Information

In `index.html`, you can customize:

- **Company Name**: Change "Taz Software, LLC" to your preferred name
- **Contact Emails**: 
  - Support: `support@tazsoftware.biz`
  - Sales: `sales@tazsoftware.biz`
- **Colors**: Modify CSS variables in `styles.css`:
  ```css
  :root {
      --primary-color: #667eea;
      --primary-dark: #764ba2;
      --secondary-color: #fbbf24;
  }
  ```

### Add Your Logo

1. Upload your logo to GoDaddy
2. In `index.html`, add an `<img>` tag in the `.nav-brand` section:
   ```html
   <div class="nav-brand">
       <img src="logo.png" alt="Taz Software" style="height: 40px;">
   </div>
   ```

### Add Screenshots

You can add app screenshots to the features section:

```html
<div class="feature-card">
    <img src="screenshot.png" alt="Feature Screenshot" style="width: 100%; margin-bottom: 1rem;">
    <div class="feature-icon">🚀</div>
    <h3>Streamlined Operations</h3>
    <p>...</p>
</div>
```

## URL Parameters

The website links to your app with these URL parameters:

- `?signup=true` - Shows sign-up form instead of sign-in
- `?plan=free` - Pre-selects Free plan
- `?plan=basic` - Pre-selects Basic plan ($59/month)
- `?plan=premium` - Pre-selects Premium plan ($129/month)

## Features

✅ **Responsive Design** - Works on desktop, tablet, and mobile
✅ **Modern UI** - Clean, professional design
✅ **Smooth Animations** - Subtle animations for better UX
✅ **SEO Friendly** - Proper meta tags and structure
✅ **Fast Loading** - Optimized CSS and minimal JavaScript
✅ **Accessible** - Semantic HTML and ARIA labels

## Support

If you need help:
- Customizing the design
- Adding more sections
- Integrating with analytics
- Setting up custom domain

Contact support or refer to the main app documentation.

## Next Steps

1. ✅ Upload files to GoDaddy
2. ✅ Replace `[YOUR-APP-URL]` with actual URL
3. ✅ Test all links
4. ✅ Customize colors/branding if needed
5. ✅ Add your logo
6. ✅ Test on mobile devices
