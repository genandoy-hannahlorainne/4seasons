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

  // Checking basic form access for student

  if (!studentId) {
    // No student ID, redirecting to dashboard
    router.navigate(['/dashboard/student']);
    return false;
  }

  return shdService.getStatus(studentId).pipe(
    map((status: SHDFStatus) => {
      // Status received
      if (status.basic_completed) {
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
      // Basic not completed, allowing access
      return true;
    }),
    catchError((err: any) => {
      // Status check failed
      // If status check fails, allow access (no status record yet)
      return of(true);
    })
  );
};
