import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { AdminNotificationBellComponent } from '../shared/admin-notification-bell.component';

@Component({
  selector: 'app-manage-sections',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminNotificationBellComponent],
  templateUrl: './manage-sections.component.html',
  styleUrls: ['./manage-sections.component.scss']
})
export class ManageSectionsComponent implements OnInit {
  gradeLevels: any[] = [];
  advisers: any[] = [];
  loading = false;
  errorMessage = '';
  successMessage = '';
  sectionSearch = '';
  currentPage = 1;
  pageSize = 8;
  readonly pageSizeOptions = [6, 8, 12, 24];

  // Selected grade for viewing details
  selectedGradeId: number | null = null;

  // Add/Edit modal
  showModal = false;
  isEditing = false;
  saving = false;
  modalError = '';
  form: any = this.emptyForm();
  originalAdviserId: any = '';

  // Adviser change confirmation
  adviserChangeReason = '';
  adviserChangePassword = '';

  // Delete confirm
  showDeleteConfirm = false;
  deletingSection: any = null;
  deleting = false;
  deleteReason = '';
  deletePassword = '';
  deleteError = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.http.get<any>(`${environment.apiUrl}/admin/grade-levels`).subscribe({
      next: (res) => {
        this.gradeLevels = res.data || [];
        this.loading = false;
      },
      error: () => { this.loading = false; this.errorMessage = 'Failed to load sections.'; }
    });

    this.http.get<any>(`${environment.apiUrl}/admin/advisers`).subscribe({
      next: (res) => { this.advisers = res.data || []; }
    });
  }

  selectGrade(gradeId: number): void {
    this.selectedGradeId = gradeId;
    this.sectionSearch = '';
    this.currentPage = 1;
  }

  backToCards(): void {
    this.selectedGradeId = null;
    this.sectionSearch = '';
    this.currentPage = 1;
  }

  get selectedGrade(): any {
    return this.gradeLevels.find(g => g.id === this.selectedGradeId);
  }

  get filteredSections(): any[] {
    if (!this.selectedGrade?.sections) return [];
    if (!this.sectionSearch.trim()) return this.selectedGrade.sections;

    const q = this.sectionSearch.toLowerCase();
    return this.selectedGrade.sections.filter((s: any) =>
      s.section_name?.toLowerCase().includes(q) ||
      s.adviser_name?.toLowerCase().includes(q) ||
      this.getAdviserName(s.adviser_id)?.toLowerCase().includes(q)
    );
  }

  get totalPages(): number {
    return Math.ceil(this.filteredSections.length / this.pageSize);
  }

  get paginatedSections(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredSections.slice(start, start + this.pageSize);
  }

  get pageStartIndex(): number {
    if (this.filteredSections.length === 0) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get pageEndIndex(): number {
    return Math.min(this.currentPage * this.pageSize, this.filteredSections.length);
  }

  get sectionPageNumbers(): number[] {
    const pages: number[] = [];
    const total = this.totalPages;
    const current = this.currentPage;
    const delta = 2;

    for (let page = Math.max(1, current - delta); page <= Math.min(total, current + delta); page++) {
      pages.push(page);
    }

    return pages;
  }

  trackBySectionId(index: number, section: any): number | string {
    return section?.id ?? section?.section_id ?? section?.section_name ?? index;
  }

  goToPage(page: number): void {
    if (this.totalPages < 1) {
      this.currentPage = 1;
      return;
    }

    this.currentPage = Math.min(Math.max(page, 1), this.totalPages);
  }

  onSectionSearchChange(): void {
    this.currentPage = 1;
  }

  emptyForm() {
    return { id: null, section_name: '', grade_level_id: '', adviser_id: '', capacity: 50 };
  }

  openAdd(gradeLevelId?: number): void {
    this.form = this.emptyForm();
    if (gradeLevelId) this.form.grade_level_id = gradeLevelId;
    this.isEditing = false;
    this.modalError = '';
    this.showModal = true;
  }

  openEdit(section: any): void {
    this.form = {
      id: section.id,
      section_name: section.section_name,
      grade_level_id: section.grade_level_id,
      adviser_id: section.adviser_id || '',
      capacity: section.capacity || 50
    };
    this.originalAdviserId = section.adviser_id || '';
    this.adviserChangeReason = '';
    this.adviserChangePassword = '';
    this.isEditing = true;
    this.modalError = '';
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.form = this.emptyForm();
    this.originalAdviserId = '';
    this.adviserChangeReason = '';
    this.adviserChangePassword = '';
  }

  adviserChanged(): boolean {
    return this.isEditing && String(this.form.adviser_id) !== String(this.originalAdviserId);
  }

  saveSection(): void {
    if (!this.form.section_name || !this.form.grade_level_id) {
      this.modalError = 'Section name and grade level are required.';
      return;
    }

    // If adviser changed, require reason and password
    if (this.adviserChanged()) {
      if (!this.adviserChangeReason.trim()) {
        this.modalError = 'Please provide a reason for the adviser change.';
        return;
      }
      if (!this.adviserChangePassword.trim()) {
        this.modalError = 'Please enter your password to confirm the adviser change.';
        return;
      }
    }

    this.saving = true;
    this.modalError = '';

    const payload: any = {
      section_name: this.form.section_name,
      grade_level_id: this.form.grade_level_id,
      adviser_id: this.form.adviser_id || null,
      capacity: this.form.capacity
    };

    if (this.adviserChanged()) {
      payload.adviser_change_reason = this.adviserChangeReason;
      payload.password = this.adviserChangePassword;
    }

    const req = this.isEditing
      ? this.http.put<any>(`${environment.apiUrl}/admin/sections/${this.form.id}`, payload)
      : this.http.post<any>(`${environment.apiUrl}/admin/sections`, { ...payload, school_year_id: this.getCurrentSchoolYearId() });

    req.subscribe({
      next: (res) => {
        this.saving = false;
        if (res.success) {
          this.successMessage = this.isEditing ? 'Section updated.' : 'Section created.';
          this.closeModal();
          this.loadData();
          setTimeout(() => this.successMessage = '', 3000);
        } else {
          this.modalError = res.message || 'Failed to save.';
        }
      },
      error: (err) => {
        this.saving = false;
        this.modalError = err.error?.message || err.error?.errors || 'Failed to save section.';
      }
    });
  }

  confirmDelete(section: any): void {
    this.deletingSection = section;
    this.deleteReason = '';
    this.deletePassword = '';
    this.deleteError = '';
    this.showDeleteConfirm = true;
  }

  cancelDelete(): void {
    this.showDeleteConfirm = false;
    this.deletingSection = null;
    this.deleteReason = '';
    this.deletePassword = '';
    this.deleteError = '';
  }

  deleteSection(): void {
    if (!this.deletingSection) return;
    if (!this.deleteReason.trim()) { this.deleteError = 'Please provide a reason for deletion.'; return; }
    if (!this.deletePassword.trim()) { this.deleteError = 'Please enter your password to confirm.'; return; }

    this.deleting = true;
    this.deleteError = '';

    this.http.delete<any>(`${environment.apiUrl}/admin/sections/${this.deletingSection.id}`, {
      body: { reason: this.deleteReason, password: this.deletePassword }
    }).subscribe({
      next: (res) => {
        this.deleting = false;
        this.showDeleteConfirm = false;
        this.deletingSection = null;
        this.deleteReason = '';
        this.deletePassword = '';
        this.successMessage = 'Section deleted.';
        this.loadData();
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        this.deleting = false;
        this.deleteError = err.error?.message || 'Failed to delete section. Check your password and try again.';
      }
    });
  }

  getAdviserName(adviserId: number): string {
    const adviser = this.advisers.find(a => a.user_id === adviserId);
    return adviser ? adviser.full_name : '—';
  }

  getTotalEnrollment(grade: any): number {
    if (!grade.sections || grade.sections.length === 0) return 0;
    return grade.sections.reduce((sum: number, section: any) => sum + (section.current_enrollment || 0), 0);
  }

  getAssignedCount(grade: any): number {
    if (!grade?.sections) return 0;
    return grade.sections.filter((s: any) => s.adviser_id || s.adviser_name).length;
  }

  getUnassignedCount(grade: any): number {
    if (!grade?.sections) return 0;
    return grade.sections.filter((s: any) => !s.adviser_id && !s.adviser_name).length;
  }

  getFillRate(section: any): number {
    if (!section.capacity || section.capacity === 0) return 0;
    return Math.round(((section.current_enrollment || 0) / section.capacity) * 100);
  }

  private getCurrentSchoolYearId(): number | null {
    // Will be resolved server-side if not provided
    return null;
  }
}
