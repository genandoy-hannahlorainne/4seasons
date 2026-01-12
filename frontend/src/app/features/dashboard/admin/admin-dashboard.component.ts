import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { AdminService } from '../../../core/services/admin.service';
import { ManageUsersComponent } from './manage-users/manage-users.component';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="admin-dashboard">
      <div class="dashboard-header">
        <h1>Admin Dashboard</h1>
        <p>System overview and management</p>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading dashboard...</p>
      </div>

      <div class="dashboard-content" *ngIf="!loading">
        <!-- Statistics Cards -->
        <div class="stats-grid">
          <div class="stat-card users">
            <div class="stat-icon"><i class="fa-solid fa-users"></i></div>
            <div class="stat-info">
              <div class="stat-value">{{ systemStats.totalUsers }}</div>
              <div class="stat-label">Total Users</div>
            </div>
          </div>
          <div class="stat-card students">
            <div class="stat-icon"><i class="fa-solid fa-graduation-cap"></i></div>
            <div class="stat-info">
              <div class="stat-value">{{ systemStats.totalStudents }}</div>
              <div class="stat-label">Students</div>
            </div>
          </div>
          <div class="stat-card faculty">
            <div class="stat-icon"><i class="fa-solid fa-chalkboard-user"></i></div>
            <div class="stat-info">
              <div class="stat-value">{{ systemStats.totalAdvisers }}</div>
              <div class="stat-label">Faculty</div>
            </div>
          </div>
          <div class="stat-card staff">
            <div class="stat-icon"><i class="fa-solid fa-notes-medical"></i></div>
            <div class="stat-info">
              <div class="stat-value">{{ systemStats.totalStaff }}</div>
              <div class="stat-label">Clinic Staff</div>
            </div>
          </div>
        </div>

        <!-- Main Content Grid -->
        <div class="content-grid">
          <!-- System Activity -->
          <div class="card activity-card">
            <div class="card-header">
              <h2>System Activity</h2>
              <span class="badge">Live</span>
            </div>
            <div class="activity-list">
              <div *ngFor="let activity of activityLog" class="activity-item">
                <div class="activity-icon" [ngClass]="activity.type">
                  <i [ngClass]="getActivityIconClass(activity.type)"></i>
                </div>
                <div class="activity-details">
                  <div class="activity-action">{{ activity.action }}</div>
                  <div class="activity-meta">
                    <span class="activity-user">{{ activity.user }}</span>
                    <span class="activity-time">{{ activity.timestamp }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Alerts & Warnings -->
          <div class="card alerts-card">
            <div class="card-header">
              <h2>Alerts & Warnings</h2>
              <span class="alert-count" *ngIf="systemAlerts.length > 0">{{ systemAlerts.length }}</span>
            </div>
            <div class="alerts-list">
              <div *ngFor="let alert of systemAlerts" class="alert-item" [ngClass]="alert.type">
                <div class="alert-icon">
                  <i [ngClass]="getAlertIconClass(alert.type)"></i>
                </div>
                <div class="alert-content">
                  <div class="alert-message">{{ alert.message }}</div>
                  <div class="alert-date">{{ alert.date }}</div>
                </div>
                <button class="alert-dismiss" (click)="dismissAlert(alert)">×</button>
              </div>
              <div *ngIf="systemAlerts.length === 0" class="no-alerts">
                <span><i class="fa-solid fa-check"></i></span> No active alerts
              </div>
            </div>
          </div>

          <!-- Recent Users -->
          <div class="card users-card">
            <div class="card-header">
              <h2>Recent Users</h2>
              <button class="view-all-btn">View All</button>
            </div>
            <div class="users-table">
              <div class="table-header">
                <span>Name</span>
                <span>Role</span>
                <span>Registered</span>
                <span>Status</span>
              </div>
              <div *ngFor="let user of recentUsers" class="table-row">
                <span class="user-name">{{ user.name }}</span>
                <span class="user-role">
                  <span class="role-badge" [ngClass]="user.role.toLowerCase()">{{ user.role }}</span>
                </span>
                <span class="user-date">{{ user.registeredDate }}</span>
                <span class="user-status">
                  <span class="status-dot" [ngClass]="user.status.toLowerCase()"></span>
                  {{ user.status }}
                </span>
              </div>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="card actions-card">
            <div class="card-header">
              <h2>Quick Actions</h2>
            </div>
            <div class="actions-grid">
              <button class="action-btn" (click)="navigateTo('/dashboard/admin/manage-users')">
                <span class="action-icon"><i class="fa-solid fa-users-gear"></i></span>
                <span class="action-label">Manage Users</span>
              </button>
              <button class="action-btn" (click)="navigateTo('/dashboard/admin/settings')">
                <span class="action-icon"><i class="fa-solid fa-gear"></i></span>
                <span class="action-label">System Settings</span>
              </button>
              <button class="action-btn" (click)="navigateTo('/dashboard/admin/reports')">
                <span class="action-icon"><i class="fa-solid fa-chart-column"></i></span>
                <span class="action-label">View Reports</span>
              </button>
              <button class="action-btn" (click)="navigateTo('/dashboard/admin/backup-recovery')">
                <span class="action-icon"><i class="fa-solid fa-database"></i></span>
                <span class="action-label">Database Backup</span>
              </button>
              <button class="action-btn" (click)="navigateTo('/dashboard/admin/audit-logs')">
                <span class="action-icon"><i class="fa-solid fa-clipboard-list"></i></span>
                <span class="action-label">Audit Logs</span>
              </button>
              <button class="action-btn" (click)="navigateTo('/dashboard/admin/security')">
                <span class="action-icon"><i class="fa-solid fa-shield-halved"></i></span>
                <span class="action-label">Security</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-dashboard {
      padding: 2rem;
      background: #f5f7fa;
      min-height: 100vh;
    }

    .dashboard-header {
      margin-bottom: 2rem;
      background: white;
      padding: 1.5rem;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

      h1 { font-size: 2rem; color: #2c3e50; margin-bottom: 0.5rem; font-weight: 700; }
      p { color: #7f8c8d; font-size: 1.1rem; margin: 0; }
    }

    .loading-state {
      text-align: center;
      padding: 3rem;
      background: white;
      border-radius: 12px;
      
      .spinner {
        width: 50px;
        height: 50px;
        margin: 0 auto 1rem;
        border: 4px solid #f3f3f3;
        border-top: 4px solid #2c3e50;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
      
      p { color: #7f8c8d; }
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .stat-card {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      display: flex;
      align-items: center;
      gap: 1rem;
      border-left: 4px solid;

      &.users { border-color: #3498db; }
      &.students { border-color: #2ecc71; }
      &.faculty { border-color: #9b59b6; }
      &.staff { border-color: #e74c3c; }

      .stat-icon {
        font-size: 2.5rem;
        opacity: 0.9;
      }

      .stat-info {
        .stat-value {
          font-size: 2rem;
          font-weight: 700;
          color: #2c3e50;
        }
        .stat-label {
          color: #7f8c8d;
          font-size: 0.9rem;
        }
      }
    }

    .content-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
    }

    .card {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid #e9ecef;

        h2 { font-size: 1.2rem; color: #2c3e50; margin: 0; font-weight: 700; }

        .badge {
          background: #2ecc71;
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .alert-count {
          background: #e74c3c;
          color: white;
          padding: 0.25rem 0.6rem;
          border-radius: 50%;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .view-all-btn {
          background: none;
          border: 1px solid #3498db;
          color: #3498db;
          padding: 0.4rem 1rem;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.85rem;
          transition: all 0.2s ease;
          &:hover { background: #3498db; color: white; }
        }
      }
    }

    .activity-list {
      .activity-item {
        display: flex;
        align-items: flex-start;
        gap: 1rem;
        padding: 0.75rem 0;
        border-bottom: 1px solid #f1f3f4;
        &:last-child { border-bottom: none; }

        .activity-icon {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
          
          &.user { background: #e3f2fd; }
          &.record { background: #e8f5e9; }
          &.report { background: #fff3e0; }
          &.system { background: #f3e5f5; }
        }

        .activity-details {
          flex: 1;
          .activity-action { font-weight: 500; color: #2c3e50; margin-bottom: 0.25rem; }
          .activity-meta {
            font-size: 0.85rem;
            color: #7f8c8d;
            .activity-user { margin-right: 1rem; }
          }
        }
      }
    }

    .alerts-list {
      .alert-item {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1rem;
        border-radius: 8px;
        margin-bottom: 0.75rem;

        &.warning { background: #fff8e1; border-left: 4px solid #ffc107; }
        &.info { background: #e3f2fd; border-left: 4px solid #2196f3; }
        &.error { background: #ffebee; border-left: 4px solid #f44336; }

        .alert-icon { font-size: 1.25rem; }
        .alert-content {
          flex: 1;
          .alert-message { font-weight: 500; color: #2c3e50; }
          .alert-date { font-size: 0.85rem; color: #7f8c8d; }
        }
        .alert-dismiss {
          background: none;
          border: none;
          font-size: 1.25rem;
          color: #7f8c8d;
          cursor: pointer;
          &:hover { color: #2c3e50; }
        }
      }

      .no-alerts {
        text-align: center;
        padding: 2rem;
        color: #2ecc71;
        font-weight: 500;
        span { font-size: 1.5rem; display: block; margin-bottom: 0.5rem; }
      }
    }

    .users-table {
      .table-header, .table-row {
        display: grid;
        grid-template-columns: 2fr 1fr 1fr 1fr;
        gap: 1rem;
        padding: 0.75rem 0;
      }

      .table-header {
        font-weight: 600;
        color: #7f8c8d;
        font-size: 0.85rem;
        border-bottom: 2px solid #e9ecef;
      }

      .table-row {
        border-bottom: 1px solid #f1f3f4;
        align-items: center;
        &:last-child { border-bottom: none; }

        .user-name { font-weight: 500; color: #2c3e50; }
        
        .role-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 500;
          
          &.student { background: #e8f5e9; color: #2e7d32; }
          &.staff { background: #ffebee; color: #c62828; }
          &.adviser { background: #f3e5f5; color: #7b1fa2; }
        }

        .user-date { color: #7f8c8d; font-size: 0.9rem; }

        .user-status {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          
          .status-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            &.active { background: #2ecc71; }
            &.inactive { background: #e74c3c; }
          }
        }
      }
    }

    .actions-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;

      .action-btn {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.5rem;
        padding: 1.25rem;
        background: #f8f9fa;
        border: 1px solid #e9ecef;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
          background: #2c3e50;
          color: white;
          border-color: #2c3e50;
        }

        .action-icon { font-size: 1.5rem; }
        .action-label { font-size: 0.85rem; font-weight: 500; }
      }
    }

    @media (max-width: 1200px) {
      .stats-grid { grid-template-columns: repeat(2, 1fr); }
      .content-grid { grid-template-columns: 1fr; }
    }

    @media (max-width: 768px) {
      .admin-dashboard { padding: 1rem; }
      .stats-grid { grid-template-columns: 1fr; }
      .actions-grid { grid-template-columns: repeat(2, 1fr); }
      .users-table .table-header, .users-table .table-row {
        grid-template-columns: 1fr 1fr;
        .user-date, .user-status { display: none; }
      }
    }

    /* Modal Styles */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-content {
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
      max-width: 400px;
      width: 90%;
      position: relative;

      .close-btn {
        position: absolute;
        top: 1rem;
        right: 1rem;
        background: none;
        border: none;
        font-size: 1.5rem;
        color: #7f8c8d;
        cursor: pointer;
        transition: color 0.2s ease;

        &:hover { color: #2c3e50; }
      }

      .modal-header {
        padding: 1.5rem;
        border-bottom: 1px solid #e9ecef;

        h2 {
          margin: 0;
          color: #2c3e50;
          font-size: 1.3rem;
          font-weight: 700;
        }
      }

      .modal-body {
        padding: 1.5rem;

        p {
          color: #2c3e50;
          margin-bottom: 1rem;

          &.backup-info {
            color: #7f8c8d;
            font-size: 0.9rem;
          }
        }
      }

      .modal-actions {
        padding: 1.5rem;
        border-top: 1px solid #e9ecef;
        display: flex;
        gap: 0.75rem;

        .btn {
          flex: 1;
          padding: 0.75rem 1rem;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 0.95rem;

          &.btn-primary {
            background: #3498db;
            color: white;

            &:hover { background: #2980b9; }
          }

          &.btn-outline {
            background: #f8f9fa;
            color: #2c3e50;
            border: 1px solid #e9ecef;

            &:hover { background: #e9ecef; }
          }
        }
      }
    }
  `]
})
export class AdminDashboardComponent implements OnInit {
  loading = false;

  systemStats = {
    totalUsers: 450,
    totalStudents: 380,
    totalStaff: 25,
    totalAdvisers: 45
  };

  recentUsers: any[] = [];

  systemAlerts: any[] = [];

  activityLog: any[] = [];

  constructor(
    private authService: AuthService,
    private router: Router,
    private adminService: AdminService
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  loadDashboardData(): void {
    this.loading = true;
    
    // Fetch all users
    this.adminService.getAllUsers().subscribe({
      next: (response) => {
        if (response.success) {
          // Combine all users and get the most recent ones
          const allUsers: any[] = [
            ...response.users.student,
            ...response.users.adviser,
            ...response.users.clinic_staff
          ];
          
          // Sort by created_at (most recent first) and take top 10
          const sortedUsers = allUsers
            .sort((a, b) => {
              const dateA = new Date(a.created_at || 0).getTime();
              const dateB = new Date(b.created_at || 0).getTime();
              return dateB - dateA;
            })
            .slice(0, 10);
          
          // Format for display
          this.recentUsers = sortedUsers.map((user: any) => ({
            name: user.full_name || user.username,
            role: user.role.charAt(0).toUpperCase() + user.role.slice(1),
            registeredDate: user.created_at 
              ? new Date(user.created_at).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: '2-digit', 
                  day: '2-digit' 
                })
              : 'N/A',
            status: user.is_active ? 'Active' : 'Inactive'
          }));
          
          // Update stats
          this.systemStats = {
            totalUsers: response.totals.total,
            totalStudents: response.totals.students,
            totalAdvisers: response.totals.advisers,
            totalStaff: response.totals.clinic_staff
          };
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading users:', err);
        this.loading = false;
      }
    });

    // Fetch activity logs
    this.adminService.getActivityLogs(3).subscribe({
      next: (response) => {
        if (response.success && response.activities) {
          this.activityLog = response.activities.slice(0, 3).map((activity: any) => ({
            type: activity.type,
            action: activity.action,
            user: activity.user,
            timestamp: this.formatTimestamp(activity.timestamp)
          }));
        }
      },
      error: (err) => {
        console.error('Error loading activity logs:', err);
      }
    });
  }

  formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  getActivityIconClass(type: string): string {
    const icons: { [key: string]: string } = {
      user: 'fa-solid fa-user',
      record: 'fa-solid fa-file-medical',
      report: 'fa-solid fa-chart-column',
      system: 'fa-solid fa-gear'
    };
    return icons[type] || 'fa-solid fa-circle-info';
  }

  getAlertIconClass(type: string): string {
    const icons: { [key: string]: string } = {
      warning: 'fa-solid fa-triangle-exclamation',
      info: 'fa-solid fa-circle-info',
      error: 'fa-solid fa-circle-xmark'
    };
    return icons[type] || 'fa-solid fa-bell';
  }

  dismissAlert(alert: any): void {
    const index = this.systemAlerts.indexOf(alert);
    if (index > -1) {
      this.systemAlerts.splice(index, 1);
    }
  }
}
