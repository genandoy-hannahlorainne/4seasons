import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): boolean {
    const currentUser = this.authService.currentUserValue;
    
    if (currentUser && (currentUser.role_name === 'admin' || currentUser.role_name === 'Admin')) {
      return true;
    }

    // Not admin - redirect to admin login
    this.router.navigate(['/admin/login']);
    return false;
  }
}
