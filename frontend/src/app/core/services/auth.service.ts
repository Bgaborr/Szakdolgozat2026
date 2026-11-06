import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, of, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User } from '../../models/user.model';

export interface LoginData {
  email: string;
  password: string;
}
export interface RegisterData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  private _user = signal<User | null>(null);
  private _roleHierarchy = signal<{ [key: string]: number }>({});

  readonly currentUser = this._user.asReadonly();
  readonly isLoggedIn = computed(() => this._user() !== null);

  getCsrfCookie(): Observable<any> {
    // === MOCK VERZIÓ (Nincs hálózati kérés) ===
    // return of(true);

    /* === EREDETI ÉLES KÓD ===*/
    const baseUrl = environment.apiUrl.replace(/\/api$/, '');
    return this.http.get(`${baseUrl}/sanctum/csrf-cookie`, { withCredentials: true });
  }

  register(data: RegisterData): Observable<any> {
    // === MOCK VERZIÓ ===
    // return of({ message: 'Regisztráció szimulálva' });

    /* === EREDETI ÉLES KÓD === */
    return this.getCsrfCookie().pipe(
      switchMap(() => {
        return this.http
          .post<any>(`${environment.apiUrl}/auth/register`, data, { withCredentials: true })
          .pipe(tap((res) => this.handleAuthResponse(res)));
      }),
    );
  }

  login(data: LoginData): Observable<any> {
    // === MOCK VERZIÓ (Hálózati kérés nélkül) ===
    // const mockUser = {
    //   id: 1,
    //   name: 'Teszt Admin',
    //   email: data.email,
    //   roles: [{ name: 'admin', label: 'Adminisztrátor' }],
    //   permissions: [
    //     { name: 'view-admin-panel' },
    //     { name: 'approve-gallery' },
    //     { name: 'approve-suggestions' },
    //   ],
    // };

    // this._user.set(mockUser as any);
    // return of({ user: mockUser });

    /* === EREDETI ÉLES KÓD ===    */
    return this.getCsrfCookie().pipe(
      switchMap(() => {
        return this.http
          .post<any>(`${environment.apiUrl}/auth/login`, data, { withCredentials: true })
          .pipe(tap((res) => this.handleAuthResponse(res)));
      }),
    );
  }

  checkAuthStatus(): Observable<any> {
    // === MOCK VERZIÓ ===
    // return of(null);

    /* === EREDETI ÉLES KÓD ===*/
    return this.http.get<any>(`${environment.apiUrl}/auth/me`, { withCredentials: true }).pipe(
      tap((res) => this.handleAuthResponse(res)),
      catchError(() => {
        this._user.set(null);
        return of(null);
      }),
    );
  }

  logout(): void {
    // === MOCK VERZIÓ ===
    // console.log('Kijelentkezés szimulálva...');
    // this.clearAuth();

    /* === EREDETI ÉLES KÓD ===*/
    this.http.post(`${environment.apiUrl}/auth/logout`, {}, { withCredentials: true }).subscribe({
      complete: () => this.clearAuth(),
      error: () => this.clearAuth(),
    });
  }
  mergeCurrentUser(res: any): void {
    const incoming = res?.user ?? res;
    if (!incoming || typeof incoming !== 'object') return;

    this._user.set({ ...this._user(), ...incoming } as User);
    if (res?.role_hierarchy) this._roleHierarchy.set(res.role_hierarchy);
  }

  private handleAuthResponse(res: any): void {
    if (res.user) this._user.set(res.user);
    if (res.role_hierarchy) this._roleHierarchy.set(res.role_hierarchy);
  }

  private clearAuth(): void {
    this._user.set(null);
    this.router.navigate(['/login']);
  }

  expireSession(user: User | null): void {
    this._user.set(user);
  }

  getUserId(): number | null {
    return this._user()?.id || null;
  }

  hasPermission(permissionName: string): boolean {
    const permissions = this._user()?.permissions;
    if (!permissions) return false;
    return permissions.some((p: any) =>
      typeof p === 'object' ? p.name === permissionName : p === permissionName,
    );
  }

  hasAnyPermission(permissions: string[]): boolean {
    return permissions.some((p) => this.hasPermission(p));
  }

  getUserLevel(user: User | null = this._user()): number {
    if (!user || !user.roles) return 0;
    const hierarchy = this._roleHierarchy();
    let max = 0;
    user.roles.forEach((r: any) => {
      const roleName = typeof r === 'string' ? r : r.name;
      const level = hierarchy[roleName] || 0;
      if (level > max) max = level;
    });
    return max;
  }

  canManageUser(targetUser: User): boolean {
    const currentUser = this._user();
    if (!currentUser || currentUser.id === targetUser.id) return false;
    return this.getUserLevel(currentUser) > this.getUserLevel(targetUser);
  }

  canManageRole(roleName: string): boolean {
    const currentUser = this._user();
    if (!currentUser) return false;

    const myLevel = this.getUserLevel(currentUser);
    const hierarchy = this._roleHierarchy();
    const targetRoleLevel = hierarchy[roleName] || 0;
    const highestPossibleLevel = Math.max(...Object.values(hierarchy));

    if (myLevel === highestPossibleLevel && targetRoleLevel === highestPossibleLevel) return true;
    return myLevel > targetRoleLevel;
  }
}
