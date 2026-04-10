import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BMIUtils } from '../../../../shared/utils/bmi-utils';

@Component({
  selector: 'app-student-profile-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay" (click)="onOverlayClick($event)">
      <div class="modal-content">
        <button class="close-btn" (click)="close.emit()"><i class="fa-solid fa-xmark"></i></button>
        
        <!-- Header -->
        <div class="modal-header">
          <div class="student-avatar">
            <img [src]="student?.avatar || 'assets/user-male.png'" [alt]="student?.name">
          </div>
          <div class="student-header-info">
            <h2>{{ student?.name }}</h2>
            <p class="student-number">{{ student?.studentNumber }}</p>
            <p class="student-section">{{ student?.gradeSection }}</p>
          </div>
        </div>

        <!-- Basic Info -->
        <div class="info-section">
          <h3><i class="fa-solid fa-clipboard-list"></i> Basic Information</h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">Gender</span>
              <span class="value">{{ student?.gender || 'Female' }}</span>
            </div>
            <div class="info-item">
              <span class="label">Birthday</span>
              <span class="value">{{ student?.birthday || 'Jan 15, 2007' }}</span>
            </div>
            <div class="info-item">
              <span class="label">Age</span>
              <span class="value">{{ student?.age || '17' }} years old</span>
            </div>
            <div class="info-item">
              <span class="label">Contact</span>
              <span class="value">{{ student?.contact || '09123456789' }}</span>
            </div>
          </div>
        </div>

        <!-- Health Summary -->
        <div class="info-section">
          <h3><i class="fa-solid fa-notes-medical"></i> Health Summary</h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">Blood Type</span>
              <span class="value">{{ student?.vitals?.bloodType || 'O+' }}</span>
            </div>
            <div class="info-item">
              <span class="label">Height</span>
              <span class="value">{{ student?.vitals?.height || '162 cm' }}</span>
            </div>
            <div class="info-item">
              <span class="label">Weight</span>
              <span class="value">{{ student?.vitals?.weight || '52 kg' }}</span>
            </div>
            <div class="info-item">
              <span class="label">BMI</span>
              <span class="value">{{ formatBMI(student?.vitals?.bmi) }}</span>
            </div>
          </div>
        </div>

        <!-- Allergies -->
        <div class="info-section" *ngIf="student?.allergies?.length > 0">
          <h3><i class="fa-solid fa-triangle-exclamation"></i> Allergies</h3>
          <div class="allergy-tags">
            <span class="allergy-tag" *ngFor="let allergy of student?.allergies">{{ allergy }}</span>
          </div>
        </div>
        <div class="info-section" *ngIf="!student?.allergies?.length">
          <h3><i class="fa-solid fa-triangle-exclamation"></i> Allergies</h3>
          <p class="no-data">No known allergies</p>
        </div>

        <!-- Emergency Contact -->
        <div class="info-section">
          <h3><i class="fa-solid fa-phone"></i> Emergency Contact</h3>
          <div class="emergency-contact">
            <div class="contact-name">{{ student?.emergencyContact?.name || 'Not provided' }}</div>
            <div class="contact-relation">{{ student?.emergencyContact?.relation || 'N/A' }}</div>
            <div class="contact-phone">{{ student?.emergencyContact?.phone || 'N/A' }}</div>
          </div>
        </div>

        <!-- Recent Clinic Visits -->
        <div class="info-section">
          <h3><i class="fa-solid fa-hospital"></i> Recent Clinic Visits</h3>
          <div class="visits-list" *ngIf="student?.recentVisits?.length > 0">
            <div class="visit-item" *ngFor="let visit of student?.recentVisits">
              <div class="visit-date">{{ visit.date }}</div>
              <div class="visit-reason">{{ visit.reason }}</div>
              <div class="visit-status" [ngClass]="visit.status">{{ visit.statusText }}</div>
            </div>
          </div>
          <div class="visits-list" *ngIf="!student?.recentVisits?.length">
            <div class="visit-item" *ngIf="student?.lastVisit">
              <div class="visit-date">{{ student.lastVisit.date }}</div>
              <div class="visit-reason">{{ student.lastVisit.reason }}</div>
              <div class="visit-status" [ngClass]="student.lastVisit.status">{{ student.lastVisit.statusText }}</div>
            </div>
            <p class="no-data" *ngIf="!student?.lastVisit">No clinic visits recorded</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(15, 23, 42, 0.55);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
      backdrop-filter: blur(2px);
    }

    .modal-content {
      background: #fff;
      border-radius: 16px;
      max-width: 480px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
      position: relative;
      box-shadow: 0 32px 80px rgba(0, 0, 0, 0.22);
    }

    .close-btn {
      position: absolute;
      top: 12px;
      right: 12px;
      background: rgba(255,255,255,0.18);
      border: none;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.95rem;
      cursor: pointer;
      color: #fff;
      transition: background 0.2s;
      z-index: 10;

      &:hover { background: rgba(255,255,255,0.32); }
    }

    /* ── Header ── */
    .modal-header {
      display: flex;
      align-items: center;
      gap: 1.1rem;
      padding: 1.5rem 1.5rem 1.75rem;
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      border-radius: 16px 16px 0 0;
      color: #fff;

      .student-avatar {
        width: 72px;
        height: 72px;
        border-radius: 50%;
        overflow: hidden;
        border: 2.5px solid rgba(255,255,255,0.4);
        flex-shrink: 0;
        background: rgba(255,255,255,0.15);

        img { width: 100%; height: 100%; object-fit: cover; }
      }

      .student-header-info {
        h2 {
          margin: 0 0 0.2rem;
          font-size: 1.2rem;
          font-weight: 700;
          letter-spacing: -0.01em;
        }
        .student-number {
          margin: 0 0 0.15rem;
          font-size: 0.82rem;
          opacity: 0.85;
          font-family: 'Courier New', monospace;
          letter-spacing: 0.04em;
        }
        .student-section {
          margin: 0;
          font-size: 0.8rem;
          opacity: 0.75;
        }
      }
    }

    /* ── Sections ── */
    .info-section {
      padding: 1.1rem 1.5rem;
      border-bottom: 1px solid #f1f5f9;

      &:last-child { border-bottom: none; padding-bottom: 1.5rem; }

      h3 {
        font-size: 0.72rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: #64748b;
        margin: 0 0 0.9rem;
        display: flex;
        align-items: center;
        gap: 0.45rem;

        i { font-size: 0.75rem; color: #94a3b8; }
      }
    }

    /* ── Info Grid ── */
    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.85rem 1rem;

      .info-item {
        .label {
          display: block;
          font-size: 0.72rem;
          color: #94a3b8;
          margin-bottom: 0.2rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .value {
          display: block;
          font-size: 0.92rem;
          color: #0f172a;
          font-weight: 600;
        }
      }
    }

    /* ── Allergy Tags ── */
    .allergy-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;

      .allergy-tag {
        background: #fef3c7;
        color: #92400e;
        border: 1px solid #fde68a;
        padding: 0.25rem 0.7rem;
        border-radius: 999px;
        font-size: 0.8rem;
        font-weight: 600;
      }
    }

    .no-data {
      color: #94a3b8;
      font-size: 0.875rem;
      font-style: italic;
      margin: 0;
    }

    /* ── Emergency Contact ── */
    .emergency-contact {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 0.85rem 1rem;

      .contact-name {
        font-weight: 700;
        color: #0f172a;
        font-size: 0.92rem;
        margin-bottom: 0.2rem;
      }
      .contact-relation {
        color: #64748b;
        font-size: 0.8rem;
        margin-bottom: 0.2rem;
      }
      .contact-phone {
        color: #4f46e5;
        font-size: 0.85rem;
        font-weight: 600;
      }
    }

    /* ── Visits ── */
    .visits-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;

      .visit-item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.7rem 0.9rem;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;

        .visit-date {
          font-size: 0.78rem;
          color: #64748b;
          min-width: 90px;
          font-weight: 500;
        }
        .visit-reason {
          flex: 1;
          font-size: 0.875rem;
          color: #1e293b;
          font-weight: 500;
        }
        .visit-status {
          padding: 0.2rem 0.6rem;
          border-radius: 999px;
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;

          &.resolved  { background: #dcfce7; color: #15803d; }
          &.ongoing   { background: #fef9c3; color: #a16207; }
          &.follow-up { background: #dbeafe; color: #1d4ed8; }
        }
      }
    }
  `]
})
export class StudentProfileModalComponent {
  @Input() student: any;
  @Output() close = new EventEmitter<void>();

  onOverlayClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.close.emit();
    }
  }

  formatBMI(bmi: any): string {
    return BMIUtils.formatBMI(bmi);
  }
}
