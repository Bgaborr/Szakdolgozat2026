import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';

function passwordMatch(ctrl: AbstractControl) {
  const pw = ctrl.get('password');
  const pwc = ctrl.get('password_confirmation');
  if (pw && pwc && pw.value !== pwc.value) {
    pwc.setErrors({ mismatch: true });
  } else if (pwc?.hasError('mismatch')) {
    pwc.setErrors(null);
  }
  return null;
}
@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  form = this.fb.group(
    {
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      password_confirmation: ['', Validators.required],
    },
    { validators: passwordMatch },
  );

  loading = signal(false);
  error = signal<string | null>(null);

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set(null);

    this.authService.getCsrfCookie().subscribe({
      next: () => {
        this.authService.register(this.form.value as any).subscribe({
          next: () => this.router.navigate(['/dashboard']),
          error: (err: HttpErrorResponse) => {
            this.loading.set(false);
            this.error.set(err.error?.message || 'Hiba történt a regisztráció során.');
          },
        });
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Nem sikerült kapcsolódni a szerverhez.');
      },
    });
  }
}
