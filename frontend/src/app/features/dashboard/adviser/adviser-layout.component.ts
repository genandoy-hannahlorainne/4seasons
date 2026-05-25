import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth.service';
import { AdviserService } from '../../../core/services/adviser.service';
import { AdviserNotificationPanelService } from '../../../core/services/adviser-notification-panel.service';
import { PushNotificationService } from '../../../core/services/push-notification.service';
import { interval, Subscription } from 'rxjs';
import { AdviserNotificationBellComponent } from './shared/adviser-notification-bell.component';

interface AdviserAlert {
  id: number;
  studentId?: number;
  student_id?: number;
  senderName: string;
  senderRole: string;
  studentName: string;
  studentNumber: string;
  subject: string;
  previewText: string;
  fullMessage: string;
  timeAgo: string;
  fullDate: string;
  createdAt: string;
  visitType: string;
  priority: 'urgent' | 'normal';
  isRead: boolean;
}

@Component({
  selector: 'app-adviser-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet, AdviserNotificationBellComponent],
  styleUrls: ['./adviser-layout.component.scss'],
  template: `
    <div class="adviser-shell" [class.collapsed]="isCollapsed" [class.mobile-open]="mobileOpen">

      <!-- Logout overlay -->
      <div class="logout-overlay" *ngIf="loggingOut">
        <div class="logout-box">
          <div class="logout-spinner"></div>
          <p>Logging out...</p>
        </div>
      </div>

      <!-- Mobile overlay -->
      <div class="sidebar-overlay" (click)="closeMobile()"></div>

      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="sidebar-brand">
          <img src="assets/pdmhs-logo.png" alt="PDMHS Logo" class="brand-logo" (click)="toggleSidebar()" style="cursor:pointer">
          <span class="brand-text">PDMHS<br><small>Adviser Panel</small></span>
          <button class="hamburger" (click)="mobileOpen ? closeMobile() : toggleSidebar()" title="Toggle sidebar">
            <span></span><span></span><span></span>
          </button>
        </div>

        <nav class="sidebar-nav">
          <a routerLink="/dashboard/adviser" routerLinkActive="active"
             [routerLinkActiveOptions]="{exact: true}" class="nav-item" title="Dashboard" (click)="closeMobile()">
            <i class="fa-solid fa-house nav-icon-fa"></i>
            <span class="nav-label">Dashboard</span>
          </a>
          <a routerLink="/dashboard/adviser/health-monitoring" routerLinkActive="active" class="nav-item" title="Health Monitor" (click)="closeMobile()">
            <i class="fa-solid fa-chart-line nav-icon-fa"></i>
            <span class="nav-label">Health Monitor</span>
          </a>
          <a routerLink="/dashboard/adviser/shdf-download" routerLinkActive="active" class="nav-item" title="SHDF Download" (click)="closeMobile()">
            <i class="fa-solid fa-download nav-icon-fa"></i>
            <span class="nav-label">Download SHDF</span>
          </a>
          <a routerLink="/dashboard/adviser/class-management" routerLinkActive="active" class="nav-item" title="My Class" (click)="closeMobile()">
            <i class="fa-solid fa-users nav-icon-fa"></i>
            <span class="nav-label">My Class</span>
          </a>
        </nav>

        <div class="sidebar-footer">
          <a routerLink="/dashboard/adviser/profile" routerLinkActive="active" class="nav-item" title="Profile" (click)="closeMobile()">
            <i class="fa-solid fa-user nav-icon-fa"></i>
            <span class="nav-label">Profile</span>
          </a>
          <button class="nav-item logout-btn" (click)="logout()" title="Logout">
            <i class="fa-solid fa-right-from-bracket nav-icon-fa"></i>
            <span class="nav-label">Logout</span>
          </button>
        </div>
      </aside>

      <!-- Mobile topbar -->
      <header class="mobile-topbar">
        <button class="mobile-menu-btn" (click)="openMobile()">
          <span></span><span></span><span></span>
        </button>
        <span class="mobile-brand">PDMHS Adviser</span>
        <app-adviser-notification-bell *ngIf="!isDashboardRoute" variant="topbar" class="mobile-topbar-bell" />
      </header>

      <!-- Notification Side Panel -->
      <div class="notification-panel-overlay" *ngIf="notifPanelService.open$ | async" (click)="closeNotificationPanel()">
        <div class="notification-panel" (click)="$event.stopPropagation()">

          <div class="panel-header">
            <h3>Notifications</h3>
            <button class="panel-close" (click)="closeNotificationPanel()">
              <i class="fa-solid fa-times"></i>
            </button>
          </div>

          <div class="panel-tabs">
            <button class="tab-btn" [class.active]="showAllTab" (click)="showAllTab = true">All</button>
            <button class="tab-btn" [class.active]="!showAllTab" (click)="showAllTab = false">Unread</button>
            <button class="mark-all-btn" *ngIf="unreadCount > 0" (click)="markAllAsRead()">
              <i class="fa-solid fa-check-double"></i> Mark all as read
            </button>
          </div>

          <div class="panel-content">

            <!-- ALL TAB -->
            <ng-container *ngIf="showAllTab">
              <div *ngFor="let alert of alerts"
                   class="fb-notif-item"
                   [class.fb-notif-unread]="!alert.isRead"
                   (click)="openAlertDetail(alert)">
                <div class="fb-notif-icon-wrap" [ngClass]="alert.priority === 'urgent' ? 'urgent-icon' : 'normal-icon'">
                  <i class="fa-solid" [ngClass]="alert.priority === 'urgent' ? 'fa-triangle-exclamation' : 'fa-circle-info'"></i>
                </div>
                <div class="fb-notif-body">
                  <div class="fb-notif-message" [class.fw-bold]="!alert.isRead">
                    <strong>{{ alert.studentName }}</strong> — {{ alert.subject }}
                  </div>
                  <div class="fb-notif-meta">{{ alert.senderName }} · <span class="fb-notif-time">{{ alert.timeAgo }}</span></div>
                </div>
                <span class="unread-dot" *ngIf="!alert.isRead"></span>
              </div>

              <div *ngIf="alerts.length === 0" class="no-notifications">
                <i class="fa-solid fa-bell-slash"></i>
                <p>No notifications</p>
              </div>
            </ng-container>

            <!-- UNREAD TAB -->
            <ng-container *ngIf="!showAllTab">
              <div *ngFor="let alert of unreadAlerts"
                   class="fb-notif-item fb-notif-unread"
                   (click)="openAlertDetail(alert)">
                <div class="fb-notif-icon-wrap" [ngClass]="alert.priority === 'urgent' ? 'urgent-icon' : 'normal-icon'">
                  <i class="fa-solid" [ngClass]="alert.priority === 'urgent' ? 'fa-triangle-exclamation' : 'fa-circle-info'"></i>
                </div>
                <div class="fb-notif-body">
                  <div class="fb-notif-message fw-bold">
                    <strong>{{ alert.studentName }}</strong> — {{ alert.subject }}
                  </div>
                  <div class="fb-notif-meta">{{ alert.senderName }} · <span class="fb-notif-time">{{ alert.timeAgo }}</span></div>
                </div>
                <span class="unread-dot"></span>
              </div>

              <div *ngIf="unreadAlerts.length === 0" class="no-notifications">
                <i class="fa-solid fa-bell-slash"></i>
                <p>No unread notifications</p>
              </div>
            </ng-container>

          </div>
        </div>
      </div>

      <!-- Alert Detail Modal -->
      <div class="modal-overlay" *ngIf="selectedAlert" (click)="closeAlertDetail()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>
              <i class="fa-solid" [ngClass]="selectedAlert!.priority === 'urgent' ? 'fa-triangle-exclamation' : 'fa-circle-info'"></i>
              Notification Details
            </h3>
            <button class="modal-close" (click)="closeAlertDetail()"><i class="fa-solid fa-times"></i></button>
          </div>
          <div class="modal-body">
            <div class="request-details">
              <div class="detail-row">
                <span class="detail-label">Student:</span>
                <span class="detail-value">{{ selectedAlert!.studentName }} <span class="muted">({{ selectedAlert!.studentNumber }})</span></span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Subject:</span>
                <span class="detail-value">{{ selectedAlert!.subject }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">From:</span>
                <span class="detail-value">{{ selectedAlert!.senderName }} <span class="muted">({{ selectedAlert!.senderRole }})</span></span>
              </div>
              <div class="detail-row" *ngIf="selectedAlert!.visitType">
                <span class="detail-label">Visit Type:</span>
                <span class="detail-value">{{ selectedAlert!.visitType }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Priority:</span>
                <span class="detail-value">
                  <span class="priority-chip" [ngClass]="selectedAlert!.priority">
                    <i class="fa-solid" [ngClass]="selectedAlert!.priority === 'urgent' ? 'fa-triangle-exclamation' : 'fa-circle-info'"></i>
                    {{ selectedAlert!.priority === 'urgent' ? 'Urgent' : 'Notice' }}
                  </span>
                </span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Time:</span>
                <span class="detail-value">{{ selectedAlert!.fullDate || selectedAlert!.timeAgo }}</span>
              </div>
            </div>
            <div class="message-box">
              <p>{{ selectedAlert!.fullMessage }}</p>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" (click)="closeAlertDetail()">Close</button>
            <button class="btn-primary" (click)="viewStudentRecord(selectedAlert!)">
              <i class="fa-solid fa-user"></i> View Student Record
            </button>
          </div>
        </div>
      </div>

      <!-- Main content -->
      <main class="main-content">
        <router-outlet></router-outlet>
      </main>

    </div>
  `,
})
export class AdviserLayoutComponent implements OnInit, OnDestroy {
  isCollapsed = false;
  mobileOpen = false;
  isDashboardRoute = false;
  loggingOut = false;
  showAllTab = true;
  alerts: AdviserAlert[] = [];
  selectedAlert: AdviserAlert | null = null;
  unreadCount = 0;
  private pollSub?: Subscription;
  private pushSub?: Subscription;

  constructor(
    private authService: AuthService,
    private router: Router,
    private adviserService: AdviserService,
    public notifPanelService: AdviserNotificationPanelService,
    private pushNotificationService: PushNotificationService
  ) {}

  get unreadAlerts(): AdviserAlert[] {
    return this.alerts.filter(a => !a.isRead);
  }

  ngOnInit(): void {
    this.updateDashboardRoute(this.router.url);
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(e => this.updateDashboardRoute(e.urlAfterRedirects));

    this.loadNotifications();
    // Poll every 30 seconds as a fallback
    this.pollSub = interval(30000).subscribe(() => this.loadNotifications());
    // Refresh immediately when a foreground FCM push arrives (app is open)
    this.pushSub = this.pushNotificationService.foregroundMessage$.subscribe(() => {
      this.loadNotifications();
    });
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
    this.pushSub?.unsubscribe();
  }

  loadNotifications(): void {
    this.adviserService.getAdviserNotifications().subscribe({
      next: (response) => {
        let notifications: any[] = [];
        if (response?.success && response.data?.notifications) {
          notifications = response.data.notifications;
        } else if (response?.success && Array.isArray(response.notifications)) {
          notifications = response.notifications;
        } else if (Array.isArray(response?.notifications)) {
          notifications = response.notifications;
        }
        this.alerts = notifications.map((n: any) => ({
          ...n,
          studentId: n.studentId ?? n.student_id,
          isRead: n.isRead ?? false
        }));
        this.unreadCount = this.alerts.filter(a => !a.isRead).length;
        this.notifPanelService.setUnreadCount(this.unreadCount);
      },
      error: () => {}
    });
  }

  private updateDashboardRoute(url: string): void {
    const path = url.split('?')[0].replace(/\/$/, '');
    this.isDashboardRoute =
      path === '/dashboard/adviser' || path.endsWith('/dashboard/adviser');
  }

  closeNotificationPanel(): void {
    this.notifPanelService.close();
  }

  openAlertDetail(alert: AdviserAlert): void {
    alert.isRead = true;
    this.unreadCount = this.alerts.filter(a => !a.isRead).length;
    this.notifPanelService.setUnreadCount(this.unreadCount);
    this.selectedAlert = alert;
    this.notifPanelService.close();
  }

  closeAlertDetail(): void {
    this.selectedAlert = null;
  }

  markAllAsRead(): void {
    this.alerts.forEach(a => a.isRead = true);
    this.unreadCount = 0;
    this.notifPanelService.setUnreadCount(0);
  }

  viewStudentRecord(alert: AdviserAlert): void {
    const studentId = alert.studentId ?? alert.student_id;
    if (!studentId) return;
    this.closeAlertDetail();
    this.router.navigate(['/dashboard/adviser/students', studentId]);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.adviser-notif-bell') &&
        !target.closest('.notification-panel')) {
      this.notifPanelService.close();
    }
  }

  toggleSidebar(): void { this.isCollapsed = !this.isCollapsed; }
  openMobile(): void { this.mobileOpen = true; }
  closeMobile(): void { this.mobileOpen = false; }

  logout(): void {
    this.loggingOut = true;
    this.authService.logout().subscribe({
      complete: () => window.location.replace('/login'),
      error: () => window.location.replace('/login')
    });
  }
}
