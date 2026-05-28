import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, finalize, map, shareReplay, switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { User } from '../models/user.model';
import { PushNotificationService } from './push-notification.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;
  private currentUserRequest$: Observable<User> | null = null;
  private currentUserLoadedAt = 0;
  private readonly cacheTtlMs = 15000;

  constructor(private http: HttpClient, private pushNotificationService: PushNotificationService) {
    this.currentUserSubject = new BehaviorSubject<User | null>(null);
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  ensureCsrfCookie(): Observable<void> {
    return this.http.get(this.getCsrfCookieUrl(), {
      withCredentials: true,
      responseType: 'text'
    }).pipe(
      map(() => void 0),
      catchError((error: HttpErrorResponse) => {
        if (error.status === 404) {
          return of(void 0);
        }

        return throwError(() => error);
      })
    );
  }

  login(username: string, password: string): Observable<User> {
    return this.ensureCsrfCookie().pipe(
      switchMap(() => this.http.post<any>(`${environment.apiUrl}/login`, { username, password }, { withCredentials: true })),
      map(response => {
        if (response && response.success && response.data) {
          const userData = response.data.user;

          this.currentUserSubject.next(userData);
          this.currentUserLoadedAt = Date.now();

          if (this.isAdviserUser(userData)) {
            this.pushNotificationService.init().catch(() => {
              // Push init failed silently — non-critical
            });
          }

          return userData;
        }

        throw new Error('Invalid response format');
      }),
      catchError((error: HttpErrorResponse) => {
        this.clearAuthData();
        return throwError(() => error);
      })
    );
  }

  register(userData: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/register`, userData, { withCredentials: true });
  }

  logout(): Observable<any> {
    this.pushNotificationService.unsubscribeAll().catch(() => {});

    return this.ensureCsrfCookie().pipe(
      switchMap(() => this.http.post<any>(`${environment.apiUrl}/logout`, {}, { withCredentials: true })),
      map(() => {
        this.clearAuthData();
        return { success: true };
      }),
      catchError(() => {
        this.clearAuthData();
        return of({ success: true });
      })
    );
  }

  getCurrentUser(forceRefresh = false): Observable<User> {
    const currentUser = this.currentUserValue;

    if (!forceRefresh && currentUser && this.hasFreshValidation()) {
      return of(currentUser);
    }

    if (this.currentUserRequest$) {
      return this.currentUserRequest$;
    }

    this.currentUserRequest$ = this.http.get<any>(`${environment.apiUrl}/me`, { withCredentials: true })
      .pipe(
        map(response => {
          if (response && response.success && response.data) {
            const userData = response.data;
            this.currentUserSubject.next(userData);
            this.currentUserLoadedAt = Date.now();
            return userData;
          }

          throw new Error('Invalid response format');
        }),
        catchError((error: HttpErrorResponse) => {
          if (error.status === 401 || error.status === 419) {
            this.clearAuthData();
          }

          return throwError(() => error);
        }),
        finalize(() => {
          this.currentUserRequest$ = null;
        }),
        shareReplay(1)
      );

    return this.currentUserRequest$;
  }

  isAuthenticated(): boolean {
    return !!this.currentUserValue;
  }

  getToken(): string | null {
    return null;
  }

  public isTokenValid(): boolean {
    return !!this.currentUserValue;
  }

  checkAuthenticationStatus(): boolean {
    const user = this.currentUserValue;

    if (!user) {
      this.clearAuthData();
      return false;
    }

    return true;
  }

  startTokenRefreshTimer(): void {
    return;
  }

  refreshToken(): Observable<any> {
    return this.ensureCsrfCookie().pipe(
      switchMap(() => this.http.post<any>(`${environment.apiUrl}/refresh`, {}, { withCredentials: true })),
      map(response => {
        if (response && response.success) {
          return response;
        }

        throw new Error('Invalid refresh response');
      }),
      catchError((error: HttpErrorResponse) => {
        this.clearAuthData();
        return throwError(() => error);
      })
    );
  }

  startSessionTimeoutWarning(): void {
    return;
  }

  private clearAuthData(): void {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    localStorage.removeItem('tokenExpiry');
    this.currentUserSubject.next(null);
    this.currentUserRequest$ = null;
    this.currentUserLoadedAt = 0;
  }

  public clearAuth(): void {
    this.clearAuthData();
  }

  private hasFreshValidation(): boolean {
    return (Date.now() - this.currentUserLoadedAt) < this.cacheTtlMs;
  }

  private getCsrfCookieUrl(): string {
    return environment.apiUrl.replace(/\/api\/?$/, '') + '/sanctum/csrf-cookie';
  }

  changePassword(userId: number, currentPassword: string, newPassword: string): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/force-change-password`, {
      current_password: currentPassword,
      new_password: newPassword,
      new_password_confirmation: newPassword,
    }, { withCredentials: true });
  }

  updateCurrentUser(updatedUser: User): void {
    this.currentUserSubject.next(updatedUser);
    this.currentUserLoadedAt = Date.now();
  }

  forceChangePassword(currentPassword: string, newPassword: string): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/force-change-password`, {
      current_password: currentPassword,
      new_password: newPassword,
      confirm_password: newPassword
    }, { withCredentials: true }).pipe(
      map(response => {
        return response;
      }),
      catchError((error: HttpErrorResponse) => {
        return throwError(() => error);
      })
    );
  }

  requestPasswordChange(reason?: string, newPassword?: string): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/request-password-change`, {
      reason: reason || '',
      new_password: newPassword || ''
    }, { withCredentials: true }).pipe(
      map(response => {
        return response;
      }),
      catchError((error: HttpErrorResponse) => {
        return throwError(() => error);
      })
    );
  }

  private isAdviserUser(user: User): boolean {
    if (!user) return false;

    if (user.role_id === 3) return true;

    const roleName = (user.role_name ?? '').toLowerCase();
    return roleName.includes('adviser');
  }
}
