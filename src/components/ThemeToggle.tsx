/**
 * Theme Toggle Button Component
 * Allows users to toggle between light, dark, and system themes
 */

import { useTheme } from '../contexts/ThemeContext';
import { Button } from './ui/button';
import { Moon, Sun, Monitor } from 'lucide-react';
import './ThemeToggle.css';

export function ThemeToggle() {
  const { theme, actualTheme, toggleTheme } = useTheme();

  const getIcon = () => {
    if (theme === 'system') {
      return <Monitor className="theme-icon" />;
    }
    return actualTheme === 'dark' ? <Moon className="theme-icon" /> : <Sun className="theme-icon" />;
  };

  const getLabel = () => {
    if (theme === 'system') {
      return 'System';
    }
    return actualTheme === 'dark' ? 'Dark' : 'Light';
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleTheme}
      className="theme-toggle"
      aria-label={`Current theme: ${getLabel()}. Click to toggle theme.`}
      title={`Current theme: ${getLabel()}. Click to toggle between light, dark, and system.`}
    >
      {getIcon()}
      <span className="theme-label">{getLabel()}</span>
    </Button>
  );
}
