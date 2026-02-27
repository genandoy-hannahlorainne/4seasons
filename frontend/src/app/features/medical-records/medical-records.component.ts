import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MedicalRecordsService, MedicalRecord } from './medical-records.service';
import { AuthService } from '../../core/services/auth.service';
import { Subject, interval } from 'rxjs';
import { takeUntil, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-medical-records',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="medical-records-container">
      <div class="header">
        <h1>My Medical Record</h1>
        <p class="subtitle">View and manage your medical information</p>
      </div>

      <div *ngIf="loading" class="loading">
        <div class="loading-spinner"></div>
        <p>Loading medical records...</p>
      </div>

      <div *ngIf="error" class="error-message">
        {{ error }}
      </div>

      <div *ngIf="medicalRecord && !loading" class="content">
        <div class="overview-cards">
          <div class="overview-card">
            <div class="card-icon">🩺</div>
            <div class="card-content">
              <h3>Total Visits</h3>
              <div class="card-value">{{ medicalRecord.total_visits_count }}</div>
            </div>
          </div>
          
          <div class="overview-card">
            <div class="card-icon">📅</div>
            <div class="card-content">
              <h3>Recent Visits</h3>
              <div class="card-value">{{ medicalRecord.recent_visits_count }}</div>
              <div class="card-subtitle">Last 30 days</div>
            </div>
          </div>
          
          <div class="overview-card">
            <div class="card-icon">⚠️</div>
            <div class="card-content">
              <h3>Allergies</h3>
              <div class="card-value">{{ medicalRecord.allergies.length }}</div>
            </div>
          </div>

          <div class="overview-card">
            <div class="card-icon">👨‍🏫</div>
            <div class="card-content">
              <h3>Adviser</h3>
              <div class="card-value" style="font-size: 0.9rem;">
                {{ medicalRecord.personal_info.adviser_name || 'Not assigned' }}
              </div>
            </div>
          </div>
        </div>

        <div class="action-cards">
          <div class="action-card" routerLink="personal-info">
            <div class="action-icon">👤</div>
            <div class="action-content">
              <h3>Personal Medical Info</h3>
              <p>View and update your personal medical information, height, weight, allergies, and emergency contact</p>
            </div>
            <div class="action-arrow">→</div>
          </div>

          <div class="action-card" routerLink="visits-history">
            <div class="action-icon">📋</div>
            <div class="action-content">
              <h3>Medical Visits History</h3>
              <p>View your complete medical visits history and detailed visit information</p>
            </div>
            <div class="action-arrow">→</div>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./medical-records.component.scss']
})
export class MedicalRecordsComponent implements OnInit, OnDestroy {
  medicalRecord: MedicalRecord | null = null;
  loading = true;
  error: string | null = null;
  private destroy$ = new Subject<void>();
  private refreshInterval = 30000; // 30 seconds

  constructor(
    private medicalRecordsService: MedicalRecordsService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadMedicalRecord();
    
    // Auto-refresh medical data every 30 seconds
    interval(this.refreshInterval)
      .pipe(
        switchMap(() => this.medicalRecordsService.getMedicalRecord()),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.medicalRecord = response.data;
          }
        },
        error: (err) => {
          console.error('Auto-refresh error:', err);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadMedicalRecord() {
    this.loading = true;
    this.error = null;

    this.medicalRecordsService.getMedicalRecord().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.medicalRecord = response.data;
        } else {
          this.error = response.message || 'Failed to load medical record';
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading medical record:', error);
        this.error = 'Failed to load medical record. Please try again.';
        this.loading = false;
      }
    });
  }
}