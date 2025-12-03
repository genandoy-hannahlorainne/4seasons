import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

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
    path: 'signup',
    loadComponent: () => import('./features/auth/signup/signup.component').then(m => m.SignupComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent)
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
  }
];
