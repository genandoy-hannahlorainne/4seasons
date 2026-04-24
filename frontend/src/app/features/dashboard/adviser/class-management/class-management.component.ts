import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdviserService } from '../../../../core/services/adviser.service';
import { StudentProfileModalComponent } from '../student-profile-modal/student-profile-modal.component';

interface ClassRoster {
  section: {
    id: number;
    section_name: string;
    level_name: string;
    level_number: number;
  };
  students: any[];
  total_students: number;
}

@Component({
  selector: 'app-class-management',
  standalone: true,
  imports: [CommonModule, FormsModule, StudentProfileModalComponent],
  template: `
    <div class="class-management-container">
      <div class="page-header">
        <h1>My Class Management</h1>
        <p>Manage your advisory class roster and student promotions</p>
      </div>

      <div class="school-year-selector">
        <label>School Year:</label>
        <select [(ngModel)]="selectedSchoolYear" (change)="loadClassRoster()">
          <option value="">-- Select --</option>
          <option *ngFor="let year of schoolYears" [value]="year.id">
            {{ year.year_name }}
          </option>
        </select>
      </div>

      <div *ngIf="classRoster" class="roster-section">
        <div class="section-header">
          <h3>{{ classRoster.section.level_name }}, Section {{ classRoster.section.section_name }}</h3>
          <p class="total-students">Total Students: {{ classRoster.total_students }}</p>

          <div class="action-buttons" *ngIf="selectedStudents.length > 0">
            <button (click)="openPromotionModal()" class="btn-promote">
              🎓 Promote Selected ({{ selectedStudents.length }})
            </button>
            <button (click)="clearSelection()" class="btn-clear">
              Clear Selection
            </button>
          </div>
        </div>

        <div class="roster-table">
          <table>
            <thead>
              <tr>
                <th>
                  <input type="checkbox"
                         [(ngModel)]="selectAll"
                         (change)="toggleSelectAll()"
                         title="Select All">
                </th>
                <th>Student ID</th>
                <th>Name</th>
                <th>Medical Visits</th>
                <th>Last Visit</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let student of classRoster.students">
                <td>
                  <input type="checkbox"
                         [(ngModel)]="student.selected"
                         (change)="updateSelection()">
                </td>
                <td>{{ student.student_number }}</td>
                <td>{{ student.first_name }} {{ student.last_name }}</td>
                <td>{{ student.total_medical_visits || 0 }}</td>
                <td>{{ student.last_visit_date ? (student.last_visit_date | date: 'MMM dd, yyyy') : 'N/A' }}</td>
                <td>
                  <button (click)="viewStudentProfile(student)" class="btn-view">
                    View Profile
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="health-summary">
          <h4>Health Summary</h4>
          <div class="summary-stats">
            <div class="stat-card">
              <p class="label">Total Medical Visits</p>
              <p class="value">{{ getTotalMedicalVisits() }}</p>
            </div>
            <div class="stat-card">
              <p class="label">Students with Visits</p>
              <p class="value">{{ getStudentsWithVisits() }}</p>
            </div>
            <div class="stat-card">
              <p class="label">Average Visits per Student</p>
              <p class="value">{{ getAverageVisits() }}</p>
            </div>
          </div>
        </div>
      </div>

      <div *ngIf="!classRoster && selectedSchoolYear" class="no-data">
        <p>No class assigned for this school year</p>
      </div>

      <div *ngIf="!selectedSchoolYear" class="no-selection">
        <p>Please select a school year to view your class roster</p>
      </div>

      <!-- Promotion Modal -->
      <div *ngIf="showPromotionModal" class="modal-overlay" (click)="closePromotionModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <h3>{{ isGrade12 ? 'Graduate Students' : 'Promote Students' }}</h3>

          <div class="modal-body">
            <p class="info-text">
              {{ isGrade12
                ? 'Mark selected students as graduated. They will no longer be active students.'
                : 'Promote selected students to the next grade level for the next school year.' }}
            </p>

            <div class="selected-students">
              <h4>Selected Students ({{ selectedStudents.length }})</h4>
              <ul>
                <li *ngFor="let student of selectedStudents">
                  {{ student.first_name }} {{ student.last_name }} ({{ student.student_number }})
                </li>
              </ul>
            </div>

            <div *ngIf="!isGrade12" class="promotion-details">
              <div class="form-group">
                <label>Target School Year:</label>
                <select [(ngModel)]="targetSchoolYearId" (change)="loadTargetSections()">
                  <option value="">-- Select School Year --</option>
                  <option *ngFor="let year of schoolYears" [value]="year.id">
                    {{ year.year_name }}
                  </option>
                </select>
              </div>

              <div class="form-group">
                <label>Target Grade Level:</label>
                <input type="text" [value]="targetGradeLevel" readonly>
              </div>

              <div class="form-group">
                <label>Target Section:</label>
                <select [(ngModel)]="targetSectionId">
                  <option value="">-- Select Section --</option>
                  <option *ngFor="let section of targetSections" [value]="section.id">
                    Grade {{ section.level_number }} - Section {{ section.section_name }} ({{ section.current_enrollment }}/{{ section.capacity }} students)
                  </option>
                </select>
                <small *ngIf="targetSections.length === 0 && targetSchoolYearId">
                  No sections available. Admin needs to create sections for next school year.
                </small>
              </div>
            </div>

            <div *ngIf="promotionError" class="error-message">
              {{ promotionError }}
            </div>

            <div *ngIf="promotionSuccess" class="success-message">
              {{ promotionSuccess }}
            </div>
          </div>

          <div class="modal-actions">
            <button (click)="confirmPromotion()"
                    [disabled]="promoting || (!isGrade12 && (!targetSchoolYearId || !targetSectionId))"
                    class="btn-confirm">
              {{ promoting ? 'Processing...' : (isGrade12 ? 'Graduate Students' : 'Promote Students') }}
            </button>
            <button (click)="closePromotionModal()"
                    [disabled]="promoting"
                    class="btn-cancel">
              Cancel
            </button>
          </div>
        </div>
      </div>

      <!-- Student Profile Modal -->
      <app-student-profile-modal
        *ngIf="showStudentModal && selectedStudent"
        [student]="selectedStudent"
        (close)="closeStudentModal()">
      </app-student-profile-modal>
    </div>
  `,
  styles: [`
    .class-management-container {
      padding: 2rem;
      background: #f5f7fa;
      min-height: 100vh;
    }

    h2 {
      display: none;
    }

    /* ── Hero Header ── */
    .page-header {
      background: linear-gradient(135deg, #052355 0%, #5381b2 100%);
      border-radius: 12px;
      padding: 2rem;
      margin-bottom: 1.5rem;
      color: #fff;

      h1 { font-size: 1.6rem; font-weight: 700; margin: 0 0 0.3rem; color: #fff; }
      p  { margin: 0; opacity: 0.85; font-size: 0.9rem; color: #fff; }
    }

    /* ── School Year Selector ── */
    .school-year-selector {
      background: white;
      border-radius: 12px;
      padding: 1.25rem 1.5rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      margin-bottom: 1.5rem;
      display: flex;
      align-items: center;
      gap: 1rem;

      label {
        font-weight: 600;
        color: #374151;
        font-size: 0.9rem;
        white-space: nowrap;
      }

      select {
        padding: 0.5rem 0.75rem;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        font-size: 0.9rem;
        color: #1e293b;
        background: #f8fafc;
        outline: none;
        min-width: 200px;
        &:focus { border-color: #5381b2; }
      }
    }

    /* ── Section Header ── */
    .section-header {
      background: linear-gradient(135deg, #052355 0%, #5381b2 100%);
      color: white;
      padding: 1.5rem;
      border-radius: 12px;
      margin-bottom: 1.5rem;

      h3 { margin: 0 0 0.25rem; font-size: 1.2rem; font-weight: 700; }
      .total-students { margin: 0 0 1rem; opacity: 0.85; font-size: 0.875rem; }
    }

    .action-buttons {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .btn-promote {
      background: white;
      color: #052355;
      border: none;
      padding: 0.6rem 1.25rem;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 700;
      font-size: 0.875rem;
      transition: all 0.2s;
      &:hover { background: #f0f7ff; box-shadow: 0 2px 8px rgba(0,0,0,0.15); }
    }

    .btn-clear {
      background: rgba(255,255,255,0.15);
      color: white;
      border: 1px solid rgba(255,255,255,0.3);
      padding: 0.6rem 1.25rem;
      border-radius: 8px;
      cursor: pointer;
      font-size: 0.875rem;
      transition: all 0.2s;
      &:hover { background: rgba(255,255,255,0.25); }
    }

    /* ── Roster Table ── */
    .roster-table {
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      overflow: hidden;
      margin-bottom: 1.5rem;
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    table th {
      padding: 0.75rem 1rem;
      text-align: left;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748b;
      background: #f8fafc;
      border-bottom: 1px solid #e9ecef;
    }

    table td {
      padding: 0.85rem 1rem;
      border-bottom: 1px solid #f1f5f9;
      font-size: 0.875rem;
      color: #374151;
    }

    table th:first-child, table td:first-child {
      width: 40px;
      text-align: center;
    }

    table tr:last-child td { border-bottom: none; }
    table tbody tr:hover { background: #f8fafc; }

    .btn-view {
      background: linear-gradient(135deg, #052355 0%, #5381b2 100%);
      color: white;
      border: none;
      padding: 0.4rem 0.9rem;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.8rem;
      font-weight: 600;
      transition: all 0.2s;
      box-shadow: 0 2px 6px rgba(5,35,85,0.2);
      &:hover { box-shadow: 0 4px 10px rgba(5,35,85,0.3); transform: translateY(-1px); }
    }

    /* ── Health Summary ── */
    .health-summary {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);

      h4 {
        margin: 0 0 1rem;
        font-size: 1rem;
        font-weight: 700;
        color: #2c3e50;
        padding-bottom: 0.75rem;
        border-bottom: 1px solid #e9ecef;
      }
    }

    .summary-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 1rem;
    }

    .stat-card {
      background: #f8fafc;
      border-radius: 8px;
      padding: 1rem;
      text-align: center;
      border-left: 4px solid #052355;

      .label { margin: 0 0 0.5rem; color: #64748b; font-size: 0.78rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; }
      .value { margin: 0; font-size: 1.8rem; font-weight: 700; color: #052355; }
    }

    /* ── Empty States ── */
    .no-data, .no-selection {
      text-align: center;
      padding: 3rem;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      color: #94a3b8;
      font-size: 0.9rem;
    }

    /* ── Modal ── */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(15,23,42,0.55);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
      backdrop-filter: blur(2px);
    }

    .modal-content {
      background: white;
      padding: 2rem;
      border-radius: 16px;
      max-width: 560px;
      width: 100%;
      max-height: 85vh;
      overflow-y: auto;
      box-shadow: 0 24px 64px rgba(0,0,0,0.2);

      h3 { margin: 0 0 1.5rem; font-size: 1.2rem; font-weight: 700; color: #1e293b; }
    }

    .info-text {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      padding: 0.875rem 1rem;
      border-radius: 8px;
      margin-bottom: 1.25rem;
      color: #1d4ed8;
      font-size: 0.875rem;
    }

    .selected-students {
      margin-bottom: 1.25rem;

      h4 { margin: 0 0 0.75rem; font-size: 0.9rem; font-weight: 700; color: #374151; }

      ul {
        list-style: none;
        padding: 0.75rem;
        margin: 0;
        max-height: 140px;
        overflow-y: auto;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        background: #f8fafc;
      }

      li {
        padding: 0.4rem 0;
        border-bottom: 1px solid #f1f5f9;
        font-size: 0.875rem;
        color: #374151;
        &:last-child { border-bottom: none; }
      }
    }

    .form-group {
      margin-bottom: 1rem;

      label { display: block; margin-bottom: 0.4rem; font-weight: 600; color: #374151; font-size: 0.875rem; }

      select, input {
        width: 100%;
        padding: 0.6rem 0.75rem;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        font-size: 0.875rem;
        background: #f8fafc;
        color: #1e293b;
        box-sizing: border-box;
        &:focus { outline: none; border-color: #5381b2; }
      }

      input[readonly] { background: #f1f5f9; color: #64748b; }
      small { display: block; margin-top: 0.35rem; color: #f59e0b; font-size: 0.78rem; }
    }

    .error-message {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #b91c1c;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      margin-top: 1rem;
      font-size: 0.875rem;
    }

    .success-message {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      color: #15803d;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      margin-top: 1rem;
      font-size: 0.875rem;
    }

    .modal-actions {
      display: flex;
      gap: 0.75rem;
      justify-content: flex-end;
      margin-top: 1.5rem;
    }

    .btn-confirm {
      background: linear-gradient(135deg, #052355 0%, #5381b2 100%);
      color: white;
      border: none;
      padding: 0.65rem 1.5rem;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 700;
      font-size: 0.875rem;
      transition: all 0.2s;
      &:hover:not(:disabled) { box-shadow: 0 4px 12px rgba(5,35,85,0.3); transform: translateY(-1px); }
      &:disabled { opacity: 0.5; cursor: not-allowed; }
    }

    .btn-cancel {
      background: white;
      color: #374151;
      border: 1.5px solid #e2e8f0;
      padding: 0.65rem 1.5rem;
      border-radius: 8px;
      cursor: pointer;
      font-size: 0.875rem;
      font-weight: 600;
      transition: all 0.2s;
      &:hover:not(:disabled) { background: #f8fafc; border-color: #cbd5e1; }
      &:disabled { opacity: 0.5; cursor: not-allowed; }
    }

    @media (max-width: 768px) {
      .class-management-container { padding: 1rem; }
      .school-year-selector { flex-direction: column; align-items: flex-start; }
    }
  `]
})
export class ClassManagementComponent implements OnInit {
  schoolYears: any[] = [];
  selectedSchoolYear: number | null = null;
  classRoster: ClassRoster | null = null;

  // Selection
  selectAll = false;
  selectedStudents: any[] = [];

  // Promotion Modal
  showPromotionModal = false;
  promoting = false;
  promotionError = '';
  promotionSuccess = '';
  targetSchoolYearId: number | null = null;
  targetGradeLevel: number = 0;
  targetSectionId: number | null = null;
  targetSections: any[] = [];
  isGrade12 = false;

  constructor(private adviserService: AdviserService) {}

  ngOnInit() {
    this.loadSchoolYears();
  }

  loadSchoolYears() {
    this.adviserService.getSchoolYears().subscribe({
      next: (response: any) => {
        this.schoolYears = response.data || [];
      },
      error: (error) => {
        console.error('Error loading school years:', error);
      }
    });
  }

  loadClassRoster() {
    if (!this.selectedSchoolYear) {
      this.classRoster = null;
      return;
    }

    this.adviserService.getClassRoster(this.selectedSchoolYear).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.classRoster = response.data;
        } else {
          this.classRoster = null;
          console.error('Failed to load class roster:', response.message);
        }
        this.clearSelection();
      },
      error: (error) => {
        console.error('Error loading class roster:', error);
        this.classRoster = null;
        this.clearSelection();
      }
    });
  }

  toggleSelectAll() {
    if (this.classRoster && this.classRoster.students) {
      this.classRoster.students.forEach(student => {
        student.selected = this.selectAll;
      });
      this.updateSelection();
    }
  }

  updateSelection() {
    if (this.classRoster && this.classRoster.students) {
      this.selectedStudents = this.classRoster.students.filter(s => s.selected);
      this.selectAll = this.selectedStudents.length === this.classRoster.students.length;
    }
  }

  clearSelection() {
    this.selectAll = false;
    this.selectedStudents = [];
    if (this.classRoster && this.classRoster.students) {
      this.classRoster.students.forEach(student => {
        student.selected = false;
      });
    }
  }

  openPromotionModal() {
    if (this.selectedStudents.length === 0) {
      alert('Please select at least one student');
      return;
    }

    this.showPromotionModal = true;
    this.promotionError = '';
    this.promotionSuccess = '';

    // Check if current grade is 12
    if (this.classRoster && this.classRoster.section) {
      this.isGrade12 = this.classRoster.section.level_number === 12;

      if (!this.isGrade12) {
        // Set target grade level (current + 1)
        this.targetGradeLevel = this.classRoster.section.level_number + 1;

        // Auto-select next school year if available
        const currentYear = this.schoolYears.find(y => y.id === this.selectedSchoolYear);
        if (currentYear) {
          const nextYear = this.schoolYears.find(y => y.year_name > currentYear.year_name);
          if (nextYear) {
            this.targetSchoolYearId = nextYear.id;
            this.loadTargetSections();
          }
        }
      }
    }
  }

  closePromotionModal() {
    this.showPromotionModal = false;
    this.targetSchoolYearId = null;
    this.targetSectionId = null;
    this.targetSections = [];
    this.promotionError = '';
    this.promotionSuccess = '';
  }

  loadTargetSections() {
    if (!this.targetSchoolYearId || !this.targetGradeLevel) {
      this.targetSections = [];
      this.targetSectionId = null;
      return;
    }

    console.log('Loading sections for school year:', this.targetSchoolYearId, 'grade:', this.targetGradeLevel);

    this.adviserService.getSections(this.targetSchoolYearId, this.targetGradeLevel).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.targetSections = response.data || [];
          console.log('Loaded sections:', this.targetSections);
        } else {
          this.targetSections = [];
        }
        this.targetSectionId = null;
      },
      error: (error) => {
        console.error('Error loading sections:', error);
        this.targetSections = [];
        this.targetSectionId = null;
      }
    });
  }

  confirmPromotion() {
    if (this.selectedStudents.length === 0) {
      this.promotionError = 'No students selected';
      return;
    }

    if (!this.isGrade12 && (!this.targetSchoolYearId || !this.targetSectionId)) {
      this.promotionError = 'Please select target school year and section';
      return;
    }

    this.promoting = true;
    this.promotionError = '';
    this.promotionSuccess = '';

    const studentIds = this.selectedStudents.map(s => s.student_id);

    const promotionData = {
      student_ids: studentIds,
      action: this.isGrade12 ? 'graduate' : 'promote',
      to_school_year_id: this.targetSchoolYearId,
      to_grade_level: this.targetGradeLevel,
      to_section_id: this.targetSectionId
    };

    console.log('Promoting students:', promotionData);

    this.adviserService.promoteStudents(promotionData).subscribe({
      next: (response: any) => {
        console.log('Promotion response:', response);
        this.promoting = false;

        if (response.success) {
          this.promotionSuccess = response.message;

          // Reload class roster after 2 seconds
          setTimeout(() => {
            this.closePromotionModal();
            this.loadClassRoster();
          }, 2000);
        } else {
          this.promotionError = response.message || 'Promotion failed';
        }
      },
      error: (error) => {
        console.error('Error promoting students:', error);
        this.promoting = false;
        this.promotionError = error.error?.message || 'An error occurred while promoting students';
      }
    });
  }

  getTotalMedicalVisits(): number {
    if (!this.classRoster) return 0;
    return this.classRoster.students.reduce((sum, s) => sum + (s.total_medical_visits || 0), 0);
  }

  getStudentsWithVisits(): number {
    if (!this.classRoster) return 0;
    return this.classRoster.students.filter(s => s.total_medical_visits > 0).length;
  }

  getAverageVisits(): string {
    if (!this.classRoster || this.classRoster.total_students === 0) return '0';
    const avg = this.getTotalMedicalVisits() / this.classRoster.total_students;
    return avg.toFixed(2);
  }

  selectedStudent: any = null;
  showStudentModal = false;

  viewStudentProfile(student: any) {
    this.adviserService.getStudentCompleteProfile(student.student_id).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.selectedStudent = this.mapStudentData(response.data);
          this.showStudentModal = true;
        } else {
          console.error('Failed to load student profile');
        }
      },
      error: (error) => {
        console.error('Error loading student profile:', error);
      }
    });
  }

  closeStudentModal() {
    this.showStudentModal = false;
    this.selectedStudent = null;
  }

  private mapStudentData(data: any): any {
    return {
      name: data.full_name || `${data.first_name} ${data.last_name}`,
      studentNumber: data.student_number,
      gradeSection: data.grade_section || `${data.grade_level} - ${data.section}`,
      gender: data.gender,
      birthday: data.birth_date,
      age: data.age || this.calculateAge(data.birth_date),
      contact: data.phone || data.emergency_contact_phone,
      vitals: {
        bloodType: data.blood_type,
        height: data.height ? `${data.height} cm` : 'N/A',
        weight: data.weight ? `${data.weight} kg` : 'N/A',
        bmi: data.bmi
      },
      allergies: data.allergies || [],
      emergencyContact: {
        name: data.emergency_contact,
        relation: data.emergency_contact_relation || 'N/A',
        phone: data.emergency_contact_phone || 'N/A'
      },
      recentVisits: data.recent_visits || [],
      lastVisit: data.last_visit
    };
  }

  private calculateAge(birthDate: string): number {
    if (!birthDate) return 0;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }
}
