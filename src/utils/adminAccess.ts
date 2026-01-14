/**
 * Admin Access Control
 * 
 * Configure which users can access the Admin Dashboard
 */

import { useAuthenticator } from '@aws-amplify/ui-react';

/**
 * List of authorized admin emails
 * Add your email address here to grant admin access
 */
const AUTHORIZED_ADMIN_EMAILS: string[] = [
  'electronictaz@gmail.com',
  
];

/**
 * List of authorized admin user IDs (Cognito User IDs)
 * Alternative to email-based access - use if you know your Cognito User ID
 */
const AUTHORIZED_ADMIN_USER_IDS: string[] = [
  // Add your Cognito User ID here if using ID-based access
  // Example: 'us-east-1:12345678-1234-1234-1234-123456789012',
];

/**
 * Check if the current user has admin access
 * @returns true if user is authorized, false otherwise
 */
export function useAdminAccess(): boolean {
  const { user } = useAuthenticator();
  
  if (!user) {
    console.log('[AdminAccess] No user found');
    return false;
  }

  // Try multiple ways to get the email
  const userEmail = 
    user.signInDetails?.loginId || 
    user.username || 
    '';
  
  const userId = user.userId || '';

  // Log for debugging (remove in production if needed)
  console.log('[AdminAccess] Checking access for:', {
    email: userEmail,
    userId: userId,
    authorizedEmails: AUTHORIZED_ADMIN_EMAILS,
    authorizedUserIds: AUTHORIZED_ADMIN_USER_IDS
  });

  // STRICT: If no authorized emails/IDs are configured, deny access
  if (AUTHORIZED_ADMIN_EMAILS.length === 0 && AUTHORIZED_ADMIN_USER_IDS.length === 0) {
    console.log('[AdminAccess] No authorized admins configured - denying access');
    return false;
  }

  // Check email-based access (case-insensitive, trimmed)
  if (AUTHORIZED_ADMIN_EMAILS.length > 0) {
    const normalizedUserEmail = userEmail.toLowerCase().trim();
    const emailMatch = AUTHORIZED_ADMIN_EMAILS.some(
      email => email.toLowerCase().trim() === normalizedUserEmail
    );
    if (emailMatch) {
      console.log('[AdminAccess] Email match found - granting access');
      return true;
    }
    console.log('[AdminAccess] Email does not match:', normalizedUserEmail, 'vs', AUTHORIZED_ADMIN_EMAILS);
  }

  // Check user ID-based access
  if (AUTHORIZED_ADMIN_USER_IDS.length > 0 && userId) {
    const idMatch = AUTHORIZED_ADMIN_USER_IDS.some(
      id => id === userId
    );
    if (idMatch) {
      console.log('[AdminAccess] User ID match found - granting access');
      return true;
    }
    console.log('[AdminAccess] User ID does not match');
  }

  console.log('[AdminAccess] Access denied - no match found');
  return false;
}

/**
 * Get the current user's email for configuration purposes
 * Use this in the browser console to find your email/ID
 */
export function getCurrentUserInfo() {
  // This is for debugging - call from browser console
  return {
    email: 'Check browser console',
    userId: 'Check browser console',
  };
}
