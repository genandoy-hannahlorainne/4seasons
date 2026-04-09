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
import { ClassManagementComponent } from './adviser/class-management/class-management.component';
import { HealthMonitoringComponent } from './adviser/health-monitoring/health-monitoring.component';
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
import { ManageUsersComponent } from './admin/manage-users/manage-users.component';
import { ManageSectionsComponent } from './admin/manage-sections/manage-sections.component';
import { SystemSettingsComponent } from './admin/system-settings/system-settings.component';
import { ViewReportsComponent } from './admin/view-reports/view-reports.component';
import { GradePromotionComponent } from './admin/grade-promotion/grade-promotion.component';
import { SchoolYearManagementComponent } from './admin/school-year-management/school-year-management.component';
import { EmergencyDrillsComponent } from './admin/emergency-drills/emergency-drills.component';
import { DrillDetailComponent } from './admin/emergency-drills/drill-detail.component';
import { DrillDashboardComponent } from './admin/emergency-drills/drill-dashboard.component';
import { QrScannerComponent } from './admin/emergency-drills/qr-scanner.component';
import { adminGuard } from '../../core/guards/admin.guard';
import { roleGuard } from '../../core/guards/role.guard';

export const dashboardRoutes: Routes = [
  {
    path: '',
    component: DashboardComponent,
    pathMatch: 'full'
  },
  {
    path: 'student',
    component: StudentLayoutComponent,
    canActivate: [roleGuard],
    data: { roles: ['Student'] },
    children: [
      { path: '', component: StudentDashboardComponent },
      { path: 'profile', component: StudentProfileComponent },
      { path: 'medical-records', loadChildren: () => import('../medical-records/medical-records.routes').then(m => m.medicalRecordsRoutes) }
    ]
  },
  {
    path: 'adviser',
    component: AdviserLayoutComponent,
    canActivate: [roleGuard],
    data: { roles: ['Adviser'] },
    children: [
      { path: '', component: AdviserDashboardComponent },
      { path: 'alerts', component: AdviserAlertsComponent },
      { path: 'health-status', redirectTo: '', pathMatch: 'full' },
      { path: 'health-monitoring', component: HealthMonitoringComponent },
      { path: 'students/:id', component: StudentMedicalProfileComponent },
      { path: 'profile', component: AdviserProfileComponent },
      { path: 'class-management', component: ClassManagementComponent }
    ]
  },
  {
    path: 'staff',
    component: StaffLayoutComponent,
    canActivate: [roleGuard],
    data: { roles: ['Clinic Staff'] },
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
    canActivate: [adminGuard, roleGuard],
    data: { roles: ['Admin'] },
    children: [
      { path: '', component: AdminDashboardComponent },
      { path: 'profile', component: AdminProfileComponent },
      { path: 'manage-users', component: ManageUsersComponent },
      { path: 'manage-sections', component: ManageSectionsComponent },
      { path: 'school-year-management', component: SchoolYearManagementComponent },
      { path: 'settings', component: SystemSettingsComponent },
      { path: 'reports', component: ViewReportsComponent },
      { path: 'grade-promotion', component: GradePromotionComponent },
      { path: 'emergency-drills', component: EmergencyDrillsComponent },
      { path: 'emergency-drills/:id', component: DrillDetailComponent },
      { path: 'emergency-drills/:id/dashboard', component: DrillDashboardComponent },
      { path: 'emergency-drills/:id/scanner', component: QrScannerComponent }
    ]
  }
];
