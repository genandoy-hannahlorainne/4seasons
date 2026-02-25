import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const token = localStorage.getItem('token');
  
  // Determine if this is a Laravel API request
  const isLaravelApi = req.url.includes('localhost:8000/api');
  const isLegacyApi = req.url.includes('/backend/api');
  
  let headers: any = {};
  
  if (isLaravelApi && token) {
    // Use Bearer token for Laravel API
    headers['Authorization'] = `Bearer ${token}`;
    console.log('🔐 Added Bearer token for Laravel API');
  } else if (isLegacyApi) {
    // Use legacy user_id header for old PHP API
    const currentUserStr = localStorage.getItem('currentUser');
    if (currentUserStr) {
      try {
        const user = JSON.parse(currentUserStr);
        if (user.user_id) {
          headers['user_id'] = user.user_id.toString();
          console.log('🔐 Added user_id header for legacy API:', user.user_id);
        }
      } catch (e) {
        console.error('❌ Error parsing current user:', e);
      }
    }
  }
  
  // Clone request with headers if needed
  const authReq = Object.keys(headers).length > 0 ? 
    req.clone({ setHeaders: headers }) : req;
  
  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Handle 401 Unauthorized responses
      if (error.status === 401 && isLaravelApi) {
        console.warn('🚫 Unauthorized request to Laravel API - redirecting to login');
        
        // Clear stored auth data
        localStorage.removeItem('currentUser');
        localStorage.removeItem('token');
        
        // Redirect to login
        router.navigate(['/login']);
      }
      
      return throwError(() => error);
    })
  );
};
