import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard.component';
import { StudentLayoutComponent } from './student/student-layout.component';
import { StudentDashboardComponent } from './student/student-dashboard.component';
import { StudentProfileComponent } from './student/profile/profile';
import { AdviserDashboardComponent } from './adviser/adviser-dashboard.component';
import { StaffDashboardComponent } from './staff/staff-dashboard.component';
import { AdminDashboardComponent } from './admin/admin-dashboard.component';

export const dashboardRoutes: Routes = [
  {
    path: '',
    component: DashboardComponent,
    pathMatch: 'full'
  },
  {
    path: 'student',
    component: StudentLayoutComponent,
    children: [
      {
        path: '',
        component: StudentDashboardComponent
      },
      {
        path: 'profile',
        component: StudentProfileComponent
      },
      {
        path: 'medical-records',
        loadChildren: () => import('../medical-records/medical-records.routes').then(m => m.medicalRecordsRoutes)
      }
    ]
  },
  {
    path: 'adviser',
    component: AdviserDashboardComponent
  },
  {
    path: 'staff',
    component: StaffDashboardComponent
  },
  {
    path: 'admin',
    component: AdminDashboardComponent
  }
];
