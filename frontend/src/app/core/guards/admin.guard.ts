import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  const currentUser = authService.currentUserValue;
  
  // Check if user is authenticated and token is valid
  if (!currentUser || !authService.isTokenValid()) {
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }
  
  // Case-insensitive role check for admin access
  const userRole = currentUser.role_name?.toLowerCase();
  if (userRole !== 'admin') {
    console.error(`🔒 SECURITY VIOLATION: User '${currentUser.username}' with role '${currentUser.role_name}' attempted unauthorized admin access`);
    
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
  
  return true;
};
