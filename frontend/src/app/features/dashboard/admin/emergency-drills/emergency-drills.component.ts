import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { EmergencyDrillService } from '../../../../core/services/emergency-drill.service';
import { EmergencyDrill } from '../../../../core/models/emergency-drill.model';
import { AdminNotificationBellComponent } from '../shared/admin-notification-bell.component';

@Component({
  selector: 'app-emergency-drills',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminNotificationBellComponent],
  template: `
    <div class="emergency-drills-container">
      <div class="header notif-bell-inline">
        <div class="header-left">
          <div>
            <h2>Emergency Drill Management</h2>
            <p>Create and monitor emergency drills across all grade levels</p>
          </div>
        </div>
        <div class="page-header-end">
          <app-admin-notification-bell />
          <button class="btn btn-primary" (click)="showCreateModal = true">
            <i class="bi bi-plus-circle-fill" style="font-size:16px;"></i> Create New Drill
          </button>
        </div>
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
        <button class="tab-btn" [class.active]="activeTab === 'abandoned'" (click)="switchTab('abandoned')">
          Abandoned Drills
          <span class="tab-count abandoned" *ngIf="abandonedDrills.length > 0">{{ abandonedDrills.length }}</span>
        </button>
      </div>

      <!-- Filters + Search -->
      <div class="filters-bar">
        <div class="drill-search">
          <i class="fas fa-search"></i>
          <input
            type="text"
            [(ngModel)]="drillSearch"
            placeholder="Search drills by name..."
          >
          <button *ngIf="drillSearch" class="clear-search" (click)="drillSearch=''" type="button">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <select [(ngModel)]="typeFilter" (change)="loadDrills()" class="form-control type-select">
          <option value="">All Types</option>
          <option value="earthquake">ðŸŒ Earthquake</option>
          <option value="fire">ðŸ”¥ Fire</option>
          <option value="lockdown">ðŸ”’ Lockdown</option>
          <option value="medical">ðŸ¥ Medical</option>
          <option value="evacuation">ðŸšª Evacuation</option>
        </select>
      </div>

      <!-- Skeleton Loading -->
      <div *ngIf="loading" class="drills-grid">
        <div *ngFor="let s of [1,2,3,4,5,6]" class="drill-card-skeleton">
          <div class="skeleton skeleton-drill-icon"></div>
          <div class="skeleton-drill-body">
            <div class="skeleton skeleton-drill-title"></div>
            <div class="skeleton skeleton-drill-sub"></div>
            <div class="skeleton-drill-stats">
              <div class="skeleton skeleton-drill-stat"></div>
              <div class="skeleton skeleton-drill-stat"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Drills List -->
      <div class="drills-grid" *ngIf="!loading">
        <ng-container *ngIf="activeTab === 'active'">
          <div class="drill-card active-card" *ngFor="let drill of filteredActiveDrills">
            <div class="drill-header">
              <div class="drill-type-icon"
                   [style.background]="drill.drill_type === 'fire' ? 'linear-gradient(135deg, #ef4444, #f97316)' :
                                       drill.drill_type === 'earthquake' ? 'linear-gradient(135deg, #f59e0b, #d97706)' :
                                       drill.drill_type === 'lockdown' ? 'linear-gradient(135deg, #6366f1, #4f46e5)' :
                                       drill.drill_type === 'medical' ? 'linear-gradient(135deg, #10b981, #059669)' :
                                       'linear-gradient(135deg, #3b82f6, #2563eb)'">
                <i [class]="'bi ' + (drill.drill_type === 'fire' ? 'bi-fire' : drill.drill_type === 'earthquake' ? 'bi-globe-americas' : drill.drill_type === 'lockdown' ? 'bi-lock-fill' : drill.drill_type === 'medical' ? 'bi-heart-pulse-fill' : 'bi-door-open-fill')"
                     style="font-size:28px;color:white;"
                     [attr.aria-label]="drill.drill_type">
                </i>
              </div>
              <div class="drill-title-group">
                <h3>{{ drill.drill_name }}</h3>
                <span class="drill-type-label">{{ drill.drill_type | titlecase }} Drill Â· {{ drill.created_at | date:'MMM d, y' }}</span>
              </div>
              <div class="header-badges">
                <span class="status-badge" [ngClass]="'status-' + drill.status">
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

            <div class="drill-stats-row">
              <div class="stat-pill">
                <span class="stat-pill-value">{{ drill.statistics?.total_participants || 0 }}</span>
                <span class="stat-pill-label"><i class="fas fa-users"></i> Participants</span>
              </div>
              <div class="stat-pill" *ngIf="drill.scheduled_at">
                <span class="stat-pill-value">{{ drill.scheduled_at | date:'MMM d' }}</span>
                <span class="stat-pill-label"><i class="fas fa-calendar"></i> Scheduled</span>
              </div>
              <div class="stat-pill" *ngIf="drill.started_at">
                <span class="stat-pill-value">{{ drill.started_at | date:'h:mm a' }}</span>
                <span class="stat-pill-label"><i class="fas fa-play"></i> Started</span>
              </div>
            </div>

            <div class="drill-actions" style="margin-top:auto;">
              <button *ngIf="drill.status === 'planned'"
                      class="btn btn-sm btn-danger"
                      (click)="deleteDrill(drill.id)">
                <i class="fas fa-trash"></i> Delete
              </button>
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
          <div class="empty-state" *ngIf="filteredActiveDrills.length === 0">
            <i class="bi bi-exclamation-triangle-fill" style="font-size:56px;opacity:0.4;"></i>
            <h3>{{ drillSearch ? 'No Matching Drills' : 'No Active Drills' }}</h3>
            <p>{{ drillSearch ? 'Try a different search term.' : 'Create a new drill to get started.' }}</p>
          </div>
        </ng-container>

        <ng-container *ngIf="activeTab === 'completed'">
          <div class="drill-card completed-card" *ngFor="let drill of filteredCompletedDrills">
            <div class="drill-header">
              <div class="drill-type-icon"
                   [style.background]="drill.drill_type === 'fire' ? 'linear-gradient(135deg, #ef4444, #f97316)' :
                                       drill.drill_type === 'earthquake' ? 'linear-gradient(135deg, #f59e0b, #d97706)' :
                                       drill.drill_type === 'lockdown' ? 'linear-gradient(135deg, #6366f1, #4f46e5)' :
                                       drill.drill_type === 'medical' ? 'linear-gradient(135deg, #10b981, #059669)' :
                                       'linear-gradient(135deg, #3b82f6, #2563eb)'">
                <i [class]="'bi ' + (drill.drill_type === 'fire' ? 'bi-fire' : drill.drill_type === 'earthquake' ? 'bi-globe-americas' : drill.drill_type === 'lockdown' ? 'bi-lock-fill' : drill.drill_type === 'medical' ? 'bi-heart-pulse-fill' : 'bi-door-open-fill')"
                     style="font-size:28px;color:white;"
                     [attr.aria-label]="drill.drill_type">
                </i>
              </div>
              <div class="drill-title-group">
                <h3>{{ drill.drill_name }}</h3>
                <span class="drill-type-label">{{ drill.drill_type | titlecase }} Drill Â· {{ drill.created_at | date:'MMM d, y' }}</span>
              </div>
              <span class="status-badge status-completed">Completed</span>
            </div>

            <div class="drill-stats-row">
              <div class="stat-pill">
                <span class="stat-pill-value">{{ drill.statistics?.total_participants || 0 }}</span>
                <span class="stat-pill-label"><i class="fas fa-users"></i> Participants</span>
              </div>
              <div class="stat-pill">
                <span class="stat-pill-value">{{ drill.statistics?.scanned_participants || 0 }}</span>
                <span class="stat-pill-label"><i class="fas fa-qrcode"></i> Scanned</span>
              </div>
              <div class="stat-pill">
                <span class="stat-pill-value">{{ drill.statistics?.average_response_time ? (drill.statistics?.average_response_time | number:'1.0-1') + 's' : 'â€”' }}</span>
                <span class="stat-pill-label"><i class="fas fa-stopwatch"></i> Avg Response</span>
              </div>
            </div>

            <div class="drill-actions">
              <button class="btn btn-view-details" (click)="viewDrill(drill.id)">
                <i class="fas fa-eye"></i> View Details
              </button>
            </div>
          </div>
          <div class="empty-state" *ngIf="filteredCompletedDrills.length === 0">
            <i class="bi bi-check-circle-fill" style="font-size:56px;opacity:0.4;"></i>
            <h3>{{ drillSearch ? 'No Matching Drills' : 'No Completed Drills' }}</h3>
            <p>{{ drillSearch ? 'Try a different search term.' : 'Completed drills will appear here.' }}</p>
          </div>
        </ng-container>

        <!-- Abandoned Drills -->
        <ng-container *ngIf="activeTab === 'abandoned'">
          <div class="drill-card abandoned-card" *ngFor="let drill of filteredAbandonedDrills">
            <div class="drill-header">
              <div class="drill-type-icon"
                   [style.background]="drill.drill_type === 'fire' ? 'linear-gradient(135deg, #ef4444, #f97316)' :
                                       drill.drill_type === 'earthquake' ? 'linear-gradient(135deg, #f59e0b, #d97706)' :
                                       drill.drill_type === 'lockdown' ? 'linear-gradient(135deg, #6366f1, #4f46e5)' :
                                       drill.drill_type === 'medical' ? 'linear-gradient(135deg, #10b981, #059669)' :
                                       'linear-gradient(135deg, #3b82f6, #2563eb)'">
                <i [class]="'bi ' + (drill.drill_type === 'fire' ? 'bi-fire' : drill.drill_type === 'earthquake' ? 'bi-globe-americas' : drill.drill_type === 'lockdown' ? 'bi-lock-fill' : drill.drill_type === 'medical' ? 'bi-heart-pulse-fill' : 'bi-door-open-fill')"
                     style="font-size:28px;color:white;"
                     [attr.aria-label]="drill.drill_type">
                </i>
              </div>
              <div class="drill-title-group">
                <h3>{{ drill.drill_name }}</h3>
                <span class="drill-type-label">{{ drill.drill_type | titlecase }} Drill Â· {{ drill.created_at | date:'MMM d, y' }}</span>
              </div>
              <span class="status-badge status-abandoned">Abandoned</span>
            </div>

            <div class="abandoned-reason">
              <i class="bi bi-exclamation-triangle-fill" style="width:16px;height:16px;color:#92400e;flex-shrink:0;"></i>
              <span>This drill was automatically abandoned â€” the scheduled time window passed without being started.</span>
            </div>

            <div class="drill-stats-row" *ngIf="drill.statistics">
              <div class="stat-pill">
                <span class="stat-pill-value">{{ drill.statistics.total_participants || 0 }}</span>
                <span class="stat-pill-label"><i class="fas fa-users"></i> Participants</span>
              </div>
              <div class="stat-pill" *ngIf="drill.scheduled_at">
                <span class="stat-pill-value">{{ drill.scheduled_at | date:'MMM d, h:mm a' }}</span>
                <span class="stat-pill-label">Scheduled</span>
              </div>
            </div>

            <div class="drill-actions">
              <button class="btn btn-sm btn-danger" (click)="deleteDrill(drill.id)" title="Delete this drill">
                <i class="fas fa-trash"></i> Delete
              </button>
              <button class="btn btn-view-details" (click)="viewDrill(drill.id)">
                <i class="fas fa-eye"></i> View Details
              </button>
            </div>
          </div>
          <div class="empty-state" *ngIf="filteredAbandonedDrills.length === 0">
            <i class="bi bi-slash-circle-fill" style="font-size:56px;opacity:0.4;"></i>
            <h3>{{ drillSearch ? 'No Matching Drills' : 'No Abandoned Drills' }}</h3>
            <p>{{ drillSearch ? 'Try a different search term.' : 'Drills that expire without being started will appear here.' }}</p>
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
                     name="scheduled_at" class="form-control"
                     [min]="getTodayDateTimeLocal()">
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
  styleUrls: ['./emergency-drills.component.scss']
})
export class EmergencyDrillsComponent implements OnInit, OnDestroy {
  drills: EmergencyDrill[] = [];
  activeDrills: EmergencyDrill[] = [];
  completedDrills: EmergencyDrill[] = [];
  abandonedDrills: EmergencyDrill[] = [];
  activeTab: 'active' | 'completed' | 'abandoned' = 'active';
  loading = false;
  typeFilter = '';
  drillSearch = '';
  showCreateModal = false;
  creating = false;
  private pollInterval: any;

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

  get filteredActiveDrills(): EmergencyDrill[] {
    if (!this.drillSearch.trim()) return this.activeDrills;
    const q = this.drillSearch.toLowerCase();
    return this.activeDrills.filter(d => d.drill_name?.toLowerCase().includes(q) || d.drill_type?.toLowerCase().includes(q));
  }

  get filteredCompletedDrills(): EmergencyDrill[] {
    if (!this.drillSearch.trim()) return this.completedDrills;
    const q = this.drillSearch.toLowerCase();
    return this.completedDrills.filter(d => d.drill_name?.toLowerCase().includes(q) || d.drill_type?.toLowerCase().includes(q));
  }

  get filteredAbandonedDrills(): EmergencyDrill[] {
    if (!this.drillSearch.trim()) return this.abandonedDrills;
    const q = this.drillSearch.toLowerCase();
    return this.abandonedDrills.filter(d => d.drill_name?.toLowerCase().includes(q) || d.drill_type?.toLowerCase().includes(q));
  }

  constructor(
    private drillService: EmergencyDrillService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadDrills();
    // Poll every 60 seconds so abandoned drills move automatically
    this.pollInterval = setInterval(() => this.loadDrills(), 60000);
  }

  ngOnDestroy() {
    clearInterval(this.pollInterval);
  }

  loadDrills() {
    this.loading = true;
    const params: any = {};
    if (this.typeFilter) params.drill_type = this.typeFilter;

    this.drillService.getDrills(params).subscribe({
      next: (response) => {
        this.drills = response.data.data || response.data;
        
        // Client-side logic to show expired drills as abandoned
        const now = new Date();
        this.drills = this.drills.map(drill => {
          // If drill is planned and scheduled time + 30 minutes has passed, show as abandoned
          if (drill.status === 'planned' && drill.scheduled_at) {
            const scheduledTime = new Date(drill.scheduled_at);
            const expiredTime = new Date(scheduledTime.getTime() + 30 * 60 * 1000);
            // Checking drill expiration
            if (now > expiredTime) {
              // Drill expired, showing as abandoned
              // Create a copy with abandoned status for display purposes
              return { ...drill, status: 'abandoned' as any };
            }
          }
          return drill;
        });
        
        this.activeDrills = this.drills.filter(d => d.status === 'planned' || d.status === 'active');
        this.completedDrills = this.drills.filter(d => d.status === 'completed' || d.status === 'cancelled');
        this.abandonedDrills = this.drills.filter(d => d.status === 'abandoned');
        this.loading = false;
      },
      error: (error) => {
        // Error loading drills
        this.loading = false;
      }
    });
  }

  switchTab(tab: 'active' | 'completed' | 'abandoned') {
    this.activeTab = tab;
  }

  getTodayDateTimeLocal(): string {
    const now = new Date();
    // Set to start of today (midnight) in local time
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}T00:00`;
  }

  createDrill() {
    if (!this.newDrill.drill_name || !this.newDrill.drill_type) {
      return;
    }

    // Validate that scheduled_at is not in the past (before today)
    if (this.newDrill.scheduled_at) {
      const scheduled = new Date(this.newDrill.scheduled_at);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (scheduled < today) {
        alert('Scheduled date cannot be in the past. Please select today or a future date.');
        return;
      }
    }

    this.creating = true;

    // Send datetime-local value as-is (no UTC conversion) to preserve local time
    const payload = {
      ...this.newDrill,
      scheduled_at: this.newDrill.scheduled_at
        ? this.newDrill.scheduled_at + ':00'
        : undefined
    };

    // Creating drill with scheduled_at

    this.drillService.createDrill(payload).subscribe({
      next: (response) => {
        // Drill created
        this.drills.unshift(response.data);
        this.activeDrills.unshift(response.data);
        this.showCreateModal = false;
        this.resetNewDrill();
        this.creating = false;
      },
      error: (error) => {
        // Error creating drill
        this.creating = false;
      }
    });
  }

  startDrill(id: number) {
    const drill = this.activeDrills.find(d => d.id === id);

    if (drill && drill.scheduled_at) {
      const now = new Date();
      const scheduledTime = new Date(drill.scheduled_at);

      // Start drill attempt

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
          // Error starting drill
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

    // Can start check
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
          // Error ending drill
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

  deleteDrill(id: number) {
    this.confirmTitle = 'Delete Drill';
    this.confirmMessage = 'Are you sure you want to delete this drill? This cannot be undone.';
    this.confirmAction = () => {
      this.drillService.deleteDrill(id).subscribe({
        next: () => {
          this.drills = this.drills.filter(d => d.id !== id);
          this.activeDrills = this.activeDrills.filter(d => d.id !== id);
          this.closeConfirmModal();
        },
        error: (error) => {
          // Error deleting drill
          this.closeConfirmModal();
          alert('Failed to delete drill.');
        }
      });
    };
    this.showConfirmModal = true;
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

