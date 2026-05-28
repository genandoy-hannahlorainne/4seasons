import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { catchError, map, of } from 'rxjs';

export const forceChangePasswordGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  return authService.getCurrentUser().pipe(
    map(user => {
      if (!user) {
        return router.createUrlTree(['/login']);
      }

      if (user.password_must_change) {
        return true;
      }

      const roleRoutes: { [key: string]: string } = {
        'Student': '/dashboard/student',
        'Adviser': '/dashboard/adviser',
        'Clinic Staff': '/dashboard/staff',
        'Admin': '/dashboard/admin'
      };

      const redirectUrl = roleRoutes[user.role_name || ''] || '/dashboard';
      return router.createUrlTree([redirectUrl]);
    }),
    catchError(() => of(router.createUrlTree(['/login'])))
  );
};