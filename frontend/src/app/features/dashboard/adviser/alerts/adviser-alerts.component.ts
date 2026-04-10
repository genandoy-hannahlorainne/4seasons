import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../core/services/auth.service';
import { AdviserService } from '../../../../core/services/adviser.service';
import { Router } from '@angular/router';
import { Subject, interval } from 'rxjs';
import { takeUntil, switchMap, startWith } from 'rxjs/operators';

interface Alert {
  id: number;
  studentId?: number;
  senderName: string;
  senderRole: string;
  studentName: string;
  studentNumber: string;
  subject: string;
  previewText: string;
  fullMessage: string;
  timeAgo: string;
  fullDate: string;
  visitType: string;
  priority: 'urgent' | 'normal';
  isRead: boolean;
  isExpanded: boolean;
}

@Component({
  selector: 'app-adviser-alerts',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="adviser-alerts">
      <div class="alerts-header">
        <h1>Alerts & Notifications</h1>
        <p>Messages from Clinic Staff regarding your students</p>
      </div>

      <div *ngIf="actionMessage" class="action-message" [class.error]="actionMessageType === 'error'">
        {{ actionMessage }}
      </div>

      <!-- Loading State -->
      <div class="loading-state" *ngIf="loading">
        <div class="spinner"></div>
        <p>Loading alerts...</p>
      </div>

      <div *ngIf="!loading">
        <!-- Alert Filters -->
        <div class="alert-filters" *ngIf="alerts.length > 0">
          <button 
            class="filter-btn" 
            [class.active]="activeFilter === 'all'"
            (click)="setFilter('all')">
            All ({{ alerts.length }})
          </button>
          <button 
            class="filter-btn" 
            [class.active]="activeFilter === 'recent'"
            (click)="setFilter('recent')">
            Recent ({{ recentCount }})
          </button>
          <button 
            class="filter-btn" 
            [class.active]="activeFilter === 'unread'"
            (click)="setFilter('unread')">
            Unread ({{ unreadCount }})
          </button>
        </div>

        <!-- Alerts List -->
        <div class="alerts-list" *ngIf="filteredAlerts.length > 0">
          <div 
            *ngFor="let alert of filteredAlerts" 
            class="alert-item" 
            [class.unread]="!alert.isRead"
            [class.expanded]="alert.isExpanded"
            (click)="toggleAlert(alert)">
            
            <div class="alert-preview">
              <div class="alert-avatar">
                <div class="avatar-placeholder">
                  <i class="fa-solid fa-user-nurse"></i>
                </div>
                <span class="alert-badge" [ngClass]="alert.priority">
                  <span *ngIf="alert.priority === 'urgent'">!</span>
                  <span *ngIf="alert.priority === 'normal'">i</span>
                </span>
              </div>
              
              <div class="alert-content">
                <div class="alert-header-row">
                  <span class="alert-sender">{{ alert.senderName }}</span>
                  <span class="alert-time">{{ alert.timeAgo }}</span>
                </div>
                <div class="alert-subject">
                  <strong>{{ alert.studentName }}</strong> - {{ alert.subject }}
                </div>
                <div class="alert-preview-text">{{ alert.previewText }}</div>
              </div>
              
              <div class="alert-indicator">
                <span class="unread-dot" *ngIf="!alert.isRead"></span>
                <span class="expand-icon">{{ alert.isExpanded ? '▲' : '▼' }}</span>
              </div>
            </div>
            
            <!-- Expanded Full Message -->
            <div class="alert-full-message" *ngIf="alert.isExpanded">
              <div class="message-divider"></div>
              <div class="message-content">
                <div class="message-header">
                  <div class="message-info">
                    <span class="message-from">From: {{ alert.senderName }} ({{ alert.senderRole }})</span>
                    <span class="message-date">{{ alert.fullDate }}</span>
                  </div>
                </div>
                <div class="message-body">
                  {{ alert.fullMessage }}
                </div>
                <div class="message-student-info">
                  <div class="student-tag">
                    <span class="tag-label">Student:</span>
                    <span class="tag-value">{{ alert.studentName }} ({{ alert.studentNumber }})</span>
                  </div>
                  <div class="visit-tag" *ngIf="alert.visitType">
                    <span class="tag-label">Visit Type:</span>
                    <span class="tag-value">{{ alert.visitType }}</span>
                  </div>
                </div>
                <div class="message-actions">
                  <button class="btn-action primary" (click)="viewStudentRecord(alert, $event)">
                    View Student Record
                  </button>
                  <button class="btn-action secondary" (click)="markAsRead(alert, $event)">
                    {{ alert.isRead ? 'Mark as Unread' : 'Mark as Read' }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div class="empty-state" *ngIf="alerts.length === 0">
          <div class="empty-icon" aria-hidden="true"><i class="fa-solid fa-inbox"></i></div>
          <div class="empty-title">No Alerts Yet</div>
          <div class="empty-text">You will receive notifications here when clinic staff sends updates about your students' health visits.</div>
        </div>

        <!-- Filtered Empty State -->
        <div class="empty-state" *ngIf="alerts.length > 0 && filteredAlerts.length === 0">
          <div class="empty-icon" aria-hidden="true"><i class="fa-solid fa-circle-check"></i></div>
          <div class="empty-text">No {{ activeFilter }} alerts</div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .adviser-alerts {
      padding: 2rem;
      background: #f5f7fa;
      min-height: 100vh;
    }

    /* ── Header ── */
    .alerts-header {
      background: linear-gradient(135deg, #052355 0%, #5381b2 100%);
      border-radius: 12px;
      padding: 2rem;
      margin-bottom: 1.5rem;
      color: white;

      h1 { font-size: 1.6rem; font-weight: 700; margin: 0 0 0.3rem; }
      p  { margin: 0; opacity: 0.85; font-size: 0.9rem; }
    }

    /* ── Loading ── */
    .loading-state {
      text-align: center;
      padding: 3rem;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);

      .spinner {
        width: 48px;
        height: 48px;
        margin: 0 auto 1rem;
        border: 4px solid #e8f0f8;
        border-top: 4px solid #052355;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
      p { color: #7f8c8d; }
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    /* ── Action Message ── */
    .action-message {
      margin-bottom: 1rem;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      background: #f0fdf4;
      color: #15803d;
      font-size: 0.875rem;
      font-weight: 500;
      border: 1px solid #bbf7d0;

      &.error { background: #fef9c3; color: #a16207; border-color: #fde68a; }
    }

    /* ── Filters ── */
    .alert-filters {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1.25rem;
      flex-wrap: wrap;

      .filter-btn {
        padding: 0.5rem 1.1rem;
        border: 1.5px solid #e2e8f0;
        background: white;
        color: #64748b;
        border-radius: 8px;
        cursor: pointer;
        font-size: 0.85rem;
        font-weight: 600;
        transition: all 0.2s;
        box-shadow: 0 1px 3px rgba(0,0,0,0.06);

        &:hover { background: #f8fafc; }
        &.active {
          background: linear-gradient(135deg, #052355 0%, #5381b2 100%);
          color: white;
          border-color: transparent;
          box-shadow: 0 2px 8px rgba(5,35,85,0.25);
        }
      }
    }

    /* ── Alert Items ── */
    .alerts-list { display: flex; flex-direction: column; gap: 0.75rem; }

    .alert-item {
      background: white;
      border-radius: 10px;
      overflow: hidden;
      cursor: pointer;
      transition: all 0.2s;
      box-shadow: 0 1px 4px rgba(0,0,0,0.07);
      border-left: 4px solid transparent;

      &:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.1); }

      &.unread {
        border-left-color: #052355;
        background: #f8fbff;
      }

      &.expanded { box-shadow: 0 4px 16px rgba(0,0,0,0.12); }
    }

    .alert-preview {
      display: flex;
      align-items: flex-start;
      padding: 1rem 1.25rem;
      gap: 1rem;
    }

    .alert-avatar {
      position: relative;
      width: 44px;
      height: 44px;
      flex-shrink: 0;

      .avatar-placeholder {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        background: linear-gradient(135deg, #052355 0%, #5381b2 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 1.2rem;
      }

      .alert-badge {
        position: absolute;
        bottom: -2px;
        right: -2px;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.65rem;
        font-weight: 700;
        color: white;
        border: 2px solid white;

        &.urgent { background: #ef4444; }
        &.normal  { background: #3b82f6; }
      }
    }

    .alert-content {
      flex: 1;
      min-width: 0;

      .alert-header-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.2rem;

        .alert-sender { font-weight: 700; color: #1e293b; font-size: 0.9rem; }
        .alert-time   { color: #94a3b8; font-size: 0.78rem; }
      }

      .alert-subject {
        color: #374151;
        font-size: 0.875rem;
        margin-bottom: 0.2rem;
        strong { color: #052355; }
      }

      .alert-preview-text {
        color: #94a3b8;
        font-size: 0.82rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }

    .alert-indicator {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.4rem;

      .unread-dot { width: 8px; height: 8px; background: #052355; border-radius: 50%; }
      .expand-icon { color: #94a3b8; font-size: 0.65rem; }
    }

    /* ── Expanded Message ── */
    .alert-full-message {
      padding: 0 1.25rem 1.25rem;

      .message-divider { height: 1px; background: #f1f5f9; margin-bottom: 1rem; }

      .message-content {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        padding: 1rem;
      }

      .message-header {
        margin-bottom: 0.75rem;
        .message-info {
          display: flex;
          justify-content: space-between;
          font-size: 0.8rem;
          color: #64748b;
        }
      }

      .message-body {
        color: #1e293b;
        font-size: 0.9rem;
        line-height: 1.6;
        margin-bottom: 1rem;
        white-space: pre-line;
      }

      .message-student-info {
        display: flex;
        gap: 1.5rem;
        margin-bottom: 1rem;
        padding: 0.75rem;
        background: white;
        border-radius: 8px;
        border: 1px solid #e2e8f0;

        .tag-label { color: #64748b; font-size: 0.78rem; margin-right: 0.4rem; }
        .tag-value { color: #1e293b; font-weight: 600; font-size: 0.875rem; }
      }

      .message-actions {
        display: flex;
        gap: 0.75rem;

        .btn-action {
          padding: 0.55rem 1.1rem;
          border: none;
          border-radius: 7px;
          cursor: pointer;
          font-size: 0.82rem;
          font-weight: 600;
          transition: all 0.2s;

          &.primary {
            background: linear-gradient(135deg, #052355 0%, #5381b2 100%);
            color: white;
            box-shadow: 0 2px 6px rgba(5,35,85,0.2);
            &:hover { box-shadow: 0 4px 10px rgba(5,35,85,0.3); transform: translateY(-1px); }
          }
          &.secondary {
            background: white;
            color: #374151;
            border: 1.5px solid #e2e8f0;
            &:hover { background: #f8fafc; border-color: #cbd5e1; }
          }
        }
      }
    }

    /* ── Empty State ── */
    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);

      .empty-icon  { font-size: 3rem; margin-bottom: 1rem; color: #94a3b8; }
      .empty-title { font-size: 1.2rem; font-weight: 700; color: #1e293b; margin-bottom: 0.5rem; }
      .empty-text  { color: #64748b; font-size: 0.9rem; max-width: 380px; margin: 0 auto; line-height: 1.6; }
    }

    @media (max-width: 768px) {
      .adviser-alerts { padding: 1rem; }
      .alert-preview { padding: 0.75rem; gap: 0.75rem; }
      .message-student-info { flex-direction: column; gap: 0.5rem; }
      .message-actions { flex-direction: column; }
    }
  `]
})
export class AdviserAlertsComponent implements OnInit, OnDestroy {
  activeFilter = 'all';
  loading = false;
  alerts: Alert[] = [];
  actionMessage = '';
  actionMessageType: 'success' | 'error' = 'success';
  private actionMessageTimer: ReturnType<typeof setTimeout> | null = null;
  private destroy$ = new Subject<void>();
  private refreshInterval = 30000; // 30 seconds

  constructor(
    private authService: AuthService,
    private adviserService: AdviserService,
    private router: Router
  ) {}

  get filteredAlerts(): Alert[] {
    switch (this.activeFilter) {
      case 'recent':
        // Show alerts from last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return this.alerts.filter(a => {
          const alertDate = this.parseTimeAgo(a.timeAgo);
          return alertDate >= sevenDaysAgo;
        });
      case 'unread':
        return this.alerts.filter(a => !a.isRead);
      default:
        return this.alerts;
    }
  }

  get recentCount(): number {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return this.alerts.filter(a => {
      const alertDate = this.parseTimeAgo(a.timeAgo);
      return alertDate >= sevenDaysAgo;
    }).length;
  }

  get unreadCount(): number {
    return this.alerts.filter(a => !a.isRead).length;
  }

  // Helper to parse timeAgo string to Date
  private parseTimeAgo(timeAgo: string): Date {
    const now = new Date();
    const match = timeAgo.match(/(\d+)([smhd])/);
    
    if (!match) return now;
    
    const value = parseInt(match[1]);
    const unit = match[2];
    
    switch (unit) {
      case 's': // seconds
        return new Date(now.getTime() - value * 1000);
      case 'm': // minutes
        return new Date(now.getTime() - value * 60 * 1000);
      case 'h': // hours
        return new Date(now.getTime() - value * 60 * 60 * 1000);
      case 'd': // days
        return new Date(now.getTime() - value * 24 * 60 * 60 * 1000);
      default:
        return now;
    }
  }

  ngOnInit(): void {
    this.loadAlerts();
    
    // Auto-refresh notifications every 30 seconds
    interval(this.refreshInterval)
      .pipe(
        startWith(0),
        switchMap(() => this.adviserService.getAdviserNotifications()),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response) => {
          if (!response?.success) {
            return;
          }

          if (Array.isArray(response?.data?.notifications)) {
            this.alerts = this.normalizeNotifications(response.data.notifications);
          } else if (Array.isArray(response?.notifications)) {
            this.alerts = this.normalizeNotifications(response.notifications);
          }
        },
        error: (err) => {
          console.error('Auto-refresh error:', err);
        }
      });
  }

  ngOnDestroy(): void {
    if (this.actionMessageTimer) {
      clearTimeout(this.actionMessageTimer);
      this.actionMessageTimer = null;
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadAlerts(): void {
    this.loading = true;
    this.adviserService.getAdviserNotifications().subscribe({
      next: (response) => {
        console.log('✅ Notifications response:', response);
        
        // Handle both Laravel API format (response.data.notifications) and legacy format (response.notifications)
        let notifications = [];
        if (response?.success && response.data?.notifications) {
          // Laravel API format
          notifications = response.data.notifications;
        } else if (response?.success && Array.isArray(response.notifications)) {
          // Legacy API format
          notifications = response.notifications;
        } else if (Array.isArray(response.notifications)) {
          // Direct notifications array (legacy fallback)
          notifications = response.notifications;
        }
        
        this.alerts = this.normalizeNotifications(notifications);
        console.log('✅ Loaded', this.alerts.length, 'notifications');
        this.loading = false;
      },
      error: (err) => {
        console.error('❌ Error loading notifications:', err);
        this.loading = false;
      }
    });
  }

  setFilter(filter: string): void {
    this.activeFilter = filter;
  }

  toggleAlert(alert: Alert): void {
    alert.isExpanded = !alert.isExpanded;
    if (alert.isExpanded && !alert.isRead) {
      alert.isRead = true;
    }
  }

  markAsRead(alert: Alert, event: Event): void {
    event.stopPropagation();
    alert.isRead = !alert.isRead;
  }

  viewStudentRecord(alert: Alert, event: Event): void {
    event.stopPropagation();
    const studentId = alert.studentId ?? (alert as any).student_id;

    if (!studentId) {
      this.showActionMessage('Unable to open student record for this alert. Student ID is missing.', 'error');
      return;
    }

    this.showActionMessage('Opening student medical record...', 'success');
    this.router.navigate(['/dashboard/adviser/students', studentId]);
  }

  private normalizeNotifications(notifications: any[]): Alert[] {
    return notifications.map((notification: any) => ({
      ...notification,
      studentId: notification.studentId ?? notification.student_id
    }));
  }

  private showActionMessage(message: string, type: 'success' | 'error'): void {
    this.actionMessage = message;
    this.actionMessageType = type;

    if (this.actionMessageTimer) {
      clearTimeout(this.actionMessageTimer);
    }

    this.actionMessageTimer = setTimeout(() => {
      this.actionMessage = '';
      this.actionMessageTimer = null;
    }, 3000);
  }
}
