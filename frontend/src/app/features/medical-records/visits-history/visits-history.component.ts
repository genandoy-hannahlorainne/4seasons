import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MedicalRecordsService, MedicalVisit } from '../medical-records.service';

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

      <div *ngIf="visits && !loading" class="content">
        <div class="visits-summary">
          <div class="summary-card">
            <div class="summary-icon">📋</div>
            <div class="summary-content">
              <div class="summary-value">{{ visits.length }}</div>
              <div class="summary-label">Total Visits</div>
            </div>
          </div>
          
          <div class="summary-card">
            <div class="summary-icon">📅</div>
            <div class="summary-content">
              <div class="summary-value">{{ getRecentVisitsCount() }}</div>
              <div class="summary-label">This Month</div>
            </div>
          </div>
          
          <div class="summary-card">
            <div class="summary-icon">🩺</div>
            <div class="summary-content">
              <div class="summary-value">{{ getLastVisitDate() }}</div>
              <div class="summary-label">Last Visit</div>
            </div>
          </div>
        </div>

        <div class="visits-list">
          <div *ngFor="let visit of visits" class="visit-card" (click)="selectVisit(visit)">
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
              <div class="visit-type">{{ visit.visit_type }}</div>
              <div class="visit-diagnosis">{{ visit.diagnosis }}</div>
              <div *ngIf="visit.clinic_staff" class="visit-staff">
                Attended by: {{ visit.clinic_staff.name }} ({{ visit.clinic_staff.position }})
              </div>
            </div>
            
            <div class="visit-arrow">→</div>
          </div>

          <div *ngIf="visits.length === 0" class="no-visits">
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
  visits: MedicalVisit[] = [];
  selectedVisit: MedicalVisit | null = null;
  loading = true;
  error: string | null = null;

  constructor(private medicalRecordsService: MedicalRecordsService) {}

  ngOnInit() {
    this.loadVisits();
  }

  private loadVisits() {
    this.loading = true;
    this.error = null;

    this.medicalRecordsService.getMedicalVisits().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.visits = response.data;
        } else {
          this.error = response.message || 'Failed to load visits history';
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading visits:', error);
        this.error = 'Failed to load visits history. Please try again.';
        this.loading = false;
      }
    });
  }

  selectVisit(visit: MedicalVisit) {
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

  getRecentVisitsCount(): number {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    return this.visits.filter(visit => 
      new Date(visit.visit_datetime) >= oneMonthAgo
    ).length;
  }

  getLastVisitDate(): string {
    if (this.visits.length === 0) return 'Never';
    
    const lastVisit = this.visits[0]; // Already sorted by date desc
    const date = new Date(lastVisit.visit_datetime);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  }
}