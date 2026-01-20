/**
 * Send Invitation Email Lambda Handler
 * Sends invitation emails via AWS SES
 */

import type { Handler } from 'aws-lambda';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

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
 * Get sender email address from environment or use default
 */
function getSenderEmail(): string {
  // Check for configured sender email
  const senderEmail = process.env.SES_SENDER_EMAIL;
  if (senderEmail) {
    return senderEmail;
  }
  
  // Default to support email
  return 'support@tazsoftware.biz';
}

/**
 * Lambda handler for sending invitation emails
 */
export const handler: Handler = async (event: any): Promise<InvitationResponse> => {
  try {
    // Parse request body (handle both API Gateway and Function URL formats)
    let requestBody: InvitationRequest;
    
    if (typeof event.body === 'string') {
      requestBody = JSON.parse(event.body);
    } else if (event.body) {
      requestBody = event.body;
    } else {
      requestBody = event; // Direct invocation
    }

    // Validate required fields
    if (!requestBody.to || !requestBody.companyName || !requestBody.signupUrl) {
      return {
        success: false,
        error: 'Missing required fields: to, companyName, and signupUrl are required',
      };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(requestBody.to)) {
      return {
        success: false,
        error: 'Invalid email address format',
      };
    }

    // Get sender email
    const senderEmail = getSenderEmail();
    
    // Generate email content
    const subject = `You've been invited to join ${requestBody.companyName} on Onyx Transportation App`;
    const htmlBody = generateInvitationEmailHtml(requestBody);
    const textBody = generateInvitationEmailText(requestBody);

    // Initialize SES client
    const sesClient = new SESClient({ region: process.env.AWS_REGION || 'us-east-1' });

    // Send email via SES
    const sendEmailCommand = new SendEmailCommand({
      Source: senderEmail,
      Destination: {
        ToAddresses: [requestBody.to],
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: htmlBody,
            Charset: 'UTF-8',
          },
          Text: {
            Data: textBody,
            Charset: 'UTF-8',
          },
        },
      },
    });

    const response = await sesClient.send(sendEmailCommand);

    console.log('Invitation email sent successfully:', {
      to: requestBody.to,
      companyName: requestBody.companyName,
      messageId: response.MessageId,
    });

    return {
      success: true,
      messageId: response.MessageId,
    };
  } catch (error: any) {
    console.error('Error sending invitation email:', error);
    
    // Provide helpful error messages
    let errorMessage = 'Unknown error occurred';
    
    if (error.name === 'MessageRejected') {
      errorMessage = 'Email was rejected. Please verify the recipient email address and SES configuration.';
    } else if (error.name === 'MailFromDomainNotVerifiedException') {
      errorMessage = 'Sender email domain not verified in SES. Please verify your domain or email address in AWS SES.';
    } else if (error.message) {
      errorMessage = error.message;
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
};
