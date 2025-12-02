import { Routes } from '@angular/router';

export const MEDICAL_VISIT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./visit-list/visit-list.component').then(m => m.VisitListComponent)
  }
];
