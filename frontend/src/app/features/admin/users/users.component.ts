import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { environment } from '../../../../environments/environment';
import { User } from '../../../models/user.model';
import { Role } from '../../../models/role.model';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './users.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './users.component.scss',
})
export class UsersComponent implements OnInit {
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);
  auth = inject(AuthService);

  users = signal<User[]>([]);
  roles = signal<Role[]>([]);
  loading = signal(true);
  showModal = signal(false);
  editingUser = signal<User | null>(null);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: [''],
    roles: [[] as string[]],
  });

  ngOnInit(): void {
    this.loadUsers();
    this.loadRoles();
  }

  loadUsers(): void {
    this.http.get<User[]>(`${environment.apiUrl}/users`, { withCredentials: true }).subscribe({
      next: (users) => {
        this.users.set(users);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  loadRoles(): void {
    this.http
      .get<Role[]>(`${environment.apiUrl}/roles`, { withCredentials: true })
      .subscribe({ next: (roles) => this.roles.set(roles) });
  }

  openCreate(): void {
    this.editingUser.set(null);
    this.form.reset({ roles: [] });
    this.form.get('password')?.setValidators([Validators.required, Validators.minLength(8)]);
    this.form.get('password')?.updateValueAndValidity();
    this.showModal.set(true);
  }

  openEdit(user: User): void {
    this.editingUser.set(user);
    this.form.patchValue({
      name: user.name,
      email: user.email,
      password: '',
      roles: user.roles.map((role: any) => role.name || role),
    });
    this.form.get('password')?.clearValidators();
    this.form.get('password')?.updateValueAndValidity();
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.error.set(null);
  }

  toggleRole(roleName: string): void {
    const current = (this.form.value.roles as string[]) || [];
    const updated = current.includes(roleName)
      ? current.filter((r) => r !== roleName)
      : [...current, roleName];
    this.form.patchValue({ roles: updated });
  }

  hasRole(roleName: string): boolean {
    return ((this.form.value.roles as string[]) || []).includes(roleName);
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    const data = this.form.value;
    const editing = this.editingUser();

    const request$ = editing
      ? this.http.put(`${environment.apiUrl}/users/${editing.id}`, data, { withCredentials: true })
      : this.http.post(`${environment.apiUrl}/users`, data, { withCredentials: true });

    request$.subscribe({
      next: () => {
        this.success.set(editing ? 'Felhasználó frissítve!' : 'Felhasználó létrehozva!');
        this.closeModal();
        this.loadUsers();
        setTimeout(() => this.success.set(null), 3000);
      },
      error: (err) => this.error.set(err.error?.message || 'Hiba történt.'),
    });
  }

  deleteUser(user: User): void {
    if (!confirm(`Biztosan törlöd: ${user.name}?`)) return;

    this.http
      .delete(`${environment.apiUrl}/users/${user.id}`, { withCredentials: true })
      .subscribe({
        next: () => {
          this.success.set('Felhasználó törölve!');
          this.loadUsers();
          setTimeout(() => this.success.set(null), 3000);
        },
        error: (err) => this.error.set(err.error?.message || 'Hiba történt.'),
      });
  }
  getRoleLabel(roleInput: any): string {
    if (roleInput && roleInput.label) {
      return roleInput.label;
    }
    const roleName = typeof roleInput === 'string' ? roleInput : roleInput?.name;
    const foundRole = this.roles().find((r) => r.name === roleName);
    return foundRole ? foundRole.label : roleName;
  }
}
