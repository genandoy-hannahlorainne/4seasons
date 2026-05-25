import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { AdviserService, AdvisedStudent } from '../../../core/services/adviser.service';
import { StudentProfileModalComponent } from './student-profile-modal/student-profile-modal.component';
import { PushNotificationService } from '../../../core/services/push-notification.service';
import { AdviserNotificationBellComponent } from './shared/adviser-notification-bell.component';
import { AdviserLayoutUiService } from '../../../core/services/adviser-layout-ui.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-adviser-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, StudentProfileModalComponent, AdviserNotificationBellComponent],
  template: `
    <div class="adviser-dashboard">

      <!-- Push Notification Banner -->
      <div *ngIf="showNotifBanner" class="notif-banner">
        <i class="fa-solid fa-bell"></i>
        <span>Enable push notifications to receive clinic visit alerts on this device.</span>
        <button (click)="enableNotifications()">Enable Now</button>
        <button class="dismiss" (click)="showNotifBanner = false">✕</button>
      </div>

      <!-- Hero Section -->
      <div class="hero-section" [class.sidebar-drawer-open]="mobileSidebarOpen">
        <app-adviser-notification-bell *ngIf="!mobileSidebarOpen" variant="hero" />
        <div class="hero-content">
          <div class="hero-text">
            <h1>Welcome, {{ adviserTitle ? adviserTitle + ' ' : '' }}{{ adviserName }}</h1>
            <p>{{ advisoryClass || 'Advisory Class' }} &mdash; Manage and monitor your students' health records</p>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading dashboard...</p>
      </div>

      <!-- Error State -->
      <div *ngIf="error" class="dashboard-content">
        <div class="error-state">
          <p>{{ error }}</p>
          <button (click)="loadStudents()">Retry</button>
        </div>
      </div>

      <div *ngIf="!loading && !error" class="dashboard-content">

        <!-- Stats -->
        <div class="stats-grid">
          <div class="stat-card students">
            <div class="stat-icon"><i class="fa-solid fa-users"></i></div>
            <div class="stat-info">
              <div class="stat-value">{{ totalStudents }}</div>
              <div class="stat-label">Total Students</div>
            </div>
          </div>
          <div class="stat-card visits">
            <div class="stat-icon"><i class="fa-solid fa-notes-medical"></i></div>
            <div class="stat-info">
              <div class="stat-value">{{ clinicVisitsThisMonth }}</div>
              <div class="stat-label">Clinic Visits This Month</div>
            </div>
          </div>
          <div class="stat-card allergies">
            <div class="stat-icon"><i class="fa-solid fa-triangle-exclamation"></i></div>
            <div class="stat-info">
              <div class="stat-value">{{ studentsWithAllergies }}</div>
              <div class="stat-label">Students With Allergies</div>
            </div>
          </div>
        </div>

        <!-- Students Under Advisory -->
        <div class="card">
          <div class="card-header">
            <h2><i class="fa-solid fa-user-graduate"></i> Students Under Your Advisory</h2>
            <span class="badge">{{ advisoryStudents.length }} students</span>
          </div>

          <div class="students-grid" *ngIf="advisoryStudents.length > 0">
            <div *ngFor="let student of advisoryStudents" class="student-card">
              <div class="student-avatar">
                <i [class]="getAvatarUrl(student)" style="font-size:40px;color:#052355;"></i>
              </div>
              <div class="student-info">
                <div class="student-name">{{ student.full_name }}</div>
                <div class="student-number">{{ student.student_number }}</div>
                <div class="student-section">{{ student.grade_section }}</div>
              </div>
              <button class="btn-view" (click)="viewStudent(student)">View Profile</button>
            </div>
          </div>

          <div class="no-data" *ngIf="advisoryStudents.length === 0">
            <span><i class="fa-solid fa-users-slash"></i></span>
            <p>No students registered in your advisory class yet.</p>
          </div>
        </div>

        <!-- Recent Activity -->
        <div class="card" *ngIf="recentActivity.length > 0">
          <div class="card-header">
            <h2><i class="fa-solid fa-clock-rotate-left"></i> Recent Clinic Activity</h2>
          </div>
          <div class="activity-list">
            <div *ngFor="let activity of recentActivity" class="activity-item">
              <div class="activity-icon" [ngClass]="activity.type">
                <i *ngIf="activity.type === 'visit'" class="fa-solid fa-notes-medical"></i>
                <i *ngIf="activity.type === 'alert'" class="fa-solid fa-triangle-exclamation"></i>
                <i *ngIf="activity.type === 'checkup'" class="fa-solid fa-circle-check"></i>
              </div>
              <div class="activity-details">
                <div class="activity-action">{{ activity.message }}</div>
                <div class="activity-meta"><span class="activity-time">{{ activity.time }}</span></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Health Monitoring -->
        <div class="card health-monitor-card">
          <div class="monitor-content">
            <div class="monitor-icon"><i class="fa-solid fa-chart-line"></i></div>
            <div class="monitor-info">
              <h3>Class Health Monitoring</h3>
              <p>View health trends and clinic visit patterns for your class</p>
            </div>
            <button class="btn-monitor" routerLink="/dashboard/adviser/health-monitoring">
              View Heat Map <i class="fa-solid fa-arrow-right"></i>
            </button>
          </div>
        </div>

      </div>
    </div>

    <!-- Student Profile Modal -->
    <app-student-profile-modal
      *ngIf="selectedStudent"
      [student]="selectedStudent"
      (close)="closeModal()">
    </app-student-profile-modal>
  `,
  styles: [`
    .adviser-dashboard {
      padding: 2rem;
      background: #f5f7fa;
      min-height: 100vh;
    }

    /* ── Notification Banner ── */
    .notif-banner {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      background: #fff8e1;
      border: 1px solid #f59e0b;
      border-radius: 10px;
      padding: 0.85rem 1.25rem;
      margin-bottom: 1.25rem;
      font-size: 0.9rem;
      color: #92400e;

      i { color: #f59e0b; font-size: 1.1rem; flex-shrink: 0; }
      span { flex: 1; }

      button {
        padding: 0.4rem 1rem;
        background: #f59e0b;
        color: white;
        border: none;
        border-radius: 6px;
        font-weight: 600;
        cursor: pointer;
        font-size: 0.85rem;
        flex-shrink: 0;

        &.dismiss {
          background: transparent;
          color: #92400e;
          padding: 0.4rem 0.6rem;
          font-size: 1rem;
        }
      }
    }

    /* ── Hero ── */
    .hero-section {
      background: linear-gradient(135deg, #052355 0%, #5381b2 100%);
      border-radius: 12px;
      padding: 2rem;
      margin-bottom: 2rem;
      color: white;
      position: relative;

      .hero-text {
        padding-right: 4.5rem;
      }

      &.sidebar-drawer-open .hero-text {
        padding-right: 0;
      }

      h1 {
        font-size: 1.8rem;
        font-weight: 700;
        margin: 0 0 0.4rem;
      }
      p {
        margin: 0;
        opacity: 0.85;
        font-size: 0.95rem;
      }
    }

    @media (max-width: 768px) {
      .hero-section {
        padding: 1.5rem 1.25rem;

        .hero-text { padding-right: 3.75rem; }

        h1 { font-size: 1.4rem; }
        p  { font-size: 0.875rem; }
      }
    }

    @media (max-width: 480px) {
      .hero-section {
        padding: 1.25rem 1rem;

        .hero-text { padding-right: 3.25rem; }

        h1 { font-size: 1.2rem; }
      }
    }

    /* ── Loading / Error ── */
    .loading-state, .error-state {
      text-align: center;
      padding: 3rem;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);

      .spinner {
        width: 48px;
        height: 48px;
        margin: 0 auto 1rem;
        border: 4px solid #e8f0f8;
        border-top: 4px solid #052355;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
      p { color: #7f8c8d; }
      button {
        padding: 0.5rem 1.5rem;
        background: #052355;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
      }
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* ── Stats Grid ── */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .stat-card {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      display: flex;
      align-items: center;
      gap: 1rem;
      border-left: 4px solid;

      &.students  { border-color: #2ecc71; .stat-icon { color: #2ecc71; } }
      &.visits    { border-color: #3498db; .stat-icon { color: #3498db; } }
      &.allergies { border-color: #e67e22; .stat-icon { color: #e67e22; } }

      .stat-icon { font-size: 2rem; opacity: 0.9; }

      .stat-info {
        .stat-value { font-size: 2rem; font-weight: 700; color: #2c3e50; line-height: 1; }
        .stat-label { color: #7f8c8d; font-size: 0.875rem; margin-top: 0.25rem; }
      }
    }

    /* ── Cards ── */
    .card {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      margin-bottom: 1.5rem;

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.25rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid #e9ecef;

        h2 {
          font-size: 1.1rem;
          color: #2c3e50;
          margin: 0;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          i { color: #3498db; font-size: 1rem; }
        }

        .badge {
          background: #e3f2fd;
          color: #1976d2;
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 600;
        }
      }
    }

    /* ── Students Grid ── */
    .students-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 1rem;
    }

    .student-card {
      background: #f8f9fa;
      border: 1px solid #e9ecef;
      border-radius: 10px;
      padding: 1.25rem 1rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.6rem;
      transition: all 0.2s ease;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        border-color: #d0e4f7;
      }

      .student-avatar {
        width: 56px;
        height: 56px;
        border-radius: 50%;
        overflow: hidden;
        border: 2px solid #e9ecef;
        img { width: 100%; height: 100%; object-fit: cover; }
      }

      .student-info {
        text-align: center;
        .student-name  { font-weight: 600; color: #2c3e50; font-size: 0.9rem; }
        .student-number { color: #7f8c8d; font-size: 0.78rem; font-family: monospace; }
        .student-section { color: #95a5a6; font-size: 0.78rem; }
      }

      .btn-view {
        width: 100%;
        padding: 0.45rem;
        background: linear-gradient(135deg, #052355 0%, #5381b2 100%);
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 0.82rem;
        font-weight: 600;
        transition: all 0.2s;
        box-shadow: 0 2px 6px rgba(5,35,85,0.2);

        &:hover {
          background: linear-gradient(135deg, #041d44 0%, #4270a1 100%);
          box-shadow: 0 4px 10px rgba(5,35,85,0.3);
        }
      }
    }

    /* ── No Data ── */
    .no-data {
      text-align: center;
      padding: 2.5rem;
      color: #7f8c8d;

      span { font-size: 2rem; display: block; margin-bottom: 0.5rem; opacity: 0.5; }
      p { margin: 0; font-size: 0.9rem; }
    }

    /* ── Activity ── */
    .activity-list {
      .activity-item {
        display: flex;
        align-items: flex-start;
        gap: 1rem;
        padding: 0.75rem 0;
        border-bottom: 1px solid #f1f3f4;
        &:last-child { border-bottom: none; }

        .activity-icon {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.95rem;
          flex-shrink: 0;

          &.visit   { background: #e3f2fd; color: #1976d2; }
          &.alert   { background: #fff8e1; color: #f57c00; }
          &.checkup { background: #e8f5e9; color: #388e3c; }
        }

        .activity-details {
          flex: 1;
          .activity-action { font-weight: 500; color: #2c3e50; font-size: 0.9rem; margin-bottom: 0.2rem; }
          .activity-meta   { font-size: 0.8rem; color: #95a5a6; }
        }
      }
    }

    /* ── Health Monitor Banner ── */
    .health-monitor-card {
      background: linear-gradient(135deg, #052355 0%, #5381b2 100%);
      color: white;

      .monitor-content {
        display: flex;
        align-items: center;
        gap: 1.5rem;
      }

      .monitor-icon {
        width: 56px;
        height: 56px;
        background: rgba(255,255,255,0.15);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.6rem;
        flex-shrink: 0;
      }

      .monitor-info {
        flex: 1;
        h3 { font-size: 1.1rem; font-weight: 700; margin: 0 0 0.3rem; }
        p  { margin: 0; opacity: 0.85; font-size: 0.875rem; }
      }

      .btn-monitor {
        padding: 0.65rem 1.25rem;
        background: white;
        color: #052355;
        border: none;
        border-radius: 8px;
        font-weight: 700;
        font-size: 0.875rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex-shrink: 0;
        transition: all 0.2s;

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }
      }
    }

    /* ── Responsive ── */
    @media (max-width: 1024px) {
      .stats-grid { grid-template-columns: repeat(2, 1fr); }
    }

    @media (max-width: 640px) {
      .adviser-dashboard { padding: 1rem; }
      .stats-grid { grid-template-columns: 1fr; }
      .monitor-content { flex-direction: column; text-align: center; }
    }
  `]
})
export class AdviserDashboardComponent implements OnInit, OnDestroy {
  adviserName = '';
  adviserTitle = '';  // Ma'am or Sir
  advisoryClass = '';
  mobileSidebarOpen = false;
  private layoutSub?: Subscription;
  selectedStudent: any = null;
  loading = true;
  error = '';
  
  // Stats
  totalStudents = 0;
  clinicVisitsThisMonth = 0;
  studentsWithAllergies = 0;

  // Students from API
  advisoryStudents: AdvisedStudent[] = [];

  // Recent activity (generated from student visits)
  recentActivity: { type: string; message: string; time: string }[] = [];

  constructor(
    private authService: AuthService,
    private adviserService: AdviserService,
    private pushService: PushNotificationService,
    private layoutUi: AdviserLayoutUiService
  ) {}

  showNotifBanner = false;

  ngOnInit(): void {
    this.layoutSub = this.layoutUi.mobileSidebarOpen$.subscribe(open => {
      this.mobileSidebarOpen = open;
    });

    // Show banner if push is supported but permission not yet granted
    if (this.pushService.isSupported() && Notification.permission !== 'granted') {
      this.showNotifBanner = true;
    }
    const currentUser = this.authService.currentUserValue;
    if (currentUser) {
      const fullName = currentUser.full_name || 'Adviser';
      // Extract last name (last word of full name)
      const parts = fullName.trim().split(/\s+/);
      this.adviserName = parts[parts.length - 1];
      this.loadStudents();
    }

    // Fetch gender from adviser profile to set title
    this.adviserService.getAdviserProfile().subscribe({
      next: (response: any) => {
        if (response.success && response.data?.gender) {
          this.adviserTitle = response.data.gender === 'F' ? "Ma'am" : response.data.gender === 'M' ? 'Sir' : '';
        }
      },
      error: () => {}
    });
  }

  ngOnDestroy(): void {
    this.layoutSub?.unsubscribe();
  }

  async enableNotifications(): Promise<void> {
    await this.pushService.requestFromUserGesture();
    if (Notification.permission === 'granted') {
      this.showNotifBanner = false;
    }
  }

  loadStudents(): void {
    this.loading = true;
    this.error = '';
    
    const currentUser = this.authService.currentUserValue;
    if (!currentUser?.user_id) {
      this.error = 'User not found';
      this.loading = false;
      return;
    }

    // Fetch the advisory students from Laravel API
    this.adviserService.getAdvisoryStudents().subscribe({
      next: (response: any) => {
        if (response.success) {
          this.advisoryClass = response.data.adviser.advisory_class;
          this.advisoryStudents = response.data.students;
          this.totalStudents = response.data.stats.total_students;
          this.clinicVisitsThisMonth = response.data.stats.clinic_visits_this_month;
          this.studentsWithAllergies = response.data.stats.students_with_allergies;

          // Set title based on gender from profile
          const gender = response.data.adviser?.gender;
          if (gender) {
            this.adviserTitle = gender === 'F' ? "Ma'am" : gender === 'M' ? 'Sir' : '';
          }
          
          // Generate recent activity from student visits
          this.generateRecentActivity();
        } else {
          this.error = 'Failed to load students';
        }
        this.loading = false;
      },
      error: (err: any) => {
        // Error loading students
        this.error = 'Failed to load students. Please try again.';
        this.loading = false;
      }
    });
  }

  generateRecentActivity(): void {
    this.recentActivity = [];
    
    // Get students with recent visits
    const studentsWithVisits = this.advisoryStudents
      .filter(s => s.last_visit)
      .sort((a, b) => {
        const dateA = new Date(a.last_visit?.visit_date || 0);
        const dateB = new Date(b.last_visit?.visit_date || 0);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 5);

    studentsWithVisits.forEach(student => {
      if (student.last_visit) {
        this.recentActivity.push({
          type: 'visit',
          message: `${student.full_name} visited the clinic - ${student.last_visit.reason}`,
          time: this.formatDate(student.last_visit.visit_date)
        });
      }
    });

    // Add allergy alerts
    this.advisoryStudents
      .filter(s => s.allergies && s.allergies.length > 0)
      .slice(0, 2)
      .forEach(student => {
        this.recentActivity.push({
          type: 'alert',
          message: `${student.full_name} has allergies: ${student.allergies.join(', ')}`,
          time: 'Active'
        });
      });
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  getAvatarUrl(student: AdvisedStudent): string {
    return 'bi bi-person-circle';
  }

  viewStudent(student: AdvisedStudent): void {
    this.adviserService.getStudentCompleteProfile(student.student_id).subscribe({
      next: (response: any) => {
        const profile = response?.data?.profile || response?.data?.personal_info || response?.profile;
        if (profile) {
          const birthDate = profile.birth_date ? new Date(profile.birth_date) : null;
          const age = birthDate
            ? Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
            : null;

          const allergies = (response?.data?.allergies || []).map((a: any) =>
            a.allergy_name || a.name || a
          );

          const visits = (response?.data?.medical_visits || []).map((v: any) => ({
            date: v.visit_datetime
              ? new Date(v.visit_datetime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              : 'N/A',
            reason: v.reason || v.chief_complaint || 'N/A',
            status: (v.status || 'resolved').toLowerCase(),
            statusText: v.status || 'Completed'
          }));

          this.selectedStudent = {
            name: profile.full_name || `${profile.first_name} ${profile.last_name}`,
            studentNumber: profile.student_number,
            gradeSection: `${profile.grade_level || ''} - ${profile.section || ''}`.trim().replace(/^-\s*|-\s*$/, ''),
            avatar: '',
            gender: profile.gender === 'F' ? 'Female' : (profile.gender === 'M' ? 'Male' : profile.gender || 'N/A'),
            birthday: birthDate
              ? birthDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              : 'N/A',
            age,
            contact: profile.phone || profile.contact_number || 'N/A',
            vitals: {
              bloodType: profile.blood_type || 'N/A',
              height: profile.height_cm ? `${profile.height_cm} cm` : 'N/A',
              weight: profile.weight_kg ? `${profile.weight_kg} kg` : 'N/A',
              bmi: profile.bmi || null,
            },
            allergies,
            emergencyContact: profile.emergency_contact ? {
              name: profile.emergency_contact,
              relation: profile.emergency_contact_relation || 'Guardian',
              phone: profile.emergency_contact_phone || 'N/A'
            } : null,
            recentVisits: visits,
          };
        } else {
          this.selectedStudent = this.buildBasicStudentData(student);
        }
      },
      error: () => {
        this.selectedStudent = this.buildBasicStudentData(student);
      }
    });
  }

  private buildBasicStudentData(student: AdvisedStudent): any {
    const birthDate = student.birth_date ? new Date(student.birth_date) : null;
    const age = birthDate ? Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : null;
    
    return {
      name: student.full_name,
      studentNumber: student.student_number,
      gradeSection: student.grade_section,
      avatar: this.getAvatarUrl(student),
      gender: student.gender === 'F' ? 'Female' : (student.gender === 'M' ? 'Male' : 'Other'),
      birthday: birthDate ? birthDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A',
      age: age,
      contact: student.phone || 'N/A',
      vitals: {
        height: 'N/A',
        weight: 'N/A',
        bmi: 'N/A',
        bloodType: student.blood_type || 'N/A'
      },
      allergies: student.allergies || [],
      emergencyContact: student.emergency_contact ? {
        name: student.emergency_contact,
        relation: 'Guardian',
        phone: 'N/A'
      } : null,
      lastVisit: student.last_visit ? {
        date: new Date(student.last_visit.visit_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        reason: student.last_visit.reason,
        status: student.last_visit.status?.toLowerCase() || 'resolved',
        statusText: student.last_visit.status || 'Completed'
      } : null
    };
  }

  closeModal(): void {
    this.selectedStudent = null;
  }
}