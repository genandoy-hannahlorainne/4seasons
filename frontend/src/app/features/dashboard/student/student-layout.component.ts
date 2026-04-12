import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet, Router } from '@angular/router';
import { StudentService } from '../../../core/services/student.service';
import { AuthService } from '../../../core/services/auth.service';

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
            <span *ngIf="showIncompleteFormNotification" class="notif-count">1</span>
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
              <span *ngIf="showIncompleteFormNotification" class="notif-badge">1</span>
            </div>
            <button class="panel-close" (click)="showNotificationsPanel = false" title="Close">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
          
          <div class="panel-body">
            <!-- Medical Form Incomplete Notification -->
            <div *ngIf="showIncompleteFormNotification" class="notification-card unread">
              <div class="notification-header">
                <div class="notification-icon-wrapper warning">
                  <i class="fa-solid fa-clipboard-list"></i>
                </div>
                <div class="notification-meta">
                  <span class="notification-time">Just now</span>
                  <span class="unread-dot"></span>
                </div>
              </div>
              <div class="notification-content">
                <h4 class="notification-title">Complete Your Medical Information</h4>
                <p class="notification-message">{{ incompleteFormMessage }}</p>
                <div class="notification-actions">
                  <button class="btn-action primary" (click)="completeForm()">
                    <i class="fa-solid fa-pen-to-square"></i>
                    Complete Form
                  </button>
                </div>
              </div>
            </div>

            <!-- Empty State -->
            <div *ngIf="!showIncompleteFormNotification" class="empty-state">
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
      <div *ngIf="showBadgesPanel" class="notifications-panel" (click)="$event.stopPropagation()">
        <div class="panel-title">Earned Badges</div>

        <div *ngIf="notificationsLoading" class="panel-state">Loading badges...</div>
        <div *ngIf="notificationsError" class="panel-state error">{{ notificationsError }}</div>
        <div *ngIf="!notificationsLoading && !notificationsError && badgeNotifications.length === 0" class="panel-state">No badges earned yet. Keep staying healthy!</div>

        <div *ngIf="!notificationsLoading && badgeNotifications.length > 0" class="notification-list">
          <div *ngFor="let badge of badgeNotifications" class="notification-item" (click)="openBadgeDetails(badge)">
            <img *ngIf="badge.icon_asset_path" [src]="badge.icon_asset_path" [alt]="badge.badge_name" class="badge-icon">
            <div class="item-content">
              <div class="item-title">{{ badge.badge_name }}</div>
              <div class="item-sub">{{ badge.required_streak_days }}-day streak badge available</div>
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

      <!-- Incomplete Medical Form Modal -->
      <div *ngIf="showIncompleteFormModal" class="modal-overlay" (click)="closeIncompleteFormModal()">
        <div class="incomplete-form-modal" (click)="$event.stopPropagation()">
          <div class="modal-icon warning">
            <i class="fa-solid fa-clipboard-list"></i>
          </div>
          <h2>Complete Your Medical Information</h2>
          <p class="modal-description">{{ incompleteFormMessage }}</p>
          <p class="modal-note">Completing your medical information helps us provide better healthcare services.</p>
          <div class="modal-actions">
            <button class="btn-secondary" (click)="closeIncompleteFormModal()">Later</button>
            <button class="btn-primary" (click)="completeFormFromModal()">Complete Now</button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class StudentLayoutComponent implements OnInit {
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
  
  // Medical form notification
  showIncompleteFormNotification = false;
  incompleteFormMessage = '';
  showIncompleteFormModal = false;

  constructor(
    private studentService: StudentService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadBadgeNotifications();
    this.checkMedicalFormCompletionAndShowModal();
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
      complete: () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login'])
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

    // Load student's actual badge data instead of all available badges
    this.studentService.getStudentMedicalData(currentUser.user_id).subscribe({
      next: (response) => {
        if (response.success && response.data?.badges) {
          // Only show unlocked/earned badges as notifications
          this.badgeNotifications = response.data.badges.filter((badge: any) => badge.is_unlocked) || [];
        } else {
          this.badgeNotifications = [];
        }
        this.notificationsLoading = false;
      },
      error: (error) => {
        this.notificationsError = error?.error?.message || 'Unable to load badge notifications.';
        this.badgeNotifications = [];
        this.notificationsLoading = false;
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

  checkMedicalFormCompletion(): void {
    const currentUser = this.authService.currentUserValue;
    if (!currentUser?.user_id) return;

    this.studentService.getStudentMedicalData(currentUser.user_id).subscribe({
      next: (response) => {
        if (response.success && response.data?.personal_info) {
          const personalInfo = response.data.personal_info;
          const missingFields: string[] = [];

          // Check required fields
          if (!personalInfo.address) missingFields.push('Contact Information (Address)');
          if (!personalInfo.medical_history || personalInfo.medical_history.length === 0) {
            missingFields.push('Medical History');
          }

          // Show notification if any fields are missing
          if (missingFields.length > 0) {
            this.showIncompleteFormNotification = true;
            this.incompleteFormMessage = `Please complete your Personal Medical Information Form. Missing: ${missingFields.join(', ')}`;
          } else {
            this.showIncompleteFormNotification = false;
          }
        }
      },
      error: () => {
        // Silently fail - don't show error for this check
      }
    });
  }

  checkMedicalFormCompletionAndShowModal(): void {
    const currentUser = this.authService.currentUserValue;
    if (!currentUser?.user_id) return;

    // Check if modal was already shown in this session
    const modalShownKey = `medical_form_modal_shown_${currentUser.user_id}`;
    const modalShown = sessionStorage.getItem(modalShownKey);

    if (modalShown) {
      // Just update notification, don't show modal again
      this.checkMedicalFormCompletion();
      return;
    }

    this.studentService.getStudentMedicalData(currentUser.user_id).subscribe({
      next: (response) => {
        if (response.success && response.data?.personal_info) {
          const personalInfo = response.data.personal_info;
          const missingFields: string[] = [];

          // Check required fields
          if (!personalInfo.address) missingFields.push('Contact Information (Address)');
          if (!personalInfo.medical_history || personalInfo.medical_history.length === 0) {
            missingFields.push('Medical History');
          }

          // Show notification and modal if any fields are missing
          if (missingFields.length > 0) {
            this.showIncompleteFormNotification = true;
            this.incompleteFormMessage = `Please complete your Personal Medical Information Form. Missing: ${missingFields.join(', ')}`;
            
            // Show modal on first login
            this.showIncompleteFormModal = true;
            sessionStorage.setItem(modalShownKey, 'true');
          } else {
            this.showIncompleteFormNotification = false;
          }
        }
      },
      error: () => {
        // Silently fail - don't show error for this check
      }
    });
  }

  dismissNotification(): void {
    this.showIncompleteFormNotification = false;
  }

  closeIncompleteFormModal(): void {
    this.showIncompleteFormModal = false;
  }

  completeForm(): void {
    this.showNotificationsPanel = false;
    this.router.navigate(['/shdf', 'basic']);
  }

  completeFormFromModal(): void {
    this.showIncompleteFormModal = false;
    this.router.navigate(['/shdf', 'basic']);
  }
}