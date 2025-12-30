import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard.component';
import { StudentLayoutComponent } from './student/student-layout.component';
import { StudentDashboardComponent } from './student/student-dashboard.component';
import { StudentProfileComponent } from './student/profile/profile';
import { AdviserLayoutComponent } from './adviser/adviser-layout.component';
import { AdviserDashboardComponent } from './adviser/adviser-dashboard.component';
import { AdviserAlertsComponent } from './adviser/alerts/adviser-alerts.component';
import { AdviserHealthStatusComponent } from './adviser/health-status/adviser-health-status.component';
import { AdviserProfileComponent } from './adviser/profile/adviser-profile.component';
import { StaffLayoutComponent } from './staff/staff-layout.component';
import { ClinicDashboardComponent } from './staff/clinic-dashboard.component';
import { StudentListComponent } from './staff/students/student-list.component';
import { StudentMedicalProfileComponent } from './staff/students/student-medical-profile.component';
import { VisitsListComponent } from './staff/visits/visits-list.component';
import { VisitFormComponent } from './staff/visits/visit-form.component';
import { ReportsComponent } from './staff/reports/reports.component';
import { StaffProfileComponent } from './staff/profile/staff-profile.component';
import { AdminLayoutComponent } from './admin/admin-layout.component';
import { AdminDashboardComponent } from './admin/admin-dashboard.component';
import { AdminProfileComponent } from './admin/profile/admin-profile.component';
import { AdminGuard } from '../../core/guards/admin.guard';

export const dashboardRoutes: Routes = [
  { path: '', component: DashboardComponent, pathMatch: 'full' },
  {
    path: 'student',
    component: StudentLayoutComponent,
    children: [
      { path: '', component: StudentDashboardComponent },
      { path: 'profile', component: StudentProfileComponent },
      { path: 'medical-records', loadChildren: () => import('../medical-records/medical-records.routes').then(m => m.medicalRecordsRoutes) }
    ]
  },
  {
    path: 'adviser',
    component: AdviserLayoutComponent,
    children: [
      { path: '', component: AdviserDashboardComponent },
      { path: 'alerts', component: AdviserAlertsComponent },
      { path: 'health-status', component: AdviserHealthStatusComponent },
      { path: 'profile', component: AdviserProfileComponent }
    ]
  },
  {
    path: 'staff',
    component: StaffLayoutComponent,
    children: [
      { path: '', component: ClinicDashboardComponent },
      { path: 'students', component: StudentListComponent },
      { path: 'students/:id', component: StudentMedicalProfileComponent },
      { path: 'visits', component: VisitsListComponent },
      { path: 'visits/new', component: VisitFormComponent },
      { path: 'visits/:id', component: VisitFormComponent },
      { path: 'visits/:id/edit', component: VisitFormComponent },
      { path: 'reports', component: ReportsComponent },
      { path: 'profile', component: StaffProfileComponent }
    ]
  },
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [AdminGuard],
    children: [
      { path: '', component: AdminDashboardComponent },
      { path: 'profile', component: AdminProfileComponent }
    ]
  }
];
