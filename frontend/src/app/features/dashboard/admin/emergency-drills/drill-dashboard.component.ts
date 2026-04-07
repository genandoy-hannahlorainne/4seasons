import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { interval, Subscription } from 'rxjs';
import { EmergencyDrillService } from '../../../../core/services/emergency-drill.service';
import { DrillDashboard, EmergencyDrill } from '../../../../core/models/emergency-drill.model';

@Component({
  selector: 'app-drill-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="drill-dashboard" *ngIf="drill">
      <div class="dashboard-header">
        <div class="drill-info">
          <h2>{{ drill.drill_name }}</h2>
          <span class="drill-type">{{ drill.drill_type | titlecase }} Drill</span>
          <span class="status-badge" [class]="'status-' + drill.status">
            {{ drill.status | titlecase }}
          </span>
        </div>
        
        <div class="drill-timer" *ngIf="drill.status === 'active'">
          <div class="timer-display">
            <span class="timer-value">{{ formatTime(dashboardData?.elapsed_time || 0) }}</span>
            <span class="timer-label">Elapsed Time</span>
          </div>
        </div>
      </div>

      <!-- Real-time Statistics -->
      <div class="stats-grid" *ngIf="dashboardData">
        <div class="stat-card">
          <div class="stat-value">{{ dashboardData.total_participants }}</div>
          <div class="stat-label">Total Participants</div>
        </div>
        
        <div class="stat-card injured">
          <div class="stat-value">{{ dashboardData.injured_count }}</div>
          <div class="stat-label">Injured Students</div>
        </div>
        
        <div class="stat-card scanned">
          <div class="stat-value">{{ dashboardData.scanned_count }}</div>
          <div class="stat-label">Students Scanned</div>
        </div>
        
        <div class="stat-card rescued">
          <div class="stat-value">{{ dashboardData.rescued_count }}</div>
          <div class="stat-label">Students Rescued</div>
        </div>
        
        <div class="stat-card response-time" *ngIf="dashboardData.average_response_time">
          <div class="stat-value">{{ formatTime(dashboardData.average_response_time) }}</div>
          <div class="stat-label">Avg Response Time</div>
        </div>
        
        <div class="stat-card fastest" *ngIf="dashboardData.fastest_response && dashboardData.fastest_response > 0">
          <div class="stat-value">{{ formatTime(dashboardData.fastest_response) }}</div>
          <div class="stat-label">Fastest Response</div>
        </div>
      </div>

      <!-- Progress Bar -->
      <div class="progress-section" *ngIf="dashboardData">
        <h3>Drill Progress</h3>
        <div class="progress-bar">
          <div class="progress-fill" 
               [style.width.%]="getCompletionPercentage()">
          </div>
        </div>
        <div class="progress-text">
          {{ dashboardData.scanned_count }} of {{ dashboardData.total_participants }} participants scanned
          ({{ getCompletionPercentage() | number:'1.0-0' }}%)
        </div>
      </div>

      <!-- Recent Scans -->
      <div class="recent-scans" *ngIf="dashboardData?.recent_scans?.length">
        <h3>Recent Scans</h3>
        <div class="scans-list">
          <div class="scan-item" *ngFor="let scan of dashboardData?.recent_scans">
            <div class="scan-info">
              <div class="student-name">
                {{ scan.participant?.student?.full_name || (scan.participant?.student?.first_name + ' ' + (scan.participant?.student?.last_name || '')) || 'Unknown Student' }}
              </div>
              <div class="scan-details">
                <span class="scan-time">{{ scan.scanned_at | date:'HH:mm:ss' }}</span>
                <span class="response-time" *ngIf="scan.seconds_from_start > 0">{{ formatTime(scan.seconds_from_start) }} response</span>
                <span class="scanner">by {{ scan.scanner?.full_name || 'Unknown' }}</span>
              </div>
            </div>
            <div class="scan-type">
              <i class="fas fa-qrcode" *ngIf="scan.scan_type === 'qr'"></i>
              <i class="fas fa-hand-paper" *ngIf="scan.scan_type === 'manual'"></i>
              <i class="fas fa-wifi" *ngIf="scan.scan_type === 'nfc'"></i>
            </div>
          </div>
        </div>
      </div>

      <!-- Drill Actions -->
      <div class="drill-actions" *ngIf="drill.status === 'active'">
        <button class="btn btn-danger" (click)="endDrill()">
          <i class="fas fa-stop"></i> End Drill
        </button>
        <button class="btn btn-primary" (click)="openScanModal()">
          <i class="fas fa-qrcode"></i> Manual Scan
        </button>
        <a class="btn btn-success" [routerLink]="['/dashboard/admin/emergency-drills', drill.id, 'scanner']" *ngIf="drill">
          <i class="fas fa-mobile-alt"></i> Mobile Scanner
        </a>
      </div>

      <!-- Loading -->
      <div class="loading" *ngIf="loading">
        <i class="fas fa-spinner fa-spin"></i> Loading dashboard...
      </div>

      <!-- Manual Scan Modal -->
      <div class="modal" *ngIf="showScanModal" (click)="closeScanModal($event)">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Manual Scan</h3>
            <button class="close-btn" (click)="showScanModal = false">&times;</button>
          </div>
          
          <div class="modal-body">
            <div class="form-group">
              <label>User ID or Student Number *</label>
              <div class="search-container">
                <input type="text" [(ngModel)]="scanData.user_id" 
                       class="form-control" 
                       placeholder="Enter User ID or Student Number"
                       (input)="onSearchInput($event)"
                       (focus)="onSearchFocus()"
                       (blur)="onSearchBlur()">
                
                <!-- Search Results Dropdown -->
                <div class="search-results" *ngIf="showSearchResults && searchResults.length > 0">
                  <div class="search-result-item" 
                       *ngFor="let result of searchResults"
                       (click)="selectSearchResult(result)"
                       [class.is-participant]="result.is_participant">
                    <div class="result-main">
                      <span class="result-name">{{ result.display_text }}</span>
                      <span class="result-role">{{ result.role }}</span>
                    </div>
                    <div class="result-status" *ngIf="result.is_participant">
                      <i class="fas fa-check-circle"></i> Participant
                    </div>
                  </div>
                </div>
                
                <!-- Loading indicator -->
                <div class="search-loading" *ngIf="searchLoading">
                  <i class="fas fa-spinner fa-spin"></i> Searching...
                </div>
                
                <!-- No results -->
                <div class="search-no-results" *ngIf="showSearchResults && searchResults.length === 0 && !searchLoading && scanData.user_id && scanData.user_id.toString().length >= 2">
                  No users found matching "{{ scanData.user_id }}"
                </div>
              </div>
              <small class="form-text">Enter either a User ID (short number) or Student Number (long number)</small>
            </div>
            
            <div class="form-group">
              <label>Notes</label>
              <textarea [(ngModel)]="scanData.notes" class="form-control" 
                        rows="3" placeholder="Optional notes about the scan"></textarea>
            </div>
            
            <div class="modal-actions">
              <button type="button" class="btn btn-secondary" (click)="showScanModal = false">
                Cancel
              </button>
              <button type="button" class="btn btn-primary" 
                      (click)="performManualScan()" [disabled]="!scanData.user_id || scanning">
                <i class="fas fa-spinner fa-spin" *ngIf="scanning"></i>
                {{ scanning ? 'Scanning...' : 'Scan User' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .drill-dashboard {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
      padding: 20px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .drill-info h2 {
      margin: 0 0 10px 0;
      color: #333;
    }

    .drill-type {
      background: #e3f2fd;
      color: #1976d2;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      margin-right: 10px;
    }

    .status-badge {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: bold;
      text-transform: uppercase;
    }

    .status-active { background: #e8f5e8; color: #2e7d32; }
    .status-completed { background: #f3e5f5; color: #7b1fa2; }

    .drill-timer {
      text-align: center;
    }

    .timer-display {
      background: #28a745;
      color: white;
      padding: 20px;
      border-radius: 8px;
      min-width: 150px;
    }

    .timer-value {
      display: block;
      font-size: 32px;
      font-weight: bold;
      font-family: 'Courier New', monospace;
    }

    .timer-label {
      font-size: 12px;
      text-transform: uppercase;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }

    .stat-card {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      text-align: center;
      border-left: 4px solid #ddd;
    }

    .stat-card.injured { border-left-color: #dc3545; }
    .stat-card.scanned { border-left-color: #ffc107; }
    .stat-card.rescued { border-left-color: #28a745; }
    .stat-card.response-time { border-left-color: #17a2b8; }
    .stat-card.fastest { border-left-color: #6f42c1; }

    .stat-value {
      font-size: 36px;
      font-weight: bold;
      color: #333;
      display: block;
    }

    .stat-label {
      font-size: 14px;
      color: #666;
      text-transform: uppercase;
      margin-top: 5px;
    }

    .progress-section {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      margin-bottom: 30px;
    }

    .progress-section h3 {
      margin: 0 0 15px 0;
      color: #333;
    }

    .progress-bar {
      width: 100%;
      height: 20px;
      background: #e9ecef;
      border-radius: 10px;
      overflow: hidden;
      margin-bottom: 10px;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #28a745, #20c997);
      transition: width 0.3s ease;
    }

    .progress-text {
      text-align: center;
      color: #666;
      font-size: 14px;
    }

    .recent-scans {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      margin-bottom: 30px;
    }

    .recent-scans h3 {
      margin: 0 0 20px 0;
      color: #333;
    }

    .scans-list {
      max-height: 400px;
      overflow-y: auto;
    }

    .scan-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 15px;
      border-bottom: 1px solid #eee;
      transition: background 0.2s;
    }

    .scan-item:hover {
      background: #f8f9fa;
    }

    .scan-item:last-child {
      border-bottom: none;
    }

    .student-name {
      font-weight: bold;
      color: #333;
      margin-bottom: 5px;
    }

    .scan-details {
      display: flex;
      gap: 15px;
      font-size: 12px;
      color: #666;
    }

    .scan-type {
      font-size: 18px;
      color: #007bff;
    }

    .drill-actions {
      display: flex;
      gap: 15px;
      justify-content: center;
      margin-top: 30px;
    }

    .loading {
      text-align: center;
      padding: 40px;
      color: #666;
    }

    .modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-content {
      background: white;
      border-radius: 8px;
      width: 90%;
      max-width: 400px;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px;
      border-bottom: 1px solid #eee;
    }

    .modal-header h3 {
      margin: 0;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #666;
    }

    .modal-body {
      padding: 20px;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-group label {
      display: block;
      margin-bottom: 5px;
      font-weight: bold;
      color: #333;
    }

    .form-control {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
    }

    .form-text {
      color: #666;
      font-size: 12px;
      margin-top: 5px;
      display: block;
    }

    .search-container {
      position: relative;
    }

    .search-results {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: white;
      border: 1px solid #ddd;
      border-top: none;
      border-radius: 0 0 4px 4px;
      max-height: 200px;
      overflow-y: auto;
      z-index: 1001;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .search-result-item {
      padding: 12px;
      cursor: pointer;
      border-bottom: 1px solid #eee;
      display: flex;
      justify-content: space-between;
      align-items: center;
      transition: background 0.2s;
    }

    .search-result-item:hover {
      background: #f8f9fa;
    }

    .search-result-item:last-child {
      border-bottom: none;
    }

    .search-result-item.is-participant {
      background: #e8f5e8;
    }

    .search-result-item.is-participant:hover {
      background: #d4edda;
    }

    .result-main {
      flex: 1;
    }

    .result-name {
      display: block;
      font-weight: bold;
      color: #333;
      margin-bottom: 2px;
    }

    .result-role {
      font-size: 12px;
      color: #666;
      text-transform: capitalize;
    }

    .result-status {
      color: #28a745;
      font-size: 12px;
      font-weight: bold;
    }

    .result-status i {
      margin-right: 4px;
    }

    .search-loading {
      padding: 12px;
      text-align: center;
      color: #666;
      font-size: 14px;
      background: white;
      border: 1px solid #ddd;
      border-top: none;
      border-radius: 0 0 4px 4px;
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      z-index: 1001;
    }

    .search-no-results {
      padding: 12px;
      text-align: center;
      color: #999;
      font-size: 14px;
      background: white;
      border: 1px solid #ddd;
      border-top: none;
      border-radius: 0 0 4px 4px;
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      z-index: 1001;
    }

    .modal-actions {
      display: flex;
      gap: 10px;
      justify-content: flex-end;
      margin-top: 20px;
    }

    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    .btn-primary { background: #007bff; color: white; }
    .btn-danger { background: #dc3545; color: white; }
    .btn-secondary { background: #6c757d; color: white; }

    .btn:hover {
      opacity: 0.9;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  `]
})
export class DrillDashboardComponent implements OnInit, OnDestroy {
  drill: EmergencyDrill | null = null;
  dashboardData: DrillDashboard | null = null;
  loading = false;
  showScanModal = false;
  scanning = false;
  searchResults: any[] = [];
  showSearchResults = false;
  searchLoading = false;
  
  scanData = {
    user_id: null as number | string | null,
    scan_type: 'manual',
    notes: ''
  };

  private refreshSubscription?: Subscription;
  private drillId: number = 0;

  constructor(
    private route: ActivatedRoute,
    private drillService: EmergencyDrillService
  ) {}

  ngOnInit() {
    this.drillId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadDrillDetails();
    this.startAutoRefresh();
  }

  ngOnDestroy() {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
    }
  }

  loadDrillDetails() {
    this.loading = true;
    this.drillService.getDrill(this.drillId).subscribe({
      next: (response) => {
        this.drill = response.data.drill;
        this.loading = false;
        this.loadDashboardData();
      },
      error: (error) => {
        console.error('Error loading drill details:', error);
        this.loading = false;
      }
    });
  }

  loadDashboardData() {
    this.drillService.getDrillDashboard(this.drillId).subscribe({
      next: (response) => {
        this.dashboardData = response.data;
      },
      error: (error) => {
        console.error('Error loading dashboard data:', error);
      }
    });
  }

  startAutoRefresh() {
    // Refresh dashboard data every 2 seconds for active drills
    this.refreshSubscription = interval(2000).subscribe(() => {
      if (this.drill?.status === 'active') {
        this.loadDashboardData();
      }
    });
  }

  formatTime(seconds: number): string {
    const totalSecs = Math.max(0, Math.floor(seconds));
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
  }

  getCompletionPercentage(): number {
    if (!this.dashboardData || this.dashboardData.total_participants === 0) {
      return 0;
    }
    return (this.dashboardData.scanned_count / this.dashboardData.total_participants) * 100;
  }

  endDrill() {
    if (confirm('Are you sure you want to end this drill?')) {
      this.drillService.endDrill(this.drillId).subscribe({
        next: () => {
          this.loadDrillDetails();
        },
        error: (error) => {
          console.error('Error ending drill:', error);
        }
      });
    }
  }

  openScanModal() {
    this.showScanModal = true;
    this.scanData = {
      user_id: null,
      scan_type: 'manual',
      notes: ''
    };
    this.searchResults = [];
    this.showSearchResults = false;
  }

  closeScanModal(event: Event) {
    if (event.target === event.currentTarget) {
      this.showScanModal = false;
      this.searchResults = [];
      this.showSearchResults = false;
    }
  }

  onSearchInput(event: any) {
    const query = event.target.value;
    
    if (query && query.length >= 2) {
      this.searchLoading = true;
      this.showSearchResults = true;
      
      this.drillService.searchUsers(this.drillId, query).subscribe({
        next: (response) => {
          this.searchResults = response.data;
          this.searchLoading = false;
        },
        error: (error) => {
          console.error('Error searching users:', error);
          this.searchResults = [];
          this.searchLoading = false;
        }
      });
    } else {
      this.searchResults = [];
      this.showSearchResults = false;
      this.searchLoading = false;
    }
  }

  onSearchFocus() {
    if (this.scanData.user_id && this.scanData.user_id.toString().length >= 2) {
      this.showSearchResults = true;
    }
  }

  onSearchBlur() {
    // Delay hiding results to allow clicking on them
    setTimeout(() => {
      this.showSearchResults = false;
    }, 200);
  }

  selectSearchResult(result: any) {
    // Use user_id for short numbers, student_number for long numbers
    if (result.student_number && result.student_number.length > 6) {
      this.scanData.user_id = result.student_number;
    } else {
      this.scanData.user_id = result.user_id;
    }
    
    this.searchResults = [];
    this.showSearchResults = false;
  }

  performManualScan() {
    if (!this.scanData.user_id) return;

    this.scanning = true;
    
    // Check if the input looks like a student number (long number) or user ID (short number)
    const inputValue = this.scanData.user_id;
    let scanRequest: any = {
      scan_type: this.scanData.scan_type,
      notes: this.scanData.notes
    };
    
    // If it's a long number (like 136883100330), treat it as student_number
    // If it's a short number (like 76), treat it as user_id
    if (inputValue.toString().length > 6) {
      scanRequest.student_number = inputValue.toString();
    } else {
      scanRequest.user_id = parseInt(inputValue.toString());
    }
    
    this.drillService.scanParticipant(this.drillId, scanRequest).subscribe({
      next: (response) => {
        this.showScanModal = false;
        this.scanning = false;
        this.searchResults = [];
        this.showSearchResults = false;
        this.loadDashboardData();
        
        // Show success message
        alert(`User scanned successfully! Response time: ${response.data.response_time} seconds`);
      },
      error: (error) => {
        console.error('Error scanning student:', error);
        this.scanning = false;
        alert('Error scanning user: ' + (error.error?.message || 'Unknown error'));
      }
    });
  }
}