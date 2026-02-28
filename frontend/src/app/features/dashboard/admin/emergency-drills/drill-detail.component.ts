import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { EmergencyDrillService } from '../../../../core/services/emergency-drill.service';
import { StudentService } from '../../../../core/services/student.service';
import { EmergencyDrill, DrillParticipant } from '../../../../core/models/emergency-drill.model';

@Component({
  selector: 'app-drill-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="drill-detail" *ngIf="drill">
      <div class="detail-header">
        <div class="header-info">
          <h2>{{ drill.drill_name }}</h2>
          <div class="drill-meta">
            <span class="drill-type">{{ drill.drill_type | titlecase }}</span>
            <span class="status-badge" [class]="'status-' + drill.status">
              {{ drill.status | titlecase }}
            </span>
          </div>
          <p *ngIf="drill.description">{{ drill.description }}</p>
        </div>
        
        <div class="header-actions">
          <button class="btn btn-secondary" (click)="goBack()">
            <i class="fas fa-arrow-left"></i> Back
          </button>
          
          <button *ngIf="drill.status === 'planned'" 
                  class="btn btn-success" 
                  (click)="startDrill()">
            <i class="fas fa-play"></i> Start Drill
          </button>
          
          <button *ngIf="drill.status === 'active'" 
                  class="btn btn-primary" 
                  (click)="viewDashboard()">
            <i class="fas fa-tachometer-alt"></i> Live Dashboard
          </button>
        </div>
      </div>

      <!-- Drill Information -->
      <div class="info-section">
        <h3>Drill Information</h3>
        <div class="info-grid">
          <div class="info-item">
            <label>Created:</label>
            <span>{{ drill.created_at | date:'medium' }}</span>
          </div>
          <div class="info-item" *ngIf="drill.scheduled_at">
            <label>Scheduled:</label>
            <span>{{ drill.scheduled_at | date:'medium' }}</span>
          </div>
          <div class="info-item" *ngIf="drill.started_at">
            <label>Started:</label>
            <span>{{ drill.started_at | date:'medium' }}</span>
          </div>
          <div class="info-item" *ngIf="drill.ended_at">
            <label>Ended:</label>
            <span>{{ drill.ended_at | date:'medium' }}</span>
          </div>
          <div class="info-item" *ngIf="drill.duration_seconds">
            <label>Duration:</label>
            <span>{{ formatDuration(drill.duration_seconds) }}</span>
          </div>
        </div>
      </div>

      <!-- Participants Section -->
      <div class="participants-section">
        <div class="section-header">
          <h3>Participants ({{ drill.participants?.length || 0 }})</h3>
          <button *ngIf="drill.status === 'planned'" 
                  class="btn btn-primary" 
                  (click)="showAddParticipants = true">
            <i class="fas fa-plus"></i> Add Participants
          </button>
        </div>

        <div class="participants-grid" *ngIf="drill.participants?.length">
          <div class="participant-card" 
               *ngFor="let participant of drill.participants"
               [class.injured]="participant.role === 'injured'"
               [class.scanned]="participant.status === 'scanned'"
               [class.rescued]="participant.status === 'rescued'">
            
            <div class="participant-info">
              <div class="student-name">{{ participant.user?.full_name || (participant.student?.first_name + ' ' + (participant.student?.last_name || '')) || 'Unknown User' }}</div>
              <div class="student-details">
                <span>Role: {{ participant.user?.role_name || 'Unknown' }}</span>
                <span *ngIf="participant.student">ID: {{ participant.student?.student_number }}</span>
                <span *ngIf="participant.student">Grade: {{ participant.student?.current_section?.grade_level?.grade_name || participant.student?.grade_level }}</span>
                <span *ngIf="participant.student">Section: {{ participant.student?.current_section?.section_name || participant.student?.section }}</span>
              </div>
            </div>

            <div class="participant-role">
              <span class="role-badge" [class]="'role-' + participant.role">
                {{ participant.role | titlecase }}
              </span>
              <span class="status-badge" [class]="'status-' + participant.status">
                {{ participant.status | titlecase }}
              </span>
            </div>

            <div class="participant-stats" *ngIf="participant.response_time_seconds">
              <div class="response-time">
                <span class="time-value">{{ participant.response_time_seconds }}s</span>
                <span class="time-label">Response Time</span>
              </div>
            </div>

            <div class="participant-injury" *ngIf="participant.injury_simulation">
              <div class="injury-info">
                <strong>Injury:</strong> {{ participant.injury_simulation }}
                <span class="severity" [class]="'severity-' + participant.severity">
                  ({{ participant.severity | titlecase }})
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="empty-participants" *ngIf="!drill.participants?.length">
          <i class="fas fa-users"></i>
          <p>No participants added yet</p>
          <button *ngIf="drill.status === 'planned'" 
                  class="btn btn-primary" 
                  (click)="showAddParticipants = true">
            Add Participants
          </button>
        </div>
      </div>

      <!-- Statistics Section -->
      <div class="statistics-section" *ngIf="drill.statistics">
        <h3>Drill Statistics</h3>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">{{ drill.statistics.total_participants }}</div>
            <div class="stat-label">Total Participants</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ drill.statistics.injured_participants }}</div>
            <div class="stat-label">Injured</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ drill.statistics.scanned_participants }}</div>
            <div class="stat-label">Scanned</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ drill.statistics.rescued_participants }}</div>
            <div class="stat-label">Rescued</div>
          </div>
          <div class="stat-card" *ngIf="drill.statistics.average_response_time">
            <div class="stat-value">{{ drill.statistics.average_response_time | number:'1.0-1' }}s</div>
            <div class="stat-label">Avg Response</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ drill.statistics.completion_rate | number:'1.0-0' }}%</div>
            <div class="stat-label">Completion Rate</div>
          </div>
        </div>
      </div>

      <!-- Add Participants Modal -->
      <div class="modal" *ngIf="showAddParticipants" (click)="closeModal($event)">
        <div class="modal-content large-modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Add Participants</h3>
            <button class="close-btn" (click)="showAddParticipants = false">&times;</button>
          </div>
          
          <div class="modal-body">
            <!-- Search Students -->
            <div class="search-section">
              <input type="text" 
                     [(ngModel)]="searchTerm" 
                     (input)="searchStudents()"
                     (keyup)="searchStudents()"
                     class="form-control" 
                     placeholder="Search users by name, ID, or username..."
                     [disabled]="searchLoading">
              <small class="search-help">Search for students, advisers, clinic staff, or admin users</small>
              <div class="search-loading" *ngIf="searchLoading">
                <i class="fas fa-spinner fa-spin"></i> Searching...
              </div>
            </div>

            <!-- Available Students -->
            <div class="students-list" *ngIf="availableStudents.length">
              <div class="student-item" 
                   *ngFor="let student of availableStudents"
                   (click)="selectStudent(student)"
                   [class.selected]="isStudentSelected(student.user_id)">
                
                <div class="student-info">
                  <div class="student-name">{{ student.full_name || (student.first_name + ' ' + (student.last_name || '')) }}</div>
                  <div class="student-details">
                    Role: {{ student.role_name }} | 
                    <span *ngIf="student.student_number">ID: {{ student.student_number }} | </span>
                    <span *ngIf="student.grade_level">Grade: {{ student.current_section?.grade_level?.grade_name || student.grade_level }} | </span>
                    <span *ngIf="student.section">Section: {{ student.current_section?.section_name || student.section }}</span>
                    <span *ngIf="student.username && !student.student_number">Username: {{ student.username }}</span>
                  </div>
                </div>
                
                <div class="student-actions" *ngIf="isStudentSelected(student.user_id)">
                  <select [(ngModel)]="getSelectedStudent(student.user_id).role" class="form-control">
                    <option value="injured">Injured</option>
                    <option value="rescuer">Rescuer</option>
                    <option value="evacuee">Evacuee</option>
                    <option value="observer">Observer</option>
                  </select>
                  
                  <div *ngIf="getSelectedStudent(student.user_id).role === 'injured'" class="injury-details">
                    <input type="text" 
                           [(ngModel)]="getSelectedStudent(student.user_id).injury_simulation"
                           class="form-control" 
                           placeholder="Injury simulation">
                    <select [(ngModel)]="getSelectedStudent(student.user_id).severity" class="form-control">
                      <option value="minor">Minor</option>
                      <option value="moderate">Moderate</option>
                      <option value="severe">Severe</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <!-- No Results -->
            <div class="no-results" *ngIf="searchTerm.length >= 2 && availableStudents.length === 0">
              <p>No users found matching "{{ searchTerm }}"</p>
              <p><small>Try searching by name, username, email, or student number</small></p>
            </div>

            <!-- Search Instructions -->
            <div class="search-instructions" *ngIf="searchTerm.length < 2">
              <p>Type at least 2 characters to search for users...</p>
              <p><small>You can search for students, advisers, clinic staff, or admin users</small></p>
            </div>

            <div class="modal-actions">
              <button type="button" class="btn btn-secondary" (click)="showAddParticipants = false">
                Cancel
              </button>
              <button type="button" class="btn btn-primary" 
                      (click)="addSelectedParticipants()" 
                      [disabled]="selectedStudents.length === 0 || adding">
                <i class="fas fa-spinner fa-spin" *ngIf="adding"></i>
                Add {{ selectedStudents.length }} Participants
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="loading" *ngIf="loading">
      <i class="fas fa-spinner fa-spin"></i> Loading drill details...
    </div>
  `,
  styles: [`
    .drill-detail {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .detail-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 30px;
      padding: 20px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .header-info h2 {
      margin: 0 0 10px 0;
      color: #333;
    }

    .drill-meta {
      display: flex;
      gap: 10px;
      margin-bottom: 10px;
    }

    .drill-type {
      background: #e3f2fd;
      color: #1976d2;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
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

    .header-actions {
      display: flex;
      gap: 10px;
    }

    .info-section, .participants-section, .statistics-section {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      margin-bottom: 20px;
    }

    .info-section h3, .participants-section h3, .statistics-section h3 {
      margin: 0 0 20px 0;
      color: #333;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 15px;
    }

    .info-item {
      display: flex;
      justify-content: space-between;
    }

    .info-item label {
      font-weight: bold;
      color: #666;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .participants-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 15px;
    }

    .participant-card {
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 15px;
      background: #f8f9fa;
    }

    .participant-card.injured {
      border-left: 4px solid #dc3545;
    }

    .participant-card.scanned {
      background: #fff3cd;
      border-left: 4px solid #ffc107;
    }

    .participant-card.rescued {
      background: #d4edda;
      border-left: 4px solid #28a745;
    }

    .student-name {
      font-weight: bold;
      color: #333;
      margin-bottom: 5px;
    }

    .student-details {
      font-size: 12px;
      color: #666;
      margin-bottom: 10px;
    }

    .student-details span {
      margin-right: 10px;
    }

    .participant-role {
      display: flex;
      gap: 10px;
      margin-bottom: 10px;
    }

    .role-badge {
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: bold;
    }

    .role-injured { background: #ffebee; color: #c62828; }
    .role-rescuer { background: #e8f5e8; color: #2e7d32; }
    .role-evacuee { background: #e3f2fd; color: #1976d2; }
    .role-observer { background: #f3e5f5; color: #7b1fa2; }

    .response-time {
      text-align: center;
    }

    .time-value {
      display: block;
      font-size: 18px;
      font-weight: bold;
      color: #333;
    }

    .time-label {
      font-size: 11px;
      color: #666;
    }

    .injury-info {
      font-size: 12px;
      color: #666;
      margin-top: 10px;
    }

    .severity {
      font-weight: bold;
    }

    .severity-minor { color: #28a745; }
    .severity-moderate { color: #ffc107; }
    .severity-severe { color: #fd7e14; }
    .severity-critical { color: #dc3545; }

    .empty-participants {
      text-align: center;
      padding: 40px;
      color: #666;
    }

    .empty-participants i {
      font-size: 48px;
      margin-bottom: 20px;
      color: #ddd;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 15px;
    }

    .stat-card {
      text-align: center;
      padding: 15px;
      border: 1px solid #ddd;
      border-radius: 8px;
    }

    .stat-value {
      font-size: 24px;
      font-weight: bold;
      color: #333;
      display: block;
    }

    .stat-label {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
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
      max-width: 600px;
      max-height: 90vh;
      overflow-y: auto;
    }

    .large-modal {
      max-width: 800px;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px;
      border-bottom: 1px solid #eee;
    }

    .modal-body {
      padding: 20px;
    }

    .search-section {
      margin-bottom: 20px;
    }

    .search-help {
      display: block;
      margin-top: 5px;
      color: #666;
      font-size: 12px;
    }

    .search-loading {
      margin-top: 10px;
      color: #007bff;
      font-size: 14px;
    }

    .students-list {
      max-height: 400px;
      overflow-y: auto;
      border: 1px solid #ddd;
      border-radius: 4px;
    }

    .no-results, .search-instructions {
      text-align: center;
      padding: 40px 20px;
      color: #666;
      border: 1px solid #eee;
      border-radius: 4px;
      background: #f9f9f9;
    }

    .no-results p, .search-instructions p {
      margin: 5px 0;
    }

    .no-results small, .search-instructions small {
      color: #999;
    }

    .student-item {
      padding: 15px;
      border-bottom: 1px solid #eee;
      cursor: pointer;
      transition: background 0.2s;
    }

    .student-item:hover {
      background: #f8f9fa;
    }

    .student-item.selected {
      background: #e3f2fd;
      border-left: 4px solid #1976d2;
    }

    .student-actions {
      margin-top: 10px;
      display: flex;
      gap: 10px;
      align-items: center;
    }

    .injury-details {
      display: flex;
      gap: 10px;
      margin-top: 10px;
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
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }

    .btn-primary { background: #007bff; color: white; }
    .btn-success { background: #28a745; color: white; }
    .btn-secondary { background: #6c757d; color: white; }

    .btn:hover {
      opacity: 0.9;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .form-control {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
    }

    .loading {
      text-align: center;
      padding: 40px;
      color: #666;
    }
  `]
})
export class DrillDetailComponent implements OnInit {
  drill: EmergencyDrill | null = null;
  loading = false;
  showAddParticipants = false;
  adding = false;
  searchLoading = false;
  
  searchTerm = '';
  availableStudents: any[] = [];
  selectedStudents: any[] = [];

  private drillId: number = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private drillService: EmergencyDrillService,
    private studentService: StudentService
  ) {}

  ngOnInit() {
    this.drillId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadDrillDetails();
  }

  loadDrillDetails() {
    this.loading = true;
    this.drillService.getDrill(this.drillId).subscribe({
      next: (response) => {
        this.drill = response.data.drill;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading drill details:', error);
        this.loading = false;
      }
    });
  }

  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }

  startDrill() {
    if (confirm('Are you sure you want to start this drill?')) {
      this.drillService.startDrill(this.drillId).subscribe({
        next: () => {
          this.loadDrillDetails();
        },
        error: (error) => {
          console.error('Error starting drill:', error);
        }
      });
    }
  }

  viewDashboard() {
    this.router.navigate(['/dashboard/admin/emergency-drills', this.drillId, 'dashboard']);
  }

  goBack() {
    this.router.navigate(['/dashboard/admin/emergency-drills']);
  }

  searchStudents() {
    console.log('🔍 Searching for:', this.searchTerm);
    
    if (this.searchTerm.length >= 2) {
      this.searchLoading = true;
      
      // Search all users (students, advisers, staff, admin)
      this.http.get<any>('/backend/api/get-all-users.php').subscribe({
        next: (response: any) => {
          console.log('📡 API Response:', response);
          this.searchLoading = false;
          
          if (response.success) {
            // Flatten all user types into a single array
            const allUsers = [
              ...(response.users.student || []),
              ...(response.users.adviser || []),
              ...(response.users.clinic_staff || []),
              ...(response.users.admin || [])
            ];
            
            console.log('👥 All users found:', allUsers.length);
            
            // Filter by search term
            this.availableStudents = allUsers.filter((user: any) => {
              const searchLower = this.searchTerm.toLowerCase();
              return (
                user.full_name?.toLowerCase().includes(searchLower) ||
                user.username?.toLowerCase().includes(searchLower) ||
                user.email?.toLowerCase().includes(searchLower) ||
                user.student_number?.includes(this.searchTerm) ||
                (user.first_name + ' ' + (user.last_name || '')).toLowerCase().includes(searchLower)
              );
            });
            
            console.log('🎯 Filtered users:', this.availableStudents.length);
          } else {
            console.error('❌ API returned error:', response);
            this.availableStudents = [];
          }
        },
        error: (error: any) => {
          console.error('❌ Error searching users:', error);
          this.searchLoading = false;
          this.availableStudents = [];
        }
      });
    } else {
      this.availableStudents = [];
      this.searchLoading = false;
      console.log('⏳ Search term too short, cleared results');
    }
  }

  selectStudent(student: any) {
    const existingIndex = this.selectedStudents.findIndex(s => s.user_id === student.user_id);
    
    if (existingIndex >= 0) {
      this.selectedStudents.splice(existingIndex, 1);
    } else {
      this.selectedStudents.push({
        user_id: student.user_id,
        role: 'evacuee',
        injury_simulation: '',
        severity: 'minor'
      });
    }
  }

  isStudentSelected(userId: number): boolean {
    return this.selectedStudents.some(s => s.user_id === userId);
  }

  getSelectedStudent(userId: number): any {
    return this.selectedStudents.find(s => s.user_id === userId) || {};
  }

  addSelectedParticipants() {
    if (this.selectedStudents.length === 0) return;

    this.adding = true;
    const participantsData = {
      participants: this.selectedStudents
    };

    this.drillService.addParticipants(this.drillId, participantsData).subscribe({
      next: () => {
        this.showAddParticipants = false;
        this.selectedStudents = [];
        this.availableStudents = [];
        this.searchTerm = '';
        this.adding = false;
        this.loadDrillDetails();
      },
      error: (error) => {
        console.error('Error adding participants:', error);
        this.adding = false;
      }
    });
  }

  closeModal(event: Event) {
    if (event.target === event.currentTarget) {
      this.showAddParticipants = false;
    }
  }
}