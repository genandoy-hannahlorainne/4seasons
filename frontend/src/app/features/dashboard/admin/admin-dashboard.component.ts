import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent {
  adminName = 'Admin';

  // Admin-specific data
  systemStats = {
    totalUsers: 450,
    totalStudents: 380,
    totalStaff: 25,
    totalAdvisers: 45
  };

  recentUsers = [
    { name: 'John Doe', role: 'Student', registeredDate: '2024-12-01', status: 'Active' },
    { name: 'Dr. Smith', role: 'Staff', registeredDate: '2024-11-30', status: 'Active' },
    { name: 'Prof. Johnson', role: 'Adviser', registeredDate: '2024-11-29', status: 'Active' }
  ];

  systemAlerts = [
    { type: 'warning', message: 'Database backup pending', date: '2024-12-03' },
    { type: 'info', message: 'System update available', date: '2024-12-02' }
  ];

  activityLog = [
    { action: 'User registered', user: 'John Doe', timestamp: '2024-12-03 10:30 AM' },
    { action: 'Record updated', user: 'Staff Member', timestamp: '2024-12-03 09:15 AM' },
    { action: 'Report generated', user: 'Admin', timestamp: '2024-12-02 04:45 PM' }
  ];
}
