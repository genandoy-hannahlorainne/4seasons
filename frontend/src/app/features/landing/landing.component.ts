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
  currentDay: string = '';
  isOpenNow: boolean = false;
  signupStep: 'initial' | 'contact' = 'initial';

  constructor(private router: Router) {
    this.updateCurrentStatus();
  }

  updateCurrentStatus(): void {
    const now = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    this.currentDay = days[now.getDay()];
    
    // Check if it's a weekday (Monday-Friday)
    const isWeekday = now.getDay() >= 1 && now.getDay() <= 5;
    
    // Check if current time is between 8:00 AM and 5:00 PM
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeInMinutes = currentHour * 60 + currentMinute;
    const openTime = 8 * 60; // 8:00 AM
    const closeTime = 17 * 60; // 5:00 PM
    
    this.isOpenNow = isWeekday && currentTimeInMinutes >= openTime && currentTimeInMinutes < closeTime;
  }

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
      icon: `<img src="assets/icons/student.png" alt="Student" style="width:72px;height:72px;object-fit:contain;display:block;">`,
      features: ['View personal health records','Access SHDF (Student Health Data Form)','View medical visit history','Track immunization records','View allergy information','Access family medical history']
    },
    {
      id: 'clinic-staff', title: 'Clinic Staff',
      icon: `<img src="assets/icons/clinic-staff.png" alt="Clinic Staff" style="width:72px;height:72px;object-fit:contain;display:block;">`,
      features: ['Manage student medical visits','Record vital signs and diagnoses','Manage student health records','Handle emergency drill participation','Generate health reports','Manage parental consent forms']
    },
    {
      id: 'adviser', title: 'Adviser',
      icon: `<img src="assets/icons/adviser-faculty.png" alt="Adviser" style="width:72px;height:72px;object-fit:contain;display:block;">`,
      features: ['View section student health records','Monitor student medical visits','Track SHDF submission status','Manage emergency drill records','View student health summaries','Coordinate with clinic staff']
    }
  ];

  selectedRole: typeof this.roles[0] | null = null;

  get hours() {
    const schedule = [
      { day: 'Monday',    hours: '8:00 AM - 5:00 PM' },
      { day: 'Tuesday',   hours: '8:00 AM - 5:00 PM' },
      { day: 'Wednesday', hours: '8:00 AM - 5:00 PM' },
      { day: 'Thursday',  hours: '8:00 AM - 5:00 PM' },
      { day: 'Friday',    hours: '8:00 AM - 5:00 PM' },
      { day: 'Saturday',  hours: 'CLOSED' },
      { day: 'Sunday',    hours: 'CLOSED' },
    ];
    
    return schedule.map(item => ({
      ...item,
      isToday: item.day === this.currentDay
    }));
  }

  openRoleModal(role: typeof this.roles[0]): void {
    this.selectedRole = role;
    this.openModal('role-features');
  }
}
