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
              <div *ngFor="let badge of badgeNotifications" class="notification-item">
                <img *ngIf="badge.icon_asset_path" [src]="badge.icon_asset_path" [alt]="badge.badge_name" class="badge-icon">
                <div class="item-content">
                  <div class="item-title">{{ badge.badge_name }}</div>
                  <div class="item-sub">{{ badge.required_streak_days }}-day streak badge available</div>

                  <button
                    class="generate-btn"
                    type="button"
                    [disabled]="generatingBadgeKey === badge.badge_key"
                    (click)="generateNarrative(badge)">
                    {{ generatingBadgeKey === badge.badge_key ? 'Generating...' : 'Generate Message' }}
                  </button>

                  <div *ngIf="badgeNarratives[badge.badge_key]" class="narrative">
                    {{ badgeNarratives[badge.badge_key] }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>
      
      <div class="content-area">
        <router-outlet></router-outlet>
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
}