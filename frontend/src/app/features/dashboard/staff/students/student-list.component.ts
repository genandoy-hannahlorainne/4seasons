import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { StaffService } from '../../../../core/services/staff.service';
import { StudentMedicalProfileComponent } from './student-medical-profile.component';

interface StaffStudentRecord {
  id: number;
  studentNumber: string;
  name: string;
  gradeSection: string;
  gender: string;
  lastVisit: string | null;
  hasAllergies: boolean;
  avatar: string;
}

@Component({
  selector: 'app-student-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, StudentMedicalProfileComponent],
  template: `
    <div class="student-list-page">
      <div class="page-header">
        <h1>Student Records</h1>
        <p>Search and manage student medical records</p>
      </div>

      <!-- Search & Filters -->
      <div class="filters-section">
        <div class="search-box">
          <input 
            type="text" 
            [(ngModel)]="searchTerm" 
            (ngModelChange)="filterStudents()"
            placeholder="Search by name or student number..."
            class="search-input">
        </div>
        <div class="filter-group">
          <!-- Grade dropdown -->
          <div class="custom-dropdown" [class.open]="gradeDropdownOpen">
            <button type="button" class="dropdown-trigger" (click)="toggleGradeDropdown($event)">
              <span class="dropdown-label">{{ gradeFilter || 'All Grades' }}</span>
              <i class="bi bi-chevron-down dropdown-chevron"></i>
            </button>
            <div class="dropdown-panel" *ngIf="gradeDropdownOpen">
              <button type="button" class="dropdown-option" [class.active]="gradeFilter === ''" (click)="setGrade('')">
                All Grades
              </button>
              <button type="button" class="dropdown-option" *ngFor="let grade of grades"
                [class.active]="gradeFilter === grade" (click)="setGrade(grade)">
                {{ grade }}
              </button>
            </div>
          </div>

          <!-- Section dropdown -->
          <div class="custom-dropdown" [class.open]="sectionDropdownOpen">
            <button type="button" class="dropdown-trigger" (click)="toggleSectionDropdown($event)">
              <span class="dropdown-label">{{ sectionFilter || 'All Sections' }}</span>
              <i class="bi bi-chevron-down dropdown-chevron"></i>
            </button>
            <div class="dropdown-panel" *ngIf="sectionDropdownOpen">
              <button type="button" class="dropdown-option" [class.active]="sectionFilter === ''" (click)="setSection('')">
                All Sections
              </button>
              <button type="button" class="dropdown-option" *ngFor="let section of sections"
                [class.active]="sectionFilter === section" (click)="setSection(section)">
                {{ section }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div class="loading-state" *ngIf="loading">
        <p>Loading students...</p>
      </div>

      <!-- Results Count -->
      <div class="results-info" *ngIf="!loading">
        <span>Showing {{ filteredStudents.length || 0 }} students</span>
      </div>

      <!-- Students Table -->
      <div class="card" *ngIf="!loading">
        <table class="students-table" *ngIf="filteredStudents && filteredStudents.length > 0">
          <thead>
            <tr>
              <th>Student</th>
              <th>Student Number</th>
              <th>Grade & Section</th>
              <th>Last Visit</th>
              <th>Allergies</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let student of filteredStudents">
              <td>
                <div class="student-cell">
                  <div class="student-avatar-initials">{{ getInitials(student.name) }}</div>
                  <span class="student-name">{{ student.name }}</span>
                </div>
              </td>
              <td>{{ student.studentNumber }}</td>
              <td>{{ student.gradeSection }}</td>
              <td>{{ student.lastVisit || 'No visits' }}</td>
              <td>
                <span class="badge" [class.has-allergy]="student.hasAllergies" [class.no-allergy]="!student.hasAllergies">
                  {{ student.hasAllergies ? 'Yes' : 'None' }}
                </span>
              </td>
              <td>
                <div class="action-buttons">
                  <button class="btn btn-primary btn-sm" (click)="openProfile(student.id)">
                    View Profile
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Empty State -->
        <div class="empty-state" *ngIf="!filteredStudents || filteredStudents.length === 0">
          <div class="empty-title">No Students Found</div>
          <div class="empty-text">Try adjusting your search or filter criteria</div>
        </div>
      </div>
    </div>

    <!-- Student Profile Modal -->
    <app-student-medical-profile
      *ngIf="selectedStudentId !== null"
      [modalStudentId]="selectedStudentId"
      (closeModal)="closeProfile()">
    </app-student-medical-profile>
  `,
  styles: [`
    .student-list-page {
      padding: 2rem;
      background: radial-gradient(1200px 600px at 15% 0%, rgba(37, 99, 235, 0.10), transparent 55%), #f6f7fb;
      min-height: 100vh;
    }

    .page-header {
      margin-bottom: 2rem;
      background: linear-gradient(135deg, #052355 0%, #5381b2 100%);
      padding: 2rem 1.5rem;
      border-radius: 12px;
      box-shadow: 0 4px 16px rgba(5, 35, 85, 0.25);
      
      h1 {
        font-size: 2rem;
        color: #ffffff;
        margin-bottom: 0.5rem;
        font-weight: 700;
      }

      p {
        color: rgba(255, 255, 255, 0.8);
        font-size: 1.1rem;
        margin: 0;
      }
    }

    .filters-section {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
      flex-wrap: wrap;
    }

    .search-box {
      flex: 1;
      min-width: 300px;

      .search-input {
        width: 100%;
        padding: 0.85rem 1rem;
        border: 1.5px solid #e2e8f0;
        border-radius: 12px;
        font-size: 0.95rem;
        background: white;
        box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
        transition: all 0.2s ease;
        &:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.12);
        }
      }
    }

    .filter-group { display: flex; gap: 0.5rem; align-items: center; }

    /* ── Custom Dropdown ── */
    .custom-dropdown {
      position: relative;
    }

    .dropdown-trigger {
      display: inline-flex;
      align-items: center;
      gap: 0.6rem;
      padding: 0.85rem 1.1rem;
      background: white;
      border: 1.5px solid #e2e8f0;
      border-radius: 12px;
      font-size: 0.9rem;
      font-weight: 600;
      color: #0f172a;
      cursor: pointer;
      white-space: nowrap;
      box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);
      transition: border-color 0.2s, box-shadow 0.2s;
      min-width: 140px;
      justify-content: space-between;

      &:hover {
        border-color: #93c5fd;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.08);
      }
    }

    .custom-dropdown.open .dropdown-trigger {
      border-color: #3b82f6;
      box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.12);
    }

    .dropdown-label {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      i { font-size: 0.85rem; color: #5381b2; }
    }

    .dropdown-chevron {
      font-size: 0.75rem;
      color: #94a3b8;
      transition: transform 0.2s ease;
    }

    .custom-dropdown.open .dropdown-chevron {
      transform: rotate(180deg);
    }

    .dropdown-panel {
      position: absolute;
      top: calc(100% + 6px);
      left: 0;
      min-width: 100%;
      background: white;
      border: 1.5px solid #e2e8f0;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(15, 23, 42, 0.12);
      z-index: 200;
      overflow: hidden;
      animation: dropdownIn 0.15s ease;
      max-height: 260px;
      overflow-y: auto;
      scrollbar-width: thin;
      scrollbar-color: rgba(5, 35, 85, 0.2) transparent;

      &::-webkit-scrollbar { width: 4px; }
      &::-webkit-scrollbar-track { background: transparent; }
      &::-webkit-scrollbar-thumb { background: rgba(5, 35, 85, 0.2); border-radius: 99px; }
    }

    @keyframes dropdownIn {
      from { opacity: 0; transform: translateY(-6px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .dropdown-option {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      width: 100%;
      padding: 0.7rem 1rem;
      background: none;
      border: none;
      font-size: 0.9rem;
      font-weight: 500;
      color: #334155;
      cursor: pointer;
      text-align: left;
      transition: background 0.15s;

      i { font-size: 0.82rem; color: #5381b2; }

      &:hover {
        background: #f1f5f9;
        color: #052355;
      }

      &.active {
        background: #1d4ed8;
        color: white;
        font-weight: 700;
        i { color: rgba(255,255,255,0.85); }
      }
    }

    .loading-state {
      text-align: center;
      padding: 3rem;
      background: white;
      border-radius: 12px;
      color: #7f8c8d;
    }

    .results-info {
      margin-bottom: 1rem;
      color: #7f8c8d;
      font-size: 0.9rem;
    }

    .card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
      overflow: hidden;
    }

    .students-table {
      width: 100%;
      border-collapse: collapse;

      th, td { padding: 1rem; text-align: left; border-bottom: 1px solid #e9ecef; }
      th { background: #f8f9fa; font-weight: 600; color: #052355; font-size: 0.9rem; }
      tbody tr:hover { background: #f8f9fa; }
    }

      .student-cell {
      display: flex;
      align-items: center;
      gap: 0.75rem;

      .student-avatar-initials {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: linear-gradient(135deg, #052355, #5381b2);
        color: white;
        font-size: 0.75rem;
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        letter-spacing: 0.5px;
      }
      .student-name { font-weight: 500; color: #2c3e50; }
    }

    .badge {
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 500;

      &.has-allergy { background: #fff3cd; color: #856404; }
      &.no-allergy { background: #d4edda; color: #155724; }
    }

    .action-buttons {
      display: flex;
      gap: 0.5rem;
    }

    .btn {
      padding: 0.55rem 1rem;
      border: 1px solid transparent;
      border-radius: 12px;
      cursor: pointer;
      font-size: 0.85rem;
      font-weight: 700;
      transition: all 0.2s ease;

      &.btn-primary { background: linear-gradient(135deg, #052355 0%, #5381b2 100%); color: white; box-shadow: 0 6px 16px rgba(5, 35, 85, 0.18); &:hover { transform: translateY(-1px); } }
      &.btn-success { background: #16a34a; color: white; &:hover { background: #15803d; } }
      &.btn-outline { background: #fff; color: #052355; border-color: #cbd5e1; &:hover { background: #eff6ff; border-color: #bfdbfe; } }
      &.btn-sm { padding: 0.4rem 0.75rem; font-size: 0.8rem; }
    }

    .empty-state {
      text-align: center;
      padding: 4rem 2rem;

      .empty-title { font-size: 1.3rem; font-weight: 600; color: #2c3e50; margin-bottom: 0.5rem; }
      .empty-text { color: #7f8c8d; }
    }
  `]
})
export class StudentListComponent implements OnInit {
  searchTerm = '';
  gradeFilter = '';
  sectionFilter = '';
  gradeDropdownOpen = false;
  sectionDropdownOpen = false;
  loading = true;
  grades = ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];
  sections: string[] = [];
  allSectionsData: any[] = []; // full list with grade info
  
  students: StaffStudentRecord[] = [];
  filteredStudents: StaffStudentRecord[] = [];

  /** ID of the student whose profile modal is open; null = closed */
  selectedStudentId: number | null = null;

  constructor(private staffService: StaffService) {}

  @HostListener('document:click')
  onDocumentClick(): void {
    this.gradeDropdownOpen = false;
    this.sectionDropdownOpen = false;
  }

  toggleGradeDropdown(e: Event): void {
    e.stopPropagation();
    this.sectionDropdownOpen = false;
    this.gradeDropdownOpen = !this.gradeDropdownOpen;
  }

  toggleSectionDropdown(e: Event): void {
    e.stopPropagation();
    this.gradeDropdownOpen = false;
    this.sectionDropdownOpen = !this.sectionDropdownOpen;
  }

  setGrade(value: string): void {
    this.gradeFilter = value;
    this.gradeDropdownOpen = false;
    this.filterStudents();
  }

  setSection(value: string): void {
    this.sectionFilter = value;
    this.sectionDropdownOpen = false;
    this.filterStudents();
  }

  openProfile(studentId: number): void {
    this.selectedStudentId = studentId;
  }

  closeProfile(): void {
    this.selectedStudentId = null;
  }

  ngOnInit(): void {
    this.loadStudents();
    this.loadSections();
  }

  loadStudents(): void {
    this.loading = true;
    
    const filters: any = {};
    if (this.gradeFilter) filters.grade = this.gradeFilter;
    if (this.sectionFilter) filters.section = this.sectionFilter;
    if (this.searchTerm) filters.search = this.searchTerm;
    
    this.staffService.getAllStudents(filters)
      .subscribe({
        next: (response) => {
          this.loading = false;
          if (response.success) {
            // Handle both paginated and flat array responses
            const raw = response.data?.data || response.data?.students || response.data || [];
            this.students = (Array.isArray(raw) ? raw : []).map((s: any) => ({
              id: s.student_id,
              studentNumber: s.student_number,
              name: `${s.first_name} ${s.last_name}`,
              gradeSection: `${s.grade_level} - ${s.section}`,
              gender: s.gender,
              lastVisit: s.last_visit || null,
              hasAllergies: !!(s.allergies && s.allergies.length > 0),
              avatar: ''
            }));
            this.filteredStudents = this.students;
          } else {
            this.students = [];
            this.filteredStudents = [];
          }
        },
        error: (err) => {
          // Error loading students
          this.loading = false;
          this.students = [];
          this.filteredStudents = [];
        }
      });
  }

  loadSections(): void {
    this.staffService.getSections().subscribe({
      next: (response) => {
        if (response.success) {
          this.allSectionsData = response.data || [];
          this.updateSectionsDropdown();
        }
      },
      error: () => { this.allSectionsData = []; }
    });
  }

  updateSectionsDropdown(): void {
    const filtered = this.gradeFilter
      ? this.allSectionsData.filter((s: any) => s.level_name === this.gradeFilter)
      : this.allSectionsData;
    this.sections = filtered.map((s: any) => s.section_name);
    if (this.sectionFilter && !this.sections.includes(this.sectionFilter)) {
      this.sectionFilter = '';
    }
  }

  getInitials(name: string): string {
    if (!name) return '?';
    return name.split(' ').filter(n => n).map(n => n[0]).join('').toUpperCase().substring(0, 2);
  }

  filterStudents(): void {
    this.updateSectionsDropdown();
    this.loadStudents();
  }
}
