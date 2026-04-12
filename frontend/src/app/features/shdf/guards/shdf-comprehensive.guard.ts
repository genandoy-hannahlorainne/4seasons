import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot } from '@angular/router';
import { SHDFService, SHDFStatus } from '../shdf.service';
import { map, catchError, of } from 'rxjs';

/**
 * Guard to ensure basic SHDF is completed before accessing comprehensive form
 */
export const canAccessComprehensiveForm: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const router = inject(Router);
  const shdService = inject(SHDFService);
  const studentId = Number(route.paramMap.get('studentId'));

  if (!studentId) {
    router.navigate(['/dashboard/student']);
    return false;
  }

  return shdService.getStatus(studentId).pipe(
    map((status: SHDFStatus) => {
      if (status.comprehensive_completed) {
        // Already completed - redirect to success page
        router.navigate(['/shdf', studentId, 'success'], {
          queryParams: {
            stage: 'comprehensive',
            returning: true
          }
        });
        return false;
      }
      
      if (!status.basic_completed) {
        // Basic not completed - redirect to basic form
        router.navigate(['/shdf', studentId, 'basic']);
        return false;
      }
      
      return true;
    }),
    catchError(() => {
      // If status check fails, redirect to basic form
      router.navigate(['/shdf', studentId, 'basic']);
      return of(false);
    })
  );
};
