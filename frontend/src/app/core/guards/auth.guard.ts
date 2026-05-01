import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, catchError, of } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // First check: Local authentication state
  if (!authService.isAuthenticated()) {
    // console.warn(...); // Removed for production
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  // Second check: Verify with backend that token is still valid
  return authService.getCurrentUser().pipe(
    map(user => {
      if (user) {
        return true;
      }
      // console.warn(...); // Removed for production
      router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
      return false;
    }),
    catchError(error => {
      // Auth Guard: Backend verification error
      authService.logout().subscribe();
      router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
      return of(false);
    })
  );
};
