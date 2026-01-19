# Integrating tazsoftware.biz with Onyx Transportation App

## Overview

Your marketing website at **https://tazsoftware.biz** will serve as the public-facing marketing page. When visitors want to subscribe, they'll be redirected to the Onyx Transportation App for sign-up and subscription.

## Integration Setup

### Option 1: Direct Link to Sign-Up (Recommended)

Add a button/link on your tazsoftware.biz website that points to:

```
https://[your-amplify-domain].amplifyapp.com/?signup=true
```

Or if you have a custom domain:

```
https://app.onyxdispatch.us/?signup=true
```

**Benefits:**
- Simple to implement
- Direct integration
- Users land on the branded login/sign-up screen
- After sign-up, they can immediately subscribe

### Option 2: Link with Plan Selection

You can also pre-select a plan by adding a plan parameter:

```
https://[your-amplify-domain].amplifyapp.com/?signup=true&plan=basic
```

Available plan values:
- `free` - Free plan
- `basic` - Basic plan ($49/month)
- `premium` - Premium plan ($99/month)

### Option 3: Subscribe Button (After Sign-Up)

1. User clicks "Subscribe" or "Get Started" on tazsoftware.biz
2. Redirects to: `https://[your-app-url]/?signup=true`
3. User signs up (creates account)
4. After sign-up, they're automatically taken to Subscription Management
5. They can select and subscribe to a plan

## Implementation on tazsoftware.biz

### HTML Example

```html
<!-- Simple Sign-Up Button -->
<a href="https://[your-app-url]/?signup=true" 
   class="subscribe-button">
  Get Started Free
</a>

<!-- Subscribe to Basic Plan -->
<a href="https://[your-app-url]/?signup=true&plan=basic" 
   class="subscribe-button">
  Subscribe to Basic Plan
</a>

<!-- Subscribe to Premium Plan -->
<a href="https://[your-app-url]/?signup=true&plan=premium" 
   class="subscribe-button">
  Subscribe to Premium Plan
</a>
```

### JavaScript Example (for tracking)

```javascript
// Track clicks and redirect
function handleSubscribe(planId) {
  // Optional: Track in analytics
  if (typeof gtag !== 'undefined') {
    gtag('event', 'subscribe_click', {
      'plan': planId
    });
  }
  
  // Redirect to app sign-up
  const appUrl = 'https://[your-app-url]';
  const signupUrl = `${appUrl}/?signup=true${planId ? `&plan=${planId}` : ''}`;
  window.location.href = signupUrl;
}
```

## User Flow

1. **User visits tazsoftware.biz**
   - Views marketing content
   - Learns about Onyx Transportation App
   - Sees pricing and features

2. **User clicks "Subscribe" or "Get Started"**
   - Redirected to Onyx Transportation App
   - URL includes `?signup=true` parameter

3. **User sees sign-up screen**
   - Branded login/sign-up form
   - "Onyx Transportation App" branding
   - Service provider info in footer

4. **User creates account**
   - Enters email and password
   - Account is created in AWS Amplify

5. **After sign-up**
   - User is logged in
   - If `plan` parameter was provided, they can be taken to subscription selection
   - Otherwise, they land on the management dashboard
   - They can access Subscription Management from the Configuration menu

## Custom Domain Setup

If you want to use a custom domain for the app (e.g., `app.onyxdispatch.us`):

1. **Set up custom domain in AWS Amplify Console**
   - Go to App Settings → Domain management
   - Add your custom domain
   - Configure DNS records

2. **Update links on tazsoftware.biz**
   - Use the custom domain instead of Amplify domain
   - Example: `https://app.onyxdispatch.us/?signup=true`

## URL Parameters

The app supports these URL parameters:

- `?signup=true` - Shows sign-up form instead of sign-in
- `?plan=basic` - Pre-selects Basic plan (used after sign-up)
- `?plan=premium` - Pre-selects Premium plan (used after sign-up)
- `?plan=free` - Pre-selects Free plan (used after sign-up)

## Testing

1. **Test sign-up flow:**
   - Visit: `https://[your-app-url]/?signup=true`
   - Create a test account
   - Verify you can access the app

2. **Test with plan selection:**
   - Visit: `https://[your-app-url]/?signup=true&plan=basic`
   - Sign up
   - Check if you're directed to subscription management

3. **Test from tazsoftware.biz:**
   - Add button/link on your website
   - Click and verify redirect works
   - Complete sign-up flow

## Next Steps

1. ✅ Add "Get Started" or "Subscribe" buttons on tazsoftware.biz
2. ✅ Link to: `https://[your-app-url]/?signup=true`
3. ✅ Test the complete flow
4. ✅ Optionally add plan-specific buttons (Basic, Premium)
5. ✅ Consider adding tracking/analytics for conversion tracking

## Support

If you need help with:
- Custom domain setup
- URL parameter handling
- Sign-up flow customization
- Subscription integration

See related documentation:
- `STRIPE_SETUP.md` - Stripe integration
- `CUSTOM_DOMAIN_SETUP.md` - Custom domain configuration
