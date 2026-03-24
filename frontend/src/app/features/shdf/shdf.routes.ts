import { Routes } from '@angular/router';

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
        loadComponent: () =>
          import('./shdf-basic/shdf-basic.component').then(m => m.SHDFBasicComponent),
      },
      {
        path: 'comprehensive',
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
