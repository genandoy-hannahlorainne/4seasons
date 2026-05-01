import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { EmergencyDrillService } from '../../../../core/services/emergency-drill.service';
import { StudentService } from '../../../../core/services/student.service';
import { AdminService } from '../../../../core/services/admin.service';
import { EmergencyDrill, DrillParticipant } from '../../../../core/models/emergency-drill.model';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-drill-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './drill-detail.component.html',
  styleUrls: ['./drill-detail.component.scss'],
  styles: []
})
export class DrillDetailComponent implements OnInit {
  drill: EmergencyDrill | null = null;
  loading = false;
  showAddParticipants = false;
  adding = false;
  searchLoading = false;
  
  // Confirmation modal
  showConfirmModal = false;
  confirmAction: (() => void) | null = null;
  confirmMessage = '';
  confirmTitle = '';
  
  searchTerm = '';
  availableStudents: any[] = [];
  selectedStudents: any[] = [];
  
  // Debounce search
  private searchSubject = new Subject<string>();

  private drillId: number = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private drillService: EmergencyDrillService,
    private studentService: StudentService,
    private adminService: AdminService
  ) {}

  ngOnInit() {
    this.drillId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadDrillDetails();
    
    // Setup debounced search
    this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(searchTerm => {
      this.performSearch(searchTerm);
    });
  }

  loadDrillDetails() {
    this.loading = true;
    this.drillService.getDrill(this.drillId).subscribe({
      next: (response) => {
        this.drill = response.data.drill;
        this.loading = false;
      },
      error: (error) => {
        // Error loading drill details
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
    if (this.drill && !this.canStartDrill()) {
      alert(this.getStartButtonTooltip());
      return;
    }

    this.confirmTitle = 'Start Drill';
    this.confirmMessage = 'Are you sure you want to start this drill?';
    this.confirmAction = () => {
      this.drillService.startDrill(this.drillId).subscribe({
        next: () => {
          this.loadDrillDetails();
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

  canStartDrill(): boolean {
    if (!this.drill || !this.drill.scheduled_at) {
      return true;
    }

    const now = new Date();
    const scheduledTime = new Date(this.drill.scheduled_at);
    const allowedEndTime = new Date(scheduledTime.getTime() + 30 * 60 * 1000);

    return now >= scheduledTime && now <= allowedEndTime;
  }

  getStartButtonTooltip(): string {
    if (!this.drill || !this.drill.scheduled_at) {
      return 'Start this drill';
    }

    const now = new Date();
    const scheduledTime = new Date(this.drill.scheduled_at);
    const allowedEndTime = new Date(scheduledTime.getTime() + 30 * 60 * 1000);

    if (now < scheduledTime) {
      const minutesUntil = Math.ceil((scheduledTime.getTime() - now.getTime()) / 60000);
      const scheduledFormatted = scheduledTime.toLocaleString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric',
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
      return `This drill is scheduled for ${scheduledFormatted}. You can start it at the scheduled time. ${minutesUntil} minutes remaining.`;
    } else if (now > allowedEndTime) {
      const scheduledFormatted = scheduledTime.toLocaleString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric',
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
      return `The scheduled time window for this drill has passed. It was scheduled for ${scheduledFormatted} and could only be started within 30 minutes after.`;
    }

    return 'Start this drill';
  }

  viewDashboard() {
    this.router.navigate(['/dashboard/admin/emergency-drills', this.drillId, 'dashboard']);
  }

  goBack() {
    this.router.navigate(['/dashboard/admin/emergency-drills']);
  }

  searchStudents() {
    this.performSearch(this.searchTerm);
  }

  performSearch(searchTerm: string) {
    if (searchTerm.length < 2) {
      this.availableStudents = [];
      return;
    }

    this.searchLoading = true;
    this.drillService.searchUsers(this.drillId, searchTerm).subscribe({
      next: (response: any) => {
        this.availableStudents = response.data || [];
        this.searchLoading = false;
      },
      error: (error: any) => {
        // Error searching users
        this.availableStudents = [];
        this.searchLoading = false;
      }
    });
  }

  selectStudent(student: any) {
    const index = this.selectedStudents.findIndex(s => s.user_id === student.user_id);
    if (index > -1) {
      this.selectedStudents.splice(index, 1);
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
    return this.selectedStudents.find(s => s.user_id === userId);
  }

  addSelectedParticipants() {
    if (this.selectedStudents.length === 0) {
      return;
    }

    this.adding = true;
    const payload = {
      participants: this.selectedStudents
    };

    this.drillService.addParticipants(this.drillId, payload).subscribe({
      next: () => {
        this.adding = false;
        this.showAddParticipants = false;
        this.selectedStudents = [];
        this.searchTerm = '';
        this.availableStudents = [];
        this.loadDrillDetails();
      },
      error: (error: any) => {
        // Error adding participants
        this.adding = false;
        alert('Failed to add participants');
      }
    });
  }

  closeModal(event: Event) {
    if (event.target === event.currentTarget) {
      this.showAddParticipants = false;
    }
  }

  confirmYes() {
    if (this.confirmAction) {
      this.confirmAction();
    }
  }

  closeConfirmModal() {
    this.showConfirmModal = false;
    this.confirmAction = null;
  }
}
