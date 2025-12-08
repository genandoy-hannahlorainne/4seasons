import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { StaffService, StudentHealthRecord } from '../../../core/services/staff.service';

@Component({
  selector: 'app-staff-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './staff-dashboard.component.html',
  styleUrls: ['./staff-dashboard.component.scss']
})
export class StaffDashboardComponent implements OnInit {
  staffName = 'Staff User';
  gradeLevel = 'All Students';
  studentCount = '0';
  
  // Statistics
  fitForActivities = '0';
  pendingAssessment = '0';
  restrictedActivities = '0';
  specialMedicalNeeds = '0';
  
  // Student health records
  students: StudentHealthRecord[] = [];
  filteredStudents: StudentHealthRecord[] = [];
  searchTerm = '';
  
  loading = true;
  error = '';

  constructor(
    private authService: AuthService,
    private staffService: StaffService
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

    // Set staff name from current user
    this.staffName = currentUser.full_name || 'Staff User';

    // Fetch dashboard data from API
    this.staffService.getStaffDashboard(currentUser.user_id).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          const data = response.data;
          
          // Update staff info
          if (data.staff) {
            this.staffName = data.staff.full_name || currentUser.full_name || 'Staff User';
          }
          
          // Update statistics
          if (data.statistics) {
            this.studentCount = data.statistics.total_students.toString();
            this.fitForActivities = this.formatNumber(data.statistics.fit_for_activities);
            this.pendingAssessment = data.statistics.pending_assessment.toString();
            this.restrictedActivities = data.statistics.restricted_activities.toString();
            this.specialMedicalNeeds = data.statistics.special_medical_needs.toString();
          }
          
          // Update student records
          if (data.students) {
            this.students = data.students;
            this.filteredStudents = [...this.students];
          }
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading dashboard data:', error);
        this.error = 'Failed to load dashboard data';
        this.loading = false;
      }
    });
  }

  formatNumber(num: number): string {
    return num.toLocaleString();
  }

  filterStudents(): void {
    if (!this.searchTerm.trim()) {
      this.filteredStudents = [...this.students];
      return;
    }

    const term = this.searchTerm.toLowerCase();
    this.filteredStudents = this.students.filter(student =>
      student.name.toLowerCase().includes(term) ||
      student.lrn.toLowerCase().includes(term) ||
      student.status.toLowerCase().includes(term) ||
      student.notes.toLowerCase().includes(term)
    );
  }

  viewStudent(student: StudentHealthRecord): void {
    console.log('View student:', student);
    // Navigate to student detail page or open modal
    // TODO: Implement navigation to student detail view
  }
}
