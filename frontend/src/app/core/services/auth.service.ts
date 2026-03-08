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
            
            // Store user data and token
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
    return this.http.post<any>(`${environment.apiUrl}/register`, userData);
  }

  logout(): Observable<any> {
    const token = localStorage.getItem('token');
    
    // Call Laravel logout endpoint if we have a token
    if (token) {
      return this.http.post<any>(`${environment.apiUrl}/logout`, {})
        .pipe(
          map(() => {
            // Clear local storage
            localStorage.removeItem('currentUser');
            localStorage.removeItem('token');
            this.currentUserSubject.next(null);
            return { success: true };
          }),
          catchError(() => {
            // Even if logout fails, clear local storage
            localStorage.removeItem('currentUser');
            localStorage.removeItem('token');
            this.currentUserSubject.next(null);
            return new Observable(observer => {
              observer.next({ success: true });
              observer.complete();
            });
          })
        );
    } else {
      // No token, just clear local storage
      localStorage.removeItem('currentUser');
      localStorage.removeItem('token');
      this.currentUserSubject.next(null);
      
      return new Observable(observer => {
        observer.next({ success: true });
        observer.complete();
      });
    }
  }

  getCurrentUser(): Observable<User> {
    const token = localStorage.getItem('token');
    
    // If we have a token, use Laravel /me endpoint
    if (token) {
      return this.http.get<any>(`${environment.apiUrl}/me`)
        .pipe(
          map(response => {
            if (response && response.success && response.data) {
              const userData = response.data;
              // Update stored user data
              localStorage.setItem('currentUser', JSON.stringify(userData));
              this.currentUserSubject.next(userData);
              return userData;
            }
            throw new Error('Invalid response format');
          }),
          catchError(error => {
            // If /me fails, clear auth data and return error
            localStorage.removeItem('currentUser');
            localStorage.removeItem('token');
            this.currentUserSubject.next(null);
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
    return !!user;
  }

  getToken(): string | null {
    return localStorage.getItem('token');
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
  }
}
