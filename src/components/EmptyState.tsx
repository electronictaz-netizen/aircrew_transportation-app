/**
 * Empty State Component
 * Displays helpful messages and actions when there's no data
 */

import { Button } from './ui/button';
import { Inbox, Calendar, Users, FileText, Search } from 'lucide-react';
import './EmptyState.css';

interface EmptyStateProps {
  icon?: 'inbox' | 'calendar' | 'users' | 'file' | 'search';
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}

const iconMap = {
  inbox: Inbox,
  calendar: Calendar,
  users: Users,
  file: FileText,
  search: Search,
};

export function EmptyState({
  icon = 'inbox',
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
}: EmptyStateProps) {
  const IconComponent = iconMap[icon];

  return (
    <div className="empty-state" role="status" aria-live="polite">
      <div className="empty-state-content">
        <div className="empty-state-icon">
          <IconComponent className="empty-state-icon-svg" />
        </div>
        <h3 className="empty-state-title">{title}</h3>
        <p className="empty-state-description">{description}</p>
        {(actionLabel || secondaryActionLabel) && (
          <div className="empty-state-actions">
            {actionLabel && onAction && (
              <Button onClick={onAction} variant="default">
                {actionLabel}
              </Button>
            )}
            {secondaryActionLabel && onSecondaryAction && (
              <Button onClick={onSecondaryAction} variant="outline">
                {secondaryActionLabel}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default EmptyState;
