import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

interface StudentHealthRecord {
  id: number;
  name: string;
  lrn: string;
  status: string;
  lastCheckup: string;
  notes: string;
}

@Component({
  selector: 'app-staff-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './staff-dashboard.component.html',
  styleUrls: ['./staff-dashboard.component.scss']
})
export class StaffDashboardComponent implements OnInit {
  staffName = 'Mrs. User';
  gradeLevel = 'Grade 10 - Humility';
  studentCount = '42';
  
  // Statistics
  fitForActivities = '3,483';
  pendingAssessment = '46';
  restrictedActivities = '3';
  specialMedicalNeeds = '21';
  
  // Student health records
  students: StudentHealthRecord[] = [];
  filteredStudents: StudentHealthRecord[] = [];
  searchTerm = '';
  
  loading = true;
  error = '';

  constructor(private authService: AuthService) {}

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

    // Mock data - Replace with actual API calls
    this.students = [
      {
        id: 1,
        name: 'Hannah Genandoy',
        lrn: '2023-00438-TG-O',
        status: 'Fit',
        lastCheckup: 'Oct 15, 2024',
        notes: 'No restrictions'
      },
      {
        id: 2,
        name: 'Mik Esparagoza',
        lrn: '2023-00435-TG-O',
        status: 'Restricted',
        lastCheckup: 'Oct 15, 2024',
        notes: 'No restrictions'
      },
      {
        id: 3,
        name: 'Mik Esparagoza',
        lrn: '2023-00435-TG-O',
        status: 'Restricted',
        lastCheckup: 'Oct 15, 2024',
        notes: 'No restrictions'
      },
      {
        id: 4,
        name: 'Mik Esparagoza',
        lrn: '2023-00435-TG-O',
        status: 'Restricted',
        lastCheckup: 'Oct 15, 2024',
        notes: 'No restrictions'
      }
    ];

    this.filteredStudents = [...this.students];
    this.loading = false;
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
  }
}
