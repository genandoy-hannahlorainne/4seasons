import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;

  constructor(private http: HttpClient) {
    const storedUser = localStorage.getItem('currentUser');
    this.currentUserSubject = new BehaviorSubject<User | null>(
      storedUser ? JSON.parse(storedUser) : null
    );
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  login(username: string, password: string): Observable<User> {
    return this.http.post<any>(`${environment.apiUrl}/login`, { username, password })
      .pipe(
        map(response => {
          console.log('Login response:', response);
          
          if (response && response.success && response.data) {
            const userData = response.data.user;
            const token = response.data.token;
            
            // Store user data and token
            localStorage.setItem('currentUser', JSON.stringify(userData));
            localStorage.setItem('token', token);
            localStorage.setItem('tokenExpiry', (Date.now() + (24 * 60 * 60 * 1000)).toString()); // 24 hours
            
            this.currentUserSubject.next(userData);
            console.log('✅ Login successful, user stored:', userData);
            
            // Start token refresh and session timeout timers
            this.startTokenRefreshTimer();
            this.startSessionTimeoutWarning();
            
            return userData;
          }
          throw new Error('Invalid response format');
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('❌ Login error:', error);
          this.clearAuthData();
          return throwError(() => error);
        })
      );
  }

  register(userData: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/register`, userData);
  }

  logout(): Observable<any> {
    const token = localStorage.getItem('token');
    
    // Call Laravel logout endpoint if we have a token
    if (token) {
      return this.http.post<any>(`${environment.apiUrl}/logout`, {})
        .pipe(
          map(() => {
            console.log('✅ Logout successful');
            this.clearAuthData();
            return { success: true };
          }),
          catchError((error) => {
            console.warn('⚠️ Logout API failed, clearing local data anyway:', error);
            this.clearAuthData();
            return new Observable(observer => {
              observer.next({ success: true });
              observer.complete();
            });
          })
        );
    } else {
      console.log('ℹ️ No token found, clearing local data');
      this.clearAuthData();
      
      return new Observable(observer => {
        observer.next({ success: true });
        observer.complete();
      });
    }
  }

  getCurrentUser(): Observable<User> {
    const token = localStorage.getItem('token');
    
    // Check if token is expired
    if (!this.isTokenValid()) {
      console.warn('⚠️ Token expired, clearing auth data');
      this.clearAuthData();
      return throwError(() => new Error('Token expired'));
    }
    
    // If we have a valid token, use Laravel /me endpoint
    if (token) {
      return this.http.get<any>(`${environment.apiUrl}/me`)
        .pipe(
          map(response => {
            console.log('Current user response:', response);
            
            if (response && response.success && response.data) {
              const userData = response.data;
              // Update stored user data
              localStorage.setItem('currentUser', JSON.stringify(userData));
              this.currentUserSubject.next(userData);
              return userData;
            }
            throw new Error('Invalid response format');
          }),
          catchError((error: HttpErrorResponse) => {
            console.error('❌ Get current user failed:', error);
            
            // If 401, token is invalid
            if (error.status === 401) {
              console.warn('🚫 Token invalid, clearing auth data');
              this.clearAuthData();
            }
            
            return throwError(() => error);
          })
        );
    } else {
      // No token, return current user from storage or error
      const currentUser = this.currentUserValue;
      if (currentUser) {
        return new Observable(observer => {
          observer.next(currentUser);
          observer.complete();
        });
      } else {
        return throwError(() => new Error('No authenticated user'));
      }
    }
  }

  isAuthenticated(): boolean {
    const user = this.currentUserValue;
    const token = this.getToken();
    const isValid = !!user && !!token && this.isTokenValid();
    
    if (!isValid && (user || token)) {
      console.warn('⚠️ Invalid auth state detected, clearing data');
      this.clearAuthData();
    }
    
    return isValid;
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  public isTokenValid(): boolean {
    const token = localStorage.getItem('token');
    const expiry = localStorage.getItem('tokenExpiry');
    
    if (!token || !expiry) {
      return false;
    }
    
    const expiryTime = parseInt(expiry, 10);
    const now = Date.now();
    
    return now < expiryTime;
  }

  // Enhanced authentication status check
  checkAuthenticationStatus(): boolean {
    const token = localStorage.getItem('token');
    const user = this.currentUserValue;
    
    if (!token || !user) {
      console.warn('🔐 Authentication check failed - missing token or user');
      this.clearAuthData();
      return false;
    }
    
    // Check token expiry
    if (!this.isTokenValid()) {
      console.warn('🔐 Token expired during authentication check');
      this.clearAuthData();
      return false;
    }
    
    return true;
  }

  // Auto-refresh token before expiry
  startTokenRefreshTimer(): void {
    const expiry = localStorage.getItem('tokenExpiry');
    if (!expiry) return;
    
    const expiryTime = parseInt(expiry, 10);
    const now = Date.now();
    const timeUntilExpiry = expiryTime - now;
    
    // Refresh token 5 minutes before expiry
    const refreshTime = timeUntilExpiry - (5 * 60 * 1000);
    
    if (refreshTime > 0) {
      setTimeout(() => {
        this.refreshToken().subscribe({
          next: () => {
            console.log('✅ Token refreshed successfully');
            this.startTokenRefreshTimer(); // Start next refresh cycle
          },
          error: (error) => {
            console.error('❌ Token refresh failed:', error);
            this.logout().subscribe(); // Force logout on refresh failure
          }
        });
      }, refreshTime);
    }
  }

  // Refresh token endpoint
  refreshToken(): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/refresh`, {})
      .pipe(
        map(response => {
          if (response && response.success && response.data) {
            const newToken = response.data.token;
            const newExpiry = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
            
            localStorage.setItem('token', newToken);
            localStorage.setItem('tokenExpiry', newExpiry.toString());
            
            console.log('✅ Token refreshed successfully');
            return response;
          }
          throw new Error('Invalid refresh response');
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('❌ Token refresh failed:', error);
          this.clearAuthData();
          return throwError(() => error);
        })
      );
  }

  // Session timeout warning
  startSessionTimeoutWarning(): void {
    const expiry = localStorage.getItem('tokenExpiry');
    if (!expiry) return;
    
    const expiryTime = parseInt(expiry, 10);
    const now = Date.now();
    const timeUntilExpiry = expiryTime - now;
    
    // Show warning 10 minutes before expiry
    const warningTime = timeUntilExpiry - (10 * 60 * 1000);
    
    if (warningTime > 0) {
      setTimeout(() => {
        const remainingMinutes = Math.floor((expiryTime - Date.now()) / (60 * 1000));
        if (remainingMinutes > 0) {
          const extendSession = confirm(
            `Your session will expire in ${remainingMinutes} minutes. Would you like to extend your session?`
          );
          
          if (extendSession) {
            this.refreshToken().subscribe({
              next: () => {
                alert('Session extended successfully!');
                this.startSessionTimeoutWarning(); // Start next warning cycle
              },
              error: () => {
                alert('Failed to extend session. Please login again.');
                this.logout().subscribe();
              }
            });
          }
        }
      }, warningTime);
    }
  }

  private clearAuthData(): void {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    localStorage.removeItem('tokenExpiry');
    this.currentUserSubject.next(null);
    console.log('🧹 Auth data cleared');
  }

  changePassword(userId: number, currentPassword: string, newPassword: string): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/change-password`, {
      user_id: userId,
      current_password: currentPassword,
      new_password: newPassword,
      confirm_password: newPassword
    });
  }

  updateCurrentUser(updatedUser: User): void {
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    this.currentUserSubject.next(updatedUser);
    console.log('✅ Current user updated:', updatedUser);
  }

  // Force change password for first-time login
  forceChangePassword(currentPassword: string, newPassword: string): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/force-change-password`, {
      current_password: currentPassword,
      new_password: newPassword,
      confirm_password: newPassword
    }).pipe(
      map(response => {
        console.log('Force change password response:', response);
        return response;
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('❌ Force change password error:', error);
        return throwError(() => error);
      })
    );
  }
}
