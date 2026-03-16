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
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
    }

    .modal-content {
      background: white;
      border-radius: 16px;
      max-width: 500px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
      position: relative;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }

    .close-btn {
      position: absolute;
      top: 15px;
      right: 15px;
      background: white;
      border: none;
      width: 35px;
      height: 35px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      color: #666;
      transition: all 0.2s;
      
      &:hover {
        background: #e8eaed;
        color: #202124;
      }
    }

    .modal-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.5rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 16px 16px 0 0;
      
      .student-avatar {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        overflow: hidden;
        border: 3px solid rgba(255,255,255,0.3);
        
        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
      }
      
      .student-header-info {
        h2 {
          margin: 0 0 0.25rem 0;
          font-size: 1.4rem;
          font-weight: 600;
        }
        
        .student-number {
          margin: 0;
          opacity: 0.9;
          font-size: 0.95rem;
        }
        
        .student-section {
          margin: 0;
          opacity: 0.8;
          font-size: 0.85rem;
        }
      }
    }

    .info-section {
      margin-bottom: 1.5rem;
      border-bottom: 1px solid #e9ecef;
      
      &:last-child {
        border-bottom: none;
      }
      
      h3 {
        font-size: 1.1rem;
        color: #2c3e50;
        margin-bottom: 1rem;
        font-weight: 600;
        padding-bottom: 0.5rem;
        border-bottom: 2px solid #e9ecef;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.75rem;
      
      .info-item {
        .label {
          display: block;
          font-size: 0.75rem;
          color: #6c757d;
          margin-bottom: 0.2rem;
        }
        
        .value {
          display: block;
          font-size: 0.95rem;
          color: #212529;
          font-weight: 500;
        }
      }
    }

    .allergy-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      
      .allergy-tag {
        background: #fff3cd;
        color: #856404;
        padding: 0.35rem 0.75rem;
        border-radius: 15px;
        font-size: 0.85rem;
        font-weight: 500;
      }
    }

    .no-data {
      color: #6c757d;
      font-size: 0.9rem;
      font-style: italic;
      margin: 0;
    }

    .emergency-contact {
      background: #f8f9fa;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      
      .contact-name {
        font-weight: 600;
        color: #212529;
        font-size: 0.95rem;
      }
      
      .contact-relation {
        color: #6c757d;
        font-size: 0.85rem;
      }
      
      .contact-phone {
        color: #007bff;
        font-size: 0.9rem;
        margin-top: 0.25rem;
      }
    }

    .visits-list {
      .visit-item {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 0.75rem;
        background: #f8f9fa;
        border-radius: 8px;
        margin-bottom: 0.5rem;
        
        &:last-child {
          margin-bottom: 0;
        }
        
        .visit-date {
          font-size: 0.85rem;
          color: #495057;
          min-width: 100px;
        }
        
        .visit-reason {
          flex: 1;
          font-size: 0.9rem;
          color: #212529;
        }
        
        .visit-status {
          padding: 0.25rem 0.6rem;
          border-radius: 10px;
          font-size: 0.75rem;
          font-weight: 600;
          
          &.resolved {
            background: #d4edda;
            color: #155724;
          }
          
          &.ongoing {
            background: #fff3cd;
            color: #856404;
          }
          
          &.follow-up {
            background: #d1ecf1;
            color: #0c5460;
          }
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
