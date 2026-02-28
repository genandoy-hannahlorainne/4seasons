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
        <h3>Manual Student ID Entry</h3>
        <div class="input-group">
          <input type="number" 
                 [(ngModel)]="manualStudentId" 
                 class="form-control" 
                 placeholder="Enter Student ID"
                 (keyup.enter)="scanManualId()">
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
      margin: 0 0 15px 0;
      color: #333;
    }

    .input-group {
      display: flex;
      gap: 10px;
    }

    .input-group input {
      flex: 1;
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
  manualStudentId: number | null = null;
  
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
    // Extract student ID from QR code
    // Assuming QR code contains student ID or student data
    let studentId: number;
    
    try {
      // Try to parse as JSON first (if QR contains student data)
      const studentData = JSON.parse(decodedText);
      studentId = studentData.student_id || studentData.id;
    } catch {
      // If not JSON, assume it's just the student ID
      studentId = parseInt(decodedText);
    }

    if (isNaN(studentId)) {
      this.showError('Invalid QR code - could not extract student ID');
      return;
    }

    this.scanStudent(studentId);
  }

  scanManualId() {
    if (!this.manualStudentId) {
      this.showError('Please enter a student ID');
      return;
    }

    this.scanStudent(this.manualStudentId);
    this.manualStudentId = null;
  }

  scanStudent(studentId: number) {
    const scanData = {
      student_id: studentId,
      scan_type: this.scannerActive ? 'qr' : 'manual',
      notes: `Scanned via ${this.scannerActive ? 'QR scanner' : 'manual entry'}`
    };

    this.drillService.scanParticipant(this.drillId, scanData).subscribe({
      next: (response) => {
        const scan = response.data.scan;
        const participant = response.data.participant;
        const responseTime = response.data.response_time;

        this.showSuccess(`Student ${participant.student?.full_name || (participant.student?.first_name + ' ' + (participant.student?.last_name || '')) || 'Unknown'} scanned successfully! Response time: ${responseTime}s`);
        
        // Add to recent scans
        this.recentScans.unshift({
          student_name: participant.student?.full_name || (participant.student?.first_name + ' ' + (participant.student?.last_name || '')) || 'Unknown Student',
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
        console.error('Error scanning student:', error);
        this.showError(error.error?.message || 'Failed to scan student');
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