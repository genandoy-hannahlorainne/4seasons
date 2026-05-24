import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface NotificationHistoryItem {
  notification_id?: number;
  notification_type?: string;
  message: string;
  priority?: string;
  status?: string;
  timeAgo?: string;
  created_at?: string;
  visit_id?: number;
  visit?: { visit_type?: string; visit_id?: number };
  staff?: { name?: string; position?: string };
  student?: { full_name: string; student_number: string };
  user?: { full_name: string; role: string };
  [key: string]: any;
}

export interface NotifDropdownAnchor {
  top: number;
  right: number;
}

@Injectable({ providedIn: 'root' })
export class AdminNotificationPanelService {
  private _open = new BehaviorSubject<boolean>(false);
  private _unreadCount = new BehaviorSubject<number>(0);
  private _notificationHistory = new BehaviorSubject<NotificationHistoryItem[]>([]);
  private _anchor = new BehaviorSubject<NotifDropdownAnchor>({ top: 64, right: 20 });

  open$ = this._open.asObservable();
  unreadCount$ = this._unreadCount.asObservable();
  notificationHistory$ = this._notificationHistory.asObservable();
  anchor$ = this._anchor.asObservable();

  toggle(): void {
    this._open.next(!this._open.value);
  }

  toggleFromAnchor(trigger?: HTMLElement): void {
    if (this._open.value) {
      this.close();
      return;
    }
    if (trigger) {
      this.setAnchorFromElement(trigger);
    }
    this._open.next(true);
  }

  setAnchorFromElement(el: HTMLElement): void {
    const rect = el.getBoundingClientRect();
    const gap = 10;
    this._anchor.next({
      top: rect.bottom + gap,
      right: Math.max(12, window.innerWidth - rect.right),
    });
  }

  open(): void {
    this._open.next(true);
  }

  close(): void {
    this._open.next(false);
  }

  setUnreadCount(count: number): void {
    this._unreadCount.next(count);
  }

  setNotificationHistory(items: NotificationHistoryItem[]): void {
    this._notificationHistory.next(items);
  }

  getNotificationIcon(notification: NotificationHistoryItem): string {
    if (notification.notification_type === 'password_change_request') return 'fa-key';
    if (notification.notification_type === 'emergency_drill_alert') return 'fa-bell';
    if (notification.notification_type === 'emergency_visit' || notification.priority === 'urgent') {
      return 'fa-truck-medical';
    }
    if (notification.notification_type === 'routine_visit' || notification.visit_id) {
      return 'fa-stethoscope';
    }
    return 'fa-circle-info';
  }

  /** Notifications shown in admin feed (clinic visits, drills, etc. — not password or student-only). */
  buildAdminFeed(all: NotificationHistoryItem[]): NotificationHistoryItem[] {
    return all
      .filter(n => !this.isPasswordRequest(n) && !this.isStudentOnly(n))
      .map(n => ({ ...n }))
      .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
      .slice(0, 30);
  }

  isPasswordRequest(n: NotificationHistoryItem): boolean {
    return n.notification_type === 'password_change_request';
  }

  isStudentOnly(n: NotificationHistoryItem): boolean {
    return n.notification_type === 'visit_summary' || n.notification_type === 'badge_earned';
  }

  isClinicVisit(n: NotificationHistoryItem): boolean {
    return !!n.visit_id || n.notification_type === 'routine_visit' || n.notification_type === 'emergency_visit';
  }
}
