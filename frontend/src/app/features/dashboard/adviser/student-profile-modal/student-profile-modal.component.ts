import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BMIUtils } from '../../../../shared/utils/bmi-utils';

@Component({
  selector: 'app-student-profile-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay" (click)="onOverlayClick($event)" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div class="modal-card">

        <!-- ── Header ── -->
        <div class="modal-header">
          <div class="header-left">
            <div class="avatar-wrap">
              <i class="fa-solid fa-user-graduate"></i>
            </div>
            <div class="header-info">
              <p class="header-label">Student Health Record</p>
              <h2 id="modal-title">{{ student?.name || '—' }}</h2>
              <div class="header-meta">
                <span class="badge badge-id">{{ student?.studentNumber || 'N/A' }}</span>
                <span class="badge badge-section">{{ student?.gradeSection || 'N/A' }}</span>
              </div>
            </div>
          </div>
          <button class="close-btn" (click)="close.emit()" aria-label="Close">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <!-- ── Body ── -->
        <div class="modal-body">

          <!-- Personal Information -->
          <section class="record-section">
            <div class="section-title">
              <i class="fa-solid fa-id-card"></i>
              <span>Personal Information</span>
            </div>
            <div class="field-grid">
              <div class="field">
                <span class="field-label">Full Name</span>
                <span class="field-value">{{ student?.name || '—' }}</span>
              </div>
              <div class="field">
                <span class="field-label">Student No.</span>
                <span class="field-value mono">{{ student?.studentNumber || '—' }}</span>
              </div>
              <div class="field">
                <span class="field-label">Grade & Section</span>
                <span class="field-value">{{ student?.gradeSection || '—' }}</span>
              </div>
              <div class="field">
                <span class="field-label">Gender</span>
                <span class="field-value">{{ formatGender(student?.gender) }}</span>
              </div>
              <div class="field">
                <span class="field-label">Date of Birth</span>
                <span class="field-value">{{ formatDate(student?.birthday) }}</span>
              </div>
              <div class="field">
                <span class="field-label">Age</span>
                <span class="field-value">{{ student?.age ? student.age + ' years old' : '—' }}</span>
              </div>
              <div class="field">
                <span class="field-label">Contact No.</span>
                <span class="field-value">{{ student?.contact || '—' }}</span>
              </div>
            </div>
          </section>

          <div class="divider"></div>

          <!-- Health & Vitals -->
          <section class="record-section">
            <div class="section-title">
              <i class="fa-solid fa-heart-pulse"></i>
              <span>Health & Vitals</span>
            </div>
            <div class="vitals-grid">
              <div class="vital-card">
                <i class="fa-solid fa-droplet vital-icon blood"></i>
                <span class="vital-label">Blood Type</span>
                <span class="vital-value">{{ student?.vitals?.bloodType || '—' }}</span>
              </div>
              <div class="vital-card">
                <i class="fa-solid fa-ruler-vertical vital-icon height"></i>
                <span class="vital-label">Height</span>
                <span class="vital-value">{{ student?.vitals?.height || '—' }}</span>
              </div>
              <div class="vital-card">
                <i class="fa-solid fa-weight-scale vital-icon weight"></i>
                <span class="vital-label">Weight</span>
                <span class="vital-value">{{ student?.vitals?.weight || '—' }}</span>
              </div>
              <div class="vital-card" [ngClass]="getBmiClass(student?.vitals?.bmi)">
                <i class="fa-solid fa-chart-simple vital-icon bmi"></i>
                <span class="vital-label">BMI</span>
                <span class="vital-value">{{ formatBMI(student?.vitals?.bmi) }}</span>
              </div>
            </div>
          </section>

          <div class="divider"></div>

          <!-- Allergies -->
          <section class="record-section">
            <div class="section-title">
              <i class="fa-solid fa-triangle-exclamation"></i>
              <span>Known Allergies</span>
            </div>
            <div *ngIf="student?.allergies?.length > 0" class="allergy-list">
              <span class="allergy-chip" *ngFor="let a of getAllergyNames(student?.allergies)">
                <i class="fa-solid fa-circle-exclamation"></i> {{ a }}
              </span>
            </div>
            <p class="empty-note" *ngIf="!student?.allergies?.length">
              <i class="fa-solid fa-circle-check" style="color:#22c55e"></i>
              No known allergies on record.
            </p>
          </section>

          <div class="divider"></div>

          <!-- Emergency Contact -->
          <section class="record-section">
            <div class="section-title">
              <i class="fa-solid fa-phone-volume"></i>
              <span>Emergency Contact</span>
            </div>
            <div class="contact-card">
              <div class="contact-row">
                <span class="contact-label">Name</span>
                <span class="contact-val">{{ student?.emergencyContact?.name || '—' }}</span>
              </div>
              <div class="contact-row">
                <span class="contact-label">Relationship</span>
                <span class="contact-val">{{ student?.emergencyContact?.relation || '—' }}</span>
              </div>
              <div class="contact-row">
                <span class="contact-label">Phone</span>
                <span class="contact-val phone">{{ student?.emergencyContact?.phone || '—' }}</span>
              </div>
            </div>
          </section>

          <div class="divider"></div>

          <!-- Recent Clinic Visits -->
          <section class="record-section">
            <div class="section-title">
              <i class="fa-solid fa-hospital-user"></i>
              <span>Recent Clinic Visits</span>
            </div>
            <div *ngIf="getVisits().length > 0" class="visits-table">
              <div class="visit-row header-row">
                <span>Date</span>
                <span>Complaint / Reason</span>
                <span>Status</span>
              </div>
              <div class="visit-row" *ngFor="let v of getVisits()">
                <span class="visit-date">{{ formatVisitDate(v) }}</span>
                <span class="visit-reason">{{ getVisitReason(v) }}</span>
                <span class="visit-status" [ngClass]="getStatusClass(v)">{{ getStatusLabel(v) }}</span>
              </div>
            </div>
            <p class="empty-note" *ngIf="!getVisits().length">
              <i class="fa-solid fa-calendar-xmark" style="color:#94a3b8"></i>
              No clinic visits on record.
            </p>
          </section>

        </div>

        <!-- ── Footer ── -->
        <div class="modal-footer">
          <span class="footer-note">
            <i class="fa-solid fa-lock"></i> Confidential — For authorized personnel only
          </span>
          <button class="btn-close-footer" (click)="close.emit()">Close Record</button>
        </div>

      </div>
    </div>
  `,
  styles: [`
    /* ── Overlay ── */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(5, 15, 40, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 1rem;
      backdrop-filter: blur(3px);
    }

    /* ── Card ── */
    .modal-card {
      background: #fff;
      border-radius: 16px;
      width: 100%;
      max-width: 580px;
      max-height: 92vh;
      overflow-y: auto;
      box-shadow: 0 40px 100px rgba(0,0,0,0.28);
      display: flex;
      flex-direction: column;
    }

    /* ── Header ── */
    .modal-header {
      background: linear-gradient(135deg, #052355 0%, #1a4a8a 60%, #5381b2 100%);
      padding: 1.5rem 1.5rem 1.75rem;
      border-radius: 16px 16px 0 0;
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1rem;
      position: relative;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .avatar-wrap {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: rgba(255,255,255,0.15);
      border: 2px solid rgba(255,255,255,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      font-size: 1.8rem;
      color: rgba(255,255,255,0.9);
    }

    .header-info {
      .header-label {
        margin: 0 0 0.2rem;
        font-size: 0.7rem;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: rgba(255,255,255,0.6);
        font-weight: 600;
      }
      h2 {
        margin: 0 0 0.5rem;
        font-size: 1.25rem;
        font-weight: 700;
        color: #fff;
        letter-spacing: -0.01em;
      }
      .header-meta {
        display: flex;
        gap: 0.4rem;
        flex-wrap: wrap;
      }
    }

    .badge {
      padding: 0.2rem 0.65rem;
      border-radius: 999px;
      font-size: 0.72rem;
      font-weight: 600;
      letter-spacing: 0.03em;

      &.badge-id {
        background: rgba(255,255,255,0.15);
        color: rgba(255,255,255,0.9);
        font-family: 'Courier New', monospace;
        border: 1px solid rgba(255,255,255,0.2);
      }
      &.badge-section {
        background: rgba(255,255,255,0.12);
        color: rgba(255,255,255,0.85);
        border: 1px solid rgba(255,255,255,0.18);
      }
    }

    .close-btn {
      background: rgba(255,255,255,0.12);
      border: 1px solid rgba(255,255,255,0.2);
      color: rgba(255,255,255,0.85);
      width: 32px;
      height: 32px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 0.9rem;
      transition: all 0.2s;
      flex-shrink: 0;
      margin-top: 2px;

      &:hover { background: rgba(255,255,255,0.22); color: #fff; }
    }

    /* ── Body ── */
    .modal-body {
      padding: 0;
      flex: 1;
    }

    .divider {
      height: 1px;
      background: #f1f5f9;
      margin: 0 1.5rem;
    }

    /* ── Section ── */
    .record-section {
      padding: 1.25rem 1.5rem;
    }

    .section-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1rem;
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #052355;

      i { font-size: 0.75rem; color: #5381b2; }
    }

    /* ── Field Grid ── */
    .field-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.9rem 1.5rem;
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;

      .field-label {
        font-size: 0.68rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: #94a3b8;
      }
      .field-value {
        font-size: 0.9rem;
        font-weight: 600;
        color: #0f172a;

        &.mono { font-family: 'Courier New', monospace; font-size: 0.85rem; }
      }
    }

    /* ── Vitals ── */
    .vitals-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0.75rem;
    }

    .vital-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 0.85rem 0.75rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.3rem;
      text-align: center;
      transition: border-color 0.2s;

      &.bmi-normal  { border-color: #bbf7d0; background: #f0fdf4; }
      &.bmi-warning { border-color: #fde68a; background: #fffbeb; }
      &.bmi-danger  { border-color: #fecaca; background: #fef2f2; }

      .vital-icon {
        font-size: 1.1rem;
        margin-bottom: 0.1rem;

        &.blood  { color: #ef4444; }
        &.height { color: #3b82f6; }
        &.weight { color: #8b5cf6; }
        &.bmi    { color: #f59e0b; }
      }
      .vital-label {
        font-size: 0.65rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: #94a3b8;
      }
      .vital-value {
        font-size: 0.9rem;
        font-weight: 700;
        color: #0f172a;
      }
    }

    /* ── Allergies ── */
    .allergy-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
    }

    .allergy-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      background: #fff7ed;
      color: #c2410c;
      border: 1px solid #fed7aa;
      padding: 0.3rem 0.75rem;
      border-radius: 999px;
      font-size: 0.8rem;
      font-weight: 600;

      i { font-size: 0.7rem; }
    }

    .empty-note {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #94a3b8;
      font-size: 0.875rem;
      font-style: italic;
      margin: 0;
    }

    /* ── Emergency Contact ── */
    .contact-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      overflow: hidden;
    }

    .contact-row {
      display: flex;
      align-items: center;
      padding: 0.65rem 1rem;
      border-bottom: 1px solid #f1f5f9;

      &:last-child { border-bottom: none; }

      .contact-label {
        width: 110px;
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: #94a3b8;
        flex-shrink: 0;
      }
      .contact-val {
        font-size: 0.875rem;
        font-weight: 600;
        color: #0f172a;

        &.phone { color: #1d4ed8; }
      }
    }

    /* ── Visits Table ── */
    .visits-table {
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      overflow: hidden;
    }

    .visit-row {
      display: grid;
      grid-template-columns: 110px 1fr 90px;
      gap: 0.5rem;
      padding: 0.65rem 1rem;
      border-bottom: 1px solid #f1f5f9;
      align-items: center;

      &:last-child { border-bottom: none; }

      &.header-row {
        background: #f8fafc;
        font-size: 0.68rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: #64748b;
      }

      .visit-date {
        font-size: 0.8rem;
        color: #64748b;
        font-weight: 500;
      }
      .visit-reason {
        font-size: 0.875rem;
        color: #1e293b;
        font-weight: 500;
      }
      .visit-status {
        padding: 0.2rem 0.55rem;
        border-radius: 999px;
        font-size: 0.68rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        text-align: center;

        &.status-open      { background: #fef9c3; color: #a16207; }
        &.status-closed    { background: #dcfce7; color: #15803d; }
        &.status-emergency { background: #fee2e2; color: #b91c1c; }
        &.status-default   { background: #f1f5f9; color: #64748b; }
      }
    }

    /* ── Footer ── */
    .modal-footer {
      padding: 1rem 1.5rem;
      border-top: 1px solid #f1f5f9;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      background: #fafbfc;
      border-radius: 0 0 16px 16px;

      .footer-note {
        font-size: 0.72rem;
        color: #94a3b8;
        display: flex;
        align-items: center;
        gap: 0.35rem;
        font-style: italic;

        i { font-size: 0.65rem; }
      }
    }

    .btn-close-footer {
      background: linear-gradient(135deg, #052355 0%, #5381b2 100%);
      color: #fff;
      border: none;
      padding: 0.55rem 1.25rem;
      border-radius: 8px;
      font-size: 0.82rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s;
      box-shadow: 0 2px 8px rgba(5,35,85,0.2);

      &:hover { box-shadow: 0 4px 12px rgba(5,35,85,0.3); transform: translateY(-1px); }
    }

    /* ── Responsive ── */
    @media (max-width: 540px) {
      .vitals-grid { grid-template-columns: repeat(2, 1fr); }
      .field-grid  { grid-template-columns: 1fr; }
      .visit-row   { grid-template-columns: 90px 1fr 80px; }
      .modal-footer { flex-direction: column; align-items: flex-start; }
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

  getBmiClass(bmi: any): string {
    if (!bmi) return '';
    const val = parseFloat(bmi);
    if (isNaN(val)) return '';
    if (val < 18.5 || val >= 25) return val >= 30 ? 'bmi-danger' : 'bmi-warning';
    return 'bmi-normal';
  }

  formatGender(g: string): string {
    if (!g) return '—';
    if (g === 'M') return 'Male';
    if (g === 'F') return 'Female';
    return g;
  }

  formatDate(d: string): string {
    if (!d) return '—';
    try {
      return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch { return d; }
  }

  formatVisitDate(v: any): string {
    const raw = v.visit_datetime || v.visit_date || v.date;
    if (!raw) return '—';
    try {
      return new Date(raw).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch { return raw; }
  }

  getVisitReason(v: any): string {
    return v.chief_complaint || v.complaint || v.reason || v.diagnosis || 'General visit';
  }

  getStatusClass(v: any): string {
    const s = (v.status || '').toLowerCase();
    if (s === 'open' || s === 'pending') return 'status-open';
    if (s === 'closed' || s === 'resolved') return 'status-closed';
    if (s === 'emergency') return 'status-emergency';
    return 'status-default';
  }

  getStatusLabel(v: any): string {
    const s = (v.status || '').toLowerCase();
    if (s === 'open') return 'Open';
    if (s === 'closed') return 'Closed';
    if (s === 'emergency') return 'Emergency';
    return v.status || 'N/A';
  }

  getVisits(): any[] {
    return this.student?.recentVisits?.length
      ? this.student.recentVisits
      : (this.student?.lastVisit ? [this.student.lastVisit] : []);
  }

  getAllergyNames(allergies: any[]): string[] {
    if (!allergies?.length) return [];
    return allergies.map(a =>
      typeof a === 'string' ? a : (a.allergy_name || a.allergy_text || a.name || String(a))
    ).filter(Boolean);
  }
}
