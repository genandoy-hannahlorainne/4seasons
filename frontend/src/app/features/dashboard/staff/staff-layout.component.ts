import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-staff-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet],
  styleUrls: ['./staff-layout.component.scss'],
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
})
export class StaffLayoutComponent {}
