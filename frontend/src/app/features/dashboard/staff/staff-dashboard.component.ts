import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-staff-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './staff-dashboard.component.html',
  styleUrls: ['./staff-dashboard.component.scss']
})
export class StaffDashboardComponent {
  staffName = 'Staff';

  // Staff-specific data
  todayAppointments = [
    { time: '9:00 AM', student: 'John Doe', type: 'Medical Checkup', status: 'Scheduled' },
    { time: '10:30 AM', student: 'Jane Smith', type: 'Dental Checkup', status: 'In Progress' },
    { time: '2:00 PM', student: 'Mike Johnson', type: 'Physical Exam', status: 'Scheduled' }
  ];

  pendingRecords = [
    { student: 'John Doe', type: 'Lab Results', date: '2024-12-02' },
    { student: 'Jane Smith', type: 'X-Ray Report', date: '2024-12-01' }
  ];

  statistics = {
    totalAppointments: 15,
    completedToday: 5,
    pendingRecords: 8,
    activeStudents: 120
  };
}
