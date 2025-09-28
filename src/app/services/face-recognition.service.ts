import { ElementRef, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { MessageService } from 'primeng/api';
import { environment } from '../../environments/environment';
import { FaceDetection, FaceDetectionResult, FaceRecognitionResponse, User } from './types';

@Injectable({
  providedIn: 'root'
})
export class FaceRecognitionService {
  private readonly http = inject(HttpClient);
  private readonly messageService = inject(MessageService);
  private readonly API_URL = environment.apiUrl;

  isAuthenticated = signal(false);
  isAuthenticating = signal(false);
  authenticatedUser = signal<User | null>(null);
  faceDetection = signal<FaceDetection | null>(null);

  /**
   * Process face recognition for authentication
   */
  async processFaceRecognition(imageBlob: Blob): Promise<void> {
    try {
      this.isAuthenticating.set(true);

      const formData = new FormData();
      formData.append('image', imageBlob, 'frame.jpg');

      const response = await firstValueFrom(this.http.post<FaceRecognitionResponse>(
        `${ this.API_URL }/faces/recognize`,
        formData
      ));

      console.log("Face Recognition Response: ", response);

      if(response?.length && response[0].identity) {
        this.handleSuccessfulAuthentication(response[0]);
      } else {
        this.handleFailedAuthentication();
      }

    } catch(error) {
      console.error('Face recognition API error:', error);
      this.handleFailedAuthentication();
    } finally {
      this.isAuthenticating.set(false);
    }
  }

  /**
   * Handle successful face authentication
   */
  private handleSuccessfulAuthentication(response: FaceDetectionResult): void {
    this.isAuthenticated.set(true);

    const user = response.user;

    this.authenticatedUser.set(user);
    this.messageService.add({
      severity: 'success',
      summary: 'Authentication Successful',
      detail: `Welcome, ${ response.identity }!`,
      life: 4000
    });
    localStorage.setItem("token", response.token);

    setTimeout(() => {
      this.faceDetection.set(null);
      this.messageService.add({
        severity: 'info',
        summary: 'Medicine Detection Mode',
        detail: 'Please hold medicine package in front of camera',
        life: 3000
      });
    }, 3000);
  }

  /**
   * Handle failed authentication
   */
  private handleFailedAuthentication(): void {
    this.faceDetection.set(null);
    this.isAuthenticated.set(false);
    this.authenticatedUser.set(null);
  }

  /**
   * Calculate and set face detection bounding box
   */
  setFaceDetection(
    response: FaceDetectionResult,
    videoElement: ElementRef<HTMLVideoElement>,
    videoWidth: number,
    videoHeight: number
  ): void {
    if(response.face && videoElement && videoElement.nativeElement) {
      const video = videoElement.nativeElement;

      // Ensure the video element is properly loaded and has dimensions
      if(!video.getBoundingClientRect) {
        console.warn('Video element does not support getBoundingClientRect');
        return;
      }

      const videoRect = video.getBoundingClientRect();

      // Ensure we have valid dimensions
      if(videoRect.width === 0 || videoRect.height === 0) {
        console.warn('Video element has zero dimensions');
        return;
      }

      const scaleX = videoRect.width / videoWidth;
      const scaleY = videoRect.height / videoHeight;

      this.faceDetection.set({
        x: response.face.box[0] * scaleX,
        y: response.face.box[1] * scaleY,
        width: response.face.box[2] * scaleX,
        height: response.face.box[3] * scaleY,
        identity: response.identity,
        confidence: response.confidence
      });
    }
  }

  /**
   * Reset authentication state
   */
  resetAuthentication(): void {
    this.isAuthenticated.set(false);
    this.authenticatedUser.set(null);
    this.faceDetection.set(null);

    this.messageService.add({
      severity: 'info',
      summary: 'Session Reset',
      detail: 'Please authenticate again for medicine access',
      life: 3000
    });
  }

  /**
   * Get authentication status icon class
   */
  getAuthIcon(): string {
    if(this.isAuthenticated()) {
      return 'fas fa-check-circle';
    } else if(this.isAuthenticating()) {
      return 'fas fa-spinner fa-spin';
    } else {
      return 'fas fa-user-circle';
    }
  }

  /**
   * Get authentication status text
   */
  getAuthStatusText(): string {
    if(this.isAuthenticated()) {
      return 'Authenticated';
    } else if(this.isAuthenticating()) {
      return 'Authenticating...';
    } else {
      return 'Not Authenticated';
    }
  }

  /**
   * Check if currently processing
   */
  isProcessing(): boolean {
    return this.isAuthenticating();
  }

  /**
   * Process frame for face recognition
   */
  async processFrame(frame: ImageData): Promise<User | null> {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = frame.width;
      canvas.height = frame.height;
      const ctx = canvas.getContext('2d');
      if(!ctx) return null;

      ctx.putImageData(frame, 0, 0);

      return new Promise((resolve) => {
        canvas.toBlob(async(blob) => {
          if(blob) {
            await this.processFaceRecognition(blob);
            resolve(this.authenticatedUser());
          } else {
            resolve(null);
          }
        }, 'image/jpeg', 0.8);
      });
    } catch(error) {
      console.error('Error processing frame for face recognition:', error);
      return null;
    }
  }

  /**
   * Get authentication state observable
   */
  get authenticationState$() {
    // For now, return a simple observable
    // In a real implementation, this would be a proper observable
    return {
      subscribe: (callback: (user: User | null) => void) => {
        // Simple implementation - in production would use proper observable
        const interval = setInterval(() => {
          callback(this.authenticatedUser());
        }, 1000);

        return {
          unsubscribe: () => clearInterval(interval)
        };
      }
    };
  }
}
