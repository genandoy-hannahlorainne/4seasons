import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  template: '<div>Loading...</div>',
  standalone: true
})
export class DashboardComponent implements OnInit {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const currentUser = this.authService.currentUserValue;
    
    if (!currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    // Redirect based on user role
    const roleRoutes: { [key: string]: string } = {
      'Student': '/dashboard/student',
      'Adviser': '/dashboard/adviser',
      'Clinic Staff': '/dashboard/staff',
      'Admin': '/dashboard/admin'
    };
    
    const route = roleRoutes[currentUser.role_name] || '/dashboard/student';
    this.router.navigate([route]);
  }
}
