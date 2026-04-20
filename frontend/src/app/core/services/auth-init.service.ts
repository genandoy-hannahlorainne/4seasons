import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthInitService {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  /**
   * Initialize authentication state on app startup
   * Verifies token validity with backend
   */
  async initializeAuth(): Promise<void> {
    // console.log(...); // Removed for production

    // Check if we have local auth data
    if (!this.authService.isAuthenticated()) {
      // console.log(...); // Removed for production
      return;
    }

    try {
      // Verify with backend that token is still valid
      await firstValueFrom(this.authService.getCurrentUser());
      // console.log(...); // Removed for production
    } catch (error) {
      // console.warn(...); // Removed for production
      // Clear invalid auth data
      await firstValueFrom(this.authService.logout());

      // Only redirect to login if we're on a protected route
      const currentUrl = this.router.url;
      const publicRoutes = ['/', '/login', '/admin/login', '/role-selection'];

      if (!publicRoutes.includes(currentUrl) && !currentUrl.startsWith('/login')) {
        this.router.navigate(['/login']);
      }
    }
  }
}
