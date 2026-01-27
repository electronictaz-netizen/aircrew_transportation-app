/**
 * Camera Capture Component
 * Provides UI for capturing photos (proof of delivery, etc.)
 */

import { useState, useRef, useEffect } from 'react';
import { capturePhoto, isCameraAvailable, CameraOptions } from '../utils/cameraCapture';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import './CameraCapture.css';

interface CameraCaptureProps {
  onCapture: (file: File, dataUrl: string) => void;
  onCancel?: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  facingMode?: 'user' | 'environment';
}

export default function CameraCapture({
  onCapture,
  onCancel,
  open,
  onOpenChange,
  title = 'Capture Photo',
  description = 'Take a photo using your device camera',
  facingMode = 'environment',
}: CameraCaptureProps) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (open && isCameraAvailable()) {
      startCamera();
    } else if (!open) {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [open]);

  const startCamera = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1920 },
        },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error('Error starting camera:', err);
      setError('Failed to access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setPreview(null);
  };

  const handleCapture = async () => {
    if (!videoRef.current) return;

    try {
      setIsCapturing(true);
      setError(null);

      const result = await capturePhoto({
        facingMode,
        quality: 0.8,
        maxWidth: 1920,
        maxHeight: 1920,
      });

      setPreview(result.dataUrl);
      stopCamera();
    } catch (err) {
      console.error('Error capturing photo:', err);
      setError(err instanceof Error ? err.message : 'Failed to capture photo');
    } finally {
      setIsCapturing(false);
    }
  };

  const handleRetake = () => {
    setPreview(null);
    startCamera();
  };

  const handleConfirm = () => {
    if (preview) {
      // Convert data URL to file
      fetch(preview)
        .then((res) => res.blob())
        .then((blob) => {
          const file = new File([blob], `photo-${Date.now()}.jpg`, {
            type: 'image/jpeg',
          });
          onCapture(file, preview);
          onOpenChange(false);
        });
    }
  };

  const handleCancel = () => {
    stopCamera();
    if (onCancel) {
      onCancel();
    }
    onOpenChange(false);
  };

  if (!isCameraAvailable()) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Camera Not Available</DialogTitle>
            <DialogDescription>
              Camera is not available on this device or browser.
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
      <DialogContent className="camera-capture-dialog">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="camera-capture-container">
          {error && (
            <div className="camera-error">
              <p>{error}</p>
            </div>
          )}

          {preview ? (
            <div className="camera-preview">
              <img src={preview} alt="Captured photo" />
            </div>
          ) : (
            <div className="camera-view">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="camera-video"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          {preview ? (
            <>
              <Button variant="outline" onClick={handleRetake}>
                Retake
              </Button>
              <Button onClick={handleConfirm}>Use Photo</Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleCapture} disabled={isCapturing}>
                {isCapturing ? 'Capturing...' : 'Capture'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
