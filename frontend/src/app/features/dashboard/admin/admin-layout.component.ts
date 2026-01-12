import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet],
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
  styles: [`
    .admin-layout {
      min-height: 100vh;
      background: #f8f9fa;
    }

    .top-nav {
      background: #2c3e50;
      padding: 1rem 2rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .nav-brand {
      display: flex;
      align-items: center;
      gap: 0.5rem;

      .brand-icon { font-size: 1.5rem; }
      .brand-text { 
        color: white; 
        font-weight: 700; 
        font-size: 1.2rem; 
      }
    }

    .nav-links {
      display: flex;
      gap: 2rem;
    }

    .nav-link {
      text-decoration: none;
      color: rgba(255, 255, 255, 0.7);
      font-weight: 500;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      transition: all 0.2s ease;
    }

    .nav-link:hover {
      color: white;
      background: rgba(255, 255, 255, 0.1);
    }

    .nav-link.active {
      color: white;
      background: rgba(255, 255, 255, 0.2);
    }

    .nav-icons {
      display: flex;
      gap: 1rem;
      align-items: center;
    }

    .icon-btn {
      background: rgba(255, 255, 255, 0.1);
      border: none;
      padding: 0.5rem;
      border-radius: 50%;
      cursor: pointer;
      transition: background-color 0.2s ease;
    }

    .icon-btn:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    .icon-img {
      width: 28px;
      height: 28px;
      border-radius: 50%;
    }

    .content-area {
      padding: 0;
    }
  `]
})
export class AdminLayoutComponent {}
