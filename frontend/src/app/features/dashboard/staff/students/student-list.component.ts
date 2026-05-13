import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { StaffService } from '../../../../core/services/staff.service';

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
  imports: [CommonModule, FormsModule, RouterModule],
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
          <select [(ngModel)]="gradeFilter" (ngModelChange)="filterStudents()" class="filter-select">
            <option value="">All Grades</option>
            <option *ngFor="let grade of grades" [value]="grade">{{ grade }}</option>
          </select>
          <select [(ngModel)]="sectionFilter" (ngModelChange)="filterStudents()" class="filter-select">
            <option value="">All Sections</option>
            <option *ngFor="let section of sections" [value]="section">{{ section }}</option>
          </select>
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
                  <button class="btn btn-primary btn-sm" [routerLink]="['/dashboard/staff/students', student.id]">
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
  `,
  styles: [`
    .student-list-page {
      padding: 2rem;
      background: #f0f4f8;
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
        padding: 0.75rem 1rem;
        border: 1px solid #e9ecef;
        border-radius: 8px;
        font-size: 1rem;
        background: white;
        &:focus { outline: none; border-color: #007bff; }
      }
    }

    .filter-group { display: flex; gap: 0.5rem; }

    .filter-select {
      padding: 0.75rem 1rem;
      border: 1px solid #e9ecef;
      border-radius: 8px;
      font-size: 0.9rem;
      background: white;
      cursor: pointer;
      &:focus { outline: none; border-color: #007bff; }
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
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
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
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.85rem;
      font-weight: 500;
      transition: all 0.2s ease;

      &.btn-primary { background: #007bff; color: white; &:hover { background: #0056b3; } }
      &.btn-success { background: #28a745; color: white; &:hover { background: #1e7e34; } }
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
  loading = true;
  grades = ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'];
  sections: string[] = [];
  allSectionsData: any[] = []; // full list with grade info
  
  students: StaffStudentRecord[] = [];
  filteredStudents: StaffStudentRecord[] = [];

  constructor(private staffService: StaffService) {}

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
              gradeSection: `Grade ${s.grade_level} - ${s.section}`,
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
