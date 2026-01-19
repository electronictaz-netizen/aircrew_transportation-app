/**
 * Help Dialog Component
 * Displays customer-facing documentation in a user-friendly format
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { BookOpen, FileText, Users, CreditCard } from 'lucide-react';
import './HelpDialog.css';

interface HelpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface DocSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: string;
}

// Simple markdown parser for basic formatting
function parseMarkdown(text: string): React.ReactNode {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let currentList: string[] = [];
  let inCodeBlock = false;
  let codeBlockContent: string[] = [];

  lines.forEach((line, index) => {
    // Code blocks
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        // End code block
        elements.push(
          <pre key={`code-${index}`} className="help-code-block">
            <code>{codeBlockContent.join('\n')}</code>
          </pre>
        );
        codeBlockContent = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      return;
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      return;
    }

    // Headers
    if (line.startsWith('# ')) {
      if (currentList.length > 0) {
        elements.push(renderList(currentList, `list-${index}`));
        currentList = [];
      }
      elements.push(<h1 key={`h1-${index}`} className="help-h1">{line.substring(2)}</h1>);
      return;
    }
    if (line.startsWith('## ')) {
      if (currentList.length > 0) {
        elements.push(renderList(currentList, `list-${index}`));
        currentList = [];
      }
      elements.push(<h2 key={`h2-${index}`} className="help-h2">{line.substring(3)}</h2>);
      return;
    }
    if (line.startsWith('### ')) {
      if (currentList.length > 0) {
        elements.push(renderList(currentList, `list-${index}`));
        currentList = [];
      }
      elements.push(<h3 key={`h3-${index}`} className="help-h3">{line.substring(4)}</h3>);
      return;
    }

    // Lists
    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      currentList.push(line.trim().substring(2));
      return;
    }

    // End list if we hit a non-list line
    if (currentList.length > 0 && line.trim() !== '') {
      elements.push(renderList(currentList, `list-${index}`));
      currentList = [];
    }

    // Regular paragraphs
    if (line.trim() !== '') {
      elements.push(
        <p key={`p-${index}`} className="help-paragraph">
          {parseInlineMarkdown(line)}
        </p>
      );
    } else if (line.trim() === '' && elements.length > 0) {
      // Empty line - add spacing
      elements.push(<br key={`br-${index}`} />);
    }
  });

  // Handle remaining list
  if (currentList.length > 0) {
    elements.push(renderList(currentList, 'list-final'));
  }

  return <>{elements}</>;
}

function renderList(items: string[], key: string): React.ReactNode {
  return (
    <ul key={key} className="help-list">
      {items.map((item, i) => (
        <li key={i} className="help-list-item">
          {parseInlineMarkdown(item)}
        </li>
      ))}
    </ul>
  );
}

function parseInlineMarkdown(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let currentIndex = 0;

  // Match bold (**text** or __text__)
  const boldRegex = /\*\*([^*]+)\*\*/g;
  // Match italic (*text* or _text_)
  const italicRegex = /\*([^*]+)\*/g;
  // Match links [text](url)
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  // Match inline code `code`
  const codeRegex = /`([^`]+)`/g;

  const matches: Array<{ start: number; end: number; type: string; content: any }> = [];

  let match;
  while ((match = boldRegex.exec(text)) !== null) {
    matches.push({ start: match.index, end: match.index + match[0].length, type: 'bold', content: match[1] });
  }
  while ((match = italicRegex.exec(text)) !== null) {
    matches.push({ start: match.index, end: match.index + match[0].length, type: 'italic', content: match[1] });
  }
  while ((match = linkRegex.exec(text)) !== null) {
    matches.push({ start: match.index, end: match.index + match[0].length, type: 'link', content: { text: match[1], url: match[2] } });
  }
  while ((match = codeRegex.exec(text)) !== null) {
    matches.push({ start: match.index, end: match.index + match[0].length, type: 'code', content: match[1] });
  }

  matches.sort((a, b) => a.start - b.start);

  matches.forEach((match, i) => {
    if (match.start > currentIndex) {
      parts.push(text.substring(currentIndex, match.start));
    }
    if (match.type === 'bold') {
      parts.push(<strong key={`bold-${i}`}>{match.content}</strong>);
    } else if (match.type === 'italic') {
      parts.push(<em key={`italic-${i}`}>{match.content}</em>);
    } else if (match.type === 'link') {
      parts.push(
        <a key={`link-${i}`} href={match.content.url} target="_blank" rel="noopener noreferrer" className="help-link">
          {match.content.text}
        </a>
      );
    } else if (match.type === 'code') {
      parts.push(<code key={`code-${i}`} className="help-inline-code">{match.content}</code>);
    }
    currentIndex = match.end;
  });

  if (currentIndex < text.length) {
    parts.push(text.substring(currentIndex));
  }

  return parts.length > 0 ? <>{parts}</> : text;
}

function HelpDialog({ open, onOpenChange }: HelpDialogProps) {
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [docContent, setDocContent] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const docs: DocSection[] = [
    {
      id: 'quick-start',
      title: 'Quick Start Guide',
      icon: <FileText className="w-5 h-5" />,
      content: '',
    },
    {
      id: 'subscription',
      title: 'Subscription & Trial Guide',
      icon: <CreditCard className="w-5 h-5" />,
      content: '',
    },
    {
      id: 'manager',
      title: 'Manager Guide',
      icon: <Users className="w-5 h-5" />,
      content: '',
    },
  ];

  useEffect(() => {
    if (selectedDoc && open) {
      loadDocumentation(selectedDoc);
    }
  }, [selectedDoc, open]);

  const loadDocumentation = async (docId: string) => {
    setLoading(true);
    try {
      let filePath = '';
      switch (docId) {
        case 'quick-start':
          filePath = '/docs/COMPANY_QUICK_START.md';
          break;
        case 'subscription':
          filePath = '/docs/SUBSCRIPTION_AND_TRIAL_GUIDE.md';
          break;
        case 'manager':
          filePath = '/docs/MANAGER_USER_GUIDE.md';
          break;
        default:
          return;
      }

      const response = await fetch(filePath);
      if (response.ok) {
        const text = await response.text();
        setDocContent(text);
      } else {
        setDocContent(`# Documentation Not Found\n\nUnable to load ${docId} documentation. Please contact support.`);
      }
    } catch (error) {
      console.error('Error loading documentation:', error);
      setDocContent(`# Error Loading Documentation\n\nThere was an error loading the documentation. Please try again later or contact support.`);
    } finally {
      setLoading(false);
    }
  };

  const handleDocSelect = (docId: string) => {
    setSelectedDoc(docId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="help-dialog-content">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Help & Documentation
          </DialogTitle>
          <DialogDescription>
            Browse our documentation to learn how to use the Onyx Transportation App
          </DialogDescription>
        </DialogHeader>

        <div className="help-dialog-body">
          {!selectedDoc ? (
            <div className="help-doc-list">
              <h3 className="help-section-title">Available Documentation</h3>
              <div className="help-doc-grid">
                {docs.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => handleDocSelect(doc.id)}
                    className="help-doc-card"
                  >
                    {doc.icon}
                    <span>{doc.title}</span>
                  </button>
                ))}
              </div>
              <div className="help-external-links">
                <p className="help-link-text">For more documentation, visit:</p>
                <a
                  href="https://tazsoftware.biz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="help-external-link"
                >
                  tazsoftware.biz
                </a>
              </div>
              <div className="help-support-section">
                <p className="help-link-text">Need help? Contact support:</p>
                <a
                  href="mailto:support@tazsoftware.biz?subject=Support Request - Onyx Transportation App"
                  className="help-support-link"
                >
                  support@tazsoftware.biz
                </a>
              </div>
            </div>
          ) : (
            <div className="help-doc-viewer">
              <div className="help-doc-header">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedDoc(null)}
                  className="help-back-button"
                >
                  ← Back to Documentation
                </Button>
              </div>
              <div className="help-doc-content">
                {loading ? (
                  <div className="help-loading">Loading documentation...</div>
                ) : (
                  <div className="help-markdown-content">
                    {parseMarkdown(docContent)}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default HelpDialog;
