import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/landing/landing.component').then(m => m.LandingComponent)
  },
  {
    path: 'role-selection',
    loadComponent: () => import('./features/auth/role-selection/role-selection').then(m => m.RoleSelection)
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'admin/login',
    loadComponent: () => import('./features/auth/admin-login/admin-login.component').then(m => m.AdminLoginComponent)
  },
  {
    path: 'force-change-password',
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
