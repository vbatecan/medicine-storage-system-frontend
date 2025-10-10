import { Injectable, ElementRef, signal } from '@angular/core';
import { Subject, interval, takeUntil, map } from 'rxjs';
import { VideoConstraints } from './types';

@Injectable({
  providedIn: 'root'
})
export class CameraService {
  videoWidth = 640;
  videoHeight = 480;
  isCameraActive = signal(false);
  isProcessing = signal(false);

  private mediaStream: MediaStream | null = null;
  private frameProcessing$ = new Subject<void>();

  private readonly FRAME_PROCESSING_INTERVAL = 1000;

  /**
   * Initialize camera and start video stream
   */
  async initializeCamera(videoElement: ElementRef<HTMLVideoElement>): Promise<void> {
    try {
      const constraints: VideoConstraints = {
        video: {
          width: { ideal: this.videoWidth },
          height: { ideal: this.videoHeight },
          facingMode: 'user'
        },
        audio: false
      };

      this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);

      if (videoElement && videoElement.nativeElement) {
        videoElement.nativeElement.srcObject = this.mediaStream;
        videoElement.nativeElement.onloadedmetadata = () => {
          this.isCameraActive.set(true);
          this.updateVideoDimensions(videoElement);
        };
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      this.isCameraActive.set(false);
      throw new Error('Unable to access camera. Please check permissions.');
    }
  }

  /**
   * Update video dimensions for bounding box calculations
   */
  private updateVideoDimensions(videoElement: ElementRef<HTMLVideoElement>): void {
    if (videoElement && videoElement.nativeElement) {
      const video = videoElement.nativeElement;
      this.videoWidth = video.videoWidth || this.videoWidth;
      this.videoHeight = video.videoHeight || this.videoHeight;
    }
  }

  /**
   * Start frame processing with observable
   */
  startFrameProcessing(videoElement: ElementRef<HTMLVideoElement>) {
    return interval(this.FRAME_PROCESSING_INTERVAL)
      .pipe(takeUntil(this.frameProcessing$))
      .pipe(
        map(() => {
          if (this.isCameraActive() && !this.isProcessing()) {
            return this.captureFrameAsImageData(videoElement);
          }
          return null;
        })
      );
  }

  /**
   * Stop frame processing
   */
  stopFrameProcessing(): void {
    this.frameProcessing$.next();
    this.frameProcessing$.complete();
  }

  /**
   * Capture current frame as blob
   */
  async captureFrame(videoElement: ElementRef<HTMLVideoElement>): Promise<Blob | null> {
    if (!videoElement || this.isProcessing()) {
      return null;
    }

    this.isProcessing.set(true);

    try {
      const video = videoElement.nativeElement;
      const canvas = document.createElement('canvas');
      canvas.width = this.videoWidth;
      canvas.height = this.videoHeight;

      const context = canvas.getContext('2d');
      if (!context) {
        return null;
      }

      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      return new Promise<Blob | null>((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob);
        }, 'image/jpeg', 0.8);
      });
    } catch (error) {
      console.error('Error capturing frame:', error);
      return null;
    } finally {
      this.isProcessing.set(false);
    }
  }

  /**
   * Stop camera and clean up resources
   */
  stopCamera(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    this.isCameraActive.set(false);
    this.stopFrameProcessing();
  }

  /**
   * Get current video dimensions
   */
  getVideoDimensions() {
    return {
      width: this.videoWidth,
      height: this.videoHeight
    };
  }

  /**
   * Check if camera is active
   */
  isActive(): boolean {
    return this.isCameraActive();
  }

  /**
   * Capture frame as ImageData for processing
   */
  private captureFrameAsImageData(videoElement: ElementRef<HTMLVideoElement>): ImageData | null {
    try {
      const video = videoElement.nativeElement;
      const canvas = document.createElement('canvas');
      canvas.width = this.videoWidth;
      canvas.height = this.videoHeight;

      const context = canvas.getContext('2d');
      if (!context) {
        return null;
      }

      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      return context.getImageData(0, 0, canvas.width, canvas.height);
    } catch (error) {
      console.error('Error capturing frame as ImageData:', error);
      return null;
    }
  }
}
