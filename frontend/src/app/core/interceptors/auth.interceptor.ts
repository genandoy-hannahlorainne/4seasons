import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const token = localStorage.getItem('token');
  const tokenExpiry = localStorage.getItem('tokenExpiry');
  
  // Debug logging for all requests
  // console.log(...); // Removed for production
  // console.log(...); // Removed for production
  
  // Check if token is expired
  const isTokenExpired = () => {
    if (!tokenExpiry) return true;
    return Date.now() >= parseInt(tokenExpiry, 10);
  };
  
  // Clear expired auth data
  const clearExpiredAuth = () => {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    localStorage.removeItem('tokenExpiry');
    // console.warn(...); // Removed for production
  };
  
  // Treat both old XAMPP and Docker :8081 endpoints as legacy PHP API.
  const isLegacyApi = req.url.includes('/backend/api') || req.url.includes('localhost:8081/api');
  const isLaravelApi = req.url.includes('/api') && !isLegacyApi;
  
  // Skip auth for login and register endpoints
  const isAuthEndpoint = req.url.includes('/login') || req.url.includes('/register') || req.url.includes('/debug/') || req.url.endsWith('/health');
  
  // console.log(...); // Removed for production
  
  let headers: any = {};
  
  // Add CORS headers for all requests
  headers['Accept'] = 'application/json';
  headers['Content-Type'] = 'application/json';
  
  if (isLaravelApi && token && !isAuthEndpoint) {
    // Check if token is expired before using it
    if (isTokenExpired()) {
      clearExpiredAuth();
      // console.warn(...); // Removed for production
      router.navigate(['/login']);
      return throwError(() => new Error('Token expired'));
    }
    
    // Use Bearer token for Laravel API (except auth endpoints)
    headers['Authorization'] = `Bearer ${token}`;
    // console.log(...); // Removed for production
  } else if (isLaravelApi && !token && !isAuthEndpoint) {
    // No token available for Laravel API request
    // console.log(...); // Removed for production
    // console.log(...); // Removed for production
  } else if (isLaravelApi && isAuthEndpoint) {
    // console.log(...); // Removed for production
  } else if (isLegacyApi) {
    // Use legacy user_id header for old PHP API
    const currentUserStr = localStorage.getItem('currentUser');
    if (currentUserStr) {
      try {
        const user = JSON.parse(currentUserStr);
        if (user.user_id) {
          headers['user_id'] = user.user_id.toString();
          // console.log(...); // Removed for production
        }
      } catch (e) {
    // Error parsing current user
      }
    }
  } else if (isLaravelApi && !token && !isAuthEndpoint) {
    // Laravel API request without token - this will likely fail
    // console.warn(...); // Removed for production
  }
  
  // Clone request with headers
  const authReq = req.clone({ setHeaders: headers });
  
  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // HTTP Error occurred
      
      // Handle 401 Unauthorized responses (but not for login attempts)
      if (error.status === 401 && isLaravelApi && !isAuthEndpoint) {
        // console.warn(...); // Removed for production
        
        // Clear stored auth data
        clearExpiredAuth();
        
        // Redirect to login
        router.navigate(['/login']);
      }
      
      // Handle CORS errors
      if (error.status === 0) {
        // console.error('🌐 CORS or Network error detected:', error);
      }
      
      return throwError(() => error);
    })
  );
};
