import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { AuthService } from '../../../core/services/auth.service';
import { AdminNotificationPanelService } from '../../../core/services/admin-notification-panel.service';
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
        <button
          class="hero-notif-bell notification-bell"
          [class.notif-active]="panelOpen"
          (click)="toggleNotifications($event)"
          title="Notifications">
          <i class="bi bi-bell-fill"></i>
          <span class="hero-notif-badge" *ngIf="(notifPanelService.unreadCount$ | async) as count">
            <span *ngIf="count > 0">{{ count > 99 ? '99+' : count }}</span>
          </span>
        </button>
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

        <!-- Statistics Cards -->
        <div class="stats-grid">
          <!-- Total Users -->
          <div class="stat-card">
            <div class="stat-info">
              <div class="stat-label">Total Users</div>
              <div class="stat-value users">{{ systemStats.totalUsers | number }}</div>
            </div>
            <div class="stat-icon-wrap users-bg">
              <i class="bi bi-people-fill"></i>
            </div>
          </div>

          <!-- Total Students -->
          <div class="stat-card">
            <div class="stat-info">
              <div class="stat-label">Total Students</div>
              <div class="stat-value students">{{ systemStats.totalStudents | number }}</div>
            </div>
            <div class="stat-icon-wrap students-bg">
              <i class="bi bi-mortarboard-fill"></i>
            </div>
          </div>

          <!-- Total Advisers -->
          <div class="stat-card">
            <div class="stat-info">
              <div class="stat-label">Total Advisers</div>
              <div class="stat-value advisers">{{ systemStats.totalAdvisers | number }}</div>
            </div>
            <div class="stat-icon-wrap advisers-bg">
              <i class="bi bi-briefcase-fill"></i>
            </div>
          </div>

          <!-- Clinic Staff -->
          <div class="stat-card">
            <div class="stat-info">
              <div class="stat-label">Clinic Staff</div>
              <div class="stat-value staff">{{ systemStats.totalStaff | number }}</div>
            </div>
            <div class="stat-icon-wrap staff-bg">
              <i class="bi bi-heart-pulse-fill"></i>
            </div>
          </div>

          <!-- Visits Today -->
          <div class="stat-card">
            <div class="stat-info">
              <div class="stat-label">Visits Today</div>
              <div class="stat-value visits">{{ systemStats.visitsToday | number }}</div>
            </div>
            <div class="stat-icon-wrap visits-bg">
              <i class="bi bi-stethoscope"></i>
            </div>
          </div>

          <!-- Emergency Visits This Week -->
          <div class="stat-card">
            <div class="stat-info">
              <div class="stat-label">Emergency Visits This Week</div>
              <div class="stat-value emergency">{{ systemStats.emergencyVisitsWeek | number }}</div>
            </div>
            <div class="stat-icon-wrap emergency-bg">
              <i class="bi bi-exclamation-circle-fill"></i>
            </div>
          </div>
        </div>

        <!-- Charts Row -->
        <div class="charts-row">

          <!-- Clinic Visits Line Chart -->
          <div class="dash-card chart-card">
            <div class="dash-card-header">
              <div>
                <h3>Clinic Visits (Last 30 Days)</h3>
              </div>
            </div>
            <div class="line-chart-wrap">
              <ng-container *ngIf="visitsByDay.length > 0; else noVisitChart">
                <div class="line-chart-inner">
                  <!-- Y-axis labels -->
                  <div class="y-axis">
                    <span *ngFor="let t of yAxisTicks">{{ t }}</span>
                  </div>
                  <!-- SVG chart area -->
                  <div class="line-chart-area-wrap">
                    <svg class="line-chart-svg" [attr.viewBox]="'0 0 ' + lcW + ' ' + lcH" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="visitGrad2" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%"   stop-color="#1e3a5f" stop-opacity="0.15"/>
                          <stop offset="100%" stop-color="#1e3a5f" stop-opacity="0"/>
                        </linearGradient>
                      </defs>
                      <!-- Horizontal grid lines -->
                      <line *ngFor="let t of yAxisTicks; let i = index"
                        x1="0" [attr.y1]="lcGridY(i)" [attr.x2]="lcW" [attr.y2]="lcGridY(i)"
                        stroke="#e2e8f0" stroke-width="1"/>
                      <!-- Area fill -->
                      <path [attr.d]="lineChartArea" fill="url(#visitGrad2)"/>
                      <!-- Line -->
                      <path [attr.d]="lineChartPath" fill="none" stroke="#1e3a5f" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
                      <!-- Data point dots -->
                      <circle *ngFor="let pt of lineChartPoints"
                        [attr.cx]="pt.x" [attr.cy]="pt.y" r="4"
                        fill="white" stroke="#1e3a5f" stroke-width="2"/>
                    </svg>
                    <!-- X-axis labels -->
                    <div class="line-chart-labels">
                      <span *ngFor="let d of visitsByDayLabels">{{ d }}</span>
                    </div>
                  </div>
                </div>
              </ng-container>
              <ng-template #noVisitChart>
                <div class="chart-empty">
                  <i class="bi bi-bar-chart-line"></i>
                  <p>No visit data available</p>
                </div>
              </ng-template>
            </div>
          </div>

          <!-- Visit Types Pie Chart -->
          <div class="dash-card pie-card">
            <div class="dash-card-header">
              <div>
                <h3>Visit Types</h3>
              </div>
            </div>
            <div class="pie-wrap">
              <ng-container *ngIf="visitTypesTotal > 0; else noPieData">
                <svg class="pie-svg" viewBox="0 0 220 220">
                  <!-- Routine slice -->
                  <path [attr.d]="pieRoutinePath"  fill="#1e3a5f"/>
                  <!-- Emergency slice -->
                  <path [attr.d]="pieEmergencyPath" fill="#ef4444"/>
                  <!-- Percentage labels -->
                  <text *ngIf="routinePct > 5"
                    [attr.x]="pieRoutineLabelX" [attr.y]="pieRoutineLabelY"
                    text-anchor="middle" font-size="11" font-weight="600" fill="white">
                    {{ routinePct }}%
                  </text>
                  <text *ngIf="emergencyPct > 5"
                    [attr.x]="pieEmergencyLabelX" [attr.y]="pieEmergencyLabelY"
                    text-anchor="middle" font-size="11" font-weight="600" fill="white">
                    {{ emergencyPct }}%
                  </text>
                </svg>
                <!-- Outside labels -->
                <div class="pie-labels">
                  <div class="pie-label-item routine">
                    <span class="pie-label-dot"></span>
                    <span>Routine {{ routinePct }}%</span>
                  </div>
                  <div class="pie-label-item emergency">
                    <span class="pie-label-dot"></span>
                    <span>Emergency {{ emergencyPct }}%</span>
                  </div>
                </div>
              </ng-container>
              <ng-template #noPieData>
                <div class="chart-empty">
                  <i class="bi bi-pie-chart"></i>
                  <p>No visit data available</p>
                </div>
              </ng-template>
            </div>
          </div>
        </div>

        <!-- Recent Clinic Visits — full width below charts -->
        <div class="dash-card recent-visits-card">
          <div class="dash-card-header">
            <h3>Recent Clinic Visits</h3>
          </div>
          <div class="rv-table-wrap">
            <table class="rv-table" *ngIf="recentVisits.length > 0; else noVisits">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Grade/Section</th>
                  <th>Complaint</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let v of recentVisits">
                  <td class="rv-name">{{ v.student_name }}</td>
                  <td class="rv-grade">{{ v.grade_section || '—' }}</td>
                  <td class="rv-complaint" [title]="v.chief_complaint">{{ v.chief_complaint || '—' }}</td>
                  <td>
                    <span class="rv-badge" [ngClass]="v.visit_type === 'Emergency' ? 'badge-emergency' : 'badge-routine'">
                      {{ v.visit_type }}
                    </span>
                  </td>
                  <td>
                    <span class="rv-badge"
                      [ngClass]="v.status === 'Open' ? 'badge-open' : v.status === 'Referred' ? 'badge-referred' : 'badge-closed'">
                      {{ v.status }}
                    </span>
                  </td>
                  <td class="rv-date">{{ v.date_time }}</td>
                </tr>
              </tbody>
            </table>
            <ng-template #noVisits>
              <div class="chart-empty">
                <i class="bi bi-clipboard2-pulse"></i>
                <p>No recent visits</p>
              </div>
            </ng-template>
          </div>
        </div>

        <!-- Health Risk by Grade -->
        <div class="dash-card grade-risk-card">
          <div class="dash-card-header">
            <div>
              <h3>Health Risk by Grade</h3>
              <span class="dash-card-sub">BMI distribution</span>
            </div>
          </div>
          <app-health-risk-visualization></app-health-risk-visualization>
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

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.25rem;
      margin-bottom: 2rem;
    }

    .stat-card {
      background: white;
      border-radius: 14px;
      padding: 1.5rem 1.75rem;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      transition: box-shadow 0.2s ease, transform 0.2s ease;

      &:hover {
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
        transform: translateY(-2px);
      }

      .stat-info {
        display: flex;
        flex-direction: column;
        gap: 0.35rem;

        .stat-label {
          font-size: 0.88rem;
          color: #6b7280;
          font-weight: 500;
        }

        .stat-value {
          font-size: 2rem;
          font-weight: 700;
          line-height: 1.1;

          &.users    { color: #1e3a5f; }
          &.students { color: #22c55e; }
          &.advisers { color: #7c3aed; }
          &.staff    { color: #14b8a6; }
          &.visits   { color: #f59e0b; }
          &.emergency { color: #ef4444; }
        }
      }

      .stat-icon-wrap {
        width: 52px;
        height: 52px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
        flex-shrink: 0;

        &.users-bg     { background: #e8edf5; color: #1e3a5f; }
        &.students-bg  { background: #dcfce7; color: #16a34a; }
        &.advisers-bg  { background: #ede9fe; color: #7c3aed; }
        &.staff-bg     { background: #ccfbf1; color: #0d9488; }
        &.visits-bg    { background: #fef3c7; color: #d97706; }
        &.emergency-bg { background: #fee2e2; color: #dc2626; }
      }
    }

    .content-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
    }

    /* ── Shared dashboard card ── */
    .dash-card {
      background: white;
      border-radius: 14px;
      padding: 1.5rem 1.75rem;
      box-shadow: 0 2px 10px rgba(0,0,0,0.06);
      border: 1px solid rgba(5,35,85,0.05);
    }

    .dash-card-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 1.25rem;

      h3 {
        font-size: 1rem;
        font-weight: 700;
        color: #1e293b;
        margin: 0 0 0.2rem 0;
      }

      .dash-card-sub {
        font-size: 0.78rem;
        color: #94a3b8;
      }
    }

    /* ── Charts row ── */
    .charts-row {
      display: grid;
      grid-template-columns: 1fr 320px;
      gap: 1.25rem;
      margin-bottom: 1.25rem;
    }

    /* Line chart */
    .line-chart-wrap {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .line-chart-inner {
      display: flex;
      gap: 0.5rem;
      align-items: stretch;
    }

    .y-axis {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: flex-end;
      padding-bottom: 1.5rem;
      font-size: 0.72rem;
      color: #94a3b8;
      min-width: 28px;
      flex-shrink: 0;
    }

    .line-chart-area-wrap {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
    }

    .line-chart-svg {
      width: 100%;
      display: block;
      overflow: visible;
    }

    .line-chart-labels {
      display: flex;
      justify-content: space-between;
      margin-top: 0.4rem;
      font-size: 0.72rem;
      color: #94a3b8;
    }

    /* Pie chart */
    .pie-card { display: flex; flex-direction: column; }

    .pie-wrap {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      padding: 0.5rem 0;

      .pie-svg {
        width: 180px;
        height: 180px;
        flex-shrink: 0;
      }

      .pie-labels {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        width: 100%;
        padding: 0 0.5rem;
      }

      .pie-label-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.85rem;
        color: #475569;
        font-weight: 500;

        .pie-label-dot {
          width: 12px;
          height: 12px;
          border-radius: 3px;
          flex-shrink: 0;
        }

        &.routine   .pie-label-dot { background: #1e3a5f; }
        &.emergency .pie-label-dot { background: #ef4444; }
      }
    }

    /* ── Recent visits — full width ── */
    .recent-visits-card {
      margin-bottom: 1.25rem;
    }

    /* Recent visits table */
    .rv-table-wrap {
      overflow-x: auto;
    }

    .rv-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;

      thead tr {
        border-bottom: 1px solid #e2e8f0;
      }

      th {
        text-align: left;
        padding: 0.75rem 1rem;
        font-size: 0.8rem;
        font-weight: 600;
        color: #64748b;
        white-space: nowrap;
      }

      tbody tr {
        border-bottom: 1px solid #f1f5f9;
        transition: background 0.15s;
        &:hover { background: #f8fafc; }
        &:last-child { border-bottom: none; }
      }

      td {
        padding: 0.9rem 1rem;
        color: #334155;
        vertical-align: middle;
      }

      .rv-name    { font-weight: 500; color: #1e293b; white-space: nowrap; }
      .rv-grade   { color: #94a3b8; white-space: nowrap; }
      .rv-complaint {
        max-width: 220px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: #475569;
      }
      .rv-date    { color: #64748b; white-space: nowrap; font-size: 0.82rem; }
    }

    .rv-badge {
      display: inline-block;
      padding: 0.25rem 0.7rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 500;
      white-space: nowrap;

      &.badge-routine   { background: #dbeafe; color: #2563eb; }
      &.badge-emergency { background: #fee2e2; color: #dc2626; }
      &.badge-open      { background: #fef9c3; color: #b45309; }
      &.badge-closed    { background: #dcfce7; color: #16a34a; }
      &.badge-referred  { background: #ede9fe; color: #7c3aed; }
    }

    /* Grade risk card */
    .grade-risk-card {
      margin-bottom: 1.25rem;
      overflow: hidden;
      ::ng-deep .health-risk-visualization { padding: 0; }
      ::ng-deep .viz-card {
        box-shadow: none;
        border: none;
        padding: 0;
        margin-bottom: 1rem;
        &:last-child { margin-bottom: 0; }
      }
    }

    /* Empty state */
    .chart-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2.5rem 1rem;
      color: #94a3b8;
      gap: 0.5rem;
      i { font-size: 2rem; }
      p { font-size: 0.88rem; margin: 0; }
    }

    /* ── Keep old bottom-grid for any legacy references ── */
    .bottom-grid { display: none; }

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
      .charts-row { grid-template-columns: 1fr; }
    }

    @media (max-width: 768px) {
      .admin-dashboard { padding: 1rem; }
      .stats-grid { grid-template-columns: repeat(2, 1fr); gap: 0.875rem; }
      .stat-card { padding: 1.1rem 1.25rem; }
      .stat-card .stat-value { font-size: 1.6rem; }
      .stat-card .stat-icon-wrap { width: 44px; height: 44px; font-size: 1.2rem; }
      .actions-grid { grid-template-columns: repeat(2, 1fr); }
      .charts-row { gap: 1rem; }
      .rv-table th, .rv-table td { padding: 0.5rem 0.75rem; }
      .users-table .table-header, .users-table .table-row {
        grid-template-columns: 1fr 1fr;
        .user-date, .user-status { display: none; }
      }
    }

    @media (max-width: 480px) {
      .stats-grid { grid-template-columns: 1fr; }
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
    totalAdvisers: 0,
    visitsToday: 0,
    emergencyVisitsWeek: 0
  };

  activityLog: any[] = [];
  emergencyNotifications: any[] = [];
  notificationHistory: any[] = [];
  drillAlerts: any[] = [];

  // Chart data
  visitsByDay: { date: string; count: number }[] = [];
  visitsByDayLabels: string[] = [];
  lineChartPath = '';
  lineChartArea = '';
  lineChartPoints: { x: number; y: number }[] = [];
  yAxisTicks: number[] = [];
  lcW = 500;
  lcH = 180;

  visitTypes = { routine: 0, emergency: 0 };
  visitTypesTotal = 0;
  routinePct = 0;
  emergencyPct = 0;
  pieRoutinePath = '';
  pieEmergencyPath = '';
  pieRoutineLabelX = 0;
  pieRoutineLabelY = 0;
  pieEmergencyLabelX = 0;
  pieEmergencyLabelY = 0;

  // Keep for backward compat (unused now but avoids TS errors if referenced elsewhere)
  routineArc = 0;
  emergencyArc = 0;
  totalArc = 376.99;
  donutOffset = 0;

  // Recent visits table
  recentVisits: any[] = [];

  // Modal state

  constructor(
    private router: Router,
    private adminService: AdminService,
    private authService: AuthService,
    public notifPanelService: AdminNotificationPanelService
  ) {}

  panelOpen = false;

  toggleNotifications(event: Event): void {
    event.stopPropagation();
    this.notifPanelService.toggleFromAnchor(event.currentTarget as HTMLElement);
  }

  ngOnInit(): void {
    this.notifPanelService.open$.subscribe(open => {
      this.panelOpen = open;
    });
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
              totalStaff: dashboardData.current_stats.clinic_staff || 0,
              visitsToday: dashboardData.current_stats.visits_today || 0,
              emergencyVisitsWeek: dashboardData.current_stats.emergency_visits_week || 0
            };
            // Updated system stats from dashboard
          }

          // Populate visits-by-day line chart
          if (Array.isArray(dashboardData.visits_by_day)) {
            this.visitsByDay = dashboardData.visits_by_day.map((d: any) => ({
              date: d.date,
              count: Number(d.count) || 0
            }));
            this.buildLineChart();
          }

          // Populate visit types donut
          if (dashboardData.visits_by_type) {
            this.visitTypes = {
              routine:   Number(dashboardData.visits_by_type['Routine'])   || 0,
              emergency: Number(dashboardData.visits_by_type['Emergency']) || 0
            };
            this.buildDonut();
          }

          // Populate recent visits table
          if (Array.isArray(dashboardData.recent_visits)) {
            this.recentVisits = dashboardData.recent_visits.map((v: any) => {
              const s = v.student;

              // Normalize visit_type
              const rawType = (v.visit_type || '').toLowerCase();
              const visitType = rawType === 'emergency' ? 'Emergency' : 'Routine';

              // Normalize status
              const rawStatus = (v.status || '').toLowerCase();
              let status = 'Open';
              if (rawStatus === 'closed' || rawStatus === 'completed') status = 'Closed';
              else if (rawStatus === 'referred' || rawStatus === 'cancelled') status = 'Referred';

              return {
                student_name:    s ? (s.full_name || `${s.first_name ?? ''} ${s.last_name ?? ''}`.trim()) : '—',
                grade_section:   s ? [s.grade_level, s.section].filter(Boolean).join(' - ') : '—',
                chief_complaint: v.chief_complaint || v.notes || '—',
                visit_type:      visitType,
                status:          status,
                date_time:       v.visit_datetime
                  ? new Date(v.visit_datetime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                  : '—'
              };
            });
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

          // Emergency drill alerts (pending)
          this.drillAlerts = allNotifications.filter(
            (notif: any) => notif?.notification_type === 'emergency_drill_alert' && notif?.status === 'Pending'
          );

          // Medical emergency notifications (urgent + pending + has visit_id)
          this.emergencyNotifications = allNotifications.filter(
            (notif: any) =>
              notif?.status === 'Pending' &&
              notif?.visit_id &&
              (notif?.notification_type === 'emergency_visit' || notif?.priority === 'urgent')
          );

          this.notificationHistory = this.notifPanelService.buildAdminFeed(allNotifications);
          this.notifPanelService.setNotificationHistory(this.notificationHistory);

          // Notifications categorized
        } else if (response?.success && Array.isArray(response.notifications)) {
          // Fallback for direct notifications array
          const allNotifications = response.notifications.map((notif: any) => {
            return {
              ...notif,
              timeAgo: this.formatTimestamp(notif?.created_at || '')
            };
          });

          this.drillAlerts = allNotifications.filter(
            (notif: any) => notif?.notification_type === 'emergency_drill_alert' && notif?.status === 'Pending'
          );

          this.emergencyNotifications = allNotifications.filter(
            (notif: any) =>
              notif?.status === 'Pending' &&
              notif?.visit_id &&
              (notif?.notification_type === 'emergency_visit' || notif?.priority === 'urgent')
          );

          this.notificationHistory = this.notifPanelService.buildAdminFeed(allNotifications);
          this.notifPanelService.setNotificationHistory(this.notificationHistory);

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

  // ── Chart helpers ──────────────────────────────────────────────

  private buildLineChart(): void {
    const data = this.visitsByDay;
    if (!data.length) return;

    const W = this.lcW, H = this.lcH;
    const PAD_LEFT = 0, PAD_RIGHT = 8, PAD_TOP = 10, PAD_BOTTOM = 10;
    const chartW = W - PAD_LEFT - PAD_RIGHT;
    const chartH = H - PAD_TOP - PAD_BOTTOM;

    const maxVal = Math.max(...data.map(d => d.count), 1);

    // Nice Y-axis ticks (4 ticks: 0, max/3, 2*max/3, max rounded)
    const rawStep = maxVal / 3;
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep || 1)));
    const niceStep = Math.ceil(rawStep / magnitude) * magnitude;
    const niceMax = niceStep * 3;
    this.yAxisTicks = [niceMax, Math.round(niceMax * 2 / 3), Math.round(niceMax / 3), 0];

    const step = chartW / (data.length - 1 || 1);

    this.lineChartPoints = data.map((d, i) => ({
      x: PAD_LEFT + i * step,
      y: PAD_TOP + (1 - d.count / niceMax) * chartH
    }));

    const pts = this.lineChartPoints;
    const lineParts = pts.map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`));
    this.lineChartPath = lineParts.join(' ');
    this.lineChartArea =
      `M${pts[0].x},${PAD_TOP + chartH} ` +
      lineParts.join(' ') +
      ` L${pts[pts.length - 1].x},${PAD_TOP + chartH} Z`;

    // X-axis labels: show ~7 evenly spaced
    const labelCount = Math.min(data.length, 8);
    const labelStep = Math.ceil(data.length / labelCount);
    this.visitsByDayLabels = data
      .filter((_, i) => i % labelStep === 0 || i === data.length - 1)
      .map(d => {
        const dt = new Date(d.date);
        return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      });
  }

  lcGridY(tickIndex: number): number {
    const PAD_TOP = 10, PAD_BOTTOM = 10;
    const chartH = this.lcH - PAD_TOP - PAD_BOTTOM;
    // ticks are [max, 2/3, 1/3, 0] — map to y positions
    return PAD_TOP + (tickIndex / (this.yAxisTicks.length - 1)) * chartH;
  }

  private buildDonut(): void {
    const total = this.visitTypes.routine + this.visitTypes.emergency;
    this.visitTypesTotal = total;
    if (total === 0) {
      this.routinePct = 0;
      this.emergencyPct = 0;
      this.pieRoutinePath = '';
      this.pieEmergencyPath = '';
      return;
    }

    this.routinePct   = Math.round((this.visitTypes.routine   / total) * 100);
    this.emergencyPct = 100 - this.routinePct;

    const cx = 110, cy = 110, r = 100;
    const routineAngle   = (this.visitTypes.routine   / total) * 2 * Math.PI;
    const emergencyAngle = (this.visitTypes.emergency / total) * 2 * Math.PI;

    // Start from top (-π/2)
    const start = -Math.PI / 2;
    const mid1  = start + routineAngle;
    const end   = start + routineAngle + emergencyAngle;

    const toXY = (angle: number) => ({
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle)
    });

    const p1 = toXY(start);
    const p2 = toXY(mid1);
    const p3 = toXY(end);

    const rLargeArc = routineAngle > Math.PI ? 1 : 0;
    const eLargeArc = emergencyAngle > Math.PI ? 1 : 0;

    this.pieRoutinePath =
      `M${cx},${cy} L${p1.x},${p1.y} A${r},${r} 0 ${rLargeArc},1 ${p2.x},${p2.y} Z`;
    this.pieEmergencyPath =
      `M${cx},${cy} L${p2.x},${p2.y} A${r},${r} 0 ${eLargeArc},1 ${p3.x},${p3.y} Z`;

    // Label positions (midpoint of each arc, at 65% radius)
    const rMid = start + routineAngle / 2;
    const eMid = mid1  + emergencyAngle / 2;
    const labelR = r * 0.62;
    this.pieRoutineLabelX   = cx + labelR * Math.cos(rMid);
    this.pieRoutineLabelY   = cy + labelR * Math.sin(rMid);
    this.pieEmergencyLabelX = cx + labelR * Math.cos(eMid);
    this.pieEmergencyLabelY = cy + labelR * Math.sin(eMid);
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
              ...this.emergencyNotifications.map(n => ({ ...n, status: 'Sent' })),
              ...this.notificationHistory
            ].slice(0, 10);
            this.notifPanelService.setNotificationHistory(this.notificationHistory);

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

