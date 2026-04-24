import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const noAuthGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    const user = authService.currentUserValue;
    const roleRoutes: { [key: string]: string } = {
      'Student': '/dashboard/student',
      'Adviser': '/dashboard/adviser',
      'Clinic Staff': '/dashboard/staff',
      'Admin': '/dashboard/admin'
    };
    const route = (user?.role_name && roleRoutes[user.role_name]) || '/dashboard';
    router.navigate([route]);
    return false;
  }

  return true;
};
