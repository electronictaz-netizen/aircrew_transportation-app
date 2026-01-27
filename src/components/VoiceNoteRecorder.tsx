/**
 * Voice Note Recorder Component
 * Provides UI for recording voice notes
 */

import { useState, useEffect, useRef } from 'react';
import {
  startVoiceRecording,
  stopVoiceRecording,
  cancelVoiceRecording,
  isVoiceRecordingAvailable,
  isRecording,
  getRecordingDuration,
} from '../utils/voiceRecording';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import './VoiceNoteRecorder.css';

interface VoiceNoteRecorderProps {
  onRecord: (file: File, dataUrl: string, duration: number) => void;
  onCancel?: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  maxDuration?: number; // Maximum duration in seconds
}

export default function VoiceNoteRecorder({
  onRecord,
  onCancel,
  open,
  onOpenChange,
  title = 'Record Voice Note',
  description = 'Record a voice note',
  maxDuration = 60,
}: VoiceNoteRecorderProps) {
  const [isRecordingState, setIsRecordingState] = useState(false);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!open) {
      stopRecording();
    }
    return () => {
      stopRecording();
    };
  }, [open]);

  const startRecording = async () => {
    try {
      setError(null);
      await startVoiceRecording({ maxDuration });
      setIsRecordingState(true);

      // Update duration every second
      durationIntervalRef.current = setInterval(() => {
        const currentDuration = getRecordingDuration();
        setDuration(currentDuration);

        // Auto-stop at max duration
        if (currentDuration >= maxDuration) {
          stopRecording();
        }
      }, 100);
    } catch (err) {
      console.error('Error starting recording:', err);
      setError(err instanceof Error ? err.message : 'Failed to start recording');
      setIsRecordingState(false);
    }
  };

  const stopRecording = async () => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }

    if (isRecording()) {
      try {
        const result = await stopVoiceRecording();
        setIsRecordingState(false);
        setDuration(0);

        // Call onRecord callback
        onRecord(result.file, result.dataUrl, result.duration);
        onOpenChange(false);
      } catch (err) {
        console.error('Error stopping recording:', err);
        setError(err instanceof Error ? err.message : 'Failed to stop recording');
        setIsRecordingState(false);
        setDuration(0);
      }
    }
  };

  const handleCancel = () => {
    cancelVoiceRecording();
    setIsRecordingState(false);
    setDuration(0);
    setError(null);
    if (onCancel) {
      onCancel();
    }
    onOpenChange(false);
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isVoiceRecordingAvailable()) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Voice Recording Not Available</DialogTitle>
            <DialogDescription>
              Voice recording is not available on this device or browser.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={handleCancel}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="voice-note-recorder-dialog">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="voice-note-recorder-container">
          {error && (
            <div className="voice-note-error">
              <p>{error}</p>
            </div>
          )}

          <div className="voice-note-display">
            {isRecordingState ? (
              <>
                <div className="voice-note-indicator">
                  <div className="recording-dot"></div>
                  <span>Recording...</span>
                </div>
                <div className="voice-note-duration">
                  {formatDuration(duration)} / {formatDuration(maxDuration)}
                </div>
              </>
            ) : (
              <div className="voice-note-ready">
                <span>Ready to record</span>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          {isRecordingState ? (
            <Button onClick={stopRecording} variant="destructive">
              Stop Recording
            </Button>
          ) : (
            <Button onClick={startRecording}>
              Start Recording
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
