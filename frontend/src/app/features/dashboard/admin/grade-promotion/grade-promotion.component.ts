import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminService } from '../../../../core/services/admin.service';

interface PromotionSummary {
  grade_level_id: number;
  level_name: string;
  total_students: number;
}

interface TargetSection {
  level_number: number;
  level_name: string;
  total_sections: number;
  total_capacity: number;
  current_enrollment: number;
  sections_with_advisers: number;
  sections_without_advisers: number;
}

interface AdviserAssignmentStatus {
  total_sections: number;
  sections_with_advisers: number;
  sections_without_advisers: number;
  all_assigned: boolean;
}

@Component({
  selector: 'app-grade-promotion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="promotion-container">
      <h2>Grade Promotion Management</h2>

      <!-- Important Notice -->
      <div class="notice-banner">
        <div class="notice-icon">⚠️</div>
        <div class="notice-content">
          <h3>Before Promoting Students</h3>
          <p>Make sure advisers are assigned to sections for the target school year. Students will be automatically assigned to their new advisers based on their sections.</p>
          <button class="btn-link" (click)="navigateToSchoolYearManagement()">
            <i class="fa-solid fa-arrow-right"></i> Go to School Year Management
          </button>
        </div>
      </div>

      <div class="promotion-setup">
        <div class="form-section">
          <h3>Select School Years</h3>
          
          <div class="form-group">
            <label>Current School Year (From):</label>
            <select [(ngModel)]="currentSchoolYearId" (change)="onCurrentYearChange()">
              <option value="">-- Select --</option>
              <option *ngFor="let year of schoolYears" [value]="year.id">
                {{ year.year_name }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>Target School Year (To):</label>
            <select [(ngModel)]="targetSchoolYearId" (change)="onTargetYearChange()">
              <option value="">-- Select --</option>
              <option *ngFor="let year of schoolYears" [value]="year.id">
                {{ year.year_name }}
              </option>
            </select>
          </div>

          <button (click)="loadPromotionSummary()" class="btn-primary">
            Load Summary
          </button>
        </div>
      </div>

      <div *ngIf="promotionSummary" class="summary-section">
        <h3>Promotion Summary</h3>

        <!-- Adviser Assignment Check -->
        <div class="adviser-check" *ngIf="targetSections">
          <h4>Target Year Section Status</h4>
          <div class="status-grid">
            <div class="status-card">
              <div class="status-label">Total Sections</div>
              <div class="status-value">{{ getTotalSections() }}</div>
            </div>
            <div class="status-card success">
              <div class="status-label">With Advisers</div>
              <div class="status-value">{{ getSectionsWithAdvisers() }}</div>
            </div>
            <div class="status-card warning">
              <div class="status-label">Without Advisers</div>
              <div class="status-value">{{ getSectionsWithoutAdvisers() }}</div>
            </div>
          </div>
          <div class="warning-message" *ngIf="getSectionsWithoutAdvisers() > 0">
            <i class="fa-solid fa-triangle-exclamation"></i>
            <span>Warning: {{ getSectionsWithoutAdvisers() }} section(s) don't have advisers assigned. Students promoted to these sections won't have advisers.</span>
            <button class="btn-small" (click)="navigateToSchoolYearManagement()">Assign Advisers</button>
          </div>
        </div>
        
        <div class="summary-grid">
          <div class="summary-card" *ngFor="let item of promotionSummary">
            <h4>{{ item.level_name }}</h4>
            <p class="count">{{ item.total_students }} students</p>
          </div>
        </div>

        <div class="target-capacity">
          <h4>Target Year Capacity</h4>
          <table>
            <thead>
              <tr>
                <th>Grade Level</th>
                <th>Sections</th>
                <th>Capacity</th>
                <th>Current</th>
                <th>Available</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let section of targetSections">
                <td>{{ section.level_name }}</td>
                <td>{{ section.total_sections }}</td>
                <td>{{ section.total_capacity }}</td>
                <td>{{ section.current_enrollment }}</td>
                <td>{{ (section.total_capacity - section.current_enrollment) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="manual-cases" *ngIf="manualCases.length > 0">
          <h4>Students Needing Manual Adjustment</h4>
          <table>
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Name</th>
                <th>Current Grade</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let student of manualCases">
                <td>{{ student.student_id }}</td>
                <td>{{ student.first_name }} {{ student.last_name }}</td>
                <td>{{ student.level_name }}</td>
                <td>
                  <span [class]="'status-' + student.enrollment_status">
                    {{ student.enrollment_status }}
                  </span>
                </td>
                <td>
                  <button (click)="openManualAdjustment(student)" class="btn-small">
                    Adjust
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="promotion-actions">
          <button (click)="confirmPromotion()" class="btn-success" [disabled]="isProcessing">
            {{ isProcessing ? 'Processing...' : 'Execute Promotion' }}
          </button>
          <button (click)="cancelPromotion()" class="btn-secondary">
            Cancel
          </button>
        </div>
      </div>

      <div *ngIf="promotionResult" class="result-section" [class.success]="promotionResult.success">
        <h3>{{ promotionResult.success ? 'Promotion Completed' : 'Promotion Failed' }}</h3>
        <p>{{ promotionResult.message }}</p>
        <div *ngIf="promotionResult.stats" class="stats">
          <p>Total Promoted: {{ promotionResult.stats.promoted_count }}</p>
          <p>Graduated: {{ promotionResult.stats.graduated_count }}</p>
          <p>Failed: {{ promotionResult.stats.failed_count }}</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .promotion-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .notice-banner {
      background: linear-gradient(135deg, #fff3cd, #ffeaa7);
      border-left: 4px solid #ffc107;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
      display: flex;
      gap: 15px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .notice-icon {
      font-size: 2rem;
      line-height: 1;
    }

    .notice-content {
      flex: 1;
    }

    .notice-content h3 {
      margin: 0 0 8px 0;
      color: #856404;
      font-size: 1.2rem;
    }

    .notice-content p {
      margin: 0 0 12px 0;
      color: #856404;
      line-height: 1.5;
    }

    .btn-link {
      background: #ffc107;
      color: #856404;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s ease;
    }

    .btn-link:hover {
      background: #ffb300;
      transform: translateX(4px);
    }

    .adviser-check {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
    }

    .adviser-check h4 {
      margin: 0 0 15px 0;
      color: #2c3e50;
    }

    .status-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
      margin-bottom: 15px;
    }

    .status-card {
      background: white;
      padding: 15px;
      border-radius: 8px;
      text-align: center;
      border: 2px solid #e9ecef;
    }

    .status-card.success {
      border-color: #28a745;
      background: #d4edda;
    }

    .status-card.warning {
      border-color: #ffc107;
      background: #fff3cd;
    }

    .status-label {
      font-size: 0.9rem;
      color: #6c757d;
      margin-bottom: 8px;
    }

    .status-value {
      font-size: 2rem;
      font-weight: bold;
      color: #2c3e50;
    }

    .warning-message {
      background: #fff3cd;
      border: 1px solid #ffc107;
      border-radius: 6px;
      padding: 12px 15px;
      display: flex;
      align-items: center;
      gap: 10px;
      color: #856404;
    }

    .warning-message i {
      font-size: 1.2rem;
    }

    .warning-message span {
      flex: 1;
    }

    .form-section {
      background: #f5f5f5;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
    }

    .form-group {
      margin-bottom: 15px;
    }

    .form-group label {
      display: block;
      margin-bottom: 5px;
      font-weight: 500;
    }

    .form-group select {
      width: 100%;
      padding: 8px;
      border: 1px solid #ddd;
      border-radius: 4px;
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-bottom: 20px;
    }

    .summary-card {
      background: #e3f2fd;
      padding: 15px;
      border-radius: 8px;
      text-align: center;
    }

    .summary-card h4 {
      margin: 0 0 10px 0;
      color: #1976d2;
    }

    .summary-card .count {
      font-size: 24px;
      font-weight: bold;
      color: #1565c0;
      margin: 0;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
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

    .status-inactive {
      color: #d32f2f;
    }

    .status-transferred {
      color: #f57c00;
    }

    .status-dropped {
      color: #c62828;
    }

    .btn-primary, .btn-success, .btn-secondary, .btn-small {
      padding: 10px 20px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    }

    .btn-primary {
      background: #1976d2;
      color: white;
    }

    .btn-success {
      background: #388e3c;
      color: white;
    }

    .btn-secondary {
      background: #757575;
      color: white;
    }

    .btn-small {
      background: #1976d2;
      color: white;
      padding: 5px 10px;
      font-size: 12px;
    }

    .promotion-actions {
      display: flex;
      gap: 10px;
      margin-top: 20px;
    }

    .result-section {
      padding: 20px;
      border-radius: 8px;
      margin-top: 20px;
    }

    .result-section.success {
      background: #c8e6c9;
      border-left: 4px solid #388e3c;
    }

    .result-section.success h3 {
      color: #388e3c;
    }

    .stats {
      margin-top: 15px;
      padding: 10px;
      background: rgba(255, 255, 255, 0.5);
      border-radius: 4px;
    }
  `]
})
export class GradePromotionComponent implements OnInit {
  schoolYears: any[] = [];
  currentSchoolYearId: number | null = null;
  targetSchoolYearId: number | null = null;
  promotionSummary: PromotionSummary[] | null = null;
  targetSections: TargetSection[] | null = null;
  adviserAssignmentStatus: AdviserAssignmentStatus | null = null;
  manualCases: any[] = [];
  isProcessing = false;
  promotionResult: any = null;

  constructor(
    private adminService: AdminService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadSchoolYears();
  }

  loadSchoolYears() {
    this.adminService.getSchoolYears().subscribe(
      (response: any) => {
        this.schoolYears = response.data || [];
      },
      (error: any) => {
        console.error('Error loading school years:', error);
      }
    );
  }

  onCurrentYearChange() {
    // Reset summary when year changes
    this.promotionSummary = null;
  }

  onTargetYearChange() {
    // Reset summary when year changes
    this.promotionSummary = null;
  }

  loadPromotionSummary() {
    if (!this.currentSchoolYearId || !this.targetSchoolYearId) {
      alert('Please select both school years');
      return;
    }

    this.adminService.getPromotionSummary(this.currentSchoolYearId, this.targetSchoolYearId).subscribe(
      (response: any) => {
        this.promotionSummary = response.summary;
        this.targetSections = response.target_sections;
        this.adviserAssignmentStatus = response.adviser_assignment_status;
        this.manualCases = response.manual_cases;
      },
      (error: any) => {
        console.error('Error loading promotion summary:', error);
        alert('Error loading promotion summary');
      }
    );
  }

  confirmPromotion() {
    if (!this.currentSchoolYearId || !this.targetSchoolYearId) {
      alert('Please select both school years');
      return;
    }

    if (!confirm('Are you sure you want to execute the promotion? This action cannot be undone.')) {
      return;
    }

    this.isProcessing = true;

    const promotionRules: any = {
      7: 8,
      8: 9,
      9: 10,
      10: 11,
      11: 12,
      12: 'graduated'
    };

    this.adminService.bulkPromoteStudents(
      this.currentSchoolYearId,
      this.targetSchoolYearId,
      promotionRules,
      []
    ).subscribe(
      (response: any) => {
        this.isProcessing = false;
        this.promotionResult = {
          success: true,
          message: 'Promotion completed successfully',
          stats: response
        };
      },
      (error: any) => {
        this.isProcessing = false;
        this.promotionResult = {
          success: false,
          message: 'Error during promotion: ' + (error.error?.error || 'Unknown error')
        };
      }
    );
  }

  cancelPromotion() {
    this.promotionSummary = null;
    this.promotionResult = null;
  }

  openManualAdjustment(student: any) {
    // TODO: Open modal for manual adjustment
    console.log('Open manual adjustment for student:', student);
  }

  navigateToSchoolYearManagement() {
    this.router.navigate(['/dashboard/admin/school-year-management']);
  }

  getTotalSections(): number {
    return this.adviserAssignmentStatus?.total_sections || 0;
  }

  getSectionsWithAdvisers(): number {
    return this.adviserAssignmentStatus?.sections_with_advisers || 0;
  }

  getSectionsWithoutAdvisers(): number {
    return this.adviserAssignmentStatus?.sections_without_advisers || 0;
  }
}
