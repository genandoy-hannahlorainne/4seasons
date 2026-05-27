import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MedicalVisitService } from '../../../core/services/medical-visit.service';

@Component({
  selector: 'app-visit-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './visit-list.component.html',
  styleUrls: ['./visit-list.component.scss']
})
export class VisitListComponent implements OnInit {
  // Medical visits list component
  searchQuery = '';
  selectedDate = '';
  selectedStatus = 'all';
  selectedType = 'all';
  showRecentVisits: { [key: string]: boolean } = {};
  showModal = false;
  loading = false;
  error: string | null = null;
  visits: Array<{
    id: number;
    studentName: string;
    studentNumber: string;
    gradeSection: string;
    avatar: string;
    totalVisits: number;
    lastVisit: string;
    latestVisitType: string;
    chiefComplaint: string;
    status: string;
  }> = [];
  filteredVisits: Array<{
    id: number;
    studentName: string;
    studentNumber: string;
    gradeSection: string;
    avatar: string;
    totalVisits: number;
    lastVisit: string;
    latestVisitType: string;
    chiefComplaint: string;
    status: string;
  }> = [];
  visitForm = {
    student_id: null as number | null,
    visit_type: 'Routine' as 'Routine' | 'Emergency' | 'Follow-up' | 'Referral',
    status: 'Pending' as 'Pending' | 'Completed' | 'Referred to Hospital',
    chief_complaint: '',
    notes: '',
    notify_parent: false,
    notification_method: 'none' as 'sms' | 'email' | 'call' | 'none'
  };

  constructor(private medicalVisitService: MedicalVisitService) {}

  ngOnInit(): void {
    this.loadVisits();
  }

  private loadVisits(): void {
    this.loading = true;
    this.error = null;

    this.medicalVisitService.getAll().subscribe({
      next: (response) => {
        this.loading = false;
        const rawVisits = this.unwrapApiResponse(response);
        this.visits = this.buildVisitSummaries(rawVisits);
        this.applyFilters();
      },
      error: () => {
        this.loading = false;
        this.error = 'Failed to load medical visits. Please try again.';
        this.visits = [];
      }
    });
  }

  private unwrapApiResponse(response: any): any[] {
    if (Array.isArray(response)) {
      return response;
    }

    if (response?.success && response?.data) {
      return Array.isArray(response.data) ? response.data : response.data.data || [];
    }

    if (response?.data) {
      return Array.isArray(response.data) ? response.data : response.data.data || [];
    }

    return [];
  }

  private buildVisitSummaries(rawVisits: any[]): any[] {
    const studentMap = new Map<number, any>();

    rawVisits.forEach((visit) => {
      const studentId = visit.student?.student_id || visit.student_id || visit.student?.id;
      if (!studentId) {
        return;
      }

      const studentName = visit.student?.user?.full_name || visit.student?.full_name || `${visit.student?.first_name || ''} ${visit.student?.last_name || ''}`.trim() || 'Unknown Student';
      const studentNumber = visit.student?.student_number || visit.student_number || 'N/A';
      const gradeSection = [visit.student?.grade_level, visit.student?.section].filter(Boolean).join(' - ') || 'N/A';
      const latestDate = visit.visit_datetime || visit.last_visit?.visit_datetime || visit.updated_at || visit.created_at || '';
      const lastVisitLabel = latestDate ? new Date(latestDate).toLocaleDateString() : visit.lastVisit || 'Unknown';
      const summary = studentMap.get(studentId) || {
        id: studentId,
        studentName,
        studentNumber,
        gradeSection,
        avatar: this.getInitials(studentName),
        totalVisits: 0,
        lastVisit: lastVisitLabel,
        latestVisitType: visit.visit_type || visit.latestVisitType || 'Routine',
        chiefComplaint: visit.chief_complaint || visit.notes || 'No complaint recorded',
        status: visit.status || 'Pending'
      };

      summary.totalVisits += 1;

      if (!studentMap.has(studentId) || new Date(latestDate) > new Date(summary.lastVisit)) {
        summary.lastVisit = lastVisitLabel;
        summary.latestVisitType = visit.visit_type || visit.latestVisitType || summary.latestVisitType;
        summary.chiefComplaint = visit.chief_complaint || visit.notes || summary.chiefComplaint;
        summary.status = visit.status || summary.status;
      }

      studentMap.set(studentId, summary);
    });

    return Array.from(studentMap.values());
  }

  applyFilters(): void {
    const statusFilter = this.selectedStatus.toLowerCase();
    const typeFilter = this.selectedType.toLowerCase();
    const search = this.searchQuery.trim().toLowerCase();
    const selectedDate = this.selectedDate ? new Date(this.selectedDate) : null;

    this.filteredVisits = this.visits.filter((visit) => {
      const matchesStatus = statusFilter === 'all' || visit.status.toLowerCase() === statusFilter;
      const matchesType = typeFilter === 'all' || visit.latestVisitType.toLowerCase() === typeFilter;
      const matchesSearch =
        !search ||
        visit.studentName.toLowerCase().includes(search) ||
        visit.studentNumber.toLowerCase().includes(search) ||
        visit.gradeSection.toLowerCase().includes(search);
      const visitDate = selectedDate && visit.lastVisit ? new Date(visit.lastVisit) : null;
      const matchesDate = !selectedDate || (visitDate?.toDateString() === selectedDate.toDateString());

      return matchesStatus && matchesType && matchesSearch && matchesDate;
    });
  }

  private getInitials(fullName: string): string {
    return fullName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join('');
  }

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
      status: 'Pending',
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
