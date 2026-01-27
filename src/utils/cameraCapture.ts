/**
 * Camera Capture Utility
 * Provides camera access for photo proof of delivery
 */

export interface CameraOptions {
  quality?: number; // 0-1, default 0.8
  maxWidth?: number;
  maxHeight?: number;
  facingMode?: 'user' | 'environment'; // front or back camera
}

export interface CameraResult {
  blob: Blob;
  dataUrl: string;
  file: File;
}

/**
 * Check if camera is available
 */
export function isCameraAvailable(): boolean {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

/**
 * Capture photo from camera
 */
export async function capturePhoto(options: CameraOptions = {}): Promise<CameraResult> {
  if (!isCameraAvailable()) {
    throw new Error('Camera is not available on this device');
  }

  const {
    quality = 0.8,
    maxWidth = 1920,
    maxHeight = 1920,
    facingMode = 'environment', // Back camera by default
  } = options;

  // Request camera access
  const stream = await navigator.mediaDevices.getUserMedia({
    video: {
      facingMode,
      width: { ideal: maxWidth },
      height: { ideal: maxHeight },
    },
  });

  // Create video element to capture frame
  const video = document.createElement('video');
  video.srcObject = stream;
  video.autoplay = true;
  video.playsInline = true;

  // Wait for video to be ready
  await new Promise<void>((resolve) => {
    video.onloadedmetadata = () => {
      video.play();
      resolve();
    };
  });

  // Create canvas to capture frame
  const canvas = document.createElement('canvas');
  canvas.width = Math.min(video.videoWidth, maxWidth);
  canvas.height = Math.min(video.videoHeight, maxHeight);

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // Draw video frame to canvas
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  // Stop camera stream
  stream.getTracks().forEach((track) => track.stop());

  // Convert canvas to blob
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob'));
        }
      },
      'image/jpeg',
      quality
    );
  });

  // Create data URL
  const dataUrl = canvas.toDataURL('image/jpeg', quality);

  // Create file object
  const file = new File([blob], `photo-${Date.now()}.jpg`, {
    type: 'image/jpeg',
    lastModified: Date.now(),
  });

  return {
    blob,
    dataUrl,
    file,
  };
}

/**
 * Select photo from file input
 */
export async function selectPhotoFromFile(input: HTMLInputElement): Promise<CameraResult> {
  return new Promise((resolve, reject) => {
    if (!input.files || input.files.length === 0) {
      reject(new Error('No file selected'));
      return;
    }

    const file = input.files[0];
    if (!file.type.startsWith('image/')) {
      reject(new Error('Selected file is not an image'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const blob = file.slice();

      resolve({
        blob,
        dataUrl,
        file,
      });
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Compress image if needed
 */
export async function compressImage(
  blob: Blob,
  maxWidth: number = 1920,
  maxHeight: number = 1920,
  quality: number = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Calculate new dimensions
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = width * ratio;
        height = height * ratio;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (compressedBlob) => {
          if (compressedBlob) {
            resolve(compressedBlob);
          } else {
            reject(new Error('Failed to compress image'));
          }
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(blob);
  });
}
