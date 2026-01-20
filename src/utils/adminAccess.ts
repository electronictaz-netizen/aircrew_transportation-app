/**
 * Admin Access Control
 * 
 * Configure which users can access the Admin Dashboard
 */

import { useAuthenticator } from '@aws-amplify/ui-react';
import { logger } from './logger';

/**
 * List of authorized admin emails
 * Add your email address here to grant admin access
 */
const AUTHORIZED_ADMIN_EMAILS: string[] = [
  'support@tazsoftware.biz',
  'electronictaz@gmail.com'
  
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
    logger.debug('[AdminAccess] No user found');
    return false;
  }

  // Try multiple ways to get the email
  const userEmail = 
    user.signInDetails?.loginId || 
    user.username || 
    '';
  
  const userId = user.userId || '';

  // Log for debugging (dev only)
  logger.debug('[AdminAccess] Checking access for:', {
    email: userEmail,
    userId: userId,
    authorizedEmails: AUTHORIZED_ADMIN_EMAILS,
    authorizedUserIds: AUTHORIZED_ADMIN_USER_IDS
  });

  // STRICT: If no authorized emails/IDs are configured, deny access
  if (AUTHORIZED_ADMIN_EMAILS.length === 0 && AUTHORIZED_ADMIN_USER_IDS.length === 0) {
    logger.warn('[AdminAccess] No authorized admins configured - denying access');
    return false;
  }

  // Check email-based access (case-insensitive, trimmed)
  if (AUTHORIZED_ADMIN_EMAILS.length > 0) {
    const normalizedUserEmail = userEmail.toLowerCase().trim();
    const emailMatch = AUTHORIZED_ADMIN_EMAILS.some(
      email => email.toLowerCase().trim() === normalizedUserEmail
    );
    if (emailMatch) {
      logger.debug('[AdminAccess] Email match found - granting access');
      return true;
    }
    logger.debug('[AdminAccess] Email does not match:', normalizedUserEmail, 'vs', AUTHORIZED_ADMIN_EMAILS);
  }

  // Check user ID-based access
  if (AUTHORIZED_ADMIN_USER_IDS.length > 0 && userId) {
    const idMatch = AUTHORIZED_ADMIN_USER_IDS.some(
      id => id === userId
    );
    if (idMatch) {
      logger.debug('[AdminAccess] User ID match found - granting access');
      return true;
    }
    logger.debug('[AdminAccess] User ID does not match');
  }

  logger.debug('[AdminAccess] Access denied - no match found');
  return false;
}

/**
 * Check if a specific user email or ID is a system admin
 * Useful for filtering system admins from company user lists
 */
export function isSystemAdmin(email?: string | null, userId?: string | null): boolean {
  if (!email && !userId) return false;

  // Check email-based access
  if (email && AUTHORIZED_ADMIN_EMAILS.length > 0) {
    const normalizedEmail = email.toLowerCase().trim();
    if (AUTHORIZED_ADMIN_EMAILS.some(
      adminEmail => adminEmail.toLowerCase().trim() === normalizedEmail
    )) {
      return true;
    }
  }

  // Check user ID-based access
  if (userId && AUTHORIZED_ADMIN_USER_IDS.length > 0) {
    if (AUTHORIZED_ADMIN_USER_IDS.some(id => id === userId)) {
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
