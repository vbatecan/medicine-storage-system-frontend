---
applyTo: '**'
---
# Medicine Storage System Frontend - AI Coding Instructions

## Architecture Overview

This is an Angular 20 standalone component application for a medicine storage system with camera-based face recognition and medicine detection capabilities. The system serves three user roles: PHARMACIST, IT_ADMIN, and USER, with the kiosk interface as the primary entry point.

## Key Architectural Patterns

### Standalone Components & Lazy Loading
- All components use standalone architecture (`imports: []` in @Component)
- Route-level lazy loading in `app.routes.ts` using `loadComponent()` with dynamic imports
- Default route redirects to `kiosk/interface` - the main system entry point

### Signal-Based State Management
- Extensive use of Angular signals for reactive state management
- Computed signals for derived state (e.g., `isProcessing = computed(() => faceService.isProcessing() || medicineService.isProcessing())`)
- Services expose signals for component consumption: `authenticatedUser = signal<User | null>(null)`

### Service Layer Architecture
- Services use dependency injection with `inject()` function pattern
- API communication through environment-based URLs (`environment.apiUrl`)
- Separate environments: development (port 8080) vs production (port 8000)
- Services handle both API calls and complex business logic (face recognition, medicine detection)

## Critical Integration Points

### Camera & Recognition Pipeline
The kiosk interface orchestrates a complex pipeline:
1. `CameraService` - Camera initialization and frame capture
2. `FaceRecognitionService` - User authentication via face recognition API
3. `MedicineDetectionService` - Medicine detection with bounding box rendering
4. Authentication gates access to medicine operations

Key pattern: Frame processing uses RxJS observables with takeUntil for cleanup:
```typescript
this.cameraService.startFrameProcessing(this.videoElement)
  .pipe(takeUntil(this.destroy$))
  .subscribe(frame => this.processFrame(frame));
```

### Role-Based UI Rendering
- Uses Angular control flow (`@if`, `@for`) for conditional rendering
- Role checking: `userRole() === 'PHARMACIST'` controls action button visibility
- Medicine operations (dispense, add, remove) only available to PHARMACIST/IT_ADMIN roles

### File Handling Patterns
- FormData for multipart uploads (images, training files)
- PrimeNG FileUpload with custom event handling: `onSelect(event: FileSelectEvent)`
- File validation and preview in pharmacist medicine management

## Development Workflows

### Environment Configuration
- Development: `ng serve` (uses environment.development.ts)
- Production build: `ng build` 
- API endpoints automatically switch based on environment

### UI Framework Stack
- PrimeNG components with Aura theme preset
- Custom CSS for kiosk-specific layouts (camera overlays, bounding boxes)
- Tailwind CSS for utility classes
- Font Awesome icons (`fas fa-*` classes)

### Error Handling & User Feedback
- PrimeNG MessageService for toast notifications
- Consistent error handling in try/catch blocks with user-friendly messages
- Loading states tracked via signals: `loading = signal(false)`

## Project-Specific Conventions

### Component Structure
- Standalone components in `routes/` organized by user role
- Shared services in `services/` with subdirectories for complex services
- Models split: `io-types.ts` (data models) and `responses.ts` (API responses)

### API Integration Patterns
- HTTP interceptors not used - direct HttpClient injection
- FormData for file uploads, JSON for standard requests
- Response type safety with TypeScript interfaces

### State Synchronization
- Services maintain their own state via signals
- Components subscribe to service signals for reactive updates
- No centralized state management (no NgRx/Akita)

## Testing Notes
- Jasmine/Karma setup with `ng test`
- Test files co-located with components (`.spec.ts`)
- Component testing focuses on signal state and user interactions

## Key Files to Reference
- `src/app/routes/kiosk/kiosk-interface/` - Main system interface and patterns
- `src/app/services/` - Service layer architecture examples
- `src/app/models/io-types.ts` - Core data models and enums
- `src/environments/` - Environment-specific configuration
