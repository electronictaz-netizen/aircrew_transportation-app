/**
 * Toast utility functions to replace useNotification hook
 * Provides a simpler API compatible with shadcn/ui Toast
 */

import { toast as shadcnToast } from '@/hooks/use-toast';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

/**
 * Show a success toast
 */
export function showSuccess(message: string, duration?: number) {
  shadcnToast({
    title: 'Success',
    description: message,
    variant: 'default',
    duration: duration || 5000,
  });
}

/**
 * Show an error toast
 */
export function showError(message: string, duration?: number) {
  shadcnToast({
    title: 'Error',
    description: message,
    variant: 'destructive',
    duration: duration || 7000,
  });
}

/**
 * Show a warning toast
 */
export function showWarning(message: string, duration?: number) {
  shadcnToast({
    title: 'Warning',
    description: message,
    variant: 'default',
    duration: duration || 5000,
  });
}

/**
 * Show an info toast
 */
export function showInfo(message: string, duration?: number) {
  shadcnToast({
    title: 'Info',
    description: message,
    variant: 'default',
    duration: duration || 5000,
  });
}

/**
 * Show a toast with custom options
 */
export function showToast(
  message: string,
  type: ToastType = 'info',
  duration?: number
) {
  switch (type) {
    case 'success':
      showSuccess(message, duration);
      break;
    case 'error':
      showError(message, duration);
      break;
    case 'warning':
      showWarning(message, duration);
      break;
    case 'info':
    default:
      showInfo(message, duration);
      break;
  }
}
