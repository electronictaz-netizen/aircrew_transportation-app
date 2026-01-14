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
const AUTHORIZED_ADMIN_EMAILS = [
  'electronictaz@gmail.com',
  // Add additional emails if needed:
  // 'admin2@example.com',
];

/**
 * List of authorized admin user IDs (Cognito User IDs)
 * Alternative to email-based access - use if you know your Cognito User ID
 */
const AUTHORIZED_ADMIN_USER_IDS = [
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
    return false;
  }

  const userEmail = user.signInDetails?.loginId || user.username || '';
  const userId = user.userId || '';

  // Check email-based access
  if (AUTHORIZED_ADMIN_EMAILS.length > 0) {
    const emailMatch = AUTHORIZED_ADMIN_EMAILS.some(
      email => email.toLowerCase() === userEmail.toLowerCase()
    );
    if (emailMatch) {
      return true;
    }
  }

  // Check user ID-based access
  if (AUTHORIZED_ADMIN_USER_IDS.length > 0) {
    const idMatch = AUTHORIZED_ADMIN_USER_IDS.some(
      id => id === userId
    );
    if (idMatch) {
      return true;
    }
  }

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
