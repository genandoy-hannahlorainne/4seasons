import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { EmergencyDrillService } from '../../../../core/services/emergency-drill.service';
import { EmergencyDrill } from '../../../../core/models/emergency-drill.model';

@Component({
  selector: 'app-emergency-drills',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="emergency-drills-container">
      <div class="header">
        <div class="header-left">
          <img src="assets/icons/emergency-drills.png" style="width:36px;height:36px;object-fit:contain;" alt="Emergency Drills">
          <h2>Emergency Drill Management</h2>
        </div>
        <button class="btn btn-primary" (click)="showCreateModal = true">
          <img src="assets/icons/add.png" style="width:16px;height:16px;object-fit:contain;filter:brightness(0) invert(1);" alt="Add"> Create New Drill
        </button>
      </div>

      <!-- Tabs -->
      <div class="tabs">
        <button class="tab-btn" [class.active]="activeTab === 'active'" (click)="switchTab('active')">
          Active Drills
          <span class="tab-count" *ngIf="activeDrills.length > 0">{{ activeDrills.length }}</span>
        </button>
        <button class="tab-btn" [class.active]="activeTab === 'completed'" (click)="switchTab('completed')">
          Completed Drills
          <span class="tab-count completed" *ngIf="completedDrills.length > 0">{{ completedDrills.length }}</span>
        </button>
      </div>

      <!-- Filters -->
      <div class="filters">
        <select [(ngModel)]="typeFilter" (change)="loadDrills()" class="form-control">
          <option value="">All Types</option>
          <option value="earthquake">Earthquake</option>
          <option value="fire">Fire</option>
          <option value="lockdown">Lockdown</option>
          <option value="medical">Medical</option>
          <option value="evacuation">Evacuation</option>
        </select>
      </div>

      <!-- Drills List -->
      <div class="drills-grid" *ngIf="!loading">
        <ng-container *ngIf="activeTab === 'active'">
          <div class="drill-card" *ngFor="let drill of activeDrills" [class.active]="drill.status === 'active'">
            <div class="drill-header">
              <h3>{{ drill.drill_name }}</h3>
              <div class="header-badges">
                <span class="status-badge" [class]="'status-' + drill.status">
                  {{ drill.status | titlecase }}
                </span>
                <span *ngIf="drill.scheduled_at && drill.status === 'planned'"
                      class="schedule-badge"
                      [class.can-start]="canStartDrill(drill)"
                      [class.too-early]="isScheduledTooEarly(drill)"
                      [class.too-late]="isScheduledTooLate(drill)">
                  <i class="fas fa-clock"></i>
                  {{ canStartDrill(drill) ? 'Ready' : 'Scheduled' }}
                </span>
              </div>
            </div>
            <div class="drill-info">
              <p><strong>Type:</strong> {{ drill.drill_type | titlecase }}</p>
              <p><strong>Created:</strong> {{ drill.created_at | date:'short' }}</p>
              <p *ngIf="drill.scheduled_at"><strong>Scheduled:</strong> {{ drill.scheduled_at | date:'short' }}</p>
              <p *ngIf="drill.started_at"><strong>Started:</strong> {{ drill.started_at | date:'short' }}</p>
              <p *ngIf="drill.description">{{ drill.description }}</p>
            </div>
            <div class="drill-stats" *ngIf="drill.statistics">
              <div class="stat">
                <span class="stat-value">{{ drill.statistics.total_participants || 0 }}</span>
                <span class="stat-label">Participants</span>
              </div>
              <div class="stat" *ngIf="drill.statistics.scanned_participants">
                <span class="stat-value">{{ drill.statistics.scanned_participants }}</span>
                <span class="stat-label">Scanned</span>
              </div>
              <div class="stat" *ngIf="drill.statistics.average_response_time">
                <span class="stat-value">{{ drill.statistics.average_response_time | number:'1.0-1' }}s</span>
                <span class="stat-label">Avg Response </span>
              </div>
            </div>
            <div class="drill-actions">
              <button class="btn btn-sm btn-outline" (click)="viewDrill(drill.id)">
                <i class="fas fa-eye"></i> View
              </button>
              <button *ngIf="drill.status === 'planned'"
                      class="btn btn-sm btn-success"
                      (click)="startDrill(drill.id)"
                      [disabled]="!canStartDrill(drill)"
                      [title]="getStartButtonTooltip(drill)">
                <i class="fas fa-play"></i> Start
              </button>
              <button *ngIf="drill.status === 'active'" class="btn btn-sm btn-primary" (click)="viewDashboard(drill.id)">
                <i class="fas fa-tachometer-alt"></i> Dashboard
              </button>
              <button *ngIf="drill.status === 'active'" class="btn btn-sm btn-danger" (click)="endDrill(drill.id)">
                <i class="fas fa-stop"></i> End
              </button>
            </div>
          </div>
          <div class="empty-state" *ngIf="activeDrills.length === 0">
            <img src="assets/icons/emergency-drills.png" style="width:56px;height:56px;object-fit:contain;opacity:0.4;" alt="No drills">
            <h3>No Active Drills</h3>
            <p>Create a new drill to get started.</p>
          </div>
        </ng-container>

        <ng-container *ngIf="activeTab === 'completed'">
          <div class="drill-card completed-card" *ngFor="let drill of completedDrills">
            <div class="drill-header">
              <div class="drill-type-icon" [class]="'type-' + drill.drill_type">
                <img [src]="'assets/icons/' + (drill.drill_type === 'medical' ? 'emergency' : drill.drill_type) + '.png'"
                     style="width:28px;height:28px;object-fit:contain;"
                     [alt]="drill.drill_type">
              </div>
              <div class="drill-title-group">
                <h3>{{ drill.drill_name }}</h3>
                <span class="drill-type-label">{{ drill.drill_type | titlecase }} Drill · {{ drill.created_at | date:'MMM d, y' }}</span>
              </div>
              <span class="status-badge status-completed">Completed</span>
            </div>

            <div class="drill-stats-row" *ngIf="drill.statistics">
              <div class="stat-pill">
                <span class="stat-pill-value">{{ drill.statistics.total_participants || 0 }}</span>
                <span class="stat-pill-label"><i class="fas fa-users"></i> Participants</span>
              </div>
              <div class="stat-pill" *ngIf="drill.statistics.scanned_participants">
                <span class="stat-pill-value">{{ drill.statistics.scanned_participants }}</span>
                <span class="stat-pill-label"><i class="fas fa-qrcode"></i> Scanned</span>
              </div>
              <div class="stat-pill" *ngIf="drill.statistics.average_response_time">
                <span class="stat-pill-value">{{ drill.statistics.average_response_time | number:'1.0-1' }}s</span>
                <span class="stat-pill-label"><i class="fas fa-stopwatch"></i> Avg Response</span>
              </div>
            </div>

            <div class="drill-actions">
              <button class="btn btn-view-details" (click)="viewDrill(drill.id)">
                <i class="fas fa-eye"></i> View Details
              </button>
            </div>
          </div>
          <div class="empty-state" *ngIf="completedDrills.length === 0">
            <img src="assets/icons/emergency-drills.png" style="width:56px;height:56px;object-fit:contain;opacity:0.4;" alt="No drills">
            <h3>No Completed Drills</h3>
            <p>Completed drills will appear here.</p>
          </div>
        </ng-container>
      </div>

      <!-- Create Drill Modal -->
      <div class="modal" *ngIf="showCreateModal" (click)="closeModal($event)">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Create Emergency Drill</h3>
            <button class="close-btn" (click)="showCreateModal = false">&times;</button>
          </div>

          <form (ngSubmit)="createDrill()" class="modal-body">
            <div class="form-group">
              <label>Drill Name *</label>
              <input type="text" [(ngModel)]="newDrill.drill_name" name="drill_name"
                     class="form-control" required>
            </div>

            <div class="form-group">
              <label>Drill Type *</label>
              <select [(ngModel)]="newDrill.drill_type" name="drill_type"
                      class="form-control" required>
                <option value="">Select Type</option>
                <option value="earthquake">Earthquake</option>
                <option value="fire">Fire</option>
                <option value="lockdown">Lockdown</option>
                <option value="medical">Medical Emergency</option>
                <option value="evacuation">Evacuation</option>
              </select>
            </div>

            <div class="form-group">
              <label>Description</label>
              <textarea [(ngModel)]="newDrill.description" name="description"
                        class="form-control" rows="3"></textarea>
            </div>

            <div class="form-group">
              <label>Scheduled Date/Time</label>
              <input type="datetime-local" [(ngModel)]="newDrill.scheduled_at"
                     name="scheduled_at" class="form-control">
            </div>

            <div class="modal-actions">
              <button type="button" class="btn btn-secondary" (click)="showCreateModal = false">
                Cancel
              </button>
              <button type="submit" class="btn btn-primary" [disabled]="creating">
                <i class="fas fa-spinner fa-spin" *ngIf="creating"></i>
                {{ creating ? 'Creating...' : 'Create Drill' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Confirmation Modal -->
      <div class="modal confirm-modal-overlay" *ngIf="showConfirmModal" (click)="closeConfirmModal()">
        <div class="confirm-modal-content" (click)="$event.stopPropagation()">
          <div class="confirm-modal-header">
            <h3>{{ confirmTitle }}</h3>
          </div>
          <div class="confirm-modal-body">
            <p>{{ confirmMessage }}</p>
          </div>
          <div class="confirm-modal-actions">
            <button class="btn btn-confirm" (click)="confirmYes()">OK</button>
            <button class="btn btn-cancel-confirm" (click)="closeConfirmModal()">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .emergency-drills-container {
      padding: 2rem;
      background: #f5f7fa;
      min-height: 100vh;
    }

    .tabs {
      display: flex;
      gap: 4px;
      margin-bottom: 20px;
      border-bottom: 2px solid #e0e0e0;
    }

    .tab-btn {
      padding: 10px 20px;
      border: none;
      background: transparent;
      font-size: 14px;
      font-weight: 600;
      color: #666;
      cursor: pointer;
      border-bottom: 3px solid transparent;
      margin-bottom: -2px;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s;
    }

    .tab-btn:hover { color: #007bff; }

    .tab-btn.active {
      color: #007bff;
      border-bottom-color: #007bff;
    }

    .tab-count {
      background: #007bff;
      color: white;
      border-radius: 12px;
      padding: 1px 7px;
      font-size: 11px;
    }

    .tab-count.completed {
      background: #7b1fa2;
    }

    .completed-card {
      border-left-color: #7b1fa2 !important;
      background: #fdf8ff;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      background: linear-gradient(135deg, #052355 0%, #5381b2 100%);
      padding: 2rem 1.5rem;
      border-radius: 12px;
      box-shadow: 0 4px 16px rgba(5, 35, 85, 0.25);

      .header-left {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }

      h2 {
        font-size: 2rem;
        color: #ffffff;
        margin: 0;
        font-weight: 700;
      }

      .btn-primary {
        background: rgba(255, 255, 255, 0.15);
        color: #ffffff;
        border: 2px solid rgba(255, 255, 255, 0.6);
        padding: 0.75rem 1.5rem;
        border-radius: 8px;
        font-size: 0.95rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        white-space: nowrap;
        display: flex;
        align-items: center;
        gap: 0.5rem;

        &:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.25);
          border-color: #ffffff;
        }

        &:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      }
    }

    .filters {
      display: flex;
      gap: 15px;
      margin-bottom: 20px;
    }

    .filters select {
      width: 200px;
    }

    .drills-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 20px;
    }

    .drill-card {
      background: white;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      border-left: 4px solid #ddd;
    }

    .drill-card.active {
      border-left-color: #28a745;
      background: #f8fff9;
    }

    .drill-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
    }

    .drill-header h3 {
      margin: 0;
      color: #333;
    }

    .header-badges {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .status-badge {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: bold;
      text-transform: uppercase;
    }

    .schedule-badge {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .schedule-badge.can-start {
      background: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
    }

    .schedule-badge.too-early {
      background: #fff3cd;
      color: #856404;
      border: 1px solid #ffeaa7;
    }

    .schedule-badge.too-late {
      background: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
    }

    .status-planned { background: #e3f2fd; color: #1976d2; }
    .status-active { background: #e8f5e8; color: #2e7d32; }
    .status-completed { background: #f3e5f5; color: #7b1fa2; }
    .status-cancelled { background: #ffebee; color: #c62828; }

    .drill-info p {
      margin: 5px 0;
      color: #666;
    }

    .drill-stats {
      display: flex;
      gap: 20px;
      margin: 15px 0;
      padding: 15px 0;
      border-top: 1px solid #eee;
    }

    .stat {
      text-align: center;
    }

    .stat-value {
      display: block;
      font-size: 24px;
      font-weight: bold;
      color: #333;
    }

    .stat-label {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
    }

    .drill-actions {
      display: flex;
      gap: 10px;
      margin-top: 15px;
    }

    .loading, .empty-state {
      text-align: center;
      padding: 40px;
      color: #666;
    }

    .empty-state i {
      font-size: 48px;
      margin-bottom: 20px;
      color: #ddd;
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
      max-width: 500px;
      max-height: 90vh;
      overflow-y: auto;
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

    .modal-actions {
      display: flex;
      gap: 10px;
      justify-content: flex-end;
      margin-top: 20px;
    }

    .btn {
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      transition: all 0.2s ease;
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      background: #ccc !important;
      color: #666 !important;
      border-color: #ccc !important;
    }

    .btn-primary {
      background: linear-gradient(135deg, #052355 0%, #5381b2 100%);
      color: white;
      box-shadow: 0 2px 8px rgba(5, 35, 85, 0.2);
      font-weight: 600;

      &:hover:not(:disabled) {
        background: linear-gradient(135deg, #041d44 0%, #4270a1 100%);
        box-shadow: 0 4px 12px rgba(5, 35, 85, 0.3);
        transform: translateY(-1px);
      }
    }
    .btn-danger { background: #dc3545; color: white; }
    .btn-secondary {
      background: #e9ecef;
      color: #2c3e50;
      font-weight: 600;

      &:hover {
        background: #dee2e6;
        transform: translateY(-1px);
      }
    }
    .btn-outline {
      background: white;
      color: #052355;
      border: 2px solid #052355;
      font-weight: 600;

      &:hover {
        background: #052355;
        color: white;
        transform: translateY(-1px);
      }
    }
    .btn-sm { padding: 4px 8px; font-size: 12px; }

    .btn:hover {
      opacity: 0.9;
    }

    /* Confirmation Modal Styles */
    .confirm-modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2000;
      animation: fadeIn 0.2s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .confirm-modal-content {
      background: #ffffff;
      border-radius: 12px;
      width: 90%;
      max-width: 450px;
      box-shadow: 0 10px 40px rgba(5, 35, 85, 0.3);
      animation: slideUp 0.3s ease;
      overflow: hidden;
    }

    @keyframes slideUp {
      from {
        transform: translateY(20px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    .confirm-modal-header {
      padding: 1.5rem;
      background: linear-gradient(135deg, #052355 0%, #5381b2 100%);
      border-bottom: none;

      h3 {
        margin: 0;
        font-size: 1.3rem;
        color: #ffffff;
        font-weight: 700;
      }
    }

    .confirm-modal-body {
      padding: 2rem 1.5rem;
      background: #ffffff;

      p {
        margin: 0;
        color: #2c3e50;
        font-size: 1rem;
        line-height: 1.6;
      }
    }

    .confirm-modal-actions {
      padding: 1rem 1.5rem 1.5rem;
      display: flex;
      gap: 0.75rem;
      justify-content: flex-end;
      background: #ffffff;
    }

    .btn-confirm {
      background: linear-gradient(135deg, #052355 0%, #5381b2 100%);
      color: #ffffff;
      border: none;
      padding: 0.75rem 2rem;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 0.95rem;
      box-shadow: 0 2px 8px rgba(5, 35, 85, 0.2);

      &:hover {
        background: linear-gradient(135deg, #041d44 0%, #4270a1 100%);
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(5, 35, 85, 0.3);
      }
    }

    .btn-cancel-confirm {
      background: #e9ecef;
      color: #2c3e50;
      border: none;
      padding: 0.75rem 2rem;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 0.95rem;

      &:hover {
        background: #dee2e6;
        transform: translateY(-2px);
      }
    }

    /* Completed Card - Option B style */
    .completed-card {
      border-left: none !important;
      background: white !important;
      border-radius: 12px !important;
      padding: 1.25rem !important;
      box-shadow: 0 2px 12px rgba(0,0,0,0.08) !important;
      display: flex;
      flex-direction: column;
      gap: 1rem;

      .drill-header {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 0;
      }

      .drill-type-icon {
        width: 44px;
        height: 44px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;

        i { font-size: 1.2rem; color: white; }

        &.type-fire { background: linear-gradient(135deg, #ef4444, #f97316); }
        &.type-earthquake { background: linear-gradient(135deg, #f59e0b, #d97706); }
        &.type-lockdown { background: linear-gradient(135deg, #6366f1, #4f46e5); }
        &.type-medical { background: linear-gradient(135deg, #10b981, #059669); }
        &.type-evacuation { background: linear-gradient(135deg, #3b82f6, #2563eb); }
      }

      .drill-title-group {
        flex: 1;
        min-width: 0;

        h3 {
          margin: 0 0 2px;
          font-size: 1rem;
          font-weight: 700;
          color: #1e293b;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .drill-type-label {
          font-size: 0.78rem;
          color: #94a3b8;
        }
      }

      .drill-stats-row {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
      }

      .stat-pill {
        flex: 1;
        min-width: 70px;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 0.5rem 0.75rem;
        text-align: center;

        .stat-pill-value {
          display: block;
          font-size: 1.4rem;
          font-weight: 700;
          color: #1e293b;
          line-height: 1.2;
        }

        .stat-pill-label {
          font-size: 0.7rem;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.25rem;
          margin-top: 2px;

          i { font-size: 0.65rem; }
        }
      }

      .drill-actions {
        margin-top: 0;
      }

      .btn-view-details {
        width: 100%;
        justify-content: center;
        padding: 0.55rem 1rem;
        border-radius: 8px;
        border: 2px solid #7b1fa2;
        background: white;
        color: #7b1fa2;
        font-weight: 600;
        font-size: 0.875rem;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 0.4rem;

        &:hover {
          background: #7b1fa2;
          color: white;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(123, 31, 162, 0.25);
        }
      }
    }
  `]
})
export class EmergencyDrillsComponent implements OnInit {
  drills: EmergencyDrill[] = [];
  activeDrills: EmergencyDrill[] = [];
  completedDrills: EmergencyDrill[] = [];
  activeTab: 'active' | 'completed' = 'active';
  loading = false;
  typeFilter = '';
  showCreateModal = false;
  creating = false;

  // Confirmation modal
  showConfirmModal = false;
  confirmAction: (() => void) | null = null;
  confirmMessage = '';
  confirmTitle = '';

  newDrill = {
    drill_name: '',
    drill_type: '',
    description: '',
    scheduled_at: '',
    settings: {
      simulate_sms: true,
      track_response_time: true
    }
  };

  constructor(
    private drillService: EmergencyDrillService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadDrills();
  }

  loadDrills() {
    this.loading = true;
    const params: any = {};
    if (this.typeFilter) params.drill_type = this.typeFilter;

    this.drillService.getDrills(params).subscribe({
      next: (response) => {
        this.drills = response.data.data || response.data;
        this.activeDrills = this.drills.filter(d => d.status === 'planned' || d.status === 'active');
        this.completedDrills = this.drills.filter(d => d.status === 'completed' || d.status === 'cancelled');
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading drills:', error);
        this.loading = false;
      }
    });
  }

  switchTab(tab: 'active' | 'completed') {
    this.activeTab = tab;
  }

  createDrill() {
    if (!this.newDrill.drill_name || !this.newDrill.drill_type) {
      return;
    }

    this.creating = true;

    // Send datetime-local value as-is (no UTC conversion) to preserve local time
    const payload = {
      ...this.newDrill,
      scheduled_at: this.newDrill.scheduled_at
        ? this.newDrill.scheduled_at + ':00'
        : undefined
    };

    console.log('🕐 Creating drill with scheduled_at:', payload.scheduled_at);
    console.log('🕐 Current browser time:', new Date().toISOString());

    this.drillService.createDrill(payload).subscribe({
      next: (response) => {
        console.log('✅ Drill created, scheduled_at from server:', response.data.scheduled_at);
        this.drills.unshift(response.data);
        this.activeDrills.unshift(response.data);
        this.showCreateModal = false;
        this.resetNewDrill();
        this.creating = false;
      },
      error: (error) => {
        console.error('Error creating drill:', error);
        this.creating = false;
      }
    });
  }

  startDrill(id: number) {
    const drill = this.activeDrills.find(d => d.id === id);

    if (drill && drill.scheduled_at) {
      const now = new Date();
      const scheduledTime = new Date(drill.scheduled_at);

      console.log('🚨 START DRILL ATTEMPT:', {
        drillId: id,
        now: now.toISOString(),
        nowLocal: now.toLocaleString('en-US', { timeZone: 'Asia/Manila' }),
        scheduledTime: scheduledTime.toISOString(),
        scheduledLocal: scheduledTime.toLocaleString('en-US', { timeZone: 'Asia/Manila' }),
        scheduledRaw: drill.scheduled_at,
        canStart: this.canStartDrill(drill),
        nowTimestamp: now.getTime(),
        scheduledTimestamp: scheduledTime.getTime(),
        diff: (now.getTime() - scheduledTime.getTime()) / 1000 / 60 + ' minutes'
      });

      if (!this.canStartDrill(drill)) {
        alert(this.getStartButtonTooltip(drill));
        return;
      }
    }

    this.confirmTitle = 'Start Drill';
    this.confirmMessage = 'Are you sure you want to start this drill?';
    this.confirmAction = () => {
      this.drillService.startDrill(id).subscribe({
        next: () => {
          this.loadDrills();
          this.closeConfirmModal();
        },
        error: (error) => {
          console.error('Error starting drill:', error);
          const errorMessage = error?.error?.message || 'Failed to start drill';
          alert(errorMessage);
          this.closeConfirmModal();
        }
      });
    };
    this.showConfirmModal = true;
  }

  canStartDrill(drill: EmergencyDrill): boolean {
    if (!drill.scheduled_at) {
      return true; // No schedule restriction
    }

    const now = new Date();
    const scheduledTime = new Date(drill.scheduled_at);

    console.log('🕐 Can start check:', {
      now: now.toISOString(),
      nowLocal: now.toLocaleString(),
      scheduledTime: scheduledTime.toISOString(),
      scheduledLocal: scheduledTime.toLocaleString(),
      canStart: now >= scheduledTime
    });

    // Allow starting only at or after scheduled time (up to 30 minutes after)
    const allowedEndTime = new Date(scheduledTime.getTime() + 30 * 60 * 1000);

    return now >= scheduledTime && now <= allowedEndTime;
  }

  isScheduledTooEarly(drill: EmergencyDrill): boolean {
    if (!drill.scheduled_at || drill.status !== 'planned') return false;
    return !this.canStartDrill(drill) && new Date() < new Date(drill.scheduled_at);
  }

  isScheduledTooLate(drill: EmergencyDrill): boolean {
    if (!drill.scheduled_at || drill.status !== 'planned') return false;
    return !this.canStartDrill(drill) && new Date() > new Date(drill.scheduled_at);
  }


  getStartButtonTooltip(drill: EmergencyDrill): string {
    if (!drill.scheduled_at) {
      return 'Start this drill';
    }

    const now = new Date();
    const scheduledTime = new Date(drill.scheduled_at);
    const allowedEndTime = new Date(scheduledTime.getTime() + 30 * 60 * 1000);

    if (now < scheduledTime) {
      const minutesUntil = Math.ceil((scheduledTime.getTime() - now.getTime()) / 60000);
      return `This drill is scheduled for ${scheduledTime.toLocaleString()}. You can start it at the scheduled time. ${minutesUntil} minutes remaining.`;
    } else if (now > allowedEndTime) {
      return `The scheduled time window for this drill has passed. It was scheduled for ${scheduledTime.toLocaleString()} and could only be started within 30 minutes after.`;
    }

    return 'Start this drill';
  }

  endDrill(id: number) {
    this.confirmTitle = 'End Drill';
    this.confirmMessage = 'Are you sure you want to end this drill?';
    this.confirmAction = () => {
      this.drillService.endDrill(id).subscribe({
        next: () => {
          this.loadDrills();
          this.activeTab = 'completed';
          this.closeConfirmModal();
        },
        error: (error) => {
          console.error('Error ending drill:', error);
          this.closeConfirmModal();
        }
      });
    };
    this.showConfirmModal = true;
  }

  confirmYes() {
    if (this.confirmAction) {
      this.confirmAction();
    }
  }

  closeConfirmModal() {
    this.showConfirmModal = false;
    this.confirmAction = null;
    this.confirmMessage = '';
    this.confirmTitle = '';
  }

  viewDrill(id: number) {
    this.router.navigate(['/dashboard/admin/emergency-drills', id]);
  }

  viewDashboard(id: number) {
    this.router.navigate(['/dashboard/admin/emergency-drills', id, 'dashboard']);
  }

  closeModal(event: Event) {
    if (event.target === event.currentTarget) {
      this.showCreateModal = false;
    }
  }

  resetNewDrill() {
    this.newDrill = {
      drill_name: '',
      drill_type: '',
      description: '',
      scheduled_at: '',
      settings: {
        simulate_sms: true,
        track_response_time: true
      }
    };
  }
}
