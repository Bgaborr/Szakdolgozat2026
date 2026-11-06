import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';
import { permissionGuard } from './core/guards/permission.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full',
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/profile/profile.component').then((m) => m.ProfileComponent),
  },
  {
    path: 'home',
    loadComponent: () => import('./pages/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'gallery',
    loadComponent: () =>
      import('./pages/gallery/gallery.component').then((m) => m.GalleryComponent),
  },
  {
    path: 'vehicles/locomotives',
    loadComponent: () =>
      import('./pages/locomotives/locomotives.component').then((m) => m.LocomotivesComponent),
  },
  {
    path: 'vehicles/multiple-units',
    loadComponent: () =>
      import('./pages/multiple-units/multiple-units.component').then(
        (m) => m.MultipleUnitsComponent,
      ),
  },
  {
    path: 'vehicles/passenger-cars',
    loadComponent: () =>
      import('./pages/passenger-cars/passenger-cars.component').then(
        (m) => m.PassengerCarsComponent,
      ),
  },
  {
    path: 'service-locations',
    loadComponent: () =>
      import('./pages/service-locations/service-locations.component').then(
        (m) => m.ServiceLocationsComponent,
      ),
  },
  {
    path: 'glossary',
    loadComponent: () =>
      import('./pages/glossary/glossary.component').then((m) => m.GlossaryComponent),
  },
  {
    path: 'admin/users',
    canActivate: [authGuard, permissionGuard('manage-users')],
    loadComponent: () =>
      import('./features/admin/users/users.component').then((m) => m.UsersComponent),
  },
  {
    path: 'admin/roles',
    canActivate: [authGuard, permissionGuard('manage-users')],
    loadComponent: () =>
      import('./features/admin/roles/roles.component').then((m) => m.RolesComponent),
  },
  {
    path: 'admin/permissions',
    canActivate: [authGuard, permissionGuard('manage-users')],
    loadComponent: () =>
      import('./features/admin/permissions/permissions.component').then(
        (m) => m.PermissionsComponent,
      ),
  },
  {
    path: 'admin/gallery',
    canActivate: [authGuard, permissionGuard('approve-gallery')],
    loadComponent: () =>
      import('./features/admin/admin-gallery/admin-gallery.component').then(
        (m) => m.AdminGalleryComponent,
      ),
  },
  {
    path: 'stat',
    canActivate: [authGuard, permissionGuard('stat-view')],
    loadComponent: () => import('./pages/stat/stat.component').then((m) => m.StatComponent),
  },
  {
    path: 'admin/suggestions',
    canActivate: [authGuard, permissionGuard('approve-suggestions')],
    loadComponent: () =>
      import('./features/admin/suggestions/suggestions.component').then(
        (m) => m.SuggestionsComponent,
      ),
  },
  { 
    path: 'vehicles', 
    loadComponent: () =>
      import('./pages/vehicle-list/vehicle-list.component').then(
        (m) => m.VehicleListComponent,
      ),
  },
  {
    path: '**',
    redirectTo: '/home',
  },
];
