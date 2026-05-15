import { Component, HostListener, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { RouterModule, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { AdminNotificationPanelService, NotificationHistoryItem } from '../../../core/services/admin-notification-panel.service';
import { interval, Subscription } from 'rxjs';

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
    <div class="admin-shell" [class.collapsed]="isCollapsed" [class.mobile-open]="mobileOpen">

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
        <!-- Mobile notification bell -->
        <button class="notification-bell mobile-notif-bell" (click)="toggleNotificationPanel()" title="Notifications">
          <i class="bi bi-bell-fill"></i>
          <span class="notification-badge" *ngIf="unreadCount > 0">{{ unreadCount }}</span>
        </button>
      </header>

      <!-- Content topbar with notification bell — REMOVED, bell is now inside hero section -->

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
            <button
              class="tab-btn"
              [class.active]="showAllTab"
              (click)="showAllTab = true">
              All
            </button>
            <button
              class="tab-btn"
              [class.active]="!showAllTab"
              (click)="showAllTab = false">
              Unread
            </button>
          </div>

          <div class="panel-content">
            <ng-container *ngIf="notifPanelService.notificationHistory$ | async as history">

              <!-- ALL TAB -->
              <ng-container *ngIf="showAllTab">
                <!-- Password change requests (always unread/pending) -->
                <div *ngFor="let request of passwordChangeRequests"
                     class="fb-notif-item fb-notif-unread"
                     (click)="openNotificationModal(request)">
                  <div class="fb-notif-icon-wrap pending-icon">
                    <i class="fa-solid fa-key"></i>
                  </div>
                  <div class="fb-notif-body">
                    <div class="fb-notif-message fw-bold">
                      Password change request from <strong>{{ request.request_data.full_name }}</strong>
                      <span class="fb-notif-role">({{ request.request_data.role }})</span>
                    </div>
                    <div class="fb-notif-reason">{{ request.request_data.reason }}</div>
                    <div class="fb-notif-time">{{ request.timeAgo }}</div>
                  </div>
                  <span class="unread-dot"></span>
                </div>

                <!-- History items -->
                <div *ngFor="let notif of history"
                     class="fb-notif-item"
                     [class.fb-notif-unread]="isUnread(notif)"
                     (click)="openHistoryModal(notif)">
                  <div class="fb-notif-icon-wrap" [ngClass]="notif.priority === 'urgent' ? 'urgent-icon' : 'normal-icon'">
                    <i class="fa-solid" [ngClass]="notifPanelService.getNotificationIcon(notif)"></i>
                  </div>
                  <div class="fb-notif-body">
                    <div class="fb-notif-message" [class.fw-bold]="isUnread(notif)">{{ notif.message }}</div>
                    <div class="fb-notif-meta">
                      <span *ngIf="notif.student">{{ notif.student.full_name }} · </span>
                      <span *ngIf="notif.user && !notif.student">{{ notif.user.full_name }} · </span>
                      <span class="fb-notif-time">{{ notif.timeAgo }}</span>
                    </div>
                  </div>
                  <span class="unread-dot" *ngIf="isUnread(notif)"></span>
                </div>

                <!-- Empty state -->
                <div *ngIf="passwordChangeRequests.length === 0 && history.length === 0" class="no-notifications">
                  <i class="fa-solid fa-bell-slash"></i>
                  <p>No notifications</p>
                </div>
              </ng-container>

              <!-- UNREAD TAB -->
              <ng-container *ngIf="!showAllTab">
                <!-- Pending requests are always unread -->
                <div *ngFor="let request of passwordChangeRequests"
                     class="fb-notif-item fb-notif-unread"
                     (click)="openNotificationModal(request)">
                  <div class="fb-notif-icon-wrap pending-icon">
                    <i class="fa-solid fa-key"></i>
                  </div>
                  <div class="fb-notif-body">
                    <div class="fb-notif-message fw-bold">
                      Password change request from <strong>{{ request.request_data.full_name }}</strong>
                      <span class="fb-notif-role">({{ request.request_data.role }})</span>
                    </div>
                    <div class="fb-notif-reason">{{ request.request_data.reason }}</div>
                    <div class="fb-notif-time">{{ request.timeAgo }}</div>
                  </div>
                  <span class="unread-dot"></span>
                </div>

                <!-- Only unread history items -->
                <ng-container *ngFor="let notif of history">
                  <div *ngIf="isUnread(notif)"
                       class="fb-notif-item fb-notif-unread"
                       (click)="openHistoryModal(notif)">
                    <div class="fb-notif-icon-wrap" [ngClass]="notif.priority === 'urgent' ? 'urgent-icon' : 'normal-icon'">
                      <i class="fa-solid" [ngClass]="notifPanelService.getNotificationIcon(notif)"></i>
                    </div>
                    <div class="fb-notif-body">
                      <div class="fb-notif-message fw-bold">{{ notif.message }}</div>
                      <div class="fb-notif-meta">
                        <span *ngIf="notif.student">{{ notif.student.full_name }} · </span>
                        <span *ngIf="notif.user && !notif.student">{{ notif.user.full_name }} · </span>
                        <span class="fb-notif-time">{{ notif.timeAgo }}</span>
                      </div>
                    </div>
                    <span class="unread-dot"></span>
                  </div>
                </ng-container>

                <!-- Empty state -->
                <div *ngIf="passwordChangeRequests.length === 0 && !hasUnreadHistory(history)" class="no-notifications">
                  <i class="fa-solid fa-bell-slash"></i>
                  <p>No unread notifications</p>
                </div>
              </ng-container>

            </ng-container>
          </div>
        </div>
      </div>

      <!-- Notification Modal -->
      <div class="modal-overlay" *ngIf="showNotificationModal" (click)="closeNotificationModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3><i class="fa-solid fa-key"></i> Password Change Request</h3>
            <button class="modal-close" (click)="closeNotificationModal()">
              <i class="fa-solid fa-times"></i>
            </button>
          </div>

          <div class="modal-body" *ngIf="selectedRequest">
            <div class="request-details">
              <div class="detail-row">
                <span class="detail-label">Name:</span>
                <span class="detail-value">{{ selectedRequest.request_data.full_name }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Role:</span>
                <span class="detail-value role-badge">{{ selectedRequest.request_data.role }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Username:</span>
                <span class="detail-value">{{ selectedRequest.request_data.username }}</span>
              </div>
              <div class="detail-row" *ngIf="selectedRequest.request_data.new_password">
                <span class="detail-label">New Password:</span>
                <span class="detail-value" style="font-family: monospace; background: #f5f5f5; padding: 4px 8px; border-radius: 4px;">{{ selectedRequest.request_data.new_password }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Reason:</span>
                <span class="detail-value reason-text">{{ selectedRequest.request_data.reason }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Requested:</span>
                <span class="detail-value">{{ selectedRequest.timeAgo }}</span>
              </div>
            </div>

            <div class="modal-info">
              <i class="fa-solid fa-circle-info"></i>
              <p *ngIf="selectedRequest.request_data.new_password">Approving this request will set the user's password to their requested password.</p>
              <p *ngIf="!selectedRequest.request_data.new_password">Approving this request will generate a temporary password and require the user to change it on next login.</p>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn-modal-dismiss" (click)="dismissPasswordChange()">
              <i class="fa-solid fa-times"></i> Dismiss
            </button>
            <button class="btn-modal-approve" (click)="approvePasswordChange()">
              <i class="fa-solid fa-check"></i> Approve Password Change
            </button>
          </div>
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
              <div class="detail-row" *ngIf="selectedHistoryNotif.student">
                <span class="detail-label">Student:</span>
                <span class="detail-value">
                  {{ selectedHistoryNotif.student.full_name }}
                  <span style="color:#6b7280"> ({{ selectedHistoryNotif.student.student_number }})</span>
                </span>
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

  // Notification system
  showNotificationModal = false;
  showHistoryModal = false;
  selectedRequest: PasswordChangeRequest | null = null;
  selectedHistoryNotif: NotificationHistoryItem | null = null;
  readHistoryIds = new Set<number>();
  passwordChangeRequests: PasswordChangeRequest[] = [];
  unreadCount = 0;
  showAllTab = true; // true = All, false = Unread
  private pollSubscription?: Subscription;

  constructor(
    private authService: AuthService,
    private router: Router,
    private adminService: AdminService,
    public notifPanelService: AdminNotificationPanelService
  ) {}

  ngOnInit(): void {
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
          this.unreadCount = this.passwordChangeRequests.length;
          this.notifPanelService.setUnreadCount(this.unreadCount);
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

  toggleNotificationPanel(): void {
    this.closeMobile();
    this.notifPanelService.toggle();
  }

  closeNotificationPanel(): void {
    this.notifPanelService.close();
  }

  openNotificationModal(request: PasswordChangeRequest): void {
    this.selectedRequest = request;
    this.showNotificationModal = true;
    this.notifPanelService.close();
  }

  closeNotificationModal(): void {
    this.showNotificationModal = false;
    this.selectedRequest = null;
  }

  isUnread(notif: NotificationHistoryItem): boolean {
    if (notif.notification_id == null) return false;
    return !this.readHistoryIds.has(notif.notification_id);
  }

  hasUnreadHistory(history: NotificationHistoryItem[]): boolean {
    return history.some(n => this.isUnread(n));
  }

  openHistoryModal(notif: NotificationHistoryItem): void {
    this.selectedHistoryNotif = notif;
    this.showHistoryModal = true;
    this.notifPanelService.close();
    // Mark as read
    if (notif.notification_id != null) {
      this.readHistoryIds.add(notif.notification_id);
    }
  }

  closeHistoryModal(): void {
    this.showHistoryModal = false;
    this.selectedHistoryNotif = null;
  }

  approvePasswordChange(): void {
    if (!this.selectedRequest) return;

    const request = this.selectedRequest;
    const userName = request.request_data?.full_name || 'this user';
    const username = request.request_data?.username || '';
    const hasNewPassword = !!request.request_data?.new_password;

    // Approve password change request
    this.adminService.approvePasswordChangeRequest(request.notification_id).subscribe({
      next: (response) => {
        if (response?.success) {
          if (hasNewPassword) {
            // New flow: User chose their own password
            alert(`Password changed successfully for ${userName}!\n\nUsername: ${username}\n\nThe user can now login with their new password.`);
          } else {
            // Old flow: Temporary password generated
            const tempPassword = response.data?.temp_password;
            alert(`Password reset successfully!\n\nUsername: ${username}\nTemporary Password: ${tempPassword}\n\nPlease provide this information to the user securely.`);
          }

          this.passwordChangeRequests = this.passwordChangeRequests.filter(
            r => r.notification_id !== request.notification_id
          );
          this.unreadCount = this.passwordChangeRequests.length;
          this.notifPanelService.setUnreadCount(this.unreadCount);
          this.closeNotificationModal();
        } else {
          // Failed response
          alert('Failed to approve password change: ' + (response?.message || 'Unknown error'));
        }
      },
      error: (err) => {
        // Failed to approve password change
        const errorMessage = err.error?.message || err.message || 'Unknown error occurred';
        alert('Error approving password change request: ' + errorMessage);
      }
    });
  }

  dismissPasswordChange(): void {
    if (!this.selectedRequest) return;

    const request = this.selectedRequest;
    const userName = request.request_data?.full_name || 'this user';

    if (confirm(`Dismiss password change request from ${userName}?`)) {
      this.adminService.dismissPasswordChangeRequest(request.notification_id).subscribe({
        next: (response) => {
          if (response?.success) {
            this.passwordChangeRequests = this.passwordChangeRequests.filter(
              r => r.notification_id !== request.notification_id
            );
            this.unreadCount = this.passwordChangeRequests.length;
            this.notifPanelService.setUnreadCount(this.unreadCount);
            this.closeNotificationModal();
          }
        },
        error: (err) => {
          // Failed to dismiss request
          alert('Error dismissing request');
        }
      });
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.notification-bell') &&
        !target.closest('.notification-panel')) {
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
