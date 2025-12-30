import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-staff-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet],
  template: `
    <div class="staff-layout">
      <nav class="top-nav">
        <div class="nav-links">
          <a routerLink="/dashboard/staff" class="nav-link" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">Dashboard</a>
          <a routerLink="/dashboard/staff/students" class="nav-link" routerLinkActive="active">Students</a>
          <a routerLink="/dashboard/staff/visits" class="nav-link" routerLinkActive="active">Visits</a>
          <a routerLink="/dashboard/staff/reports" class="nav-link" routerLinkActive="active">Reports</a>
        </div>
        <div class="nav-icons">
          <button class="icon-btn profile" routerLink="/dashboard/staff/profile" title="Profile">
            <img src="assets/user-female.png" alt="Profile" class="icon-img">
          </button>
        </div>
      </nav>
      
      <div class="content-area">
        <router-outlet></router-outlet>
      </div>
    </div>
  `,
  styles: [`
    .staff-layout {
      min-height: 100vh;
      background: #f8f9fa;
    }

    .top-nav {
      background: white;
      padding: 1rem 2rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .nav-links {
      display: flex;
      gap: 2rem;
    }

    .nav-link {
      text-decoration: none;
      color: #6c757d;
      font-weight: 500;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      transition: all 0.2s ease;
    }

    .nav-link:hover {
      color: #007bff;
      background: #f8f9fa;
    }

    .nav-link.active {
      color: #007bff;
      background: #e3f2fd;
    }

    .nav-icons {
      display: flex;
      gap: 1rem;
      align-items: center;
    }

    .icon-btn {
      background: none;
      border: none;
      padding: 0.5rem;
      border-radius: 50%;
      cursor: pointer;
      transition: background-color 0.2s ease;
    }

    .icon-btn:hover {
      background: #f8f9fa;
    }

    .icon-img {
      width: 24px;
      height: 24px;
    }

    .content-area {
      padding: 0;
    }
  `]
})
export class StaffLayoutComponent {}
