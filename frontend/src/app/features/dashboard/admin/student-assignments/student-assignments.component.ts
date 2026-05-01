import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StudentAssignmentService, AssignmentValidationResult, AssignmentFixResult } from '../../../../core/services/student-assignment.service';

@Component({
  selector: 'app-student-assignments',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="student-assignments-container">
      <div class="page-header">
        <h1>Student-Adviser Assignments</h1>
        <p>Monitor and manage student-adviser assignments across the system</p>
      </div>

      <!-- Health Status Card -->
      <div class="health-status-card" [ngClass]="getHealthStatusClass()">
        <div class="status-icon">
          <i [class]="getHealthStatusIcon()"></i>
        </div>
        <div class="status-content">
          <h3>Assignment Health: {{ getHealthStatusText() }}</h3>
          <p *ngIf="hasStatistics()">
            {{ getAssignedStudents() }} of {{ getTotalStudents() }} 
            students assigned ({{ getAssignmentPercentage() }}%)
          </p>
        </div>
        <div class="status-actions">
          <button class="btn btn-primary" (click)="refreshValidation()" [disabled]="loading">
            <i class="fa-solid fa-refresh" [class.fa-spin]="loading"></i> Refresh
          </button>
          <button class="btn btn-warning" (click)="fixAssignments()" 
                  [disabled]="loading || !needsFix()" 
                  *ngIf="needsFix()">
            <i class="fa-solid fa-wrench"></i> Fix Issues
          </button>
        </div>
      </div>

      <!-- Statistics Grid -->
      <div class="stats-grid" *ngIf="hasStatistics()">
        <div class="stat-card">
          <div class="stat-number">{{ getTotalStudents() }}</div>
          <div class="stat-label">Total Students</div>
        </div>
        <div class="stat-card success">
          <div class="stat-number">{{ getAssignedStudents() }}</div>
          <div class="stat-label">Assigned</div>
        </div>
        <div class="stat-card warning" *ngIf="getUnassignedStudentsCount() > 0">
          <div class="stat-number">{{ getUnassignedStudentsCount() }}</div>
          <div class="stat-label">Unassigned</div>
        </div>
        <div class="stat-card info">
          <div class="stat-number">{{ getAssignmentPercentage() }}%</div>
          <div class="stat-label">Assignment Rate</div>
        </div>
      </div>

      <!-- Recommendations -->
      <div class="recommendations-section" *ngIf="hasRecommendations()">
        <h3>Recommendations</h3>
        <div class="recommendation-list">
          <div class="recommendation-item" 
               *ngFor="let rec of getRecommendations()"
               [ngClass]="'priority-' + rec.priority">
            <div class="rec-icon">
              <i [class]="getRecommendationIcon(rec.priority)"></i>
            </div>
            <div class="rec-content">
              <div class="rec-message">{{ rec.message }}</div>
              <div class="rec-action">{{ rec.action }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Unassigned Students -->
      <div class="unassigned-section" *ngIf="hasUnassignedStudents()">
        <h3>Unassigned Students ({{ getUnassignedStudentsCount() }})</h3>
        <div class="students-table">
          <table>
            <thead>
              <tr>
                <th>Student Number</th>
                <th>Name</th>
                <th>Grade Level</th>
                <th>Section</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let student of getUnassignedStudents()">
                <td>{{ student.student_number }}</td>
                <td>{{ student.student_name }}</td>
                <td>Grade {{ student.grade_level || 'Unknown' }}</td>
                <td>{{ student.section || 'No Section' }}</td>
                <td>
                  <span class="status-badge unassigned">Not Assigned</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Adviser Workload -->
      <div class="workload-section" *ngIf="hasAdviserWorkload()">
        <h3>Adviser Workload</h3>
        <div class="workload-grid">
          <div class="workload-card" *ngFor="let adviser of getAdviserWorkload()">
            <div class="adviser-info">
              <h4>{{ adviser.adviser_name }}</h4>
              <p *ngIf="adviser.adviser_grade || adviser.adviser_section">
                {{ adviser.adviser_grade ? 'Grade ' + adviser.adviser_grade : '' }}
                {{ adviser.adviser_section ? ' - ' + adviser.adviser_section : '' }}
              </p>
            </div>
            <div class="student-count">
              <span class="count">{{ adviser.student_count }}</span>
              <span class="label">students</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Integrity Issues -->
      <div class="issues-section" *ngIf="hasIntegrityIssues()">
        <h3>Data Integrity Issues</h3>
        <div class="issues-list">
          <div class="issue-item critical" *ngFor="let issue of getIntegrityIssues()">
            <div class="issue-icon">
              <i class="fa-solid fa-exclamation-triangle"></i>
            </div>
            <div class="issue-content">
              <h4>{{ issue.message }}</h4>
              <p>{{ issue.count }} affected records</p>
              <div class="issue-details" *ngIf="issue.details.length > 0">
                <details>
                  <summary>View Details</summary>
                  <ul>
                    <li *ngFor="let detail of issue.details">
                      {{ detail.student_name }} ({{ detail.student_number }})
                    </li>
                  </ul>
                </details>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div class="loading-state" *ngIf="loading">
        <div class="spinner"></div>
        <p>{{ loadingMessage }}</p>
      </div>

      <!-- Success/Error Messages -->
      <div class="alert alert-success" *ngIf="successMessage">
        <i class="fa-solid fa-check-circle"></i> {{ successMessage }}
      </div>
      <div class="alert alert-error" *ngIf="errorMessage">
        <i class="fa-solid fa-exclamation-circle"></i> {{ errorMessage }}
      </div>
    </div>
  `,
  styleUrls: ['./student-assignments.component.scss']
})
export class StudentAssignmentsComponent implements OnInit {
  validationResult: AssignmentValidationResult | null = null;
  loading = false;
  loadingMessage = '';
  successMessage = '';
  errorMessage = '';

  constructor(private assignmentService: StudentAssignmentService) {}

  ngOnInit(): void {
    this.refreshValidation();
  }

  refreshValidation(): void {
    this.loading = true;
    this.loadingMessage = 'Validating student assignments...';
    this.clearMessages();

    this.assignmentService.validateAssignments().subscribe({
      next: (result) => {
        this.validationResult = result;
        this.loading = false;
        // Assignment validation result
      },
      error: (err) => {
        this.errorMessage = 'Failed to validate assignments: ' + (err.error?.message || err.message);
        this.loading = false;
        // Validation error
      }
    });
  }

  fixAssignments(): void {
    if (!confirm('This will automatically assign unassigned students to available advisers. Continue?')) {
      return;
    }

    this.loading = true;
    this.loadingMessage = 'Fixing student assignments...';
    this.clearMessages();

    this.assignmentService.fixAssignments().subscribe({
      next: (result) => {
        this.loading = false;
        if (result.success) {
          this.successMessage = `Successfully fixed ${result.data.fixed_count} student assignments!`;
          if (result.data.errors.length > 0) {
            this.successMessage += ` (${result.data.errors.length} errors occurred)`;
          }
          // Refresh validation to show updated status
          setTimeout(() => this.refreshValidation(), 1000);
        } else {
          this.errorMessage = result.message;
        }
      },
      error: (err) => {
        this.errorMessage = 'Failed to fix assignments: ' + (err.error?.message || err.message);
        this.loading = false;
        // Fix error
      }
    });
  }

  needsFix(): boolean {
    return (this.validationResult?.data?.statistics?.unassigned_students || 0) > 0 || 
           (this.validationResult?.data?.integrity_issues?.length || 0) > 0;
  }

  getHealthStatusClass(): string {
    if (!this.validationResult?.data?.health_status) return 'unknown';
    return 'health-' + this.validationResult.data.health_status;
  }

  getHealthStatusIcon(): string {
    if (!this.validationResult?.data?.health_status) return 'fa-solid fa-question';
    
    switch (this.validationResult.data.health_status) {
      case 'excellent': return 'fa-solid fa-check-circle';
      case 'warning': return 'fa-solid fa-exclamation-triangle';
      case 'needs_attention': return 'fa-solid fa-exclamation-circle';
      case 'critical': return 'fa-solid fa-times-circle';
      default: return 'fa-solid fa-question';
    }
  }

  getHealthStatusText(): string {
    if (!this.validationResult?.data?.health_status) return 'Unknown';
    
    switch (this.validationResult.data.health_status) {
      case 'excellent': return 'Excellent';
      case 'warning': return 'Warning';
      case 'needs_attention': return 'Needs Attention';
      case 'critical': return 'Critical';
      default: return 'Unknown';
    }
  }

  getRecommendationIcon(priority: string): string {
    switch (priority) {
      case 'critical': return 'fa-solid fa-exclamation-triangle';
      case 'high': return 'fa-solid fa-exclamation-circle';
      case 'medium': return 'fa-solid fa-info-circle';
      case 'info': return 'fa-solid fa-lightbulb';
      default: return 'fa-solid fa-info';
    }
  }

  private clearMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';
  }

  // Helper methods for template
  hasRecommendations(): boolean {
    return (this.validationResult?.data?.recommendations?.length || 0) > 0;
  }

  getRecommendations(): any[] {
    return this.validationResult?.data?.recommendations || [];
  }

  hasUnassignedStudents(): boolean {
    return (this.validationResult?.data?.unassigned_students?.length || 0) > 0;
  }

  getUnassignedStudents(): any[] {
    return this.validationResult?.data?.unassigned_students || [];
  }

  getUnassignedStudentsCount(): number {
    return this.validationResult?.data?.unassigned_students?.length || 0;
  }

  hasAdviserWorkload(): boolean {
    return (this.validationResult?.data?.adviser_workload?.length || 0) > 0;
  }

  getAdviserWorkload(): any[] {
    return this.validationResult?.data?.adviser_workload || [];
  }

  hasIntegrityIssues(): boolean {
    return (this.validationResult?.data?.integrity_issues?.length || 0) > 0;
  }

  getIntegrityIssues(): any[] {
    return this.validationResult?.data?.integrity_issues || [];
  }

  hasStatistics(): boolean {
    return !!this.validationResult?.data?.statistics;
  }

  getTotalStudents(): number {
    return this.validationResult?.data?.statistics?.total_students || 0;
  }

  getAssignedStudents(): number {
    return this.validationResult?.data?.statistics?.assigned_students || 0;
  }

  getAssignmentPercentage(): number {
    return this.validationResult?.data?.statistics?.assignment_percentage || 0;
  }
}