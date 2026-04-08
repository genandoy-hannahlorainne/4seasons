import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-manage-sections',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './manage-sections.component.html',
  styleUrls: ['./manage-sections.component.scss']
})
export class ManageSectionsComponent implements OnInit {
  gradeLevels: any[] = [];
  advisers: any[] = [];
  loading = false;
  errorMessage = '';
  successMessage = '';

  // Selected grade for viewing details
  selectedGradeId: number | null = null;

  // Add/Edit modal
  showModal = false;
  isEditing = false;
  saving = false;
  modalError = '';
  form: any = this.emptyForm();

  // Delete confirm
  showDeleteConfirm = false;
  deletingSection: any = null;
  deleting = false;

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
  }

  backToCards(): void {
    this.selectedGradeId = null;
  }

  get selectedGrade(): any {
    return this.gradeLevels.find(g => g.id === this.selectedGradeId);
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
    this.isEditing = true;
    this.modalError = '';
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.form = this.emptyForm();
  }

  saveSection(): void {
    if (!this.form.section_name || !this.form.grade_level_id) {
      this.modalError = 'Section name and grade level are required.';
      return;
    }
    this.saving = true;
    this.modalError = '';

    const payload = {
      section_name: this.form.section_name,
      grade_level_id: this.form.grade_level_id,
      adviser_id: this.form.adviser_id || null,
      capacity: this.form.capacity
    };

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
    this.showDeleteConfirm = true;
  }

  cancelDelete(): void {
    this.showDeleteConfirm = false;
    this.deletingSection = null;
  }

  deleteSection(): void {
    if (!this.deletingSection) return;
    this.deleting = true;
    this.http.delete<any>(`${environment.apiUrl}/admin/sections/${this.deletingSection.id}`).subscribe({
      next: (res) => {
        this.deleting = false;
        this.showDeleteConfirm = false;
        this.deletingSection = null;
        this.successMessage = 'Section deleted.';
        this.loadData();
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (err) => {
        this.deleting = false;
        this.errorMessage = err.error?.message || 'Failed to delete section.';
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

  private getCurrentSchoolYearId(): number | null {
    // Will be resolved server-side if not provided
    return null;
  }
}
