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
        <h2>Emergency Drill Management</h2>
        <button class="btn btn-primary" (click)="showCreateModal = true">
          <i class="fas fa-plus"></i> Create New Drill
        </button>
      </div>

      <!-- Filters -->
      <div class="filters">
        <select [(ngModel)]="statusFilter" (change)="loadDrills()" class="form-control">
          <option value="">All Status</option>
          <option value="planned">Planned</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        
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
        <div class="drill-card" *ngFor="let drill of drills" [class.active]="drill.status === 'active'">
          <div class="drill-header">
            <h3>{{ drill.drill_name }}</h3>
            <span class="status-badge" [class]="'status-' + drill.status">
              {{ drill.status | titlecase }}
            </span>
          </div>
          
          <div class="drill-info">
            <p><strong>Type:</strong> {{ drill.drill_type | titlecase }}</p>
            <p><strong>Created:</strong> {{ drill.created_at | date:'short' }}</p>
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
              <span class="stat-label">Avg Response</span>
            </div>
          </div>

          <div class="drill-actions">
            <button class="btn btn-sm btn-outline" (click)="viewDrill(drill.id)">
              <i class="fas fa-eye"></i> View
            </button>
            
            <button *ngIf="drill.status === 'planned'" 
                    class="btn btn-sm btn-success" 
                    (click)="startDrill(drill.id)">
              <i class="fas fa-play"></i> Start
            </button>
            
            <button *ngIf="drill.status === 'active'" 
                    class="btn btn-sm btn-warning" 
                    (click)="viewDashboard(drill.id)">
              <i class="fas fa-tachometer-alt"></i> Dashboard
            </button>
            
            <button *ngIf="drill.status === 'active'" 
                    class="btn btn-sm btn-danger" 
                    (click)="endDrill(drill.id)">
              <i class="fas fa-stop"></i> End
            </button>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div class="loading" *ngIf="loading">
        <i class="fas fa-spinner fa-spin"></i> Loading drills...
      </div>

      <!-- Empty State -->
      <div class="empty-state" *ngIf="!loading && drills.length === 0">
        <i class="fas fa-clipboard-list"></i>
        <h3>No Emergency Drills Found</h3>
        <p>Create your first emergency drill to get started.</p>
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
    </div>
  `,
  styles: [`
    .emergency-drills-container {
      padding: 20px;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
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

    .status-badge {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: bold;
      text-transform: uppercase;
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
    }

    .btn-primary { background: #007bff; color: white; }
    .btn-success { background: #28a745; color: white; }
    .btn-warning { background: #ffc107; color: #212529; }
    .btn-danger { background: #dc3545; color: white; }
    .btn-secondary { background: #6c757d; color: white; }
    .btn-outline { background: white; color: #007bff; border: 1px solid #007bff; }
    .btn-sm { padding: 4px 8px; font-size: 12px; }

    .btn:hover {
      opacity: 0.9;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  `]
})
export class EmergencyDrillsComponent implements OnInit {
  drills: EmergencyDrill[] = [];
  loading = false;
  statusFilter = '';
  typeFilter = '';
  showCreateModal = false;
  creating = false;

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
    if (this.statusFilter) params.status = this.statusFilter;
    if (this.typeFilter) params.drill_type = this.typeFilter;

    this.drillService.getDrills(params).subscribe({
      next: (response) => {
        this.drills = response.data.data || response.data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading drills:', error);
        this.loading = false;
      }
    });
  }

  createDrill() {
    if (!this.newDrill.drill_name || !this.newDrill.drill_type) {
      return;
    }

    this.creating = true;
    this.drillService.createDrill(this.newDrill).subscribe({
      next: (response) => {
        this.drills.unshift(response.data);
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
    if (confirm('Are you sure you want to start this drill?')) {
      this.drillService.startDrill(id).subscribe({
        next: () => {
          this.loadDrills();
        },
        error: (error) => {
          console.error('Error starting drill:', error);
        }
      });
    }
  }

  endDrill(id: number) {
    if (confirm('Are you sure you want to end this drill?')) {
      this.drillService.endDrill(id).subscribe({
        next: () => {
          this.loadDrills();
        },
        error: (error) => {
          console.error('Error ending drill:', error);
        }
      });
    }
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