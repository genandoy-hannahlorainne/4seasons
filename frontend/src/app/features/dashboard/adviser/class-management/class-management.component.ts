import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdviserService } from '../../../../core/services/adviser.service';

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
  imports: [CommonModule, FormsModule],
  template: `
    <div class="class-management-container">
      <h2>My Class Management</h2>

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
    </div>
  `,
  styles: [`
    .class-management-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .school-year-selector {
      margin-bottom: 20px;
    }

    .school-year-selector label {
      display: block;
      margin-bottom: 8px;
      font-weight: 500;
    }

    .school-year-selector select {
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
      width: 200px;
    }

    .section-header {
      background: #e3f2fd;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 20px;
    }

    .section-header h3 {
      margin: 0 0 10px 0;
      color: #1976d2;
    }

    .total-students {
      margin: 0 0 15px 0;
      color: #666;
    }

    .action-buttons {
      display: flex;
      gap: 10px;
      margin-top: 15px;
    }

    .btn-promote {
      background: #4caf50;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 500;
    }

    .btn-promote:hover {
      background: #45a049;
    }

    .btn-clear {
      background: #757575;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 4px;
      cursor: pointer;
    }

    .btn-clear:hover {
      background: #616161;
    }

    .roster-table {
      overflow-x: auto;
      margin-bottom: 20px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    table th, table td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #ddd;
    }

    table th {
      background: #f5f5f5;
      font-weight: 600;
    }

    table th:first-child, table td:first-child {
      width: 40px;
      text-align: center;
    }

    table tr:hover {
      background: #f9f9f9;
    }

    .btn-view {
      background: #1976d2;
      color: white;
      border: none;
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
    }

    .btn-view:hover {
      background: #1565c0;
    }

    .health-summary {
      background: #f5f5f5;
      padding: 20px;
      border-radius: 8px;
    }

    .health-summary h4 {
      margin-top: 0;
      color: #333;
    }

    .summary-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 15px;
    }

    .stat-card {
      background: white;
      padding: 15px;
      border-radius: 4px;
      text-align: center;
      border-left: 4px solid #1976d2;
    }

    .stat-card .label {
      margin: 0 0 10px 0;
      color: #666;
      font-size: 12px;
    }

    .stat-card .value {
      margin: 0;
      font-size: 24px;
      font-weight: bold;
      color: #1976d2;
    }

    .no-data, .no-selection {
      text-align: center;
      padding: 40px;
      color: #999;
    }

    /* Modal Styles */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-content {
      background: white;
      padding: 30px;
      border-radius: 8px;
      max-width: 600px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
    }

    .modal-content h3 {
      margin-top: 0;
      color: #333;
    }

    .modal-body {
      margin: 20px 0;
    }

    .info-text {
      background: #e3f2fd;
      padding: 12px;
      border-radius: 4px;
      margin-bottom: 20px;
      color: #1976d2;
    }

    .selected-students {
      margin-bottom: 20px;
    }

    .selected-students h4 {
      margin-bottom: 10px;
      color: #333;
    }

    .selected-students ul {
      list-style: none;
      padding: 0;
      max-height: 150px;
      overflow-y: auto;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 10px;
    }

    .selected-students li {
      padding: 5px 0;
      border-bottom: 1px solid #f0f0f0;
    }

    .selected-students li:last-child {
      border-bottom: none;
    }

    .promotion-details {
      margin-top: 20px;
    }

    .form-group {
      margin-bottom: 15px;
    }

    .form-group label {
      display: block;
      margin-bottom: 5px;
      font-weight: 500;
      color: #333;
    }

    .form-group select,
    .form-group input {
      width: 100%;
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
    }

    .form-group input[readonly] {
      background: #f5f5f5;
      color: #666;
    }

    .form-group small {
      display: block;
      margin-top: 5px;
      color: #ff9800;
      font-size: 12px;
    }

    .error-message {
      background: #ffebee;
      color: #c62828;
      padding: 12px;
      border-radius: 4px;
      margin-top: 15px;
    }

    .success-message {
      background: #e8f5e9;
      color: #2e7d32;
      padding: 12px;
      border-radius: 4px;
      margin-top: 15px;
    }

    .modal-actions {
      display: flex;
      gap: 10px;
      justify-content: flex-end;
      margin-top: 20px;
    }

    .btn-confirm {
      background: #4caf50;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 500;
    }

    .btn-confirm:hover:not(:disabled) {
      background: #45a049;
    }

    .btn-confirm:disabled {
      background: #ccc;
      cursor: not-allowed;
    }

    .btn-cancel {
      background: #757575;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 4px;
      cursor: pointer;
    }

    .btn-cancel:hover:not(:disabled) {
      background: #616161;
    }

    .btn-cancel:disabled {
      background: #ccc;
      cursor: not-allowed;
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

  viewStudentProfile(student: any) {
    // TODO: Navigate to student profile
    console.log('View student profile:', student);
  }
}
