import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet } from '@angular/router';
import { StudentService } from '../../../core/services/student.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-student-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet],
  styleUrls: ['./student-layout.component.scss'],
  template: `
    <div class="student-layout">
      <nav class="top-nav">
        <div class="nav-links">
          <a routerLink="/dashboard/student" class="nav-link" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">Dashboard</a>
          <a routerLink="/dashboard/student/medical-records" class="nav-link" routerLinkActive="active">MyMedical</a>
        </div>
        <div class="nav-icons">
          <button class="icon-btn notification" (click)="toggleNotifications($event)">
            <img src="assets/notification-icon.png" alt="Notifications" class="icon-img">
            <span *ngIf="badgeNotifications.length > 0" class="notif-count">{{ badgeNotifications.length }}</span>
          </button>
          <button class="icon-btn profile" routerLink="/dashboard/student/profile">
            <img src="assets/user-male.png" alt="Profile" class="icon-img">
          </button>

          <div *ngIf="showNotificationsPanel" class="notifications-panel" (click)="$event.stopPropagation()">
            <div class="panel-title">Badge Notifications</div>

            <div *ngIf="notificationsLoading" class="panel-state">Loading badges...</div>
            <div *ngIf="notificationsError" class="panel-state error">{{ notificationsError }}</div>
            <div *ngIf="!notificationsLoading && !notificationsError && badgeNotifications.length === 0" class="panel-state">No badge notifications yet.</div>

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
        </div>
      </nav>
      
      <div class="content-area">
        <router-outlet></router-outlet>
      </div>

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
    </div>
  `,
})
export class StudentLayoutComponent implements OnInit {
  showNotificationsPanel = false;
  notificationsLoading = false;
  notificationsError = '';
  badgeNotifications: any[] = [];
  generatingBadgeKey = '';
  badgeNarratives: Record<string, string> = {};
  showBadgeModal = false;
  activeBadge: any = null;
  popupBadgeKey: string | null = null;
  isFirstBadgeSyncDone = false;

  constructor(
    private studentService: StudentService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadBadgeNotifications();
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    this.showNotificationsPanel = false;
  }

  toggleNotifications(event: MouseEvent): void {
    event.stopPropagation();
    this.showNotificationsPanel = !this.showNotificationsPanel;
  }

  loadBadgeNotifications(): void {
    this.notificationsLoading = true;
    this.notificationsError = '';

    this.studentService.getStreakBadgeMetadata().subscribe({
      next: (data) => {
        this.badgeNotifications = Array.isArray(data?.badges) ? data.badges : [];
        this.syncBadgeAcquisitionState(this.badgeNotifications);
        this.notificationsLoading = false;
      },
      error: (error) => {
        this.notificationsError = error?.error?.message || 'Unable to load badge notifications.';
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
}