import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AdminNotificationPanelService {
  private _open = new BehaviorSubject<boolean>(false);
  private _unreadCount = new BehaviorSubject<number>(0);

  open$ = this._open.asObservable();
  unreadCount$ = this._unreadCount.asObservable();

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
}
