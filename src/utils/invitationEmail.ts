/**
 * Invitation Email Utility
 * Generates and sends invitation emails for new company users
 */

export interface InvitationEmailData {
  email: string;
  companyName: string;
  role: string;
  inviterName?: string;
}

/**
 * Generate invitation email content
 */
export function generateInvitationEmail(data: InvitationEmailData): { subject: string; body: string; signupUrl: string } {
  const { email, companyName, role, inviterName } = data;
  
  // Get the app URL (default to current origin)
  // Use custom domain in production, fallback to current origin
  const appUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : (import.meta.env.VITE_APP_URL || 'https://onyxdispatch.us');
  
  // Create signup URL with email pre-filled
  const signupUrl = `${appUrl}/?signup=true&email=${encodeURIComponent(email)}`;
  
  const subject = `You've been invited to join ${companyName} on Onyx Transportation App`;
  
  let body = `Hello,\n\n`;
  
  if (inviterName) {
    body += `${inviterName} has invited you to join ${companyName} on the Onyx Transportation App.\n\n`;
  } else {
    body += `You have been invited to join ${companyName} on the Onyx Transportation App.\n\n`;
  }
  
  body += `Your role: ${role.charAt(0).toUpperCase() + role.slice(1)}\n\n`;
  body += `To get started:\n\n`;
  body += `1. Click the link below to sign up:\n`;
  body += `${signupUrl}\n\n`;
  body += `2. Create your account using this email address: ${email}\n\n`;
  body += `3. Once you sign up, you'll automatically be linked to ${companyName}.\n\n`;
  body += `If you have any questions, please contact your company administrator.\n\n`;
  body += `Welcome aboard!\n`;
  body += `Onyx Transportation Team`;
  
  return { subject, body, signupUrl };
}

/**
 * Send invitation email using mailto link
 * Note: This opens the user's email client. For automated sending, use a Lambda function.
 */
export function sendInvitationEmail(data: InvitationEmailData): void {
  const { subject, body } = generateInvitationEmail(data);
  const { email } = data;
  
  // Create mailto link
  // Note: Some email clients have limits on body length, so we'll keep it reasonable
  const mailtoLink = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  
  // Try multiple methods to open email client (more reliable than window.open)
  try {
    // Method 1: Create and click an anchor element (most reliable, works even with popup blockers)
    const anchor = document.createElement('a');
    anchor.href = mailtoLink;
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    
    console.log(`Invitation email prepared for ${email}`);
  } catch (error) {
    // Fallback: Try window.location (may navigate away, but works)
    console.warn('Failed to open email via anchor click, trying window.location:', error);
    try {
      window.location.href = mailtoLink;
    } catch (locationError) {
      // Last resort: window.open (may be blocked by popup blockers)
      console.warn('Failed to open email via window.location, trying window.open:', locationError);
      window.open(mailtoLink, '_blank');
    }
  }
}

/**
 * Get invitation email content (for use with Lambda function or other email service)
 */
export function getInvitationEmailContent(data: InvitationEmailData): { to: string; subject: string; body: string; signupUrl: string } {
  const { subject, body, signupUrl } = generateInvitationEmail(data);
  const { email } = data;
  
  return {
    to: email,
    subject,
    body,
    signupUrl,
  };
}
