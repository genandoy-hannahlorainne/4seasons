import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdviserService } from '../../../../core/services/adviser.service';
import { AdviserNotificationBellComponent } from '../shared/adviser-notification-bell.component';
import { AdviserNotificationPanelService } from '../../../../core/services/adviser-notification-panel.service';
import { Subscription } from 'rxjs';

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
  imports: [CommonModule, FormsModule, AdviserNotificationBellComponent],
  template: `
    <div class="health-monitoring">
      <div class="dashboard-wrap">
      <div class="hero-section" [class.sidebar-drawer-open]="mobileSidebarOpen">
        <app-adviser-notification-bell *ngIf="!mobileSidebarOpen" variant="hero" />
        <div class="hero-content">
          <div class="hero-text">
            <h1 class="page-title">Class Health Monitoring</h1>
            <p class="page-subtitle">{{ advisoryClass }} • {{ totalStudents }} Students</p>
          </div>
        </div>
      </div>

      <div class="toolbar-row">
        <select [(ngModel)]="selectedDays" (change)="loadHeatmap()" class="days-select">
          <option [value]="7">Last 7 Days</option>
          <option [value]="14">Last 14 Days</option>
          <option [value]="30">Last 30 Days</option>
        </select>
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

        <!-- Heat Map + Donut Row -->
        <div class="heatmap-donut-row">

          <!-- Heat Map Section -->
          <div class="card heatmap-card">
            <div class="card-header">
              <div>
                <h2>Clinic Visit Heat Map</h2>
                <p class="card-subtitle">Daily clinic visits as percentage of class</p>
              </div>
            </div>

            <div class="heatmap-container">
              <!-- Day-of-week headers -->
              <div class="calendar-dow-row">
                <div class="dow-header" *ngFor="let d of ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']">{{ d }}</div>
              </div>

              <!-- Calendar grid: cells are placed by CSS grid-column based on weekday -->
              <div class="heatmap-grid">
                <div
                  *ngFor="let day of visitsByDate"
                  class="heatmap-cell"
                  [ngClass]="getHeatmapClass(day.percentage)"
                  [style.grid-column]="getDayOfWeek(day.date)"
                  [title]="getTooltip(day)"
                  (click)="selectDay(day)">
                  <div class="cell-date">{{ formatDate(day.date) }}</div>
                  <div class="cell-value">{{ day.percentage || 0 }}%</div>
                  <div class="cell-count">{{ day.unique_students || 0 }} students</div>
                </div>
              </div>

              <div class="heatmap-legend">
                <span class="legend-label">Risk Level:</span>
                <div class="legend-item"><div class="legend-color heat-none"></div><span>0%</span></div>
                <div class="legend-item"><div class="legend-color heat-low"></div><span>1-5%</span></div>
                <div class="legend-item"><div class="legend-color heat-medium"></div><span>6-10%</span></div>
                <div class="legend-item"><div class="legend-color heat-high"></div><span>11-15%</span></div>
                <div class="legend-item"><div class="legend-color heat-critical"></div><span>>15%</span></div>
              </div>
            </div>
          </div>

          <!-- Donut Chart -->
          <div class="card donut-card">
            <div class="card-header">
              <div>
                <h2>Visit Reasons</h2>
                <p class="card-subtitle">Breakdown by health concern</p>
              </div>
            </div>

            <div *ngIf="donutSegments.length > 0; else noDonutData" class="donut-body">
              <div class="donut-chart-wrap">
                <svg viewBox="0 0 120 120" class="donut-svg">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="#f1f5f9" stroke-width="18"/>
                  <circle
                    *ngFor="let seg of donutSegments"
                    cx="60" cy="60" r="50"
                    fill="none"
                    [attr.stroke]="seg.color"
                    stroke-width="18"
                    [attr.stroke-dasharray]="seg.dash"
                    [attr.stroke-dashoffset]="seg.offset"
                    stroke-linecap="butt"
                    transform="rotate(-90 60 60)">
                  </circle>
                  <text x="60" y="55" text-anchor="middle" class="donut-center-value">{{ totalVisitsInPeriod }}</text>
                  <text x="60" y="68" text-anchor="middle" class="donut-center-label">visits</text>
                </svg>
              </div>

              <div class="donut-legend">
                <div *ngFor="let seg of donutSegments" class="donut-legend-item">
                  <span class="donut-dot" [style.background]="seg.color"></span>
                  <span class="donut-name">{{ seg.name }}</span>
                  <span class="donut-pct">{{ seg.pct }}%</span>
                </div>
              </div>
            </div>

            <ng-template #noDonutData>
              <div class="empty-state">
                <p>No visit data for this period</p>
              </div>
            </ng-template>
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
      </div><!-- /.content -->
      </div><!-- /.dashboard-wrap -->
    </div>
  `,
  styles: [`
    .health-monitoring {
      padding: 2rem;
      background: #f5f7fa;
      min-height: 100vh;
      box-sizing: border-box;
      width: 100%;
    }

    .dashboard-wrap {
      max-width: 1400px;
      margin: 0 auto;
      width: 100%;
    }

    .hero-section {
      background: linear-gradient(135deg, #052355 0%, #5381b2 100%);
      border-radius: 12px;
      padding: 2rem;
      margin-bottom: 1.5rem;
      color: white;
      width: 100%;
      box-sizing: border-box;
      position: relative;

      .hero-text {
        padding-right: 4.5rem;
      }

      &.sidebar-drawer-open .hero-text {
        padding-right: 0;
      }
    }

    .page-title {
      font-size: 1.8rem;
      font-weight: 700;
      color: #fff;
      margin: 0 0 0.4rem 0;
    }

    .page-subtitle {
      color: rgba(255,255,255,0.85);
      margin: 0;
      font-size: 0.95rem;
      opacity: 0.85;
    }

    @media (max-width: 768px) {
      .hero-section {
        padding: 1.5rem 1.25rem;

        .hero-text { padding-right: 3.75rem; }
        &.sidebar-drawer-open .hero-text { padding-right: 0; }

        .page-title { font-size: 1.4rem; }
        .page-subtitle { font-size: 0.875rem; }
      }
    }

    @media (max-width: 480px) {
      .hero-section {
        padding: 1.25rem 1rem;

        .hero-text { padding-right: 3.25rem; }
        &.sidebar-drawer-open .hero-text { padding-right: 0; }

        .page-title { font-size: 1.2rem; }
      }
    }

    .toolbar-row {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 1.5rem;
    }

    .header-actions {
      display: flex;
      gap: 1rem;
      padding-top: 0.25rem;
    }

    .days-select {
      padding: 0.5rem 1rem;
      border: 1px solid rgba(255,255,255,0.3);
      border-radius: 8px;
      background: rgba(255,255,255,0.15);
      color: white;
      font-size: 0.875rem;
      cursor: pointer;
      outline: none;
      appearance: none;
      -webkit-appearance: none;
      padding-right: 2rem;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='white' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 0.6rem center;

      option { background: #052355; color: white; }

      &:hover { border-color: rgba(255,255,255,0.6); }
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
        border-top-color: #052355;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 1rem;
      }
      
      p { color: #7f8c8d; margin-bottom: 1rem; }
      
      .btn-retry {
        padding: 0.5rem 1.5rem;
        background: linear-gradient(135deg, #052355 0%, #5381b2 100%);
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
      width: 100%;
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
      width: 100%;
      box-sizing: border-box;
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

    /* ── Heatmap + Donut row ── */
    .heatmap-donut-row {
      display: grid;
      grid-template-columns: 1fr 320px;
      gap: 1.5rem;
      align-items: start;
      width: 100%;
    }

    /* ── Donut Card ── */
    .donut-card {
      position: sticky;
      top: 1rem;
    }

    .donut-body {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1.25rem;
    }

    .donut-chart-wrap {
      width: 160px;
      height: 160px;
    }

    .donut-svg {
      width: 100%;
      height: 100%;
    }

    .donut-center-value {
      font-size: 22px;
      font-weight: 800;
      fill: #1e293b;
    }

    .donut-center-label {
      font-size: 10px;
      fill: #94a3b8;
    }

    .donut-legend {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .donut-legend-item {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      font-size: 0.82rem;
    }

    .donut-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .donut-name {
      flex: 1;
      color: #374151;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .donut-pct {
      color: #64748b;
      font-weight: 700;
      font-size: 0.8rem;
    }

    @media (max-width: 1024px) {
      .heatmap-donut-row {
        grid-template-columns: 1fr;
      }
      .donut-card { position: static; }
    }

    .heatmap-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    /* Day-of-week header row */
    .calendar-dow-row {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 0.5rem;
      margin-bottom: 0.4rem;
    }

    .dow-header {
      text-align: center;
      font-size: 0.78rem;
      font-weight: 700;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 0.4rem 0;
    }

    .heatmap-cell {
      background: #f9fafb;
      border: 1.5px solid #e5e7eb;
      border-radius: 10px;
      padding: 0.6rem 0.4rem;
      text-align: center;
      cursor: pointer;
      transition: all 0.2s;
      min-height: 90px;
      display: flex;
      flex-direction: column;
      justify-content: center;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.12);
        z-index: 1;
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
      font-size: 0.72rem;
      font-weight: 600;
      color: #6b7280;
      margin-bottom: 0.3rem;
    }

    .cell-value {
      font-size: 1.35rem;
      font-weight: 800;
      color: #1f2937;
      margin-bottom: 0.15rem;
      line-height: 1;
    }

    .cell-count {
      font-size: 0.68rem;
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
      background: linear-gradient(135deg, #052355 0%, #5381b2 100%);
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
      background: linear-gradient(90deg, #052355, #5381b2);
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
      .toolbar-row { justify-content: flex-start; }
      .heatmap-grid { gap: 0.3rem; }
      .heatmap-cell { min-height: 70px; padding: 0.4rem 0.2rem; }
      .cell-value { font-size: 1rem; }
      .details-stats { grid-template-columns: 1fr; }
      .trending-bar { width: 80px; }
    }
  `]
})
export class HealthMonitoringComponent implements OnInit, OnDestroy {
  loading = true;
  error = '';
  mobileSidebarOpen = false;
  private layoutSub?: Subscription;

  advisoryClass = '';
  totalStudents = 0;
  selectedDays = 30;

  visitsByDate: HeatmapDay[] = [];
  trendingSymptoms: any[] = [];
  alerts: Alert[] = [];
  selectedDay: HeatmapDay | null = null;

  // Donut chart
  donutSegments: { name: string; color: string; pct: number; dash: string; offset: number }[] = [];
  totalVisitsInPeriod = 0;

  private readonly DONUT_COLORS = [
    '#052355', '#5381b2', '#3b82f6', '#22c55e',
    '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'
  ];
  private readonly CIRCUMFERENCE = 2 * Math.PI * 50; // r=50

  constructor(
    private adviserService: AdviserService,
    private notifPanelService: AdviserNotificationPanelService
  ) {}

  ngOnInit(): void {
    this.layoutSub = this.notifPanelService.mobileSidebarOpen$.subscribe(open => {
      this.mobileSidebarOpen = open;
    });
    this.loadHeatmap();
  }

  ngOnDestroy(): void {
    this.layoutSub?.unsubscribe();
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
          this.buildDonut();
        } else {
          this.error = response.message || 'Failed to load health data';
        }
        this.loading = false;
      },
      error: (err) => {
        // Error loading heatmap
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

  getDayOfWeek(dateStr: string): number {
    // Returns 1-7 (Sun=1 … Sat=7) for CSS grid-column
    const date = new Date(dateStr);
    return date.getDay() + 1;
  }

  getSymptomsList(day: HeatmapDay): any[] {
    return Object.entries(day.symptoms).map(([name, data]) => ({
      name,
      count: data.count,
      students: data.students
    }));
  }

  private buildDonut(): void {
    // Aggregate visit counts per symptom across all days
    const totals: { [key: string]: number } = {};
    for (const day of this.visitsByDate) {
      for (const [symptom, data] of Object.entries(day.symptoms)) {
        totals[symptom] = (totals[symptom] || 0) + data.count;
      }
    }

    const total = Object.values(totals).reduce((s, v) => s + v, 0);
    this.totalVisitsInPeriod = total;

    if (total === 0) { this.donutSegments = []; return; }

    // Sort descending, keep top 7, group rest as "Other"
    const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]);
    const top = sorted.slice(0, 7);
    const otherCount = sorted.slice(7).reduce((s, [, v]) => s + v, 0);
    if (otherCount > 0) top.push(['Other', otherCount]);

    let cumulativeOffset = 0;
    this.donutSegments = top.map(([name, count], i) => {
      const pct = Math.round((count / total) * 100);
      const dash = (count / total) * this.CIRCUMFERENCE;
      const gap = this.CIRCUMFERENCE - dash;
      const offset = -cumulativeOffset;
      cumulativeOffset += dash;
      return {
        name,
        color: this.DONUT_COLORS[i % this.DONUT_COLORS.length],
        pct,
        dash: `${dash} ${gap}`,
        offset,
      };
    });
  }
}
