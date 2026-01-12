import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const currentUser = authService.currentUserValue;

  // Check if user is authenticated
  if (!currentUser) {
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  // Get required roles from route data
  const requiredRoles = route.data['roles'] as string[];

  // If no specific roles required, allow access
  if (!requiredRoles || requiredRoles.length === 0) {
    return true;
  }

  // STRICT VALIDATION: Check if user's role matches required roles (exact match, case-sensitive)
  const userRole = currentUser.role_name;
  const hasRequiredRole = requiredRoles.some(role => role === userRole);

  if (hasRequiredRole) {
    return true;
  }

  // User doesn't have required role - DENY ACCESS and log security violation
  console.error(`🔒 SECURITY VIOLATION: User '${currentUser.username}' with role '${userRole}' attempted unauthorized access to route requiring [${requiredRoles.join(', ')}]`);
  
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
};
