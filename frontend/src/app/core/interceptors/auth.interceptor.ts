import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');
  const currentUserStr = localStorage.getItem('currentUser');
  
  console.log('🔐 Auth Interceptor - Current User:', currentUserStr);
  
  let headers: any = {};
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  // Add user_id header for API requests that need it
  // NOTE: PHP converts header names to uppercase with underscores
  // So 'user_id' becomes 'HTTP_USER_ID' in $_SERVER
  if (currentUserStr) {
    try {
      const user = JSON.parse(currentUserStr);
      console.log('👤 Parsed user:', user);
      if (user.user_id) {
        // Use 'user_id' - Angular/HTTP will convert it to HTTP_USER_ID in PHP
        headers['user_id'] = user.user_id.toString();
        console.log('✅ Added user_id header:', user.user_id);
      } else {
        console.warn('⚠️ user_id not found in currentUser object');
      }
    } catch (e) {
      console.error('❌ Error parsing current user:', e);
    }
  } else {
    console.warn('⚠️ currentUser not found in localStorage');
  }
  
  if (Object.keys(headers).length > 0) {
    console.log('📤 Adding headers to request:', headers);
    console.log('📤 Full request headers will be:', req.headers);
    req = req.clone({
      setHeaders: headers
    });
    console.log('📤 After clone, headers:', req.headers);
  } else {
    console.warn('⚠️ No headers to add');
  }
  
  return next(req);
};
