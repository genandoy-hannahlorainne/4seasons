import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-role-selection',
  imports: [],
  templateUrl: './role-selection.html',
  styleUrl: './role-selection.scss',
})
export class RoleSelection {
  constructor(private router: Router) {}

  selectRole(role: string) {
    // Store the selected role (you can use a service or localStorage)
    localStorage.setItem('selectedRole', role);
    
    // Navigate to the actual login page with the role
    this.router.navigate(['/login'], { queryParams: { role } });
  }
}
