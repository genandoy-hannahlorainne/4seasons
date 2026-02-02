import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { Subject, interval, BehaviorSubject } from 'rxjs';
import { takeUntil, switchMap, startWith, tap } from 'rxjs/operators';

interface User {
  user_id: number;
  username: string;
  email: string;
  full_name: string;
  phone: string | null;
  is_active: number;
  created_at: string;
  role_name: string;
  [key: string]: any;
}

interface UsersResponse {
  success: boolean;
  users: {
    student: User[];
    adviser: User[];
    clinic_staff: User[];
    admin: User[];
  };
  totals: {
    students: number;
    advisers: number;
    clinic_staff: number;
    admins: number;
    total: number;
  };
}

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
        <!-- Debug Info (Remove in production) -->
        <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #ffc107;">
          <strong>📊 Current Stats:</strong>
          <div style="margin-top: 10px; font-family: monospace;">
            Total Users: {{ systemStats.totalUsers }} | 
            Students: {{ systemStats.totalStudents }} | 
            Faculty: {{ systemStats.totalAdvisers }} | 
            Clinic Staff: {{ systemStats.totalStaff }}
          </div>
          <div style="margin-top: 10px; font-size: 0.9em; color: #666;">
            Recent Users Count: {{ recentUsers.length }}
          </div>
        </div>

        <!-- Emergency Notifications (if any) -->
        <div class="emergency-banner" *ngIf="emergencyNotifications.length > 0">
          <div class="emergency-header">
            <i class="fa-solid fa-triangle-exclamation"></i>
            <span>{{ emergencyNotifications.length }} Emergency Alert{{ emergencyNotifications.length > 1 ? 's' : '' }}</span>
            <button class="mark-all-read" (click)="markAllNotificationsAsRead()" *ngIf="emergencyNotifications.length > 0">
              Mark All Read
            </button>
          </div>
          <div class="emergency-list">
            <div *ngFor="let notification of emergencyNotifications" class="emergency-item">
              <div class="emergency-content">
                <div class="emergency-message">{{ notification.message }}</div>
                <div class="emergency-meta">
                  <span>{{ notification.student.full_name }} ({{ notification.student.student_number }})</span>
                  <span>{{ notification.timeAgo }}</span>
                </div>
              </div>
              <div class="emergency-actions">
                <button class="emergency-sms" (click)="sendSMSToParent(notification)" title="Send SMS to Parent">
                  <i class="fa-solid fa-message"></i> SMS Parent
                </button>
                <button class="emergency-view" (click)="viewEmergencyDetails(notification)">View</button>
              </div>
            </div>
          </div>
        </div>

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
              <div class="stat-label">Faculty/Advisers</div>
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
              <div *ngIf="activityLog.length === 0" class="no-activity">
                <span>📭</span> No recent activity
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
              <button class="view-all-btn" (click)="navigateTo('/dashboard/admin/manage-users')">View All</button>
            </div>
            <div class="users-table" *ngIf="recentUsers.length > 0">
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
            <div class="no-users" *ngIf="recentUsers.length === 0">
              <span>👤</span> No users registered yet
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

    .emergency-banner {
      background: linear-gradient(135deg, #ff6b6b, #ee5a52);
      color: white;
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 2rem;
      box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3);
      animation: pulse 2s infinite;

      .emergency-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.75rem;
        font-size: 1.1rem;
        font-weight: 700;
        margin-bottom: 1rem;

        i { font-size: 1.25rem; }
        
        .mark-all-read {
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: white;
          padding: 0.4rem 0.8rem;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.85rem;
          font-weight: 500;
          transition: all 0.2s ease;
          &:hover {
            background: rgba(255, 255, 255, 0.3);
            border-color: rgba(255, 255, 255, 0.5);
          }
        }
      }

      .emergency-list {
        .emergency-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 1rem;
          margin-bottom: 0.75rem;
          &:last-child { margin-bottom: 0; }

          .emergency-content {
            flex: 1;
            .emergency-message {
              font-weight: 500;
              margin-bottom: 0.5rem;
              line-height: 1.4;
            }
            .emergency-meta {
              font-size: 0.9rem;
              opacity: 0.9;
              span {
                margin-right: 1rem;
                &:last-child { margin-right: 0; }
              }
            }
          }

          .emergency-actions {
            display: flex;
            gap: 0.5rem;
          }

          .emergency-sms {
            background: rgba(46, 204, 113, 0.2);
            border: 1px solid rgba(46, 204, 113, 0.4);
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 500;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.9rem;
            &:hover {
              background: rgba(46, 204, 113, 0.3);
              border-color: rgba(46, 204, 113, 0.6);
            }
          }

          .emergency-view {
            background: rgba(255, 255, 255, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.3);
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 500;
            transition: all 0.2s ease;
            &:hover {
              background: rgba(255, 255, 255, 0.3);
              border-color: rgba(255, 255, 255, 0.5);
            }
          }
        }
      }
    }

    @keyframes pulse {
      0% { box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3); }
      50% { box-shadow: 0 4px 20px rgba(255, 107, 107, 0.5); }
      100% { box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3); }
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

      .no-activity {
        text-align: center;
        padding: 2rem;
        color: #7f8c8d;
        font-weight: 500;
        span { font-size: 1.5rem; display: block; margin-bottom: 0.5rem; }
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
          &.clinic.staff, &.clinic-staff { background: #ffebee; color: #c62828; }
          &.adviser { background: #f3e5f5; color: #7b1fa2; }
          &.admin { background: #e3f2fd; color: #1976d2; }
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

    .no-users {
      text-align: center;
      padding: 2rem;
      color: #7f8c8d;
      font-weight: 500;
      span { font-size: 1.5rem; display: block; margin-bottom: 0.5rem; }
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
  `]
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  loading = false;
  private destroy$ = new Subject<void>();
  private refreshInterval = 30000; // 30 seconds
  private usersData$ = new BehaviorSubject<UsersResponse | null>(null);

  systemStats = {
    totalUsers: 0,
    totalStudents: 0,
    totalStaff: 0,
    totalAdvisers: 0
  };

  recentUsers: any[] = [];
  systemAlerts: any[] = [];
  activityLog: any[] = [];
  emergencyNotifications: any[] = [];

  constructor(
    private router: Router,
    private adminService: AdminService
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
    
    // Auto-refresh dashboard data every 30 seconds
    interval(this.refreshInterval)
      .pipe(
        startWith(0),
        switchMap(() => this.adminService.getAllUsers()),
        tap(response => this.usersData$.next(response)),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response) => {
          if (response?.success && response.users) {
            this.updateDashboardData(response);
          }
        },
        error: (err) => {
          console.error('Auto-refresh error:', err);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  loadDashboardData(): void {
    this.loading = true;
    console.log('📊 Loading dashboard data...');
    
    // Load users data
    this.adminService.getAllUsers().subscribe({
      next: (response) => {
        console.log('✅ getAllUsers full response:', response);
        console.log('✅ Response success:', response?.success);
        console.log('✅ Response users:', response?.users);
        console.log('✅ Response totals:', response?.totals);
        
        if (response?.success && response.users) {
          this.usersData$.next(response);
          this.updateDashboardData(response);
        } else {
          console.error('❌ Invalid response structure:', response);
          this.loading = false;
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('❌ Error loading users:', err);
        console.error('❌ Error details:', err.error);
        this.loading = false;
      }
    });

    // Load activity logs
    this.adminService.getActivityLogs(5).subscribe({
      next: (response) => {
        console.log('✅ Activity logs response:', response);
        if (response?.success && Array.isArray(response.activities)) {
          this.activityLog = response.activities.slice(0, 5).map((activity: any) => ({
            type: activity.activity_type || 'system',
            action: activity.action || 'Unknown action',
            user: activity.username || activity.full_name || 'System',
            timestamp: this.formatTimestamp(activity.created_at || activity.timestamp)
          }));
        }
      },
      error: (err) => {
        console.error('❌ Error loading activity logs:', err);
      }
    });

    // Load emergency notifications
    this.adminService.getNotifications().subscribe({
      next: (response) => {
        console.log('✅ Admin notifications response:', response);
        if (response?.success && Array.isArray(response.notifications)) {
          this.emergencyNotifications = response.notifications
            .filter((notif: any) => notif.priority === 'urgent')
            .map((notif: any) => ({
              ...notif,
              timeAgo: this.formatTimestamp(notif.created_at)
            }));
        }
      },
      error: (err) => {
        console.error('❌ Error loading admin notifications:', err);
      }
    });
  }

  private updateDashboardData(response: UsersResponse): void {
    console.log('📊 Updating dashboard with response:', response);
    
    // Validate response structure
    if (!response || !response.success || !response.users) {
      console.error('❌ Invalid response structure');
      console.error('❌ Response:', response);
      console.error('❌ Response.success:', response?.success);
      console.error('❌ Response.users:', response?.users);
      return;
    }

    // Safely extract user arrays with defaults
    const students = Array.isArray(response.users.student) ? response.users.student : [];
    const advisers = Array.isArray(response.users.adviser) ? response.users.adviser : [];
    const clinicStaff = Array.isArray(response.users.clinic_staff) ? response.users.clinic_staff : [];
    const admins = Array.isArray(response.users.admin) ? response.users.admin : [];
    
    console.log('📈 Raw user arrays:');
    console.log('   Students:', students);
    console.log('   Advisers:', advisers);
    console.log('   Clinic Staff:', clinicStaff);
    console.log('   Admins:', admins);
    
    // Combine all users
    const allUsers: User[] = [...students, ...advisers, ...clinicStaff, ...admins];
    
    console.log('📈 User counts - Students:', students.length, 'Advisers:', advisers.length, 
                'Clinic Staff:', clinicStaff.length, 'Admins:', admins.length);
    
    // Update statistics - prefer totals from API, fallback to manual count
    if (response.totals) {
      console.log('📊 Using totals from API:', response.totals);
      this.systemStats = {
        totalUsers: response.totals.total || 0,
        totalStudents: response.totals.students || 0,
        totalAdvisers: response.totals.advisers || 0,
        totalStaff: response.totals.clinic_staff || 0
      };
    } else {
      console.log('📊 Calculating totals manually');
      this.systemStats = {
        totalUsers: allUsers.length,
        totalStudents: students.length,
        totalAdvisers: advisers.length,
        totalStaff: clinicStaff.length
      };
    }
    
    console.log('✅ Final stats:', this.systemStats);
    
    // Sort users by registration date (most recent first)
    const sortedUsers = allUsers
      .filter(user => user && user.created_at) // Filter out invalid entries
      .sort((a, b) => {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return dateB - dateA; // Most recent first
      })
      .slice(0, 10); // Take top 10
    
    // Format recent users for display
    this.recentUsers = sortedUsers.map(user => ({
      name: user.full_name || user.username || 'Unknown',
      role: this.formatRoleName(user.role_name || 'Unknown'),
      registeredDate: this.formatDate(user.created_at),
      status: user.is_active === 1 ? 'Active' : 'Inactive'
    }));
    
    console.log('✅ Recent users updated:', this.recentUsers.length, 'users');
    console.log('✅ Recent users:', this.recentUsers);
  }

  private formatRoleName(roleName: string): string {
    // Convert role names to proper format
    const roleMap: { [key: string]: string } = {
      'student': 'Student',
      'adviser': 'Faculty/Adviser',
      'clinic staff': 'Clinic Staff',
      'admin': 'Admin'
    };
    
    return roleMap[roleName.toLowerCase()] || roleName;
  }

  private formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'N/A';
      }
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit' 
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'N/A';
    }
  }

  private formatTimestamp(timestamp: string): string {
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        return 'Unknown';
      }
      
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
    } catch (error) {
      console.error('Error formatting timestamp:', error);
      return 'Unknown';
    }
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

  viewEmergencyDetails(notification: any): void {
    // Navigate to detailed view or show modal
    console.log('Viewing emergency details:', notification);
    
    // Create a detailed modal or alert
    const details = `
Emergency Details:

Student: ${notification.student.full_name}
Student Number: ${notification.student.student_number}
Grade & Section: ${notification.student.grade_section}
Complaint: ${notification.visit.chief_complaint}
Visit Status: ${notification.visit.status}
Time: ${notification.timeAgo}

Staff: ${notification.staff.name || 'N/A'}
Position: ${notification.staff.position || 'N/A'}
    `.trim();
    
    if (confirm(details + '\n\nMark this notification as read?')) {
      this.markNotificationAsRead(notification.notification_id);
    }
  }

  markNotificationAsRead(notificationId: number): void {
    this.adminService.markNotificationAsRead(notificationId).subscribe({
      next: (response) => {
        if (response.success) {
          // Remove from emergency notifications
          this.emergencyNotifications = this.emergencyNotifications.filter(
            n => n.notification_id !== notificationId
          );
        }
      },
      error: (err) => {
        console.error('Failed to mark notification as read:', err);
      }
    });
  }

  markAllNotificationsAsRead(): void {
    if (this.emergencyNotifications.length === 0) return;
    
    if (confirm(`Mark all ${this.emergencyNotifications.length} emergency notifications as read?`)) {
      this.adminService.markAllNotificationsAsRead().subscribe({
        next: (response) => {
          if (response.success) {
            this.emergencyNotifications = [];
          }
        },
        error: (err) => {
          console.error('Failed to mark all notifications as read:', err);
        }
      });
    }
  }

  sendSMSToParent(notification: any): void {
    const studentName = notification.student?.full_name || 'the student';
    
    if (confirm(`Send SMS notification to ${studentName}'s parent/guardian about this emergency visit?`)) {
      this.adminService.sendParentSMS(notification.visit_id).subscribe({
        next: (response) => {
          if (response.success) {
            alert(`SMS sent successfully to ${response.phone}\n\nMessage: ${response.sms_message}`);
          } else {
            alert('Failed to send SMS: ' + response.message);
          }
        },
        error: (err) => {
          console.error('Failed to send SMS:', err);
          alert('Failed to send SMS. ' + (err.error?.message || 'Please try again.'));
        }
      });
    }
  }
}