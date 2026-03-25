import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, catchError, of } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // First check: Local authentication state
  if (!authService.isAuthenticated()) {
    console.warn('🔒 Auth Guard: No valid local authentication');
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  // Second check: Verify with backend that token is still valid
  return authService.getCurrentUser().pipe(
    map(user => {
      if (user) {
        console.log('✅ Auth Guard: User authenticated and verified with backend');
        return true;
      }
      console.warn('🔒 Auth Guard: Backend verification failed');
      router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
      return false;
    }),
    catchError(error => {
      console.error('🔒 Auth Guard: Backend verification error:', error);
      authService.logout().subscribe();
      router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
      return of(false);
    })
  );
};
