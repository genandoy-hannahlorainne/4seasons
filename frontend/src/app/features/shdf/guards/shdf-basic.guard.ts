import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot } from '@angular/router';
import { SHDFService, SHDFStatus } from '../shdf.service';
import { map, catchError, of } from 'rxjs';

/**
 * Guard to prevent access to basic SHDF form if already completed
 */
export const canAccessBasicForm: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const router = inject(Router);
  const shdService = inject(SHDFService);
  const studentId = Number(route.paramMap.get('studentId'));

  console.log('[SHDF Guard] Checking basic form access for student:', studentId);

  if (!studentId) {
    console.log('[SHDF Guard] No student ID, redirecting to dashboard');
    router.navigate(['/dashboard/student']);
    return false;
  }

  return shdService.getStatus(studentId).pipe(
    map((status: SHDFStatus) => {
      console.log('[SHDF Guard] Status received:', status);
      if (status.basic_completed) {
        console.log('[SHDF Guard] Basic completed, blocking access and redirecting to success');
        // Already completed - redirect to success page
        router.navigate(['/shdf', studentId, 'success'], {
          queryParams: {
            stage: 'basic',
            deadline: status.comprehensive_deadline,
            returning: true
          }
        });
        return false;
      }
      console.log('[SHDF Guard] Basic not completed, allowing access');
      return true;
    }),
    catchError((err: any) => {
      console.error('[SHDF Guard] Status check failed:', err);
      // If status check fails, allow access (no status record yet)
      return of(true);
    })
  );
};
