import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  loading = signal(false);
  error = signal<string | null>(null);

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    
    this.loading.set(true);
    this.error.set(null);

    // === MOCK VERZIÓ (Közvetlen hívás CSRF nélkül) ===
    this.authService.login(this.form.value as any).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.error.set('Hibás email vagy jelszó.');
      },
    });

    /* === EREDETI ÉLES KÓD (CSRF láncolással) ===
    this.authService.getCsrfCookie().subscribe({
      next: () => {
        this.authService.login(this.form.value as any).subscribe({
          next: () => this.router.navigate(['/dashboard']),
          error: (err: HttpErrorResponse) => {
            this.loading.set(false);
            this.error.set(err.error?.message || 'Hibás email vagy jelszó.');
          },
        });
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Nem sikerült kapcsolódni a szerverhez.');
      },
    });
    */
  }
}