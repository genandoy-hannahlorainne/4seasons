import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { catchError, throwError } from 'rxjs';

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const cookiePrefix = `${encodeURIComponent(name)}=`;
  const cookies = document.cookie ? document.cookie.split('; ') : [];

  for (const cookie of cookies) {
    if (cookie.startsWith(cookiePrefix)) {
      return decodeURIComponent(cookie.substring(cookiePrefix.length));
    }
  }

  return null;
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  // Treat both old XAMPP and Docker :8081 endpoints as legacy PHP API.
  const isLegacyApi = req.url.includes('/backend/api') || req.url.includes('localhost:8081/api');
  const isLaravelApi = req.url.includes('/api') && !isLegacyApi;

  // Skip auth redirects for auth and health endpoints.
  const isAuthEndpoint = req.url.includes('/login') || req.url.includes('/register') || req.url.includes('/debug/') || req.url.endsWith('/health');

  const headers: Record<string, string> = {
    Accept: 'application/json'
  };

  if (!(req.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (isLaravelApi) {
    headers['X-Requested-With'] = 'XMLHttpRequest';

    const csrfToken = readCookie('XSRF-TOKEN');
    if (csrfToken && req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'OPTIONS') {
      headers['X-XSRF-TOKEN'] = csrfToken;
    }
  }

  if (isLegacyApi) {
    const user = authService.currentUserValue;
    if (user?.user_id) {
      headers['user_id'] = user.user_id.toString();
    }
  }

  const authReq = req.clone({
    setHeaders: headers,
    withCredentials: isLaravelApi ? true : req.withCredentials,
  });

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if ((error.status === 401 || error.status === 419) && isLaravelApi && !isAuthEndpoint) {
        authService.clearAuth();

        // Avoid forcing a login redirect for public/auth bootstrap routes.
        const currentUrl = router.url;
        const publicRoutes = ['/', '/login', '/admin/login', '/role-selection'];
        const isPublicRoute = publicRoutes.includes(currentUrl) || currentUrl.startsWith('/login');

        if (!isPublicRoute && !req.url.endsWith('/me') && !req.url.endsWith('/logout') && !req.url.endsWith('/refresh')) {
          router.navigate(['/login']);
        }
      }

      return throwError(() => error);
    })
  );
};
