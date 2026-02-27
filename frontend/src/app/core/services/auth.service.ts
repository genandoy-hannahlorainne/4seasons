import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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
          if (response && response.success && response.data) {
            const userData = response.data.user;
            const token = response.data.token;
            
            // Store user data and JWT token
            localStorage.setItem('currentUser', JSON.stringify(userData));
            localStorage.setItem('token', token);
            
            this.currentUserSubject.next(userData);
            return userData;
          }
          throw new Error('Invalid response format');
        }),
        catchError(error => {
          console.error('Login error:', error);
          return throwError(() => error);
        })
      );
  }

  register(userData: any): Observable<any> {
    // Keep using legacy endpoint for now
    return this.http.post<any>(`${environment.legacyApiUrl}/register.php`, userData);
  }

  logout(): Observable<any> {
    const token = localStorage.getItem('token');
    
    // Call Laravel logout endpoint if token exists
    const logoutRequest = token ? 
      this.http.post(`${environment.apiUrl}/logout`, {}) : 
      new Observable(observer => observer.complete());

    return logoutRequest.pipe(
      map(() => {
        // Clear local storage regardless of API response
        localStorage.removeItem('currentUser');
        localStorage.removeItem('token');
        this.currentUserSubject.next(null);
        return { success: true };
      }),
      catchError(error => {
        // Even if logout API fails, clear local storage
        localStorage.removeItem('currentUser');
        localStorage.removeItem('token');
        this.currentUserSubject.next(null);
        console.warn('Logout API failed, but local storage cleared:', error);
        return new Observable(observer => {
          observer.next({ success: true });
          observer.complete();
        });
      })
    );
  }

  refreshToken(): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/refresh`, {})
      .pipe(
        map(response => {
          if (response && response.success && response.data) {
            const token = response.data.token;
            localStorage.setItem('token', token);
            return response.data;
          }
          throw new Error('Token refresh failed');
        }),
        catchError(error => {
          // If refresh fails, logout user
          this.logout().subscribe();
          return throwError(() => error);
        })
      );
  }

  getCurrentUser(): Observable<User> {
    return this.http.get<any>(`${environment.apiUrl}/me`)
      .pipe(
        map(response => {
          if (response && response.success && response.data) {
            const userData = response.data;
            localStorage.setItem('currentUser', JSON.stringify(userData));
            this.currentUserSubject.next(userData);
            return userData;
          }
          throw new Error('Failed to get user info');
        })
      );
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem('token');
    const user = this.currentUserValue;
    return !!(token && user);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  changePassword(userId: number, currentPassword: string, newPassword: string): Observable<any> {
    // Keep using legacy endpoint for now
    return this.http.post<any>(`${environment.legacyApiUrl}/change-password.php`, {
      user_id: userId,
      current_password: currentPassword,
      new_password: newPassword,
      confirm_password: newPassword
    });
  }

  updateCurrentUser(updatedUser: User): void {
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    this.currentUserSubject.next(updatedUser);
  }
}
