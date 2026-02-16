import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../core/services/auth.service';
import { AdviserService } from '../../../../core/services/adviser.service';
import { Subject, interval } from 'rxjs';
import { takeUntil, switchMap, startWith } from 'rxjs/operators';

interface Alert {
  id: number;
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

    .alerts-header {
      margin-bottom: 1.5rem;
      
      h1 {
        font-size: 1.8rem;
        color: #2c3e50;
        margin-bottom: 0.5rem;
        font-weight: 600;
      }
      
      p {
        color: #7f8c8d;
        font-size: 1rem;
      }
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
        border-top: 4px solid #007bff;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
      
      p { color: #7f8c8d; }
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .alert-filters {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
      
      .filter-btn {
        padding: 0.6rem 1.2rem;
        border: none;
        background: white;
        color: #6c757d;
        border-radius: 20px;
        cursor: pointer;
        font-size: 0.9rem;
        font-weight: 500;
        transition: all 0.2s ease;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        
        &:hover { background: #f8f9fa; }
        &.active { background: #007bff; color: white; box-shadow: 0 2px 8px rgba(0,123,255,0.3); }
      }
    }

    .alerts-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .alert-item {
      background: white;
      border-radius: 10px;
      overflow: hidden;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08);
      
      &:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.12); }
      &.unread { 
        background: #f0f7ff; 
        border-left: 4px solid #007bff;
        
        .alert-preview {
          background: #f8fbff;
        }
      }
      &.expanded { box-shadow: 0 4px 15px rgba(0,0,0,0.15); }
    }

    .alert-preview {
      display: flex;
      align-items: flex-start;
      padding: 1rem;
      gap: 1rem;
      transition: background 0.2s ease;
    }

    .alert-avatar {
      position: relative;
      width: 50px;
      height: 50px;
      flex-shrink: 0;
      
      .avatar-placeholder {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 1.5rem;
      }
      
      .alert-badge {
        position: absolute;
        bottom: -2px;
        right: -2px;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.7rem;
        font-weight: bold;
        color: white;
        border: 2px solid white;
        
        &.urgent { background: #dc3545; }
        &.normal { background: #17a2b8; }
      }
    }

    .alert-content {
      flex: 1;
      min-width: 0;
      
      .alert-header-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.25rem;
        
        .alert-sender { font-weight: 600; color: #2c3e50; font-size: 0.95rem; }
        .alert-time { color: #95a5a6; font-size: 0.8rem; }
      }
      
      .alert-subject {
        color: #34495e;
        font-size: 0.9rem;
        margin-bottom: 0.25rem;
        strong { color: #007bff; }
      }
      
      .alert-preview-text {
        color: #7f8c8d;
        font-size: 0.85rem;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }

    .alert-indicator {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      
      .unread-dot { width: 10px; height: 10px; background: #007bff; border-radius: 50%; }
      .expand-icon { color: #95a5a6; font-size: 0.7rem; }
    }

    .alert-full-message {
      padding: 0 1rem 1rem;
      
      .message-divider { height: 1px; background: #e9ecef; margin-bottom: 1rem; }
      .message-content { background: #f8f9fa; border-radius: 8px; padding: 1rem; }
      
      .message-header {
        margin-bottom: 1rem;
        .message-info {
          display: flex;
          justify-content: space-between;
          font-size: 0.85rem;
          color: #6c757d;
        }
      }
      
      .message-body {
        color: #2c3e50;
        font-size: 0.95rem;
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
        border-radius: 6px;
        
        .student-tag, .visit-tag {
          .tag-label { color: #7f8c8d; font-size: 0.8rem; margin-right: 0.5rem; }
          .tag-value { color: #2c3e50; font-weight: 600; font-size: 0.9rem; }
        }
      }
      
      .message-actions {
        display: flex;
        gap: 0.75rem;
        
        .btn-action {
          padding: 0.6rem 1.2rem;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.85rem;
          font-weight: 500;
          transition: all 0.2s ease;
          
          &.primary { background: #007bff; color: white; &:hover { background: #0056b3; } }
          &.secondary { background: #e9ecef; color: #495057; &:hover { background: #dee2e6; } }
        }
      }
    }

    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      
      .empty-icon { font-size: 3.25rem; margin-bottom: 1rem; color: #4f7ea9; }
      .empty-title { font-size: 1.3rem; font-weight: 600; color: #2c3e50; margin-bottom: 0.5rem; }
      .empty-text { color: #7f8c8d; font-size: 1rem; max-width: 400px; margin: 0 auto; line-height: 1.5; }
    }

    @media (max-width: 768px) {
      .adviser-alerts { padding: 1rem; }
      .alert-filters { gap: 0.25rem; }
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
  private destroy$ = new Subject<void>();
  private refreshInterval = 30000; // 30 seconds

  constructor(
    private authService: AuthService,
    private adviserService: AdviserService
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
          if (response?.success && Array.isArray(response.notifications)) {
            this.alerts = response.notifications;
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

  loadAlerts(): void {
    this.loading = true;
    this.adviserService.getAdviserNotifications().subscribe({
      next: (response) => {
        console.log('✅ Notifications response:', response);
        if (response?.success && Array.isArray(response.notifications)) {
          this.alerts = response.notifications;
          console.log('✅ Loaded', this.alerts.length, 'notifications');
        } else {
          console.error('❌ Invalid response structure:', response);
        }
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
    console.log('Viewing student record:', alert.studentName);
  }
}
