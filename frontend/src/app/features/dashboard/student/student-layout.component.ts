import { Component, HostListener, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { StudentService } from '../../../core/services/student.service';
import { AuthService } from '../../../core/services/auth.service';
import { SHDFService, SHDFStatus } from '../../shdf/shdf.service';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-student-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet],
  styleUrls: ['./student-layout.component.scss'],
  template: `
    <div class="student-layout" [class.collapsed]="isCollapsed" [class.mobile-open]="mobileOpen">

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
          <span class="brand-text">PDMHS<br><small>Student Portal</small></span>
          <button class="hamburger" (click)="toggleSidebar()" title="Toggle sidebar">
            <span></span><span></span><span></span>
          </button>
        </div>

        <nav class="sidebar-nav">
          <a routerLink="/dashboard/student" routerLinkActive="active"
             [routerLinkActiveOptions]="{exact: true}" class="nav-item" title="Dashboard" (click)="closeMobile()">
            <img src="assets/icons/dashboard.png" class="nav-icon" alt="Dashboard">
            <span class="nav-label">Dashboard</span>
          </a>
          <a routerLink="/dashboard/student/medical-records" routerLinkActive="active" class="nav-item" title="My Medical Records" (click)="closeMobile()">
            <img src="assets/icons/my-medical.png" class="nav-icon" alt="Medical Records">
            <span class="nav-label">My Medical</span>
          </a>
          <button class="nav-item notification" (click)="toggleNotifications($event)" title="Notifications">
            <img src="assets/icons/notification.png" class="nav-icon" alt="Notifications">
            <span class="nav-label">Notifications</span>
            <span *ngIf="notificationCount > 0" class="notif-count">{{ notificationCount }}</span>
          </button>
          <button class="nav-item" (click)="toggleBadges($event)" title="Badges">
            <img src="assets/icons/badge.png" class="nav-icon" alt="Badges">
            <span class="nav-label">Badges</span>
          </button>
        </nav>

        <div class="sidebar-footer">
          <a routerLink="/dashboard/student/profile" routerLinkActive="active" class="nav-item" title="Profile" (click)="closeMobile()">
            <img src="assets/icons/profile.png" class="nav-icon" alt="Profile">
            <span class="nav-label">Profile</span>
          </a>
          <button class="nav-item logout-btn" (click)="logout()" title="Logout">
            <img src="assets/icons/logout.jpg" class="nav-icon" alt="Logout">
            <span class="nav-label">Logout</span>
          </button>
        </div>
      </aside>

      <!-- Mobile topbar -->
      <header class="mobile-topbar">
        <button class="mobile-menu-btn" (click)="openMobile()">
          <span></span><span></span><span></span>
        </button>
        <span class="mobile-brand">PDMHS Student</span>
      </header>

      <!-- Notifications Panel -->
      <div *ngIf="showNotificationsPanel" class="notifications-panel-overlay" (click)="showNotificationsPanel = false">
        <div class="notifications-panel" (click)="$event.stopPropagation()">
          <div class="panel-header">
            <div class="panel-title-row">
              <h3 class="panel-title">Notifications</h3>
              <span *ngIf="notificationCount > 0" class="notif-badge">{{ notificationCount }}</span>
            </div>
            <button class="panel-close" (click)="showNotificationsPanel = false" title="Close">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <div class="panel-body">
            <!-- SHDF Not Started Notification -->
            <div *ngIf="shdfNotification === 'not_started'" class="notification-card unread">
              <div class="notification-header">
                <div class="notification-icon-wrapper warning">
                  <i class="fa-solid fa-clipboard-list"></i>
                </div>
                <div class="notification-meta">
                  <span class="notification-time">Action Required</span>
                  <span class="unread-dot"></span>
                </div>
              </div>
              <div class="notification-content">
                <h4 class="notification-title">Complete Your Health Data Form</h4>
                <p class="notification-message">Please fill out your Student Health Data Form (SHDF). This is required for your health records.</p>
                <div class="notification-actions">
                  <button class="btn-action primary" (click)="goToSHDF()">
                    <i class="fa-solid fa-pen-to-square"></i>
                    Fill Out SHDF
                  </button>
                </div>
              </div>
            </div>

            <!-- SHDF Comprehensive Pending Notification -->
            <div *ngIf="shdfNotification === 'comprehensive_pending'" class="notification-card unread" [class.urgent]="shdfDaysRemaining <= 1">
              <div class="notification-header">
                <div class="notification-icon-wrapper" [class.warning]="shdfDaysRemaining > 1" [class.danger]="shdfDaysRemaining <= 1">
                  <i class="fa-solid fa-clock"></i>
                </div>
                <div class="notification-meta">
                  <span class="notification-time" [class.text-danger]="shdfDaysRemaining <= 1">
                    {{ shdfDaysRemaining <= 0 ? 'Overdue!' : shdfDaysRemaining + ' day(s) left' }}
                  </span>
                  <span class="unread-dot"></span>
                </div>
              </div>
              <div class="notification-content">
                <h4 class="notification-title">Complete Your SHDF - Comprehensive Form</h4>
                <p class="notification-message">
                  You completed the basic form. Please complete the comprehensive SHDF within
                  <strong>{{ shdfDaysRemaining <= 0 ? 'the deadline (overdue)' : shdfDaysRemaining + ' day(s)' }}</strong>.
                  Deadline: {{ shdfDeadline | date:'MMM d, yyyy' }}
                </p>
                <div class="notification-actions">
                  <button class="btn-action primary" (click)="goToSHDF()">
                    <i class="fa-solid fa-pen-to-square"></i>
                    Complete Now
                  </button>
                </div>
              </div>
            </div>

            <!-- Empty State - SHDF fully completed -->
            <div *ngIf="shdfNotification === 'none'" class="empty-state">
              <div class="empty-icon">
                <i class="fa-solid fa-bell-slash"></i>
              </div>
              <h4 class="empty-title">All caught up!</h4>
              <p class="empty-message">You have no new notifications</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Badges Panel -->
      <div *ngIf="showBadgesPanel" class="notifications-panel-overlay" (click)="showBadgesPanel = false">
        <div class="notifications-panel" (click)="$event.stopPropagation()">
          <div class="panel-header">
            <div class="panel-title-row">
              <h3 class="panel-title">Earned Badges</h3>
              <span *ngIf="badgeNotifications.length > 0" class="notif-badge badge-count">{{ badgeNotifications.length }}</span>
            </div>
            <button class="panel-close" (click)="showBadgesPanel = false" title="Close">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <div class="panel-body">
            <!-- Loading State -->
            <div *ngIf="notificationsLoading" class="loading-state">
              <div class="loading-spinner-small"></div>
              <p>Loading badges...</p>
            </div>

            <!-- Error State -->
            <div *ngIf="notificationsError && !notificationsLoading" class="error-state">
              <div class="error-icon">
                <i class="fa-solid fa-circle-exclamation"></i>
              </div>
              <p>{{ notificationsError }}</p>
            </div>

            <!-- Badges List -->
            <div *ngIf="!notificationsLoading && !notificationsError && badgeNotifications.length > 0" class="badges-grid">
              <div *ngFor="let badge of badgeNotifications" class="badge-card" (click)="openBadgeDetails(badge)">
                <div class="badge-icon-wrapper">
                  <img *ngIf="badge.icon_asset_path" [src]="badge.icon_asset_path" [alt]="badge.badge_name" class="badge-icon-img">
                  <i *ngIf="!badge.icon_asset_path" class="fa-solid fa-award"></i>
                </div>
                <div class="badge-info">
                  <h4 class="badge-name">{{ badge.badge_name }}</h4>
                  <p class="badge-description">{{ badge.required_streak_days }}-day streak milestone</p>
                  <span class="badge-status earned">
                    <i class="fa-solid fa-check-circle"></i>
                    Earned
                  </span>
                </div>
              </div>
            </div>

            <!-- Empty State -->
            <div *ngIf="!notificationsLoading && !notificationsError && badgeNotifications.length === 0" class="empty-state">
              <div class="empty-icon">
                <i class="fa-solid fa-award"></i>
              </div>
              <h4 class="empty-title">No badges yet</h4>
              <p class="empty-message">Keep staying healthy to earn badges!</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Main content -->
      <main class="main-content">
        <router-outlet></router-outlet>
      </main>

      <div *ngIf="showBadgeModal && activeBadge" class="badge-modal-overlay" (click)="closeBadgeModal()">
        <div class="badge-modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div class="modal-title">{{ popupBadgeKey ? 'New Badge Unlocked!' : 'Badge Details' }}</div>
            <button class="modal-close" (click)="closeBadgeModal()">×</button>
          </div>

          <div class="modal-body">
            <img *ngIf="activeBadge.icon_asset_path" [src]="activeBadge.icon_asset_path" [alt]="activeBadge.badge_name" class="modal-badge-icon">
            <div class="modal-badge-name">{{ activeBadge.badge_name }}</div>
            <div class="modal-badge-sub">{{ activeBadge.required_streak_days }}-day streak milestone</div>
            <div class="modal-badge-description">{{ activeBadge.description }}</div>

            <div *ngIf="generatingBadgeKey === activeBadge.badge_key" class="modal-message-status">
              Generating streak message...
            </div>

            <div *ngIf="badgeNarratives[activeBadge.badge_key]" class="narrative modal-narrative">
              {{ badgeNarratives[activeBadge.badge_key] }}
            </div>
          </div>
        </div>
      </div>

      <!-- SHDF Reminder Modal (shown once per session) -->
      <div *ngIf="showIncompleteFormModal" class="modal-overlay" (click)="closeIncompleteFormModal()">
        <div class="incomplete-form-modal" (click)="$event.stopPropagation()">
          <div class="modal-icon" [class.warning]="shdfNotification === 'not_started'" [class.danger]="shdfDaysRemaining <= 1">
            <i class="fa-solid fa-clipboard-list"></i>
          </div>
          <h2>{{ shdfNotification === 'not_started' ? 'Complete Your Health Data Form' : 'SHDF Deadline Reminder' }}</h2>
          <p class="modal-description">
            <ng-container *ngIf="shdfNotification === 'not_started'">
              Please fill out your Student Health Data Form (SHDF). This is required for your health records and QR code generation.
            </ng-container>
            <ng-container *ngIf="shdfNotification === 'comprehensive_pending'">
              You have <strong>{{ shdfDaysRemaining <= 0 ? 'passed the deadline' : shdfDaysRemaining + ' day(s) remaining' }}</strong> to complete your comprehensive SHDF form.
              Deadline: <strong>{{ shdfDeadline | date:'MMMM d, yyyy' }}</strong>
            </ng-container>
          </p>
          <div class="modal-actions">
            <button class="btn-secondary" (click)="closeIncompleteFormModal()">Later</button>
            <button class="btn-primary" (click)="completeFormFromModal()">Complete Now</button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class StudentLayoutComponent implements OnInit, OnDestroy {
  private routerSub?: Subscription;
  isCollapsed = false;
  mobileOpen = false;
  loggingOut = false;
  showNotificationsPanel = false;
  showBadgesPanel = false;
  notificationsLoading = false;
  notificationsError = '';
  badgeNotifications: any[] = [];
  generatingBadgeKey = '';
  badgeNarratives: Record<string, string> = {};
  showBadgeModal = false;
  activeBadge: any = null;
  popupBadgeKey: string | null = null;
  isFirstBadgeSyncDone = false;
  badgesLoaded = false;

  // SHDF notification state
  shdfNotification: 'not_started' | 'comprehensive_pending' | 'none' = 'none';
  shdfDaysRemaining = 0;
  shdfDeadline: Date | null = null;
  notificationCount = 0;
  showIncompleteFormModal = false;

  // Keep for backward compat (used in old modal template)
  showIncompleteFormNotification = false;
  incompleteFormMessage = '';

  constructor(
    private studentService: StudentService,
    private authService: AuthService,
    private router: Router,
    private shdService: SHDFService
  ) {}

  ngOnInit(): void {
    this.checkSHDFStatus();

    // Re-check SHDF status on every navigation so the notification
    // clears immediately after the student submits the comprehensive form
    // and navigates back to the dashboard.
    this.routerSub = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.checkSHDFStatus();
      });
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
  }

  toggleSidebar(): void {
    this.isCollapsed = !this.isCollapsed;
  }

  openMobile(): void {
    this.mobileOpen = true;
  }

  closeMobile(): void {
    this.mobileOpen = false;
  }

  logout(): void {
    this.loggingOut = true;
    this.authService.logout().subscribe({
      complete: () => window.location.replace('/login'),
      error: () => window.location.replace('/login')
    });
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.showNotificationsPanel = false;
    this.showBadgesPanel = false;
  }

  toggleNotifications(event: MouseEvent): void {
    event.stopPropagation();
    this.showNotificationsPanel = !this.showNotificationsPanel;
    this.showBadgesPanel = false;
  }

  toggleBadges(event: MouseEvent): void {
    event.stopPropagation();
    this.showBadgesPanel = !this.showBadgesPanel;
    this.showNotificationsPanel = false;

    if (this.showBadgesPanel && !this.badgesLoaded) {
      this.loadBadgeNotifications();
    }
  }

  loadBadgeNotifications(): void {
    this.notificationsLoading = true;
    this.notificationsError = '';

    // Get current user to fetch their actual badge status
    const currentUser = this.authService.currentUserValue;
    if (!currentUser?.user_id) {
      this.notificationsError = 'User not authenticated';
      this.notificationsLoading = false;
      return;
    }

    // Use lightweight badge summary endpoint to avoid heavy dashboard startup calls.
    this.studentService.getBadgeSummary().subscribe({
      next: (response) => {
        this.badgeNotifications = (response?.badges || []).filter((badge: any) => badge.is_unlocked) || [];
        this.badgesLoaded = true;
        this.notificationsLoading = false;
      },
      error: () => {
        // Fallback to legacy endpoint for mixed-version environments.
        this.studentService.getStudentMedicalData(currentUser.user_id).subscribe({
          next: (legacyResponse) => {
            if (legacyResponse.success && legacyResponse.data?.badges) {
              this.badgeNotifications = legacyResponse.data.badges.filter((badge: any) => badge.is_unlocked) || [];
            } else {
              this.badgeNotifications = [];
            }
            this.badgesLoaded = true;
            this.notificationsLoading = false;
          },
          error: (legacyError) => {
            this.notificationsError = legacyError?.error?.message || 'Unable to load badge notifications.';
            this.badgeNotifications = [];
            this.badgesLoaded = true;
            this.notificationsLoading = false;
          }
        });
      }
    });
  }

  generateNarrative(badge: any): void {
    if (!badge?.badge_key || this.generatingBadgeKey) {
      return;
    }

    const currentUser = this.authService.currentUserValue;
    const studentName = currentUser?.student_info
      ? `${currentUser.student_info.first_name} ${currentUser.student_info.last_name}`
      : (currentUser?.full_name || 'Student');

    this.generatingBadgeKey = badge.badge_key;

    this.studentService.generateBadgeNarrative({
      student_name: studentName,
      badge_name: badge.badge_name,
      streak_days: Number(badge.required_streak_days || 1),
      badge_key: badge.badge_key,
    }).subscribe({
      next: (result) => {
        this.badgeNarratives[badge.badge_key] = result?.narrative || 'No message generated.';
        this.generatingBadgeKey = '';
      },
      error: () => {
        this.badgeNarratives[badge.badge_key] = 'Unable to generate message right now.';
        this.generatingBadgeKey = '';
      }
    });
  }

  openBadgeDetails(badge: any): void {
    this.activeBadge = badge;
    this.showBadgeModal = true;
    this.popupBadgeKey = null;

    if (!this.badgeNarratives[badge.badge_key]) {
      this.generateNarrative(badge);
    }
  }

  closeBadgeModal(): void {
    this.showBadgeModal = false;
    this.activeBadge = null;
    this.popupBadgeKey = null;
  }

  private syncBadgeAcquisitionState(badges: any[]): void {
    const badgeKeys = badges
      .map((badge) => badge?.badge_key)
      .filter((badgeKey) => !!badgeKey);

    const knownAcquired = this.getStoredBadgeKeySet('known');
    const popupShown = this.getStoredBadgeKeySet('shown');

    if (knownAcquired.size === 0 && !this.isFirstBadgeSyncDone) {
      this.storeBadgeKeySet('known', new Set(badgeKeys));
      this.isFirstBadgeSyncDone = true;
      return;
    }

    const newlyAcquired = badgeKeys.filter((badgeKey) => !knownAcquired.has(badgeKey));
    const updatedKnown = new Set([...Array.from(knownAcquired), ...badgeKeys]);
    this.storeBadgeKeySet('known', updatedKnown);

    const firstNewUnshownKey = newlyAcquired.find((badgeKey) => !popupShown.has(badgeKey));

    if (firstNewUnshownKey) {
      const badge = badges.find((entry) => entry.badge_key === firstNewUnshownKey);
      if (badge) {
        this.activeBadge = badge;
        this.popupBadgeKey = firstNewUnshownKey;
        this.showBadgeModal = true;

        popupShown.add(firstNewUnshownKey);
        this.storeBadgeKeySet('shown', popupShown);
      }
    }
  }

  private getStoredBadgeKeySet(type: 'known' | 'shown'): Set<string> {
    const storageKey = this.getBadgeStorageKey(type);
    const raw = localStorage.getItem(storageKey);

    if (!raw) {
      return new Set<string>();
    }

    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? new Set<string>(parsed) : new Set<string>();
    } catch {
      return new Set<string>();
    }
  }

  private storeBadgeKeySet(type: 'known' | 'shown', values: Set<string>): void {
    const storageKey = this.getBadgeStorageKey(type);
    localStorage.setItem(storageKey, JSON.stringify(Array.from(values)));
  }

  private getBadgeStorageKey(type: 'known' | 'shown'): string {
    const currentUser = this.authService.currentUserValue;
    const studentId = currentUser?.student_info?.student_id || currentUser?.user_id || 'guest';
    return `student_badges_${type}_${studentId}`;
  }

  checkSHDFStatus(): void {
    const currentUser = this.authService.currentUserValue;
    const studentId = currentUser?.student_info?.student_id;
    if (!studentId) return;

    this.shdService.getStatus(studentId).subscribe({
      next: (status: SHDFStatus) => {
        if (status.is_fully_compliant) {
          this.shdfNotification = 'none';
          this.notificationCount = 0;
        } else if (status.basic_completed && !status.comprehensive_completed) {
          this.shdfNotification = 'comprehensive_pending';
          this.notificationCount = 1;
          if (status.comprehensive_deadline) {
            this.shdfDeadline = new Date(status.comprehensive_deadline);
            const diff = this.shdfDeadline.getTime() - new Date().getTime();
            this.shdfDaysRemaining = Math.ceil(diff / (1000 * 60 * 60 * 24));
          }
          this.showModalOnce(currentUser!.user_id);
        } else {
          this.shdfNotification = 'not_started';
          this.notificationCount = 1;
          this.showModalOnce(currentUser!.user_id);
        }
      },
      error: () => {
        this.shdfNotification = 'not_started';
        this.notificationCount = 1;
        const u = this.authService.currentUserValue;
        if (u?.user_id) this.showModalOnce(u.user_id);
      }
    });
  }

  private showModalOnce(userId: number): void {
    const key = `shdf_modal_shown_${userId}`;
    if (!sessionStorage.getItem(key)) {
      this.showIncompleteFormModal = true;
      sessionStorage.setItem(key, 'true');
    }
  }

  goToSHDF(): void {
    this.showNotificationsPanel = false;
    const currentUser = this.authService.currentUserValue;
    const studentId = currentUser?.student_info?.student_id;
    if (studentId) {
      this.router.navigate(['/shdf', studentId, 'basic']);
    }
  }

  dismissNotification(): void {
    this.notificationCount = 0;
  }

  closeIncompleteFormModal(): void {
    this.showIncompleteFormModal = false;
  }

  completeForm(): void {
    this.goToSHDF();
  }

  completeFormFromModal(): void {
    this.showIncompleteFormModal = false;
    this.goToSHDF();
  }
}
