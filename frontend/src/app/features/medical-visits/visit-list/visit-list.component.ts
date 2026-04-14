import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-visit-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './visit-list.component.html',
  styleUrls: ['./visit-list.component.scss']
})
export class VisitListComponent {
  // Medical visits list component
  searchQuery = '';
  selectedDate = '';
  selectedStatus = 'all';
  selectedType = 'all';
  showRecentVisits: { [key: string]: boolean } = {};

  visits = [
    {
      id: 1,
      studentName: 'clarence villas',
      studentNumber: '368840100761',
      gradeSection: 'Grade 10 - Lily',
      avatar: 'CV',
      totalVisits: 1,
      lastVisit: 'Yesterday',
      latestVisitType: 'Emergency',
      chiefComplaint: 'Fever',
      status: 'cancelled'
    }
  ];

  toggleRecentVisits(studentId: number) {
    this.showRecentVisits[studentId] = !this.showRecentVisits[studentId];
  }

  viewProfile(studentId: number) {
    console.log('View profile:', studentId);
  }

  newVisit(studentId?: number) {
    console.log('New visit:', studentId);
  }

  viewAllVisits(studentId: number) {
    console.log('View all visits:', studentId);
  }
}
