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
  is_current: number;
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
  employee_number: string;
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
  template: `
    <div class="school-year-management">
      <div class="page-header">
        <h1>School Year & Section Management</h1>
        <p>Manage school years and assign advisers to sections</p>
      </div>

      <!-- School Year Selector -->
      <div class="school-year-selector">
        <div class="selector-header">
          <div class="selector-left">
            <label>Select School Year:</label>
            <select [(ngModel)]="selectedSchoolYearId" (change)="onSchoolYearChange()" class="form-select">
              <option [value]="null">-- Select School Year --</option>
              <option *ngFor="let year of schoolYears" [value]="year.id">
                {{ year.year_name }} {{ year.is_current ? '(Current)' : '' }}
              </option>
            </select>
            <button class="btn-create-year" (click)="openCreateYearModal()">
              <i class="fa-solid fa-plus"></i>
              Create New School Year
            </button>
          </div>
          <div class="selector-right" *ngIf="selectedSchoolYearId">
            <button 
              *ngIf="!isCurrentSchoolYear()" 
              class="btn-set-current" 
              (click)="setAsCurrentSchoolYear()"
              [disabled]="settingCurrent">
              <i class="fa-solid fa-check-circle"></i>
              {{ settingCurrent ? 'Setting...' : 'Set as Current School Year' }}
            </button>
            <span *ngIf="isCurrentSchoolYear()" class="current-badge">
              <i class="fa-solid fa-star"></i> Current School Year
            </span>
          </div>
        </div>
        <div class="current-year-info" *ngIf="getCurrentSchoolYear()">
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

      <!-- Sections Table -->
      <div *ngIf="!loading && selectedSchoolYearId" class="sections-container">
        <div class="sections-header">
          <h2>Sections for {{ getSelectedSchoolYearName() }}</h2>
          <div class="header-actions">
            <button class="btn-create-section" (click)="openCreateSectionModal()">
              <i class="fa-solid fa-plus"></i>
              Create Section
            </button>
            <div class="stats">
              <span class="stat">
                <strong>{{ sections.length }}</strong> Sections
              </span>
              <span class="stat">
                <strong>{{ getAssignedCount() }}</strong> Assigned
              </span>
              <span class="stat">
                <strong>{{ getUnassignedCount() }}</strong> Unassigned
              </span>
            </div>
          </div>
        </div>

        <div class="sections-table">
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
              <tr *ngFor="let section of sections" [class.unassigned]="!section.adviser_id">
                <td>{{ section.level_name }}</td>
                <td>{{ section.section_name }}</td>
                <td>{{ section.capacity }}</td>
                <td>
                  <span class="enrollment-badge" [class.full]="section.current_enrollment >= section.capacity">
                    {{ section.current_enrollment }} / {{ section.capacity }}
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
                  <button class="btn-assign" (click)="openAssignModal(section)">
                    {{ section.adviser_id ? 'Change' : 'Assign' }} Adviser
                  </button>
                  <button *ngIf="section.adviser_id" class="btn-remove" (click)="removeAdviser(section)">
                    Remove
                  </button>
                  <button class="btn-view-students" (click)="viewSectionStudents(section)">
                    View Students
                  </button>
                </td>
              </tr>
            </tbody>
          </table>

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

            <div class="form-group">
              <label>Select Adviser:</label>
              <select [(ngModel)]="selectedAdviserId" class="form-select">
                <option [value]="null">-- Select Adviser --</option>
                <option *ngFor="let adviser of advisers" [value]="adviser.user_id">
                  {{ adviser.full_name }} ({{ adviser.employee_number }})
                </option>
              </select>
            </div>

            <div class="adviser-list">
              <h4>Available Advisers:</h4>
              <div *ngFor="let adviser of advisers" class="adviser-item" 
                   [class.selected]="selectedAdviserId === adviser.user_id"
                   (click)="selectedAdviserId = adviser.user_id">
                <div class="adviser-info">
                  <div class="adviser-name">{{ adviser.full_name }}</div>
                  <div class="adviser-details">
                    {{ adviser.employee_number }} | {{ adviser.email }}
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
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" (click)="closeAssignModal()">Cancel</button>
            <button class="btn-save" (click)="assignAdviser()" [disabled]="!selectedAdviserId || saving">
              {{ saving ? 'Assigning...' : 'Assign Adviser' }}
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
        background: #2ecc71;
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

        &:hover {
          background: #27ae60;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(46, 204, 113, 0.3);
        }

        i {
          font-size: 1rem;
        }
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
        background: #28a745;
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

        &:hover:not(:disabled) {
          background: #218838;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
        }

        &:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        i {
          font-size: 1.1rem;
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
        background: #e3f2fd;
        border-left: 4px solid #2196f3;
        padding: 1rem;
        border-radius: 6px;
        display: flex;
        gap: 1rem;
        align-items: flex-start;

        i {
          color: #2196f3;
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
        border: 4px solid #f3f3f3;
        border-top: 4px solid #3498db;
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
      overflow: hidden;
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
        background: #3498db;
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

        &:hover {
          background: #2980b9;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
        }

        i {
          font-size: 1rem;
        }
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
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 500;
        transition: all 0.2s ease;
        margin-right: 0.5rem;
        font-size: 0.85rem;
      }

      .btn-assign {
        background: #3498db;
        color: white;

        &:hover {
          background: #2980b9;
        }
      }

      .btn-remove {
        background: #e74c3c;
        color: white;

        &:hover {
          background: #c0392b;
        }
      }

      .btn-view-students {
        background: #2ecc71;
        color: white;

        &:hover {
          background: #27ae60;
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
        background: #e3f2fd;
        border-left: 4px solid #2196f3;
        padding: 1rem;
        border-radius: 6px;
        display: flex;
        gap: 1rem;
        align-items: flex-start;
        margin-top: 1rem;

        i {
          color: #2196f3;
          font-size: 1.2rem;
          margin-top: 2px;
        }

        div {
          flex: 1;
          color: #1565c0;
          font-size: 0.95rem;
          line-height: 1.5;

          strong {
            color: #0d47a1;
          }
        }
      }

      .adviser-list {
        h4 {
          font-size: 1.1rem;
          color: #2c3e50;
          margin-bottom: 1rem;
          font-weight: 600;
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
        background: #3498db;
        color: white;

        &:hover:not(:disabled) {
          background: #2980b9;
        }
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
  
  showAssignModal = false;
  showCreateYearModal = false;
  showCreateSectionModal = false;
  showStudentsModal = false;
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
  }

  loadSchoolYears(): void {
    this.http.get<any>(`${environment.apiUrl}/admin/school-years`).subscribe({
      next: (response) => {
        if (response.success) {
          this.schoolYears = response.data;
          // Auto-select current school year
          const current = this.schoolYears.find(y => y.is_current === 1);
          if (current) {
            this.selectedSchoolYearId = current.id;
            this.loadSections();
          }
        }
      },
      error: (err) => {
        console.error('Error loading school years:', err);
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
        console.error('Error loading sections:', err);
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
        console.error('Error loading advisers:', err);
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
        console.error('Error loading grade levels:', err);
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
    this.showAssignModal = true;
  }

  closeAssignModal(): void {
    this.showAssignModal = false;
    this.selectedSection = null;
    this.selectedAdviserId = null;
  }

  assignAdviser(): void {
    if (!this.selectedSection || !this.selectedAdviserId) return;

    this.saving = true;
    const data = {
      section_id: this.selectedSection.id,
      adviser_user_id: this.selectedAdviserId
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
        console.error('Error assigning adviser:', err);
        this.showMessage('Error assigning adviser', 'error');
        this.saving = false;
      }
    });
  }

  removeAdviser(section: Section): void {
    if (!confirm(`Remove adviser from ${section.level_name} - ${section.section_name}?`)) return;

    const data = {
      section_id: section.id,
      adviser_user_id: null
    };

    this.http.post<any>(`${environment.apiUrl}/admin/sections/assign-adviser`, data).subscribe({
      next: (response) => {
        if (response.success) {
          this.showMessage('Adviser removed successfully', 'success');
          this.loadSections();
        } else {
          this.showMessage(response.message || 'Error removing adviser', 'error');
        }
      },
      error: (err) => {
        console.error('Error removing adviser:', err);
        this.showMessage('Error removing adviser', 'error');
      }
    });
  }

  getAdviserSections(userId: number): Section[] {
    return this.sections.filter(s => s.adviser_id === userId);
  }

  getCurrentSchoolYear(): SchoolYear | undefined {
    return this.schoolYears.find(y => y.is_current === 1);
  }

  isCurrentSchoolYear(): boolean {
    if (!this.selectedSchoolYearId) return false;
    const year = this.schoolYears.find(y => y.id === this.selectedSchoolYearId);
    return year?.is_current === 1;
  }

  setAsCurrentSchoolYear(): void {
    if (!this.selectedSchoolYearId) return;

    const year = this.schoolYears.find(y => y.id === this.selectedSchoolYearId);
    if (!year) return;

    if (!confirm(`Set "${year.year_name}" as the current school year?\n\nAll new accounts will be assigned to this school year.`)) {
      return;
    }

    this.settingCurrent = true;
    const data = { school_year_id: this.selectedSchoolYearId };

    this.http.post<any>(`${environment.apiUrl}/admin/school-years/set-current`, data).subscribe({
      next: (response) => {
        if (response.success) {
          this.showMessage(`Current school year set to ${year.year_name}`, 'success');
          this.loadSchoolYears(); // Reload to update is_current flags
        } else {
          this.showMessage(response.message || 'Error setting current school year', 'error');
        }
        this.settingCurrent = false;
      },
      error: (err) => {
        console.error('Error setting current school year:', err);
        this.showMessage('Error setting current school year', 'error');
        this.settingCurrent = false;
      }
    });
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
        console.error('Error creating school year:', err);
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
        console.error('Error creating section:', err);
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
        console.error('Error loading section students:', err);
        this.showMessage('Error loading students', 'error');
        this.loadingStudents = false;
      }
    });
  }
}
