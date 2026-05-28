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
   * Verifies the current session with backend
   */
  async initializeAuth(): Promise<void> {
    try {
      await firstValueFrom(this.authService.ensureCsrfCookie());
    } catch {
      // CSRF bootstrap is best-effort; the login flow will retry it if needed.
    }

    try {
      const user = await firstValueFrom(this.authService.getCurrentUser(true));

      // Re-initialize push notifications on page refresh for adviser users.
      if (user && this.isAdviserUser(user)) {
        this.pushNotificationService.init().catch(() => {
          // Push init failed silently — non-critical
        });
      }
    } catch {
      try {
        await firstValueFrom(this.authService.logout());
      } catch {
        this.authService.clearAuth();
      }

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
