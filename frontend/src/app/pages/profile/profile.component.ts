import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../models/user.model';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './profile.component.scss',
})
export class ProfileComponent implements OnInit {
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);
  theme = inject(ThemeService);
  auth = inject(AuthService);

  loading = signal(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: [''],
  });

  ngOnInit(): void {
    this.loadUser();
  }

  loadUser(): void {
    const user = this.auth.currentUser();
    if (user) {
      this.form.patchValue({
        name: user.name,
        email: user.email,
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.loading.set(true);
    this.error.set(null);

    const data = { ...this.form.value };

    if (!data.password) {
      delete data.password;
    }

    this.http.put<any>(`${environment.apiUrl}/auth/me`, data, { withCredentials: true }).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.success.set('Sikeresen frissítetted a profilodat!');

        this.form.get('password')?.reset();
        this.auth.mergeCurrentUser(res);

        setTimeout(() => this.success.set(null), 3000);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'Hiba történt a profil frissítése során.');
      },
    });
  }
}
