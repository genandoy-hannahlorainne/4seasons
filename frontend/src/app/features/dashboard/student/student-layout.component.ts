import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet } from '@angular/router';

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
          <button class="icon-btn notification">
            <img src="assets/notification-icon.png" alt="Notifications" class="icon-img">
          </button>
          <button class="icon-btn profile" routerLink="/dashboard/student/profile">
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
export class StudentLayoutComponent {}