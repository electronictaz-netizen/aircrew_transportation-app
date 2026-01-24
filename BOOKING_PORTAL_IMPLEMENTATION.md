# Booking Portal Implementation Guide

## Overview

The customer booking portal has been implemented with code-based routing. Customers can access a company's booking portal using a unique booking code.

## What's Been Implemented

### 1. Data Model Changes
- ✅ Added `bookingCode` field to Company model
- ✅ Added `bookingEnabled` field to Company model
- ✅ Added `bookingSettings` field for future configuration

### 2. Booking Portal Component
- ✅ Public booking portal route: `/booking/:code` or `/booking?code=CODE`
- ✅ Full booking form with:
  - Customer information
  - Trip details (Airport Trip or Standard Trip)
  - Pickup/dropoff locations
  - Number of passengers
  - Vehicle type selection
  - Round trip option
  - Special instructions
- ✅ Pricing calculator (basic implementation)
- ✅ Booking confirmation page
- ✅ Customer creation/update on booking

### 3. Company Management UI
- ✅ Enable/disable booking portal toggle
- ✅ Booking code input field
- ✅ Booking URL display with copy button
- ✅ Validation for booking code format

### 4. Utilities
- ✅ `bookingUtils.ts` with helper functions:
  - `getCompanyByBookingCode()` - Load company by code
  - `getBookingCodeFromURL()` - Extract code from URL
  - `calculatePrice()` - Basic pricing calculation
  - `generateBookingCode()` - Auto-generate codes

## Current Limitation: Public Data Access

**Issue:** Amplify Gen 2 doesn't easily support public (unauthenticated) read access to data models. The Company model requires authentication to read.

**Workaround Options:**

### Option 1: Lambda Function (Recommended for Production)
Create a Lambda function that:
- Has IAM permissions to read Company data
- Exposes a public API endpoint
- Returns company data for booking portal

**Implementation:**
1. Create Lambda function with proper IAM permissions
2. Configure Function URL for public access
3. Update `bookingUtils.ts` to call Lambda instead of direct data access
4. Add CORS configuration

### Option 2: Temporary Workaround (For Testing)
For initial testing, you can:
1. Create a test user account
2. Use that account's credentials to access Company data
3. This is NOT recommended for production

### Option 3: API Gateway + Lambda
Set up API Gateway with Lambda backend for public booking portal access.

## Next Steps

### Immediate (To Make Booking Portal Work):
1. **Implement Lambda function for public access** (Option 1 above)
2. Update `getCompanyByBookingCode()` to call Lambda
3. Update booking submission to use Lambda
4. Test booking portal end-to-end

### Short-term Enhancements:
1. **Email Confirmation:**
   - Send confirmation email to customer
   - Send notification email to company
   - Use existing email infrastructure

2. **Enhanced Pricing:**
   - Integrate distance calculation (Google Maps API)
   - Company-specific pricing rules
   - Vehicle type pricing
   - Time-of-day pricing

3. **Booking Management:**
   - Customer account creation (optional)
   - View booking history
   - Modify/cancel bookings

### Long-term Features:
1. **Subdomain Support:**
   - Add subdomain routing
   - Branded booking pages
   - Custom domains

2. **Payment Integration:**
   - Stripe integration for passenger payments
   - Payment at booking or completion
   - Saved payment methods

3. **Advanced Features:**
   - Real-time availability
   - Driver assignment notifications
   - SMS confirmations
   - Booking modifications

## Usage

### For Companies:
1. Go to Company Management
2. Enable "Public Booking Portal"
3. Enter a booking code (e.g., "ACME123")
4. Copy the booking URL
5. Share with customers

### For Customers:
1. Visit booking URL: `https://onyxdispatch.us/booking/ACME123`
2. Fill out booking form
3. Submit booking
4. Receive confirmation

## Testing

To test the booking portal:
1. Enable booking for a company
2. Set a booking code
3. Visit `/booking/YOURCODE`
4. Fill out and submit a test booking
5. Verify trip appears in management dashboard

## Security Considerations

1. **Rate Limiting:** Add rate limiting to prevent abuse
2. **Input Validation:** All form inputs are validated
3. **Spam Protection:** Consider adding CAPTCHA
4. **Data Isolation:** Ensure bookings are properly scoped to company
5. **Public Access:** Use Lambda function for secure public access

## Files Created/Modified

### New Files:
- `src/components/BookingPortal.tsx` - Main booking portal component
- `src/components/BookingPortal.css` - Styling
- `src/utils/bookingUtils.ts` - Booking utilities
- `amplify/functions/publicBooking/` - Lambda function (placeholder)

### Modified Files:
- `amplify/data/resource.ts` - Added booking fields to Company model
- `src/App.tsx` - Added booking portal routes
- `src/components/CompanyManagement.tsx` - Added booking settings UI

## Notes

- Booking portal is currently functional but requires Lambda implementation for public data access
- Pricing calculator is basic - can be enhanced with distance calculation
- Email confirmations not yet implemented
- Payment processing not yet implemented
