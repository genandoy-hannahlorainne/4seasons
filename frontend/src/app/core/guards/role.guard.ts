import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, catchError, of } from 'rxjs';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // First check: Local authentication state
  if (!authService.isAuthenticated()) {
    // console.warn(...); // Removed for production
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  // Get required roles from route data
  const requiredRoles = route.data['roles'] as string[];

  // If no specific roles required, just verify authentication
  if (!requiredRoles || requiredRoles.length === 0) {
    return authService.getCurrentUser().pipe(
      map(user => !!user),
      catchError(() => {
        router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
        return of(false);
      })
    );
  }

  // Second check: Verify with backend and check role
  return authService.getCurrentUser().pipe(
    map(user => {
      if (!user) {
        // console.warn(...); // Removed for production
        router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
        return false;
      }

      // STRICT VALIDATION: Check if user's role matches required roles (exact match, case-sensitive)
      const userRole = user.role_name;
      const hasRequiredRole = requiredRoles.some(role => role === userRole);

      if (hasRequiredRole) {
        // console.log(...); // Removed for production
        return true;
      }

      // User doesn't have required role - DENY ACCESS and log security violation
      console.error(`🔒 SECURITY VIOLATION: User '${user.username}' with role '${userRole}' attempted unauthorized access to route requiring [${requiredRoles.join(', ')}]`);

      // Redirect based on user's actual role
      const roleRoutes: { [key: string]: string } = {
        'Student': '/dashboard/student',
        'Adviser': '/dashboard/adviser',
        'Clinic Staff': '/dashboard/staff',
        'Admin': '/dashboard/admin'
      };

      const redirectUrl = roleRoutes[userRole || ''] || '/role-selection';
      router.navigate([redirectUrl]);
      return false;
    }),
    catchError(error => {
      console.error('🔒 Role Guard: Backend verification error:', error);
      authService.logout().subscribe();
      router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
      return of(false);
    })
  );
};
