import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-dashboard-test',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div style="padding: 2rem; background: #f5f7fa; min-height: 100vh;">
      <h1>Admin Dashboard Test</h1>
      
      <div style="background: white; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
        <h2>API Response:</h2>
        <pre>{{ apiResponse | json }}</pre>
      </div>

      <div style="background: white; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
        <h2>System Stats:</h2>
        <pre>{{ systemStats | json }}</pre>
      </div>

      <div style="background: white; padding: 1rem; border-radius: 8px;">
        <h2>Recent Users:</h2>
        <pre>{{ recentUsers | json }}</pre>
      </div>
    </div>
  `
})
export class AdminDashboardTestComponent implements OnInit {
  apiResponse: any = null;
  systemStats: any = null;
  recentUsers: any[] = [];

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    console.log('Test component initialized');
    this.loadData();
  }

  loadData(): void {
    console.log('Calling getAllUsers...');
    this.adminService.getAllUsers().subscribe({
      next: (response) => {
        console.log('API Response received:', response);
        this.apiResponse = response;

        if (response.success && response.users) {
          const allUsers: any[] = [
            ...(response.users.student || []),
            ...(response.users.adviser || []),
            ...(response.users.clinic_staff || []),
            ...(response.users.admin || [])
          ];

          this.recentUsers = allUsers.slice(0, 10);

          if (response.totals) {
            this.systemStats = {
              totalUsers: response.totals.total || 0,
              totalStudents: response.totals.students || 0,
              totalAdvisers: response.totals.advisers || 0,
              totalStaff: response.totals.clinic_staff || 0
            };
          }

          console.log('Stats updated:', this.systemStats);
        }
      },
      error: (err) => {
        console.error('Error loading users:', err);
        this.apiResponse = { error: err.message, details: err };
      }
    });
  }
}
