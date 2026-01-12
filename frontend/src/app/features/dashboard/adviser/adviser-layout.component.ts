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
    <div class="adviser-layout">
      <nav class="top-nav">
        <div class="nav-links">
          <a routerLink="/dashboard/adviser" class="nav-link" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">Dashboard</a>
          <a routerLink="/dashboard/adviser/alerts" class="nav-link" routerLinkActive="active">Alerts</a>
        </div>
        <div class="nav-icons">
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