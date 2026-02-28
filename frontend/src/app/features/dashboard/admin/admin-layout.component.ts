import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet],
  styleUrls: ['./admin-layout.component.scss'],
  template: `
    <div class="admin-layout">
      <nav class="top-nav">
        <div class="nav-brand">
          <span class="brand-icon">🛡️</span>
          <span class="brand-text">Admin Panel</span>
        </div>
        <div class="nav-links">
          <a routerLink="/dashboard/admin" class="nav-link" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">Dashboard</a>
          <a routerLink="/dashboard/admin/manage-users" class="nav-link" routerLinkActive="active">Users</a>
          <a routerLink="/dashboard/admin/school-year-management" class="nav-link" routerLinkActive="active">School Years</a>
          <a routerLink="/dashboard/admin/grade-promotion" class="nav-link" routerLinkActive="active">Grade Promotion</a>
          <a routerLink="/dashboard/admin/emergency-drills" class="nav-link" routerLinkActive="active">Emergency Drills</a>
          <a routerLink="/dashboard/admin/settings" class="nav-link" routerLinkActive="active">Settings</a>
          <a routerLink="/dashboard/admin/backup-recovery" class="nav-link" routerLinkActive="active">Backup</a>
          <a routerLink="/dashboard/admin/reports" class="nav-link" routerLinkActive="active">Reports</a>
        </div>
        <div class="nav-icons">
          <button class="icon-btn profile" routerLink="/dashboard/admin/profile" title="Profile">
            <img src="assets/user-male.png" alt="Profile" class="icon-img">
          </button>
        </div>
      </nav>
      
      <div class="content-area">
        <router-outlet></router-outlet>
      </div>
    </div>
  `,
})
export class AdminLayoutComponent {}
