import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, catchError, of } from 'rxjs';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // First check: Local authentication state
  if (!authService.isAuthenticated()) {
    // console.warn(...); // Removed for production
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  // Second check: Verify with backend and check admin role
  return authService.getCurrentUser().pipe(
    map(user => {
      if (!user) {
        // console.warn(...); // Removed for production
        router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
        return false;
      }

      // Case-insensitive role check for admin access
      const userRole = user.role_name?.toLowerCase();
      if (userRole !== 'admin') {
        // Security: Unauthorized admin access attempt

        // Redirect based on user's actual role
        const roleRoutes: { [key: string]: string } = {
          'student': '/dashboard/student',
          'adviser': '/dashboard/adviser',
          'clinic staff': '/dashboard/staff'
        };

        const redirectUrl = roleRoutes[userRole || ''] || '/role-selection';
        router.navigate([redirectUrl]);
        return false;
      }

      // console.log(...); // Removed for production
      return true;
    }),
    catchError(error => {
      // Admin Guard: Backend verification error
      authService.logout().subscribe();
      router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
      return of(false);
    })
  );
};
