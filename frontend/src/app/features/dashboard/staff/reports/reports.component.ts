import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StaffService } from '../../../../core/services/staff.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

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

      <!-- Error Alert -->
      <div class="error-alert" *ngIf="error">
        <span>⚠️ {{ error }}</span>
      </div>

      <!-- Report Filters -->
      <div class="card filters-card">
        <div class="filter-row">
          <div class="filter-group">
            <label>Date Range</label>
            <div class="date-range">
              <input type="date" [(ngModel)]="startDate" (change)="onFilterChange()" class="filter-input" [disabled]="loading">
              <span>to</span>
              <input type="date" [(ngModel)]="endDate" (change)="onFilterChange()" class="filter-input" [disabled]="loading">
            </div>
          </div>
          <div class="filter-group">
            <label>Grade Level</label>
            <select [(ngModel)]="gradeFilter" (change)="onFilterChange()" class="filter-select" [disabled]="loading">
              <option value="">All Grades</option>
              <option *ngFor="let grade of grades" [value]="grade">Grade {{ grade }}</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div class="loading-state" *ngIf="loading">
        <div class="spinner"></div>
        <p>Loading report data...</p>
      </div>

      <!-- Summary Cards -->
      <div class="summary-cards" *ngIf="!loading">
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
      <div class="charts-section" *ngIf="!loading">
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
      <div class="card" *ngIf="!loading">
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

    .error-alert {
      background: #fee;
      border: 1px solid #fcc;
      border-radius: 8px;
      padding: 1rem;
      margin-bottom: 1.5rem;
      color: #c33;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      background: white;
      border-radius: 12px;
      margin-bottom: 1.5rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);

      p { color: #7f8c8d; margin-top: 1rem; }
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #e9ecef;
      border-top-color: #007bff;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
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
      &:disabled { background: #f5f7fa; cursor: not-allowed; }
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s ease;

      &.btn-primary { background: #007bff; color: white; &:hover:not(:disabled) { background: #0056b3; } }
      &.btn-outline { background: white; color: #007bff; border: 1px solid #007bff; &:hover:not(:disabled) { background: #e3f2fd; } }
      &:disabled { opacity: 0.6; cursor: not-allowed; }
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

  loading = false;
  error: string | null = null;

  get maxIllnessCount(): number {
    return Math.max(...this.casesByIllness.map(i => i.count), 1);
  }

  get maxGradeCount(): number {
    return Math.max(...this.casesByGrade.map(g => g.count), 1);
  }

  constructor(private staffService: StaffService) {}

  ngOnInit(): void {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    
    this.endDate = end.toISOString().split('T')[0];
    this.startDate = start.toISOString().split('T')[0];

    // Auto-load initial report
    this.generateReport();
  }

  onFilterChange(): void {
    // Auto-generate report when filters change
    if (this.startDate && this.endDate) {
      this.generateReport();
    }
  }

  generateReport(): void {
    this.loading = true;
    this.error = null;

    this.staffService.getReportsData(this.startDate, this.endDate, this.gradeFilter).subscribe({
      next: (response) => {
        if (response.success) {
          const data = response.data;
          this.totalVisits = data.totalVisits;
          this.uniqueStudents = data.uniqueStudents;
          this.emergencyCases = data.emergencyCases;
          this.referrals = data.referrals;
          
          // Map illness data
          this.casesByIllness = data.casesByIllness.map((item: any) => ({
            illness: item.illness || 'Unknown',
            count: parseInt(item.count)
          }));

          // Map grade data
          this.casesByGrade = data.casesByGrade.map((item: any) => ({
            grade: parseInt(item.grade),
            count: parseInt(item.count)
          }));

          this.loading = false;
        } else {
          this.error = response.message || 'Failed to load report data';
          this.loading = false;
        }
      },
      error: (err) => {
        console.error('Error loading report data:', err);
        this.error = 'Failed to load report data. Please try again.';
        this.loading = false;
      }
    });
  }

  exportPDF(): void {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(18);
    doc.setTextColor(40, 62, 80);
    doc.text('PDMHS Clinic Report', 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(127, 140, 141);
    doc.text(`Date Range: ${this.startDate} to ${this.endDate}`, 14, 28);
    if (this.gradeFilter) {
      doc.text(`Grade Level: ${this.gradeFilter}`, 14, 34);
    }
    
    // Summary Section
    doc.setFontSize(14);
    doc.setTextColor(40, 62, 80);
    doc.text('Summary', 14, this.gradeFilter ? 44 : 38);
    
    const summaryData = [
      ['Total Visits', this.totalVisits.toString()],
      ['Unique Students', this.uniqueStudents.toString()],
      ['Emergency Cases', this.emergencyCases.toString()],
      ['Hospital Referrals', this.referrals.toString()]
    ];
    
    autoTable(doc, {
      startY: this.gradeFilter ? 48 : 42,
      head: [['Metric', 'Count']],
      body: summaryData,
      theme: 'grid',
      headStyles: { fillColor: [0, 123, 255] }
    });
    
    // Cases by Illness
    const illnessY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.text('Cases by Illness', 14, illnessY);
    
    const illnessData = this.casesByIllness.map(item => [item.illness, item.count.toString()]);
    
    autoTable(doc, {
      startY: illnessY + 4,
      head: [['Illness', 'Count']],
      body: illnessData.length > 0 ? illnessData : [['No data available', '-']],
      theme: 'striped',
      headStyles: { fillColor: [0, 123, 255] }
    });
    
    // Cases by Grade
    const gradeY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.text('Cases by Grade Level', 14, gradeY);
    
    const gradeData = this.casesByGrade.map(item => [`Grade ${item.grade}`, item.count.toString()]);
    
    autoTable(doc, {
      startY: gradeY + 4,
      head: [['Grade Level', 'Count']],
      body: gradeData.length > 0 ? gradeData : [['No data available', '-']],
      theme: 'striped',
      headStyles: { fillColor: [0, 123, 255] }
    });
    
    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    doc.setFontSize(8);
    doc.setTextColor(127, 140, 141);
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.text(
        `Generated on ${new Date().toLocaleDateString()} - Page ${i} of ${pageCount}`,
        14,
        doc.internal.pageSize.height - 10
      );
    }
    
    // Save
    const fileName = `clinic-report-${this.startDate}-to-${this.endDate}.pdf`;
    doc.save(fileName);
  }

  exportExcel(): void {
    // Summary Sheet
    const summaryData = [
      ['PDMHS Clinic Report'],
      ['Date Range:', `${this.startDate} to ${this.endDate}`],
      this.gradeFilter ? ['Grade Level:', this.gradeFilter] : [],
      [],
      ['Summary Metrics'],
      ['Metric', 'Count'],
      ['Total Visits', this.totalVisits],
      ['Unique Students', this.uniqueStudents],
      ['Emergency Cases', this.emergencyCases],
      ['Hospital Referrals', this.referrals],
      [],
      ['Cases by Illness'],
      ['Illness', 'Count'],
      ...this.casesByIllness.map(item => [item.illness, item.count]),
      [],
      ['Cases by Grade Level'],
      ['Grade Level', 'Count'],
      ...this.casesByGrade.map(item => [`Grade ${item.grade}`, item.count])
    ].filter(row => row.length > 0);
    
    const ws = XLSX.utils.aoa_to_sheet(summaryData);
    
    // Set column widths
    ws['!cols'] = [
      { wch: 25 },
      { wch: 15 }
    ];
    
    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Clinic Report');
    
    // Save file
    const fileName = `clinic-report-${this.startDate}-to-${this.endDate}.xlsx`;
    XLSX.writeFile(wb, fileName);
  }
}
