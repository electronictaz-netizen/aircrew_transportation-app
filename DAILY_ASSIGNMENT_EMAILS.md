# Daily Assignment Notification System

## Overview

The daily assignment notification system sends drivers a summary of their trip assignments for the following day via email and/or SMS. The notifications include basic trip information (times, pickup locations) and direct drivers to the app for complete details.

### Supported Notification Methods

- **Email**: Pre-filled email with detailed trip information
- **SMS/Text**: Concise text message with trip summary (requires phone numbers)

## Current Implementation

### Manual Trigger

A "Send Daily Assignment Emails" button is available in the Management Dashboard that:
- Prompts you to select notification methods (Email and/or SMS)
- Finds all active drivers with the required contact information (email for email, phone for SMS)
- Retrieves their trips scheduled for tomorrow
- Opens email clients and/or SMS apps with pre-filled notifications
- Shows a summary of sent/failed/skipped notifications for each method

### Email Content

Each driver receives an email with:
- **Subject**: "Your Trip Assignments for [Date]"
- **Body includes**:
  - Personalized greeting
  - List of trips sorted by pickup time
  - For each trip:
    - Flight number and airport code
    - Pickup time
    - Pickup location
    - Number of passengers
  - Instructions to check the app for full details
  - Contact information

### SMS Content

Each driver receives a concise SMS with:
- Personalized greeting with date
- Numbered list of trips sorted by pickup time
- For each trip (condensed format):
  - Flight number and airport code
  - Pickup time
  - Pickup location
- Instruction to check the app for full details

**Example SMS:**
```
John Doe, your 1/15 assignments:

1. DL3709 (SYR) 3:19 PM - Syracuse airport
2. UA3527 (SYR) 6:20 PM - Syracuse airport
3. DL1689 (SYR) 11:13 PM - Syracuse Airport

See app for full details.
```

### Example Email

```
Hello John Doe,

Here are your trip assignments for Monday, January 15, 2026:

You have 3 trips scheduled:

1.  • Flight DL3709 (SYR)
     Time: 3:19 PM
     Pickup: Syracuse airport
     Passengers: 5

2.  • Flight UA3527 (SYR)
     Time: 6:20 PM
     Pickup: Syracuse airport
     Passengers: 1

3.  • Flight DL1689 (SYR)
     Time: 11:13 PM
     Pickup: Syracuse Airport
     Passengers: 6

Please log into the Onyx Transportation App for complete trip details including:
- Full pickup and dropoff addresses
- Flight status information
- Airport details
- Ability to record pickup and dropoff times

If you have any questions or need to make changes, please contact management.

Thank you!
Onyx Transportation Team
```

## Automated Daily Execution

### Option 1: AWS Lambda + EventBridge (Recommended for Production)

To set up automated daily emails that run automatically:

1. **Create AWS Lambda Function**
   - Create a Lambda function that calls `sendDailyAssignmentEmailsToAllDrivers()`
   - Use Node.js runtime
   - Grant necessary permissions to access Amplify Data API

2. **Set Up EventBridge Rule**
   - Create a CloudWatch Events rule
   - Schedule: `cron(0 18 * * ? *)` (runs daily at 6:00 PM UTC, adjust timezone as needed)
   - Target: Your Lambda function

3. **Update Lambda Function Code**
   ```javascript
   // Example Lambda handler
   const { sendDailyAssignmentEmailsToAllDrivers } = require('./dailyAssignmentEmail');
   
   exports.handler = async (event) => {
     try {
       const result = await sendDailyAssignmentEmailsToAllDrivers();
       return {
         statusCode: 200,
         body: JSON.stringify({
           message: 'Daily assignment emails sent',
           sent: result.sent,
           failed: result.failed,
           skipped: result.skipped
         })
       };
     } catch (error) {
       return {
         statusCode: 500,
         body: JSON.stringify({ error: error.message })
       };
     }
   };
   ```

### Option 2: AWS SES Integration (For Direct Email Sending)

For production, replace mailto links with direct email sending:

1. **Set Up AWS SES**
   - Verify your sending domain
   - Request production access if needed
   - Configure IAM permissions

2. **Update Email Function**
   - Replace `mailto:` links with AWS SES API calls
   - Use AWS SDK to send emails directly
   - Handle bounces and complaints

3. **Example SES Integration**
   ```typescript
   import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
   
   const sesClient = new SESClient({ region: 'us-east-1' });
   
   async function sendEmailViaSES(to: string, subject: string, body: string) {
     const command = new SendEmailCommand({
       Source: 'noreply@yourdomain.com',
       Destination: { ToAddresses: [to] },
       Message: {
         Subject: { Data: subject },
         Body: { Text: { Data: body } }
       }
     });
     
     return await sesClient.send(command);
   }
   ```

### Option 3: Third-Party Email Service

Integrate with services like:
- SendGrid
- Mailgun
- Postmark
- Resend

## Usage

### Manual Trigger (Current)

1. Navigate to Management Dashboard
2. Click "Send Daily Assignment Emails" button
3. Select notification methods:
   - **Email**: Click OK to enable, Cancel to skip
   - **SMS**: Click OK to enable, Cancel to skip
4. Confirm the action
5. Email clients and/or SMS apps will open for each driver with trips
6. Review the summary showing sent/failed/skipped counts for each method

### Notification Method Selection

- **Email Only**: Select Email, skip SMS
- **SMS Only**: Skip Email, select SMS (requires phone numbers)
- **Both**: Select both Email and SMS (drivers receive both if they have both contact methods)

### Automated (Future)

Once Lambda + EventBridge is set up:
- Emails will send automatically daily at the scheduled time
- No manual intervention required
- Monitor via CloudWatch Logs

## Configuration

### Email Timing

By default, emails are generated for **tomorrow's trips**. To change the target date:

```typescript
import { addDays } from 'date-fns';

// Send for 2 days from now
const targetDate = addDays(new Date(), 2);
await sendDailyAssignmentEmailsToAllDrivers(targetDate);
```

### Filtering Drivers

Drivers are filtered based on selected notification methods:
- **For Email**: `isActive === true` AND `email` is not null/empty
- **For SMS**: `isActive === true` AND `phone` is not null/empty
- Drivers can receive one or both notification types depending on available contact information

### Skipping Drivers

Drivers are skipped if:
- They have no trips scheduled for the target date
- They don't have the required contact information for selected notification methods:
  - No email address (if Email is selected)
  - No phone number (if SMS is selected)
- They are marked as inactive

## Troubleshooting

### Notifications Not Opening

**Email Issues:**
- **Check pop-up blocker**: Allow pop-ups for the application
- **Check browser settings**: Some browsers block multiple window.open() calls
- **Check email client**: Ensure default email client is configured

**SMS Issues:**
- **Mobile devices**: SMS links work best on mobile devices with SMS apps installed
- **Desktop**: May not work on desktop browsers (requires mobile device or SMS app)
- **Phone number format**: Ensure phone numbers are in correct format (e.g., +1234567890)
- **Production**: For production use, integrate with backend API (AWS SNS, Twilio, etc.)

### Missing Trips

- Verify trips are assigned to the driver
- Check trip pickup dates match the target date
- Ensure trips are not in "Completed" status (if filtering by status)

### Lambda Function Issues

- Check CloudWatch Logs for errors
- Verify IAM permissions for Amplify Data API
- Ensure Lambda timeout is sufficient (recommend 30+ seconds)

## SMS Integration for Production

### Current Implementation

The current SMS implementation uses `sms:` links which:
- Work on mobile devices with SMS apps
- May not work on desktop browsers
- Require manual sending (opens SMS app with pre-filled message)

### Production SMS Options

For automated SMS sending, integrate with one of these services:

#### Option 1: AWS SNS (Simple Notification Service)

```typescript
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

const snsClient = new SNSClient({ region: 'us-east-1' });

async function sendSMSViaSNS(phoneNumber: string, message: string) {
  const command = new PublishCommand({
    PhoneNumber: phoneNumber,
    Message: message,
  });
  
  return await snsClient.send(command);
}
```

#### Option 2: Twilio

```typescript
import twilio from 'twilio';

const client = twilio(accountSid, authToken);

async function sendSMSViaTwilio(phoneNumber: string, message: string) {
  return await client.messages.create({
    body: message,
    to: phoneNumber,
    from: twilioPhoneNumber,
  });
}
```

#### Option 3: Other Services

- SendGrid SMS
- MessageBird
- Vonage (formerly Nexmo)

**Important**: SMS sending should be done via a backend API endpoint for security (API keys should not be in frontend code).

## Future Enhancements

- [ ] Email template customization
- [ ] HTML email support
- [ ] Email delivery tracking
- [ ] SMS delivery tracking
- [ ] Retry logic for failed sends
- [ ] Driver notification preferences (choose email, SMS, or both)
- [ ] Backend API for automated SMS sending
- [ ] Calendar integration (ICS file attachment)
- [ ] Multi-language support
