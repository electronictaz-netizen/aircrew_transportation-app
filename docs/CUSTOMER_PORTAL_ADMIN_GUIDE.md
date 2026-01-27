# Customer Portal - Admin & Manager Guide

This guide helps administrators and managers set up, manage, and troubleshoot the Customer Portal feature.

## Table of Contents

1. [Overview](#overview)
2. [Enabling Portal Access](#enabling-portal-access)
3. [Managing Customer Portal Settings](#managing-customer-portal-settings)
4. [Viewing Portal Activity](#viewing-portal-activity)
5. [Handling Modification Requests](#handling-modification-requests)
6. [Reviewing Customer Ratings](#reviewing-customer-ratings)
7. [Troubleshooting](#troubleshooting)

---

## Overview

### What is the Customer Portal?

The Customer Portal is a self-service website where customers can:
- View their upcoming and past trips
- Download receipts and invoices
- Request changes to upcoming trips
- Rate and review completed trips

### Benefits

- ✅ **Reduced Support Calls**: Customers can access information independently
- ✅ **Better Customer Experience**: 24/7 access to trip information
- ✅ **Improved Efficiency**: Automated receipt generation
- ✅ **Customer Feedback**: Ratings and reviews help improve service

---

## Enabling Portal Access

### For Individual Customers

#### Method 1: Via Customer Management (Recommended)

1. **Navigate to Customer Management**
   - Go to **Data Management** → **Manage Customers**
2. **Find the Customer**
   - Search by name, email, or phone
3. **Edit Customer**
   - Click **Edit** on the customer record
4. **Enable Portal Access**
   - Check **"Enable Portal Access"** or set `portalEnabled: true`
   - Ensure customer has valid email or phone number
5. **Save Changes**

#### Method 2: Via GraphQL (Direct Database)

If UI field doesn't exist:

1. **Access AppSync Console**
   - Go to AWS AppSync → Your API → Queries
2. **Run Mutation**
   ```graphql
   mutation EnablePortal {
     updateCustomer(input: {
       id: "CUSTOMER_ID"
       portalEnabled: true
     }) {
       id
       name
       portalEnabled
     }
   }
   ```

### For Multiple Customers (Bulk Enable)

Currently, portal access must be enabled per customer. For bulk operations:

1. **Export customer list** (if export feature exists)
2. **Update in batches** via AppSync or database
3. **Or enable as needed** when customers request access

---

## Managing Customer Portal Settings

### Portal Access Requirements

For a customer to access the portal, they need:
- ✅ `portalEnabled: true`
- ✅ `isActive: true`
- ✅ Valid email OR phone number
- ✅ At least one trip assigned to them

### Portal URL Format

Customers access the portal via:
```
https://your-app.amplifyapp.com/portal/{BOOKING_CODE}
```

Where `{BOOKING_CODE}` is your company's booking code (same as booking portal).

### Sharing Portal Links

**Best Practices:**
1. **Include in Welcome Emails**: Send portal link when onboarding new customers
2. **Add to Booking Confirmations**: Include link in trip confirmation emails
3. **Website Integration**: Add portal link to your company website
4. **Printed Materials**: Include on business cards, receipts, invoices

**Example Email Template:**
```
Subject: Access Your Trip Portal

Hi [Customer Name],

You can now access your trips online through our Customer Portal!

Portal Link: https://your-app.com/portal/ACME

Features:
- View upcoming and past trips
- Download receipts
- Request trip changes
- Rate your experience

To log in, use your email: [customer email] or phone: [customer phone]

Best regards,
[Your Company]
```

---

## Viewing Portal Activity

### Check Customer Login History

1. **View Customer Record**
   - Go to Customer Management
   - Open customer details
2. **Check `lastPortalLogin` Field**
   - Shows last time customer logged into portal
   - Format: ISO datetime

### Monitor Portal Usage

**Via CloudWatch Logs:**
1. Go to AWS CloudWatch
2. Navigate to Log Groups
3. Find `/aws/lambda/customerPortal-*`
4. View logs for portal activity

**Key Metrics to Monitor:**
- Login attempts
- Failed logins
- Trip views
- Receipt downloads
- Modification requests
- Ratings submitted

---

## Handling Modification Requests

### Viewing Requests

1. **Access Trip Modification Requests**
   - Requests are stored in `TripModificationRequest` model
   - Status: `pending`, `approved`, `rejected`, `completed`

2. **Query Requests** (via AppSync or Management Dashboard)
   ```graphql
   query GetModificationRequests {
     listTripModificationRequests(
       filter: {
         companyId: { eq: "YOUR_COMPANY_ID" }
         status: { eq: "pending" }
       }
     ) {
       items {
         id
         trip {
           id
           flightNumber
           pickupDate
         }
         customer {
           name
           email
           phone
         }
         requestType
         requestedChanges
         reason
         createdAt
       }
     }
   }
   ```

### Processing Requests

1. **Review Request Details**
   - Check requested changes
   - Review reason provided
   - Verify trip details

2. **Approve Request**
   - Update trip with requested changes
   - Update request status to `approved`
   - Notify customer of approval

3. **Reject Request**
   - Update request status to `rejected`
   - Add notes explaining rejection
   - Contact customer to discuss alternatives

4. **Mark as Completed**
   - After changes are implemented
   - Update request status to `completed`
   - Update `respondedAt` timestamp

### Best Practices

- ⏰ **Respond Quickly**: Review requests within 24 hours
- 📞 **Contact Customer**: Call for urgent or complex changes
- 📝 **Add Notes**: Document why request was approved/rejected
- ✅ **Update Trip**: Make changes in trip management system

---

## Reviewing Customer Ratings

### Viewing Ratings

1. **Access Trip Ratings**
   - Ratings are stored in `TripRating` model
   - Linked to trips and customers

2. **Query Ratings** (via AppSync)
   ```graphql
   query GetRatings {
     listTripRatings(
       filter: {
         companyId: { eq: "YOUR_COMPANY_ID" }
       }
     ) {
       items {
         id
         trip {
           id
           flightNumber
           pickupDate
         }
         customer {
           name
         }
         rating
         driverRating
         vehicleRating
         review
         wouldRecommend
         createdAt
       }
     }
   }
   ```

### Analyzing Ratings

**Key Metrics:**
- Average overall rating
- Average driver rating
- Average vehicle rating
- Percentage who would recommend
- Review sentiment analysis

**Use Ratings To:**
- Identify service improvement areas
- Recognize excellent drivers
- Address customer concerns
- Track service quality trends

### Responding to Ratings

**For Positive Ratings:**
- Thank customer (if contact info available)
- Share with driver/team
- Use as testimonials (with permission)

**For Negative Ratings:**
- Contact customer to address concerns
- Investigate issues mentioned
- Implement improvements
- Follow up with customer

---

## Troubleshooting

### Customer Can't Log In

**Check:**
1. Customer has `portalEnabled: true`
2. Customer has valid email or phone
3. Customer is active (`isActive: true`)
4. Email/phone matches exactly (case-sensitive for email)

**Solution:**
- Verify customer record in database
- Test with known good customer
- Check Lambda logs for errors

### Access Code Not Sent

**Current Implementation:**
- Access codes are returned in API response (for testing)
- In production, configure email/SMS sending

**Solution:**
- Check Lambda function logs
- Verify email/SMS service is configured
- Test email/SMS sending separately

### Trips Not Showing

**Check:**
1. Customer has trips assigned (`customerId` matches)
2. Trips belong to correct company
3. Trip dates are correct

**Solution:**
- Verify `customerId` on trips
- Check company ID matches
- Review trip data in database

### Modification Requests Not Appearing

**Check:**
1. Requests are being created (check database)
2. Query filters are correct
3. Status field is set properly

**Solution:**
- Query database directly
- Check request creation in Lambda logs
- Verify status values

---

## Security Best Practices

### Access Control

- ✅ Only enable portal for customers who request it
- ✅ Regularly audit `portalEnabled` status
- ✅ Disable access for inactive customers

### Access Code Security

- ✅ Codes expire after use (currently implemented)
- ✅ Consider time-based expiration (e.g., 15 minutes)
- ✅ Never return codes in API response (production)
- ✅ Always send via email/SMS

### Rate Limiting

- ⚠️ Consider adding rate limiting to prevent abuse
- ⚠️ Limit login attempts per email/phone
- ⚠️ Monitor for suspicious activity

### Data Privacy

- ✅ Customers can only see their own trips
- ✅ Verify customer belongs to company before showing data
- ✅ Don't expose sensitive information in portal

---

## Integration with Other Features

### Booking Portal

- Customer Portal uses same booking code
- Customers can book via booking portal, then view in customer portal
- Both portals share company identification

### Email Notifications

- Send portal link in booking confirmations
- Include link in welcome emails
- Add to receipt emails

### SMS Integration

- Send portal link via SMS (if Telnyx configured)
- Send access codes via SMS
- SMS notifications for trip updates

---

## Reporting & Analytics

### Key Metrics to Track

1. **Portal Adoption**
   - Number of customers with portal enabled
   - Percentage of active customers using portal

2. **Usage Statistics**
   - Login frequency
   - Trip views
   - Receipt downloads
   - Modification requests
   - Ratings submitted

3. **Customer Satisfaction**
   - Average rating
   - Review sentiment
   - Recommendation rate

### Generating Reports

**Via AppSync Queries:**
- Aggregate ratings by date range
- Count modification requests by status
- Track portal login activity

**Via CloudWatch:**
- Monitor Lambda function metrics
- Track API call volumes
- Identify error rates

---

## Support & Maintenance

### Regular Maintenance Tasks

1. **Weekly**: Review pending modification requests
2. **Monthly**: Audit portal access (enable/disable as needed)
3. **Quarterly**: Review customer ratings and feedback
4. **As Needed**: Update portal documentation

### Getting Help

- Check CloudWatch logs for errors
- Review AppSync query logs
- Test with known customer account
- Contact development team for code issues

---

## Next Steps

- ✅ Portal is set up and functional
- 📧 Configure email/SMS for access codes (production)
- 📊 Set up monitoring and alerts
- 📝 Create customer communication templates
- 🔄 Regular review and optimization

---

Thank you for using the Customer Portal feature! This should significantly improve customer satisfaction and reduce support workload.
