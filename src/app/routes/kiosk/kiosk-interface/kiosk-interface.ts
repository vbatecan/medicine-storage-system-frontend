import { Component, ElementRef, OnDestroy, OnInit, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, interval, Subject, takeUntil } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';

interface FaceDetection {
  x: number;
  y: number;
  width: number;
  height: number;
  identity?: string;
  confidence?: number;
}

interface AuthenticatedUser {
  name: string;
  id: string;
  permissions: string[];
}

interface MedicineDetectionResponse {
  results: {
    detection: {
      label: string;
      confidence: number;
      bbox: {
        x: number;
        y: number;
        width: number;
        height: number;
      };
    };
    classify: {
      product: string;
      confidence: number;
    };
  }[];
}

interface MedicineDetection {
  name: string;
  details: string;
  confidence: number;
  classifyConfidence: number;
  id: string;
  bbox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface FaceDetectionResult {
  face: {
    box: [number, number, number, number]; // [x, y, width, height]
    left_eye: [number, number] | null;
    right_eye: [number, number] | null;
    confidence: number;
  };
  identity: string;
  confidence: number;
}

type FaceRecognitionResponse = FaceDetectionResult[];

@Component({
  selector: 'app-kiosk-interface',
  imports: [CommonModule, Toast],
  templateUrl: './kiosk-interface.html',
  styleUrl: './kiosk-interface.css',
  providers: [
    MessageService
  ]
})
export class KioskInterface implements OnInit, OnDestroy {
  @ViewChild('videoElement', { static: false }) videoElement!: ElementRef<HTMLVideoElement>;

  // * API URL
  private readonly API_URL = environment.apiUrl;

  // Camera and video properties
  videoWidth = 640;
  videoHeight = 480;
  isCameraActive = false;
  private mediaStream: MediaStream | null = null;

  // Authentication state
  isAuthenticated = signal(false);
  isAuthenticating = signal(false);
  authenticatedUser: AuthenticatedUser | null = null;
  faceDetection: FaceDetection | null = null;

  // Processing state
  isProcessing = false;
  currentMode: 'face' | 'medicine' = 'face';

  // Medicine detection
  medicineDetections = signal<MedicineDetection[]>([]);

  // System status
  isSystemOnline = true;
  lastUpdateTime = new Date();

  // Configuration
  private readonly FRAME_PROCESSING_INTERVAL = 1000; // Process frame every 1 second

  // RxJS subjects for cleanup
  private destroy$ = new Subject<void>();
  private frameProcessing$ = new Subject<void>();

  constructor(
    private http: HttpClient,
    private messageService: MessageService
  ) {
  }

  async ngOnInit() {
    await this.initializeCamera();
    this.startFrameProcessing();
    this.updateSystemStatus();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.frameProcessing$.next();
    this.frameProcessing$.complete();
    this.stopCamera();
  }

  /**
   * Initialize camera and start video stream
   */
  private async initializeCamera(): Promise<void> {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: this.videoWidth },
          height: { ideal: this.videoHeight },
          facingMode: 'user'
        },
        audio: false
      });

      if(this.videoElement && this.videoElement.nativeElement) {
        this.videoElement.nativeElement.srcObject = this.mediaStream;
        this.videoElement.nativeElement.onloadedmetadata = () => {
          this.isCameraActive = true;
          this.updateVideoDimensions();
        };
      }
    } catch(error) {
      console.error('Error accessing camera:', error);
      this.isCameraActive = false;
      this.messageService.add({
        severity: 'error',
        summary: 'Camera Error',
        detail: 'Unable to access camera. Please check permissions.',
        life: 5000
      });
    }
  }

  /**
   * Update video dimensions for bounding box calculations
   */
  private updateVideoDimensions(): void {
    if(this.videoElement && this.videoElement.nativeElement) {
      const video = this.videoElement.nativeElement;
      this.videoWidth = video.videoWidth || this.videoWidth;
      this.videoHeight = video.videoHeight || this.videoHeight;
    }
  }

  /**
   * Start frame processing for face recognition
   */
  private startFrameProcessing(): void {
    interval(this.FRAME_PROCESSING_INTERVAL)
      .pipe(takeUntil(this.frameProcessing$))
      .subscribe(() => {
        if(this.isCameraActive && !this.isProcessing) {
          this.processCurrentFrame();
        }
      });
  }

  /**
   * Process current video frame for face recognition
   */
  private async processCurrentFrame(): Promise<void> {
    if(!this.videoElement || this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    try {
      const video = this.videoElement.nativeElement;

      // Create a temporary canvas to capture the frame
      const canvas = document.createElement('canvas');
      canvas.width = this.videoWidth;
      canvas.height = this.videoHeight;

      const context = canvas.getContext('2d');
      if(!context) {
        this.isProcessing = false;
        return;
      }

      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(async(blob) => {
        if(blob) {
          if(!this.isAuthenticated()) {
            await this.processFaceRecognition(blob);
          } else if(this.currentMode === 'medicine') {
            await this.processMedicineDetection(blob);
          }
        }
        this.isProcessing = false;
      }, 'image/jpeg', 0.8);

    } catch(error) {
      console.error('Error processing frame:', error);
      this.isProcessing = false;
    }
  }

  private async processFaceRecognition(imageBlob: Blob): Promise<void> {
    try {
      this.isAuthenticating.update(() => true);

      const formData = new FormData();
      formData.append('image', imageBlob, 'frame.jpg');

      const response = await firstValueFrom(this.http.post<FaceRecognitionResponse>(
        `${ this.API_URL }/faces/recognize`,
        formData
      ));

      console.log("Response: ", response);

      if(response?.length && response[0].identity) {
        this.handleSuccessfulAuthentication(response[0]);
      } else {
        this.handleFailedAuthentication();
      }

    } catch(error) {
      console.error('Face recognition API error:', error);
      this.handleFailedAuthentication();
    } finally {
      this.isAuthenticating.update(() => false);
    }
  }

  /**
   * Handle successful face authentication
   */
  private handleSuccessfulAuthentication(response: FaceDetectionResult): void {
    this.isAuthenticated.update(() => true);
    this.authenticatedUser = {
      name: response.identity!,
      id: `user_${ Date.now() }`,
      permissions: ['medicine_access']
    };

    if(response.face && this.videoElement) {
      const video = this.videoElement.nativeElement;
      const videoRect = video.getBoundingClientRect();

      const scaleX = videoRect.width / this.videoWidth;
      const scaleY = videoRect.height / this.videoHeight;

      this.faceDetection = {
        x: response.face.box[0] * scaleX,
        y: response.face.box[1] * scaleY,
        width: response.face.box[2] * scaleX,
        height: response.face.box[3] * scaleY,
        identity: response.identity,
        confidence: response.confidence
      };
    }

    this.messageService.add({
      severity: 'success',
      summary: 'Authentication Successful',
      detail: `Welcome, ${ response.identity }!`,
      life: 4000
    });

    setTimeout(() => {
      this.currentMode = 'medicine';
      this.faceDetection = null;
      this.messageService.add({
        severity: 'info',
        summary: 'Medicine Detection Mode',
        detail: 'Please hold medicine package in front of camera',
        life: 3000
      });
    }, 3000);

    this.lastUpdateTime = new Date();
  }

  /**
   * Handle failed authentication
   */
  private handleFailedAuthentication(): void {
    this.faceDetection = null;
    this.isAuthenticated.update(() => false);
    this.authenticatedUser = null;
  }

  /**
   * Process medicine detection with real API call
   */
  private async processMedicineDetection(imageBlob: Blob): Promise<void> {
    try {
      const formData = new FormData();
      formData.append('image', imageBlob, 'medicine.jpg');

      const response = await firstValueFrom(this.http.post<MedicineDetectionResponse>(
        `${ this.API_URL }/medicines/recognize`,
        formData
      ));

      console.log("Medicine Detection Response: ", response);

      if(response?.results?.length > 0) {
        this.handleMedicineDetectionResults(response.results);
      } else {
        // Clear previous detections if no medicines found
        this.medicineDetections.update(() => []);
      }

    } catch(error) {
      console.error('Medicine detection error:', error);
      this.messageService.add({
        severity: 'warn',
        summary: 'Detection Error',
        detail: 'Unable to detect medicines. Please try again.',
        life: 3000
      });
    }
  }

  /**
   * Handle medicine detection results from API
   */
  private handleMedicineDetectionResults(results: MedicineDetectionResponse['results']): void {
    if(!this.videoElement) return;

    const video = this.videoElement.nativeElement;
    const videoRect = video.getBoundingClientRect();

    // Calculate scaling factors for bounding boxes
    const scaleX = videoRect.width / this.videoWidth;
    const scaleY = videoRect.height / this.videoHeight;

    // Convert API results to our MedicineDetection format
    const detectedMedicines: MedicineDetection[] = results.map((result, index) => ( {
      id: `medicine_${ Date.now() }_${ index }`,
      name: result.classify.product.charAt(0).toUpperCase() + result.classify.product.slice(1),
      details: `Detected medicine with ${ ( result.detection.confidence * 100 ).toFixed(1) }% detection confidence`,
      confidence: result.detection.confidence,
      classifyConfidence: result.classify.confidence,
      bbox: {
        x: result.detection.bbox.x * scaleX,
        y: result.detection.bbox.y * scaleY,
        width: result.detection.bbox.width * scaleX,
        height: result.detection.bbox.height * scaleY
      }
    } ));

    // Update detected medicines
    this.medicineDetections.update(() => detectedMedicines);

    // Show success toast for new detections
    if(detectedMedicines.length > 0) {
      this.messageService.add({
        severity: 'success',
        summary: 'Medicines Detected',
        detail: `Found ${ detectedMedicines.length } medicine(s): ${ detectedMedicines.map(m => m.name).join(', ') }`,
        life: 4000
      });
    }
  }

  /**
   * Handle medicine dispensing
   */
  dispenseMedicine(medicine: MedicineDetection): void {
    console.log('Dispensing medicine:', medicine.name);

    this.messageService.add({
      severity: 'success',
      summary: 'Medicine Dispensed',
      detail: `${ medicine.name } has been dispensed successfully`,
      life: 3000
    });

    // Remove the medicine from detection results
    this.medicineDetections.update(value => {
      return value.filter(m => m.id !== medicine.id);
    });

    // Reset to face detection mode after dispensing
    setTimeout(() => {
      this.resetToFaceDetection();
    }, 2000);
  }

  /**
   * Reset system to face detection mode
   */
  private resetToFaceDetection(): void {
    this.isAuthenticated.update(() => false);
    this.authenticatedUser = null;
    this.currentMode = 'face';
    this.medicineDetections.update(() => []);
    this.faceDetection = null;

    this.messageService.add({
      severity: 'info',
      summary: 'Session Reset',
      detail: 'Please authenticate again for medicine access',
      life: 3000
    });
  }

  /**
   * Stop camera and clean up resources
   */
  private stopCamera(): void {
    if(this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    this.isCameraActive = false;
  }

  /**
   * Update system status periodically
   */
  private updateSystemStatus(): void {
    interval(5000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.lastUpdateTime = new Date();
        // TODO: Add actual system health checks
        this.isSystemOnline = navigator.onLine;
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
}
