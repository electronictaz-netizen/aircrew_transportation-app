/**
 * Voice Recording Utility
 * Provides voice note recording capability
 */

export interface VoiceRecordingOptions {
  maxDuration?: number; // Maximum duration in seconds (default: 60)
  mimeType?: string; // Audio MIME type (default: 'audio/webm')
}

export interface VoiceRecordingResult {
  blob: Blob;
  dataUrl: string;
  duration: number; // Duration in seconds
  file: File;
}

let mediaRecorder: MediaRecorder | null = null;
let audioChunks: Blob[] = [];
let recordingStartTime: number = 0;

/**
 * Check if voice recording is available
 */
export function isVoiceRecordingAvailable(): boolean {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

/**
 * Start voice recording
 */
export async function startVoiceRecording(options: VoiceRecordingOptions = {}): Promise<void> {
  if (!isVoiceRecordingAvailable()) {
    throw new Error('Voice recording is not available on this device');
  }

  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    throw new Error('Recording is already in progress');
  }

  const { mimeType = 'audio/webm' } = options;

  // Request microphone access
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
  });

  // Check if MIME type is supported
  let supportedMimeType = mimeType;
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    // Fallback to supported types
    if (MediaRecorder.isTypeSupported('audio/webm')) {
      supportedMimeType = 'audio/webm';
    } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
      supportedMimeType = 'audio/mp4';
    } else {
      supportedMimeType = ''; // Use browser default
    }
  }

  // Create MediaRecorder
  mediaRecorder = new MediaRecorder(stream, {
    mimeType: supportedMimeType || undefined,
  });

  audioChunks = [];
  recordingStartTime = Date.now();

  mediaRecorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      audioChunks.push(event.data);
    }
  };

  mediaRecorder.start();
  console.log('[VoiceRecording] Recording started');
}

/**
 * Stop voice recording
 */
export async function stopVoiceRecording(): Promise<VoiceRecordingResult> {
  return new Promise((resolve, reject) => {
    if (!mediaRecorder || mediaRecorder.state === 'inactive') {
      reject(new Error('No recording in progress'));
      return;
    }

    mediaRecorder.onstop = () => {
      if (!mediaRecorder) {
        reject(new Error('MediaRecorder is null'));
        return;
      }

      const duration = (Date.now() - recordingStartTime) / 1000; // Duration in seconds
      const blob = new Blob(audioChunks, { type: mediaRecorder.mimeType || 'audio/webm' });

      // Stop all tracks
      if (mediaRecorder.stream) {
        mediaRecorder.stream.getTracks().forEach((track) => track.stop());
      }

      // Create data URL
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;

        // Create file object
        const mimeType = mediaRecorder?.mimeType || 'audio/webm';
        const extension = mimeType.includes('mp4') ? 'm4a' : 'webm';
        const file = new File([blob], `voice-note-${Date.now()}.${extension}`, {
          type: blob.type,
          lastModified: Date.now(),
        });

        resolve({
          blob,
          dataUrl,
          duration,
          file,
        });

        // Cleanup
        mediaRecorder = null;
        audioChunks = [];
        recordingStartTime = 0;
      };
      reader.onerror = () => reject(new Error('Failed to read audio data'));
      reader.readAsDataURL(blob);
    };

    mediaRecorder.onerror = () => {
      reject(new Error('Recording error occurred'));
    };

    mediaRecorder.stop();
    console.log('[VoiceRecording] Recording stopped');
  });
}

/**
 * Cancel voice recording
 */
export function cancelVoiceRecording(): void {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
    if (mediaRecorder.stream) {
      mediaRecorder.stream.getTracks().forEach((track) => track.stop());
    }
    mediaRecorder = null;
    audioChunks = [];
    recordingStartTime = 0;
    console.log('[VoiceRecording] Recording cancelled');
  }
}

/**
 * Check if currently recording
 */
export function isRecording(): boolean {
  return mediaRecorder !== null && mediaRecorder.state === 'recording';
}

/**
 * Get recording duration (in seconds)
 */
export function getRecordingDuration(): number {
  if (!isRecording()) {
    return 0;
  }
  return (Date.now() - recordingStartTime) / 1000;
}
