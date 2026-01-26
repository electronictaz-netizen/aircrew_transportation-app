# Booking Portal & Pricing Configuration Guide

## Overview

The Onyx Transportation App includes a powerful **Public Booking Portal** that allows your customers to book trips directly through a custom URL. This guide covers how to set up and configure your booking portal, including custom pricing rules.

---

## Table of Contents

1. [What is the Booking Portal?](#what-is-the-booking-portal)
2. [Setting Up Your Booking Portal](#setting-up-your-booking-portal)
3. [Configuring Pricing](#configuring-pricing)
4. [Managing Booking Requests](#managing-booking-requests)
5. [Customer Experience](#customer-experience)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)

---

## What is the Booking Portal?

The Booking Portal is a public-facing web page where your customers can:

- Submit trip requests 24/7 without calling or emailing
- See real-time price estimates based on your pricing rules
- Provide all necessary trip details (pickup/dropoff, passenger count, vehicle type, etc.)
- Receive automatic confirmation emails
- Track their booking status

**Key Benefits:**

- ✅ Reduce phone call volume
- ✅ Capture bookings outside business hours
- ✅ Provide instant price quotes
- ✅ Streamline the booking process
- ✅ Improve customer satisfaction

---

## Setting Up Your Booking Portal

### Step 1: Enable the Booking Portal

1. Navigate to **Company Settings** (click your company name in the top navigation)
2. Scroll to the **Booking Portal Settings** section
3. Check the box: **"Enable Public Booking Portal"**
4. Enter a **Booking Code** (3-20 characters, letters and numbers only)
   - Example: `ACME123`, `GLS`, `COMPANY2024`
   - This code will be part of your booking URL
5. Click **"Save Changes"**

### Step 2: Get Your Booking URL

After enabling the portal, you'll see your unique booking URL:

```
https://onyxdispatch.us/booking/YOURCODE
```

**Example:** If your booking code is `ACME123`, your URL would be:
```
https://onyxdispatch.us/booking/ACME123
```

You can:
- Copy the URL using the **"📋 Copy Booking URL"** button
- Share this URL with customers via email, website, or social media
- Add it to your website as a "Book Now" button

### Step 3: Test Your Portal

1. Open your booking URL in a new browser window (or incognito mode)
2. Fill out a test booking request
3. Submit the request
4. Check your **Management Dashboard** → **Booking Requests** tab to see the request

---

## Configuring Pricing

### Overview

You can customize how prices are calculated for your booking portal. This allows you to:

- Set your base rate per mile
- Configure vehicle surcharges (SUV, Limo, Van, Sedan)
- Offer round trip discounts
- Add passenger surcharges
- Set minimum prices

### Accessing Pricing Settings

1. Go to **Company Settings**
2. Enable the **Booking Portal** (if not already enabled)
3. Scroll to the **Pricing Configuration** section

### Pricing Components

#### Base Pricing

- **Base Price Per Mile ($)**: Your standard rate per mile
  - Example: `$2.50` per mile
  - This is multiplied by estimated miles to calculate base price

- **Default Estimated Miles**: Default distance used when actual distance is unknown
  - Example: `15` miles
  - Used for initial price estimates

- **Minimum Price ($)**: Minimum charge regardless of distance
  - Example: `$25.00`
  - Ensures you always charge at least this amount

#### Vehicle Surcharges

Set additional charges for different vehicle types:

- **SUV**: Additional charge for SUV bookings
- **Limo**: Additional charge for limousine bookings
- **Van**: Additional charge for van bookings
- **Sedan**: Additional charge for sedan bookings (usually $0)

**Example:**
- Base price: $37.50 (15 miles × $2.50)
- Vehicle: Limo (+$50.00)
- **Total before discount: $87.50**

#### Discounts

- **Round Trip Discount (%)**: Percentage discount applied to base price for round trips
  - Example: `10%` discount
  - Applied only when customer selects "Round Trip"

**Example:**
- Base price: $37.50
- Round trip discount (10%): -$3.75
- **Adjusted base price: $33.75**

#### Passenger Fees

- **Passenger Surcharge ($)**: Additional charge per passenger over base capacity
  - Example: `$5.00` per extra passenger

- **Base Passenger Capacity**: Number of passengers included in base price
  - Example: `1` passenger
  - If customer books 3 passengers and base capacity is 1, they pay for 2 extra passengers

**Example:**
- Base price includes: 1 passenger
- Customer books: 4 passengers
- Extra passengers: 3
- Passenger surcharge: 3 × $5.00 = $15.00

### Complete Pricing Example

**One-Way Trip:**
- Base price: $37.50 (15 miles × $2.50)
- Vehicle: Limo (+$50.00)
- Passengers: 4 (base capacity: 1, so 3 extra)
- Passenger surcharge: 3 × $5.00 = $15.00
- **Total: $102.50**

**Round Trip (Same Details):**
- Base price: $37.50
- Round trip discount (10%): -$3.75
- Adjusted base: $33.75
- Vehicle: Limo (+$50.00)
- Passenger surcharge: $15.00
- **Total: $98.75**

### Pricing Calculation Formula

```
Base Price = max(Estimated Miles × Price Per Mile, Minimum Price)
Vehicle Surcharge = [Selected Vehicle Type Surcharge]
Passenger Surcharge = max(0, Number of Passengers - Base Capacity) × Passenger Surcharge Rate
Round Trip Discount = Base Price × (Round Trip Discount % / 100)

Total = Base Price + Vehicle Surcharge + Passenger Surcharge - Round Trip Discount
```

### Default Pricing Settings

If you don't configure custom pricing, the system uses these defaults:

- Base Price Per Mile: $2.50
- Estimated Miles: 15
- Minimum Price: $25.00
- Vehicle Surcharges:
  - SUV: $20.00
  - Limo: $50.00
  - Van: $30.00
  - Sedan: $0.00
- Round Trip Discount: 10%
- Passenger Surcharge: $5.00 per extra passenger
- Base Passenger Capacity: 1

---

## Managing Booking Requests

### Viewing Booking Requests

1. Go to **Management Dashboard**
2. Click the **"📥 Booking Requests"** tab
3. You'll see all pending, accepted, and rejected requests

### Request Statuses

- **Pending**: New request, awaiting your action
- **Accepted**: You've created a trip from this request
- **Rejected**: Request was declined

### Accepting a Booking Request

1. Find the request in the **Booking Requests** list
2. Click **"Accept"**
3. The system will:
   - Create a new **Trip** with all booking details
   - Create or update the **Customer** record
   - Send a confirmation email to the customer
   - Move the request to "Accepted" status

### Rejecting a Booking Request

1. Find the request in the **Booking Requests** list
2. Click **"Reject"**
3. The system will:
   - Send a rejection email to the customer
   - Move the request to "Rejected" status

### Search and Filter

Use the search and filter tools to find specific requests:

- **Search**: Search by customer name, email, phone, or location
- **Status Filter**: Show only Pending, Accepted, or Rejected requests
- **Date Range**: Filter by pickup date

### Bulk Actions

- **Select Multiple**: Check boxes to select multiple requests
- **Delete Selected**: Remove multiple requests at once

---

## Customer Experience

### What Customers See

When customers visit your booking URL, they'll see:

1. **Company Information**: Your company name and logo (if configured)
2. **Booking Form** with fields for:
   - Customer information (name, email, phone, company)
   - Trip details (pickup date/time, locations, passenger count)
   - Vehicle preferences
   - Round trip option
   - Special instructions
3. **Real-Time Price Estimate**: Updates as they fill out the form
4. **Confirmation Page**: After submission, shows booking ID and next steps

### Email Notifications

Customers receive automatic emails:

1. **Booking Confirmation** (immediately after submission)
   - Confirms receipt of their request
   - Includes booking ID
   - Provides contact information

2. **Booking Accepted** (when you accept the request)
   - Confirms their trip is scheduled
   - Includes trip details
   - Provides driver contact information (if available)

3. **Booking Rejected** (if you reject the request)
   - Notifies them the request was declined
   - May include reason (if provided)

### Price Estimates

- Prices shown are **estimates** based on:
  - Your configured pricing rules
  - Default estimated distance (if actual distance isn't calculated)
  - Selected vehicle type and passenger count
- **Final price may vary** based on:
  - Actual distance traveled
  - Actual trip duration
  - Additional services or changes

---

## Best Practices

### Booking Code

- **Keep it simple**: Use your company name or abbreviation
- **Make it memorable**: Customers may need to remember it
- **Keep it short**: Easier to share and type
- **Use uppercase**: System converts to uppercase automatically
- **Avoid special characters**: Only letters and numbers

**Good Examples:**
- `GLS` (GLS Transportation)
- `ACME` (Acme Limo)
- `BLACKCAR` (Black Car Service)

**Avoid:**
- `GLS-123` (contains hyphen)
- `GLS_TRANSPORT` (contains underscore)
- `gls transportation` (contains space)

### Pricing Configuration

- **Start with defaults**: Test with default pricing first, then adjust
- **Test thoroughly**: Submit test bookings to verify calculations
- **Consider your market**: Set prices competitive with your local market
- **Update seasonally**: Adjust for peak seasons or special events
- **Document your rates**: Keep a record of your pricing rules

### Customer Communication

- **Share your booking URL**: Add to website, email signatures, business cards
- **Set expectations**: Let customers know prices are estimates
- **Respond promptly**: Accept or reject requests within 24 hours
- **Follow up**: Contact customers if you need clarification

### Managing Requests

- **Review daily**: Check for new requests at least once per day
- **Accept quickly**: Faster acceptance = better customer experience
- **Use filters**: Filter by status to focus on pending requests
- **Archive old requests**: Delete accepted/rejected requests after 30-60 days

---

## Troubleshooting

### Booking Portal Not Loading

**Problem:** Customer sees "Booking Portal Not Found" error

**Solutions:**
1. Verify booking portal is enabled in Company Settings
2. Check that booking code matches exactly (case-insensitive)
3. Ensure company is active (`isActive = true`)
4. Try the URL in an incognito/private browser window

### Pricing Not Calculating

**Problem:** Price estimate shows $0.00 or incorrect amount

**Solutions:**
1. Check that pricing settings are saved in Company Settings
2. Verify all required fields are filled (pickup/dropoff locations, date)
3. Check browser console for JavaScript errors
4. Try refreshing the page

### Booking Requests Not Appearing

**Problem:** Customer submitted request but it's not in your dashboard

**Solutions:**
1. Check the **Booking Requests** tab (not Trips tab)
2. Verify you're viewing the correct company (if using Admin mode)
3. Check CloudWatch logs for Lambda function errors
4. Verify booking code matches your company's code

### Email Notifications Not Sending

**Problem:** Customers not receiving confirmation emails

**Solutions:**
1. Check that `VITE_BOOKING_EMAIL_FUNCTION_URL` is configured
2. Verify email service (SendGrid/Postmark) is set up
3. Check spam/junk folders
4. Verify customer email address is correct

### Price Estimate Too High/Low

**Problem:** Estimated prices don't match your expectations

**Solutions:**
1. Review your pricing configuration in Company Settings
2. Check that estimated miles matches your typical trip distances
3. Adjust base price per mile or minimum price
4. Test with different vehicle types and passenger counts

---

## Additional Resources

- **Manager User Guide**: See the full Manager Guide for trip management
- **Company Quick Start**: Get started with company setup
- **Support**: Contact support@tazsoftware.biz for assistance

---

## FAQ

**Q: Can I have multiple booking codes?**  
A: No, each company has one booking code. You can change it, but the old URL will stop working.

**Q: Can customers pay through the booking portal?**  
A: Not currently. The portal collects booking requests. Payment is handled separately.

**Q: Can I customize the booking form?**  
A: The form fields are standardized, but you can add special instructions fields.

**Q: How do I disable the booking portal?**  
A: Uncheck "Enable Public Booking Portal" in Company Settings and save.

**Q: Will old booking requests be deleted if I disable the portal?**  
A: No, existing requests remain. You can still view and manage them.

**Q: Can I set different prices for different times/days?**  
A: Not currently. Pricing is based on distance, vehicle type, and passenger count.

**Q: How accurate are the price estimates?**  
A: Estimates use default miles. Actual prices may vary based on real distance and time.

---

*Last Updated: January 2026*
