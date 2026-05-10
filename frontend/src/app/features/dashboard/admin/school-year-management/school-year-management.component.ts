import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

interface SchoolYear {
  id: number;
  year_name: string;
  start_date: string;
  end_date: string;
  is_current: number | string | boolean;
}

interface Section {
  id: number;
  section_name: string;
  grade_level_id: number;
  school_year_id: number;
  adviser_id: number | null;
  capacity: number;
  current_enrollment: number;
  is_active: number;
  level_name: string;
  level_number: number;
  year_name: string;
  adviser_name: string | null;
}

interface Adviser {
  adviser_id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  employee_id: string;
  email: string;
}

interface GradeLevel {
  id: number;
  level_name: string;
  level_number: number;
}

@Component({
  selector: 'app-school-year-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrls: ['./school-year-management.component.scss'],
  template: `
    <div class="school-year-management">
      <div class="page-header">
        <h1>School Year & Section Management</h1>
        <p>Manage school years and assign advisers to sections</p>
      </div>

      <!-- School Year Selector -->
      <div class="school-year-selector" *ngIf="!selectedGradeLevelId">
        <div class="selector-header">
          <div class="selector-left">
            <label>Select School Year:</label>
            <select [(ngModel)]="selectedSchoolYearId" (change)="onSchoolYearChange()" class="form-select">
              <option [value]="null">-- Select School Year --</option>
              <option *ngFor="let year of schoolYears" [value]="year.id">
                {{ year.year_name }}
              </option>
            </select>
            <button class="btn-create-year" (click)="openCreateYearModal()">
              <i class="fa-solid fa-plus"></i>
              Create New School Year
            </button>
          </div>
          <div class="selector-right" *ngIf="selectedSchoolYearId">
            <!-- Show button only if not current and can be set as current -->
            <button
              *ngIf="!isCurrentSchoolYear() && canSetAsCurrentSchoolYear(getSelectedSchoolYear()!)"
              class="btn-set-current"
              (click)="setAsCurrentSchoolYear()"
              [disabled]="settingCurrent">
              <i class="fa-solid fa-check-circle"></i>
              {{ settingCurrent ? 'Setting...' : 'Set as Current School Year' }}
            </button>

            <!-- Show disabled button for future school years -->
            <button
              *ngIf="!isCurrentSchoolYear() && isSchoolYearFuture(getSelectedSchoolYear()!)"
              class="btn-set-current-disabled"
              disabled
              title="Cannot set future school year as current until start date arrives">
              <i class="fa-solid fa-clock"></i>
              Future School Year
            </button>


          </div>
        </div>
        <div class="current-year-info" *ngIf="getCurrentSchoolYear() && !selectedGradeLevelId">
          <i class="fa-solid fa-info-circle"></i>
          <span>
            <strong>Current School Year:</strong> {{ getCurrentSchoolYear()?.year_name }}
            <br>
            <small>All new accounts will be assigned to this school year. Advisers can promote students to the next school year.</small>
          </span>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading sections...</p>
      </div>

      <!-- Grade Level Cards View -->
      <div *ngIf="!loading && selectedSchoolYearId && !selectedGradeLevelId" class="grade-cards-container">
        <div class="grade-cards">
          <div class="grade-card" *ngFor="let grade of gradeLevels" (click)="selectGradeLevel(grade.id)">
            <div class="card-header">
              <div class="card-icon">
                <i class="fa-solid fa-graduation-cap"></i>
              </div>
              <div class="card-title">{{ grade.level_name }}</div>
            </div>
            <div class="card-stats">
              <div class="stat">
                <div class="stat-value">{{ getGradeSectionCount(grade.id) }}</div>
                <div class="stat-label">Sections</div>
              </div>
              <div class="stat">
                <div class="stat-value">{{ getGradeStudentCount(grade.id) }}</div>
                <div class="stat-label">Students</div>
              </div>
            </div>
            <div class="card-arrow">
              <i class="fa-solid fa-chevron-right"></i>
            </div>
          </div>
        </div>
      </div>

      <!-- Sections Table -->
      <div *ngIf="!loading && selectedSchoolYearId && selectedGradeLevelId" class="sections-container">
        <div class="sections-header">
          <div class="header-top">
            <button class="btn-back" (click)="selectedGradeLevelId = null">
              <i class="fa-solid fa-arrow-left"></i> Back to Grades
            </button>
            <h2>Sections for {{ getGradeLevelName(selectedGradeLevelId) }}</h2>
          </div>
          <div class="header-actions">
            <button class="btn-create-section" (click)="openCreateSectionModal()">
              <i class="fa-solid fa-plus"></i>
              Create Section
            </button>
            <div class="stats">
              <span class="stat">
                <strong>{{ getFilteredSectionsForGrade().length }}</strong> Sections
              </span>
              <span class="stat">
                <strong>{{ getAssignedCountForGrade() }}</strong> Assigned
              </span>
              <span class="stat">
                <strong>{{ getUnassignedCountForGrade() }}</strong> Unassigned
              </span>
            </div>
          </div>
        </div>

        <div class="sections-table">
          <div class="sections-table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Grade Level</th>
                <th>Section</th>
                <th>Capacity</th>
                <th>Enrolled</th>
                <th>Adviser</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let section of getFilteredSectionsForGrade()" [class.unassigned]="!section.adviser_id">
                <td>{{ section.level_name }}</td>
                <td>{{ section.section_name }}</td>
                <td>{{ section.capacity }}</td>
                <td>
                  <span class="enrollment-badge" [class.full]="section.current_enrollment >= section.capacity">
                    {{ section.current_enrollment }}
                  </span>
                </td>
                <td>
                  <span *ngIf="section.adviser_name" class="adviser-name">
                    {{ section.adviser_name }}
                  </span>
                  <span *ngIf="!section.adviser_name" class="unassigned-label">
                    ⚠️ Unassigned
                  </span>
                </td>
                <td>
                  <div class="action-buttons">
                    <button class="btn-assign" (click)="openAssignModal(section)">
                      <i class="fa-solid fa-user-pen"></i>
                      {{ section.adviser_id ? 'Change' : 'Assign' }}
                    </button>
                    <button *ngIf="section.adviser_id" class="btn-remove" (click)="removeAdviser(section)">
                      <i class="fa-solid fa-user-minus"></i>
                      Remove
                    </button>
                    <button class="btn-view-students" (click)="viewSectionStudents(section)">
                      <i class="fa-solid fa-eye"></i>
                      View
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          </div>

          <div *ngIf="sections.length === 0" class="no-sections">
            <p>No sections found for this school year.</p>
          </div>
        </div>
      </div>

      <!-- Assign Adviser Modal -->
      <div *ngIf="showAssignModal" class="modal-overlay" (click)="closeAssignModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Assign Adviser</h3>
            <button class="close-btn" (click)="closeAssignModal()">×</button>
          </div>
          <div class="modal-body">
            <div class="section-info">
              <p><strong>Section:</strong> {{ selectedSection?.level_name }} - {{ selectedSection?.section_name }}</p>
              <p><strong>School Year:</strong> {{ selectedSection?.year_name }}</p>
              <p *ngIf="selectedSection?.adviser_name">
                <strong>Current Adviser:</strong> {{ selectedSection?.adviser_name }}
              </p>
            </div>

            <div class="adviser-list">
              <div class="adviser-filter">
                <label>Filter by Grade Level:</label>
                <select [(ngModel)]="adviserSearchGrade" class="form-select">
                  <option [value]="null">All Grade Levels</option>
                  <option *ngFor="let grade of gradeLevels" [value]="grade.id">{{ grade.level_name }}</option>
                </select>
              </div>
              <h4>Available Advisers: <span class="adviser-count">{{ filteredAdvisers.length }}</span></h4>
              <div *ngFor="let adviser of filteredAdvisers" class="adviser-item"
                   [class.selected]="selectedAdviserId === adviser.user_id"
                   (click)="selectedAdviserId = adviser.user_id">
                <div class="adviser-info">
                  <div class="adviser-name">{{ adviser.full_name }}</div>
                  <div class="adviser-details">
                    {{ adviser.employee_id }} | {{ adviser.email }}
                  </div>
                </div>
                <div class="adviser-sections">
                  <span *ngFor="let sec of getAdviserSections(adviser.user_id)" class="section-badge">
                    {{ sec.level_name }} - {{ sec.section_name }}
                  </span>
                  <span *ngIf="getAdviserSections(adviser.user_id).length === 0" class="no-sections-badge">
                    No sections assigned
                  </span>
                </div>
              </div>
              <div *ngIf="filteredAdvisers.length === 0" class="no-advisers">
                No advisers found for selected grade level.
              </div>
            </div>

            <!-- Reason and password confirmation -->
            <div class="assign-confirm-fields" *ngIf="selectedAdviserId">
              <div class="assign-notice">
                <i class="bi bi-person-badge-fill"></i>
                Please provide a reason and your password to confirm this assignment.
              </div>
              <div class="form-group" style="margin-top:1rem;">
                <label>Reason for assignment <span style="color:#dc3545">*</span></label>
                <textarea [(ngModel)]="assignReason" rows="2"
                  placeholder="Explain why this adviser is being assigned..."
                  class="form-select" style="resize:vertical;"></textarea>
              </div>
              <div class="form-group" style="margin-top:0.75rem;">
                <label>Your password <span style="color:#dc3545">*</span></label>
                <input type="password" [(ngModel)]="assignPassword"
                  placeholder="Enter your account password"
                  class="form-select">
              </div>
            </div>

          </div>
          <div class="modal-footer">
            <button class="btn-cancel" (click)="closeAssignModal()">Cancel</button>
            <button class="btn-save" (click)="assignAdviser()"
              [disabled]="!selectedAdviserId || !assignReason.trim() || !assignPassword.trim() || saving">
              {{ saving ? 'Assigning...' : 'Assign Adviser' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Remove Adviser Confirmation Modal -->
      <div *ngIf="showRemoveAdviserModal" class="modal-overlay" (click)="closeRemoveAdviserModal()">
        <div class="modal-content confirm-modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Remove Adviser</h3>
            <button class="close-btn" (click)="closeRemoveAdviserModal()">×</button>
          </div>
          <div class="modal-body">
            <div class="confirm-icon">
              <i class="fa-solid fa-user-minus"></i>
            </div>
            <p class="confirm-message">Are you sure you want to remove the adviser from this section?</p>
            <div class="confirm-details">
              <div class="confirm-detail-item">
                <span class="detail-label">Section</span>
                <span class="detail-value">{{ sectionToRemoveAdviser?.level_name }} - {{ sectionToRemoveAdviser?.section_name }}</span>
              </div>
              <div class="confirm-detail-item">
                <span class="detail-label">Adviser</span>
                <span class="detail-value">{{ sectionToRemoveAdviser?.adviser_name }}</span>
              </div>
            </div>
            <p class="confirm-warning">
              <i class="fa-solid fa-triangle-exclamation"></i>
              This section will be marked as unassigned.
            </p>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" (click)="closeRemoveAdviserModal()">Cancel</button>
            <button class="btn-danger" (click)="confirmRemoveAdviser()" [disabled]="saving">
              <i class="fa-solid fa-user-minus"></i>
              {{ saving ? 'Removing...' : 'Remove Adviser' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Set Current School Year Confirmation Modal -->
      <div *ngIf="showSetCurrentConfirmModal" class="modal-overlay" (click)="closeSetCurrentConfirmModal()">
        <div class="modal-content confirm-modal set-current-modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Set Current School Year</h3>
            <button class="close-btn" (click)="closeSetCurrentConfirmModal()">×</button>
          </div>
          <div class="modal-body">
            <div class="confirm-icon current-year-icon">
              <i class="fa-solid fa-calendar-check"></i>
            </div>
            <p class="confirm-message">Set "{{ yearToSetAsCurrent?.year_name }}" as the current school year?</p>

            <div class="confirm-details">
              <div class="confirm-detail-item">
                <span class="detail-label">New Current Year</span>
                <span class="detail-value">{{ yearToSetAsCurrent?.year_name }}</span>
              </div>
              <div class="confirm-detail-item">
                <span class="detail-label">Period</span>
                <span class="detail-value">{{ yearToSetAsCurrent?.start_date | date:'MMM d, y' }} - {{ yearToSetAsCurrent?.end_date | date:'MMM d, y' }}</span>
              </div>
              <div class="confirm-detail-item" *ngIf="getCurrentSchoolYear()">
                <span class="detail-label">Previous Current</span>
                <span class="detail-value">{{ getCurrentSchoolYear()?.year_name }}</span>
              </div>
            </div>

            <div class="impact-warning">
              <div class="warning-header">
                <i class="fa-solid fa-exclamation-triangle"></i>
                <strong>Important Changes</strong>
              </div>
              <ul class="impact-list">
                <li>
                  <i class="fa-solid fa-user-plus"></i>
                  <span>All new student, adviser, and staff accounts will be assigned to <strong>{{ yearToSetAsCurrent?.year_name }}</strong></span>
                </li>
                <li>
                  <i class="fa-solid fa-calendar-alt"></i>
                  <span>This will determine when the next school year enrollment opens</span>
                </li>
                <li>
                  <i class="fa-solid fa-database"></i>
                  <span>System reports and dashboards will reflect this as the active academic year</span>
                </li>
                <li>
                  <i class="fa-solid fa-graduation-cap"></i>
                  <span>Student promotions and grade level assignments will be based on this year</span>
                </li>
              </ul>
            </div>

            <div class="confirm-note">
              <i class="fa-solid fa-info-circle"></i>
              <span>This action will immediately update the system-wide current school year setting.</span>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" (click)="closeSetCurrentConfirmModal()">Cancel</button>
            <button class="btn-confirm-current" (click)="confirmSetCurrentSchoolYear()" [disabled]="settingCurrent">
              <i class="fa-solid fa-check-circle"></i>
              {{ settingCurrent ? 'Setting Current...' : 'Set as Current Year' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Auto Set Current School Year Modal -->
      <div *ngIf="showAutoSetCurrentModal" class="modal-overlay">
        <div class="modal-content confirm-modal auto-set-current-modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>School Year Started</h3>
          </div>
          <div class="modal-body">
            <div class="confirm-icon auto-current-icon">
              <i class="fa-solid fa-calendar-star"></i>
            </div>
            <p class="confirm-message">School year "{{ suggestedSchoolYear?.year_name }}" has started!</p>

            <div class="confirm-details">
              <div class="confirm-detail-item">
                <span class="detail-label">School Year</span>
                <span class="detail-value">{{ suggestedSchoolYear?.year_name }}</span>
              </div>
              <div class="confirm-detail-item">
                <span class="detail-label">Start Date</span>
                <span class="detail-value">{{ suggestedSchoolYear?.start_date | date:'MMM d, y' }}</span>
              </div>
              <div class="confirm-detail-item">
                <span class="detail-label">End Date</span>
                <span class="detail-value">{{ suggestedSchoolYear?.end_date | date:'MMM d, y' }}</span>
              </div>
            </div>

            <div class="auto-set-info">
              <div class="info-header">
                <i class="fa-solid fa-lightbulb"></i>
                <strong>Recommendation</strong>
              </div>
              <p>Would you like to set this as the current school year? This will:</p>
              <ul class="auto-set-list">
                <li>
                  <i class="fa-solid fa-check"></i>
                  <span>Make this the active academic year for all new enrollments</span>
                </li>
                <li>
                  <i class="fa-solid fa-check"></i>
                  <span>Update system reports and dashboards</span>
                </li>
                <li>
                  <i class="fa-solid fa-check"></i>
                  <span>Enable proper grade level assignments</span>
                </li>
              </ul>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" (click)="closeAutoSetCurrentModal()">Not Now</button>
            <button class="btn-confirm-current" (click)="confirmAutoSetCurrent()" [disabled]="settingCurrent">
              <i class="fa-solid fa-calendar-check"></i>
              {{ settingCurrent ? 'Setting Current...' : 'Set as Current Year' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Create School Year Modal -->
      <div *ngIf="showCreateYearModal" class="modal-overlay" (click)="closeCreateYearModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Create New School Year</h3>
            <button class="close-btn" (click)="closeCreateYearModal()">×</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Year Name: <span class="required">*</span></label>
              <input
                type="text"
                [(ngModel)]="newYear.year_name"
                class="form-input"
                placeholder="e.g., 2024-2025"
                (input)="validateYearName()">
              <small class="help-text">Format: YYYY-YYYY (e.g., 2024-2025)</small>
              <small *ngIf="yearNameError" class="error-text">{{ yearNameError }}</small>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label>Start Date: <span class="required">*</span></label>
                <input
                  type="date"
                  [(ngModel)]="newYear.start_date"
                  class="form-input">
              </div>

              <div class="form-group">
                <label>End Date: <span class="required">*</span></label>
                <input
                  type="date"
                  [(ngModel)]="newYear.end_date"
                  class="form-input">
              </div>
            </div>

            <div class="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  [(ngModel)]="newYear.is_active">
                <span>Set as active school year</span>
              </label>
            </div>

            <div class="info-box">
              <i class="fa-solid fa-info-circle"></i>
              <div>
                <strong>Note:</strong> After creating the school year, you can set it as "Current" to automatically assign it to all new accounts.
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" (click)="closeCreateYearModal()">Cancel</button>
            <button class="btn-save" (click)="createSchoolYear()" [disabled]="!isYearFormValid() || saving">
              {{ saving ? 'Creating...' : 'Create School Year' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Create Section Modal -->
      <div *ngIf="showCreateSectionModal" class="modal-overlay" (click)="closeCreateSectionModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Create New Section</h3>
            <button class="close-btn" (click)="closeCreateSectionModal()">×</button>
          </div>
          <div class="modal-body">
            <div class="section-info">
              <p><strong>School Year:</strong> {{ getSelectedSchoolYearName() }}</p>
            </div>

            <div class="form-group">
              <label>Grade Level: <span class="required">*</span></label>
              <select [(ngModel)]="newSection.grade_level_id" class="form-select">
                <option [value]="null">-- Select Grade Level --</option>
                <option *ngFor="let grade of gradeLevels" [value]="grade.id">
                  {{ grade.level_name }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label>Section Name: <span class="required">*</span></label>
              <input
                type="text"
                [(ngModel)]="newSection.section_name"
                class="form-input"
                placeholder="e.g., Section A, Section B">
              <small class="help-text">Enter the section name (e.g., A, B, C, Diamond, Ruby)</small>
            </div>

            <div class="form-group">
              <label>Capacity: <span class="required">*</span></label>
              <input
                type="number"
                [(ngModel)]="newSection.capacity"
                class="form-input"
                min="1"
                max="100"
                placeholder="50">
              <small class="help-text">Maximum number of students (default: 50)</small>
            </div>

            <div class="info-box">
              <i class="fa-solid fa-info-circle"></i>
              <div>
                <strong>Note:</strong> After creating the section, you can assign an adviser to it.
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" (click)="closeCreateSectionModal()">Cancel</button>
            <button class="btn-save" (click)="createSection()" [disabled]="!isSectionFormValid() || saving">
              {{ saving ? 'Creating...' : 'Create Section' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Success/Error Messages -->
      <div *ngIf="message" class="message" [class.success]="messageType === 'success'" [class.error]="messageType === 'error'">
        {{ message }}
      </div>

      <!-- View Students Modal -->
      <div *ngIf="showStudentsModal" class="modal-overlay" (click)="closeStudentsModal()">
        <div class="modal-content large-modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Students in {{ selectedSectionForStudents?.level_name }} - {{ selectedSectionForStudents?.section_name }}</h3>
            <button class="close-btn" (click)="closeStudentsModal()">×</button>
          </div>
          <div class="modal-body">
            <div class="section-info" *ngIf="sectionStudentsData">
              <div class="info-row">
                <div class="info-item">
                  <strong>School Year:</strong> {{ sectionStudentsData.section.school_year }}
                </div>
                <div class="info-item">
                  <strong>Adviser:</strong> {{ sectionStudentsData.section.adviser_name || 'Unassigned' }}
                </div>
                <div class="info-item">
                  <strong>Capacity:</strong> {{ sectionStudentsData.section.current_enrollment }} / {{ sectionStudentsData.section.capacity }}
                </div>
              </div>
            </div>

            <div *ngIf="loadingStudents" class="loading-state">
              <div class="spinner"></div>
              <p>Loading students...</p>
            </div>

            <div *ngIf="!loadingStudents && sectionStudentsData" class="students-list">
              <div class="students-header">
                <h4>{{ sectionStudentsData.students.length }} Students Enrolled</h4>
                <div class="stats-row">
                  <span class="stat-badge">
                    <i class="fa-solid fa-users"></i>
                    {{ sectionStudentsData.stats.total_students }} Total
                  </span>
                  <span class="stat-badge allergy" *ngIf="sectionStudentsData.stats.students_with_allergies > 0">
                    <i class="fa-solid fa-exclamation-triangle"></i>
                    {{ sectionStudentsData.stats.students_with_allergies }} with Allergies
                  </span>
                  <span class="stat-badge visit" *ngIf="sectionStudentsData.stats.students_with_visits > 0">
                    <i class="fa-solid fa-stethoscope"></i>
                    {{ sectionStudentsData.stats.students_with_visits }} with Clinic Visits
                  </span>
                </div>
              </div>

              <div class="students-table">
                <table>
                  <thead>
                    <tr>
                      <th>Student Number</th>
                      <th>Name</th>
                      <th>Gender</th>
                      <th>Age</th>
                      <th>Blood Type</th>
                      <th>Emergency Contact</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let student of sectionStudentsData.students">
                      <td>{{ student.student_number }}</td>
                      <td>
                        <div class="student-name">
                          {{ student.full_name }}
                          <div class="student-allergies" *ngIf="student.allergies && student.allergies.length > 0">
                            <span *ngFor="let allergy of student.allergies" class="allergy-tag">{{ allergy }}</span>
                          </div>
                        </div>
                      </td>
                      <td>{{ student.gender }}</td>
                      <td>{{ student.age || 'N/A' }}</td>
                      <td>{{ student.blood_type || 'N/A' }}</td>
                      <td>
                        <div class="contact-info" *ngIf="student.emergency_contact">
                          <div>{{ student.emergency_contact }}</div>
                          <small *ngIf="student.emergency_contact_phone">{{ student.emergency_contact_phone }}</small>
                        </div>
                        <span *ngIf="!student.emergency_contact" class="no-contact">No contact</span>
                      </td>
                      <td>
                        <span class="status-badge" [class]="'status-' + student.enrollment_status">
                          {{ student.enrollment_status | titlecase }}
                        </span>
                        <div class="last-visit" *ngIf="student.last_visit">
                          <small>Last visit: {{ student.last_visit.visit_datetime | date:'MMM d' }}</small>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>

                <div *ngIf="sectionStudentsData.students.length === 0" class="no-students">
                  <div class="empty-icon">👥</div>
                  <h4>No Students Enrolled</h4>
                  <p>This section doesn't have any students assigned yet.</p>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" (click)="closeStudentsModal()">Close</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .school-year-management {
      padding: 2rem;
      background: #f5f7fa;
      min-height: 100vh;
    }

    .page-header {
      margin-bottom: 2rem;
      background: linear-gradient(135deg, #052355 0%, #5381b2 100%);
      padding: 2rem 1.5rem;
      border-radius: 12px;
      box-shadow: 0 4px 16px rgba(5, 35, 85, 0.25);

      h1 { font-size: 2rem; color: #ffffff; margin-bottom: 0.5rem; font-weight: 700; }
      p { color: rgba(255, 255, 255, 0.8); font-size: 1.1rem; margin: 0; }
    }

    .school-year-selector {
      background: white;
      padding: 1.5rem;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      margin-bottom: 2rem;

      .selector-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 2rem;
        margin-bottom: 1rem;
      }

      .selector-left {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 1rem;
      }

      .btn-create-year {
        background: linear-gradient(135deg, #052355 0%, #5381b2 100%);
        color: white;
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        transition: all 0.2s ease;
        white-space: nowrap;
        box-shadow: 0 2px 8px rgba(5, 35, 85, 0.2);

        &:hover {
          background: linear-gradient(135deg, #041d44 0%, #4270a1 100%);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(5, 35, 85, 0.3);
        }

        i { font-size: 1rem; }
      }

      .selector-right {
        display: flex;
        align-items: center;
      }

      label {
        font-weight: 600;
        color: #2c3e50;
        font-size: 1.1rem;
        white-space: nowrap;
      }

      .form-select {
        flex: 1;
        max-width: 400px;
        padding: 0.75rem;
        border: 2px solid #e9ecef;
        border-radius: 8px;
        font-size: 1rem;
        &:focus {
          outline: none;
          border-color: #3498db;
        }
      }

      .btn-set-current {
        background: linear-gradient(135deg, #052355 0%, #5381b2 100%);
        color: white;
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        transition: all 0.2s ease;
        white-space: nowrap;
        box-shadow: 0 2px 8px rgba(5, 35, 85, 0.2);

        &:hover:not(:disabled) {
          background: linear-gradient(135deg, #041d44 0%, #4270a1 100%);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(5, 35, 85, 0.3);
        }

        &:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        i {
          font-size: 1.1rem;
        }
      }

      .btn-set-current-disabled {
        background: #6b7280;
        color: white;
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 8px;
        cursor: not-allowed;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        white-space: nowrap;
        box-shadow: 0 2px 8px rgba(107, 114, 128, 0.2);
        opacity: 0.8;

        i {
          font-size: 1rem;
        }
      }

      .current-badge {
        background: linear-gradient(135deg, #ffc107, #ff9800);
        color: white;
        padding: 0.75rem 1.5rem;
        border-radius: 8px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        box-shadow: 0 2px 8px rgba(255, 193, 7, 0.3);
        animation: pulse 2s infinite;

        i {
          font-size: 1.1rem;
        }
      }

      .current-year-info {
        background: linear-gradient(135deg, rgba(5, 35, 85, 0.05) 0%, rgba(83, 129, 178, 0.05) 100%);
        border-left: 4px solid #052355;
        padding: 1rem;
        border-radius: 6px;
        display: flex;
        gap: 1rem;
        align-items: flex-start;

        i {
          color: #052355;
          font-size: 1.2rem;
          margin-top: 2px;
        }

        span {
          flex: 1;
          color: #1565c0;
          line-height: 1.6;

          strong {
            color: #0d47a1;
          }

          small {
            color: #1976d2;
            font-size: 0.9rem;
          }
        }
      }
    }

    @keyframes pulse {
      0%, 100% {
        box-shadow: 0 2px 8px rgba(255, 193, 7, 0.3);
      }
      50% {
        box-shadow: 0 4px 16px rgba(255, 193, 7, 0.5);
      }
    }

    .loading-state {
      text-align: center;
      padding: 3rem;
      background: white;
      border-radius: 12px;

      .spinner {
        width: 50px;
        height: 50px;
        margin: 0 auto 1rem;
        border: 4px solid #e8f0f8;
        border-top: 4px solid #052355;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .sections-container {
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      overflow: visible;
    }

    .sections-header {
      padding: 1.5rem;
      border-bottom: 2px solid #e9ecef;
      display: flex;
      justify-content: space-between;
      align-items: center;

      h2 {
        font-size: 1.5rem;
        color: #2c3e50;
        margin: 0;
        font-weight: 700;
      }

      .header-actions {
        display: flex;
        align-items: center;
        gap: 2rem;
      }

      .btn-create-section {
        background: linear-gradient(135deg, #052355 0%, #5381b2 100%);
        color: white;
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        transition: all 0.2s ease;
        white-space: nowrap;
        box-shadow: 0 2px 8px rgba(5, 35, 85, 0.2);

        &:hover {
          background: linear-gradient(135deg, #041d44 0%, #4270a1 100%);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(5, 35, 85, 0.3);
        }

        i { font-size: 1rem; }
      }

      .stats {
        display: flex;
        gap: 2rem;

        .stat {
          font-size: 0.95rem;
          color: #7f8c8d;

          strong {
            color: #2c3e50;
            font-size: 1.2rem;
            margin-right: 0.25rem;
          }
        }
      }
    }

    .sections-table {
      padding: 1.5rem;

      table {
        width: 100%;
        border-collapse: collapse;

        thead {
          background: #f8f9fa;

          th {
            padding: 1rem;
            text-align: left;
            font-weight: 600;
            color: #2c3e50;
            border-bottom: 2px solid #e9ecef;
            white-space: nowrap;
          }
        }

        tbody {
          tr {
            border-bottom: 1px solid #f1f3f4;
            transition: background 0.2s ease;

            &:hover {
              background: #f8f9fa;
            }

            &.unassigned {
              background: #fff3cd;
            }

            td {
              padding: 1rem;
              color: #2c3e50;
              white-space: nowrap;
              vertical-align: middle;
            }
          }
        }
      }

      .enrollment-badge {
        padding: 0.25rem 0.75rem;
        border-radius: 20px;
        background: #e8f5e9;
        color: #2e7d32;
        font-weight: 500;
        font-size: 0.9rem;
        white-space: nowrap;
        display: inline-block;

        &.full {
          background: #ffebee;
          color: #c62828;
        }
      }

      .adviser-name {
        font-weight: 500;
        color: #2c3e50;
      }

      .unassigned-label {
        color: #f39c12;
        font-weight: 500;
      }

      .btn-assign, .btn-remove, .btn-view-students {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.35rem;
        padding: 0.45rem 0.85rem;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 500;
        font-size: 0.82rem;
        transition: all 0.2s ease;
        white-space: nowrap;
        height: 32px;
        line-height: 1;

        i { font-size: 0.8rem; }
      }

      .action-buttons {
        display: flex;
        align-items: center;
        gap: 0.4rem;
        flex-wrap: nowrap;
      }

      .btn-assign {
        background: #f97316;
        color: white;

        &:hover {
          background: #ea6c0a;
          transform: translateY(-1px);
          box-shadow: 0 3px 8px rgba(249, 115, 22, 0.35);
        }
      }

      .btn-remove {
        background: #ef4444;
        color: white;

        &:hover {
          background: #dc2626;
          transform: translateY(-1px);
          box-shadow: 0 3px 8px rgba(239, 68, 68, 0.35);
        }
      }

      .btn-view-students {
        background: #38bdf8;
        color: white;

        &:hover {
          background: #0ea5e9;
          transform: translateY(-1px);
          box-shadow: 0 3px 8px rgba(56, 189, 248, 0.35);
        }
      }

      .no-sections {
        text-align: center;
        padding: 3rem;
        color: #7f8c8d;
      }
    }

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
      border-radius: 12px;
      width: 90%;
      max-width: 700px;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
    }

    .modal-header {
      padding: 1.5rem;
      border-bottom: 2px solid #e9ecef;
      display: flex;
      justify-content: space-between;
      align-items: center;

      h3 {
        margin: 0;
        font-size: 1.5rem;
        color: #2c3e50;
        font-weight: 700;
      }

      .close-btn {
        background: none;
        border: none;
        font-size: 2rem;
        color: #7f8c8d;
        cursor: pointer;
        line-height: 1;

        &:hover {
          color: #2c3e50;
        }
      }
    }

    .modal-body {
      padding: 1.5rem;

      .section-info {
        background: #f8f9fa;
        padding: 1rem;
        border-radius: 8px;
        margin-bottom: 1.5rem;

        p {
          margin: 0.5rem 0;
          color: #2c3e50;

          strong {
            color: #7f8c8d;
            margin-right: 0.5rem;
          }
        }
      }

      .form-group {
        margin-bottom: 1.5rem;

        label {
          display: block;
          font-weight: 600;
          color: #2c3e50;
          margin-bottom: 0.5rem;

          .required {
            color: #e74c3c;
            margin-left: 0.25rem;
          }
        }

        .form-select {
          width: 100%;
          padding: 0.75rem;
          border: 2px solid #e9ecef;
          border-radius: 8px;
          font-size: 1rem;

          &:focus {
            outline: none;
            border-color: #3498db;
          }
        }

        .form-input {
          width: 100%;
          padding: 0.75rem;
          border: 2px solid #e9ecef;
          border-radius: 8px;
          font-size: 1rem;

          &:focus {
            outline: none;
            border-color: #3498db;
          }
        }

        .help-text {
          display: block;
          margin-top: 0.5rem;
          color: #7f8c8d;
          font-size: 0.9rem;
        }

        .error-text {
          display: block;
          margin-top: 0.5rem;
          color: #e74c3c;
          font-size: 0.9rem;
          font-weight: 500;
        }

        &.checkbox-group {
          label {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            cursor: pointer;
            font-weight: 500;

            input[type="checkbox"] {
              width: 20px;
              height: 20px;
              cursor: pointer;
            }
          }
        }
      }

      .form-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
      }

      .info-box {
        background: linear-gradient(135deg, rgba(5, 35, 85, 0.05) 0%, rgba(83, 129, 178, 0.05) 100%);
        border-left: 4px solid #052355;
        padding: 1rem;
        border-radius: 6px;
        display: flex;
        gap: 1rem;
        align-items: flex-start;
        margin-top: 1rem;

        i {
          color: #052355;
          font-size: 1.2rem;
          margin-top: 2px;
        }

        div {
          flex: 1;
          color: #2c3e50;
          font-size: 0.95rem;
          line-height: 1.5;

          strong {
            color: #052355;
          }
        }
      }

      .adviser-list {
        .adviser-filter {
          background: linear-gradient(135deg, rgba(5, 35, 85, 0.04) 0%, rgba(83, 129, 178, 0.06) 100%);
          border: 1.5px solid #d0dff0;
          border-radius: 10px;
          padding: 1rem 1.25rem;
          margin-bottom: 1.25rem;

          label {
            display: block;
            font-weight: 700;
            color: #052355;
            font-size: 0.95rem;
            margin-bottom: 0.5rem;
            letter-spacing: 0.01em;
          }

          .form-select {
            width: 100%;
            padding: 0.65rem 1rem;
            border: 2px solid #c5d8f0;
            border-radius: 8px;
            font-size: 1rem;
            color: #2c3e50;
            background: #fff;
            cursor: pointer;
            transition: border-color 0.2s ease;

            &:focus {
              outline: none;
              border-color: #052355;
            }
          }
        }

        h4 {
          font-size: 1rem;
          color: #2c3e50;
          margin-bottom: 1rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.5rem;

          .adviser-count {
            background: linear-gradient(135deg, #052355 0%, #5381b2 100%);
            color: #fff;
            border-radius: 12px;
            padding: 0.15rem 0.65rem;
            font-size: 0.82rem;
            font-weight: 700;
          }
        }

        .no-advisers {
          text-align: center;
          padding: 2rem 1.5rem;
          color: #7f8c8d;
          font-size: 0.95rem;
          background: #f8f9fa;
          border-radius: 8px;
          border: 1.5px dashed #dee2e6;
        }

        .adviser-item {
          padding: 1rem;
          border: 2px solid #e9ecef;
          border-radius: 8px;
          margin-bottom: 0.75rem;
          cursor: pointer;
          transition: all 0.2s ease;

          &:hover {
            border-color: #3498db;
            background: #f8f9fa;
          }

          &.selected {
            border-color: #3498db;
            background: #e3f2fd;
          }

          .adviser-info {
            margin-bottom: 0.5rem;

            .adviser-name {
              font-weight: 600;
              color: #2c3e50;
              margin-bottom: 0.25rem;
            }

            .adviser-details {
              font-size: 0.9rem;
              color: #7f8c8d;
            }
          }

          .adviser-sections {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;

            .section-badge {
              padding: 0.25rem 0.75rem;
              background: #e8f5e9;
              color: #2e7d32;
              border-radius: 20px;
              font-size: 0.85rem;
              font-weight: 500;
            }

            .no-sections-badge {
              padding: 0.25rem 0.75rem;
              background: #f1f3f4;
              color: #7f8c8d;
              border-radius: 20px;
              font-size: 0.85rem;
            }
          }
        }
      }
    }

    .modal-footer {
      padding: 1.5rem;
      border-top: 2px solid #e9ecef;
      display: flex;
      justify-content: flex-end;
      gap: 1rem;

      button {
        padding: 0.75rem 1.5rem;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
        font-size: 1rem;
        transition: all 0.2s ease;

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }

      .btn-cancel {
        background: #e9ecef;
        color: #2c3e50;

        &:hover {
          background: #dee2e6;
        }
      }

      .btn-save {
        background: linear-gradient(135deg, #052355 0%, #5381b2 100%);
        color: white;
        box-shadow: 0 2px 8px rgba(5, 35, 85, 0.2);

        &:hover:not(:disabled) {
          background: linear-gradient(135deg, #041d44 0%, #4270a1 100%);
          box-shadow: 0 4px 12px rgba(5, 35, 85, 0.3);
        }
      }

      .btn-danger {
        background: linear-gradient(135deg, #c0392b 0%, #e74c3c 100%);
        color: white;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        box-shadow: 0 2px 8px rgba(192, 57, 43, 0.2);

        &:hover:not(:disabled) {
          background: linear-gradient(135deg, #a93226 0%, #cb4335 100%);
          box-shadow: 0 4px 12px rgba(192, 57, 43, 0.35);
        }
      }
    }

    .confirm-modal {
      max-width: 440px;

      .confirm-icon {
        text-align: center;
        margin-bottom: 1rem;

        i {
          font-size: 2rem;
          color: #e74c3c;
          background: #fdecea;
          width: 72px;
          height: 72px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          overflow: hidden;
        }
      }

      .confirm-message {
        text-align: center;
        font-size: 1.05rem;
        color: #2c3e50;
        font-weight: 500;
        margin-bottom: 1.25rem;
      }

      .confirm-details {
        background: #f8f9fa;
        border-radius: 8px;
        padding: 1rem;
        margin-bottom: 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.6rem;

        .confirm-detail-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;

          .detail-label {
            font-size: 0.85rem;
            color: #7f8c8d;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            white-space: nowrap;
          }

          .detail-value {
            font-size: 0.95rem;
            color: #2c3e50;
            font-weight: 600;
            text-align: right;
          }
        }
      }

      .confirm-warning {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        background: #fff8e1;
        border-left: 4px solid #f39c12;
        border-radius: 6px;
        padding: 0.75rem 1rem;
        font-size: 0.9rem;
        color: #856404;

        i { color: #f39c12; }
      }
    }

    .message {
      position: fixed;
      top: 2rem;
      right: 2rem;
      padding: 1rem 1.5rem;
      border-radius: 8px;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 2000;
      animation: slideIn 0.3s ease;

      &.success {
        background: #2ecc71;
        color: white;
      }

      &.error {
        background: #e74c3c;
        color: white;
      }
    }

    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    .large-modal {
      max-width: 1200px;
      width: 95%;
    }

    .students-list {
      .students-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
        padding-bottom: 1rem;
        border-bottom: 2px solid #e9ecef;

        h4 {
          margin: 0;
          color: #2c3e50;
          font-size: 1.3rem;
        }

        .stats-row {
          display: flex;
          gap: 1rem;

          .stat-badge {
            padding: 0.5rem 1rem;
            border-radius: 20px;
            font-size: 0.85rem;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            background: #f8f9fa;
            color: #2c3e50;

            &.allergy {
              background: #fff3cd;
              color: #856404;
            }

            &.visit {
              background: #d4edda;
              color: #155724;
            }

            i {
              font-size: 0.9rem;
            }
          }
        }
      }

      .students-table {
        table {
          width: 100%;
          border-collapse: collapse;

          thead {
            background: #f8f9fa;

            th {
              padding: 1rem;
              text-align: left;
              font-weight: 600;
              color: #2c3e50;
              border-bottom: 2px solid #e9ecef;
              font-size: 0.9rem;
            }
          }

          tbody {
            tr {
              border-bottom: 1px solid #f1f3f4;
              transition: background 0.2s ease;

              &:hover {
                background: #f8f9fa;
              }

              td {
                padding: 1rem;
                color: #2c3e50;
                font-size: 0.9rem;
                vertical-align: top;
              }
            }
          }
        }

        .student-name {
          font-weight: 500;

          .student-allergies {
            margin-top: 0.5rem;
            display: flex;
            flex-wrap: wrap;
            gap: 0.25rem;

            .allergy-tag {
              background: #fff3cd;
              color: #856404;
              padding: 0.2rem 0.5rem;
              border-radius: 12px;
              font-size: 0.75rem;
              font-weight: 500;
            }
          }
        }

        .contact-info {
          div {
            font-weight: 500;
          }
          small {
            color: #7f8c8d;
          }
        }

        .no-contact {
          color: #7f8c8d;
          font-style: italic;
        }

        .status-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-size: 0.8rem;
          font-weight: 500;

          &.status-active {
            background: #d4edda;
            color: #155724;
          }

          &.status-inactive {
            background: #f8d7da;
            color: #721c24;
          }
        }

        .last-visit {
          margin-top: 0.25rem;
          small {
            color: #7f8c8d;
          }
        }

        .no-students {
          text-align: center;
          padding: 3rem;
          color: #7f8c8d;

          .empty-icon {
            font-size: 3rem;
            margin-bottom: 1rem;
          }

          h4 {
            margin-bottom: 0.5rem;
            color: #2c3e50;
          }
        }
      }
    }

    .info-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 1rem;

      .info-item {
        strong {
          color: #7f8c8d;
          margin-right: 0.5rem;
        }
      }
    }

    @media (max-width: 768px) {
      .school-year-management { padding: 1rem; }

      .page-header {
        flex-direction: column;
        align-items: flex-start;
        padding: 1.25rem;
        gap: 0.75rem;
        h1 { font-size: 1.4rem; }
        p { font-size: 0.95rem; }
      }

      .school-year-selector {
        padding: 1rem;
        margin-bottom: 1rem;
      }

      .selector-header {
        flex-direction: column;
        gap: 1rem;
      }

      .selector-left {
        flex-direction: column;
        align-items: flex-start;
        width: 100%;
        gap: 0.75rem;

        label { font-size: 1rem; }
        .form-select, .btn-create-year { width: 100%; }
      }

      .selector-right {
        width: 100%;
        .btn-set-current, .current-badge { width: 100%; justify-content: center; }
      }

      .current-year-info {
        flex-direction: column;
        gap: 0.5rem;
        padding: 0.75rem;
        font-size: 0.9rem;
      }

      .sections-container {
        border-radius: 8px;
      }

      .sections-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
        padding: 1rem;

        h2 { font-size: 1.2rem; }

        .header-actions {
          width: 100%;
          flex-direction: column;
          gap: 0.75rem;
          .btn-create-section { width: 100%; justify-content: center; }
        }

        .stats {
          flex-wrap: wrap;
          gap: 1rem;
        }
      }

      .sections-table {
        padding: 0.75rem;
        font-size: 0.8rem;
        th, td { padding: 8px 10px; }
      }

      .sections-table-wrapper {
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
      }

      .action-buttons {
        flex-wrap: wrap;
        gap: 4px;
        button { flex: 1; min-width: 60px; justify-content: center; }
      }

      .modal-overlay {
        padding: 0.5rem;
      }

      .modal-content {
        padding: 1rem;
        margin: 0.5rem;
        max-width: 100%;
        max-height: 90vh;
        overflow-y: auto;
      }
    }

    @media (max-width: 480px) {
      .school-year-management { padding: 0.75rem; }

      .page-header {
        padding: 1rem;
        h1 { font-size: 1.2rem; }
        p { font-size: 0.85rem; }
      }

      .school-year-selector {
        padding: 0.75rem;
      }

      .sections-header {
        padding: 0.75rem;
        h2 { font-size: 1.1rem; }
      }

      .sections-table {
        padding: 0.5rem;
        font-size: 0.75rem;
        th, td { padding: 6px 8px; }
      }

      .stats {
        gap: 0.75rem;
        .stat { font-size: 0.85rem; }
      }

      .action-buttons {
        button {
          font-size: 0.75rem;
          padding: 0.35rem 0.5rem;
        }
      }

      .grade-cards-container {
        padding: 1.5rem 0;
        margin-bottom: 2rem;
      }

      .grade-cards {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 1.5rem;
      }

      .grade-card {
        background: white;
        border: 1.5px solid #e2e8f0;
        border-radius: 12px;
        padding: 1.5rem;
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        flex-direction: column;
        gap: 1rem;

        &:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
          border-color: #3b82f6;
        }

        .card-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;

          .card-icon {
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, #3b82f6, #1e40af);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 1.2rem;
            flex-shrink: 0;
          }

          .card-title {
            font-weight: 600;
            color: #1f2937;
            font-size: 1rem;
          }
        }

        .card-stats {
          display: flex;
          gap: 1rem;
          padding-top: 0.5rem;
          border-top: 1px solid #f3f4f6;

          .stat {
            flex: 1;
            text-align: center;

            .stat-value {
              display: block;
              font-size: 1.5rem;
              font-weight: 700;
              color: #3b82f6;
            }

            .stat-label {
              display: block;
              font-size: 0.75rem;
              color: #6b7280;
              margin-top: 0.25rem;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
          }
        }

        .card-arrow {
          align-self: flex-end;
          color: #9ca3af;
          font-size: 1.2rem;
          transition: color 0.3s ease;
        }

        &:hover .card-arrow {
          color: #3b82f6;
        }
      }

      @media (max-width: 768px) {
        .grade-cards {
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 1rem;
        }

        .grade-card {
          padding: 1rem;

          .card-header {
            gap: 0.5rem;

            .card-icon {
              width: 36px;
              height: 36px;
              font-size: 1rem;
            }

            .card-title {
              font-size: 0.9rem;
            }
          }

          .card-stats {
            gap: 0.75rem;

            .stat {
              .stat-value {
                font-size: 1.25rem;
              }

              .stat-label {
                font-size: 0.7rem;
              }
            }
          }
        }
      }
    }
  `]
})
export class SchoolYearManagementComponent implements OnInit {
  schoolYears: SchoolYear[] = [];
  sections: Section[] = [];
  advisers: Adviser[] = [];
  gradeLevels: GradeLevel[] = [];

  selectedSchoolYearId: number | null = null;
  selectedSection: Section | null = null;
  selectedAdviserId: number | null = null;
  adviserSearchGrade: number | null = null;
  selectedGradeLevelId: number | null = null;

  get filteredAdvisers(): Adviser[] {
    if (!this.adviserSearchGrade) return this.advisers;
    return this.advisers.filter(a => {
      const assignedSections = this.getAdviserSections(a.user_id);
      if (assignedSections.length === 0) return true; // unassigned — always show
      return assignedSections.some(s => s.grade_level_id === Number(this.adviserSearchGrade));
    });
  }

  showAssignModal = false;
  assignReason = '';
  assignPassword = '';
  showRemoveAdviserModal = false;
  sectionToRemoveAdviser: Section | null = null;
  showCreateYearModal = false;
  showCreateSectionModal = false;
  showStudentsModal = false;
  showSetCurrentConfirmModal = false;
  showAutoSetCurrentModal = false;
  yearToSetAsCurrent: SchoolYear | null = null;
  suggestedSchoolYear: SchoolYear | null = null;
  loading = false;
  saving = false;
  settingCurrent = false;
  loadingStudents = false;

  selectedSectionForStudents: Section | null = null;
  sectionStudentsData: any = null;

  newYear = {
    year_name: '',
    start_date: '',
    end_date: '',
    is_active: false
  };
  yearNameError = '';

  newSection = {
    section_name: '',
    grade_level_id: null as number | null,
    capacity: 50
  };

  message = '';
  messageType: 'success' | 'error' = 'success';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadSchoolYears();
    this.loadAdvisers();
    this.loadGradeLevels();
    // Temporarily disabled until backend is deployed
    // this.checkAutoSetCurrent();
  }

  checkAutoSetCurrent(): void {
    this.http.get<any>(`${environment.apiUrl}/admin/school-years/check-current-auto`).subscribe({
      next: (response) => {
        if (response.success && response.data.suggested_school_year) {
          this.suggestedSchoolYear = response.data.suggested_school_year;
          this.showAutoSetCurrentModal = true;
        }
      },
      error: (err) => {
        // Silently handle error - this is not critical functionality
        // Auto-check for current school year failed
      }
    });
  }

  confirmAutoSetCurrent(): void {
    if (!this.suggestedSchoolYear) return;

    this.settingCurrent = true;
    const data = { school_year_id: this.suggestedSchoolYear.id };

    this.http.post<any>(`${environment.apiUrl}/admin/school-years/set-current`, data).subscribe({
      next: (response) => {
        if (response.success) {
          this.showMessage(`Current school year set to ${this.suggestedSchoolYear!.year_name}`, 'success');
          this.loadSchoolYears(); // Reload to update is_current flags
          this.closeAutoSetCurrentModal();
        } else {
          this.showMessage(response.message || 'Error setting current school year', 'error');
        }
        this.settingCurrent = false;
      },
      error: (err) => {
        // Error setting current school year
        this.showMessage('Error setting current school year', 'error');
        this.settingCurrent = false;
      }
    });
  }

  closeAutoSetCurrentModal(): void {
    this.showAutoSetCurrentModal = false;
    this.suggestedSchoolYear = null;
  }

  loadSchoolYears(): void {
    this.http.get<any>(`${environment.apiUrl}/admin/school-years`).subscribe({
      next: (response) => {
        if (response.success) {
          this.schoolYears = response.data;

          // Auto-select current school year
          const current = this.schoolYears.find(y => this.isSchoolYearCurrent(y));
          if (current) {
            this.selectedSchoolYearId = current.id;
            this.loadSections();
          }
        }
      },
      error: (err) => {
        // Error loading school years
        this.showMessage('Error loading school years', 'error');
      }
    });
  }

  loadSections(): void {
    if (!this.selectedSchoolYearId) return;

    this.loading = true;
    this.http.get<any>(`${environment.apiUrl}/admin/sections?school_year_id=${this.selectedSchoolYearId}`).subscribe({
      next: (response) => {
        if (response.success) {
          this.sections = response.data;
        }
        this.loading = false;
      },
      error: (err) => {
        // Error loading sections
        this.showMessage('Error loading sections', 'error');
        this.loading = false;
      }
    });
  }

  loadAdvisers(): void {
    this.http.get<any>(`${environment.apiUrl}/admin/advisers`).subscribe({
      next: (response) => {
        if (response.success) {
          this.advisers = response.data;
        }
      },
      error: (err) => {
        // Error loading advisers
      }
    });
  }

  loadGradeLevels(): void {
    // Use legacy API for grade levels
    this.http.get<any>(`${environment.apiUrl}/admin/grade-levels`).subscribe({
      next: (response) => {
        if (response.success) {
          this.gradeLevels = response.data;
        }
      },
      error: (err) => {
        // Error loading grade levels
      }
    });
  }

  onSchoolYearChange(): void {
    this.loadSections();
  }

  getSelectedSchoolYearName(): string {
    const year = this.schoolYears.find(y => y.id === this.selectedSchoolYearId);
    return year ? year.year_name : '';
  }

  getAssignedCount(): number {
    return this.sections.filter(s => s.adviser_id).length;
  }

  getUnassignedCount(): number {
    return this.sections.filter(s => !s.adviser_id).length;
  }

  openAssignModal(section: Section): void {
    this.selectedSection = section;
    this.selectedAdviserId = section.adviser_id;
    this.adviserSearchGrade = null;
    this.showAssignModal = true;
  }

  closeAssignModal(): void {
    this.showAssignModal = false;
    this.selectedSection = null;
    this.selectedAdviserId = null;
    this.assignReason = '';
    this.assignPassword = '';
  }

  assignAdviser(): void {
    if (!this.selectedSection || !this.selectedAdviserId) return;
    if (!this.assignReason.trim()) {
      this.showMessage('Please provide a reason for the adviser assignment.', 'error');
      return;
    }
    if (!this.assignPassword.trim()) {
      this.showMessage('Please enter your password to confirm.', 'error');
      return;
    }

    this.saving = true;
    const data = {
      section_id: this.selectedSection.id,
      adviser_user_id: this.selectedAdviserId,
      reason: this.assignReason,
      password: this.assignPassword
    };

    this.http.post<any>(`${environment.apiUrl}/admin/sections/assign-adviser`, data).subscribe({
      next: (response) => {
        if (response.success) {
          const studentsUpdated = response.students_updated || 0;
          this.showMessage(`Adviser assigned successfully! ${studentsUpdated} students updated.`, 'success');
          this.loadSections();
          this.closeAssignModal();
        } else {
          this.showMessage(response.message || 'Error assigning adviser', 'error');
        }
        this.saving = false;
      },
      error: (err) => {
        this.showMessage(err.error?.message || 'Error assigning adviser', 'error');
        this.saving = false;
      }
    });
  }

  removeAdviser(section: Section): void {
    this.sectionToRemoveAdviser = section;
    this.showRemoveAdviserModal = true;
  }

  closeRemoveAdviserModal(): void {
    this.showRemoveAdviserModal = false;
    this.sectionToRemoveAdviser = null;
  }

  confirmRemoveAdviser(): void {
    if (!this.sectionToRemoveAdviser) return;
    const section = this.sectionToRemoveAdviser;

    this.http.post<any>(`${environment.apiUrl}/admin/sections/assign-adviser`, {
      section_id: section.id,
      adviser_user_id: null
    }).subscribe({
      next: (response) => {
        if (response.success) {
          this.showMessage('Adviser removed successfully', 'success');
          this.loadSections();
        } else {
          this.showMessage(response.message || 'Error removing adviser', 'error');
        }
        this.closeRemoveAdviserModal();
      },
      error: (err) => {
        // Error removing adviser
        this.showMessage('Error removing adviser', 'error');
        this.closeRemoveAdviserModal();
      }
    });
  }

  getAdviserSections(userId: number): Section[] {
    return this.sections.filter(s => s.adviser_id === userId);
  }

  isSchoolYearCurrent(schoolYear: SchoolYear): boolean {
    // Handle various data types that might come from the API
    const isCurrent = schoolYear.is_current;

    // Convert to string for consistent comparison
    const currentStr = String(isCurrent).toLowerCase();

    return isCurrent === 1 ||
           currentStr === '1' ||
           currentStr === 'true';
  }

  canSetAsCurrentSchoolYear(schoolYear: SchoolYear): boolean {
    // Check if the school year's start date has arrived
    const today = new Date();
    const startDate = new Date(schoolYear.start_date);

    // Remove time component for date comparison
    today.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);

    return startDate <= today;
  }

  isSchoolYearFuture(schoolYear: SchoolYear): boolean {
    const today = new Date();
    const startDate = new Date(schoolYear.start_date);

    // Remove time component for date comparison
    today.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);

    return startDate > today;
  }

  getSelectedSchoolYear(): SchoolYear | null {
    if (!this.selectedSchoolYearId) return null;
    return this.schoolYears.find(y => y.id === this.selectedSchoolYearId) || null;
  }

  getCurrentSchoolYear(): SchoolYear | undefined {
    return this.schoolYears.find(y => this.isSchoolYearCurrent(y));
  }

  isCurrentSchoolYear(): boolean {
    if (!this.selectedSchoolYearId) return false;
    const year = this.schoolYears.find(y => y.id === this.selectedSchoolYearId);

    if (!year) return false;

    return this.isSchoolYearCurrent(year);
  }

  setAsCurrentSchoolYear(): void {
    if (!this.selectedSchoolYearId) return;

    const year = this.schoolYears.find(y => y.id === this.selectedSchoolYearId);
    if (!year) return;

    // Check if the school year can be set as current
    if (!this.canSetAsCurrentSchoolYear(year)) {
      this.showMessage('Cannot set future school year as current. Please wait until the start date arrives.', 'error');
      return;
    }

    // Show confirmation modal instead of simple confirm
    this.yearToSetAsCurrent = year;
    this.showSetCurrentConfirmModal = true;
  }

  confirmSetCurrentSchoolYear(): void {
    if (!this.yearToSetAsCurrent) return;

    this.settingCurrent = true;
    const data = { school_year_id: this.yearToSetAsCurrent.id };

    this.http.post<any>(`${environment.apiUrl}/admin/school-years/set-current`, data).subscribe({
      next: (response) => {
        if (response.success) {
          this.showMessage(`Current school year set to ${this.yearToSetAsCurrent!.year_name}`, 'success');
          this.loadSchoolYears(); // Reload to update is_current flags
          this.closeSetCurrentConfirmModal();
        } else {
          this.showMessage(response.message || 'Error setting current school year', 'error');
        }
        this.settingCurrent = false;
      },
      error: (err) => {
        // Error setting current school year
        this.showMessage('Error setting current school year', 'error');
        this.settingCurrent = false;
      }
    });
  }

  closeSetCurrentConfirmModal(): void {
    this.showSetCurrentConfirmModal = false;
    this.yearToSetAsCurrent = null;
  }

  openCreateYearModal(): void {
    this.showCreateYearModal = true;
    this.resetYearForm();
  }

  closeCreateYearModal(): void {
    this.showCreateYearModal = false;
    this.resetYearForm();
  }

  resetYearForm(): void {
    this.newYear = {
      year_name: '',
      start_date: '',
      end_date: '',
      is_active: false
    };
    this.yearNameError = '';
  }

  validateYearName(): void {
    const pattern = /^\d{4}-\d{4}$/;
    if (this.newYear.year_name && !pattern.test(this.newYear.year_name)) {
      this.yearNameError = 'Year name must be in format YYYY-YYYY (e.g., 2024-2025)';
    } else {
      this.yearNameError = '';
    }
  }

  isYearFormValid(): boolean {
    return !!(
      this.newYear.year_name &&
      this.newYear.start_date &&
      this.newYear.end_date &&
      !this.yearNameError &&
      new Date(this.newYear.start_date) < new Date(this.newYear.end_date)
    );
  }

  createSchoolYear(): void {
    if (!this.isYearFormValid()) return;

    this.saving = true;
    this.http.post<any>(`${environment.apiUrl}/admin/school-years`, this.newYear).subscribe({
      next: (response) => {
        if (response.success) {
          this.showMessage(`School year "${this.newYear.year_name}" created successfully!`, 'success');
          this.loadSchoolYears();
          this.closeCreateYearModal();
          // Auto-select the newly created school year
          setTimeout(() => {
            this.selectedSchoolYearId = response.school_year_id;
            this.loadSections();
          }, 500);
        } else {
          this.showMessage(response.message || 'Error creating school year', 'error');
        }
        this.saving = false;
      },
      error: (err) => {
        // Error creating school year
        this.showMessage(err.error?.message || 'Error creating school year', 'error');
        this.saving = false;
      }
    });
  }

  openCreateSectionModal(): void {
    this.showCreateSectionModal = true;
    this.resetSectionForm();
  }

  closeCreateSectionModal(): void {
    this.showCreateSectionModal = false;
    this.resetSectionForm();
  }

  resetSectionForm(): void {
    this.newSection = {
      section_name: '',
      grade_level_id: null,
      capacity: 50
    };
  }

  isSectionFormValid(): boolean {
    return !!(
      this.newSection.section_name &&
      this.newSection.grade_level_id &&
      this.newSection.capacity > 0
    );
  }

  createSection(): void {
    if (!this.isSectionFormValid() || !this.selectedSchoolYearId) return;

    this.saving = true;
    const data = {
      section_name: this.newSection.section_name,
      grade_level_id: this.newSection.grade_level_id,
      school_year_id: this.selectedSchoolYearId,
      capacity: this.newSection.capacity
    };

    this.http.post<any>(`${environment.apiUrl}/admin/sections`, data).subscribe({
      next: (response) => {
        if (response.success) {
          this.showMessage(`Section "${this.newSection.section_name}" created successfully!`, 'success');
          this.loadSections();
          this.closeCreateSectionModal();
        } else {
          this.showMessage(response.message || 'Error creating section', 'error');
        }
        this.saving = false;
      },
      error: (err) => {
        // Error creating section
        this.showMessage(err.error?.message || 'Error creating section', 'error');
        this.saving = false;
      }
    });
  }

  private showMessage(message: string, type: 'success' | 'error'): void {
    this.message = message;
    this.messageType = type;
    setTimeout(() => {
      this.message = '';
    }, 5000);
  }

  viewSectionStudents(section: Section): void {
    this.selectedSectionForStudents = section;
    this.showStudentsModal = true;
    this.loadSectionStudents(section.id);
  }

  closeStudentsModal(): void {
    this.showStudentsModal = false;
    this.selectedSectionForStudents = null;
    this.sectionStudentsData = null;
  }

  loadSectionStudents(sectionId: number): void {
    this.loadingStudents = true;
    this.http.get<any>(`${environment.apiUrl}/admin/sections/get-students?section_id=${sectionId}`).subscribe({
      next: (response) => {
        if (response.success) {
          this.sectionStudentsData = response.data;
        } else {
          this.showMessage('Error loading students: ' + response.message, 'error');
        }
        this.loadingStudents = false;
      },
      error: (err) => {
        // Error loading section students
        this.showMessage('Error loading students', 'error');
        this.loadingStudents = false;
      }
    });
  }

  getGradeSectionCount(gradeId: number): number {
    return this.sections.filter(s => s.grade_level_id === gradeId).length;
  }

  getGradeStudentCount(gradeId: number): number {
    const gradeSections = this.sections.filter(s => s.grade_level_id === gradeId);
    return gradeSections.reduce((sum, section) => sum + (section.current_enrollment || 0), 0);
  }

  selectGradeLevel(gradeId: number): void {
    this.selectedGradeLevelId = gradeId;
  }

  getFilteredSectionsForGrade(): Section[] {
    if (!this.selectedGradeLevelId) return [];
    return this.sections.filter(s => s.grade_level_id === this.selectedGradeLevelId);
  }

  getAssignedCountForGrade(): number {
    return this.getFilteredSectionsForGrade().filter(s => s.adviser_id).length;
  }

  getUnassignedCountForGrade(): number {
    return this.getFilteredSectionsForGrade().filter(s => !s.adviser_id).length;
  }

  getGradeLevelName(gradeId: number | null): string {
    if (!gradeId) return '';
    const grade = this.gradeLevels.find(g => g.id === gradeId);
    return grade ? grade.level_name : '';
  }
}
