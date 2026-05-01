import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Html5Qrcode } from 'html5-qrcode';

@Component({
  selector: 'app-qr-scanner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="qr-scanner-container">
      <div class="scanner-header">
        <h3>Scan Student QR Code</h3>
        <p>Position the QR code within the frame</p>
      </div>
      
      <div class="scanner-wrapper">
        <div id="qr-reader" class="qr-reader"></div>
      </div>

      <div class="scanner-status" *ngIf="statusMessage">
        <span [class]="statusClass">{{ statusMessage }}</span>
      </div>

      <div class="scanner-actions">
        <button class="btn btn-secondary" (click)="close()">Cancel</button>
      </div>
    </div>
  `,
  styles: [`
    .qr-scanner-container {
      background: white;
      border-radius: 12px;
      padding: 0;
      max-width: 500px;
      margin: 0 auto;
      overflow: hidden;
    }

    .scanner-header {
      background: linear-gradient(135deg, #052355 0%, #5381b2 100%);
      padding: 1.5rem;
      text-align: center;
      margin-bottom: 0;

      h3 { 
        color: #ffffff; 
        margin: 0 0 0.5rem;
        font-weight: 700;
        font-size: 1.5rem;
      }
      p { 
        color: rgba(255, 255, 255, 0.8); 
        margin: 0; 
        font-size: 0.95rem; 
      }
    }

    .scanner-wrapper {
      background: #000;
      overflow: hidden;
      margin: 1rem 1.5rem;
      border-radius: 8px;
    }

    .qr-reader {
      width: 100%;
      min-height: 300px;
    }

    :host ::ng-deep #qr-reader video {
      width: 100% !important;
      border-radius: 8px;
    }

    :host ::ng-deep #qr-reader__scan_region {
      min-height: 250px;
    }

    :host ::ng-deep #qr-reader__dashboard {
      padding: 10px !important;
    }

    .scanner-status {
      text-align: center;
      padding: 0.75rem;
      margin: 0 1.5rem 1rem;
      border-radius: 8px;

      .success { color: #155724; background: #d4edda; padding: 0.5rem 1rem; border-radius: 4px; }
      .error { color: #721c24; background: #f8d7da; padding: 0.5rem 1rem; border-radius: 4px; }
      .scanning { color: #004085; background: #cce5ff; padding: 0.5rem 1rem; border-radius: 4px; }
    }

    .scanner-actions {
      display: flex;
      justify-content: center;
      padding: 0 1.5rem 1.5rem;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 500;

      &.btn-secondary { background: #6c757d; color: white; &:hover { background: #545b62; } }
    }
  `]
})
export class QrScannerComponent implements OnInit, OnDestroy {
  @Output() scanned = new EventEmitter<any>();
  @Output() cancelled = new EventEmitter<void>();

  private html5QrCode: Html5Qrcode | null = null;
  statusMessage = '';
  statusClass = '';

  ngOnInit(): void {
    this.startScanner();
  }

  ngOnDestroy(): void {
    this.stopScanner();
  }

  async startScanner(): Promise<void> {
    this.statusMessage = 'Initializing camera...';
    this.statusClass = 'scanning';

    try {
      this.html5QrCode = new Html5Qrcode('qr-reader');
      
      await this.html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        (decodedText) => {
          this.onScanSuccess(decodedText);
        },
        () => {
          // QR code not found - this is called frequently, ignore
        }
      );

      this.statusMessage = 'Camera ready. Scanning...';
      this.statusClass = 'scanning';
    } catch (err) {
      // Error starting scanner
      this.statusMessage = 'Failed to access camera. Please allow camera permissions.';
      this.statusClass = 'error';
    }
  }

  async stopScanner(): Promise<void> {
    if (this.html5QrCode) {
      try {
        await this.html5QrCode.stop();
        this.html5QrCode.clear();
      } catch (err) {
        // Error stopping scanner
      }
    }
  }

  onScanSuccess(decodedText: string): void {
    this.statusMessage = 'QR Code detected!';
    this.statusClass = 'success';

    try {
      // Parse the QR code data (it's a JSON string)
      const qrData = JSON.parse(decodedText);
      
      // Stop scanner after successful scan
      this.stopScanner();
      
      // Emit the scanned data
      this.scanned.emit(qrData);
    } catch (err) {
      this.statusMessage = 'Invalid QR code format';
      this.statusClass = 'error';
    }
  }

  close(): void {
    this.stopScanner();
    this.cancelled.emit();
  }
}
