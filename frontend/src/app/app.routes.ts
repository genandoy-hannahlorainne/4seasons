import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { noAuthGuard } from './core/guards/no-auth.guard';
import { forceChangePasswordGuard } from './core/guards/force-change-password.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/landing/landing.component').then(m => m.LandingComponent)
  },
  {
    path: 'developers',
    loadComponent: () => import('./features/developers/developers.component').then(m => m.DevelopersComponent)
  },
  {
    path: 'role-selection',
    canActivate: [noAuthGuard],
    loadComponent: () => import('./features/auth/role-selection/role-selection').then(m => m.RoleSelection)
  },
  {
    path: 'login/student',
    canActivate: [noAuthGuard],
    data: { role: 'student' },
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'login/adviser',
    canActivate: [noAuthGuard],
    data: { role: 'adviser' },
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'login/clinic-staff',
    canActivate: [noAuthGuard],
    data: { role: 'clinic-staff' },
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'login/:role',
    canActivate: [noAuthGuard],
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'login',
    pathMatch: 'full',
    canActivate: [noAuthGuard],
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'admin/login',
    canActivate: [noAuthGuard],
    loadComponent: () => import('./features/auth/admin-login/admin-login.component').then(m => m.AdminLoginComponent)
  },
  {
    path: 'force-change-password',
    canActivate: [forceChangePasswordGuard],
    loadComponent: () => import('./features/auth/force-change-password/force-change-password.component').then(m => m.ForceChangePasswordComponent)
  },
  {
    path: 'dashboard',
    loadChildren: () => import('./features/dashboard/dashboard.routes').then(m => m.dashboardRoutes),
    canActivate: [authGuard]
  },
  {
    path: 'students',
    loadChildren: () => import('./features/students/students.routes').then(m => m.STUDENT_ROUTES),
    canActivate: [authGuard]
  },
  {
    path: 'medical-visits',
    loadChildren: () => import('./features/medical-visits/medical-visits.routes').then(m => m.MEDICAL_VISIT_ROUTES),
    canActivate: [authGuard]
  },
  {
    path: 'shdf',
    loadChildren: () => import('./features/shdf/shdf.routes').then(m => m.SHDF_ROUTES),
    canActivate: [authGuard]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
