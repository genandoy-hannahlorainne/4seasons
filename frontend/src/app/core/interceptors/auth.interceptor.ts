import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const token = localStorage.getItem('token');
  const tokenExpiry = localStorage.getItem('tokenExpiry');
  
  // Debug logging for all requests
  console.log('🔍 Interceptor called for:', req.url);
  console.log('🔍 Token available:', token ? token.substring(0, 20) + '...' : 'NO TOKEN');
  
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
    console.warn('🚫 Token expired, cleared auth data');
  };
  
  // Treat both old XAMPP and Docker :8081 endpoints as legacy PHP API.
  const isLegacyApi = req.url.includes('/backend/api') || req.url.includes('localhost:8081/api');
  const isLaravelApi = req.url.includes('/api') && !isLegacyApi;
  
  // Skip auth for login and register endpoints
  const isAuthEndpoint = req.url.includes('/login') || req.url.includes('/register') || req.url.includes('/debug/') || req.url.endsWith('/health');
  
  console.log('🔍 API Detection:', {
    url: req.url,
    isLegacyApi,
    isLaravelApi,
    isAuthEndpoint,
    hasToken: !!token
  });
  
  let headers: any = {};
  
  // Add CORS headers for all requests
  headers['Accept'] = 'application/json';
  headers['Content-Type'] = 'application/json';
  
  if (isLaravelApi && token && !isAuthEndpoint) {
    // Check if token is expired before using it
    if (isTokenExpired()) {
      clearExpiredAuth();
      console.warn('⚠️ Token expired during request, redirecting to login');
      router.navigate(['/login']);
      return throwError(() => new Error('Token expired'));
    }
    
    // Use Bearer token for Laravel API (except auth endpoints)
    headers['Authorization'] = `Bearer ${token}`;
    console.log('🔐 Added Bearer token for Laravel API:', req.url, 'Token:', token.substring(0, 20) + '...');
  } else if (isLaravelApi && !token && !isAuthEndpoint) {
    console.error('❌ No token available for Laravel API request:', req.url);
    console.log('Current localStorage token:', localStorage.getItem('token'));
    console.log('Current localStorage user:', localStorage.getItem('currentUser'));
  } else if (isLaravelApi && isAuthEndpoint) {
    console.log('ℹ️ Skipping auth for endpoint:', req.url);
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
  
  // Clone request with headers
  const authReq = req.clone({ setHeaders: headers });
  
  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      console.error('🚨 HTTP Error:', {
        status: error.status,
        url: req.url,
        message: error.message,
        error: error.error
      });
      
      // Handle 401 Unauthorized responses (but not for login attempts)
      if (error.status === 401 && isLaravelApi && !isAuthEndpoint) {
        console.warn('🚫 Unauthorized request to Laravel API - clearing auth and redirecting');
        
        // Clear stored auth data
        clearExpiredAuth();
        
        // Redirect to login
        router.navigate(['/login']);
      }
      
      // Handle CORS errors
      if (error.status === 0) {
        console.error('🌐 CORS or Network error detected:', error);
      }
      
      return throwError(() => error);
    })
  );
};
