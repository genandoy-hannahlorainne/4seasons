import { Routes } from '@angular/router';
import { StudentDashboardComponent } from './student/student-dashboard.component';
import { AdviserDashboardComponent } from './adviser/adviser-dashboard.component';
import { StaffDashboardComponent } from './staff/staff-dashboard.component';
import { AdminDashboardComponent } from './admin/admin-dashboard.component';

export const dashboardRoutes: Routes = [
  {
    path: 'student',
    component: StudentDashboardComponent
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
  },
  {
    path: '',
    redirectTo: 'student',
    pathMatch: 'full'
  }
];
