import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MedicalVisitService } from '../../../core/services/medical-visit.service';
import { AuthService } from '../../../core/services/auth.service';

interface VisitHistoryData {
  statistics: {
    total_visits: number;
    this_month_visits: number;
    emergency_visits: number;
    routine_visits: number;
    last_visit: {
      visit_id: number;
      visit_datetime: string;
      visit_type: string;
      chief_complaint: string;
      status: string;
      days_ago: number;
    } | null;
  };
  recent_visits: any[];
  visits_by_month: any[];
  visit_types_breakdown: {
    routine: number;
    emergency: number;
  };
}

@Component({
  selector: 'app-visits-history',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="visits-history-container">
      <div class="header">
        <button class="back-btn" routerLink="/dashboard/student/medical-records">
          ← Back to Medical Records
        </button>
        <h1>Medical Visits History</h1>
        <p class="subtitle">Complete history of your medical visits</p>
      </div>

      <div *ngIf="loading" class="loading">
        <div class="loading-spinner"></div>
        <p>Loading visits history...</p>
      </div>

      <div *ngIf="error" class="error-message">
        {{ error }}
      </div>

      <div *ngIf="visitHistory && !loading" class="content">
        <div class="visits-summary">
          <div class="summary-card">
            <div class="summary-icon">📋</div>
            <div class="summary-content">
              <div class="summary-value">{{ visitHistory.statistics.total_visits }}</div>
              <div class="summary-label">Total Visits</div>
            </div>
          </div>
          
          <div class="summary-card">
            <div class="summary-icon">📅</div>
            <div class="summary-content">
              <div class="summary-value">{{ visitHistory.statistics.this_month_visits }}</div>
              <div class="summary-label">This Month</div>
            </div>
          </div>
          
          <div class="summary-card">
            <div class="summary-icon">🩺</div>
            <div class="summary-content">
              <div class="summary-value">{{ getLastVisitText() }}</div>
              <div class="summary-label">Last Visit</div>
            </div>
          </div>
        </div>

        <div class="visits-list">
          <div *ngFor="let visit of visitHistory.recent_visits" class="visit-card" (click)="selectVisit(visit)">
            <div class="visit-header">
              <div class="visit-date">
                <div class="date-main">{{ formatDate(visit.visit_datetime) }}</div>
                <div class="date-time">{{ formatTime(visit.visit_datetime) }}</div>
              </div>
              <div class="visit-status" [class]="'status-' + visit.status.toLowerCase()">
                {{ visit.status }}
              </div>
            </div>
            
            <div class="visit-content">
              <div class="visit-type">
                <span class="type-badge" [class]="'type-' + visit.visit_type">{{ visit.visit_type }}</span>
                <span *ngIf="visit.visit_type === 'Emergency'" class="emergency-badge">🚨 Emergency</span>
              </div>
              <div class="visit-complaint">{{ visit.chief_complaint }}</div>
              <div *ngIf="visit.diagnosis" class="visit-diagnosis">{{ visit.diagnosis }}</div>
              <div *ngIf="visit.clinic_staff" class="visit-staff">
                Attended by: {{ visit.clinic_staff.name }} ({{ visit.clinic_staff.position }})
              </div>
            </div>
            
            <div class="visit-arrow">→</div>
          </div>

          <div *ngIf="visitHistory.statistics.total_visits === 0" class="no-visits">
            <div class="no-visits-icon">🏥</div>
            <h3>No Medical Visits</h3>
            <p>You haven't had any medical visits recorded yet.</p>
          </div>
        </div>
      </div>

      <!-- Visit Details Modal -->
      <div *ngIf="selectedVisit" class="modal-overlay" (click)="closeModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Visit Details</h2>
            <button class="close-btn" (click)="closeModal()">×</button>
          </div>
          
          <div class="modal-body">
            <div class="detail-grid">
              <div class="detail-item">
                <label>Date & Time</label>
                <div class="detail-value">
                  {{ formatDate(selectedVisit.visit_datetime) }} at {{ formatTime(selectedVisit.visit_datetime) }}
                </div>
              </div>
              
              <div class="detail-item">
                <label>Visit Type</label>
                <div class="detail-value">{{ selectedVisit.visit_type }}</div>
              </div>
              
              <div class="detail-item">
                <label>Status</label>
                <div class="detail-value">
                  <span class="status-badge" [class]="'status-' + selectedVisit.status.toLowerCase()">
                    {{ selectedVisit.status }}
                  </span>
                </div>
              </div>
              
              <div class="detail-item full-width">
                <label>Diagnosis</label>
                <div class="detail-value">{{ selectedVisit.diagnosis }}</div>
              </div>
              
              <div *ngIf="selectedVisit.clinic_staff" class="detail-item full-width">
                <label>Attended By</label>
                <div class="detail-value staff-info">
                  <div class="staff-name">{{ selectedVisit.clinic_staff.name }}</div>
                  <div class="staff-position">{{ selectedVisit.clinic_staff.position }}</div>
                  <div *ngIf="selectedVisit.clinic_staff.contact" class="staff-contact">
                    Contact: {{ selectedVisit.clinic_staff.contact }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./visits-history.component.scss']
})
export class VisitsHistoryComponent implements OnInit {
  visitHistory: VisitHistoryData | null = null;
  selectedVisit: any | null = null;
  loading = true;
  error: string | null = null;

  constructor(
    private medicalVisitService: MedicalVisitService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadVisitHistory();
  }

  private loadVisitHistory() {
    this.loading = true;
    this.error = null;

    const currentUser = this.authService.currentUserValue;
    if (!currentUser?.student_info?.student_id) {
      this.error = 'Student information not available';
      this.loading = false;
      return;
    }

    this.medicalVisitService.getStudentVisitHistory(currentUser.student_info.student_id).subscribe({
      next: (data) => {
        this.visitHistory = data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading visit history:', error);
        this.error = 'Failed to load visit history. Please try again.';
        this.loading = false;
      }
    });
  }

  selectVisit(visit: any) {
    this.selectedVisit = visit;
  }

  closeModal() {
    this.selectedVisit = null;
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getLastVisitText(): string {
    if (!this.visitHistory?.statistics.last_visit) return 'Never';
    
    const daysAgo = this.visitHistory.statistics.last_visit.days_ago;
    
    if (daysAgo === 0) return 'Today';
    if (daysAgo === 1) return 'Yesterday';
    if (daysAgo < 7) return `${daysAgo} days ago`;
    if (daysAgo < 30) return `${Math.floor(daysAgo / 7)} weeks ago`;
    if (daysAgo < 365) return `${Math.floor(daysAgo / 30)} months ago`;
    return `${Math.floor(daysAgo / 365)} years ago`;
  }
}