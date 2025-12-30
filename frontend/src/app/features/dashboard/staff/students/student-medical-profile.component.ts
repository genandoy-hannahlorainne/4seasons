import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';

@Component({
  selector: 'app-student-medical-profile',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="medical-profile-page">
      <div class="page-header">
        <button class="back-btn" routerLink="/dashboard/staff/students">← Back to Students</button>
        <h1>Student Medical Profile</h1>
      </div>

      <!-- Student Info Card -->
      <div class="student-info-card">
        <div class="student-avatar">
          <img [src]="student.avatar" [alt]="student.name">
        </div>
        <div class="student-details">
          <h2>{{ student.name }}</h2>
          <p class="student-number">{{ student.studentNumber }}</p>
          <p class="student-grade">{{ student.gradeSection }}</p>
        </div>
        <div class="student-actions">
          <button class="btn btn-primary" routerLink="/dashboard/staff/visits/new" [queryParams]="{studentId: studentId}">
            + New Visit
          </button>
        </div>
      </div>

      <!-- Tabs -->
      <div class="profile-tabs">
        <button class="tab" [class.active]="activeTab === 'vitals'" (click)="activeTab = 'vitals'">Vitals History</button>
        <button class="tab" [class.active]="activeTab === 'diagnoses'" (click)="activeTab = 'diagnoses'">Diagnoses</button>
        <button class="tab" [class.active]="activeTab === 'treatments'" (click)="activeTab = 'treatments'">Treatments</button>
        <button class="tab" [class.active]="activeTab === 'medications'" (click)="activeTab = 'medications'">Medications</button>
        <button class="tab" [class.active]="activeTab === 'immunizations'" (click)="activeTab = 'immunizations'">Immunizations</button>
      </div>

      <!-- Tab Content -->
      <div class="tab-content">
        <!-- Vitals History -->
        <div *ngIf="activeTab === 'vitals'" class="content-section">
          <div class="section-header">
            <h3>Vitals History</h3>
          </div>
          <div class="empty-state" *ngIf="vitalsHistory.length === 0">
            <p>No vitals recorded yet</p>
          </div>
          <table class="data-table" *ngIf="vitalsHistory.length > 0">
            <thead>
              <tr>
                <th>Date</th>
                <th>Temperature</th>
                <th>Blood Pressure</th>
                <th>Pulse Rate</th>
                <th>Weight</th>
                <th>Height</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let vital of vitalsHistory">
                <td>{{ vital.date }}</td>
                <td>{{ vital.temperature }}°C</td>
                <td>{{ vital.bloodPressure }}</td>
                <td>{{ vital.pulseRate }} bpm</td>
                <td>{{ vital.weight }} kg</td>
                <td>{{ vital.height }} cm</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Diagnoses -->
        <div *ngIf="activeTab === 'diagnoses'" class="content-section">
          <div class="section-header">
            <h3>Diagnoses</h3>
          </div>
          <div class="empty-state" *ngIf="diagnoses.length === 0">
            <p>No diagnoses recorded yet</p>
          </div>
          <div class="card-list" *ngIf="diagnoses.length > 0">
            <div *ngFor="let diagnosis of diagnoses" class="info-card">
              <div class="card-header">
                <span class="card-title">{{ diagnosis.condition }}</span>
                <span class="card-date">{{ diagnosis.date }}</span>
              </div>
              <p class="card-description">{{ diagnosis.notes }}</p>
              <span class="status-badge" [class]="diagnosis.status">{{ diagnosis.status }}</span>
            </div>
          </div>
        </div>

        <!-- Treatments -->
        <div *ngIf="activeTab === 'treatments'" class="content-section">
          <div class="section-header">
            <h3>Treatments</h3>
          </div>
          <div class="empty-state" *ngIf="treatments.length === 0">
            <p>No treatments recorded yet</p>
          </div>
          <div class="card-list" *ngIf="treatments.length > 0">
            <div *ngFor="let treatment of treatments" class="info-card">
              <div class="card-header">
                <span class="card-title">{{ treatment.name }}</span>
                <span class="card-date">{{ treatment.date }}</span>
              </div>
              <p class="card-description">{{ treatment.description }}</p>
            </div>
          </div>
        </div>

        <!-- Medications -->
        <div *ngIf="activeTab === 'medications'" class="content-section">
          <div class="section-header">
            <h3>Medications</h3>
          </div>
          <div class="empty-state" *ngIf="medications.length === 0">
            <p>No medications recorded yet</p>
          </div>
          <table class="data-table" *ngIf="medications.length > 0">
            <thead>
              <tr>
                <th>Medication</th>
                <th>Dosage</th>
                <th>Frequency</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let med of medications">
                <td>{{ med.name }}</td>
                <td>{{ med.dosage }}</td>
                <td>{{ med.frequency }}</td>
                <td>{{ med.startDate }}</td>
                <td>{{ med.endDate || 'Ongoing' }}</td>
                <td><span class="status-badge" [class]="med.status">{{ med.status }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Immunizations -->
        <div *ngIf="activeTab === 'immunizations'" class="content-section">
          <div class="section-header">
            <h3>Immunizations</h3>
          </div>
          <div class="empty-state" *ngIf="immunizations.length === 0">
            <p>No immunization records yet</p>
          </div>
          <table class="data-table" *ngIf="immunizations.length > 0">
            <thead>
              <tr>
                <th>Vaccine</th>
                <th>Date Administered</th>
                <th>Dose</th>
                <th>Administered By</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let imm of immunizations">
                <td>{{ imm.vaccine }}</td>
                <td>{{ imm.date }}</td>
                <td>{{ imm.dose }}</td>
                <td>{{ imm.administeredBy }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .medical-profile-page {
      padding: 2rem;
      background: #f5f7fa;
      min-height: 100vh;
    }

    .page-header {
      margin-bottom: 1.5rem;
      .back-btn {
        background: none;
        border: none;
        color: #007bff;
        cursor: pointer;
        font-size: 0.9rem;
        margin-bottom: 0.5rem;
        padding: 0;
        &:hover { text-decoration: underline; }
      }
      h1 { font-size: 1.8rem; color: #2c3e50; font-weight: 600; }
    }

    .student-info-card {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      display: flex;
      align-items: center;
      gap: 1.5rem;
      margin-bottom: 1.5rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);

      .student-avatar img {
        width: 80px;
        height: 80px;
        border-radius: 50%;
      }

      .student-details {
        flex: 1;
        h2 { margin: 0 0 0.25rem; color: #2c3e50; }
        .student-number { color: #007bff; font-weight: 500; margin: 0; }
        .student-grade { color: #7f8c8d; margin: 0; }
      }

      .btn {
        padding: 0.75rem 1.5rem;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 500;
        &.btn-primary { background: #007bff; color: white; &:hover { background: #0056b3; } }
      }
    }

    .profile-tabs {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1.5rem;
      background: white;
      padding: 0.5rem;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);

      .tab {
        padding: 0.75rem 1.5rem;
        border: none;
        background: transparent;
        color: #6c757d;
        cursor: pointer;
        border-radius: 8px;
        font-weight: 500;
        transition: all 0.2s ease;

        &:hover { background: #f8f9fa; }
        &.active { background: #007bff; color: white; }
      }
    }

    .tab-content {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }

    .section-header {
      margin-bottom: 1rem;
      h3 { color: #2c3e50; margin: 0; }
    }

    .empty-state {
      text-align: center;
      padding: 3rem;
      color: #7f8c8d;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;

      th, td {
        padding: 0.75rem;
        text-align: left;
        border-bottom: 1px solid #e9ecef;
      }

      th { background: #f8f9fa; font-weight: 600; color: #2c3e50; }
      tbody tr:hover { background: #f8f9fa; }
    }

    .card-list {
      display: grid;
      gap: 1rem;
    }

    .info-card {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 1rem;
      border-left: 4px solid #007bff;

      .card-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: 0.5rem;
      }
      .card-title { font-weight: 600; color: #2c3e50; }
      .card-date { color: #7f8c8d; font-size: 0.85rem; }
      .card-description { color: #6c757d; margin: 0; font-size: 0.9rem; }
    }

    .status-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 500;
      margin-top: 0.5rem;

      &.active { background: #d4edda; color: #155724; }
      &.resolved { background: #cce5ff; color: #004085; }
      &.ongoing { background: #fff3cd; color: #856404; }
    }
  `]
})
export class StudentMedicalProfileComponent implements OnInit {
  studentId: number = 0;
  activeTab = 'vitals';

  student = {
    name: 'Loading...',
    studentNumber: '',
    gradeSection: '',
    avatar: 'assets/user-male.png'
  };

  vitalsHistory: any[] = [];
  diagnoses: any[] = [];
  treatments: any[] = [];
  medications: any[] = [];
  immunizations: any[] = [];

  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.studentId = Number(this.route.snapshot.paramMap.get('id'));
    // Load student data from API
  }
}
