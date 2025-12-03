import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-adviser-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './adviser-dashboard.component.html',
  styleUrls: ['./adviser-dashboard.component.scss']
})
export class AdviserDashboardComponent {
  adviserName = 'Adviser';

  // Adviser-specific data
  advisedStudents = [
    { id: 1, name: 'John Doe', year: '3rd Year', status: 'Active' },
    { id: 2, name: 'Jane Smith', year: '2nd Year', status: 'Active' },
    { id: 3, name: 'Mike Johnson', year: '4th Year', status: 'Active' }
  ];

  pendingApprovals = [
    { student: 'John Doe', type: 'Medical Leave', date: '2024-12-03' },
    { student: 'Jane Smith', type: 'Health Certificate', date: '2024-12-02' }
  ];

  recentActivities = [
    { action: 'Approved medical leave', student: 'Mike Johnson', date: '2024-12-01' },
    { action: 'Reviewed health record', student: 'John Doe', date: '2024-11-30' }
  ];
}
