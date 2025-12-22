import { Routes } from '@angular/router';

export const medicalRecordsRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./medical-records.component').then(m => m.MedicalRecordsComponent)
  },
  {
    path: 'personal-info',
    loadComponent: () => import('./personal-info/personal-info.component').then(m => m.PersonalInfoComponent)
  },
  {
    path: 'visits-history',
    loadComponent: () => import('./visits-history/visits-history.component').then(m => m.VisitsHistoryComponent)
  }
];