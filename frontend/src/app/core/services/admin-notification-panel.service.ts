import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface NotificationHistoryItem {
  notification_id?: number;
  notification_type?: string;
  message: string;
  priority?: string;
  status?: string;
  timeAgo?: string;
  student?: { full_name: string; student_number: string };
  user?: { full_name: string; role: string };
  [key: string]: any;
}

@Injectable({ providedIn: 'root' })
export class AdminNotificationPanelService {
  private _open = new BehaviorSubject<boolean>(false);
  private _unreadCount = new BehaviorSubject<number>(0);
  private _notificationHistory = new BehaviorSubject<NotificationHistoryItem[]>([]);

  open$ = this._open.asObservable();
  unreadCount$ = this._unreadCount.asObservable();
  notificationHistory$ = this._notificationHistory.asObservable();

  toggle(): void {
    this._open.next(!this._open.value);
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
    if (notification.priority === 'urgent') return 'fa-triangle-exclamation';
    return 'fa-circle-info';
  }
}
