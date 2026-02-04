import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdviserService } from '../../../../core/services/adviser.service';

interface HeatmapDay {
  date: string;
  total_visits: number;
  unique_students: number;
  percentage: number;
  symptoms: { [key: string]: { count: number; students: string[] } };
}

interface Alert {
  type: string;
  severity: string;
  date?: string;
  message: string;
  recommendation: string;
}

@Component({
  selector: 'app-health-monitoring',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="health-monitoring">
      <div class="page-header">
        <div>
          <h1 class="page-title">Class Health Monitoring</h1>
          <p class="page-subtitle">{{ advisoryClass }} • {{ totalStudents }} Students</p>
        </div>
        <div class="header-actions">
          <select [(ngModel)]="selectedDays" (change)="loadHeatmap()" class="days-select">
            <option [value]="7">Last 7 Days</option>
            <option [value]="14">Last 14 Days</option>
            <option [value]="30">Last 30 Days</option>
          </select>
        </div>
      </div>

      <div *ngIf="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading health data...</p>
      </div>

      <div *ngIf="error" class="error-state">
        <p>{{ error }}</p>
        <button (click)="loadHeatmap()" class="btn-retry">Retry</button>
      </div>

      <div *ngIf="!loading && !error" class="content">
        <!-- Alerts Section -->
        <div *ngIf="alerts.length > 0" class="alerts-section">
          <div *ngFor="let alert of alerts" class="alert-card" [ngClass]="'alert-' + alert.severity">
            <div class="alert-icon">
              <i class="fa-solid fa-triangle-exclamation" *ngIf="alert.severity === 'high'"></i>
              <i class="fa-solid fa-circle-info" *ngIf="alert.severity === 'medium'"></i>
            </div>
            <div class="alert-content">
              <div class="alert-message">{{ alert.message }}</div>
              <div class="alert-recommendation">
                <strong>Recommendation:</strong> {{ alert.recommendation }}
              </div>
            </div>
          </div>
        </div>

        <!-- Heat Map Section -->
        <div class="card heatmap-card">
          <div class="card-header">
            <h2>Clinic Visit Heat Map</h2>
            <p class="card-subtitle">Daily clinic visits as percentage of class</p>
          </div>

          <div class="heatmap-container">
            <div class="heatmap-grid">
              <div 
                *ngFor="let day of visitsByDate" 
                class="heatmap-cell"
                [ngClass]="getHeatmapClass(day.percentage)"
                [title]="getTooltip(day)"
                (click)="selectDay(day)">
                <div class="cell-date">{{ formatDate(day.date) }}</div>
                <div class="cell-value">{{ day.percentage || 0 }}%</div>
                <div class="cell-count">{{ day.unique_students || 0 }} students</div>
              </div>
            </div>

            <div class="heatmap-legend">
              <span class="legend-label">Risk Level:</span>
              <div class="legend-item">
                <div class="legend-color heat-none"></div>
                <span>0%</span>
              </div>
              <div class="legend-item">
                <div class="legend-color heat-low"></div>
                <span>1-5%</span>
              </div>
              <div class="legend-item">
                <div class="legend-color heat-medium"></div>
                <span>6-10%</span>
              </div>
              <div class="legend-item">
                <div class="legend-color heat-high"></div>
                <span>11-15%</span>
              </div>
              <div class="legend-item">
                <div class="legend-color heat-critical"></div>
                <span>>15%</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Trending Symptoms -->
        <div class="card trending-card">
          <div class="card-header">
            <h2>Trending Health Issues</h2>
            <p class="card-subtitle">Most common symptoms in selected period</p>
          </div>

          <div class="trending-list" *ngIf="trendingSymptoms.length > 0">
            <div *ngFor="let symptom of trendingSymptoms; let i = index" class="trending-item">
              <div class="trending-rank">{{ i + 1 }}</div>
              <div class="trending-info">
                <div class="trending-name">{{ symptom.symptom }}</div>
                <div class="trending-stats">
                  {{ symptom.student_count }} students ({{ symptom.percentage }}%) • {{ symptom.visit_count }} visits
                </div>
              </div>
              <div class="trending-bar">
                <div class="bar-fill" [style.width.%]="symptom.percentage"></div>
              </div>
            </div>
          </div>

          <div *ngIf="trendingSymptoms.length === 0" class="empty-state">
            <p>No clinic visits recorded in this period</p>
          </div>
        </div>

        <!-- Selected Day Details -->
        <div *ngIf="selectedDay" class="card details-card">
          <div class="card-header">
            <h2>{{ formatDateFull(selectedDay.date) }} Details</h2>
            <button (click)="selectedDay = null" class="btn-close">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <div class="details-stats">
            <div class="stat-box">
              <div class="stat-value">{{ selectedDay.unique_students }}</div>
              <div class="stat-label">Students Visited</div>
            </div>
            <div class="stat-box">
              <div class="stat-value">{{ selectedDay.percentage }}%</div>
              <div class="stat-label">Of Class</div>
            </div>
            <div class="stat-box">
              <div class="stat-value">{{ selectedDay.total_visits }}</div>
              <div class="stat-label">Total Visits</div>
            </div>
          </div>

          <div class="symptoms-breakdown">
            <h3>Symptoms Breakdown</h3>
            <div class="symptom-list">
              <div *ngFor="let symptom of getSymptomsList(selectedDay)" class="symptom-item">
                <div class="symptom-header">
                  <span class="symptom-name">{{ symptom.name }}</span>
                  <span class="symptom-count">{{ symptom.count }} students</span>
                </div>
                <div class="symptom-students">{{ symptom.students.join(', ') }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .health-monitoring {
      padding: 2rem;
      background: #f5f7fa;
      min-height: 100vh;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 2rem;
      gap: 1rem;
    }

    .page-title {
      font-size: 2rem;
      font-weight: 800;
      color: #0b2a4a;
      margin: 0 0 0.5rem 0;
    }

    .page-subtitle {
      color: #4f7ea9;
      font-weight: 600;
      margin: 0;
    }

    .header-actions {
      display: flex;
      gap: 1rem;
    }

    .days-select {
      padding: 0.5rem 1rem;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      background: white;
      font-size: 0.9rem;
      cursor: pointer;
      outline: none;
      
      &:hover {
        border-color: #007bff;
      }
    }

    .loading-state, .error-state {
      text-align: center;
      padding: 3rem;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      
      .spinner {
        width: 40px;
        height: 40px;
        border: 4px solid #e5e7eb;
        border-top-color: #007bff;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 1rem;
      }
      
      p { color: #7f8c8d; margin-bottom: 1rem; }
      
      .btn-retry {
        padding: 0.5rem 1.5rem;
        background: #007bff;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        
        &:hover { background: #0056b3; }
      }
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .content {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .alerts-section {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .alert-card {
      background: white;
      border-radius: 12px;
      padding: 1.25rem;
      display: flex;
      gap: 1rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      border-left: 4px solid;
      
      &.alert-high {
        border-left-color: #ef4444;
        background: #fef2f2;
      }
      
      &.alert-medium {
        border-left-color: #f59e0b;
        background: #fffbeb;
      }
    }

    .alert-icon {
      font-size: 1.5rem;
      
      .alert-high & { color: #ef4444; }
      .alert-medium & { color: #f59e0b; }
    }

    .alert-content {
      flex: 1;
    }

    .alert-message {
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 0.5rem;
    }

    .alert-recommendation {
      font-size: 0.9rem;
      color: #6b7280;
      
      strong { color: #374151; }
    }

    .card {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      
      h2 {
        font-size: 1.4rem;
        font-weight: 700;
        color: #1f2937;
        margin: 0;
      }
      
      .btn-close {
        width: 32px;
        height: 32px;
        border: none;
        background: #f3f4f6;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        
        &:hover { background: #e5e7eb; }
      }
    }

    .card-subtitle {
      color: #6b7280;
      font-size: 0.9rem;
      margin: 0.25rem 0 0 0;
    }

    .heatmap-container {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .heatmap-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
      gap: 1rem;
    }

    .heatmap-cell {
      background: #f9fafb;
      border: 2px solid #e5e7eb;
      border-radius: 10px;
      padding: 1rem;
      text-align: center;
      cursor: pointer;
      transition: all 0.2s;
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      }
      
      &.heat-none {
        background: #f9fafb;
        border-color: #e5e7eb;
      }
      
      &.heat-low {
        background: #dbeafe;
        border-color: #93c5fd;
      }
      
      &.heat-medium {
        background: #fef3c7;
        border-color: #fcd34d;
      }
      
      &.heat-high {
        background: #fed7aa;
        border-color: #fb923c;
      }
      
      &.heat-critical {
        background: #fecaca;
        border-color: #f87171;
      }
    }

    .cell-date {
      font-size: 0.85rem;
      font-weight: 600;
      color: #6b7280;
      margin-bottom: 0.5rem;
    }

    .cell-value {
      font-size: 1.8rem;
      font-weight: 800;
      color: #1f2937;
      margin-bottom: 0.25rem;
    }

    .cell-count {
      font-size: 0.8rem;
      color: #9ca3af;
    }

    .heatmap-legend {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: #f9fafb;
      border-radius: 8px;
      flex-wrap: wrap;
    }

    .legend-label {
      font-weight: 600;
      color: #374151;
      margin-right: 0.5rem;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.85rem;
      color: #6b7280;
    }

    .legend-color {
      width: 24px;
      height: 24px;
      border-radius: 4px;
      border: 2px solid;
    }

    .heat-none { background: #f9fafb; border-color: #e5e7eb; }
    .heat-low { background: #dbeafe; border-color: #93c5fd; }
    .heat-medium { background: #fef3c7; border-color: #fcd34d; }
    .heat-high { background: #fed7aa; border-color: #fb923c; }
    .heat-critical { background: #fecaca; border-color: #f87171; }

    .trending-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .trending-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: #f9fafb;
      border-radius: 8px;
    }

    .trending-rank {
      width: 32px;
      height: 32px;
      background: #007bff;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      flex-shrink: 0;
    }

    .trending-info {
      flex: 1;
      min-width: 0;
    }

    .trending-name {
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 0.25rem;
    }

    .trending-stats {
      font-size: 0.85rem;
      color: #6b7280;
    }

    .trending-bar {
      width: 120px;
      height: 8px;
      background: #e5e7eb;
      border-radius: 4px;
      overflow: hidden;
      flex-shrink: 0;
    }

    .bar-fill {
      height: 100%;
      background: linear-gradient(90deg, #007bff, #0056b3);
      transition: width 0.3s;
    }

    .empty-state {
      text-align: center;
      padding: 2rem;
      color: #9ca3af;
    }

    .details-stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .stat-box {
      background: #f9fafb;
      border-radius: 8px;
      padding: 1rem;
      text-align: center;
    }

    .stat-value {
      font-size: 2rem;
      font-weight: 800;
      color: #1f2937;
      margin-bottom: 0.25rem;
    }

    .stat-label {
      font-size: 0.85rem;
      color: #6b7280;
    }

    .symptoms-breakdown {
      h3 {
        font-size: 1.1rem;
        font-weight: 600;
        color: #1f2937;
        margin: 0 0 1rem 0;
      }
    }

    .symptom-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .symptom-item {
      padding: 0.75rem;
      background: #f9fafb;
      border-radius: 6px;
    }

    .symptom-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .symptom-name {
      font-weight: 600;
      color: #1f2937;
    }

    .symptom-count {
      font-size: 0.85rem;
      color: #6b7280;
      background: white;
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
    }

    .symptom-students {
      font-size: 0.85rem;
      color: #6b7280;
      line-height: 1.5;
    }

    @media (max-width: 768px) {
      .health-monitoring { padding: 1rem; }
      .page-header { flex-direction: column; }
      .heatmap-grid { grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); }
      .details-stats { grid-template-columns: 1fr; }
      .trending-bar { width: 80px; }
    }
  `]
})
export class HealthMonitoringComponent implements OnInit {
  loading = true;
  error = '';
  
  advisoryClass = '';
  totalStudents = 0;
  selectedDays = 7;
  
  visitsByDate: HeatmapDay[] = [];
  trendingSymptoms: any[] = [];
  alerts: Alert[] = [];
  selectedDay: HeatmapDay | null = null;

  constructor(private adviserService: AdviserService) {}

  ngOnInit(): void {
    this.loadHeatmap();
  }

  loadHeatmap(): void {
    this.loading = true;
    this.error = '';
    this.selectedDay = null;
    
    this.adviserService.getHealthHeatmap(this.selectedDays).subscribe({
      next: (response) => {
        if (response.success) {
          this.advisoryClass = response.data.advisory_class;
          this.totalStudents = response.data.total_students;
          this.visitsByDate = response.data.visits_by_date;
          this.trendingSymptoms = response.data.trending_symptoms;
          this.alerts = response.data.alerts;
        } else {
          this.error = response.message || 'Failed to load health data';
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading heatmap:', err);
        this.error = 'Failed to load health data. Please try again.';
        this.loading = false;
      }
    });
  }

  getHeatmapClass(percentage: number): string {
    if (!percentage || percentage === 0) return 'heat-none';
    if (percentage <= 5) return 'heat-low';
    if (percentage <= 10) return 'heat-medium';
    if (percentage <= 15) return 'heat-high';
    return 'heat-critical';
  }

  getTooltip(day: HeatmapDay): string {
    return `${this.formatDateFull(day.date)}: ${day.unique_students} students (${day.percentage}%)`;
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  formatDateFull(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  }

  selectDay(day: HeatmapDay): void {
    this.selectedDay = day;
  }

  getSymptomsList(day: HeatmapDay): any[] {
    return Object.entries(day.symptoms).map(([name, data]) => ({
      name,
      count: data.count,
      students: data.students
    }));
  }
}
