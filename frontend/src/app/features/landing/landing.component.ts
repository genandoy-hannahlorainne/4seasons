import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './landing.component.html',
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=Inter:wght@400;500;600&display=swap');

    .landing-container { width:100%; min-height:100vh; display:flex; flex-direction:column; font-family:'Inter',sans-serif; }

    .header { background:rgba(255,255,255,0.96); backdrop-filter:blur(10px); padding:1rem 2rem; box-shadow:0 1px 3px rgba(0,0,0,0.06); position:sticky; top:0; z-index:100; border-bottom:1px solid rgba(5,35,85,0.07); }
    .header-content { max-width:1280px; margin:0 auto; display:flex; justify-content:space-between; align-items:center; }
    .logo { height:52px; width:auto; }
    .nav { display:flex; align-items:center; gap:0.5rem; }
    .nav-link { font-family:'Inter',sans-serif; background:none; border:none; padding:0.6rem 1.25rem; font-size:0.95rem; font-weight:600; color:#334155; cursor:pointer; border-radius:8px; transition:all 0.2s; }
    .nav-link:hover { background:#f1f5f9; color:#052355; }

    .hero-section { min-height:100vh; position:relative; display:flex; align-items:center; }
    .hero-overlay { position:absolute; inset:0; background:linear-gradient(135deg,rgba(5,20,50,0.75) 0%,rgba(5,35,85,0.5) 100%); }
    .hero-content { position:relative; z-index:1; max-width:1280px; margin:0 auto; padding:6rem 2rem; display:flex; align-items:center; justify-content:space-between; gap:4rem; width:100%; }
    .hero-text { flex:1; max-width:580px; color:white; }
    .hero-title { font-family:'Plus Jakarta Sans',sans-serif; font-size:3.5rem; font-weight:800; margin:0 0 1.25rem; line-height:1.15; letter-spacing:-1.5px; color:#fff; }
    .hero-subtitle { font-size:1.2rem; font-weight:500; margin-bottom:1.25rem; color:rgba(255,255,255,0.85); line-height:1.6; }
    .hero-description { font-size:1rem; line-height:1.8; margin-bottom:2.5rem; color:rgba(255,255,255,0.75); }
    .btn-get-started { font-family:'Inter',sans-serif; background:#fff; color:#052355; border:none; padding:1rem 2.5rem; font-size:1rem; font-weight:700; border-radius:12px; cursor:pointer; transition:all 0.25s; box-shadow:0 8px 24px rgba(0,0,0,0.2); }
    .btn-get-started:hover { transform:translateY(-3px); box-shadow:0 12px 32px rgba(0,0,0,0.3); background:#f0f7ff; }
    .hero-image-container { flex:0 0 auto; max-width:480px; }
    .hero-character { width:100%; height:auto; display:block; filter:drop-shadow(0 20px 60px rgba(0,0,0,0.3)); animation:float 4s ease-in-out infinite; }
    @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-20px)} }

    .features-section { padding:6rem 2rem; background:#f8fafc; }
    .section-inner { max-width:1280px; margin:0 auto; }
    .section-title { font-family:'Plus Jakarta Sans',sans-serif; font-size:2.5rem; font-weight:800; color:#0f172a; text-align:center; margin:0 0 0.75rem; letter-spacing:-1px; }
    .section-sub { text-align:center; color:#64748b; font-size:1rem; margin:0 0 3rem; }
    .roles-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:2rem; }
    .role-card { background:#fff; border-radius:16px; padding:2.5rem 2rem; text-align:center; cursor:pointer; border:1.5px solid #e2e8f0; transition:all 0.25s; box-shadow:0 4px 16px rgba(0,0,0,0.04); }
    .role-card:hover { transform:translateY(-6px); box-shadow:0 12px 40px rgba(5,35,85,0.12); border-color:#052355; }
    .role-icon { display:flex; justify-content:center; margin-bottom:1.25rem; color:#052355; }
    .role-card h3 { font-family:'Plus Jakarta Sans',sans-serif; font-size:1.25rem; font-weight:700; color:#0f172a; margin:0 0 0.5rem; }
    .role-card p { font-size:0.9rem; color:#64748b; margin:0 0 1.25rem; line-height:1.6; }
    .view-more { font-size:0.875rem; font-weight:600; color:#052355; }

    .info-section { padding:6rem 2rem; background:#fff; }
    .info-grid { display:grid; grid-template-columns:1fr 1fr; gap:3rem; }
    .info-card { background:#f8fafc; border-radius:16px; padding:2.5rem; border:1.5px solid #e2e8f0; }
    .info-icon { display:inline-flex; align-items:center; justify-content:center; width:56px; height:56px; background:#e8f0fe; border-radius:12px; color:#052355; margin-bottom:1.25rem; }
    .info-card h3 { font-family:'Plus Jakarta Sans',sans-serif; font-size:1.25rem; font-weight:700; color:#0f172a; margin:0 0 1rem; }
    .info-card p { font-size:0.95rem; color:#475569; margin:0.5rem 0; line-height:1.7; }
    .hours-list { display:flex; flex-direction:column; }
    .hours-item { display:flex; justify-content:space-between; font-size:0.9rem; padding:0.6rem 0; border-bottom:1px solid #e2e8f0; color:#475569; }
    .hours-item:last-child { border-bottom:none; }
    .closed { color:#ef4444; font-weight:600; }

    .footer { background:#0f172a; color:white; padding:2rem; }
    .footer-bottom { max-width:1280px; margin:0 auto; text-align:center; }
    .footer-links { margin-bottom:0.75rem; }
    .footer-link { background:none; border:none; color:#94a3b8; font-size:0.875rem; font-weight:500; cursor:pointer; transition:color 0.2s; font-family:'Inter',sans-serif; }
    .footer-link:hover { color:#fff; }
    .separator { margin:0 1rem; color:rgba(255,255,255,0.2); }
    .footer-copyright { font-size:0.875rem; color:#64748b; margin:0; }

    .modal-backdrop { position:fixed; inset:0; background:rgba(0,0,0,0.55); display:flex; align-items:center; justify-content:center; z-index:1000; padding:1rem; animation:fadeIn 0.2s ease; }
    @keyframes fadeIn { from{opacity:0} to{opacity:1} }
    .modal { background:#fff; border-radius:20px; padding:2.5rem; width:100%; max-width:480px; position:relative; animation:slideUp 0.25s ease; text-align:center; }
    .modal h2 { font-family:'Plus Jakarta Sans',sans-serif; font-size:1.5rem; font-weight:800; color:#0f172a; margin:0.75rem 0 1.5rem; }
    .modal-icon { display:flex; justify-content:center; color:#052355; margin-bottom:0.5rem; }
    .modal-text { text-align:left; max-width:560px; max-height:80vh; overflow-y:auto; }
    .modal-body p { font-size:0.95rem; color:#475569; line-height:1.7; margin:0 0 1rem; }
    .modal-body h4 { font-family:'Plus Jakarta Sans',sans-serif; font-size:1rem; font-weight:700; color:#0f172a; margin:1.25rem 0 0.5rem; }
    .modal-close { position:absolute; top:1rem; right:1rem; background:#f1f5f9; border:none; width:32px; height:32px; border-radius:50%; font-size:0.875rem; cursor:pointer; color:#64748b; display:flex; align-items:center; justify-content:center; transition:all 0.2s; }
    .modal-close:hover { background:#e2e8f0; color:#0f172a; }
    .feature-list { list-style:none; padding:0; margin:0 0 1.5rem; text-align:left; }
    .feature-list li { display:flex; align-items:center; gap:0.75rem; padding:0.6rem 0; border-bottom:1px solid #f1f5f9; font-size:0.95rem; color:#334155; }
    .feature-list li:last-child { border-bottom:none; }
    .btn-modal-login { font-family:'Inter',sans-serif; width:100%; padding:0.875rem; background:#052355; color:white; border:none; border-radius:10px; font-size:0.95rem; font-weight:600; cursor:pointer; transition:all 0.2s; }
    .btn-modal-login:hover { background:#041b44; transform:translateY(-1px); }
    @keyframes slideUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }

    @media(max-width:1024px) { .roles-grid{grid-template-columns:1fr 1fr} }
    @media(max-width:768px) {
      .hero-content{flex-direction:column;text-align:center;padding:4rem 1.5rem}
      .hero-title{font-size:2.5rem}
      .hero-image-container{max-width:320px}
      .roles-grid{grid-template-columns:1fr}
      .info-grid{grid-template-columns:1fr}
    }
    @media(max-width:480px) { .hero-title{font-size:2rem} .section-title{font-size:1.75rem} }
  `]
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
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>`,
      features: ['View personal health records','Access SHDF (Student Health Data Form)','View medical visit history','Track immunization records','View allergy information','Access family medical history']
    },
    {
      id: 'clinic-staff', title: 'Clinic Staff',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>`,
      features: ['Manage student medical visits','Record vital signs and diagnoses','Manage student health records','Handle emergency drill participation','Generate health reports','Manage parental consent forms']
    },
    {
      id: 'adviser', title: 'Adviser',
      icon: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
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
