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
  if (currentUserStr) {
    try {
      const user = JSON.parse(currentUserStr);
      console.log('👤 Parsed user:', user);
      if (user.user_id) {
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
    req = req.clone({
      setHeaders: headers
    });
  } else {
    console.warn('⚠️ No headers to add');
  }
  
  return next(req);
};
