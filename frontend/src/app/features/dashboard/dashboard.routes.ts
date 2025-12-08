import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard.component';
import { StudentDashboardComponent } from './student/student-dashboard.component';
import { StudentProfileComponent } from './student/profile/profile';
import { AdviserDashboardComponent } from './adviser/adviser-dashboard.component';
import { StaffDashboardComponent } from './staff/staff-dashboard.component';
import { AdminDashboardComponent } from './admin/admin-dashboard.component';

export const dashboardRoutes: Routes = [
  {
    path: 'student',
    component: StudentDashboardComponent
  },
  {
    path: 'student/profile',
    component: StudentProfileComponent
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
    component: DashboardComponent,
    pathMatch: 'full'
  },
  {
    path: '**',
    component: DashboardComponent
  }
];
