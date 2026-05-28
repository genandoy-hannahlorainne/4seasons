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
    return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  }

  // Second check: Verify with backend and check admin role
  return authService.getCurrentUser().pipe(
    map(user => {
      if (!user) {
        // console.warn(...); // Removed for production
        return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
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
        return router.createUrlTree([redirectUrl]);
      }

      // console.log(...); // Removed for production
      return true;
    }),
    catchError(error => {
      // Admin Guard: Backend verification error
      authService.logout().subscribe();
      return of(router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } }));
    })
  );
};
