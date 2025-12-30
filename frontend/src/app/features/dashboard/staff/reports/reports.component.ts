import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="reports-page">
      <div class="page-header">
        <h1>Reports & Analytics</h1>
        <p>Generate and export clinic reports</p>
      </div>

      <!-- Report Filters -->
      <div class="card filters-card">
        <div class="filter-row">
          <div class="filter-group">
            <label>Date Range</label>
            <div class="date-range">
              <input type="date" [(ngModel)]="startDate" class="filter-input">
              <span>to</span>
              <input type="date" [(ngModel)]="endDate" class="filter-input">
            </div>
          </div>
          <div class="filter-group">
            <label>Grade Level</label>
            <select [(ngModel)]="gradeFilter" class="filter-select">
              <option value="">All Grades</option>
              <option *ngFor="let grade of grades" [value]="grade">Grade {{ grade }}</option>
            </select>
          </div>
          <button class="btn btn-primary" (click)="generateReport()">Generate Report</button>
        </div>
      </div>

      <!-- Summary Cards -->
      <div class="summary-cards">
        <div class="summary-card">
          <div class="card-value">{{ totalVisits }}</div>
          <div class="card-label">Total Visits</div>
        </div>
        <div class="summary-card">
          <div class="card-value">{{ uniqueStudents }}</div>
          <div class="card-label">Unique Students</div>
        </div>
        <div class="summary-card">
          <div class="card-value">{{ emergencyCases }}</div>
          <div class="card-label">Emergency Cases</div>
        </div>
        <div class="summary-card">
          <div class="card-value">{{ referrals }}</div>
          <div class="card-label">Hospital Referrals</div>
        </div>
      </div>

      <!-- Charts Section -->
      <div class="charts-section">
        <div class="card">
          <h2>Cases by Illness</h2>
          <div class="empty-state" *ngIf="casesByIllness.length === 0">
            <p>No data available</p>
          </div>
          <div class="bar-chart" *ngIf="casesByIllness.length > 0">
            <div *ngFor="let item of casesByIllness" class="bar-item">
              <span class="bar-label">{{ item.illness }}</span>
              <div class="bar-container">
                <div class="bar" [style.width.%]="(item.count / maxIllnessCount) * 100"></div>
                <span class="bar-value">{{ item.count }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="card">
          <h2>Cases by Grade Level</h2>
          <div class="empty-state" *ngIf="casesByGrade.length === 0">
            <p>No data available</p>
          </div>
          <div class="bar-chart" *ngIf="casesByGrade.length > 0">
            <div *ngFor="let item of casesByGrade" class="bar-item">
              <span class="bar-label">Grade {{ item.grade }}</span>
              <div class="bar-container">
                <div class="bar bar-green" [style.width.%]="(item.count / maxGradeCount) * 100"></div>
                <span class="bar-value">{{ item.count }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Export Section -->
      <div class="card">
        <h2>Export Report</h2>
        <div class="export-buttons">
          <button class="btn btn-outline" (click)="exportPDF()">Export as PDF</button>
          <button class="btn btn-outline" (click)="exportExcel()">Export as Excel</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .reports-page {
      padding: 2rem;
      background: #f5f7fa;
      min-height: 100vh;
    }

    .page-header {
      margin-bottom: 1.5rem;
      h1 { font-size: 1.8rem; color: #2c3e50; margin-bottom: 0.5rem; font-weight: 600; }
      p { color: #7f8c8d; font-size: 1rem; margin: 0; }
    }

    .card {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);

      h2 { font-size: 1.2rem; color: #2c3e50; margin: 0 0 1rem; }
    }

    .filters-card {
      .filter-row {
        display: flex;
        gap: 1.5rem;
        align-items: flex-end;
        flex-wrap: wrap;
      }
    }

    .filter-group {
      label { display: block; margin-bottom: 0.5rem; font-weight: 500; color: #2c3e50; }
    }

    .date-range {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      span { color: #7f8c8d; }
    }

    .filter-input, .filter-select {
      padding: 0.75rem 1rem;
      border: 1px solid #e9ecef;
      border-radius: 8px;
      font-size: 0.9rem;
      &:focus { outline: none; border-color: #007bff; }
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s ease;

      &.btn-primary { background: #007bff; color: white; &:hover { background: #0056b3; } }
      &.btn-outline { background: white; color: #007bff; border: 1px solid #007bff; &:hover { background: #e3f2fd; } }
    }

    .summary-cards {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .summary-card {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      text-align: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);

      .card-value { font-size: 2.5rem; font-weight: 700; color: #007bff; }
      .card-label { color: #7f8c8d; font-size: 0.9rem; margin-top: 0.5rem; }
    }

    .charts-section {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .empty-state {
      text-align: center;
      padding: 3rem;
      color: #7f8c8d;
    }

    .bar-chart {
      .bar-item {
        display: flex;
        align-items: center;
        margin-bottom: 0.75rem;
      }

      .bar-label { width: 120px; font-size: 0.9rem; color: #2c3e50; }

      .bar-container {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .bar {
        height: 24px;
        background: linear-gradient(90deg, #007bff, #00bcd4);
        border-radius: 4px;
        min-width: 4px;

        &.bar-green { background: linear-gradient(90deg, #27ae60, #2ecc71); }
      }

      .bar-value { font-size: 0.85rem; color: #7f8c8d; font-weight: 500; }
    }

    .export-buttons { display: flex; gap: 1rem; }

    @media (max-width: 1024px) {
      .summary-cards { grid-template-columns: repeat(2, 1fr); }
      .charts-section { grid-template-columns: 1fr; }
    }
  `]
})
export class ReportsComponent implements OnInit {
  startDate = '';
  endDate = '';
  gradeFilter = '';
  grades = [7, 8, 9, 10, 11, 12];

  totalVisits = 0;
  uniqueStudents = 0;
  emergencyCases = 0;
  referrals = 0;

  casesByIllness: { illness: string; count: number }[] = [];
  casesByGrade: { grade: number; count: number }[] = [];

  get maxIllnessCount(): number {
    return Math.max(...this.casesByIllness.map(i => i.count), 1);
  }

  get maxGradeCount(): number {
    return Math.max(...this.casesByGrade.map(g => g.count), 1);
  }

  ngOnInit(): void {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    
    this.endDate = end.toISOString().split('T')[0];
    this.startDate = start.toISOString().split('T')[0];
  }

  generateReport(): void {
    console.log('Generating report:', { startDate: this.startDate, endDate: this.endDate, grade: this.gradeFilter });
  }

  exportPDF(): void {
    alert('PDF export feature coming soon');
  }

  exportExcel(): void {
    alert('Excel export feature coming soon');
  }
}
