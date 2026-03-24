import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, catchError, of } from 'rxjs';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // First check: Local authentication state
  if (!authService.isAuthenticated()) {
    console.warn('🔒 Admin Guard: No valid local authentication');
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  // Second check: Verify with backend and check admin role
  return authService.getCurrentUser().pipe(
    map(user => {
      if (!user) {
        console.warn('🔒 Admin Guard: Backend verification failed');
        router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
        return false;
      }

      // Case-insensitive role check for admin access
      const userRole = user.role_name?.toLowerCase();
      if (userRole !== 'admin') {
        console.error(`🔒 SECURITY VIOLATION: User '${user.username}' with role '${user.role_name}' attempted unauthorized admin access`);

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

      console.log('✅ Admin Guard: Admin access granted');
      return true;
    }),
    catchError(error => {
      console.error('🔒 Admin Guard: Backend verification error:', error);
      authService.logout().subscribe();
      router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
      return of(false);
    })
  );
};
