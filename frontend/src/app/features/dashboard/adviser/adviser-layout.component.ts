import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-adviser-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet],
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
          <button class="hamburger" (click)="toggleSidebar()" title="Toggle sidebar">
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
          <a routerLink="/dashboard/adviser/alerts" routerLinkActive="active" class="nav-item" title="Alerts" (click)="closeMobile()">
            <i class="fa-solid fa-bell nav-icon-fa"></i>
            <span class="nav-label">Alerts</span>
          </a>
          <a routerLink="/dashboard/adviser/class-management" routerLinkActive="active" class="nav-item" title="My Class" (click)="closeMobile()">
            <i class="fa-solid fa-users nav-icon-fa"></i>
            <span class="nav-label">My Class</span>
          </a>
          <a routerLink="/dashboard/adviser/shdf-download" routerLinkActive="active" class="nav-item" title="SHDF Download" (click)="closeMobile()">
            <i class="fa-solid fa-file-arrow-down nav-icon-fa"></i>
            <span class="nav-label">SHDF Download</span>
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
      </header>

      <!-- Main content -->
      <main class="main-content">
        <router-outlet></router-outlet>
      </main>

    </div>
  `,
})
export class AdviserLayoutComponent implements OnInit {
  adviserName = 'Adviser';
  isCollapsed = false;
  mobileOpen = false;
  loggingOut = false;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    const currentUser = this.authService.currentUserValue;
    if (currentUser) {
      this.adviserName = currentUser.full_name || 'Adviser';
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
