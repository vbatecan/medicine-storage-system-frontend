import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  computed,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  signal,
  ViewChild
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { Subject, takeUntil } from 'rxjs';

import { CameraService } from '../../../services/camera.service';
import { FaceRecognitionService } from '../../../services/face-recognition.service';
import { MedicineDetectionService } from '../../../services/medicine-detection.service';
import { SystemService } from '../../../services/system-service/system-service';
import {
  AccessLog, MedicineDetection, MedicineInteractionResponse,
  SystemStatus,
  User
} from '../../../services/types';
import { MedicineService } from '../../../services/medicine-service/medicine-service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-kiosk-interface',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastModule, ButtonModule],
  templateUrl: './kiosk-interface.html',
  styleUrl: './kiosk-interface.css',
  providers: [
    MessageService
  ]
})
export class KioskInterface implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('videoElement', { static: false }) videoElement!: ElementRef<HTMLVideoElement>;

  private cameraService = inject(CameraService);
  private faceRecognitionService = inject(FaceRecognitionService);
  private medicineDetectionService = inject(MedicineDetectionService);
  private systemService = inject(SystemService);
  private messageService = inject(MessageService);
  private medicineService = inject(MedicineService);

  readonly authenticatedUser = signal<User | null>(null);
  readonly currentDetections = signal<MedicineDetection[]>([]);
  readonly systemStatus = signal<SystemStatus>({ isOnline: false, lastSync: new Date() });
  readonly accessLogs = signal<AccessLog[]>([]);
  readonly selectedMedicine = signal<MedicineDetection | null>(null);

  readonly isCameraActive = computed(() => this.cameraService.isActive());
  readonly isProcessing = computed(() =>
    this.faceRecognitionService.isProcessing() ||
    this.medicineDetectionService.isProcessing()
  );

  readonly showAccessPanel = signal(false);
  readonly showSystemPanel = signal(false);

  private destroy$ = new Subject<void>();

  ngOnInit() {
    this.updateSystemStatus();
    this.subscribeToServices();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.cameraService.stopCamera();
  }

  async ngAfterViewInit() {
    await this.initializeCamera();
    this.startProcessing();
  }

  private async initializeCamera() {
    try {
      await this.cameraService.initializeCamera(this.videoElement);
      this.messageService.add({
        severity: 'success',
        summary: 'Camera Ready',
        detail: 'Camera initialized successfully'
      });
    } catch(error) {
      console.error('Error initializing camera:', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Camera Error',
        detail: 'Failed to initialize camera'
      });
    }
  }

  private startProcessing() {
    this.cameraService.startFrameProcessing(this.videoElement)
      .pipe(takeUntil(this.destroy$))
      .subscribe(frame => {
        if(frame) {
          this.processFrame(frame);
        }
      });
  }

  private async processFrame(frame: ImageData) {
    try {
      let faceResult: User | null = null;
      if(!this.isUserAuthenticated()) {
        console.error("Logging in...");
        faceResult = await this.faceRecognitionService.processFrame(frame)
      }

      if(faceResult && !this.isUserAuthenticated()) {
        let userRole = 'GUEST';

        if(faceResult.role) {
          if(faceResult.role.includes('IT_ADMIN') || faceResult.role.includes('admin')) {
            userRole = 'IT_ADMIN';
          } else if(faceResult.role.includes('PHARMACIST') || faceResult.role.includes('pharmacist')) {
            userRole = 'PHARMACIST';
          }
        }

        this.authenticatedUser.update(() => faceResult);
        this.logAccess(faceResult);
      } else {
        const medicineResults = await this.medicineDetectionService.processFrame(frame);
        if(medicineResults && medicineResults.length > 0) {
          this.updateDetections(medicineResults);
        }
      }
    } catch(error) {
      console.error('Error processing frame:', error);
    }
  }

  private updateDetections(newDetections: MedicineDetection[]) {
    const currentDetections = this.currentDetections();
    const updatedDetections = [...currentDetections];

    newDetections.forEach(newDetection => {
      const existingIndex = updatedDetections.findIndex(
        existing => existing.id === newDetection.id
      );

      if(existingIndex >= 0) {
        if(newDetection.confidence > updatedDetections[existingIndex].confidence) {
          updatedDetections[existingIndex] = {
            ...newDetection,
            lastSeen: new Date()
          };
        }
      } else {
        // Add new detection
        updatedDetections.push({
          ...newDetection,
          lastSeen: new Date()
        });
      }
    });

    // Remove old detections (older than 5 seconds)
    // const now = new Date();
    // const filteredDetections = updatedDetections.filter(detection => {
    //   const timeDiff = now.getTime() - detection.lastSeen.getTime();
    //   return timeDiff < 5000; // 5 seconds
    // });
    //
    this.currentDetections.update(() => updatedDetections);
  }

  private subscribeToServices() {
    // For now, we'll handle state updates manually during frame processing
    // In a production app, these would be proper RxJS observables
    console.log('Service subscriptions would be set up here');
  }

  private logAccess(user: User) {
    const accessLog: AccessLog = {
      id: Date.now().toString(),
      userId: user.id || 'unknown',
      email: user.email,
      faceName: user.face_name,
      timestamp: new Date(),
      action: 'face_recognition_success'
    };

    this.accessLogs.update(logs => [accessLog, ...logs.slice(0, 9)]);
  }

  private updateSystemStatus() {
    this.systemService.getSystemStatus().subscribe({
      next: (status: {ok: boolean}) => {
        this.systemStatus.set({
          isOnline: status.ok,
          lastSync: new Date()
        });
      },
      error: (error) => {
        console.error('Error fetching system status:', error);
        this.systemStatus.set({ isOnline: false, lastSync: new Date() });
      }
    });
  }

  selectMedicine(medicine: MedicineDetection) {
    this.selectedMedicine.set(medicine);
  }

  clearSelection() {
    this.selectedMedicine.set(null);
  }

  toggleAccessPanel() {
    this.showAccessPanel.update(show => !show);
  }

  toggleSystemPanel() {
    this.showSystemPanel.update(show => !show);
  }

  refreshCamera() {
    this.cameraService.stopCamera();
    this.initializeCamera();
  }

  logout() {
    this.authenticatedUser.set(null);
    this.currentDetections.set([]);
    this.selectedMedicine.set(null);
    this.showAccessPanel.set(false);
    this.showSystemPanel.set(false);

    this.messageService.add({
      severity: 'info',
      summary: 'Logged Out',
      detail: 'User session ended'
    });
  }

  dispenseMedicine(detection: MedicineDetection) {
    this.selectMedicine(detection);
    const medicineName = detection.medicine?.name || detection.name;

    this.medicineService.dispenseMedicine(medicineName, 1).subscribe({
      next: (response) => {
        console.log('Medicine dispensed:', response);
        this.removeFromDetection(detection);
        this.messageService.add({
          severity: 'success',
          summary: 'Medicine Dispensed',
          detail: `${ medicineName } has been dispensed from storage`,
          life: 3000
        });
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error dispensing medicine:', err);
        const errorMsg = err.error?.detail || 'An error occurred while dispensing the medicine.';
        this.messageService.add({
          severity: 'error',
          summary: 'Dispense Error',
          detail: errorMsg,
          life: 5000
        });
      }
    });
  }

  addToStorage(detection: MedicineDetection) {
    this.selectMedicine(detection);
    const medicineName = detection.medicine?.name || detection.name;

    this.medicineService.addStock(medicineName, 1).subscribe({
      next: (response: MedicineInteractionResponse) => {
        console.log('Stock added:', response);
        this.removeFromDetection(detection);
        this.messageService.add({
          severity: 'success',
          summary: 'Medicine Added',
          detail: `${ medicineName } has been added to storage`,
          life: 3000
        });
      },
      error: (error: HttpErrorResponse) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Add Stock Error',
          detail: error.error?.detail || 'An error occurred while adding stock.',
          life: 5000
        })
      }
    })
  }

  removeFromDetection(detection: MedicineDetection) {
    this.currentDetections.update(detections =>
      detections.filter(d => d.id !== detection.id)
    );

    if(this.selectedMedicine() === detection) {
      this.clearSelection();
    }

    const medicineName = detection.medicine?.name || detection.name;

    this.messageService.add({
      severity: 'info',
      summary: 'Detection Removed',
      detail: `${ medicineName } removed from detection list`,
      life: 2000
    });
  }

  readonly detectionCount = computed(() => this.currentDetections().length);
  readonly isUserAuthenticated = computed(() => this.authenticatedUser() !== null);
  readonly userName = computed(() => this.authenticatedUser()?.face_name || 'Unknown User');
  readonly userRole = computed(() => this.authenticatedUser()?.role || 'guest');

  getMedicineStatusClass(medicine: MedicineDetection): string {
    if(medicine.confidence > 0.8) return 'high-confidence';
    if(medicine.confidence > 0.6) return 'medium-confidence';
    return 'low-confidence';
  }

  formatTimestamp(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      timeStyle: 'medium',
      dateStyle: 'short'
    }).format(date);
  }
}
