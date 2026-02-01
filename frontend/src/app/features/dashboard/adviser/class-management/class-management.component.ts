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
        </div>

        <div class="roster-table">
          <table>
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Name</th>
                <th>Medical Visits</th>
                <th>Last Visit</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let student of classRoster.students">
                <td>{{ student.student_number }}</td>
                <td>{{ student.first_name }} {{ student.last_name }}</td>
                <td>{{ student.total_medical_visits }}</td>
                <td>{{ student.last_visit_date | date: 'MMM dd, yyyy' }}</td>
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
    </div>
  `,
  styles: [`
    .class-management-container {
      padding: 20px;
      max-width: 1000px;
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
      margin: 0;
      color: #666;
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
  `]
})
export class ClassManagementComponent implements OnInit {
  schoolYears: any[] = [];
  selectedSchoolYear: number | null = null;
  classRoster: ClassRoster | null = null;

  constructor(private adviserService: AdviserService) {}

  ngOnInit() {
    this.loadSchoolYears();
  }

  loadSchoolYears() {
    this.adviserService.getSchoolYears().subscribe(
      (response: any) => {
        this.schoolYears = response.data || [];
      },
      (error) => {
        console.error('Error loading school years:', error);
      }
    );
  }

  loadClassRoster() {
    if (!this.selectedSchoolYear) {
      this.classRoster = null;
      return;
    }

    this.adviserService.getClassRoster(this.selectedSchoolYear).subscribe(
      (response: any) => {
        this.classRoster = response;
      },
      (error) => {
        console.error('Error loading class roster:', error);
        this.classRoster = null;
      }
    );
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
