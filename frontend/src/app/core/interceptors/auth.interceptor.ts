import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const token = localStorage.getItem('token');
  
  // Treat both old XAMPP and Docker :8081 endpoints as legacy PHP API.
  const isLegacyApi = req.url.includes('/backend/api') || req.url.includes('localhost:8081/api');
  const isLaravelApi = req.url.includes('/api') && !isLegacyApi;
  
  // Skip auth for login and register endpoints
  const isAuthEndpoint = req.url.includes('/login') || req.url.includes('/register');
  
  let headers: any = {};
  
  if (isLaravelApi && token && !isAuthEndpoint) {
    // Use Bearer token for Laravel API (except auth endpoints)
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
  } else if (isLaravelApi && !token && !isAuthEndpoint) {
    // Laravel API request without token - this will likely fail
    console.warn('⚠️ Laravel API request without token:', req.url);
  }
  
  // Clone request with headers if needed
  const authReq = Object.keys(headers).length > 0 ? 
    req.clone({ setHeaders: headers }) : req;
  
  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Handle 401 Unauthorized responses (but not for login attempts)
      if (error.status === 401 && isLaravelApi && !isAuthEndpoint) {
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
