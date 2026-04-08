import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../../core/services/admin.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-health-risk-visualization',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="health-risk-visualization">
      <div class="visualization-header">
        <h2><i class="fas fa-chart-bar"></i> Health Risk Visualization</h2>
        <p>BMI distribution analysis across grade levels</p>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading health data...</p>
      </div>

      <!-- Error State -->
      <div *ngIf="error" class="error-state">
        <i class="fas fa-exclamation-triangle"></i>
        <p>{{ error }}</p>
        <button class="retry-btn" (click)="loadHealthData()">Retry</button>
      </div>

      <!-- Main Content -->
      <div *ngIf="!loading && !error && healthData" class="visualization-content">
        
        <!-- Key Insights -->
        <div class="insights-section">
          <h3>Key Health Insights</h3>
          <div class="insights-grid">
            <div class="insight-card highest-risk" *ngIf="topRisk">
              <div class="insight-icon">
                <img src="assets/icons/warning.png" alt="Warning" class="insight-icon-img">
              </div>
              <div class="insight-content">
                <div class="insight-title">Highest Risk Grade</div>
                <div class="insight-value">{{ topRisk.grade_name }}</div>
                <div class="insight-detail">{{ topRisk.risk_percentage }}% {{ topRisk.highest_risk }}</div>
                <div class="insight-students">{{ topRisk.total_students }} students</div>
              </div>
            </div>

            <div class="insight-card highest-risk no-data-card" *ngIf="!topRisk">
              <div class="insight-icon">
                <img src="assets/icons/warning.png" alt="No Data" class="insight-icon-img">
              </div>
              <div class="insight-content">
                <div class="insight-title">Highest Risk Grade</div>
                <div class="insight-value">No Data</div>
                <div class="insight-detail">0% normal</div>
                <div class="insight-students">0 students</div>
              </div>
            </div>
            
            <div class="insight-card total-students">
              <div class="insight-icon">
                <img src="assets/icons/total-users.png" alt="Total Students" class="insight-icon-img">
              </div>
              <div class="insight-content">
                <div class="insight-title">Total Students Analyzed</div>
                <div class="insight-value">{{ healthData.overall_statistics.total_students }}</div>
                <div class="insight-detail">With BMI data available</div>
              </div>
            </div>
            
            <div class="insight-card average-bmi">
              <div class="insight-icon">
                <img src="assets/icons/average.jpg" alt="Average BMI" class="insight-icon-img">
              </div>
              <div class="insight-content">
                <div class="insight-title">School Average BMI</div>
                <div class="insight-value">{{ healthData.overall_statistics.average_bmi }}</div>
                <div class="insight-detail">Across all grade levels</div>
              </div>
            </div>
            
            <div class="insight-card overweight-total">
              <div class="insight-icon">
                <img src="assets/icons/bmi.jpg" alt="BMI" class="insight-icon-img">
              </div>
              <div class="insight-content">
                <div class="insight-title">Students Overweight/Obese</div>
                <div class="insight-value">{{ healthData.overall_statistics.total_overweight + healthData.overall_statistics.total_obese }}</div>
                <div class="insight-detail">Requiring attention</div>
              </div>
            </div>
          </div>
        </div>

        <!-- BMI Distribution Chart -->
        <div class="chart-section">
          <h3>BMI Distribution by Grade Level</h3>
          
          <!-- Pie Chart View (when data exists) -->
          <div class="pie-chart-container" *ngIf="healthData.grade_statistics && healthData.grade_statistics.length > 0">
            <div class="chart-legend">
              <div class="legend-item underweight">
                <span class="legend-color"></span>
                <span class="legend-label">Underweight</span>
              </div>
              <div class="legend-item normal">
                <span class="legend-color"></span>
                <span class="legend-label">Normal Weight</span>
              </div>
              <div class="legend-item overweight">
                <span class="legend-color"></span>
                <span class="legend-label">Overweight</span>
              </div>
              <div class="legend-item obese">
                <span class="legend-color"></span>
                <span class="legend-label">Obese</span>
              </div>
            </div>

            <div class="pie-charts-grid">
              <div *ngFor="let grade of healthData.grade_statistics" class="pie-chart-item">
                <h4 class="grade-title">{{ grade.grade_name }}</h4>
                <div class="pie-chart-wrapper">
                  <svg class="pie-chart" viewBox="0 0 200 200">
                    <circle cx="100" cy="100" r="90" fill="none" stroke="#17a2b8" 
                            [attr.stroke-dasharray]="calculateStrokeDasharray(grade.underweight_percentage, 0)"
                            stroke-width="40" transform="rotate(-90 100 100)"></circle>
                    <circle cx="100" cy="100" r="90" fill="none" stroke="#28a745" 
                            [attr.stroke-dasharray]="calculateStrokeDasharray(grade.normal_percentage, grade.underweight_percentage)"
                            stroke-width="40" transform="rotate(-90 100 100)"></circle>
                    <circle cx="100" cy="100" r="90" fill="none" stroke="#ffc107" 
                            [attr.stroke-dasharray]="calculateStrokeDasharray(grade.overweight_percentage, grade.underweight_percentage + grade.normal_percentage)"
                            stroke-width="40" transform="rotate(-90 100 100)"></circle>
                    <circle cx="100" cy="100" r="90" fill="none" stroke="#dc3545" 
                            [attr.stroke-dasharray]="calculateStrokeDasharray(grade.obese_percentage, grade.underweight_percentage + grade.normal_percentage + grade.overweight_percentage)"
                            stroke-width="40" transform="rotate(-90 100 100)"></circle>
                  </svg>
                  <div class="pie-chart-center">
                    <div class="total-count">{{ grade.total_students }}</div>
                    <div class="total-label">Students</div>
                  </div>
                </div>
                <div class="pie-chart-stats">
                  <div class="stat-row">
                    <span class="stat-color underweight"></span>
                    <span class="stat-text">{{ grade.underweight_count }} ({{ grade.underweight_percentage }}%)</span>
                  </div>
                  <div class="stat-row">
                    <span class="stat-color normal"></span>
                    <span class="stat-text">{{ grade.normal_count }} ({{ grade.normal_percentage }}%)</span>
                  </div>
                  <div class="stat-row">
                    <span class="stat-color overweight"></span>
                    <span class="stat-text">{{ grade.overweight_count }} ({{ grade.overweight_percentage }}%)</span>
                  </div>
                  <div class="stat-row">
                    <span class="stat-color obese"></span>
                    <span class="stat-text">{{ grade.obese_count }} ({{ grade.obese_percentage }}%)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Bar Chart View (legacy/fallback) -->
          <div class="chart-container" *ngIf="!healthData.grade_statistics || healthData.grade_statistics.length === 0">
            <div class="chart-legend">
              <div class="legend-item underweight">
                <span class="legend-color"></span>
                <span class="legend-label">Underweight</span>
              </div>
              <div class="legend-item normal">
                <span class="legend-color"></span>
                <span class="legend-label">Normal Weight</span>
              </div>
              <div class="legend-item overweight">
                <span class="legend-color"></span>
                <span class="legend-label">Overweight</span>
              </div>
              <div class="legend-item obese">
                <span class="legend-color"></span>
                <span class="legend-label">Obese</span>
              </div>
            </div>
            
            <div class="bar-chart">
              <div *ngFor="let grade of healthData.grade_statistics" class="grade-bar" 
                   [ngClass]="{'grade-7-highlight': grade.grade_name.includes('7') || grade.grade_level.includes('7')}">
                <div class="grade-label">
                  {{ grade.grade_name }}
                  <span *ngIf="(grade.grade_name.includes('7') || grade.grade_level.includes('7')) && grade.overweight_percentage >= 25" 
                        class="highest-risk-badge">HIGHEST RISK</span>
                </div>
                <div class="bar-container">
                  <div class="bar-stack">
                    <div class="bar-segment underweight" 
                         [style.width.%]="grade.underweight_percentage"
                         [title]="'Underweight: ' + grade.underweight_count + ' students (' + grade.underweight_percentage + '%)'">
                    </div>
                    <div class="bar-segment normal" 
                         [style.width.%]="grade.normal_percentage"
                         [title]="'Normal: ' + grade.normal_count + ' students (' + grade.normal_percentage + '%)'">
                    </div>
                    <div class="bar-segment overweight" 
                         [style.width.%]="grade.overweight_percentage"
                         [title]="'Overweight: ' + grade.overweight_count + ' students (' + grade.overweight_percentage + '%)'">
                    </div>
                    <div class="bar-segment obese" 
                         [style.width.%]="grade.obese_percentage"
                         [title]="'Obese: ' + grade.obese_count + ' students (' + grade.obese_percentage + '%)'">
                    </div>
                  </div>
                  <div class="bar-values">
                    <span class="total-students">{{ grade.total_students }} students</span>
                    <span class="overweight-highlight" *ngIf="grade.overweight_percentage > 20">
                      {{ grade.overweight_percentage }}% overweight
                    </span>
                    <span class="grade-7-alert" *ngIf="(grade.grade_name.includes('7') || grade.grade_level.includes('7')) && grade.overweight_percentage >= 25">
                      🚨 Canteen intervention recommended
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Detailed Statistics Table -->
        <div class="statistics-section">
          <h3>Detailed Statistics by Grade</h3>
          <div class="statistics-table">
            <div class="table-header">
              <span>Grade Level</span>
              <span>Total Students</span>
              <span>Underweight</span>
              <span>Normal</span>
              <span>Overweight</span>
              <span>Obese</span>
              <span>Risk Level</span>
            </div>
            <div *ngFor="let grade of healthData.grade_statistics" class="table-row">
              <span class="grade-name">{{ grade.grade_name }}</span>
              <span class="total">{{ grade.total_students }}</span>
              <span class="underweight">{{ grade.underweight_count }} ({{ grade.underweight_percentage }}%)</span>
              <span class="normal">{{ grade.normal_count }} ({{ grade.normal_percentage }}%)</span>
              <span class="overweight">{{ grade.overweight_count }} ({{ grade.overweight_percentage }}%)</span>
              <span class="obese">{{ grade.obese_count }} ({{ grade.obese_percentage }}%)</span>
              <span class="risk-level" [ngClass]="getRiskLevelClass(grade)">
                {{ getRiskLevel(grade) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Recommendations -->
        <div class="recommendations-section">
          <h3>Health Recommendations</h3>
          <div class="recommendations-list">
            <div *ngFor="let recommendation of getRecommendations()" class="recommendation-item" [ngClass]="recommendation.priority">
              <div class="recommendation-icon">
                <i [class]="recommendation.icon"></i>
              </div>
              <div class="recommendation-content">
                <div class="recommendation-title">{{ recommendation.title }}</div>
                <div class="recommendation-description">{{ recommendation.description }}</div>
                <div class="recommendation-action">{{ recommendation.action }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Trends -->
        <div class="trends-section" *ngIf="healthData.recent_trends && healthData.recent_trends.length > 0">
          <h3>Recent BMI Update Trends (Last 30 Days)</h3>
          <div class="trends-list">
            <div *ngFor="let trend of healthData.recent_trends" class="trend-item">
              <div class="trend-date">{{ formatDate(trend.update_date) }}</div>
              <div class="trend-stats">
                <span class="trend-updates">{{ trend.updates_count }} updates</span>
                <span class="trend-overweight" *ngIf="trend.new_overweight > 0">{{ trend.new_overweight }} overweight</span>
                <span class="trend-obese" *ngIf="trend.new_obese > 0">{{ trend.new_obese }} obese</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .health-risk-visualization {
      background: white;
      border-radius: 12px;
      padding: 2rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      margin-bottom: 2rem;
    }

    .visualization-header {
      margin-bottom: 2rem;
      text-align: center;
      
      h2 {
        font-size: 1.8rem;
        color: #2c3e50;
        margin-bottom: 0.5rem;
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.75rem;
        
        i { color: #e74c3c; }
      }
      
      p {
        color: #7f8c8d;
        font-size: 1.1rem;
        margin: 0;
      }
    }

    .loading-state, .error-state {
      text-align: center;
      padding: 3rem;
      
      .spinner {
        width: 50px;
        height: 50px;
        margin: 0 auto 1rem;
        border: 4px solid #f3f3f3;
        border-top: 4px solid #e74c3c;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
      
      p { color: #7f8c8d; margin-bottom: 1rem; }
      
      .retry-btn {
        background: #e74c3c;
        color: white;
        border: none;
        padding: 0.75rem 1.5rem;
        border-radius: 6px;
        cursor: pointer;
        font-weight: 500;
        transition: background 0.2s;
        
        &:hover { background: #c0392b; }
      }
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .insights-section {
      margin-bottom: 2.5rem;
      
      h3 {
        font-size: 1.3rem;
        color: #2c3e50;
        margin-bottom: 1.5rem;
        font-weight: 600;
      }
    }

    .insights-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
    }

    .insight-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.5rem;
      border-radius: 10px;
      border-left: 4px solid;
      
      &.highest-risk {
        background: #fff5f5;
        border-color: #e74c3c;
        
        .insight-icon { color: #e74c3c; }
      }
      
      &.total-students {
        background: #f8f9fa;
        border-color: #3498db;
        
        .insight-icon { color: #3498db; }
      }
      
      &.average-bmi {
        background: #f0f8ff;
        border-color: #9b59b6;
        
        .insight-icon { color: #9b59b6; }
      }
      
      &.overweight-total {
        background: #fff8e1;
        border-color: #f39c12;
        
        .insight-icon { color: #f39c12; }
      }
      
      .insight-icon {
        font-size: 2rem;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;

        .insight-icon-img {
          width: 32px;
          height: 32px;
          object-fit: contain;
          display: block;
        }
      }
      
      .insight-content {
        .insight-title {
          font-size: 0.9rem;
          color: #7f8c8d;
          margin-bottom: 0.25rem;
          font-weight: 500;
        }
        
        .insight-value {
          font-size: 1.8rem;
          font-weight: 700;
          color: #2c3e50;
          margin-bottom: 0.25rem;
        }
        
        .insight-detail {
          font-size: 0.85rem;
          color: #95a5a6;
        }
        
        .insight-students {
          font-size: 0.8rem;
          color: #bdc3c7;
          margin-top: 0.25rem;
        }
      }
    }

    .chart-section {
      margin-bottom: 2.5rem;
      
      h3 {
        font-size: 1.3rem;
        color: #2c3e50;
        margin-bottom: 1.5rem;
        font-weight: 600;
      }
    }

    .chart-container {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 1.5rem;
    }

    .pie-chart-container {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 1.5rem;
    }

    .pie-charts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 2rem;
      margin-top: 2rem;
    }

    .pie-chart-item {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      text-align: center;

      .grade-title {
        font-size: 1.1rem;
        font-weight: 700;
        color: #2c3e50;
        margin-bottom: 1rem;
      }

      .pie-chart-wrapper {
        position: relative;
        width: 200px;
        height: 200px;
        margin: 0 auto 1rem;

        .pie-chart {
          width: 100%;
          height: 100%;
        }

        .pie-chart-center {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;

          .total-count {
            font-size: 2rem;
            font-weight: 700;
            color: #2c3e50;
            line-height: 1;
          }

          .total-label {
            font-size: 0.85rem;
            color: #7f8c8d;
            margin-top: 0.25rem;
          }
        }
      }

      .pie-chart-stats {
        text-align: left;

        .stat-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.5rem 0;
          border-bottom: 1px solid #f1f3f4;

          &:last-child {
            border-bottom: none;
          }

          .stat-color {
            width: 16px;
            height: 16px;
            border-radius: 3px;
            flex-shrink: 0;

            &.underweight { background: #17a2b8; }
            &.normal { background: #28a745; }
            &.overweight { background: #ffc107; }
            &.obese { background: #dc3545; }
          }

          .stat-text {
            font-size: 0.9rem;
            color: #2c3e50;
            font-weight: 500;
          }
        }
      }
    }

    .chart-legend {
      display: flex;
      justify-content: center;
      gap: 2rem;
      margin-bottom: 2rem;
      flex-wrap: wrap;
      
      .legend-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        
        .legend-color {
          width: 16px;
          height: 16px;
          border-radius: 3px;
        }
        
        .legend-label {
          font-size: 0.9rem;
          color: #2c3e50;
          font-weight: 500;
        }
      }
      
      .underweight .legend-color { background: #17a2b8; }
      .normal .legend-color { background: #28a745; }
      .overweight .legend-color { background: #ffc107; }
      .obese .legend-color { background: #dc3545; }
    }

    .bar-chart {
      .grade-bar {
        margin-bottom: 1.5rem;
        transition: all 0.3s ease;
        
        &.grade-7-highlight {
          background: linear-gradient(135deg, #fff5f5 0%, #ffffff 100%);
          border: 2px solid #e74c3c;
          border-radius: 8px;
          padding: 1rem;
          box-shadow: 0 4px 12px rgba(231, 76, 60, 0.15);
          
          .grade-label {
            color: #e74c3c;
            font-weight: 700;
            font-size: 1.1rem;
          }
        }
        
        .grade-label {
          font-weight: 600;
          color: #2c3e50;
          margin-bottom: 0.5rem;
          font-size: 1rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          
          .highest-risk-badge {
            background: #e74c3c;
            color: white;
            padding: 0.2rem 0.6rem;
            border-radius: 12px;
            font-size: 0.7rem;
            font-weight: 700;
            letter-spacing: 0.5px;
            animation: pulse 2s infinite;
          }
        }
        
        .bar-container {
          .bar-stack {
            display: flex;
            height: 30px;
            border-radius: 15px;
            overflow: hidden;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            margin-bottom: 0.5rem;
            
            .bar-segment {
              transition: all 0.3s ease;
              cursor: pointer;
              
              &:hover {
                opacity: 0.8;
                transform: scaleY(1.1);
              }
              
              &.underweight { background: #17a2b8; }
              &.normal { background: #28a745; }
              &.overweight { background: #ffc107; }
              &.obese { background: #dc3545; }
            }
          }
          
          .bar-values {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 0.85rem;
            flex-wrap: wrap;
            gap: 0.5rem;
            
            .total-students {
              color: #7f8c8d;
              font-weight: 500;
            }
            
            .overweight-highlight {
              background: #fff3cd;
              color: #856404;
              padding: 0.2rem 0.5rem;
              border-radius: 12px;
              font-weight: 600;
              font-size: 0.8rem;
            }
            
            .grade-7-alert {
              background: #f8d7da;
              color: #721c24;
              padding: 0.3rem 0.7rem;
              border-radius: 15px;
              font-weight: 600;
              font-size: 0.8rem;
              border: 1px solid #f5c6cb;
              animation: glow 3s ease-in-out infinite alternate;
            }
          }
        }
      }
    }

    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.05); }
      100% { transform: scale(1); }
    }

    @keyframes glow {
      from { box-shadow: 0 0 5px rgba(231, 76, 60, 0.3); }
      to { box-shadow: 0 0 15px rgba(231, 76, 60, 0.6); }
    }

    .statistics-section {
      margin-bottom: 2.5rem;
      
      h3 {
        font-size: 1.3rem;
        color: #2c3e50;
        margin-bottom: 1.5rem;
        font-weight: 600;
      }
    }

    .statistics-table {
      background: #f8f9fa;
      border-radius: 8px;
      overflow: hidden;
      
      .table-header, .table-row {
        display: grid;
        grid-template-columns: 1.2fr 1fr 1fr 1fr 1fr 1fr 1fr;
        gap: 1rem;
        padding: 1rem;
        align-items: center;
      }
      
      .table-header {
        background: #e9ecef;
        font-weight: 600;
        color: #495057;
        font-size: 0.9rem;
      }
      
      .table-row {
        border-bottom: 1px solid #dee2e6;
        font-size: 0.9rem;
        
        &:last-child { border-bottom: none; }
        &:hover { background: #ffffff; }
        
        .grade-name { font-weight: 600; color: #2c3e50; }
        .total { font-weight: 500; }
        .underweight { color: #17a2b8; }
        .normal { color: #28a745; }
        .overweight { color: #f39c12; }
        .obese { color: #e74c3c; }
        
        .risk-level {
          padding: 0.25rem 0.75rem;
          border-radius: 12px;
          font-weight: 600;
          font-size: 0.8rem;
          text-align: center;
          
          &.low { background: #d4edda; color: #155724; }
          &.moderate { background: #fff3cd; color: #856404; }
          &.high { background: #f8d7da; color: #721c24; }
        }
      }
    }

    .recommendations-section {
      margin-bottom: 2.5rem;
      
      h3 {
        font-size: 1.3rem;
        color: #2c3e50;
        margin-bottom: 1.5rem;
        font-weight: 600;
      }
    }

    .recommendations-list {
      .recommendation-item {
        display: flex;
        align-items: flex-start;
        gap: 1rem;
        padding: 1.5rem;
        border-radius: 8px;
        margin-bottom: 1rem;
        border-left: 4px solid;
        
        &.high {
          background: #fff5f5;
          border-color: #e74c3c;
          
          .recommendation-icon { color: #e74c3c; }
        }
        
        &.medium {
          background: #fff8e1;
          border-color: #f39c12;
          
          .recommendation-icon { color: #f39c12; }
        }
        
        &.low {
          background: #f0f8ff;
          border-color: #3498db;
          
          .recommendation-icon { color: #3498db; }
        }
        
        .recommendation-icon {
          font-size: 1.5rem;
          flex-shrink: 0;
          margin-top: 0.25rem;
        }
        
        .recommendation-content {
          .recommendation-title {
            font-weight: 600;
            color: #2c3e50;
            margin-bottom: 0.5rem;
            font-size: 1rem;
          }
          
          .recommendation-description {
            color: #7f8c8d;
            margin-bottom: 0.5rem;
            line-height: 1.5;
          }
          
          .recommendation-action {
            color: #3498db;
            font-weight: 500;
            font-size: 0.9rem;
          }
        }
      }
    }

    .trends-section {
      h3 {
        font-size: 1.3rem;
        color: #2c3e50;
        margin-bottom: 1.5rem;
        font-weight: 600;
      }
    }

    .trends-list {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 1rem;
      
      .trend-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.75rem;
        border-bottom: 1px solid #dee2e6;
        
        &:last-child { border-bottom: none; }
        
        .trend-date {
          font-weight: 500;
          color: #2c3e50;
        }
        
        .trend-stats {
          display: flex;
          gap: 1rem;
          font-size: 0.9rem;
          
          .trend-updates { color: #7f8c8d; }
          .trend-overweight { color: #f39c12; }
          .trend-obese { color: #e74c3c; }
        }
      }
    }

    @media (max-width: 768px) {
      .health-risk-visualization { padding: 1rem; }
      .insights-grid { grid-template-columns: 1fr; }
      .chart-legend { gap: 1rem; }
      .statistics-table .table-header, 
      .statistics-table .table-row {
        grid-template-columns: 1fr;
        gap: 0.5rem;
        text-align: center;
      }
    }
  `]
})
export class HealthRiskVisualizationComponent implements OnInit, OnDestroy {
  loading = false;
  error: string | null = null;
  healthData: any = null;
  topRisk: any = null;
  
  private destroy$ = new Subject<void>();

  constructor(private adminService: AdminService) {}

  ngOnInit() {
    this.loadHealthData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadHealthData() {
    this.loading = true;
    this.error = null;
    
    this.adminService.getHealthRiskVisualization()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.healthData = response.data;
            this.topRisk = response.data.top_health_risks?.[0] || null;
            console.log('Health data loaded:', this.healthData);
          } else {
            this.error = response.message || 'Failed to load health data';
          }
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading health data:', err);
          this.error = 'Failed to load health risk data. Please try again.';
          this.loading = false;
        }
      });
  }

  getRiskLevel(grade: any): string {
    const overweightObese = grade.overweight_percentage + grade.obese_percentage;
    if (overweightObese >= 30) return 'High Risk';
    if (overweightObese >= 15) return 'Moderate Risk';
    return 'Low Risk';
  }

  getRiskLevelClass(grade: any): string {
    const overweightObese = grade.overweight_percentage + grade.obese_percentage;
    if (overweightObese >= 30) return 'high';
    if (overweightObese >= 15) return 'moderate';
    return 'low';
  }

  getRecommendations(): any[] {
    if (!this.healthData) return [];
    
    const recommendations = [];
    
    // Find Grade 7 specifically and check if it has high overweight rate
    const grade7 = this.healthData.grade_statistics.find((grade: any) => 
      grade.grade_name.includes('7') || grade.grade_level.includes('7')
    );
    
    if (grade7 && grade7.overweight_percentage >= 25) {
      recommendations.push({
        priority: 'high',
        icon: 'fas fa-utensils',
        title: 'Canteen Intervention for Grade 7',
        description: `Grade 7 shows ${grade7.overweight_percentage}% overweight rate - the highest among all grades.`,
        action: 'Replace sugary drinks with fruit-infused water specifically for Grade 7 building. Monitor impact over 3 months.'
      });
    }
    
    // Check for other high-risk grades
    const otherHighRiskGrades = this.healthData.grade_statistics.filter((grade: any) => 
      (grade.overweight_percentage + grade.obese_percentage) >= 25 && 
      !grade.grade_name.includes('7') && !grade.grade_level.includes('7')
    );
    
    if (otherHighRiskGrades.length > 0) {
      recommendations.push({
        priority: 'high',
        icon: 'fas fa-running',
        title: 'Physical Activity Enhancement',
        description: `${otherHighRiskGrades.map((g: any) => g.grade_name).join(', ')} also show${otherHighRiskGrades.length === 1 ? 's' : ''} elevated BMI levels.`,
        action: 'Implement additional PE classes and after-school sports programs for these grades.'
      });
    }
    
    // Check overall overweight percentage
    const totalStudents = this.healthData.overall_statistics.total_students;
    const overweightTotal = this.healthData.overall_statistics.total_overweight + this.healthData.overall_statistics.total_obese;
    const overweightPercentage = (overweightTotal / totalStudents) * 100;
    
    if (overweightPercentage > 20) {
      recommendations.push({
        priority: 'medium',
        icon: 'fas fa-apple-alt',
        title: 'School-wide Nutrition Program',
        description: `${overweightPercentage.toFixed(1)}% of all students are overweight or obese.`,
        action: 'Develop comprehensive nutrition education curriculum and healthy eating campaigns.'
      });
    }
    
    // Check for underweight students
    const underweightTotal = this.healthData.overall_statistics.total_underweight;
    const underweightPercentage = (underweightTotal / totalStudents) * 100;
    
    if (underweightPercentage > 10) {
      recommendations.push({
        priority: 'medium',
        icon: 'fas fa-heart',
        title: 'Nutrition Support Program',
        description: `${underweightPercentage.toFixed(1)}% of students are underweight and may need nutritional support.`,
        action: 'Consider implementing a school feeding program or nutrition counseling services.'
      });
    }
    
    // Always include monitoring recommendation
    recommendations.push({
      priority: 'low',
      icon: 'fas fa-chart-line',
      title: 'Continuous Health Monitoring',
      description: 'Regular BMI tracking helps identify trends and measure intervention effectiveness.',
      action: 'Schedule quarterly health assessments and maintain this dashboard for data-driven decisions.'
    });
    
    return recommendations;
  }

  formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return dateString;
    }
  }

  calculateStrokeDasharray(percentage: number, offset: number): string {
    const circumference = 2 * Math.PI * 90; // radius = 90
    const percentageOffset = (offset / 100) * circumference;
    const segmentLength = (percentage / 100) * circumference;
    const gapLength = circumference - segmentLength;
    return `${segmentLength} ${gapLength}`;
  }
}