import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { AdviserService, AdvisedStudent, RecentVisit } from '../../../core/services/adviser.service';

@Component({
  selector: 'app-adviser-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './adviser-dashboard.component.html',
  styleUrls: ['./adviser-dashboard.component.scss']
})
export class AdviserDashboardComponent implements OnInit {
  adviserName = 'Adviser';
  employeeNumber = '';
  
  // Statistics
  totalStudents = 0;
  studentsWithVisits = 0;
  studentsWithAllergies = 0;
  pendingVisits = 0;
  
  // Data
  advisedStudents: AdvisedStudent[] = [];
  recentVisits: RecentVisit[] = [];
  
  loading = true;
  error = '';

  constructor(
    private authService: AuthService,
    private adviserService: AdviserService
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    const currentUser = this.authService.currentUserValue;
    
    if (!currentUser) {
      this.error = 'User not logged in';
      this.loading = false;
      return;
    }

    // Set adviser name from current user
    this.adviserName = currentUser.full_name || 'Adviser';

    // Fetch dashboard data from API
    this.adviserService.getAdviserDashboard(currentUser.user_id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const data = response.data;
          
          // Update adviser info
          if (data.adviser) {
            this.adviserName = data.adviser.full_name || currentUser.full_name || 'Adviser';
            this.employeeNumber = data.adviser.employee_number || '';
          }
          
          // Update statistics
          if (data.statistics) {
            this.totalStudents = data.statistics.total_students;
            this.studentsWithVisits = data.statistics.students_with_visits;
            this.studentsWithAllergies = data.statistics.students_with_allergies;
            this.pendingVisits = data.statistics.pending_visits;
          }
          
          // Update students and visits
          this.advisedStudents = data.students || [];
          this.recentVisits = data.recent_visits || [];
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading adviser dashboard:', error);
        this.error = 'Failed to load dashboard data';
        this.loading = false;
      }
    });
  }
}
