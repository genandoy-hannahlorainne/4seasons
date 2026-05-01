import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { AuthService } from '../../../core/services/auth.service';
import { Subject, interval, BehaviorSubject } from 'rxjs';
import { takeUntil, switchMap, startWith, tap } from 'rxjs/operators';
import { HealthRiskVisualizationComponent } from './health-risk-visualization/health-risk-visualization.component';

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

// Admin Dashboard Component - Updated with PDMHS blue branding
@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, HealthRiskVisualizationComponent],
  styleUrls: ['./admin-dashboard.component.scss'],
  template: `
    <div class="admin-dashboard">
      <!-- Hero Section -->
      <div class="hero-section">
        <div class="hero-content">
          <div class="hero-text">
            <h1>Welcome to PDMHS Admin Dashboard</h1>
            <p>Manage your school's medical records system efficiently and securely</p>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading dashboard...</p>
      </div>

      <div class="dashboard-content" *ngIf="!loading">
        <!-- Password Change Requests -->
        <div class="password-requests-banner" *ngIf="passwordChangeRequests.length > 0">
          <div class="requests-header">
            <i class="fa-solid fa-key"></i>
            <span>{{ passwordChangeRequests.length }} Password Change Request{{ passwordChangeRequests.length > 1 ? 's' : '' }}</span>
          </div>
          <div class="requests-list">
            <div *ngFor="let request of passwordChangeRequests" class="request-item">
              <div class="request-content">
                <div class="request-message">
                  <strong>{{ request.request_data?.full_name }}</strong> ({{ request.request_data?.role }})
                </div>
                <div class="request-reason">{{ request.request_data?.reason }}</div>
                <div class="request-meta">
                  <span>Username: {{ request.request_data?.username }}</span>
                  <span>{{ request.timeAgo }}</span>
                </div>
              </div>
              <div class="request-actions">
                <button class="btn-approve" (click)="approvePasswordChange(request)" title="Approve & Reset Password">
                  <i class="fa-solid fa-check"></i> Approve
                </button>
                <button class="btn-dismiss" (click)="dismissPasswordChange(request)" title="Dismiss Request">
                  <i class="fa-solid fa-times"></i> Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Emergency Drill Alerts -->
        <div class="drill-alerts-banner" *ngIf="drillAlerts.length > 0">
          <div class="drill-header">
            <i class="fa-solid fa-bell"></i>
            <span>{{ drillAlerts.length }} Emergency Drill Alert{{ drillAlerts.length > 1 ? 's' : '' }}</span>
            <button class="mark-all-read" (click)="markAllNotificationsAsRead()">
              Mark All Read
            </button>
          </div>
          <div class="drill-list">
            <div *ngFor="let alert of drillAlerts" class="drill-item">
              <div class="drill-content">
                <div class="drill-message">{{ alert.message }}</div>
                <div class="drill-meta">
                  <span><strong>{{ alert.request_data?.drill_name }}</strong> ({{ alert.request_data?.drill_type }})</span>
                  <span>{{ alert.timeAgo }}</span>
                </div>
              </div>
              <div class="drill-actions">
                <button class="drill-view" (click)="viewDrillDashboard(alert.request_data?.drill_id)">
                  <i class="fa-solid fa-chart-line"></i> View Dashboard
                </button>
              </div>
            </div>
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

        <!-- Notification History -->
        <div class="notification-history" *ngIf="notificationHistory.length > 0">
          <div class="history-header">
            <h2><i class="fa-solid fa-clock-rotate-left"></i> Recent Notifications</h2>
            <span class="history-count">{{ notificationHistory.length }} notification{{ notificationHistory.length > 1 ? 's' : '' }}</span>
          </div>
          <div class="history-list">
            <div *ngFor="let notification of notificationHistory" class="history-item" [ngClass]="notification.priority">
              <div class="history-icon">
                <i class="fa-solid" [ngClass]="getNotificationIcon(notification)"></i>
              </div>
              <div class="history-content">
                <div class="history-message">{{ notification.message }}</div>
                <div class="history-meta">
                  <span class="history-student" *ngIf="notification.student">{{ notification.student?.full_name }} ({{ notification.student?.student_number }})</span>
                  <span class="history-user" *ngIf="notification.user && !notification.student">{{ notification.user?.full_name }} ({{ notification.user?.role }})</span>
                  <span class="history-time">{{ notification.timeAgo }}</span>
                  <span class="history-status" [ngClass]="notification.status.toLowerCase()">{{ notification.status }}</span>
                </div>
              </div>
              <button class="history-view" (click)="viewNotificationDetails(notification)" title="View Details">
                <i class="fa-solid fa-eye"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- Statistics Cards -->
        <div class="stats-grid">
          <div class="stat-card users">
            <div class="stat-icon"><img src="assets/icons/total-users.png" alt="Total Users" class="stat-icon-img"></div>
            <div class="stat-info">
              <div class="stat-value">{{ systemStats.totalUsers }}</div>
              <div class="stat-label">Total Users</div>
            </div>
          </div>
          <div class="stat-card students">
            <div class="stat-icon"><img src="assets/icons/student.png" alt="Students" class="stat-icon-img"></div>
            <div class="stat-info">
              <div class="stat-value">{{ systemStats.totalStudents }}</div>
              <div class="stat-label">Students</div>
            </div>
          </div>
          <div class="stat-card faculty">
            <div class="stat-icon"><img src="assets/icons/adviser-faculty.png" alt="Faculty/Advisers" class="stat-icon-img"></div>
            <div class="stat-info">
              <div class="stat-value">{{ systemStats.totalAdvisers }}</div>
              <div class="stat-label">Faculty/Advisers</div>
            </div>
          </div>
          <div class="stat-card staff">
            <div class="stat-icon"><img src="assets/icons/clinic-staff.png" alt="Clinic Staff" class="stat-icon-img"></div>
            <div class="stat-info">
              <div class="stat-value">{{ systemStats.totalStaff }}</div>
              <div class="stat-label">Clinic Staff</div>
            </div>
          </div>
        </div>

        <!-- Health Risk Visualization -->
        <app-health-risk-visualization></app-health-risk-visualization>

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
                <i class="fa-solid fa-inbox"></i>
                <p>No recent activity</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Password Change Modal -->
      <div class="modal-overlay" *ngIf="showPasswordChangeModal" (click)="closePasswordChangeModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3><i class="fa-solid fa-key"></i> Password Change Request</h3>
            <button class="modal-close" (click)="closePasswordChangeModal()">
              <i class="fa-solid fa-times"></i>
            </button>
          </div>

          <div class="modal-body" *ngIf="selectedPasswordRequest">
            <div class="request-details">
              <div class="detail-row">
                <span class="detail-label">Name:</span>
                <span class="detail-value">{{ selectedPasswordRequest.request_data?.full_name }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Role:</span>
                <span class="detail-value role-badge">{{ selectedPasswordRequest.request_data?.role }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Username:</span>
                <span class="detail-value">{{ selectedPasswordRequest.request_data?.username }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Reason:</span>
                <span class="detail-value reason-text">{{ selectedPasswordRequest.request_data?.reason }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Requested:</span>
                <span class="detail-value">{{ selectedPasswordRequest.timeAgo }}</span>
              </div>
            </div>

            <div class="modal-info">
              <i class="fa-solid fa-circle-info"></i>
              <p>Approving this request will generate a temporary password and require the user to change it on next login.</p>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn-modal-dismiss" (click)="dismissPasswordChange(selectedPasswordRequest)">
              <i class="fa-solid fa-times"></i> Dismiss
            </button>
            <button class="btn-modal-approve" (click)="confirmApprovePasswordChange()">
              <i class="fa-solid fa-check"></i> Approve & Reset Password
            </button>
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
        border: 4px solid #e8f0f8;
        border-top: 4px solid #052355;
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

    .password-requests-banner {
      background: linear-gradient(135deg, #f39c12, #e67e22);
      color: white;
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 2rem;
      box-shadow: 0 4px 12px rgba(243, 156, 18, 0.3);

      .requests-header {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        font-size: 1.1rem;
        font-weight: 700;
        margin-bottom: 1rem;
        i { font-size: 1.25rem; }
      }

      .requests-list {
        .request-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 1rem;
          margin-bottom: 0.75rem;
          &:last-child { margin-bottom: 0; }

          .request-content {
            flex: 1;
            .request-message {
              font-weight: 500;
              margin-bottom: 0.5rem;
            }
            .request-reason {
              font-size: 0.9rem;
              opacity: 0.9;
              margin-bottom: 0.5rem;
              font-style: italic;
            }
            .request-meta {
              font-size: 0.85rem;
              opacity: 0.85;
              span {
                margin-right: 1rem;
                &:last-child { margin-right: 0; }
              }
            }
          }

          .request-actions {
            display: flex;
            gap: 0.5rem;

            .btn-approve {
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
              &:hover {
                background: rgba(46, 204, 113, 0.3);
                border-color: rgba(46, 204, 113, 0.6);
              }
            }

            .btn-dismiss {
              background: rgba(231, 76, 60, 0.2);
              border: 1px solid rgba(231, 76, 60, 0.4);
              color: white;
              padding: 0.5rem 1rem;
              border-radius: 6px;
              cursor: pointer;
              font-weight: 500;
              transition: all 0.2s ease;
              display: flex;
              align-items: center;
              gap: 0.5rem;
              &:hover {
                background: rgba(231, 76, 60, 0.3);
                border-color: rgba(231, 76, 60, 0.6);
              }
            }
          }
        }
      }
    }

    .drill-alerts-banner {
      background: linear-gradient(135deg, #3498db, #2980b9);
      color: white;
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 2rem;
      box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);

      .drill-header {
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

      .drill-list {
        .drill-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          padding: 1rem;
          margin-bottom: 0.75rem;
          &:last-child { margin-bottom: 0; }

          .drill-content {
            flex: 1;
            .drill-message {
              font-weight: 500;
              margin-bottom: 0.5rem;
            }
            .drill-meta {
              font-size: 0.9rem;
              opacity: 0.9;
              span {
                margin-right: 1rem;
                &:last-child { margin-right: 0; }
              }
            }
          }

          .drill-actions {
            .drill-view {
              background: rgba(255, 255, 255, 0.2);
              border: 1px solid rgba(255, 255, 255, 0.3);
              color: white;
              padding: 0.5rem 1rem;
              border-radius: 6px;
              cursor: pointer;
              font-weight: 500;
              transition: all 0.2s ease;
              display: flex;
              align-items: center;
              gap: 0.5rem;
              &:hover {
                background: rgba(255, 255, 255, 0.3);
                border-color: rgba(255, 255, 255, 0.5);
              }
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

    .notification-history {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 2rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

      .history-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
        padding-bottom: 1rem;
        border-bottom: 2px solid #e9ecef;

        h2 {
          font-size: 1.2rem;
          color: #2c3e50;
          margin: 0;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 0.5rem;

          i { color: #3498db; }
        }

        .history-count {
          background: #e3f2fd;
          color: #1976d2;
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 600;
        }
      }

      .history-list {
        .history-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 0.75rem;
          border-left: 4px solid;
          transition: all 0.2s ease;

          &.urgent {
            background: #fff5f5;
            border-color: #e74c3c;
          }

          &.normal {
            background: #f8f9fa;
            border-color: #3498db;
          }

          &:hover {
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            transform: translateX(4px);
          }

          .history-icon {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.1rem;
            flex-shrink: 0;
          }

          &.urgent .history-icon {
            background: #ffebee;
            color: #e74c3c;
          }

          &.normal .history-icon {
            background: #e3f2fd;
            color: #3498db;
          }

          .history-content {
            flex: 1;

            .history-message {
              font-weight: 500;
              color: #2c3e50;
              margin-bottom: 0.5rem;
              line-height: 1.4;
            }

            .history-meta {
              display: flex;
              flex-wrap: wrap;
              gap: 1rem;
              font-size: 0.85rem;
              color: #7f8c8d;

              .history-student {
                font-weight: 500;
                color: #34495e;
              }

              .history-time {
                color: #95a5a6;
              }

              .history-status {
                padding: 0.2rem 0.6rem;
                border-radius: 12px;
                font-weight: 600;
                font-size: 0.75rem;

                &.pending {
                  background: #fff3cd;
                  color: #856404;
                }

                &.read {
                  background: #d4edda;
                  color: #155724;
                }

                &.sent {
                  background: #d1ecf1;
                  color: #0c5460;
                }
              }
            }
          }

          .history-view {
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            color: #495057;
            padding: 0.5rem 0.75rem;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.2s ease;
            flex-shrink: 0;

            &:hover {
              background: #3498db;
              color: white;
              border-color: #3498db;
            }

            i { font-size: 1rem; }
          }
        }
      }
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
          background: linear-gradient(135deg, #052355 0%, #5381b2 100%);
          border: none;
          color: #ffffff;
          padding: 0.5rem 1.2rem;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.85rem;
          font-weight: 600;
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(5, 35, 85, 0.2);

          &:hover {
            background: linear-gradient(135deg, #041d44 0%, #4270a1 100%);
            box-shadow: 0 4px 12px rgba(5, 35, 85, 0.3);
            transform: translateY(-2px);
          }
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

  activityLog: any[] = [];
  emergencyNotifications: any[] = [];
  notificationHistory: any[] = [];
  passwordChangeRequests: any[] = [];
  drillAlerts: any[] = [];

  // Modal state
  showPasswordChangeModal = false;
  selectedPasswordRequest: any = null;

  constructor(
    private router: Router,
    private adminService: AdminService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Enhanced authentication check
    if (!this.authService.checkAuthenticationStatus()) {
      alert('Please login as admin to access the admin panel');
      this.router.navigate(['/login']);
      return;
    }

    const currentUser = this.authService.currentUserValue;
    // Authentication verified for admin dashboard

    if (currentUser?.role_name?.toLowerCase() !== 'admin') {
      alert('Access denied. Admin privileges required.');
      this.router.navigate(['/dashboard']);
      return;
    }

    // Authenticated as admin, loading dashboard
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
          if (response?.success && response.data?.users) {
            // Data updated via BehaviorSubject
          }
        },
        error: (err) => {
          // Auto-refresh error
          if (err.status === 401) {
            alert('Session expired. Please login again.');
            this.router.navigate(['/login']);
          }
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
    // Loading dashboard data

    // Load dashboard statistics first
    this.adminService.getDashboard().subscribe({
      next: (response) => {
        // Dashboard response received
        if (response?.success && response.data) {
          const dashboardData = response.data;

          // Update system stats from dashboard API
          if (dashboardData.current_stats) {
            this.systemStats = {
              totalUsers: dashboardData.current_stats.total_users || 0,
              totalStudents: dashboardData.current_stats.students || 0,
              totalAdvisers: dashboardData.current_stats.faculty || 0,
              totalStaff: dashboardData.current_stats.clinic_staff || 0
            };
            // Updated system stats from dashboard
          }
        }
      },
      error: (err) => {
        // Error loading dashboard
      }
    });

    // Load users data for recent users display
    this.adminService.getAllUsers().subscribe({
      next: (response) => {
        // getAllUsers response received
        if (response?.success && response.data?.users) {
          this.usersData$.next(response);
        } else {
          // Invalid response structure
        }
        this.loading = false;
      },
      error: (err) => {
        // Error loading users
        this.loading = false;
      }
    });

    // Load activity logs
    this.adminService.getActivityLogs(5).subscribe({
      next: (response) => {
        // Activity logs response received
        if (response?.success && Array.isArray(response.data?.activities)) {
          this.activityLog = response.data.activities.slice(0, 5).map((activity: any) => ({
            type: activity?.activity_type || 'system',
            action: activity?.action || 'Unknown action',
            user: activity?.username || activity?.full_name || 'System',
            timestamp: this.formatTimestamp(activity?.created_at || activity?.timestamp || '')
          }));
        } else if (response?.success && Array.isArray(response.activities)) {
          this.activityLog = response.activities.slice(0, 5).map((activity: any) => ({
            type: activity?.activity_type || 'system',
            action: activity?.action || 'Unknown action',
            user: activity?.username || activity?.full_name || 'System',
            timestamp: this.formatTimestamp(activity?.created_at || activity?.timestamp || '')
          }));
        }
      },
      error: (err) => {
        // Error loading activity logs
      }
    });

    // Load emergency notifications
    this.adminService.getNotifications().subscribe({
      next: (response) => {
        // Admin notifications response received
        if (response?.success && Array.isArray(response.data?.notifications)) {
          const allNotifications = response.data.notifications.map((notif: any) => {
            return {
              ...notif,
              timeAgo: this.formatTimestamp(notif?.created_at || '')
            };
          });

          // Password change requests (pending)
          this.passwordChangeRequests = allNotifications.filter(
            (notif: any) => notif?.notification_type === 'password_change_request' && notif?.status === 'Pending'
          );

          // Emergency drill alerts (pending)
          this.drillAlerts = allNotifications.filter(
            (notif: any) => notif?.notification_type === 'emergency_drill_alert' && notif?.status === 'Pending'
          );

          // Medical emergency notifications (urgent + pending + has visit_id)
          this.emergencyNotifications = allNotifications.filter(
            (notif: any) => notif?.priority === 'urgent' && notif?.status === 'Pending' && notif?.visit_id
          );

          // Notification history (all read/sent notifications, or normal priority)
          this.notificationHistory = allNotifications.filter(
            (notif: any) => notif?.status !== 'Pending' || notif?.priority === 'normal'
          ).slice(0, 10); // Show last 10

          // Notifications categorized
        } else if (response?.success && Array.isArray(response.notifications)) {
          // Fallback for direct notifications array
          const allNotifications = response.notifications.map((notif: any) => {
            return {
              ...notif,
              timeAgo: this.formatTimestamp(notif?.created_at || '')
            };
          });

          this.passwordChangeRequests = allNotifications.filter(
            (notif: any) => notif?.notification_type === 'password_change_request' && notif?.status === 'Pending'
          );

          this.drillAlerts = allNotifications.filter(
            (notif: any) => notif?.notification_type === 'emergency_drill_alert' && notif?.status === 'Pending'
          );

          this.emergencyNotifications = allNotifications.filter(
            (notif: any) => notif?.priority === 'urgent' && notif?.status === 'Pending' && notif?.visit_id
          );

          this.notificationHistory = allNotifications.filter(
            (notif: any) => notif?.status !== 'Pending' || notif?.priority === 'normal'
          ).slice(0, 10);

          // Notifications categorized and loaded
        }
      },
      error: (err) => {
        // Error loading admin notifications
      }
    });
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
      // Error formatting date
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
      // Error formatting timestamp
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

  viewEmergencyDetails(notification: any): void {
    // Navigate to detailed view or show modal

    // Create a detailed modal or alert
    const details = `
Emergency Details:

Student: ${notification?.student?.full_name || 'N/A'}
Student Number: ${notification?.student?.student_number || 'N/A'}
Grade & Section: ${notification?.student?.grade_section || 'N/A'}

Visit Type: ${notification?.visit?.visit_type || 'N/A'}
Diagnosis: ${notification?.visit?.diagnosis || notification?.visit?.chief_complaint || 'N/A'}
Visit Status: ${notification?.visit?.status || 'N/A'}
Time: ${notification?.timeAgo || 'N/A'}

Staff: ${notification?.staff?.name || 'N/A'}
Position: ${notification?.staff?.position || 'N/A'}
    `.trim();

    if (confirm(details + '\n\nMark this notification as read?')) {
      this.markNotificationAsRead(notification?.notification_id);
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
        // Failed to mark notification as read
      }
    });
  }

  markAllNotificationsAsRead(): void {
    if (this.emergencyNotifications.length === 0) return;

    if (confirm(`Mark all ${this.emergencyNotifications.length} emergency notifications as read?`)) {
      this.adminService.markAllNotificationsAsRead().subscribe({
        next: (response) => {
          if (response.success) {
            // Move emergency notifications to history
            this.notificationHistory = [
              ...this.emergencyNotifications.map(n => ({ ...n, status: 'Read' })),
              ...this.notificationHistory
            ].slice(0, 10);

            // Clear emergency notifications
            this.emergencyNotifications = [];

            alert('All emergency notifications marked as read');
          }
        },
        error: (err) => {
          // Failed to mark all notifications as read
        }
      });
    }
  }

  sendSMSToParent(notification: any): void {
    const studentName = notification?.student?.full_name || 'the student';
    const visitId = notification?.visit?.visit_id || notification?.visit_id;

    if (!visitId) {
      alert('Error: Visit ID not found in notification');
      return;
    }

    if (confirm(`Send SMS notification to ${studentName}'s parent/guardian about this emergency visit?`)) {
      this.adminService.sendParentSMS(visitId).subscribe({
        next: (response) => {
          if (response?.success) {
            alert(`SMS sent successfully to ${response?.phone || 'parent'}\n\nMessage: ${response?.sms_message || response?.message || 'SMS sent'}`);
          } else {
            alert('Failed to send SMS: ' + (response?.message || 'Unknown error'));
          }
        },
        error: (err) => {
          // Failed to send SMS
          alert('Failed to send SMS. ' + (err?.error?.message || 'Please try again.'));
        }
      });
    }
  }

  viewNotificationDetails(notification: any): void {
    const details = `
Notification Details:

Student: ${notification.student?.full_name || 'N/A'}
Student Number: ${notification.student?.student_number || 'N/A'}
Grade & Section: ${notification.student?.grade_section || 'N/A'}

Visit Type: ${notification.visit?.visit_type || 'N/A'}
Diagnosis: ${notification.visit?.diagnosis || notification.visit?.chief_complaint || 'N/A'}
Visit Status: ${notification.visit?.status || 'N/A'}

Priority: ${notification.priority || 'N/A'}
Status: ${notification.status || 'N/A'}
Created: ${notification.timeAgo || 'N/A'}

Message:
${notification.message || 'N/A'}
    `.trim();

    alert(details);
  }

  approvePasswordChange(request: any): void {
    this.selectedPasswordRequest = request;
    this.showPasswordChangeModal = true;
  }

  confirmApprovePasswordChange(): void {
    if (!this.selectedPasswordRequest) return;

    const request = this.selectedPasswordRequest;
    const userName = request.request_data?.full_name || 'this user';
    const username = request.request_data?.username || '';

    this.adminService.approvePasswordChangeRequest(request.notification_id).subscribe({
      next: (response) => {
        if (response?.success) {
          const tempPassword = response.data?.temp_password;
          alert(`Password reset successfully!\n\nUsername: ${username}\nTemporary Password: ${tempPassword}\n\nPlease provide this information to the user securely.`);

          // Remove from password change requests
          this.passwordChangeRequests = this.passwordChangeRequests.filter(
            r => r.notification_id !== request.notification_id
          );
          this.closePasswordChangeModal();
        } else {
          alert('Failed to approve password change: ' + (response?.message || 'Unknown error'));
        }
      },
      error: (err) => {
        // Failed to approve password change
        alert('Error approving password change request');
      }
    });
  }

  closePasswordChangeModal(): void {
    this.showPasswordChangeModal = false;
    this.selectedPasswordRequest = null;
  }

  dismissPasswordChange(request: any): void {
    const userName = request.request_data?.full_name || 'this user';

    if (confirm(`Dismiss password change request from ${userName}?`)) {
      this.adminService.dismissPasswordChangeRequest(request.notification_id).subscribe({
        next: (response) => {
          if (response?.success) {
            // Remove from password change requests
            this.passwordChangeRequests = this.passwordChangeRequests.filter(
              r => r.notification_id !== request.notification_id
            );
            alert('Request dismissed');
          }
        },
        error: (err) => {
          // Failed to dismiss request
          alert('Error dismissing request');
        }
      });
    }
  }

  viewDrillDashboard(drillId: number): void {
    if (drillId) {
      this.router.navigate(['/dashboard/admin/emergency-drills', drillId, 'dashboard']);
    }
  }

  getNotificationIcon(notification: any): string {
    if (notification.notification_type === 'password_change_request') {
      return 'fa-key';
    } else if (notification.notification_type === 'emergency_drill_alert') {
      return 'fa-bell';
    } else if (notification.priority === 'urgent') {
      return 'fa-triangle-exclamation';
    } else {
      return 'fa-circle-info';
    }
  }
}

