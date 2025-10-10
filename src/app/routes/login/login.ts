import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthenticationService } from '../../services/authentication-service/authentication-service';
import { LoginResponse } from '../../models/responses';
import { MessageService } from 'primeng/api';
import { Toast } from 'primeng/toast';
import { UserRole } from '../../services/types';
import { Button } from "primeng/button";

export interface LoginFormData {
  email: string;
  password: string;
}

export interface FormFieldError {
  field: string;
  message: string;
}

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, Toast, Button],
  templateUrl: './login.html',
  styleUrl: './login.css',
  providers: [
    MessageService
  ]
})
export class Login implements OnInit {

  private readonly router = inject(Router);
  private readonly authService = inject(AuthenticationService);
  private readonly messageService = inject(MessageService);

  protected form = signal({
    isLoading: signal<boolean>(false),
    errorMessage: signal<string>(''),
    loginForm: new FormGroup({
      email: new FormControl('', [Validators.required, Validators.email]),
      password: new FormControl('', [Validators.required, Validators.minLength(8)])
    })
  })

  ngOnInit(): void {
    console.log('Login component initialized');
  }

  onSubmit(): void {
    if (this.form().loginForm.valid) {
      this.form().isLoading.set(true);
      this.form().errorMessage.set('');

      const formData: LoginFormData = this.form().loginForm.value as LoginFormData;

      this.authService.login(formData.email, formData.password).subscribe({
        next: (response: LoginResponse) => {
          this.form().isLoading.set(false);

          if (response.access_token) {
            localStorage.setItem('token', response.access_token)
          } else {
            this.messageService.add({
              severity: 'error',
              summary: 'Login Failed',
              detail: 'Invalid email or password'
            })
            return;
          }
          switch (response.user.role) {
            case UserRole.IT_ADMIN:
              localStorage.setItem('userRole', UserRole.IT_ADMIN);
              this.router.navigate(['/it-admin/home']);
              break;
            case UserRole.PHARMACIST:
              localStorage.setItem('userRole', UserRole.PHARMACIST);
              this.router.navigate(['/pharmacist/home']);
              break;
            case UserRole.USER:
              localStorage.setItem('userRole', UserRole.USER);
              this.router.navigate(['/user/home']);
              break;
            default:
              this.router.navigate(['/login']);
              break;
          }
        },
        error: (error) => {
          this.form().isLoading.set(false);
          this.form().errorMessage.set('Login failed');
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.form().loginForm.controls).forEach(key => {
      const control = this.form().loginForm.get(key);
      control?.markAsTouched();
    });
  }

  private getControlErrorMessage(control: FormControl, fieldName: string): string {
    if (control.errors) {
      if (control.errors['required']) {
        return `${fieldName} is required`;
      }
      if (control.errors['email']) {
        return 'Please enter a valid email address';
      }
      if (control.errors['minlength']) {
        return `${fieldName} must be at least ${control.errors['minlength'].requiredLength} characters`;
      }
    }
    return '';
  }

  getFieldError(fieldName: string): string {
    const control = fieldName === 'email' ? this.form().loginForm.get('email') : this.form().loginForm.get('password');
    if (control?.errors) {
      if (control.errors['required']) {
        return `${fieldName} is required`;
      }
      if (control.errors['email']) {
        return 'Please enter a valid email address';
      }
      if (control.errors['minlength']) {
        return `${fieldName} must be at least ${control.errors['minlength'].requiredLength} characters`;
      }
    }
    return '';
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = fieldName === 'email' ? this.form().loginForm.get('email') : this.form().loginForm.get('password');
    return !!(control?.touched && control.errors);
  }

  navigateToKiosk(): void {
    this.router.navigate(['/kiosk/interface']);
  }
}
