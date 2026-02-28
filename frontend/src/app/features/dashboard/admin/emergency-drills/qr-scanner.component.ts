import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { EmergencyDrillService } from '../../../../core/services/emergency-drill.service';

@Component({
  selector: 'app-qr-scanner',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="qr-scanner-container">
      <div class="scanner-header">
        <h2>Emergency Drill QR Scanner</h2>
        <div class="drill-info" *ngIf="drillName">
          <span class="drill-name">{{ drillName }}</span>
          <span class="scan-count">{{ scannedCount }} scanned</span>
        </div>
      </div>

      <!-- QR Scanner -->
      <div class="scanner-section">
        <div id="qr-reader" #qrReader class="qr-reader"></div>
        
        <div class="scanner-controls">
          <button class="btn btn-primary" (click)="startScanner()" *ngIf="!scannerActive">
            <i class="fas fa-camera"></i> Start Scanner
          </button>
          <button class="btn btn-danger" (click)="stopScanner()" *ngIf="scannerActive">
            <i class="fas fa-stop"></i> Stop Scanner
          </button>
        </div>
      </div>

      <!-- Manual Input -->
      <div class="manual-input-section">
        <h3>Manual Entry</h3>
        <p class="input-help">Enter either a User ID (short number) or Student Number (long number)</p>
        <div class="input-group">
          <div class="search-container">
            <input type="text" 
                   [(ngModel)]="manualStudentId" 
                   class="form-control" 
                   placeholder="Enter User ID or Student Number"
                   (input)="onSearchInput($event)"
                   (focus)="onSearchFocus()"
                   (blur)="onSearchBlur()"
                   (keyup.enter)="scanManualId()">
            
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
            <div class="search-no-results" *ngIf="showSearchResults && searchResults.length === 0 && !searchLoading && manualStudentId && manualStudentId.toString().length >= 2">
              No users found matching "{{ manualStudentId }}"
            </div>
          </div>
          <button class="btn btn-secondary" (click)="scanManualId()" [disabled]="!manualStudentId">
            <i class="fas fa-user-check"></i> Scan
          </button>
        </div>
      </div>

      <!-- Recent Scans -->
      <div class="recent-scans" *ngIf="recentScans.length">
        <h3>Recent Scans</h3>
        <div class="scans-list">
          <div class="scan-item" *ngFor="let scan of recentScans">
            <div class="scan-info">
              <div class="student-name">{{ scan.student_name }}</div>
              <div class="scan-time">{{ scan.scan_time | date:'HH:mm:ss' }}</div>
            </div>
            <div class="response-time">{{ scan.response_time }}s</div>
          </div>
        </div>
      </div>

      <!-- Status Messages -->
      <div class="status-messages">
        <div class="alert alert-success" *ngIf="successMessage">
          <i class="fas fa-check-circle"></i> {{ successMessage }}
        </div>
        <div class="alert alert-danger" *ngIf="errorMessage">
          <i class="fas fa-exclamation-circle"></i> {{ errorMessage }}
        </div>
        <div class="alert alert-info" *ngIf="infoMessage">
          <i class="fas fa-info-circle"></i> {{ infoMessage }}
        </div>
      </div>

      <!-- Scanner Status -->
      <div class="scanner-status">
        <div class="status-indicator" [class.active]="scannerActive">
          <i class="fas fa-circle"></i>
          {{ scannerActive ? 'Scanner Active' : 'Scanner Inactive' }}
        </div>
      </div>
    </div>
  `,
  styles: [`
    .qr-scanner-container {
      padding: 20px;
      max-width: 600px;
      margin: 0 auto;
      background: #f8f9fa;
      min-height: 100vh;
    }

    .scanner-header {
      text-align: center;
      margin-bottom: 30px;
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .scanner-header h2 {
      margin: 0 0 15px 0;
      color: #333;
    }

    .drill-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .drill-name {
      font-weight: bold;
      color: #007bff;
    }

    .scan-count {
      background: #28a745;
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
    }

    .scanner-section {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      margin-bottom: 20px;
    }

    .qr-reader {
      width: 100%;
      max-width: 400px;
      margin: 0 auto 20px auto;
    }

    .scanner-controls {
      text-align: center;
    }

    .manual-input-section {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      margin-bottom: 20px;
    }

    .manual-input-section h3 {
      margin: 0 0 10px 0;
      color: #333;
    }

    .input-help {
      margin: 0 0 15px 0;
      color: #666;
      font-size: 14px;
      font-style: italic;
    }

    .input-group {
      display: flex;
      gap: 10px;
    }

    .input-group input {
      flex: 1;
    }

    .search-container {
      position: relative;
      flex: 1;
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

    .recent-scans {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      margin-bottom: 20px;
    }

    .recent-scans h3 {
      margin: 0 0 15px 0;
      color: #333;
    }

    .scans-list {
      max-height: 300px;
      overflow-y: auto;
    }

    .scan-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px;
      border-bottom: 1px solid #eee;
    }

    .scan-item:last-child {
      border-bottom: none;
    }

    .student-name {
      font-weight: bold;
      color: #333;
    }

    .scan-time {
      font-size: 12px;
      color: #666;
    }

    .response-time {
      background: #17a2b8;
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: bold;
    }

    .status-messages {
      margin-bottom: 20px;
    }

    .alert {
      padding: 12px 16px;
      border-radius: 4px;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .alert-success {
      background: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
    }

    .alert-danger {
      background: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
    }

    .alert-info {
      background: #d1ecf1;
      color: #0c5460;
      border: 1px solid #bee5eb;
    }

    .scanner-status {
      text-align: center;
      background: white;
      padding: 15px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .status-indicator {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      color: #dc3545;
    }

    .status-indicator.active {
      color: #28a745;
    }

    .status-indicator i {
      font-size: 12px;
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
    .btn-secondary { background: #6c757d; color: white; }
    .btn-danger { background: #dc3545; color: white; }

    .btn:hover {
      opacity: 0.9;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .form-control {
      padding: 10px 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 16px;
    }

    @media (max-width: 768px) {
      .qr-scanner-container {
        padding: 10px;
      }
      
      .drill-info {
        flex-direction: column;
        gap: 10px;
      }
    }
  `]
})
export class QrScannerComponent implements OnInit, OnDestroy {
  @ViewChild('qrReader', { static: false }) qrReader!: ElementRef;

  drillId: number = 0;
  drillName = '';
  scannerActive = false;
  scannedCount = 0;
  manualStudentId: number | string | null = null;
  searchResults: any[] = [];
  showSearchResults = false;
  searchLoading = false;
  
  recentScans: any[] = [];
  successMessage = '';
  errorMessage = '';
  infoMessage = '';

  private html5QrcodeScanner: Html5QrcodeScanner | null = null;

  constructor(
    private route: ActivatedRoute,
    private drillService: EmergencyDrillService
  ) {}

  ngOnInit() {
    this.drillId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadDrillInfo();
    this.infoMessage = 'Ready to scan QR codes or enter student IDs manually';
  }

  ngOnDestroy() {
    this.stopScanner();
  }

  loadDrillInfo() {
    this.drillService.getDrill(this.drillId).subscribe({
      next: (response) => {
        const drill = response.data.drill;
        this.drillName = drill.drill_name;
        this.scannedCount = drill.participants?.filter((p: any) => p.status === 'scanned' || p.status === 'rescued').length || 0;
      },
      error: (error) => {
        console.error('Error loading drill info:', error);
        this.showError('Failed to load drill information');
      }
    });
  }

  startScanner() {
    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0
    };

    this.html5QrcodeScanner = new Html5QrcodeScanner(
      'qr-reader',
      config,
      false
    );

    this.html5QrcodeScanner.render(
      (decodedText, decodedResult) => {
        this.onScanSuccess(decodedText);
      },
      (errorMessage) => {
        // Handle scan errors silently
      }
    );

    this.scannerActive = true;
    this.infoMessage = 'Scanner active - point camera at QR code';
  }

  stopScanner() {
    if (this.html5QrcodeScanner) {
      this.html5QrcodeScanner.clear();
      this.html5QrcodeScanner = null;
    }
    this.scannerActive = false;
    this.infoMessage = 'Scanner stopped';
  }

  onScanSuccess(decodedText: string) {
    // Extract user ID from QR code
    // Assuming QR code contains user ID or user data
    let userId: number;
    
    try {
      // Try to parse as JSON first (if QR contains user data)
      const userData = JSON.parse(decodedText);
      userId = userData.user_id || userData.id;
    } catch {
      // If not JSON, assume it's just the user ID
      userId = parseInt(decodedText);
    }

    if (isNaN(userId)) {
      this.showError('Invalid QR code - could not extract user ID');
      return;
    }

    this.scanUser(userId);
  }

  scanManualId() {
    if (!this.manualStudentId) {
      this.showError('Please enter a user ID');
      return;
    }

    this.scanUser(this.manualStudentId);
    this.manualStudentId = null;
    this.searchResults = [];
    this.showSearchResults = false;
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
    if (this.manualStudentId && this.manualStudentId.toString().length >= 2) {
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
      this.manualStudentId = result.student_number;
    } else {
      this.manualStudentId = result.user_id;
    }
    
    this.searchResults = [];
    this.showSearchResults = false;
  }

  scanUser(userId: number | string) {
    // Check if the input looks like a student number (long number) or user ID (short number)
    let scanData: any = {
      scan_type: this.scannerActive ? 'qr' : 'manual',
      notes: `Scanned via ${this.scannerActive ? 'QR scanner' : 'manual entry'}`
    };
    
    // If it's a long number (like 136883100330), treat it as student_number
    // If it's a short number (like 76), treat it as user_id
    if (userId.toString().length > 6) {
      scanData.student_number = userId.toString();
    } else {
      scanData.user_id = parseInt(userId.toString());
    }

    this.drillService.scanParticipant(this.drillId, scanData).subscribe({
      next: (response) => {
        const scan = response.data.scan;
        const participant = response.data.participant;
        const responseTime = response.data.response_time;

        this.showSuccess(`User ${participant.user?.full_name || (participant.student?.first_name + ' ' + (participant.student?.last_name || '')) || 'Unknown'} scanned successfully! Response time: ${responseTime}s`);
        
        // Add to recent scans
        this.recentScans.unshift({
          student_name: participant.user?.full_name || (participant.student?.first_name + ' ' + (participant.student?.last_name || '')) || 'Unknown User',
          scan_time: new Date(),
          response_time: responseTime
        });

        // Keep only last 10 scans
        if (this.recentScans.length > 10) {
          this.recentScans = this.recentScans.slice(0, 10);
        }

        this.scannedCount++;
      },
      error: (error) => {
        console.error('Error scanning user:', error);
        this.showError(error.error?.message || 'Failed to scan user');
      }
    });
  }

  showSuccess(message: string) {
    this.successMessage = message;
    this.errorMessage = '';
    this.infoMessage = '';
    
    setTimeout(() => {
      this.successMessage = '';
    }, 5000);
  }

  showError(message: string) {
    this.errorMessage = message;
    this.successMessage = '';
    this.infoMessage = '';
    
    setTimeout(() => {
      this.errorMessage = '';
    }, 5000);
  }

  showInfo(message: string) {
    this.infoMessage = message;
    this.successMessage = '';
    this.errorMessage = '';
  }
}