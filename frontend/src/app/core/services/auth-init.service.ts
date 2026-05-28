import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { PushNotificationService } from './push-notification.service';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthInitService {
  constructor(
    private authService: AuthService,
    private pushNotificationService: PushNotificationService,
    private router: Router
  ) {}

  /**
   * Initialize authentication state on app startup
   * Verifies token validity with backend
   */
  async initializeAuth(): Promise<void> {
    // Check if we have local auth data
    if (!this.authService.isAuthenticated()) {
      return;
    }

    try {
      // Verify with backend that token is still valid
      const user = await firstValueFrom(this.authService.getCurrentUser());

      // Re-initialize push notifications on page refresh for adviser users.
      // This ensures the service worker stays registered and the subscription
      // is active even when the user refreshes without logging out/in.
      if (user && this.isAdviserUser(user)) {
        this.pushNotificationService.init().catch(() => {
          // Push init failed silently — non-critical
        });
      }
    } catch (error) {
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

  private isAdviserUser(user: any): boolean {
    if (!user) return false;
    if (user.role_id === 3) return true;
    const roleName = (user.role_name ?? '').toLowerCase();
    return roleName.includes('adviser');
  }
}
