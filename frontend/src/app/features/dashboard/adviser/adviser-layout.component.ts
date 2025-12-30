import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-adviser-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet],
  template: `
    <div class="adviser-layout">
      <nav class="top-nav">
        <div class="nav-links">
          <a routerLink="/dashboard/adviser" class="nav-link" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">Dashboard</a>
          <a routerLink="/dashboard/adviser/alerts" class="nav-link" routerLinkActive="active">Alerts</a>
          <a routerLink="/dashboard/adviser/health-status" class="nav-link" routerLinkActive="active">Health Status</a>
        </div>
        <div class="nav-icons">
          <button class="icon-btn notification" title="Notifications">
            <img src="assets/notification-icon.png" alt="Notifications" class="icon-img">
          </button>
          <button class="icon-btn profile" routerLink="/dashboard/adviser/profile" title="Profile">
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
    .adviser-layout {
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
export class AdviserLayoutComponent implements OnInit {
  adviserName = 'Adviser';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const currentUser = this.authService.currentUserValue;
    if (currentUser) {
      this.adviserName = currentUser.full_name || 'Adviser';
    }
  }
}