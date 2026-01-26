/**
 * Send Booking Email Lambda Handler
 * Sends booking confirmation emails to customers and notifications to managers
 */

import type { Handler } from 'aws-lambda';

interface BookingConfirmationRequest {
  type: 'customer_confirmation' | 'manager_notification';
  to: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  companyName: string;
  bookingId: string;
  pickupDate: string;
  pickupLocation: string;
  dropoffLocation: string;
  numberOfPassengers: number;
  tripType?: string;
  flightNumber?: string;
  vehicleType?: string;
  isRoundTrip?: boolean;
  returnDate?: string;
  specialInstructions?: string;
}

interface BookingEmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Response headers (CORS is handled by Lambda Function URL settings in AWS Console)
 */
const responseHeaders = {
  'Content-Type': 'application/json',
};

/**
 * Generate HTML email content for customer booking confirmation
 */
function generateCustomerConfirmationHtml(data: BookingConfirmationRequest): string {
  const { customerName, companyName, bookingId, pickupDate, pickupLocation, dropoffLocation, numberOfPassengers, tripType, flightNumber, vehicleType, isRoundTrip, returnDate, specialInstructions } = data;
  
  const pickupDateObj = new Date(pickupDate);
  const formattedDate = pickupDateObj.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  const formattedTime = pickupDateObj.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background-color: #667eea;
      color: white;
      padding: 20px;
      text-align: center;
      border-radius: 8px 8px 0 0;
    }
    .content {
      background-color: #f9f9f9;
      padding: 30px;
      border: 1px solid #ddd;
      border-top: none;
    }
    .booking-details {
      background-color: white;
      padding: 20px;
      border-radius: 5px;
      margin: 20px 0;
      border-left: 4px solid #667eea;
    }
    .detail-row {
      margin: 10px 0;
      padding: 8px 0;
      border-bottom: 1px solid #eee;
    }
    .detail-row:last-child {
      border-bottom: none;
    }
    .detail-label {
      font-weight: bold;
      color: #555;
      display: inline-block;
      width: 140px;
    }
    .detail-value {
      color: #333;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      font-size: 12px;
      color: #666;
      text-align: center;
    }
    .booking-id {
      background-color: #f0f0f0;
      padding: 10px;
      border-radius: 5px;
      font-family: monospace;
      text-align: center;
      margin: 15px 0;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Booking Confirmation</h1>
  </div>
  <div class="content">
    <h2>Thank you for your booking request, ${customerName}!</h2>
    <p>Your booking request has been received by <strong>${companyName}</strong> and is currently pending review.</p>
    
    <div class="booking-id">
      Request ID: ${bookingId.substring(0, 8).toUpperCase()}
    </div>
    
    <div class="booking-details">
      <h3 style="margin-top: 0;">Booking Details</h3>
      <div class="detail-row">
        <span class="detail-label">Trip Type:</span>
        <span class="detail-value">${tripType || 'Standard Trip'}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Pickup Date:</span>
        <span class="detail-value">${formattedDate}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Pickup Time:</span>
        <span class="detail-value">${formattedTime}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Pickup Location:</span>
        <span class="detail-value">${pickupLocation}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Drop-off Location:</span>
        <span class="detail-value">${dropoffLocation}</span>
      </div>
      ${flightNumber ? `
      <div class="detail-row">
        <span class="detail-label">Flight Number:</span>
        <span class="detail-value">${flightNumber}</span>
      </div>
      ` : ''}
      <div class="detail-row">
        <span class="detail-label">Passengers:</span>
        <span class="detail-value">${numberOfPassengers}</span>
      </div>
      ${vehicleType ? `
      <div class="detail-row">
        <span class="detail-label">Vehicle Type:</span>
        <span class="detail-value">${vehicleType}</span>
      </div>
      ` : ''}
      ${isRoundTrip && returnDate ? `
      <div class="detail-row">
        <span class="detail-label">Return Date:</span>
        <span class="detail-value">${new Date(returnDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
      </div>
      ` : ''}
      ${specialInstructions ? `
      <div class="detail-row">
        <span class="detail-label">Special Instructions:</span>
        <span class="detail-value">${specialInstructions}</span>
      </div>
      ` : ''}
    </div>
    
    <p><strong>What happens next?</strong></p>
    <p>A manager from ${companyName} will review your request and confirm your trip. You will be contacted once your booking is approved.</p>
    
    <p>If you have any questions or need to make changes, please contact ${companyName} directly.</p>
  </div>
  <div class="footer">
    <p>This is an automated confirmation email. Please do not reply to this message.</p>
    <p>&copy; ${new Date().getFullYear()} Onyx Transportation App. All rights reserved.</p>
  </div>
</body>
</html>
  `;
}

/**
 * Generate plain text email content for customer booking confirmation
 */
function generateCustomerConfirmationText(data: BookingConfirmationRequest): string {
  const { customerName, companyName, bookingId, pickupDate, pickupLocation, dropoffLocation, numberOfPassengers, tripType, flightNumber, vehicleType, isRoundTrip, returnDate, specialInstructions } = data;
  
  const pickupDateObj = new Date(pickupDate);
  const formattedDate = pickupDateObj.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  const formattedTime = pickupDateObj.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });

  let text = `Thank you for your booking request, ${customerName}!\n\n`;
  text += `Your booking request has been received by ${companyName} and is currently pending review.\n\n`;
  text += `Request ID: ${bookingId.substring(0, 8).toUpperCase()}\n\n`;
  text += `BOOKING DETAILS:\n`;
  text += `Trip Type: ${tripType || 'Standard Trip'}\n`;
  text += `Pickup Date: ${formattedDate}\n`;
  text += `Pickup Time: ${formattedTime}\n`;
  text += `Pickup Location: ${pickupLocation}\n`;
  text += `Drop-off Location: ${dropoffLocation}\n`;
  if (flightNumber) {
    text += `Flight Number: ${flightNumber}\n`;
  }
  text += `Passengers: ${numberOfPassengers}\n`;
  if (vehicleType) {
    text += `Vehicle Type: ${vehicleType}\n`;
  }
  if (isRoundTrip && returnDate) {
    text += `Return Date: ${new Date(returnDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}\n`;
  }
  if (specialInstructions) {
    text += `Special Instructions: ${specialInstructions}\n`;
  }
  text += `\nWhat happens next?\n`;
  text += `A manager from ${companyName} will review your request and confirm your trip. You will be contacted once your booking is approved.\n\n`;
  text += `If you have any questions or need to make changes, please contact ${companyName} directly.\n\n`;
  text += `This is an automated confirmation email. Please do not reply to this message.\n`;

  return text;
}

/**
 * Generate HTML email content for manager notification
 */
function generateManagerNotificationHtml(data: BookingConfirmationRequest): string {
  const { customerName, customerEmail, customerPhone, companyName, bookingId, pickupDate, pickupLocation, dropoffLocation, numberOfPassengers, tripType, flightNumber, vehicleType, isRoundTrip, returnDate, specialInstructions } = data;
  
  const pickupDateObj = new Date(pickupDate);
  const formattedDate = pickupDateObj.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  const formattedTime = pickupDateObj.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background-color: #e74c3c;
      color: white;
      padding: 20px;
      text-align: center;
      border-radius: 8px 8px 0 0;
    }
    .content {
      background-color: #f9f9f9;
      padding: 30px;
      border: 1px solid #ddd;
      border-top: none;
    }
    .booking-details {
      background-color: white;
      padding: 20px;
      border-radius: 5px;
      margin: 20px 0;
      border-left: 4px solid #e74c3c;
    }
    .detail-row {
      margin: 10px 0;
      padding: 8px 0;
      border-bottom: 1px solid #eee;
    }
    .detail-row:last-child {
      border-bottom: none;
    }
    .detail-label {
      font-weight: bold;
      color: #555;
      display: inline-block;
      width: 160px;
    }
    .detail-value {
      color: #333;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      font-size: 12px;
      color: #666;
      text-align: center;
    }
    .booking-id {
      background-color: #fff3cd;
      padding: 10px;
      border-radius: 5px;
      font-family: monospace;
      text-align: center;
      margin: 15px 0;
      font-weight: bold;
      border: 2px solid #ffc107;
    }
    .action-button {
      display: inline-block;
      background-color: #667eea;
      color: white;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 5px;
      margin: 20px 0;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>New Booking Request</h1>
  </div>
  <div class="content">
    <h2>New booking request received for ${companyName}</h2>
    <p>A new booking request has been submitted through the public booking portal and requires your review.</p>
    
    <div class="booking-id">
      Request ID: ${bookingId.substring(0, 8).toUpperCase()}
    </div>
    
    <div class="booking-details">
      <h3 style="margin-top: 0;">Customer Information</h3>
      <div class="detail-row">
        <span class="detail-label">Name:</span>
        <span class="detail-value">${customerName}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Email:</span>
        <span class="detail-value">${customerEmail}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Phone:</span>
        <span class="detail-value">${customerPhone}</span>
      </div>
      
      <h3 style="margin-top: 20px;">Trip Details</h3>
      <div class="detail-row">
        <span class="detail-label">Trip Type:</span>
        <span class="detail-value">${tripType || 'Standard Trip'}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Pickup Date:</span>
        <span class="detail-value">${formattedDate}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Pickup Time:</span>
        <span class="detail-value">${formattedTime}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Pickup Location:</span>
        <span class="detail-value">${pickupLocation}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Drop-off Location:</span>
        <span class="detail-value">${dropoffLocation}</span>
      </div>
      ${flightNumber ? `
      <div class="detail-row">
        <span class="detail-label">Flight Number:</span>
        <span class="detail-value">${flightNumber}</span>
      </div>
      ` : ''}
      <div class="detail-row">
        <span class="detail-label">Passengers:</span>
        <span class="detail-value">${numberOfPassengers}</span>
      </div>
      ${vehicleType ? `
      <div class="detail-row">
        <span class="detail-label">Vehicle Type:</span>
        <span class="detail-value">${vehicleType}</span>
      </div>
      ` : ''}
      ${isRoundTrip && returnDate ? `
      <div class="detail-row">
        <span class="detail-label">Return Date:</span>
        <span class="detail-value">${new Date(returnDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
      </div>
      ` : ''}
      ${specialInstructions ? `
      <div class="detail-row">
        <span class="detail-label">Special Instructions:</span>
        <span class="detail-value">${specialInstructions}</span>
      </div>
      ` : ''}
    </div>
    
    <p><strong>Action Required:</strong></p>
    <p>Please log in to the Management Dashboard to review and accept or reject this booking request.</p>
  </div>
  <div class="footer">
    <p>This is an automated notification from Onyx Transportation App.</p>
    <p>&copy; ${new Date().getFullYear()} Onyx Transportation App. All rights reserved.</p>
  </div>
</body>
</html>
  `;
}

/**
 * Generate plain text email content for manager notification
 */
function generateManagerNotificationText(data: BookingConfirmationRequest): string {
  const { customerName, customerEmail, customerPhone, companyName, bookingId, pickupDate, pickupLocation, dropoffLocation, numberOfPassengers, tripType, flightNumber, vehicleType, isRoundTrip, returnDate, specialInstructions } = data;
  
  const pickupDateObj = new Date(pickupDate);
  const formattedDate = pickupDateObj.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  const formattedTime = pickupDateObj.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });

  let text = `New booking request received for ${companyName}\n\n`;
  text += `A new booking request has been submitted through the public booking portal and requires your review.\n\n`;
  text += `Request ID: ${bookingId.substring(0, 8).toUpperCase()}\n\n`;
  text += `CUSTOMER INFORMATION:\n`;
  text += `Name: ${customerName}\n`;
  text += `Email: ${customerEmail}\n`;
  text += `Phone: ${customerPhone}\n\n`;
  text += `TRIP DETAILS:\n`;
  text += `Trip Type: ${tripType || 'Standard Trip'}\n`;
  text += `Pickup Date: ${formattedDate}\n`;
  text += `Pickup Time: ${formattedTime}\n`;
  text += `Pickup Location: ${pickupLocation}\n`;
  text += `Drop-off Location: ${dropoffLocation}\n`;
  if (flightNumber) {
    text += `Flight Number: ${flightNumber}\n`;
  }
  text += `Passengers: ${numberOfPassengers}\n`;
  if (vehicleType) {
    text += `Vehicle Type: ${vehicleType}\n`;
  }
  if (isRoundTrip && returnDate) {
    text += `Return Date: ${new Date(returnDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}\n`;
  }
  if (specialInstructions) {
    text += `Special Instructions: ${specialInstructions}\n`;
  }
  text += `\nAction Required:\n`;
  text += `Please log in to the Management Dashboard to review and accept or reject this booking request.\n\n`;
  text += `This is an automated notification from Onyx Transportation App.\n`;

  return text;
}

/**
 * Get email service configuration (SendGrid preferred, Postmark fallback)
 * Requires one of:
 * - SENDGRID_API_KEY: SendGrid API key (preferred)
 * - OR POSTMARK_API_KEY: Server API token from Postmark (fallback)
 * - EMAIL_FROM: Verified sender email address (defaults to noreply@onyxdispatch.us)
 */
function getEmailConfig() {
  // Prefer SendGrid (faster, more reliable)
  const sendGridApiKey = process.env.SENDGRID_API_KEY;
  if (sendGridApiKey) {
    return {
      provider: 'sendgrid',
      apiKey: sendGridApiKey,
      fromEmail: process.env.EMAIL_FROM || 'noreply@onyxdispatch.us',
    };
  }

  // Fallback to Postmark
  const postmarkApiKey = process.env.POSTMARK_API_KEY;
  if (postmarkApiKey) {
    return {
      provider: 'postmark',
      apiKey: postmarkApiKey,
      fromEmail: process.env.EMAIL_FROM || process.env.POSTMARK_FROM_EMAIL || 'noreply@onyxdispatch.us',
    };
  }

  throw new Error(
    'SENDGRID_API_KEY or POSTMARK_API_KEY environment variable must be set for email sending.'
  );
}

/**
 * Lambda handler for sending booking emails via SendGrid (preferred) or Postmark (fallback)
 */
export const handler: Handler = async (event: any): Promise<any> => {
  try {
    // Parse request body (handle both API Gateway and Function URL formats)
    let requestBody: BookingConfirmationRequest;
    
    // Lambda Function URL format (has requestContext.http)
    if (event.requestContext?.http) {
      // Function URL format - body is always a string
      if (typeof event.body === 'string') {
        try {
          requestBody = event.body ? JSON.parse(event.body) : {};
        } catch (parseError) {
          return {
            statusCode: 400,
            headers: responseHeaders,
            body: JSON.stringify({ 
              success: false, 
              error: 'Invalid JSON in request body' 
            }),
          };
        }
      } else {
        requestBody = event.body || {};
      }
    } else if (typeof event.body === 'string') {
      // API Gateway format
      try {
        requestBody = event.body ? JSON.parse(event.body) : {};
      } catch (parseError) {
        return {
          statusCode: 400,
          headers: responseHeaders,
          body: JSON.stringify({ 
            success: false, 
            error: 'Invalid JSON in request body' 
          }),
        };
      }
    } else if (event.body) {
      requestBody = event.body;
    } else {
      requestBody = event; // Direct invocation
    }

    // Validate required fields
    if (!requestBody.to || !requestBody.customerName || !requestBody.companyName || !requestBody.bookingId) {
      const errorResponse = {
        success: false,
        error: 'Missing required fields: to, customerName, companyName, and bookingId are required',
      };
      return {
        statusCode: 400,
        headers: responseHeaders,
        body: JSON.stringify(errorResponse),
      };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(requestBody.to)) {
      const errorResponse = {
        success: false,
        error: 'Invalid email address format',
      };
      return {
        statusCode: 400,
        headers: responseHeaders,
        body: JSON.stringify(errorResponse),
      };
    }

    // Validate type
    if (!requestBody.type || (requestBody.type !== 'customer_confirmation' && requestBody.type !== 'manager_notification')) {
      const errorResponse = {
        success: false,
        error: 'Invalid type. Must be "customer_confirmation" or "manager_notification"',
      };
      return {
        statusCode: 400,
        headers: responseHeaders,
        body: JSON.stringify(errorResponse),
      };
    }

    // Get email service configuration
    const config = getEmailConfig();

    // Generate email content based on type
    let subject: string;
    let htmlBody: string;
    let textBody: string;

    if (requestBody.type === 'customer_confirmation') {
      subject = `Booking Confirmation - ${requestBody.companyName}`;
      htmlBody = generateCustomerConfirmationHtml(requestBody);
      textBody = generateCustomerConfirmationText(requestBody);
    } else {
      subject = `New Booking Request - ${requestBody.companyName}`;
      htmlBody = generateManagerNotificationHtml(requestBody);
      textBody = generateManagerNotificationText(requestBody);
    }

    let emailResponse;
    let messageId;

    if (config.provider === 'sendgrid') {
      // Send via SendGrid API (faster, more reliable)
      const sendGridResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: { email: config.fromEmail },
          personalizations: [{
            to: [{ email: requestBody.to }],
            subject: subject,
          }],
          content: [
            { type: 'text/plain', value: textBody },
            { type: 'text/html', value: htmlBody },
          ],
        }),
      });

      if (!sendGridResponse.ok) {
        const errorText = await sendGridResponse.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { errors: [{ message: `HTTP ${sendGridResponse.status}: ${sendGridResponse.statusText}` }] };
        }
        throw new Error(errorData.errors?.[0]?.message || `SendGrid API error: ${sendGridResponse.status}`);
      }

      // SendGrid returns 202 Accepted with X-Message-Id header
      messageId = sendGridResponse.headers.get('X-Message-Id') || 'unknown';
      emailResponse = sendGridResponse;

      console.log('Booking email sent successfully via SendGrid:', {
        to: requestBody.to,
        type: requestBody.type,
        companyName: requestBody.companyName,
        bookingId: requestBody.bookingId,
        messageId,
      });
    } else {
      // Fallback to Postmark
      const postmarkResponse = await fetch('https://api.postmarkapp.com/email', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-Postmark-Server-Token': config.apiKey,
        },
        body: JSON.stringify({
          From: config.fromEmail,
          To: requestBody.to,
          Subject: subject,
          HtmlBody: htmlBody,
          TextBody: textBody,
          MessageStream: 'outbound',
        }),
      });

      if (!postmarkResponse.ok) {
        const errorData = await postmarkResponse.json().catch(() => ({ 
          Message: `HTTP ${postmarkResponse.status}: ${postmarkResponse.statusText}` 
        }));
        throw new Error(errorData.Message || `Postmark API error: ${postmarkResponse.status}`);
      }

      const postmarkResult = await postmarkResponse.json();
      messageId = postmarkResult.MessageID;
      emailResponse = postmarkResponse;

      console.log('Booking email sent successfully via Postmark:', {
        to: requestBody.to,
        type: requestBody.type,
        companyName: requestBody.companyName,
        bookingId: requestBody.bookingId,
        messageId,
      });
    }

    const successResponse = {
      success: true,
      messageId,
    };

    return {
      statusCode: 200,
      headers: responseHeaders,
      body: JSON.stringify(successResponse),
    };
  } catch (error: any) {
    console.error('Error sending booking email:', error);

    let errorMessage = 'Unknown error occurred while sending email.';

    if (error && typeof error.message === 'string') {
      errorMessage = error.message;
    } else if (error && error.ErrorCode) {
      // Postmark-specific error format (from API response)
      errorMessage = `${error.Message || error.message || errorMessage} (Error Code: ${error.ErrorCode})`;
    }

    const errorResponse = {
      success: false,
      error: errorMessage,
    };

    return {
      statusCode: 500,
      headers: responseHeaders,
      body: JSON.stringify(errorResponse),
    };
  }
};
