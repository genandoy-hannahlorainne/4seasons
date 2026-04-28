import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminService } from '../../../../core/services/admin.service';

interface PromotionSummary {
  grade_level_id: number;
  level_name: string;
  total_students: number;
}

interface TargetSection {
  level_number: number;
  level_name: string;
  total_sections: number;
  total_capacity: number;
  current_enrollment: number;
  sections_with_advisers: number;
  sections_without_advisers: number;
}

interface AdviserAssignmentStatus {
  total_sections: number;
  sections_with_advisers: number;
  sections_without_advisers: number;
  all_assigned: boolean;
}

@Component({
  selector: 'app-grade-promotion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="promotion-container">
      <div class="page-header">
        <h2>Grade Promotion Management</h2>
        <p>Promote students from one school year to the next</p>
      </div>

      <!-- Setup Card -->
      <div class="card setup-card">
        <div class="card-title">
          <img src="assets/icons/calendar.png" style="width:20px;height:20px;object-fit:contain;flex-shrink:0;" alt="Calendar">
          Select School Years
        </div>
        <div class="year-selectors">
          <div class="form-group">
            <label>From (Current)</label>
            <select [(ngModel)]="currentSchoolYearId" (change)="onCurrentYearChange()" class="form-select">
              <option value="">-- Select --</option>
              <option *ngFor="let year of schoolYears" [value]="year.id">{{ year.year_name }}</option>
            </select>
          </div>
          <div class="arrow-divider">
            <i class="fa-solid fa-arrow-right"></i>
          </div>
          <div class="form-group">
            <label>To (Target)</label>
            <select [(ngModel)]="targetSchoolYearId" (change)="onTargetYearChange()" class="form-select">
              <option value="">-- Select --</option>
              <option *ngFor="let year of schoolYears" [value]="year.id">{{ year.year_name }}</option>
            </select>
          </div>
          <button (click)="loadPromotionSummary()" class="btn-load" [disabled]="isLoadingSummary || !currentSchoolYearId || !targetSchoolYearId">
            <i class="fa-solid fa-magnifying-glass"></i>
            {{ isLoadingSummary ? 'Loading...' : 'Load Summary' }}
          </button>
        </div>
      </div>

      <!-- Summary Section -->
      <div *ngIf="summaryLoaded">

        <!-- Top Row: Summary + Capacity side by side -->
        <div class="two-col-row">

          <!-- Promotion Summary -->
          <div class="card">
            <div class="card-title">
              <i class="fa-solid fa-users"></i>
              Promotion Summary
              <span class="badge-total">{{ getTotalStudents() }} total students</span>
            </div>
            <div class="summary-grid">
              <div class="summary-card" *ngFor="let item of promotionSummary">
                <div class="summary-icon"><i class="fa-solid fa-graduation-cap"></i></div>
                <div class="summary-info">
                  <div class="summary-grade">{{ item.level_name }}</div>
                  <div class="summary-count">{{ item.total_students }}</div>
                  <div class="summary-label">students</div>
                </div>
              </div>
              <div *ngIf="promotionSummary?.length === 0" class="empty-state">
                <i class="fa-solid fa-inbox"></i>
                <p>No enrolled students found for the selected school year.</p>
              </div>
            </div>
          </div>

          <!-- Target Year Capacity -->
          <div class="card">
            <div class="card-title">
              <i class="fa-solid fa-table"></i>
              Target Year Capacity
              <span class="year-label">{{ getYearName(targetSchoolYearId) }}</span>
              <div style="margin-left:auto;flex-shrink:0;">
                <button *ngIf="targetSections?.length === 0" class="btn-copy-trigger" (click)="openCopyModal()">
                  <i class="fa-solid fa-copy"></i> Copy Sections
                </button>
                <button *ngIf="targetSections && targetSections.length > 0" class="btn-copy-trigger secondary" (click)="openCopyModal()">
                  <i class="fa-solid fa-copy"></i> Re-copy Sections
                </button>
              </div>
            </div>

            <div *ngIf="targetSections?.length === 0" class="empty-state warning">
              <div class="warning-content">
                <img src="assets/icons/warning.png" style="width:48px;height:48px;object-fit:contain;" alt="Warning">
                <div class="warning-text">
                  <strong>No Sections Found</strong>
                  <p>The target school year <span class="year-highlight">{{ getYearName(targetSchoolYearId) }}</span> has no sections yet. Copy sections from the current year to get started.</p>
                </div>
              </div>
            </div>

            <div *ngIf="targetSections && targetSections.length > 0" class="capacity-table-wrapper">
              <table class="capacity-table">
                <thead>
                  <tr>
                    <th>Grade Level</th>
                    <th>Sections</th>
                    <th>Capacity</th>
                    <th>Enrolled</th>
                    <th>Available</th>
                    <th>Advisers</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let section of targetSections">
                    <td><span class="grade-chip">{{ section.level_name }}</span></td>
                    <td>{{ section.total_sections }}</td>
                    <td>{{ section.total_capacity }}</td>
                    <td>{{ section.current_enrollment }}</td>
                    <td>
                      <span class="available-badge" [class.low]="(section.total_capacity - section.current_enrollment) < 10">
                        {{ section.total_capacity - section.current_enrollment }}
                      </span>
                    </td>
                    <td>
                      <span class="adviser-status" [class.partial]="section.sections_without_advisers > 0" [class.full]="section.sections_without_advisers === 0">
                        {{ section.sections_with_advisers }}/{{ section.total_sections }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>

        <!-- Adviser Status -->
        <div class="card" *ngIf="targetSections && targetSections.length > 0 && adviserAssignmentStatus">
          <div class="card-title">
            <i class="fa-solid fa-chalkboard-teacher"></i>
            Adviser Assignment Status
          </div>
          <div class="status-grid">
            <div class="status-card neutral">
              <div class="status-value">{{ getTotalSections() }}</div>
              <div class="status-label">Total Sections</div>
            </div>
            <div class="status-card success">
              <div class="status-value">{{ getSectionsWithAdvisers() }}</div>
              <div class="status-label">With Advisers</div>
            </div>
            <div class="status-card" [class.warning]="getSectionsWithoutAdvisers() > 0" [class.neutral]="getSectionsWithoutAdvisers() === 0">
              <div class="status-value">{{ getSectionsWithoutAdvisers() }}</div>
              <div class="status-label">Without Advisers</div>
            </div>
          </div>
          <div class="warning-message" *ngIf="getSectionsWithoutAdvisers() > 0">
            <i class="fa-solid fa-triangle-exclamation"></i>
            <span>{{ getSectionsWithoutAdvisers() }} section(s) don't have advisers assigned. Students promoted to these sections won't have advisers.</span>
          </div>
        </div>

        <!-- Manual Cases -->
        <div class="card" *ngIf="manualCases.length > 0">
          <div class="card-title">
            <i class="fa-solid fa-user-pen"></i>
            Students Needing Manual Adjustment
            <span class="badge-total">{{ manualCases.length }}</span>
          </div>
          <div class="capacity-table-wrapper">
            <table class="capacity-table">
              <thead>
                <tr>
                  <th>Student ID</th>
                  <th>Name</th>
                  <th>Current Grade</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let student of manualCases">
                  <td>{{ student.student_id }}</td>
                  <td>{{ student.first_name }} {{ student.last_name }}</td>
                  <td>{{ student.level_name }}</td>
                  <td><span [class]="'status-pill status-' + student.enrollment_status">{{ student.enrollment_status }}</span></td>
                  <td><button (click)="openManualAdjustment(student)" class="btn-small">Adjust</button></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Actions -->
      </div>

      <!-- Actions (outside summaryLoaded) -->
      <div *ngIf="summaryLoaded" class="promotion-actions-bar">
        <button (click)="cancelPromotion()" class="btn-cancel">
          <i class="fa-solid fa-xmark"></i> Cancel
        </button>
        <button (click)="confirmPromotion()" class="btn-execute" [disabled]="isProcessing">
          <i class="fa-solid fa-bolt"></i>
          {{ isProcessing ? 'Processing...' : 'Execute Promotion' }}
        </button>
      </div>

      <!-- Result -->
      <div *ngIf="promotionResult" class="result-card" [class.success]="promotionResult.success" [class.error]="!promotionResult.success">
        <div class="result-icon">
          <i [class]="promotionResult.success ? 'fa-solid fa-circle-check' : 'fa-solid fa-circle-xmark'"></i>
        </div>
        <div class="result-body">
          <h3>{{ promotionResult.success ? 'Promotion Completed' : 'Promotion Failed' }}</h3>
          <p>{{ promotionResult.message }}</p>
          <div *ngIf="promotionResult.stats" class="result-stats">
            <div class="result-stat"><span>{{ promotionResult.stats.promoted_count }}</span> Promoted</div>
            <div class="result-stat"><span>{{ promotionResult.stats.graduated_count }}</span> Graduated</div>
            <div class="result-stat"><span>{{ promotionResult.stats.failed_count }}</span> Failed</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Copy Result Modal -->
    <div class="modal-overlay" *ngIf="showCopyResultModal" (click)="showCopyResultModal = false">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3><i class="fa-solid fa-circle-check" style="color:#22c55e"></i> Sections Copied</h3>
          <button class="modal-close" (click)="showCopyResultModal = false"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="modal-body">
          <div class="copy-result-stats">
            <div class="copy-stat success">
              <div class="copy-stat-value">{{ copyResultData?.copied }}</div>
              <div class="copy-stat-label">Sections Copied</div>
            </div>
            <div class="copy-stat neutral">
              <div class="copy-stat-value">{{ copyResultData?.skipped }}</div>
              <div class="copy-stat-label">Already Existed</div>
            </div>
          </div>
          <div class="modal-notice" style="margin-top:1rem;">
            <i class="fa-solid fa-info-circle"></i>
            Adviser assignments have been cleared. Please re-assign advisers to the copied sections.
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-execute" (click)="showCopyResultModal = false">
            <i class="fa-solid fa-check"></i> Done
          </button>
        </div>
      </div>
    </div>
    <div class="modal-overlay" *ngIf="showCopyModal" (click)="closeCopyModal()">
      <div class="modal" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3><i class="fa-solid fa-copy"></i> Copy Sections</h3>
          <button class="modal-close" (click)="closeCopyModal()"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="modal-body">
          <p>This will copy all sections from <strong>{{ getYearName(currentSchoolYearId) }}</strong> to <strong>{{ getYearName(targetSchoolYearId) }}</strong>.</p>
          <div class="modal-notice">
            <i class="fa-solid fa-info-circle"></i>
            Adviser assignments will be cleared and must be re-assigned after copying.
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" (click)="closeCopyModal()">Cancel</button>
          <button class="btn-execute" (click)="copySectionsFromCurrentYear()" [disabled]="isCopyingSections">
            <i class="fa-solid fa-copy"></i>
            {{ isCopyingSections ? 'Copying...' : 'Copy Sections' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .promotion-container {
      padding: 2rem;
      background: #f5f7fa;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .page-header {
      background: linear-gradient(135deg, #052355 0%, #5381b2 100%);
      padding: 1.75rem 1.5rem;
      border-radius: 12px;
      box-shadow: 0 4px 16px rgba(5, 35, 85, 0.25);
      h2 { font-size: 1.75rem; color: #fff; margin: 0 0 4px; font-weight: 700; }
      p { color: rgba(255,255,255,0.75); margin: 0; font-size: 0.9rem; }
    }

    .two-col-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.25rem;
      align-items: start;
    }

    @media (max-width: 900px) {
      .two-col-row { grid-template-columns: 1fr; }
    }

    .card {
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 2px 12px rgba(5,35,85,0.08);
      padding: 1.5rem;
    }

    .card-title {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      font-size: 1rem;
      font-weight: 700;
      color: #052355;
      margin-bottom: 1.25rem;
      i { color: #5381b2; }
    }

    .card-title-icon {
      width: 20px;
      height: 20px;
      object-fit: contain;
      flex-shrink: 0;
    }

    .badge-total {
      margin-left: auto;
      background: #eef4ff;
      color: #052355;
      font-size: 0.75rem;
      font-weight: 600;
      padding: 3px 10px;
      border-radius: 20px;
    }

    .year-label {
      margin-left: auto;
      color: #5381b2;
      font-size: 0.85rem;
      font-weight: 600;
    }

    /* Setup */
    .year-selectors {
      display: flex;
      align-items: flex-end;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .form-group {
      flex: 1;
      min-width: 160px;
      label { display: block; font-size: 0.8rem; font-weight: 600; color: #6b7280; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.04em; }
    }

    .form-select {
      width: 100%;
      padding: 10px 12px;
      border: 1.5px solid #e2e8f0;
      border-radius: 8px;
      font-size: 0.9rem;
      color: #1a2744;
      background: #f8fafc;
      outline: none;
      transition: border-color 0.2s;
      &:focus { border-color: #5381b2; background: #fff; }
    }

    .arrow-divider {
      padding-bottom: 10px;
      color: #5381b2;
      font-size: 1.2rem;
    }

    .btn-load {
      padding: 10px 20px;
      background: linear-gradient(135deg, #052355, #5381b2);
      color: #fff;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      white-space: nowrap;
      transition: opacity 0.2s;
      &:disabled { opacity: 0.5; cursor: not-allowed; }
    }

    /* Summary Grid */
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 1rem;
    }

    .summary-card {
      background: linear-gradient(135deg, #eef4ff, #dce8ff);
      border-radius: 10px;
      padding: 1.25rem 1rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      border: 1px solid rgba(83,129,178,0.2);
    }

    .summary-icon {
      width: 40px;
      height: 40px;
      background: #052355;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-size: 1rem;
      flex-shrink: 0;
    }

    .summary-grade { font-size: 0.8rem; font-weight: 600; color: #5381b2; }
    .summary-count { font-size: 1.75rem; font-weight: 800; color: #052355; line-height: 1; }
    .summary-label { font-size: 0.75rem; color: #6b7280; }

    /* Capacity Table */
    .capacity-table-wrapper { overflow-x: auto; }

    .capacity-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.9rem;
      th {
        background: #f8fafc;
        color: #6b7280;
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        padding: 10px 14px;
        text-align: left;
        border-bottom: 2px solid #e2e8f0;
      }
      td {
        padding: 12px 14px;
        border-bottom: 1px solid #f1f5f9;
        color: #1a2744;
      }
      tr:last-child td { border-bottom: none; }
      tr:hover td { background: #f8fafc; }
    }

    .grade-chip {
      background: #eef4ff;
      color: #052355;
      padding: 3px 10px;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 600;
    }

    .available-badge {
      background: #d1fae5;
      color: #065f46;
      padding: 3px 10px;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 600;
      &.low { background: #fee2e2; color: #991b1b; }
    }

    .adviser-status {
      font-weight: 600;
      font-size: 0.85rem;
      &.full { color: #065f46; }
      &.partial { color: #92400e; }
    }

    /* Status Grid */
    .status-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .status-card {
      border-radius: 10px;
      padding: 1.25rem;
      text-align: center;
      border: 2px solid transparent;
      &.neutral { background: #f8fafc; border-color: #e2e8f0; }
      &.success { background: #d1fae5; border-color: #6ee7b7; }
      &.warning { background: #fef3c7; border-color: #fcd34d; }
    }

    .status-value { font-size: 2rem; font-weight: 800; color: #052355; }
    .status-label { font-size: 0.8rem; color: #6b7280; margin-top: 4px; font-weight: 600; }

    .warning-message {
      background: #fef3c7;
      border: 1px solid #fcd34d;
      border-radius: 8px;
      padding: 12px 16px;
      display: flex;
      align-items: center;
      gap: 10px;
      color: #92400e;
      font-size: 0.875rem;
      i { font-size: 1rem; flex-shrink: 0; }
      span { flex: 1; }
    }

    /* Empty State */
    .empty-state {
      padding: 2rem;
      text-align: center;
      color: #6b7280;
      background: #f8fafc;
      border-radius: 10px;
      border: 1.5px dashed #e2e8f0;
      i { font-size: 2rem; margin-bottom: 0.75rem; display: block; color: #cbd5e1; }
      p { margin: 0; }
      &.warning {
        background: #fffbeb;
        border: 1.5px solid #fcd34d;
        border-radius: 12px;
        color: #92400e;
        text-align: left;
        padding: 1.25rem 1.5rem;
        i { color: #f59e0b; }
      }
    }

    .warning-content {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .warning-text {
      flex: 1;
      strong {
        display: block;
        font-size: 0.95rem;
        font-weight: 700;
        color: #92400e;
        margin-bottom: 4px;
      }
      p {
        margin: 0;
        font-size: 0.85rem;
        color: #a16207;
        line-height: 1.5;
      }
    }

    .year-highlight {
      font-weight: 700;
      color: #92400e;
      background: #fef3c7;
      padding: 1px 6px;
      border-radius: 4px;
    }

    /* Copy trigger button */
    .btn-copy-trigger {
      padding: 6px 14px;
      background: linear-gradient(135deg, #052355, #5381b2);
      color: #fff;
      border: none;
      border-radius: 6px;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: opacity 0.2s;
      &.secondary { background: #f1f5f9; color: #052355; }
      &:hover { opacity: 0.85; }
    }

    /* Status pills */
    .status-pill {
      padding: 3px 10px;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
      &.status-inactive { background: #fee2e2; color: #991b1b; }
      &.status-transferred { background: #fef3c7; color: #92400e; }
      &.status-dropped { background: #fee2e2; color: #7f1d1d; }
    }

    /* Actions */
    .promotion-actions-bar {
      display: flex;
      gap: 0.75rem;
      justify-content: flex-end;
      align-items: center;
      padding: 0.5rem 0 1rem;
    }

    .btn-execute {
      padding: 11px 24px;
      background: linear-gradient(135deg, #166534, #22c55e);
      color: #fff;
      border: none;
      border-radius: 8px;
      font-weight: 700;
      font-size: 0.9rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: opacity 0.2s;
      &:disabled { opacity: 0.5; cursor: not-allowed; }
    }

    .btn-cancel {
      padding: 11px 20px;
      background: #f1f5f9;
      color: #475569;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      &:hover { background: #e2e8f0; }
    }

    .btn-small {
      padding: 5px 12px;
      background: #eef4ff;
      color: #052355;
      border: none;
      border-radius: 6px;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      &:hover { background: #dce8ff; }
    }

    /* Result */
    .result-card {
      border-radius: 12px;
      padding: 1.5rem;
      display: flex;
      gap: 1rem;
      align-items: flex-start;
      &.success { background: #d1fae5; border-left: 4px solid #22c55e; }
      &.error { background: #fee2e2; border-left: 4px solid #ef4444; }
    }

    .result-icon {
      font-size: 2rem;
      .success & { color: #16a34a; }
      .error & { color: #dc2626; }
    }

    .result-body {
      h3 { margin: 0 0 4px; font-size: 1rem; color: #1a2744; }
      p { margin: 0 0 12px; color: #475569; font-size: 0.875rem; }
    }

    .result-stats {
      display: flex;
      gap: 1rem;
    }

    .result-stat {
      background: rgba(255,255,255,0.6);
      border-radius: 8px;
      padding: 8px 14px;
      font-size: 0.8rem;
      color: #475569;
      font-weight: 600;
      span { display: block; font-size: 1.5rem; font-weight: 800; color: #052355; }
    }

    /* Modal */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(5,35,85,0.45);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      backdrop-filter: blur(2px);
    }

    .modal {
      background: #fff;
      border-radius: 14px;
      width: 100%;
      max-width: 460px;
      box-shadow: 0 20px 60px rgba(5,35,85,0.25);
      overflow: hidden;
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid #f1f5f9;
      h3 { margin: 0; font-size: 1rem; color: #052355; display: flex; align-items: center; gap: 8px; i { color: #5381b2; } }
    }

    .modal-close {
      background: none;
      border: none;
      color: #94a3b8;
      font-size: 1.1rem;
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      &:hover { color: #052355; background: #f1f5f9; }
    }

    .modal-body {
      padding: 1.5rem;
      p { margin: 0 0 1rem; color: #475569; font-size: 0.9rem; line-height: 1.6; }
    }

    .modal-notice {
      background: #eef4ff;
      border-left: 3px solid #5381b2;
      border-radius: 6px;
      padding: 10px 14px;
      font-size: 0.85rem;
      color: #1a2744;
      display: flex;
      align-items: center;
      gap: 8px;
      i { color: #5381b2; flex-shrink: 0; }
    }

    .modal-footer {
      padding: 1rem 1.5rem;
      border-top: 1px solid #f1f5f9;
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
    }

    .copy-result-stats {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
      margin-bottom: 0.5rem;
    }

    .copy-stat {
      border-radius: 10px;
      padding: 1.25rem;
      text-align: center;
      &.success { background: #d1fae5; border: 2px solid #6ee7b7; }
      &.neutral { background: #f8fafc; border: 2px solid #e2e8f0; }
    }

    .copy-stat-value { font-size: 2.5rem; font-weight: 800; color: #052355; line-height: 1; }
    .copy-stat-label { font-size: 0.8rem; font-weight: 600; color: #6b7280; margin-top: 6px; }
  `]
})
export class GradePromotionComponent implements OnInit {
  schoolYears: any[] = [];
  currentSchoolYearId: number | null = null;
  targetSchoolYearId: number | null = null;
  promotionSummary: PromotionSummary[] | null = null;
  targetSections: TargetSection[] | null = null;
  adviserAssignmentStatus: AdviserAssignmentStatus | null = null;
  manualCases: any[] = [];
  isProcessing = false;
  isLoadingSummary = false;
  isCopyingSections = false;
  summaryLoaded = false;
  promotionResult: any = null;
  showCopyModal = false;
  showCopyResultModal = false;
  copyResultData: { copied: number; skipped: number } | null = null;

  constructor(
    private adminService: AdminService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadSchoolYears();
  }

  loadSchoolYears() {
    this.adminService.getSchoolYears().subscribe(
      (response: any) => { this.schoolYears = response.data || []; },
      (error: any) => { console.error('Error loading school years:', error); }
    );
  }

  onCurrentYearChange() { this.promotionSummary = null; this.summaryLoaded = false; }
  onTargetYearChange() { this.promotionSummary = null; this.summaryLoaded = false; }

  loadPromotionSummary() {
    if (!this.currentSchoolYearId || !this.targetSchoolYearId) { alert('Please select both school years'); return; }
    if (this.currentSchoolYearId == this.targetSchoolYearId) { alert('Current and target school years must be different'); return; }

    this.isLoadingSummary = true;
    this.summaryLoaded = false;

    this.adminService.getPromotionSummary(this.currentSchoolYearId, this.targetSchoolYearId).subscribe(
      (response: any) => {
        const data = response.data || response;
        this.promotionSummary = data.summary || [];
        this.targetSections = data.target_sections || [];
        this.adviserAssignmentStatus = data.adviser_assignment_status;
        this.manualCases = data.manual_cases || [];
        this.isLoadingSummary = false;
        this.summaryLoaded = true;
      },
      (error: any) => {
        console.error('Error loading promotion summary:', error);
        this.isLoadingSummary = false;
        alert('Error loading promotion summary: ' + (error.error?.message || 'Unknown error'));
      }
    );
  }

  confirmPromotion() {
    if (!this.currentSchoolYearId || !this.targetSchoolYearId) { alert('Please select both school years'); return; }
    if (!confirm('Are you sure you want to execute the promotion? This action cannot be undone.')) return;

    this.isProcessing = true;
    const promotionRules: any = { 7: 8, 8: 9, 9: 10, 10: 11, 11: 12, 12: 'graduated' };

    this.adminService.bulkPromoteStudents(this.currentSchoolYearId, this.targetSchoolYearId, promotionRules, []).subscribe(
      (response: any) => {
        this.isProcessing = false;
        this.promotionResult = { success: true, message: 'Promotion completed successfully', stats: response.data || response };
      },
      (error: any) => {
        this.isProcessing = false;
        this.promotionResult = { success: false, message: 'Error during promotion: ' + (error.error?.error || 'Unknown error') };
      }
    );
  }

  cancelPromotion() { this.promotionSummary = null; this.promotionResult = null; this.summaryLoaded = false; }

  openManualAdjustment(student: any) { console.log('Open manual adjustment for student:', student); }

  openCopyModal() { this.showCopyModal = true; }
  closeCopyModal() { this.showCopyModal = false; }

  copySectionsFromCurrentYear() {
    if (!this.currentSchoolYearId || !this.targetSchoolYearId) return;
    this.isCopyingSections = true;

    this.adminService.copySectionsToYear(this.currentSchoolYearId, this.targetSchoolYearId).subscribe(
      (response: any) => {
        const data = response.data || response;
        this.isCopyingSections = false;
        this.showCopyModal = false;
        this.copyResultData = { copied: data.copied, skipped: data.skipped };
        this.showCopyResultModal = true;
        this.loadPromotionSummary();
      },
      (error: any) => {
        this.isCopyingSections = false;
        alert('Failed to copy sections: ' + (error.error?.message || 'Unknown error'));
      }
    );
  }

  getYearName(yearId: number | null): string {
    if (!yearId) return '';
    return this.schoolYears.find(y => y.id == yearId)?.year_name || '';
  }

  getTotalStudents(): number {
    return this.promotionSummary?.reduce((sum, item) => sum + item.total_students, 0) || 0;
  }

  getTotalSections(): number { return this.adviserAssignmentStatus?.total_sections || 0; }
  getSectionsWithAdvisers(): number { return this.adviserAssignmentStatus?.sections_with_advisers || 0; }
  getSectionsWithoutAdvisers(): number { return this.adviserAssignmentStatus?.sections_without_advisers || 0; }

  navigateToSchoolYearManagement() {
    this.router.navigate(['/dashboard/admin/school-year-management']);
  }
}
