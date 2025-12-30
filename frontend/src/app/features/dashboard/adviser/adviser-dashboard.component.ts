import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { AdviserService, AdvisedStudent } from '../../../core/services/adviser.service';
import { StudentProfileModalComponent } from './student-profile-modal/student-profile-modal.component';

@Component({
  selector: 'app-adviser-dashboard',
  standalone: true,
  imports: [CommonModule, StudentProfileModalComponent],
  template: `
    <div class="adviser-dashboard">
      <div class="dashboard-header">
        <h1>Welcome back, {{ adviserName }}!</h1>
        <p class="advisory-info">Advisory Class: {{ advisoryClass }}</p>
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
        <!-- Summary Cards -->
        <div class="summary-cards">
          <div class="summary-card total">
            <div class="card-icon">👥</div>
            <div class="card-info">
              <div class="card-value">{{ totalStudents }}</div>
              <div class="card-label">Total Students</div>
            </div>
          </div>
          <div class="summary-card visits">
            <div class="card-icon">🏥</div>
            <div class="card-info">
              <div class="card-value">{{ clinicVisitsThisMonth }}</div>
              <div class="card-label">Clinic Visits (This Month)</div>
            </div>
          </div>
          <div class="summary-card allergies">
            <div class="card-icon">⚠️</div>
            <div class="card-info">
              <div class="card-value">{{ studentsWithAllergies }}</div>
              <div class="card-label">With Allergies</div>
            </div>
          </div>
        </div>

        <!-- Students Under Advisory -->
        <div class="card students-section">
          <div class="card-header">
            <h2>Students Under Your Advisory</h2>
            <span class="student-count">{{ advisoryStudents.length }} students</span>
          </div>
          
          <div class="students-grid" *ngIf="advisoryStudents.length > 0">
            <div *ngFor="let student of advisoryStudents" class="student-card">
              <div class="student-avatar">
                <img [src]="getAvatarUrl(student)" [alt]="student.full_name">
              </div>
              <div class="student-info">
                <div class="student-name">{{ student.full_name }}</div>
                <div class="student-number">{{ student.student_number }}</div>
                <div class="student-section">{{ student.grade_section }}</div>
              </div>
              <div class="student-actions">
                <button class="btn-view" (click)="viewStudent(student)">View Profile</button>
              </div>
            </div>
          </div>

          <div class="no-students" *ngIf="advisoryStudents.length === 0">
            <p>No students registered in your advisory class yet.</p>
          </div>
        </div>

        <!-- Recent Activity -->
        <div class="card recent-activity" *ngIf="recentActivity.length > 0">
          <h2>Recent Clinic Activity</h2>
          <div class="activity-list">
            <div *ngFor="let activity of recentActivity" class="activity-item">
              <div class="activity-icon" [ngClass]="activity.type">
                <span *ngIf="activity.type === 'visit'">🏥</span>
                <span *ngIf="activity.type === 'alert'">⚠️</span>
                <span *ngIf="activity.type === 'checkup'">✅</span>
              </div>
              <div class="activity-content">
                <div class="activity-text">{{ activity.message }}</div>
                <div class="activity-time">{{ activity.time }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Student Profile Modal -->
    <app-student-profile-modal 
      *ngIf="selectedStudent" 
      [student]="selectedStudent" 
      (close)="closeModal()">
    </app-student-profile-modal>
  `,
  styles: [`
    .adviser-dashboard {
      padding: 2rem;
      background: #f5f7fa;
      min-height: 100vh;
    }

    .dashboard-header {
      margin-bottom: 2rem;
      
      h1 {
        font-size: 1.8rem;
        color: #2c3e50;
        margin-bottom: 0.5rem;
        font-weight: 600;
      }
      
      .advisory-info {
        color: #7f8c8d;
        font-size: 1rem;
      }
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

    .summary-cards {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .summary-card {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      
      .card-icon { font-size: 2.5rem; }
      .card-value { font-size: 2rem; font-weight: 700; color: #2c3e50; }
      .card-label { color: #7f8c8d; font-size: 0.9rem; }
      
      &.total { border-left: 4px solid #3498db; }
      &.visits { border-left: 4px solid #e74c3c; }
      &.allergies { border-left: 4px solid #f39c12; }
    }

    .card {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      margin-bottom: 1.5rem;
      
      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
        
        h2 { font-size: 1.3rem; color: #2c3e50; margin: 0; }
        .student-count {
          background: #e3f2fd;
          color: #1976d2;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-size: 0.9rem;
          font-weight: 600;
        }
      }
      
      h2 { font-size: 1.3rem; color: #2c3e50; margin-bottom: 1rem; }
    }

    .students-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1rem;
    }

    .student-card {
      background: #f8f9fa;
      border-radius: 10px;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      transition: all 0.2s ease;
      border: 1px solid #e9ecef;
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      }
      
      .student-avatar {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        overflow: hidden;
        margin: 0 auto;
        
        img { width: 100%; height: 100%; object-fit: cover; }
      }
      
      .student-info {
        text-align: center;
        .student-name { font-weight: 600; color: #2c3e50; font-size: 1rem; }
        .student-number { color: #7f8c8d; font-size: 0.85rem; }
        .student-section { color: #95a5a6; font-size: 0.8rem; }
      }
      
      .student-actions {
        .btn-view {
          width: 100%;
          padding: 0.5rem;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.85rem;
          transition: background 0.2s;
          &:hover { background: #0056b3; }
        }
      }
    }

    .no-students {
      text-align: center;
      padding: 2rem;
      color: #7f8c8d;
    }

    .activity-list {
      .activity-item {
        display: flex;
        gap: 1rem;
        padding: 1rem 0;
        border-bottom: 1px solid #e9ecef;
        &:last-child { border-bottom: none; }
        
        .activity-icon {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          &.visit { background: #e3f2fd; }
          &.alert { background: #fff3cd; }
          &.checkup { background: #d4edda; }
        }
        
        .activity-content {
          flex: 1;
          .activity-text { color: #2c3e50; font-size: 0.95rem; }
          .activity-time { color: #95a5a6; font-size: 0.8rem; margin-top: 0.25rem; }
        }
      }
    }
  `]
})
export class AdviserDashboardComponent implements OnInit {
  adviserName = '';
  advisoryClass = '';
  selectedStudent: any = null;
  loading = true;
  error = '';
  
  // Stats
  totalStudents = 0;
  clinicVisitsThisMonth = 0;
  studentsWithAllergies = 0;

  // Students from API
  advisoryStudents: AdvisedStudent[] = [];

  // Recent activity (generated from student visits)
  recentActivity: { type: string; message: string; time: string }[] = [];

  constructor(
    private authService: AuthService,
    private adviserService: AdviserService
  ) {}

  ngOnInit(): void {
    const currentUser = this.authService.currentUserValue;
    if (currentUser) {
      this.adviserName = currentUser.full_name || 'Adviser';
      this.loadStudents();
    }
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
          this.advisoryClass = response.adviser.advisory_class;
          this.advisoryStudents = response.students;
          this.totalStudents = response.stats.total_students;
          this.clinicVisitsThisMonth = response.stats.clinic_visits_this_month;
          this.studentsWithAllergies = response.stats.students_with_allergies;
          
          // Generate recent activity from student visits
          this.generateRecentActivity();
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

  generateRecentActivity(): void {
    this.recentActivity = [];
    
    // Get students with recent visits
    const studentsWithVisits = this.advisoryStudents
      .filter(s => s.last_visit)
      .sort((a, b) => {
        const dateA = new Date(a.last_visit?.visit_date || 0);
        const dateB = new Date(b.last_visit?.visit_date || 0);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 5);

    studentsWithVisits.forEach(student => {
      if (student.last_visit) {
        this.recentActivity.push({
          type: 'visit',
          message: `${student.full_name} visited the clinic - ${student.last_visit.reason}`,
          time: this.formatDate(student.last_visit.visit_date)
        });
      }
    });

    // Add allergy alerts
    this.advisoryStudents
      .filter(s => s.allergies && s.allergies.length > 0)
      .slice(0, 2)
      .forEach(student => {
        this.recentActivity.push({
          type: 'alert',
          message: `${student.full_name} has allergies: ${student.allergies.join(', ')}`,
          time: 'Active'
        });
      });
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  getAvatarUrl(student: AdvisedStudent): string {
    return student.gender === 'F' ? 'assets/user-female.png' : 'assets/user-male.png';
  }

  viewStudent(student: AdvisedStudent): void {
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
