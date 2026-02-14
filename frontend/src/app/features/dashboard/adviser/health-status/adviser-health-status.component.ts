import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';
import { AdviserService, AdvisedStudent } from '../../../../core/services/adviser.service';
import { StudentProfileModalComponent } from '../student-profile-modal/student-profile-modal.component';

@Component({
  selector: 'app-adviser-health-status',
  standalone: true,
  imports: [CommonModule, FormsModule, StudentProfileModalComponent],
  template: `
    <div class="adviser-health-status">
      <div *ngIf="loading" class="loading-state">
        <p>Loading students...</p>
      </div>

      <div *ngIf="error" class="error-state">
        <p>{{ error }}</p>
        <button (click)="loadStudents()">Retry</button>
      </div>

      <div *ngIf="!loading && !error" class="dashboard-wrap">
        <div class="overview-card">
          <div class="overview-title">Dashboard Overview</div>
          <div class="overview-sub">Welcome back, {{ adviserName }}!</div>
          <div class="overview-meta">{{ advisoryClass || 'Advisory Class' }} • {{ totalStudents }} Students</div>

          <div class="stats-row">
            <div class="stat-tile tile-fit">
              <div class="tile-value">{{ fitCount }}</div>
              <div class="tile-label">Fit for Activities</div>
            </div>
            <div class="stat-tile tile-pending">
              <div class="tile-value">{{ pendingCount }}</div>
              <div class="tile-label">Pending Assessment</div>
            </div>
            <div class="stat-tile tile-restricted">
              <div class="tile-value">{{ restrictedCount }}</div>
              <div class="tile-label">Restricted Activities</div>
            </div>
            <div class="stat-tile tile-special">
              <div class="tile-value">{{ specialCount }}</div>
              <div class="tile-label">Special Medical Needs</div>
            </div>
          </div>
        </div>

        <div class="table-card">
          <div class="table-header">
            <div class="table-title">Student Health Status</div>

            <div class="search-wrap">
              <input
                type="text"
                class="search-input"
                [(ngModel)]="searchTerm"
                placeholder="Search">
              <span class="search-icon" aria-hidden="true"><i class="fa-solid fa-magnifying-glass"></i></span>
            </div>
          </div>

          <div class="table">
            <div class="thead">
              <div>Student Name</div>
              <div>LRN</div>
              <div>Status</div>
              <div>Last Check-up</div>
              <div>Notes</div>
              <div class="right">Actions</div>
            </div>

            <div class="tbody" *ngIf="filteredStudents.length > 0">
              <div class="trow" *ngFor="let student of filteredStudents">
                <div class="student-cell">
                  <span class="student-name">{{ student.full_name }}</span>
                </div>
                <div class="muted">{{ student.student_number }}</div>
                <div>
                  <span class="status-pill" [ngClass]="getStatusClass(student)">{{ getStatusText(student) }}</span>
                </div>
                <div class="muted">{{ getLastCheckup(student) }}</div>
                <div class="muted">{{ getNotes(student) }}</div>
                <div class="right">
                  <button type="button" class="icon-action" (click)="viewFullRecord(student)" title="View">
                    <img src="assets/view-icon.png" alt="View" class="action-icon">
                  </button>
                </div>
              </div>
            </div>

            <div class="empty" *ngIf="filteredStudents.length === 0">
              No students found.
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
    </div>
  `,
  styles: [`
    .adviser-health-status {
      padding: 2rem;
      background: #f5f7fa;
      min-height: 100vh;
    }

    .dashboard-wrap {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1rem;
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
      font-size: 1.6rem;
      font-weight: 900;
      line-height: 1;
    }

    .tile-label {
      font-size: 0.85rem;
      font-weight: 700;
      opacity: 0.95;
    }

    .tile-fit { background: linear-gradient(135deg, #6489f7 0%, #c0d0ff 100%); }
    .tile-pending { background: linear-gradient(135deg, #f78e64 0%, #ffc0c0 100%); }
    .tile-restricted { background: linear-gradient(135deg, #f7bf64 0%, #ffd8c0 100%); }
    .tile-special { background: linear-gradient(135deg, #ab64f7 0%, #dcc0ff 100%); }

    .table-card {
      background: #fff;
      border-radius: 12px;
      padding: 1.25rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }

    .table-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 0.75rem;
    }

    .table-title {
      font-size: 1.25rem;
      font-weight: 900;
      color: #4f7ea9;
    }

    .search-wrap {
      position: relative;
      width: 340px;
      max-width: 100%;
    }

    .search-input {
      width: 100%;
      height: 36px;
      border-radius: 999px;
      border: 1px solid rgba(229, 231, 235, 0.9);
      padding: 0 38px 0 14px;
      background: #f8fafc;
      outline: none;
      font-size: 0.9rem;
    }

    .search-icon {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      opacity: 0.65;
      font-size: 0.9rem;
      pointer-events: none;
    }

    .table {
      width: 100%;
      border-radius: 12px;
      overflow: hidden;
      background: #fff;
      border: 1px solid rgba(229, 231, 235, 0.9);
    }

    .thead {
      display: grid;
      grid-template-columns: 2fr 1.4fr 1fr 1.4fr 1.6fr 0.6fr;
      gap: 1rem;
      padding: 0.85rem 1rem;
      font-weight: 800;
      color: #111827;
      background: #fff;
    }

    .tbody .trow {
      display: grid;
      grid-template-columns: 2fr 1.4fr 1fr 1.4fr 1.6fr 0.6fr;
      gap: 1rem;
      padding: 0.85rem 1rem;
      align-items: center;
      border-top: 1px solid rgba(229, 231, 235, 0.9);
    }

    .student-name {
      font-weight: 700;
      color: #111827;
    }

    .muted {
      color: #6b7280;
      font-size: 0.9rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .right {
      display: flex;
      justify-content: flex-end;
    }

    .status-pill {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.2rem 0.6rem;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 800;
    }

    .status-pill.fit {
      background: rgba(34, 197, 94, 0.18);
      color: #166534;
    }

    .status-pill.restricted {
      background: rgba(239, 68, 68, 0.18);
      color: #991b1b;
    }

    .status-pill.pending {
      background: rgba(245, 158, 11, 0.22);
      color: #92400e;
    }

    .status-pill.special {
      background: rgba(168, 85, 247, 0.18);
      color: #6b21a8;
    }

    .icon-action {
      width: 34px;
      height: 34px;
      border-radius: 999px;
      border: 0;
      background: transparent;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    }

    .icon-action:hover {
      background: rgba(15, 23, 42, 0.06);
    }

    .action-icon {
      width: 18px;
      height: 18px;
      display: block;
      object-fit: contain;
      opacity: 0.9;
    }

    .empty {
      padding: 1.25rem;
      text-align: center;
      color: #6b7280;
      border-top: 1px solid rgba(229, 231, 235, 0.9);
    }

    @media (max-width: 1024px) {
      .stats-row { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .thead, .tbody .trow { grid-template-columns: 2fr 1.3fr 1fr 1.3fr 1.4fr 0.6fr; }
    }

    @media (max-width: 768px) {
      .table-header { flex-direction: column; align-items: flex-start; }
      .search-wrap { width: 100%; }
      .thead, .tbody .trow { grid-template-columns: 1.6fr 1fr 1fr 1fr 0.6fr; }
      .thead div:nth-child(5), .tbody .trow div:nth-child(5) { display: none; }
    }
  `]
})
export class AdviserHealthStatusComponent implements OnInit {
  selectedStudent: any = null;
  loading = true;
  error = '';

  adviserName = 'Adviser';
  advisoryClass = '';
  searchTerm = '';
  
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
    const currentUser = this.authService.currentUserValue;
    if (currentUser) {
      this.adviserName = currentUser.full_name || 'Adviser';
    }
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
          this.advisoryClass = response.adviser?.advisory_class || '';
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

  get filteredStudents(): AdvisedStudent[] {
    const q = (this.searchTerm || '').trim().toLowerCase();
    if (!q) return this.studentsHealth;
    return this.studentsHealth.filter(s => {
      const name = (s.full_name || '').toLowerCase();
      const lrn = (s.student_number || '').toLowerCase();
      return name.includes(q) || lrn.includes(q);
    });
  }

  get totalStudents(): number {
    return this.studentsHealth.length;
  }

  get fitCount(): number {
    return this.studentsHealth.filter(s => this.getStatusClass(s) === 'fit').length;
  }

  get pendingCount(): number {
    return this.studentsHealth.filter(s => this.getStatusClass(s) === 'pending').length;
  }

  get restrictedCount(): number {
    return this.studentsHealth.filter(s => this.getStatusClass(s) === 'restricted').length;
  }

  get specialCount(): number {
    return this.studentsHealth.filter(s => this.getStatusClass(s) === 'special').length;
  }

  getStatusClass(student: AdvisedStudent): 'fit' | 'pending' | 'restricted' | 'special' {
    const status = (student.last_visit?.status || '').toLowerCase();
    if (status === 'pending' || status === 'ongoing') return 'pending';
    if (student.allergies && student.allergies.length > 0) return 'restricted';
    return 'fit';
  }

  getStatusText(student: AdvisedStudent): string {
    const cls = this.getStatusClass(student);
    if (cls === 'pending') return 'Pending';
    if (cls === 'restricted') return 'Restricted';
    if (cls === 'special') return 'Special';
    return 'Fit';
  }

  getLastCheckup(student: AdvisedStudent): string {
    if (!student.last_visit?.visit_date) return '--';
    return this.formatDate(student.last_visit.visit_date);
  }

  getNotes(student: AdvisedStudent): string {
    if (student.allergies && student.allergies.length > 0) return 'Restricted';
    if (student.last_visit?.reason) return student.last_visit.reason;
    return 'No restrictions';
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
