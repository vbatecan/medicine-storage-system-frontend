import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService } from '../../../services/user-service/user-service';
import { User, UserInput } from '../../../models/interfaces';

@Component({
  selector: 'app-it-admin-home',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './it-admin-home.html',
  styleUrl: './it-admin-home.css'
})
export class ItAdminHome implements OnInit {
  private userService = inject(UserService);
  private formBuilder = inject(FormBuilder);

  // Signals for state management
  users = signal<User[]>([]);
  loading = signal(false);
  error = signal('');
  success = signal('');
  selectedFile = signal<File | null>(null);
  showRegistrationForm = signal(false);

  // Computed signals
  hasUsers = computed(() => this.users().length > 0);
  isFormValid = computed(() =>
    this.userForm.valid && this.selectedFile() !== null
  );

  // Available roles
  roles = ['PHARMACIST', 'IT_ADMIN', 'SUPERVISOR'];

  // Reactive form
  userForm: FormGroup = this.formBuilder.group({
    face_name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    is_active: [true],
    role: ['PHARMACIST', Validators.required]
  });

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.loading.set(true);
    this.error.set('');

    this.userService.getAllUsers().subscribe({
      next: (response) => {
        this.users.set(response);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Error loading users: ' + ( err.error?.message || err.message ));
        this.loading.set(false);
      }
    });
  }

  onFileSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    if(target.files && target.files.length > 0) {
      const file = target.files[0];

      // Validate file type
      if(!file.type.startsWith('image/')) {
        this.error.set('Please select a valid image file');
        this.selectedFile.set(null);
        target.value = '';
      } else {
        this.selectedFile.set(file);
        this.error.set('');
      }
    }
  }

  registerUser() {
    this.error.set('');
    this.success.set('');

    if(!this.userForm.valid) {
      this.error.set('Please fill in all required fields correctly');
      return;
    }

    if(!this.selectedFile()) {
      this.error.set('Selfie image is required');
      return;
    }

    this.loading.set(true);

    const userInput: UserInput = this.userForm.value;

    this.userService.createUser(userInput, this.selectedFile()!).subscribe({
      next: (response) => {
        this.success.set('User registered successfully!');
        this.resetForm();
        this.users.update(users => [...users, response]);
        this.showRegistrationForm.set(false);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Error registering user: ' + ( err.error?.message || err.message ));
        this.loading.set(false);
      }
    });
  }

  resetForm() {
    this.userForm.reset({
      face_name: '',
      email: '',
      password: '',
      is_active: true,
      role: 'PHARMACIST'
    });
    this.selectedFile.set(null);

    // Reset file input
    const fileInput = document.getElementById('selfieInput') as HTMLInputElement;
    if(fileInput) {
      fileInput.value = '';
    }
  }

  toggleRegistrationForm() {
    this.showRegistrationForm.update(show => !show);
    if(!this.showRegistrationForm()) {
      this.resetForm();
      this.error.set('');
      this.success.set('');
    }
  }

  getStatusBadgeClass(isActive: boolean): string {
    return isActive ? 'badge-active' : 'badge-inactive';
  }

  getRoleBadgeClass(role: string): string {
    switch(role) {
      case 'IT_ADMIN':
        return 'badge-admin';
      case 'SUPERVISOR':
        return 'badge-supervisor';
      case 'PHARMACIST':
        return 'badge-pharmacist';
      default:
        return 'badge-default';
    }
  }

  trackByUserId(index: number, user: User): string {
    return user.id || index.toString();
  }

  // Form field getters for easy access in template
  get faceNameControl() {
    return this.userForm.get('face_name');
  }

  get emailControl() {
    return this.userForm.get('email');
  }

  get passwordControl() {
    return this.userForm.get('password');
  }

  get roleControl() {
    return this.userForm.get('role');
  }

  get isActiveControl() {
    return this.userForm.get('is_active');
  }
}
