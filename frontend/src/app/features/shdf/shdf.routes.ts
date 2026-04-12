import { Routes } from '@angular/router';
import { canAccessBasicForm } from './guards/shdf-basic.guard';
import { canAccessComprehensiveForm } from './guards/shdf-comprehensive.guard';

export const SHDF_ROUTES: Routes = [
  {
    path: ':studentId',
    children: [
      {
        path: '',
        redirectTo: 'basic',
        pathMatch: 'full'
      },
      {
        path: 'basic',
        canActivate: [canAccessBasicForm],
        loadComponent: () =>
          import('./shdf-basic/shdf-basic.component').then(m => m.SHDFBasicComponent),
      },
      {
        path: 'comprehensive',
        canActivate: [canAccessComprehensiveForm],
        loadComponent: () =>
          import('./shdf-form/shdf-form.component').then(m => m.SHDFFormComponent),
      },
      {
        path: 'success',
        loadComponent: () =>
          import('./shdf-success/shdf-success.component').then(m => m.SHDFSuccessComponent),
      },
      {
        path: 'full',
        loadComponent: () =>
          import('./shdf-form/shdf-form.component').then(m => m.SHDFFormComponent),
      },
    ]
  },
];
