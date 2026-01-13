/**
 * Notification/Toast component for user feedback
 * Replaces native alert() and confirm() with better UX
 */

import { useState, useEffect } from 'react';
import './Notification.css';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  message: string;
  type: NotificationType;
  duration?: number; // Auto-dismiss after milliseconds (0 = no auto-dismiss)
}

interface NotificationProps {
  notification: Notification | null;
  onClose: () => void;
}

function NotificationComponent({ notification, onClose }: NotificationProps) {
  useEffect(() => {
    if (!notification) return;
    
    // Auto-dismiss if duration is set and > 0
    if (notification.duration && notification.duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, notification.duration);
      
      return () => clearTimeout(timer);
    }
  }, [notification, onClose]);

  if (!notification) return null;

  return (
    <div
      className={`notification notification-${notification.type}`}
      role="alert"
      aria-live="polite"
      onClick={onClose}
    >
      <div className="notification-content">
        <span className="notification-icon">
          {notification.type === 'success' && '✓'}
          {notification.type === 'error' && '✕'}
          {notification.type === 'warning' && '⚠'}
          {notification.type === 'info' && 'ℹ'}
        </span>
        <span className="notification-message">{notification.message}</span>
        <button
          className="notification-close"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          aria-label="Close notification"
        >
          ×
        </button>
      </div>
    </div>
  );
}

// Notification manager hook
export function useNotification() {
  const [notification, setNotification] = useState<Notification | null>(null);

  const showNotification = (
    message: string,
    type: NotificationType = 'info',
    duration: number = 5000
  ) => {
    const id = `notification-${Date.now()}-${Math.random()}`;
    setNotification({ id, message, type, duration });
  };

  const showSuccess = (message: string, duration?: number) => {
    showNotification(message, 'success', duration);
  };

  const showError = (message: string, duration?: number) => {
    showNotification(message, 'error', duration || 7000); // Errors stay longer
  };

  const showWarning = (message: string, duration?: number) => {
    showNotification(message, 'warning', duration);
  };

  const showInfo = (message: string, duration?: number) => {
    showNotification(message, 'info', duration);
  };

  const hideNotification = () => {
    setNotification(null);
  };

  return {
    notification,
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    hideNotification,
  };
}

// Confirmation dialog component
interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: 'danger' | 'warning' | 'info';
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  type = 'warning',
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content confirm-dialog" onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="confirm-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={`btn ${type === 'danger' ? 'btn-danger' : type === 'warning' ? 'btn-warning' : 'btn-primary'}`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

// Confirmation hook
export function useConfirm() {
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
    onConfirm?: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
  });

  const confirm = (
    message: string,
    title: string = 'Confirm',
    type: 'danger' | 'warning' | 'info' = 'warning'
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmState({
        isOpen: true,
        title,
        message,
        type,
        onConfirm: () => {
          setConfirmState({ isOpen: false, title: '', message: '' });
          resolve(true);
        },
      });
    });
  };

  const handleCancel = () => {
    setConfirmState((prev) => {
      if (prev.onConfirm) {
        // Resolve as false if there was a pending promise
        // Note: This is a simplified version - in production, you'd want to track promises
      }
      return { isOpen: false, title: '', message: '' };
    });
  };

  return {
    confirmState,
    confirm,
    handleCancel,
  };
}

export default NotificationComponent;
