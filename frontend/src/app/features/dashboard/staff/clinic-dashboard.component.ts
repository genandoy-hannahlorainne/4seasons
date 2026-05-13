import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-clinic-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './clinic-dashboard.component.html',
  styleUrls: ['./clinic-dashboard.component.scss']
})
export class ClinicDashboardComponent implements OnInit {
  staffName = '';
  totalStudents = 0;
  todayVisits = 0;
  totalVisits = 0;
  pendingVisits = 0;
  recentVisits: any[] = [];
  studentsWithAllergies: any[] = [];
  loadingVisits = true;
  loadingAllergies = true;

  constructor(
    private authService: AuthService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    const currentUser = this.authService.currentUserValue;
    if (currentUser) {
      this.staffName = currentUser.full_name || 'Clinic Staff';
    }
    
    this.loadDashboardData();
  }

  getInitials(name: string): string {
    if (!name) return '?';
    return name.split(' ').filter(n => n).map(n => n[0]).join('').toUpperCase().substring(0, 2);
  }

  loadDashboardData(): void {
    // Load all dashboard data from Laravel API
    this.http.get<any>(`${environment.apiUrl}/dashboard/clinic/overview`)
      .subscribe({
        next: (response) => {
          if (response.success) {
            const data = response.data;
            
            // Update statistics
            this.totalStudents = data.total_students;
            this.todayVisits = data.today_visits;
            this.totalVisits = data.total_visits;
            this.pendingVisits = data.pending_visits;
            
            // Update recent visits
            this.recentVisits = data.recent_visits.map((visit: any) => ({
              studentName: visit.student_name,
              diagnosis: visit.diagnosis,
              dateTime: visit.date_time,
              status: visit.status,
              avatar: visit.avatar
            }));
            
            // Update students with allergies
            this.studentsWithAllergies = data.students_with_allergies;
            
            this.loadingVisits = false;
            this.loadingAllergies = false;
          } else {
            this.loadingVisits = false;
            this.loadingAllergies = false;
          }
        },
        error: (err) => {
          // Error loading dashboard data
          this.loadingVisits = false;
          this.loadingAllergies = false;
        }
      });
  }
}
