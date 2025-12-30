import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');
  const currentUser = localStorage.getItem('currentUser');
  
  let headers: any = {};
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  // Add user_id header for API requests that need it
  if (currentUser) {
    try {
      const user = JSON.parse(currentUser);
      if (user.user_id) {
        headers['user_id'] = user.user_id.toString();
      }
    } catch (e) {
      console.error('Error parsing current user:', e);
    }
  }
  
  if (Object.keys(headers).length > 0) {
    req = req.clone({
      setHeaders: headers
    });
  }
  
  return next(req);
};
