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
  showModal = false;
  visitForm = {
    student_id: null as number | null,
    visit_type: 'Routine' as 'Routine' | 'Emergency' | 'Follow-up' | 'Referral',
    status: 'Open' as 'Open' | 'Closed' | 'Referred',
    chief_complaint: '',
    notes: '',
    notify_parent: false,
    notification_method: 'none' as 'sms' | 'email' | 'call' | 'none'
  };

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
    // View profile action
  }

  newVisit(studentId?: number) {
    if (studentId) this.visitForm.student_id = studentId;
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.visitForm = {
      student_id: null,
      visit_type: 'Routine',
      status: 'Open',
      chief_complaint: '',
      notes: '',
      notify_parent: false,
      notification_method: 'none'
    };
  }

  submitVisit() {
    // TODO: call MedicalVisitService.create(this.visitForm)
    console.log('Submit visit:', this.visitForm);
    this.closeModal();
  }

  viewAllVisits(studentId: number) {
    // View all visits action
  }
}
