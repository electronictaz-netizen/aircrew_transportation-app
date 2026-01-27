import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { format } from 'date-fns';
import { useCompany } from '../contexts/CompanyContext';
import { getCurrentUser } from 'aws-amplify/auth';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Input } from './ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Checkbox } from './ui/checkbox';
import LoadingButton from './LoadingButton';
import { showSuccess } from '../utils/toast';
import { useNotification } from './Notification';
import NotificationComponent from './Notification';
import './TripNotes.css';

const client = generateClient<Schema>();

interface TripNotesProps {
  tripId: string;
  onClose?: () => void;
  readOnly?: boolean;
}

function TripNotes({ tripId, onClose, readOnly = false }: TripNotesProps) {
  const { companyId, company } = useCompany();
  const { notification, showError, hideNotification } = useNotification();
  const [notes, setNotes] = useState<Array<Schema['TripNote']['type']>>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [noteType, setNoteType] = useState<'manager' | 'driver' | 'internal'>('manager');
  const [isInternal, setIsInternal] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ userId: string; email?: string; name?: string } | null>(null);
  const [userRole, setUserRole] = useState<string>('');

  useEffect(() => {
    loadCurrentUser();
    loadNotes();
  }, [tripId, companyId]);

  const loadCurrentUser = async () => {
    try {
      const user = await getCurrentUser();
      const userEmail = user.signInDetails?.loginId || user.username || '';
      
      // Get user role from CompanyUser
      if (companyId) {
        const { data: companyUsers } = await client.models.CompanyUser.list({
          filter: { companyId: { eq: companyId }, userId: { eq: user.userId } },
        });
        const companyUser = companyUsers?.[0];
        setUserRole(companyUser?.role || '');
        
        setCurrentUser({
          userId: user.userId,
          email: userEmail,
          name: companyUser?.email || userEmail,
        });
      } else {
        setCurrentUser({
          userId: user.userId,
          email: userEmail,
          name: userEmail,
        });
      }
    } catch (error) {
      console.error('Error loading current user:', error);
    }
  };

  const loadNotes = async () => {
    if (!tripId || !companyId) return;
    
    try {
      setLoading(true);
      const { data: notesData, errors } = await client.models.TripNote.list({
        filter: { 
          companyId: { eq: companyId },
          tripId: { eq: tripId },
        },
      });

      if (errors) {
        console.error('Error loading notes:', errors);
        showError('Failed to load notes');
        return;
      }

      // Sort by creation date (newest first)
      const sortedNotes = (notesData || []).sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });

      setNotes(sortedNotes);
    } catch (error) {
      console.error('Error loading notes:', error);
      showError('Failed to load notes');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !companyId || !tripId || !currentUser) {
      showError('Please enter a note');
      return;
    }

    setSaving(true);

    try {
      // Extract mentions from note content (simple @username pattern)
      const mentionPattern = /@(\w+)/g;
      const mentions: string[] = [];
      let match;
      while ((match = mentionPattern.exec(newNote)) !== null) {
        mentions.push(match[1]);
      }

      const noteData: any = {
        companyId,
        tripId,
        noteType,
        content: newNote.trim(),
        authorId: currentUser.userId,
        authorName: currentUser.name || currentUser.email || 'Unknown',
        authorEmail: currentUser.email,
        authorRole: userRole || 'manager',
        isInternal: isInternal || noteType === 'internal',
        mentions: mentions.length > 0 ? JSON.stringify(mentions) : undefined,
        createdAt: new Date().toISOString(),
      };

      await client.models.TripNote.create(noteData);

      showSuccess('Note added successfully!');
      setNewNote('');
      setIsInternal(false);
      setNoteType('manager');
      loadNotes();
    } catch (error) {
      console.error('Error adding note:', error);
      showError('Failed to add note. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      await client.models.TripNote.delete({ id: noteId });
      showSuccess('Note deleted successfully!');
      loadNotes();
    } catch (error) {
      console.error('Error deleting note:', error);
      showError('Failed to delete note. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="trip-notes">
        <div className="loading-state">Loading notes...</div>
      </div>
    );
  }

  return (
    <div className="trip-notes">
      <NotificationComponent notification={notification} onClose={hideNotification} />
      
      <div className="trip-notes-header">
        <h3>Trip Notes & Comments</h3>
        {onClose && (
          <Button onClick={onClose} variant="outline" size="sm">
            Close
          </Button>
        )}
      </div>

      {!readOnly && (
        <div className="trip-notes-form">
          <div className="note-type-selector">
            <Select value={noteType} onValueChange={(value) => setNoteType(value as 'manager' | 'driver' | 'internal')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manager">Manager Note</SelectItem>
                <SelectItem value="driver">Driver Note</SelectItem>
                <SelectItem value="internal">Internal Comment</SelectItem>
              </SelectContent>
            </Select>
            
            {(noteType === 'manager' || noteType === 'internal') && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isInternal"
                  checked={isInternal || noteType === 'internal'}
                  onCheckedChange={(checked) => {
                    setIsInternal(checked === true);
                    if (checked) {
                      setNoteType('internal');
                    }
                  }}
                />
                <label htmlFor="isInternal" className="text-sm cursor-pointer">
                  Internal only (manager-to-manager)
                </label>
              </div>
            )}
          </div>

          <Textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder={
              noteType === 'driver' 
                ? 'Add a note about this trip...'
                : noteType === 'internal'
                ? 'Add an internal comment (visible to managers only)...'
                : 'Add a note or comment. Use @username to mention someone...'
            }
            rows={4}
            maxLength={2000}
          />
          
          <div className="note-actions">
            <div className="note-hint">
              {noteType === 'manager' && 'Tip: Use @username to mention team members'}
            </div>
            <LoadingButton
              onClick={handleAddNote}
              isLoading={saving}
              disabled={saving || !newNote.trim()}
            >
              Add Note
            </LoadingButton>
          </div>
        </div>
      )}

      <div className="trip-notes-list">
        {notes.length === 0 ? (
          <div className="empty-notes">
            <p>No notes yet. {!readOnly && 'Add the first note above.'}</p>
          </div>
        ) : (
          notes.map((note) => (
            <div key={note.id} className={`note-item ${note.isInternal ? 'internal' : ''}`}>
              <div className="note-header">
                <div className="note-author">
                  <span className="note-author-name">{note.authorName}</span>
                  <span className="note-author-role">{note.authorRole}</span>
                  {note.isInternal && (
                    <span className="internal-badge">Internal</span>
                  )}
                </div>
                <div className="note-meta">
                  <span className="note-date">
                    {note.createdAt ? format(new Date(note.createdAt), 'MMM dd, yyyy HH:mm') : 'Unknown date'}
                  </span>
                  {note.updatedAt && note.updatedAt !== note.createdAt && (
                    <span className="note-updated">
                      (edited {format(new Date(note.updatedAt), 'MMM dd, HH:mm')})
                    </span>
                  )}
                  {!readOnly && currentUser?.userId === note.authorId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteNote(note.id)}
                      className="delete-note-btn"
                    >
                      Delete
                    </Button>
                  )}
                </div>
              </div>
              <div className="note-content">
                {note.content.split(/(@\w+)/g).map((part, index) => {
                  if (part.startsWith('@')) {
                    return (
                      <span key={index} className="mention">
                        {part}
                      </span>
                    );
                  }
                  return <span key={index}>{part}</span>;
                })}
              </div>
              {note.noteType && (
                <div className="note-type-badge">
                  {note.noteType === 'driver' ? '🚗 Driver' : note.noteType === 'internal' ? '🔒 Internal' : '👤 Manager'}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default TripNotes;
