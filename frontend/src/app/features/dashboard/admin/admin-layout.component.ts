import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet],
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
          <button class="hamburger" (click)="toggleSidebar()" title="Toggle sidebar">
            <span></span><span></span><span></span>
          </button>
        </div>

        <nav class="sidebar-nav">
          <a routerLink="/dashboard/admin" routerLinkActive="active"
             [routerLinkActiveOptions]="{exact: true}" class="nav-item" title="Dashboard" (click)="closeMobile()">
            <img src="assets/icons/dashboard.png" class="nav-icon" alt="Dashboard">
            <span class="nav-label">Dashboard</span>
          </a>
          <a routerLink="/dashboard/admin/manage-users" routerLinkActive="active" class="nav-item" title="Users" (click)="closeMobile()">
            <img src="assets/icons/users.jpg" class="nav-icon" alt="Users">
            <span class="nav-label">Users</span>
          </a>
          <a routerLink="/dashboard/admin/manage-sections" routerLinkActive="active" class="nav-item" title="Sections" (click)="closeMobile()">
            <img src="assets/icons/sections.png" class="nav-icon" alt="Sections">
            <span class="nav-label">Sections</span>
          </a>
          <a routerLink="/dashboard/admin/school-year-management" routerLinkActive="active" class="nav-item" title="School Years" (click)="closeMobile()">
            <img src="assets/icons/school-years.png" class="nav-icon" alt="School Years">
            <span class="nav-label">School Years</span>
          </a>
          <a routerLink="/dashboard/admin/grade-promotion" routerLinkActive="active" class="nav-item" title="Grade Promotion" (click)="closeMobile()">
            <img src="assets/icons/grade-promotion.png" class="nav-icon" alt="Grade Promotion">
            <span class="nav-label">Grade Promotion</span>
          </a>
          <a routerLink="/dashboard/admin/emergency-drills" routerLinkActive="active" class="nav-item" title="Emergency Drills" (click)="closeMobile()">
            <img src="assets/icons/emergency-drills.png" class="nav-icon" alt="Emergency Drills">
            <span class="nav-label">Emergency Drills</span>
          </a>
          <a routerLink="/dashboard/admin/settings" routerLinkActive="active" class="nav-item" title="Settings" (click)="closeMobile()">
            <img src="assets/icons/settings.png" class="nav-icon" alt="Settings">
            <span class="nav-label">Settings</span>
          </a>
          <a routerLink="/dashboard/admin/reports" routerLinkActive="active" class="nav-item" title="Reports" (click)="closeMobile()">
            <img src="assets/icons/reports.png" class="nav-icon" alt="Reports">
            <span class="nav-label">Reports</span>
          </a>
        </nav>

        <div class="sidebar-footer">
          <a routerLink="/dashboard/admin/profile" routerLinkActive="active" class="nav-item" title="Profile" (click)="closeMobile()">
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
        <span class="mobile-brand">PDMHS Admin</span>
      </header>

      <!-- Main content -->
      <main class="main-content">
        <router-outlet></router-outlet>
      </main>

    </div>
  `,
})
export class AdminLayoutComponent {
  isCollapsed = false;
  mobileOpen = false;
  loggingOut = false;

  constructor(private authService: AuthService, private router: Router) {}

  toggleSidebar(): void { this.isCollapsed = !this.isCollapsed; }
  openMobile(): void { this.mobileOpen = true; }
  closeMobile(): void { this.mobileOpen = false; }

  logout(): void {
    this.loggingOut = true;
    this.authService.logout().subscribe({
      complete: () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login'])
    });
  }
}
