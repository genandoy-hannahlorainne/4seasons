import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../core/services/auth.service';
import { AdviserService, AdvisedStudent } from '../../../../core/services/adviser.service';
import { StudentProfileModalComponent } from '../student-profile-modal/student-profile-modal.component';

@Component({
  selector: 'app-adviser-health-status',
  standalone: true,
  imports: [CommonModule, StudentProfileModalComponent],
  template: `
    <div class="adviser-health-status">
      <div class="health-header">
        <h1>Health Status Overview</h1>
        <p>Summary of health status for students under your advisory</p>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="loading-state">
        <p>Loading students...</p>
      </div>

      <!-- Error State -->
      <div *ngIf="error" class="error-state">
        <p>{{ error }}</p>
        <button (click)="loadStudents()">Retry</button>
      </div>

      <div *ngIf="!loading && !error">
        <!-- Quick Stats -->
        <div class="quick-stats">
          <div class="stat-item total">
            <div class="stat-icon">👥</div>
            <div class="stat-value">{{ studentsHealth.length }}</div>
            <div class="stat-label">Total Students</div>
          </div>
          <div class="stat-item visits">
            <div class="stat-icon">🏥</div>
            <div class="stat-value">{{ recentVisitsCount }}</div>
            <div class="stat-label">With Clinic Visits</div>
          </div>
          <div class="stat-item allergies">
            <div class="stat-icon">⚠️</div>
            <div class="stat-value">{{ studentsWithAllergiesCount }}</div>
            <div class="stat-label">With Allergies</div>
          </div>
        </div>

        <!-- Student Health Cards -->
        <div class="students-health-grid" *ngIf="studentsHealth.length > 0">
          <div *ngFor="let student of studentsHealth" class="student-health-card">
            <div class="card-header">
              <div class="student-avatar">
                <img [src]="getAvatarUrl(student)" [alt]="student.full_name">
              </div>
              <div class="student-basic-info">
                <div class="student-name">{{ student.full_name }}</div>
                <div class="student-number">{{ student.student_number }}</div>
                <div class="student-section">{{ student.grade_section }}</div>
              </div>
            </div>

            <div class="vitals-summary">
              <h4>Basic Info</h4>
              <div class="vitals-grid">
                <div class="vital-item">
                  <span class="vital-icon">🩸</span>
                  <span class="vital-label">Blood Type</span>
                  <span class="vital-value">{{ student.blood_type || 'N/A' }}</span>
                </div>
                <div class="vital-item">
                  <span class="vital-icon">👤</span>
                  <span class="vital-label">Gender</span>
                  <span class="vital-value">{{ student.gender === 'F' ? 'Female' : (student.gender === 'M' ? 'Male' : 'Other') }}</span>
                </div>
                <div class="vital-item">
                  <span class="vital-icon">📅</span>
                  <span class="vital-label">Birthday</span>
                  <span class="vital-value">{{ formatBirthday(student.birth_date) }}</span>
                </div>
                <div class="vital-item">
                  <span class="vital-icon">📞</span>
                  <span class="vital-label">Contact</span>
                  <span class="vital-value">{{ student.phone || 'N/A' }}</span>
                </div>
              </div>
            </div>

            <div class="last-visit-info">
              <h4>Last Clinic Visit</h4>
              <div class="visit-details" *ngIf="student.last_visit">
                <div class="visit-date">
                  <span class="visit-icon">📅</span>
                  {{ formatDate(student.last_visit.visit_date) }}
                </div>
                <div class="visit-reason">
                  <span class="visit-icon">📋</span>
                  {{ student.last_visit.reason }}
                </div>
                <div class="visit-status" [ngClass]="student.last_visit.status.toLowerCase()">
                  {{ student.last_visit.status }}
                </div>
              </div>
              <div class="no-visit" *ngIf="!student.last_visit">
                No clinic visits recorded
              </div>
            </div>

            <div class="card-footer">
              <div class="allergies-info" *ngIf="student.allergies && student.allergies.length > 0">
                <span class="allergy-icon">⚠️</span>
                <span class="allergy-text">Allergies: {{ student.allergies.join(', ') }}</span>
              </div>
              <button class="btn-view-full" (click)="viewFullRecord(student)">
                View Full Record
              </button>
            </div>
          </div>
        </div>

        <div class="no-students" *ngIf="studentsHealth.length === 0">
          <p>No students registered in your advisory class yet.</p>
        </div>
      </div>

      <!-- Student Profile Modal -->
      <app-student-profile-modal 
        *ngIf="selectedStudent" 
        [student]="selectedStudent" 
        (close)="closeModal()">
      </app-student-profile-modal>
    </div>
  `,
  styles: [`
    .adviser-health-status {
      padding: 2rem;
      background: #f5f7fa;
      min-height: 100vh;
    }

    .health-header {
      margin-bottom: 1.5rem;
      h1 { font-size: 1.8rem; color: #2c3e50; margin-bottom: 0.5rem; font-weight: 600; }
      p { color: #7f8c8d; font-size: 1rem; }
    }

    .loading-state, .error-state {
      text-align: center;
      padding: 3rem;
      background: white;
      border-radius: 12px;
      p { color: #7f8c8d; margin-bottom: 1rem; }
      button {
        padding: 0.5rem 1.5rem;
        background: #007bff;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
      }
    }

    .quick-stats {
      display: flex;
      gap: 1rem;
      margin-bottom: 2rem;
      
      .stat-item {
        flex: 1;
        background: white;
        border-radius: 12px;
        padding: 1.5rem;
        text-align: center;
        box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        
        .stat-icon { font-size: 2rem; margin-bottom: 0.5rem; }
        .stat-value { font-size: 2.5rem; font-weight: 700; color: #2c3e50; }
        .stat-label { color: #7f8c8d; font-size: 0.9rem; }
        
        &.total { border-top: 4px solid #3498db; }
        &.visits { border-top: 4px solid #e74c3c; }
        &.allergies { border-top: 4px solid #f39c12; }
      }
    }

    .students-health-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 1.5rem;
    }

    .student-health-card {
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      transition: all 0.2s ease;
      border-left: 4px solid #3498db;
      
      &:hover {
        transform: translateY(-3px);
        box-shadow: 0 8px 20px rgba(0,0,0,0.12);
      }
    }

    .card-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.25rem;
      background: #f8f9fa;
      border-bottom: 1px solid #e9ecef;
      
      .student-avatar {
        width: 55px;
        height: 55px;
        img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; }
      }
      
      .student-basic-info {
        flex: 1;
        .student-name { font-weight: 600; color: #2c3e50; font-size: 1rem; }
        .student-number { color: #7f8c8d; font-size: 0.85rem; }
        .student-section { color: #95a5a6; font-size: 0.8rem; }
      }
    }

    .vitals-summary {
      padding: 1rem 1.25rem;
      border-bottom: 1px solid #e9ecef;
      
      h4 { font-size: 0.85rem; color: #6c757d; margin-bottom: 0.75rem; font-weight: 600; }
      
      .vitals-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 0.5rem;
        
        .vital-item {
          text-align: center;
          padding: 0.5rem;
          background: #f8f9fa;
          border-radius: 8px;
          
          .vital-icon { display: block; font-size: 1rem; margin-bottom: 0.25rem; }
          .vital-label { display: block; font-size: 0.7rem; color: #7f8c8d; margin-bottom: 0.25rem; }
          .vital-value { display: block; font-size: 0.8rem; font-weight: 600; color: #2c3e50; }
        }
      }
    }

    .last-visit-info {
      padding: 1rem 1.25rem;
      border-bottom: 1px solid #e9ecef;
      
      h4 { font-size: 0.85rem; color: #6c757d; margin-bottom: 0.75rem; font-weight: 600; }
      
      .visit-details {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        align-items: center;
        
        .visit-date, .visit-reason {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.85rem;
          color: #495057;
          .visit-icon { font-size: 0.9rem; }
        }
        
        .visit-status {
          padding: 0.25rem 0.6rem;
          border-radius: 10px;
          font-size: 0.75rem;
          font-weight: 600;
          
          &.resolved, &.completed { background: #d4edda; color: #155724; }
          &.ongoing, &.pending { background: #fff3cd; color: #856404; }
          &.follow-up { background: #d1ecf1; color: #0c5460; }
        }
      }
      
      .no-visit { color: #95a5a6; font-size: 0.85rem; font-style: italic; }
    }

    .card-footer {
      padding: 1rem 1.25rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .allergies-info {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        .allergy-icon { font-size: 0.9rem; }
        .allergy-text { font-size: 0.8rem; color: #dc3545; font-weight: 500; }
      }
      
      .btn-view-full {
        padding: 0.5rem 1rem;
        background: #007bff;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.85rem;
        font-weight: 500;
        transition: background 0.2s;
        &:hover { background: #0056b3; }
      }
    }

    .no-students {
      text-align: center;
      padding: 3rem;
      background: white;
      border-radius: 12px;
      color: #7f8c8d;
    }
  `]
})
export class AdviserHealthStatusComponent implements OnInit {
  selectedStudent: any = null;
  loading = true;
  error = '';
  
  studentsHealth: AdvisedStudent[] = [];

  constructor(
    private authService: AuthService,
    private adviserService: AdviserService
  ) {}

  get recentVisitsCount(): number {
    return this.studentsHealth.filter(s => s.last_visit !== null).length;
  }

  get studentsWithAllergiesCount(): number {
    return this.studentsHealth.filter(s => s.allergies && s.allergies.length > 0).length;
  }

  ngOnInit(): void {
    this.loadStudents();
  }

  loadStudents(): void {
    this.loading = true;
    this.error = '';
    
    const currentUser = this.authService.currentUserValue;
    if (!currentUser?.user_id) {
      this.error = 'User not found';
      this.loading = false;
      return;
    }

    this.adviserService.getAdvisoryStudents(currentUser.user_id).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.studentsHealth = response.students;
        } else {
          this.error = 'Failed to load students';
        }
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Error loading students:', err);
        this.error = 'Failed to load students. Please try again.';
        this.loading = false;
      }
    });
  }

  getAvatarUrl(student: AdvisedStudent): string {
    return student.gender === 'F' ? 'assets/user-female.png' : 'assets/user-male.png';
  }

  formatBirthday(dateStr: string): string {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  viewFullRecord(student: AdvisedStudent): void {
    const birthDate = student.birth_date ? new Date(student.birth_date) : null;
    const age = birthDate ? Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : null;
    
    this.selectedStudent = {
      name: student.full_name,
      studentNumber: student.student_number,
      gradeSection: student.grade_section,
      avatar: this.getAvatarUrl(student),
      gender: student.gender === 'F' ? 'Female' : (student.gender === 'M' ? 'Male' : 'Other'),
      birthday: birthDate ? birthDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A',
      age: age,
      contact: student.phone || 'N/A',
      vitals: {
        height: 'N/A',
        weight: 'N/A',
        bmi: 'N/A',
        bloodType: student.blood_type || 'N/A'
      },
      allergies: student.allergies || [],
      emergencyContact: student.emergency_contact ? {
        name: student.emergency_contact,
        relation: 'Guardian',
        phone: 'N/A'
      } : null,
      lastVisit: student.last_visit ? {
        date: new Date(student.last_visit.visit_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        reason: student.last_visit.reason,
        status: student.last_visit.status?.toLowerCase() || 'resolved',
        statusText: student.last_visit.status || 'Completed'
      } : null
    };
  }

  closeModal(): void {
    this.selectedStudent = null;
  }
}
