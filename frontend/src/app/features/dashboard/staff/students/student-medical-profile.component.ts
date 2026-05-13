import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { StaffService } from '../../../../core/services/staff.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-student-medical-profile',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './student-medical-profile.component.html',
  styleUrls: ['./student-medical-profile.component.scss']
})
export class StudentMedicalProfileComponent implements OnInit {
  studentId: number = 0;
  activeTab = 'vitals';
  loading = true;
  error = '';
  hasMedicalRecord = false;

  student = {
    name: '',
    student_number: '',
    grade_section: '',
    blood_type: '',
    email: '',
    phone: '',
    avatar: ''
  };

  vitalsHistory: any[] = [];
  diagnoses: any[] = [];
  allergies: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private staffService: StaffService,
    private authService: AuthService
  ) {}

  getInitials(name: string): string {
    if (!name) return '?';
    return name.split(' ').filter(n => n).map(n => n[0]).join('').toUpperCase().substring(0, 2);
  }

  get backRoute(): string {
    const role = this.authService.currentUserValue?.role_name;
    return role === 'Adviser' ? '/dashboard/adviser/alerts' : '/dashboard/staff/students';
  }

  ngOnInit(): void {
    this.studentId = Number(this.route.snapshot.paramMap.get('id'));
    if (this.studentId) {
      this.loadStudentProfile();
    } else {
      this.error = 'Invalid student ID';
      this.loading = false;
    }
  }

  loadStudentProfile(): void {
    this.loading = true;
    this.error = '';

    this.staffService.getStudentProfile(this.studentId).subscribe({
      next: (response: any) => {
        this.loading = false;

        if (response && response.success) {
          const payload = response.data ?? response;
          const studentData = payload.student ?? payload.profile ?? payload;
          const fullName =
            studentData.full_name ||
            studentData.name ||
            [studentData.first_name, studentData.middle_name, studentData.last_name]
              .filter(Boolean)
              .join(' ')
              .trim();

          const gradeSection =
            studentData.grade_section ||
            [studentData.grade_level, studentData.section].filter(Boolean).join(' - ');

          this.student = {
            name: fullName || 'Unknown',
            student_number: studentData.student_number || studentData.lrn || '',
            grade_section: gradeSection || '',
            blood_type: studentData.blood_type || '',
            email: studentData.email || studentData.user?.email || '',
            phone: studentData.phone || studentData.user?.phone || '',
            avatar: studentData.avatar || ''
          };

          const visits = payload.medical_visits || payload.medicalVisits || [];
          const mappedVitalsFromVisits = Array.isArray(visits)
            ? visits.flatMap((visit: any) => {
                if (!Array.isArray(visit?.vitals) || visit.vitals.length === 0) {
                  return [];
                }

                return visit.vitals.map((vital: any) => ({
                  date: vital.recorded_at || vital.created_at || visit.visit_datetime || '',
                  temperature: vital.temperature_c ?? vital.temperature ?? '',
                  blood_pressure: vital.blood_pressure || [vital.bp_systolic, vital.bp_diastolic].filter(Boolean).join('/') || '',
                  pulse_rate: vital.pulse_rate ?? '',
                  weight: vital.weight_kg ?? '',
                  height: vital.height_cm ?? ''
                }));
              })
            : [];

          this.vitalsHistory = this.normalizeVitalsHistory(payload.vitals || payload.vitals_history || mappedVitalsFromVisits || []);
          this.diagnoses = payload.diagnoses || payload.medical_history || [];
          this.allergies = payload.allergies || [];

          this.hasMedicalRecord = 
            this.vitalsHistory.length > 0 ||
            this.diagnoses.length > 0 ||
            this.allergies.length > 0;
        } else {
          this.error = response?.message || 'Failed to load student profile';
        }
      },
      error: (err: any) => {
        this.loading = false;
        this.error = 'Failed to load student profile. Please try again.';
      }
    });
  }

  private normalizeVitalsHistory(vitals: any[]): any[] {
    if (!Array.isArray(vitals)) {
      return [];
    }

    return vitals.map((vital: any) => ({
      ...vital,
      date_display: this.formatDateDisplay(vital?.date || vital?.recorded_at || vital?.created_at)
    }));
  }

  private formatDateDisplay(value: any): string {
    if (!value) {
      return '';
    }

    const raw = String(value).trim();
    if (!raw) {
      return '';
    }

    let candidate = raw;
    if (raw.includes(' ') && !raw.includes('T')) {
      candidate = raw.replace(' ', 'T');
    }

    candidate = candidate
      .replace(/\.(\d{3})\d+Z$/, '.$1Z')
      .replace(/\.(\d{3})\d+$/, '.$1');

    const parsed = new Date(candidate);
    if (Number.isNaN(parsed.getTime())) {
      return raw;
    }

    return parsed.toLocaleString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }
}
