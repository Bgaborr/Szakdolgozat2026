import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { environment } from '../../../../environments/environment';

interface Permissions {
  id: number;
  name: string;
  description: string;
}

@Component({
  selector: 'app-permissions',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './permissions.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './permissions.component.scss',
})
export class PermissionsComponent {
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);

  permission = signal<Permissions[]>([]);
  loading = signal(true);
  showModal = signal(false);
  editingPermission = signal<Permissions | null>(null);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    description: [''],
  });
  ngOnInit(): void {
    this.loadPermissions();
  }

  loadPermissions(): void {
    this.http
      .get<Permissions[]>(`${environment.apiUrl}/permissions`, { withCredentials: true })
      .subscribe({
        next: (permission) => {
          this.permission.set(permission);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  openCreate() {
    this.editingPermission.set(null);
    this.form.reset();
    this.showModal.set(true);
  }

  openEdit(permission: Permissions) {
    this.editingPermission.set(permission);
    this.form.patchValue({
      name: permission.name,
      description: permission.description,
    });
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  onSubmit() {
    if (this.form.invalid) return;

    const data = this.form.value;
    const editing = this.editingPermission();

    if (editing) {
      // Update existing permission
      this.http
        .put(`${environment.apiUrl}/permissions/${editing.id}`, data, { withCredentials: true })
        .subscribe({
          next: () => {
            this.success.set('Jogosultság sikeresen frissítve.');
            this.loadPermissions();
            this.closeModal();
          },
          error: () => this.error.set('Hiba történt a jogosultság frissítése során.'),
        });
    } else {
      // Create new permission
      this.http
        .post(`${environment.apiUrl}/permissions`, data, { withCredentials: true })
        .subscribe({
          next: () => {
            this.success.set('Jogosultság sikeresen létrehozva.');
            this.loadPermissions();
            this.closeModal();
          },
          error: () => this.error.set('Hiba történt a jogosultság létrehozása során.'),
        });
    }
  }

  deletePermissions(permission: Permissions) {
    if (!confirm('Biztosan törölni szeretné ezt a jogosultságot?')) return;

    this.http
      .delete(`${environment.apiUrl}/permissions/${permission.id}`, { withCredentials: true })
      .subscribe({
        next: () => {
          this.success.set('Jogosultság sikeresen törölve.');
          this.loadPermissions();
        },
        error: () => this.error.set('Hiba történt a jogosultság törlése során.'),
      });
  }
}
