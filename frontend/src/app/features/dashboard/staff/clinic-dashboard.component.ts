import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-clinic-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="clinic-dashboard">
      <div class="dashboard-wrap">
        <div class="overview-card">
          <div class="overview-title">Dashboard Overview</div>
          <div class="overview-sub">Welcome back, {{ staffName }}!</div>
          <div class="overview-meta">Clinic Staff Dashboard</div>

          <div class="stats-row">
            <div class="stat-tile tile-students">
              <div class="tile-value">{{ totalStudents }}</div>
              <div class="tile-label">Total Students</div>
            </div>
            <div class="stat-tile tile-today">
              <div class="tile-value">{{ todayVisits }}</div>
              <div class="tile-label">Today's Visits</div>
            </div>
            <div class="stat-tile tile-total-visits">
              <div class="tile-value">{{ totalVisits }}</div>
              <div class="tile-label">Total Visits</div>
            </div>
            <div class="stat-tile tile-pending">
              <div class="tile-value">{{ pendingVisits }}</div>
              <div class="tile-label">Pending Visits</div>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="card">
          <h2>Quick Actions</h2>
          <div class="actions-grid">
            <button class="action-btn" routerLink="/dashboard/staff/visits/new">
              <span class="action-text">+ New Visit</span>
            </button>
            <button class="action-btn" routerLink="/dashboard/staff/students">
              <span class="action-text">Find Student</span>
            </button>
            <button class="action-btn" routerLink="/dashboard/staff/reports">
              <span class="action-text">Generate Report</span>
            </button>
            <button class="action-btn" routerLink="/dashboard/staff/profile">
              <span class="action-text">My Profile</span>
            </button>
          </div>
        </div>

        <!-- Recent Activity -->
        <div class="recent-section">
          <div class="card">
            <h2>Recent Visits</h2>
            <div class="loading-state" *ngIf="loadingVisits">
              <p>Loading...</p>
            </div>
            <div class="empty-state" *ngIf="!loadingVisits && recentVisits.length === 0">
              <p>No recent visits recorded</p>
            </div>
            <div class="visits-list" *ngIf="!loadingVisits && recentVisits.length > 0">
              <div *ngFor="let visit of recentVisits" class="visit-item">
                <div class="visit-avatar">
                  <img [src]="visit.avatar" alt="Student">
                </div>
                <div class="visit-info">
                  <div class="visit-name">{{ visit.studentName }}</div>
                  <div class="visit-reason">{{ visit.chiefComplaint }}</div>
                </div>
                <div class="visit-meta">
                  <div class="visit-time">{{ visit.dateTime }}</div>
                  <span class="visit-status" [class]="visit.status">{{ visit.status }}</span>
                </div>
              </div>
            </div>
            <div class="view-all" *ngIf="recentVisits.length > 0">
              <a routerLink="/dashboard/staff/visits">View All Visits</a>
            </div>
          </div>

          <div class="card">
            <h2>Students with Allergies</h2>
            <div class="loading-state" *ngIf="loadingAllergies">
              <p>Loading...</p>
            </div>
            <div class="empty-state" *ngIf="!loadingAllergies && studentsWithAllergies.length === 0">
              <p>No allergy records found</p>
            </div>
            <div class="allergy-list" *ngIf="!loadingAllergies && studentsWithAllergies.length > 0">
              <div *ngFor="let student of studentsWithAllergies" class="allergy-item">
                <div class="student-name">{{ student.name }}</div>
                <div class="allergy-tags">
                  <span *ngFor="let allergy of student.allergies" class="allergy-tag">{{ allergy }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .clinic-dashboard {
      padding: 2rem;
      background: #f5f7fa;
      min-height: 100vh;
    }

    .dashboard-wrap {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1rem;
    }

    .overview-card {
      background: #fff;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }

    .overview-title {
      font-size: 1.6rem;
      font-weight: 800;
      color: #0b2a4a;
      margin-bottom: 0.25rem;
    }

    .overview-sub {
      color: #4f7ea9;
      font-weight: 700;
      margin-bottom: 0.25rem;
      font-size: 0.95rem;
    }

    .overview-meta {
      color: #0b2a4a;
      font-weight: 700;
      font-size: 0.85rem;
      margin-bottom: 1rem;
    }

    .stats-row {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 1rem;
    }

    .stat-tile {
      border-radius: 10px;
      padding: 1rem 1.1rem;
      color: #fff;
      min-height: 72px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }

    .tile-value {
      font-size: 1.4rem;
      font-weight: 900;
      line-height: 1;
    }

    .tile-label {
      font-size: 0.8rem;
      font-weight: 700;
      opacity: 0.95;
    }

    .tile-students { background: linear-gradient(135deg, #5b8cff, #a1b7ff); }
    .tile-today { background: linear-gradient(135deg, #6a11cb, #b37aff); }
    .tile-total-visits { background: linear-gradient(135deg, #ff7e5f, #feb47b); }
    .tile-pending { background: linear-gradient(135deg, #f9a826, #ffd194); }

    .card {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);

      h2 { font-size: 1.3rem; color: #2c3e50; margin: 0 0 1rem; }
    }

    .actions-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
    }

    .action-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem 1.5rem;
      background: #f8f9fa;
      border: 2px solid #e9ecef;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;

      .action-text { font-weight: 600; color: #2c3e50; }

      &:hover {
        border-color: #007bff;
        background: #e3f2fd;
        .action-text { color: #007bff; }
      }
    }

    .recent-section {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
    }

    @media (max-width: 900px) {
      .stats-row { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .actions-grid { grid-template-columns: repeat(2, 1fr); }
      .recent-section { grid-template-columns: 1fr; }
    }

    .loading-state, .empty-state {
      text-align: center;
      padding: 2rem;
      color: #7f8c8d;
    }

    .visits-list {
      .visit-item {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 0.75rem 0;
        border-bottom: 1px solid #e9ecef;
        &:last-child { border-bottom: none; }

        .visit-avatar {
          width: 40px;
          height: 40px;
          img { width: 100%; height: 100%; border-radius: 50%; }
        }
        .visit-info { flex: 1; }
        .visit-name { font-weight: 600; color: #2c3e50; }
        .visit-reason { font-size: 0.85rem; color: #7f8c8d; }
        .visit-meta { text-align: right; }
        .visit-time { font-size: 0.8rem; color: #95a5a6; margin-bottom: 0.25rem; }
        .visit-status {
          display: inline-block;
          padding: 0.15rem 0.5rem;
          border-radius: 10px;
          font-size: 0.7rem;
          font-weight: 500;
          &.pending { background: #fff3cd; color: #856404; }
          &.completed { background: #d4edda; color: #155724; }
          &.referred { background: #cce5ff; color: #004085; }
        }
      }
    }

    .view-all {
      text-align: center;
      padding-top: 1rem;
      border-top: 1px solid #e9ecef;
      margin-top: 1rem;
      a { color: #007bff; text-decoration: none; font-size: 0.9rem; &:hover { text-decoration: underline; } }
    }

    .allergy-list {
      .allergy-item {
        padding: 0.75rem 0;
        border-bottom: 1px solid #e9ecef;
        &:last-child { border-bottom: none; }

        .student-name { font-weight: 600; color: #2c3e50; margin-bottom: 0.5rem; }
        .allergy-tags { display: flex; flex-wrap: wrap; gap: 0.5rem; }
        .allergy-tag {
          background: #fff3cd;
          color: #856404;
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.8rem;
        }
      }
    }

    @media (max-width: 1024px) {
      .summary-cards { grid-template-columns: repeat(2, 1fr); }
      .actions-grid { grid-template-columns: repeat(2, 1fr); }
      .recent-section { grid-template-columns: 1fr; }
    }
  `]
})
export class ClinicDashboardComponent implements OnInit {
  staffName = '';
  totalStudents = 0;
  todayVisits = 0;
  totalVisits = 0;
  pendingVisits = 0;
  recentVisits: any[] = [];
  studentsWithAllergies: any[] = [];
  loadingVisits = true;
  loadingAllergies = true;

  constructor(
    private authService: AuthService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    const currentUser = this.authService.currentUserValue;
    if (currentUser) {
      this.staffName = currentUser.full_name || 'Clinic Staff';
    }
    
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    // Load recent visits
    this.http.get<any>(`${environment.apiUrl}/get-medical-visits.php?limit=5`)
      .subscribe({
        next: (response) => {
          this.loadingVisits = false;
          if (response.success) {
            this.recentVisits = response.visits;
            this.totalVisits = response.total;
          }
        },
        error: () => {
          this.loadingVisits = false;
        }
      });

    // Load today's visits count
    const today = new Date().toISOString().split('T')[0];
    this.http.get<any>(`${environment.apiUrl}/get-medical-visits.php?date=${today}`)
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.todayVisits = response.total;
          }
        }
      });

    // Load pending visits count
    this.http.get<any>(`${environment.apiUrl}/get-medical-visits.php?status=pending`)
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.pendingVisits = response.total;
          }
        }
      });

    // Load total students count
    this.http.get<any>(`${environment.apiUrl}/get-dashboard-stats.php`)
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.totalStudents = response.totalStudents || 0;
          }
        },
        error: () => {
          // Fallback - just set to 0
          this.totalStudents = 0;
        }
      });

    // Load students with allergies
    this.http.get<any>(`${environment.apiUrl}/get-students-with-allergies.php`)
      .subscribe({
        next: (response) => {
          this.loadingAllergies = false;
          if (response.success) {
            this.studentsWithAllergies = response.students;
          }
        },
        error: () => {
          this.loadingAllergies = false;
        }
      });
  }
}
