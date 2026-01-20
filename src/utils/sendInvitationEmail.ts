/**
 * Send Invitation Email Utility
 * Calls the Lambda function to send invitation emails via AWS SES
 */

import { getInvitationEmailContent } from './invitationEmail';

interface SendInvitationRequest {
  email: string;
  companyName: string;
  role: string;
  inviterName?: string;
}

interface SendInvitationResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Get Lambda Function URL for sendInvitationEmail
 * Returns null if not configured (will fall back to mailto)
 */
function getInvitationEmailUrl(): string | null {
  // Check environment variable first (recommended for production)
  const functionUrl = import.meta.env.VITE_SEND_INVITATION_EMAIL_URL;
  
  if (functionUrl && functionUrl.trim() !== '') {
    return functionUrl.trim().replace(/\/$/, '');
  }

  // Return null instead of throwing - allows fallback to mailto
  return null;
}

/**
 * Check if Lambda function is configured
 */
export function isLambdaEmailConfigured(): boolean {
  return getInvitationEmailUrl() !== null;
}

/**
 * Send invitation email via Lambda function
 * Returns null if Lambda is not configured (should fall back to mailto)
 */
export async function sendInvitationEmailViaLambda(
  data: SendInvitationRequest
): Promise<SendInvitationResponse | null> {
  // Check if Lambda is configured
  const functionUrl = getInvitationEmailUrl();
  if (!functionUrl) {
    // Not configured - return null to indicate fallback should be used
    return null;
  }

  try {
    // Get the app URL for the signup link
    const appUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : 'https://main.d1wxo3x0z5r1oq.amplifyapp.com';
    
    // Generate signup URL with email pre-filled
    const signupUrl = `${appUrl}/?signup=true&email=${encodeURIComponent(data.email)}`;
    
    // Log for debugging (only in development)
    if (import.meta.env.DEV) {
      console.log('[Send Invitation Email] Calling function URL:', functionUrl);
      console.log('[Send Invitation Email] Request payload:', {
        to: data.email,
        companyName: data.companyName,
        role: data.role,
        inviterName: data.inviterName,
        signupUrl,
      });
    }

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: data.email,
        companyName: data.companyName,
        role: data.role,
        inviterName: data.inviterName,
        signupUrl,
      }),
    });

    // Log response for debugging
    if (import.meta.env.DEV) {
      console.log('[Send Invitation Email] Response status:', response.status);
    }

    if (!response.ok) {
      let errorData;
      try {
        const text = await response.text();
        errorData = text ? JSON.parse(text) : { error: `HTTP ${response.status}` };
      } catch (parseError) {
        errorData = { 
          error: `HTTP error! status: ${response.status}`,
          statusText: response.statusText
        };
      }
      
      console.error('[Send Invitation Email] Error response:', errorData);
      throw new Error(
        errorData.error || 
        errorData.message || 
        `HTTP error! status: ${response.status} ${response.statusText}`
      );
    }

    const result = await response.json();
    
    if (!result.success) {
      console.error('[Send Invitation Email] Function returned error:', result);
      throw new Error(result.error || 'Failed to send invitation email');
    }

    return result;
  } catch (error) {
    // Provide helpful error messages
    if (error instanceof TypeError && error.message.includes('fetch')) {
      const functionUrl = import.meta.env.VITE_SEND_INVITATION_EMAIL_URL || 'not configured';
      console.error('[Send Invitation Email] Network error:', error);
      console.error('[Send Invitation Email] Function URL:', functionUrl);
      throw new Error(
        'Unable to connect to email service. ' +
        'Please verify the Function URL is configured correctly. ' +
        `URL: ${functionUrl}`
      );
    }
    console.error('[Send Invitation Email] Error sending invitation:', error);
    throw error;
  }
}
