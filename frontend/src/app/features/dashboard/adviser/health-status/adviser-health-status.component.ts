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

    /* ── Hero ── */
    .overview-card {
      background: linear-gradient(135deg, #052355 0%, #5381b2 100%);
      border-radius: 12px;
      padding: 2rem;
      margin-bottom: 2rem;
      color: white;
    }

    .overview-title {
      font-size: 1.6rem;
      font-weight: 700;
      margin-bottom: 0.25rem;
    }

    .overview-sub {
      opacity: 0.85;
      font-size: 0.95rem;
      margin-bottom: 0.2rem;
    }

    .overview-meta {
      opacity: 0.75;
      font-size: 0.85rem;
      margin-bottom: 1.5rem;
    }

    /* ── Stat Tiles ── */
    .stats-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
    }

    .stat-tile {
      background: rgba(255,255,255,0.15);
      border-radius: 10px;
      padding: 1rem 1.1rem;
      color: #fff;
      border-left: 3px solid rgba(255,255,255,0.4);
    }

    .tile-value { font-size: 1.8rem; font-weight: 700; line-height: 1; }
    .tile-label { font-size: 0.8rem; opacity: 0.9; margin-top: 0.3rem; }

    /* ── Loading / Error ── */
    .loading-state, .error-state {
      text-align: center;
      padding: 3rem;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);

      p { color: #7f8c8d; margin-bottom: 1rem; }
      button {
        padding: 0.5rem 1.5rem;
        background: #052355;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
      }
    }

    /* ── Table Card ── */
    .table-card {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }

    .table-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 1rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #e9ecef;
    }

    .table-title {
      font-size: 1.1rem;
      font-weight: 700;
      color: #2c3e50;
    }

    .search-wrap {
      position: relative;
      width: 280px;
      max-width: 100%;
    }

    .search-input {
      width: 100%;
      height: 36px;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
      padding: 0 36px 0 12px;
      background: #f8fafc;
      outline: none;
      font-size: 0.875rem;
      &:focus { border-color: #5381b2; }
    }

    .search-icon {
      position: absolute;
      right: 10px;
      top: 50%;
      transform: translateY(-50%);
      opacity: 0.5;
      font-size: 0.85rem;
      pointer-events: none;
    }

    .table {
      width: 100%;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid #e9ecef;
    }

    .thead {
      display: grid;
      grid-template-columns: 2fr 1.4fr 1fr 1.4fr 1.6fr 0.6fr;
      gap: 1rem;
      padding: 0.75rem 1rem;
      font-size: 0.78rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748b;
      background: #f8fafc;
      border-bottom: 1px solid #e9ecef;
    }

    .tbody .trow {
      display: grid;
      grid-template-columns: 2fr 1.4fr 1fr 1.4fr 1.6fr 0.6fr;
      gap: 1rem;
      padding: 0.85rem 1rem;
      align-items: center;
      border-top: 1px solid #f1f5f9;
      transition: background 0.15s;
      &:hover { background: #f8fafc; }
    }

    .student-name { font-weight: 600; color: #1e293b; font-size: 0.9rem; }

    .muted {
      color: #64748b;
      font-size: 0.875rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .right { display: flex; justify-content: flex-end; }

    .status-pill {
      display: inline-flex;
      align-items: center;
      padding: 0.2rem 0.65rem;
      border-radius: 999px;
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;

      &.fit        { background: #dcfce7; color: #15803d; }
      &.restricted { background: #fee2e2; color: #b91c1c; }
      &.pending    { background: #fef9c3; color: #a16207; }
      &.special    { background: #ede9fe; color: #6d28d9; }
    }

    .icon-action {
      width: 32px;
      height: 32px;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
      background: white;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.15s;
      &:hover { background: #f1f5f9; border-color: #cbd5e1; }
    }

    .action-icon { width: 16px; height: 16px; object-fit: contain; opacity: 0.8; }

    .empty {
      padding: 2rem;
      text-align: center;
      color: #94a3b8;
      font-size: 0.9rem;
      border-top: 1px solid #f1f5f9;
    }

    @media (max-width: 1024px) {
      .stats-row { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 768px) {
      .adviser-health-status { padding: 1rem; }
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

    this.adviserService.getAdvisoryStudents().subscribe({
      next: (response: any) => {
        if (response.success) {
          this.studentsHealth = response.data.students;
          this.advisoryClass = response.data.adviser?.advisory_class || '';
        } else {
          this.error = 'Failed to load students';
        }
        this.loading = false;
      },
      error: (err: any) => {
        // Error loading students
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
    this.adviserService.getStudentCompleteProfile(student.student_id).subscribe({
      next: (response: any) => {
        const profile = response?.data?.profile || response?.data?.personal_info || response?.profile;
        if (profile) {
          const birthDate = profile.birth_date ? new Date(profile.birth_date) : null;
          const age = birthDate
            ? Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
            : null;

          const allergies = (response?.data?.allergies || []).map((a: any) =>
            a.allergy_name || a.name || a
          );

          const visits = (response?.data?.medical_visits || []).map((v: any) => ({
            date: v.visit_datetime
              ? new Date(v.visit_datetime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              : 'N/A',
            reason: v.reason || v.chief_complaint || 'N/A',
            status: (v.status || 'resolved').toLowerCase(),
            statusText: v.status || 'Completed'
          }));

          this.selectedStudent = {
            name: profile.full_name || `${profile.first_name} ${profile.last_name}`,
            studentNumber: profile.student_number,
            gradeSection: `${profile.grade_level || ''} - ${profile.section || ''}`.trim().replace(/^-\s*|-\s*$/, ''),
            avatar: (profile.gender === 'F' || profile.gender === 'Female') ? 'assets/user-female.png' : 'assets/user-male.png',
            gender: profile.gender === 'F' ? 'Female' : (profile.gender === 'M' ? 'Male' : profile.gender || 'N/A'),
            birthday: birthDate
              ? birthDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              : 'N/A',
            age,
            contact: profile.phone || profile.contact_number || 'N/A',
            vitals: {
              bloodType: profile.blood_type || 'N/A',
              height: profile.height_cm ? `${profile.height_cm} cm` : 'N/A',
              weight: profile.weight_kg ? `${profile.weight_kg} kg` : 'N/A',
              bmi: profile.bmi || null,
            },
            allergies,
            emergencyContact: profile.emergency_contact ? {
              name: profile.emergency_contact,
              relation: profile.emergency_contact_relation || 'Guardian',
              phone: profile.emergency_contact_phone || 'N/A'
            } : null,
            recentVisits: visits,
          };
        } else {
          this.selectedStudent = this.buildFallback(student);
        }
      },
      error: () => {
        this.selectedStudent = this.buildFallback(student);
      }
    });
  }

  private buildFallback(student: AdvisedStudent): any {
    const birthDate = student.birth_date ? new Date(student.birth_date) : null;
    const age = birthDate ? Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : null;
    return {
      name: student.full_name,
      studentNumber: student.student_number,
      gradeSection: student.grade_section,
      avatar: this.getAvatarUrl(student),
      gender: student.gender === 'F' ? 'Female' : (student.gender === 'M' ? 'Male' : 'Other'),
      birthday: birthDate ? birthDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A',
      age,
      contact: student.phone || 'N/A',
      vitals: { bloodType: student.blood_type || 'N/A', height: 'N/A', weight: 'N/A', bmi: null },
      allergies: student.allergies || [],
      emergencyContact: student.emergency_contact ? { name: student.emergency_contact, relation: 'Guardian', phone: 'N/A' } : null,
      recentVisits: [],
    };
  }

  closeModal(): void {
    this.selectedStudent = null;
  }
}
