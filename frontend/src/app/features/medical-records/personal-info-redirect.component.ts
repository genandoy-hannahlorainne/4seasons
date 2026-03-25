import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { StudentService } from '../../core/services/student.service';

@Component({
  selector: 'app-personal-info-redirect',
  standalone: true,
  template: `
    <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
      <div style="background: white; padding: 3rem; border-radius: 16px; text-align: center; max-width: 500px;">
        <div style="font-size: 3rem; margin-bottom: 1rem;">🔄</div>
        <h2 style="color: #2c3e50; margin-bottom: 1rem;">Redirecting to New Form...</h2>
        <p style="color: #7f8c8d; margin-bottom: 2rem;">
          We've upgraded to the new Student Health Data Form (SHDF) for a better experience!
        </p>
        <div class="spinner" style="margin: 0 auto; width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #5b8db8; border-radius: 50%; animation: spin 1s linear infinite;"></div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `]
})
export class PersonalInfoRedirectComponent implements OnInit {
  constructor(
    private router: Router,
    private authService: AuthService,
    private studentService: StudentService
  ) {}

  ngOnInit(): void {
    // Redirect to SHDF Basic form
    const currentUser = this.authService.currentUserValue;

    if (currentUser && currentUser.user_id) {
      this.studentService.getStudentProfile(currentUser.user_id).subscribe({
        next: (response) => {
          let profile = null;
          if (response.success && response.profile) {
            profile = response.profile;
          } else if (response.profile) {
            profile = response.profile;
          }

          if (profile && profile.student_id) {
            // Redirect to SHDF Basic
            setTimeout(() => {
              this.router.navigate(['/shdf', profile.student_id, 'basic']);
            }, 2000); // 2 second delay to show message
          } else {
            this.router.navigate(['/dashboard']);
          }
        },
        error: () => {
          this.router.navigate(['/dashboard']);
        }
      });
    } else {
      this.router.navigate(['/dashboard']);
    }
  }
}
