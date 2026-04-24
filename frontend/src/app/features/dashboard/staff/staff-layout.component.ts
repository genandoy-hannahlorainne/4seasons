import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-staff-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet],
  styleUrls: ['./staff-layout.component.scss'],
  template: `
    <div class="staff-layout" [class.collapsed]="isCollapsed" [class.mobile-open]="mobileOpen">
      <!-- Mobile topbar -->
      <div class="mobile-topbar">
        <button class="mobile-menu-btn" (click)="toggleMobile()">
          <span></span>
          <span></span>
          <span></span>
        </button>
        <div class="mobile-brand">PDMHS</div>
      </div>

      <!-- Sidebar overlay (mobile) -->
      <div class="sidebar-overlay" (click)="toggleMobile()"></div>

      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="sidebar-brand">
          <img src="assets/pdmhs-logo.png" alt="PDMHS" class="brand-logo" (click)="toggleSidebar()">
          <div class="brand-text">
            PDMHS
            <br><small>Clinic Staff</small>
          </div>
          <button class="hamburger" (click)="toggleSidebar()">
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>

        <nav class="sidebar-nav">
          <a routerLink="/dashboard/staff" class="nav-item" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">
            <img src="assets/icons/dashboard.png" alt="Dashboard" class="nav-icon">
            <span class="nav-label">Dashboard</span>
          </a>
          <a routerLink="/dashboard/staff/students" class="nav-item" routerLinkActive="active">
            <img src="assets/icons/student.png" alt="Students" class="nav-icon">
            <span class="nav-label">Students</span>
          </a>
          <a routerLink="/dashboard/staff/visits" class="nav-item" routerLinkActive="active">
            <img src="assets/icons/visit.png" alt="Visits" class="nav-icon">
            <span class="nav-label">Visits</span>
          </a>
          <a routerLink="/dashboard/staff/reports" class="nav-item" routerLinkActive="active">
            <img src="assets/icons/reports.png" alt="Reports" class="nav-icon">
            <span class="nav-label">Reports</span>
          </a>
        </nav>

        <div class="sidebar-footer">
          <a routerLink="/dashboard/staff/profile" class="nav-item" routerLinkActive="active">
            <img src="assets/icons/profile.png" alt="Profile" class="nav-icon">
            <span class="nav-label">Profile</span>
          </a>
          <button class="nav-item logout-btn" (click)="logout()">
            <img src="assets/icons/logout.jpg" alt="Logout" class="nav-icon">
            <span class="nav-label">Logout</span>
          </button>
        </div>
      </aside>

      <!-- Main content -->
      <main class="main-content">
        <div class="content-area">
          <router-outlet></router-outlet>
        </div>
      </main>

      <!-- Logout overlay -->
      @if (loggingOut) {
        <div class="logout-overlay">
          <div class="logout-box">
            <div class="logout-spinner"></div>
            <p>Logging out...</p>
          </div>
        </div>
      }
    </div>
  `,
})
export class StaffLayoutComponent implements OnInit {
  isCollapsed = false;
  mobileOpen = false;
  loggingOut = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const saved = localStorage.getItem('staff-sidebar-collapsed');
    this.isCollapsed = saved === 'true';
  }

  toggleSidebar(): void {
    this.isCollapsed = !this.isCollapsed;
    localStorage.setItem('staff-sidebar-collapsed', String(this.isCollapsed));
  }

  toggleMobile(): void {
    this.mobileOpen = !this.mobileOpen;
  }

  logout(): void {
    this.loggingOut = true;
    this.authService.logout();
    setTimeout(() => {
      window.location.replace('/role-selection');
    }, 800);
  }
}
