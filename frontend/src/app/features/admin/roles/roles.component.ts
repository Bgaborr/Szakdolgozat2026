import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../../app/core/services/auth.service';

interface Permission {
  id: number;
  name: string;
  description: string;
}

interface Role {
  id: number;
  name: string;
  label: string;
  permissions: string[];
}

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './roles.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './roles.component.scss',
})
export class RolesComponent implements OnInit {
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);

  auth = inject(AuthService);

  roles = signal<Role[]>([]);
  permissions = signal<Permission[]>([]);
  loading = signal(true);
  showModal = signal(false);
  editingRole = signal<Role | null>(null);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  form = this.fb.group({
    name: [''],
    label: [''],
    permissions: [[] as string[]],
  });

  ngOnInit(): void {
    this.loadRoles();
    this.loadPermissions();
  }

  loadRoles(): void {
    this.http.get<Role[]>(`${environment.apiUrl}/roles`, { withCredentials: true }).subscribe({
      next: (roles) => {
        this.roles.set(roles);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  loadPermissions(): void {
    this.http
      .get<Permission[]>(`${environment.apiUrl}/permissions`, { withCredentials: true })
      .subscribe({ next: (permissions) => this.permissions.set(permissions) });
  }

  openCreate() {
    this.editingRole.set(null);
    this.form.reset({ permissions: [] });
    this.error.set(null);
    this.success.set(null);
    this.showModal.set(true);
  }

  openEdit(role: Role) {
    this.editingRole.set(role);
    this.error.set(null);
    this.success.set(null);

    const parsedPermissions =
      role.permissions?.map((p) => (typeof p === 'string' ? p : (p as any).name)) || [];

    this.form.patchValue({
      name: role.name,
      label: role.label,
      permissions: parsedPermissions,
    });
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.error.set(null);
  }

  togglePermission(permName: string): void {
    if (!this.canAssignPermission(permName)) return;

    const current = (this.form.value.permissions as string[]) || [];
    const updated = current.includes(permName)
      ? current.filter((p) => p !== permName)
      : [...current, permName];
    this.form.patchValue({ permissions: updated });
  }

  hasPermission(permName: string): boolean {
    return ((this.form.value.permissions as string[]) || []).includes(permName);
  }

  canAssignPermission(permName: string): boolean {
    const highestPossibleLevel = Math.max(...Object.values(this.auth['_roleHierarchy']() || {}));
    // Ha ő a Boss, mindent kiadhat. Ha nem, csak azt, amije neki is megvan.
    if (this.auth.getUserLevel() === highestPossibleLevel) return true;
    return this.auth.hasPermission(permName);
  }

  onSubmit() {
    if (this.form.invalid) return;

    const data = this.form.value;
    const editing = this.editingRole();

    this.error.set(null);

    if (editing) {
      this.http
        .put(`${environment.apiUrl}/roles/${editing.id}`, data, { withCredentials: true })
        .subscribe({
          next: () => {
            this.success.set('Szerepkör sikeresen frissítve');
            this.loadRoles();
            this.closeModal();
          },
          error: (err: HttpErrorResponse) => {
            this.error.set(err.error?.message || 'Hiba történt a frissítés során.');
          },
        });
    } else {
      this.http.post(`${environment.apiUrl}/roles`, data, { withCredentials: true }).subscribe({
        next: () => {
          this.success.set('Szerepkör sikeresen létrehozva');
          this.loadRoles();
          this.closeModal();
        },
        error: (err: HttpErrorResponse) => {
          this.error.set(err.error?.message || 'Hiba történt a létrehozás során.');
        },
      });
    }
  }

  deleteRole(role: Role) {
    if (!confirm(`Biztosan törölni szeretnéd a "${role.name}" szerepkört?`)) return;

    this.error.set(null);

    this.http
      .delete(`${environment.apiUrl}/roles/${role.id}`, { withCredentials: true })
      .subscribe({
        next: () => {
          this.success.set('Szerepkör sikeresen törölve');
          this.loadRoles();
        },
        error: (err: HttpErrorResponse) => {
          this.error.set(err.error?.message || 'Hiba történt a törlés során.');
        },
      });
  }

  getPermissionDescription(permName: string): string {
    const foundPerm = this.permissions().find((p) => p.name === permName);
    return foundPerm ? foundPerm.description : permName;
  }
}
