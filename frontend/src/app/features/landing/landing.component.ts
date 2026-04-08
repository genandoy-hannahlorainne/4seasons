import { Component, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class LandingComponent {
  activeModal: string | null = null;
  activeSection = 'home';

  constructor(private router: Router) {}

  navigateToLogin(): void { this.router.navigate(['/role-selection']); }

  scrollTo(section: string): void {
    this.activeSection = section;
    const el = document.getElementById(section);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }

  openModal(modal: string): void {
    this.activeModal = modal;
    document.body.style.overflow = 'hidden';
  }

  closeModal(): void {
    this.activeModal = null;
    document.body.style.overflow = '';
  }

  roles = [
    {
      id: 'student', title: 'Student',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>`,
      features: ['View personal health records','Access SHDF (Student Health Data Form)','View medical visit history','Track immunization records','View allergy information','Access family medical history']
    },
    {
      id: 'clinic-staff', title: 'Clinic Staff',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>`,
      features: ['Manage student medical visits','Record vital signs and diagnoses','Manage student health records','Handle emergency drill participation','Generate health reports','Manage parental consent forms']
    },
    {
      id: 'adviser', title: 'Adviser',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
      features: ['View section student health records','Monitor student medical visits','Track SHDF submission status','Manage emergency drill records','View student health summaries','Coordinate with clinic staff']
    }
  ];

  selectedRole: typeof this.roles[0] | null = null;

  hours = [
    { day: 'Monday',    hours: '8:00 AM - 5:00 PM' },
    { day: 'Tuesday',   hours: '8:00 AM - 5:00 PM' },
    { day: 'Wednesday', hours: '8:00 AM - 5:00 PM' },
    { day: 'Thursday',  hours: '8:00 AM - 5:00 PM' },
    { day: 'Friday',    hours: '8:00 AM - 5:00 PM' },
    { day: 'Saturday',  hours: 'CLOSED' },
    { day: 'Sunday',    hours: 'CLOSED' },
  ];

  openRoleModal(role: typeof this.roles[0]): void {
    this.selectedRole = role;
    this.openModal('role-features');
  }
}
