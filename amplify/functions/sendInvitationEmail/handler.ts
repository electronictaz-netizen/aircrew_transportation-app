/**
 * Send Invitation Email Lambda Handler
 * Sends invitation emails via Postmark REST API
 */

import type { Handler } from 'aws-lambda';

interface InvitationRequest {
  to: string;
  companyName: string;
  role: string;
  inviterName?: string;
  signupUrl: string;
}

interface InvitationResponse {
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
 * Generate HTML email content for invitation
 */
function generateInvitationEmailHtml(data: InvitationRequest): string {
  const { companyName, role, inviterName, signupUrl } = data;
  
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
    .button {
      display: inline-block;
      background-color: #667eea;
      color: white;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 5px;
      margin: 20px 0;
      font-weight: bold;
    }
    .button:hover {
      background-color: #5568d3;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      font-size: 12px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Onyx Transportation App</h1>
  </div>
  <div class="content">
    <h2>You've Been Invited!</h2>
    <p>Hello,</p>
    ${inviterName 
      ? `<p><strong>${inviterName}</strong> has invited you to join <strong>${companyName}</strong> on the Onyx Transportation App.</p>`
      : `<p>You have been invited to join <strong>${companyName}</strong> on the Onyx Transportation App.</p>`
    }
    <p><strong>Your role:</strong> ${role.charAt(0).toUpperCase() + role.slice(1)}</p>
    <p>To get started, click the button below to create your account:</p>
    <div style="text-align: center;">
      <a href="${signupUrl}" class="button">Accept Invitation & Sign Up</a>
    </div>
    <p>Or copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #667eea;">${signupUrl}</p>
    <p><strong>Important:</strong> Please use this email address (${data.to}) when signing up to automatically link your account to ${companyName}.</p>
    <p>If you have any questions, please contact your company administrator.</p>
    <div class="footer">
      <p>Welcome aboard!</p>
      <p>Onyx Transportation Team</p>
      <p style="margin-top: 20px; font-size: 11px; color: #999;">
        This is an automated message. Please do not reply to this email.
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Generate plain text email content for invitation
 */
function generateInvitationEmailText(data: InvitationRequest): string {
  const { companyName, role, inviterName, signupUrl } = data;
  
  let text = `Hello,\n\n`;
  
  if (inviterName) {
    text += `${inviterName} has invited you to join ${companyName} on the Onyx Transportation App.\n\n`;
  } else {
    text += `You have been invited to join ${companyName} on the Onyx Transportation App.\n\n`;
  }
  
  text += `Your role: ${role.charAt(0).toUpperCase() + role.slice(1)}\n\n`;
  text += `To get started:\n\n`;
  text += `1. Click the link below to sign up:\n`;
  text += `${signupUrl}\n\n`;
  text += `2. Create your account using this email address: ${data.to}\n\n`;
  text += `3. Once you sign up, you'll automatically be linked to ${companyName}.\n\n`;
  text += `If you have any questions, please contact your company administrator.\n\n`;
  text += `Welcome aboard!\n`;
  text += `Onyx Transportation Team`;
  
  return text;
}

/**
 * Get email service configuration from environment variables.
 * Supports both SendGrid and Postmark (SendGrid preferred for speed).
 *
 * Required:
 * - SENDGRID_API_KEY: API key from SendGrid (preferred)
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
 * Lambda handler for sending invitation emails via SendGrid (preferred) or Postmark (fallback)
 * Note: CORS is handled by Lambda Function URL settings in AWS Console
 */
export const handler: Handler = async (event: any): Promise<any> => {
  // OPTIONS requests are handled automatically by AWS when CORS is enabled in Function URL settings
  // No need to handle them in the handler code

  try {
    // Parse request body (handle both API Gateway and Function URL formats)
    let requestBody: InvitationRequest;
    
    // Lambda Function URL format (has requestContext.http)
    if (event.requestContext?.http) {
      // Function URL format - body is always a string
      if (typeof event.body === 'string') {
        try {
          requestBody = event.body ? JSON.parse(event.body) : {};
        } catch (parseError) {
          return {
            statusCode: 400,
            headers: corsHeaders,
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
    if (!requestBody.to || !requestBody.companyName || !requestBody.signupUrl) {
      const errorResponse = {
        success: false,
        error: 'Missing required fields: to, companyName, and signupUrl are required',
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

    // Get email service configuration
    const config = getEmailConfig();

    // Generate email content
    const subject = `You've been invited to join ${requestBody.companyName} on Onyx Transportation App`;
    const htmlBody = generateInvitationEmailHtml(requestBody);
    const textBody = generateInvitationEmailText(requestBody);

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

      console.log('Invitation email sent successfully via SendGrid:', {
        to: requestBody.to,
        companyName: requestBody.companyName,
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

      console.log('Invitation email sent successfully via Postmark:', {
        to: requestBody.to,
        companyName: requestBody.companyName,
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
    console.error('Error sending invitation email:', error);

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
