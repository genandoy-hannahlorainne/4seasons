import { Component, HostListener, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { RouterModule, RouterOutlet, NavigationEnd } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { AdminNotificationPanelService, NotificationHistoryItem } from '../../../core/services/admin-notification-panel.service';
import { interval, Subscription } from 'rxjs';
import { filter, take } from 'rxjs/operators';

interface PasswordChangeRequest {
  notification_id: number;
  request_data: {
    user_id: number;
    username: string;
    full_name: string;
    role: string;
    reason: string;
    new_password?: string; // Optional for backward compatibility
  };
  timeAgo: string;
  created_at: string;
}

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet, TitleCasePipe],
  styleUrls: ['./admin-layout.component.scss'],
  template: `
    <div class="admin-shell" [class.collapsed]="isCollapsed" [class.mobile-open]="mobileOpen" [class.dashboard-route]="isOnDashboard">

      <!-- Mobile overlay -->
      <div class="sidebar-overlay" (click)="closeMobile()"></div>

      <!-- Logout overlay -->
      <div class="logout-overlay" *ngIf="loggingOut">
        <div class="logout-box">
          <div class="logout-spinner"></div>
          <p>Logging out...</p>
        </div>
      </div>

      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="sidebar-brand">
          <img src="assets/pdmhs-logo.png" alt="PDMHS Logo" class="brand-logo" (click)="toggleSidebar()" style="cursor:pointer">
          <span class="brand-text">PDMHS<br><small>Admin Panel</small></span>
          <button class="hamburger" (click)="mobileOpen ? closeMobile() : toggleSidebar()" title="Toggle sidebar">
            <span></span><span></span><span></span>
          </button>
        </div>

        <nav class="sidebar-nav">
          <a routerLink="/dashboard/admin" routerLinkActive="active"
             [routerLinkActiveOptions]="{exact: true}" class="nav-item" title="Dashboard" (click)="closeMobile()">
            <i class="bi bi-speedometer2 nav-icon"></i>
            <span class="nav-label">Dashboard</span>
          </a>

          <a routerLink="/dashboard/admin/manage-users" routerLinkActive="active" class="nav-item" title="Users" (click)="closeMobile()">
            <i class="bi bi-people-fill nav-icon"></i>
            <span class="nav-label">Users</span>
          </a>
          <a routerLink="/dashboard/admin/manage-sections" routerLinkActive="active" class="nav-item" title="Sections" (click)="closeMobile()">
            <i class="bi bi-grid-fill nav-icon"></i>
            <span class="nav-label">Sections</span>
          </a>
          <a routerLink="/dashboard/admin/school-year-management" routerLinkActive="active" class="nav-item" title="School Years" (click)="closeMobile()">
            <i class="bi bi-calendar-fill nav-icon"></i>
            <span class="nav-label">School Years</span>
          </a>
          <a routerLink="/dashboard/admin/grade-promotion" routerLinkActive="active" class="nav-item" title="Grade Promotion" (click)="closeMobile()">
            <i class="bi bi-arrow-up-circle-fill nav-icon"></i>
            <span class="nav-label">Grade Promotion</span>
          </a>
          <a routerLink="/dashboard/admin/emergency-drills" routerLinkActive="active" class="nav-item" title="Emergency Drills" (click)="closeMobile()">
            <i class="bi bi-exclamation-triangle-fill nav-icon"></i>
            <span class="nav-label">Emergency Drills</span>
          </a>
          <a routerLink="/dashboard/admin/settings" routerLinkActive="active" class="nav-item" title="Settings" (click)="closeMobile()">
            <i class="bi bi-gear-fill nav-icon"></i>
            <span class="nav-label">Settings</span>
          </a>
          <a routerLink="/dashboard/admin/reports" routerLinkActive="active" class="nav-item" title="Reports" (click)="closeMobile()">
            <i class="bi bi-bar-chart-fill nav-icon"></i>
            <span class="nav-label">Reports</span>
          </a>
        </nav>

        <div class="sidebar-footer">
          <a routerLink="/dashboard/admin/profile" routerLinkActive="active" class="nav-item" title="Profile" (click)="closeMobile()">
            <i class="bi bi-person-circle nav-icon"></i>
            <span class="nav-label">Profile</span>
          </a>
          <button class="nav-item logout-btn" (click)="logout()" title="Logout">
            <i class="bi bi-box-arrow-right nav-icon"></i>
            <span class="nav-label">Logout</span>
          </button>
        </div>
      </aside>

      <!-- Mobile topbar -->
      <header class="mobile-topbar">
        <button class="mobile-menu-btn" (click)="openMobile()">
          <span></span><span></span><span></span>
        </button>
        <span class="mobile-brand">PDMHS Admin</span>
        <button class="notification-bell mobile-notif-bell" [class.notif-active]="panelOpen" (click)="toggleNotificationPanel($event)" title="Notifications">
          <i class="bi bi-bell-fill"></i>
          <span class="notification-badge" *ngIf="unreadCount > 0">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
        </button>
      </header>

      <!-- Desktop topbar bell (hidden on dashboard — bell is in hero section) -->
      <header class="content-topbar" *ngIf="!isOnDashboard">
        <button class="notification-bell desktop-notif-bell" [class.notif-active]="panelOpen" (click)="toggleNotificationPanel($event)" title="Notifications">
          <i class="bi bi-bell-fill"></i>
          <span class="notification-badge" *ngIf="unreadCount > 0">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
        </button>
      </header>

      <!-- FB-style notification dropdown (does not cover whole page) -->
      <div class="notification-dropdown" *ngIf="panelOpen" [ngStyle]="dropdownPosition" (click)="$event.stopPropagation()">
        <div class="dropdown-header">
          <h3>Notifications</h3>
          <button class="dropdown-close" (click)="closeNotificationPanel()" title="Close">
            <i class="fa-solid fa-ellipsis"></i>
          </button>
        </div>

        <div class="dropdown-tabs">
          <button class="tab-pill" [class.active]="notifTab === 'all'" (click)="notifTab = 'all'">All</button>
          <button class="tab-pill" [class.active]="notifTab === 'unread'" (click)="notifTab = 'unread'">Unread</button>
          <button class="tab-pill" [class.active]="notifTab === 'password'" (click)="notifTab = 'password'">
            Password <span class="tab-count" *ngIf="passwordChangeRequests.length">{{ passwordChangeRequests.length }}</span>
          </button>
        </div>

        <div class="dropdown-content">
          <ng-container *ngIf="notifPanelService.notificationHistory$ | async as history">

            <!-- Password requests (All + Unread + Password tabs) -->
            <ng-container *ngIf="notifTab !== 'password' || passwordChangeRequests.length > 0">
              <div *ngFor="let request of visiblePasswordRequests(notifTab, history)"
                   class="fb-notif-item fb-notif-password fb-notif-unread">
                <div class="fb-notif-icon-wrap pending-icon">
                  <i class="fa-solid fa-key"></i>
                </div>
                <div class="fb-notif-body">
                  <div class="fb-notif-message fw-bold">
                    <strong>{{ request.request_data.full_name }}</strong> requested a password change
                    <span class="fb-notif-role">({{ request.request_data.role }})</span>
                  </div>
                  <div class="fb-notif-reason">{{ request.request_data.reason }}</div>
                  <div class="fb-notif-time">{{ request.timeAgo }}</div>
                  <div class="fb-notif-actions">
                    <button class="btn-fb-approve" (click)="approvePasswordChangeInline(request)">Approve</button>
                    <button class="btn-fb-dismiss" (click)="dismissPasswordChangeInline(request)">Dismiss</button>
                  </div>
                </div>
                <span class="unread-dot"></span>
              </div>
            </ng-container>

            <!-- History items (All + Unread tabs only) -->
            <ng-container *ngIf="notifTab !== 'password'">
              <div *ngIf="notifTab === 'all' && passwordChangeRequests.length > 0 && visibleHistory(notifTab, history).length > 0" class="dropdown-section-label">Clinic visits</div>
              <ng-container *ngFor="let notif of visibleHistory(notifTab, history)">
                <div class="fb-notif-item"
                     [class.fb-notif-unread]="isUnread(notif)"
                     (click)="openHistoryModal(notif)">
                  <div class="fb-notif-icon-wrap"
                       [ngClass]="notif.priority === 'urgent' || notif.notification_type === 'emergency_visit' ? 'urgent-icon' : 'normal-icon'">
                    <i class="fa-solid" [ngClass]="notifPanelService.getNotificationIcon(notif)"></i>
                  </div>
                  <div class="fb-notif-body">
                    <div class="fb-notif-message" [class.fw-bold]="isUnread(notif)">{{ notif.message }}</div>
                    <div class="fb-notif-meta">
                      <span *ngIf="notif.visit?.visit_type" class="visit-type-tag">{{ notif.visit?.visit_type }}</span>
                      <span *ngIf="notif.student">{{ notif.student.full_name }}</span>
                      <span *ngIf="notif.staff?.name"> · {{ notif.staff?.name }}</span>
                      <span class="fb-notif-time"> · {{ notif.timeAgo }}</span>
                    </div>
                  </div>
                  <span class="unread-dot" *ngIf="isUnread(notif)"></span>
                </div>
              </ng-container>
            </ng-container>

            <!-- Empty states -->
            <div *ngIf="isDropdownEmpty(notifTab, history)" class="no-notifications">
              <i class="fa-solid fa-bell-slash"></i>
              <p>{{ notifTab === 'unread' ? 'No unread notifications' : notifTab === 'password' ? 'No password requests' : 'No notifications' }}</p>
            </div>
          </ng-container>
        </div>
      </div>

      <!-- Main content -->
      <main class="main-content">
        <router-outlet></router-outlet>
      </main>

      <!-- History Notification Detail Modal -->
      <div class="modal-overlay" *ngIf="showHistoryModal" (click)="closeHistoryModal()">
        <div class="modal-content history-modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>
              <i class="fa-solid" [ngClass]="selectedHistoryNotif ? notifPanelService.getNotificationIcon(selectedHistoryNotif) : 'fa-bell'"></i>
              Notification Details
            </h3>
            <button class="modal-close" (click)="closeHistoryModal()">
              <i class="fa-solid fa-times"></i>
            </button>
          </div>

          <div class="modal-body" *ngIf="selectedHistoryNotif">
            <div class="request-details">
              <div class="detail-row">
                <span class="detail-label">Message:</span>
                <span class="detail-value">{{ selectedHistoryNotif.message }}</span>
              </div>
              <div class="detail-row" *ngIf="selectedHistoryNotif.notification_type">
                <span class="detail-label">Type:</span>
                <span class="detail-value role-badge">{{ selectedHistoryNotif.notification_type | titlecase }}</span>
              </div>
              <div class="detail-row" *ngIf="selectedHistoryNotif.priority">
                <span class="detail-label">Priority:</span>
                <span class="detail-value" [ngClass]="selectedHistoryNotif.priority === 'urgent' ? 'role-badge' : ''">
                  {{ selectedHistoryNotif.priority | titlecase }}
                </span>
              </div>
              <div class="detail-row" *ngIf="selectedHistoryNotif.visit?.visit_type">
                <span class="detail-label">Visit type:</span>
                <span class="detail-value role-badge">{{ selectedHistoryNotif.visit?.visit_type }}</span>
              </div>
              <div class="detail-row" *ngIf="selectedHistoryNotif.student">
                <span class="detail-label">Student:</span>
                <span class="detail-value">
                  {{ selectedHistoryNotif.student.full_name }}
                  <span style="color:#6b7280"> ({{ selectedHistoryNotif.student.student_number }})</span>
                </span>
              </div>
              <div class="detail-row" *ngIf="selectedHistoryNotif.staff?.name">
                <span class="detail-label">Clinic staff:</span>
                <span class="detail-value">{{ selectedHistoryNotif.staff?.name }}</span>
              </div>
              <div class="detail-row" *ngIf="selectedHistoryNotif.user && !selectedHistoryNotif.student">
                <span class="detail-label">User:</span>
                <span class="detail-value">
                  {{ selectedHistoryNotif.user.full_name }}
                  <span style="color:#6b7280"> ({{ selectedHistoryNotif.user.role }})</span>
                </span>
              </div>
              <div class="detail-row" *ngIf="selectedHistoryNotif['request_data']?.reason">
                <span class="detail-label">Reason:</span>
                <span class="detail-value reason-text">{{ selectedHistoryNotif['request_data'].reason }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Status:</span>
                <span class="detail-value">
                  <span class="history-notif-status" [ngClass]="selectedHistoryNotif.status?.toLowerCase()">
                    {{ selectedHistoryNotif.status }}
                  </span>
                </span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Time:</span>
                <span class="detail-value">{{ selectedHistoryNotif.timeAgo }}</span>
              </div>
            </div>
          </div>

        </div>
      </div>

    </div>
  `,
})
export class AdminLayoutComponent implements OnInit, OnDestroy {
  isCollapsed = false;
  mobileOpen = false;
  loggingOut = false;
  isOnDashboard = false;

  // Notification system
  showHistoryModal = false;
  selectedHistoryNotif: NotificationHistoryItem | null = null;
  readHistoryIds = new Set<number>();
  passwordChangeRequests: PasswordChangeRequest[] = [];
  unreadCount = 0;
  notifTab: 'all' | 'unread' | 'password' = 'all';
  panelOpen = false;
  dropdownPosition: { top: string; right: string; maxHeight: string } = {
    top: '64px',
    right: '20px',
    maxHeight: '520px',
  };
  private pollSubscription?: Subscription;

  constructor(
    private authService: AuthService,
    private router: Router,
    private adminService: AdminService,
    public notifPanelService: AdminNotificationPanelService
  ) {}

  ngOnInit(): void {
    this.updateDashboardRoute(this.router.url);
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe((e) => {
      this.updateDashboardRoute((e as NavigationEnd).urlAfterRedirects);
    });

    this.notifPanelService.open$.subscribe(open => {
      this.panelOpen = open;
    });
    this.notifPanelService.anchor$.subscribe(anchor => {
      const maxH = Math.max(200, window.innerHeight - anchor.top - 16);
      this.dropdownPosition = {
        top: `${anchor.top}px`,
        right: `${anchor.right}px`,
        maxHeight: `${Math.min(520, maxH)}px`,
      };
    });

    this.loadNotifications();
    // Poll for new notifications every 30 seconds
    this.pollSubscription = interval(30000).subscribe(() => {
      this.loadNotifications();
    });
    // Reset read state when history refreshes
    this.notifPanelService.notificationHistory$.subscribe(() => {
      this.readHistoryIds.clear();
    });
  }

  ngOnDestroy(): void {
    this.pollSubscription?.unsubscribe();
    document.body.style.overflow = '';
  }

  private updateDashboardRoute(url: string): void {
    const path = url.split('?')[0].replace(/\/$/, '');
    this.isOnDashboard = path === '/dashboard/admin';
  }

  loadNotifications(): void {
    this.adminService.getNotifications().subscribe({
      next: (response) => {
        // Notifications response received
        if (response?.success && response?.data?.notifications) {
          const allNotifications = response.data.notifications;

          if (!Array.isArray(allNotifications)) {
            // Notifications is not an array
            return;
          }

          this.passwordChangeRequests = allNotifications
            .filter((n: any) => n.notification_type === 'password_change_request' && n.status === 'Pending')
            .map((n: any) => ({
              notification_id: n.notification_id,
              request_data: n.request_data,
              timeAgo: this.formatTimeAgo(n.created_at),
              created_at: n.created_at
            }));

          const mapped = allNotifications.map((n: any) => ({
            ...n,
            timeAgo: n.timeAgo || this.formatTimeAgo(n.created_at),
          }));

          const feed = this.notifPanelService.buildAdminFeed(mapped);
          this.notifPanelService.setNotificationHistory(feed);
          this.updateUnreadCount(feed);
        } else {
          // Invalid response structure
        }
      },
      error: (err) => {
        // Failed to load notifications
      }
    });
  }

  formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  }

  toggleNotificationPanel(event?: Event): void {
    event?.stopPropagation();
    this.closeMobile();
    const trigger = event?.currentTarget as HTMLElement | undefined;
    this.notifPanelService.toggleFromAnchor(trigger);
  }

  closeNotificationPanel(): void {
    this.notifPanelService.close();
  }

  visiblePasswordRequests(tab: 'all' | 'unread' | 'password', history: NotificationHistoryItem[]): PasswordChangeRequest[] {
    if (tab === 'password') return this.passwordChangeRequests;
    if (tab === 'unread') return this.passwordChangeRequests;
    return this.passwordChangeRequests;
  }

  visibleHistory(tab: 'all' | 'unread' | 'password', history: NotificationHistoryItem[]): NotificationHistoryItem[] {
    if (tab === 'password') return [];
    if (tab === 'unread') return history.filter(n => this.isUnread(n));
    return history;
  }

  isDropdownEmpty(tab: 'all' | 'unread' | 'password', history: NotificationHistoryItem[]): boolean {
    const pw = this.visiblePasswordRequests(tab, history).length;
    const hist = this.visibleHistory(tab, history).length;
    return pw === 0 && hist === 0;
  }

  private updateUnreadCount(history: NotificationHistoryItem[]): void {
    const unreadHistory = history.filter(n => this.isUnread(n)).length;
    this.unreadCount = this.passwordChangeRequests.length + unreadHistory;
    this.notifPanelService.setUnreadCount(this.unreadCount);
  }

  isUnread(notif: NotificationHistoryItem): boolean {
    if (notif.notification_id == null) return false;
    if (this.notifPanelService.isPasswordRequest(notif)) return false;
    if (notif.status === 'Pending') {
      return !this.readHistoryIds.has(notif.notification_id);
    }
    return false;
  }

  hasUnreadHistory(history: NotificationHistoryItem[]): boolean {
    return history.some(n => this.isUnread(n));
  }

  openHistoryModal(notif: NotificationHistoryItem): void {
    this.selectedHistoryNotif = notif;
    this.showHistoryModal = true;
    if (notif.notification_id == null) return;

    this.readHistoryIds.add(notif.notification_id);
    if (notif.status === 'Pending') {
      this.adminService.markNotificationAsRead(notif.notification_id).subscribe({
        next: () => this.loadNotifications(),
        error: () => this.updateUnreadCountFromFeed(),
      });
    } else {
      this.updateUnreadCountFromFeed();
    }
  }

  private updateUnreadCountFromFeed(): void {
    this.notifPanelService.notificationHistory$.pipe(take(1)).subscribe(history => {
      this.updateUnreadCount(history);
    });
  }

  closeHistoryModal(): void {
    this.showHistoryModal = false;
    this.selectedHistoryNotif = null;
  }

  approvePasswordChangeInline(request: PasswordChangeRequest): void {
    const userName = request.request_data?.full_name || 'this user';
    const username = request.request_data?.username || '';
    const hasNewPassword = !!request.request_data?.new_password;

    this.adminService.approvePasswordChangeRequest(request.notification_id).subscribe({
      next: (response) => {
        if (response?.success) {
          if (hasNewPassword) {
            alert(`Password changed successfully for ${userName}!\n\nUsername: ${username}\n\nThe user can now login with their new password.`);
          } else {
            const tempPassword = response.data?.temp_password;
            alert(`Password reset successfully!\n\nUsername: ${username}\nTemporary Password: ${tempPassword}\n\nPlease provide this information to the user securely.`);
          }
          this.removePasswordRequest(request.notification_id);
        } else {
          alert('Failed to approve password change: ' + (response?.message || 'Unknown error'));
        }
      },
      error: (err) => {
        const errorMessage = err.error?.message || err.message || 'Unknown error occurred';
        alert('Error approving password change request: ' + errorMessage);
      }
    });
  }

  dismissPasswordChangeInline(request: PasswordChangeRequest): void {
    const userName = request.request_data?.full_name || 'this user';
    if (!confirm(`Dismiss password change request from ${userName}?`)) return;

    this.adminService.dismissPasswordChangeRequest(request.notification_id).subscribe({
      next: (response) => {
        if (response?.success) {
          this.removePasswordRequest(request.notification_id);
        }
      },
      error: () => alert('Error dismissing request')
    });
  }

  private removePasswordRequest(_notificationId: number): void {
    this.loadNotifications();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.notification-bell') &&
        !target.closest('.hero-notif-bell') &&
        !target.closest('.notification-dropdown')) {
      this.notifPanelService.close();
    }
  }

  toggleSidebar(): void { this.isCollapsed = !this.isCollapsed; }
  openMobile(): void {
    this.mobileOpen = true;
    document.body.style.overflow = 'hidden';
  }
  closeMobile(): void {
    this.mobileOpen = false;
    document.body.style.overflow = '';
  }

  logout(): void {
    this.loggingOut = true;
    this.authService.logout().subscribe({
      complete: () => window.location.replace('/login'),
      error: () => window.location.replace('/login')
    });
  }
}
