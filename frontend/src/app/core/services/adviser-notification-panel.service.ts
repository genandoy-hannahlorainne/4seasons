import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AdviserNotificationPanelService {
  private _open = new BehaviorSubject<boolean>(false);
  private _unreadCount = new BehaviorSubject<number>(0);
  private _mobileSidebarOpen = new BehaviorSubject<boolean>(false);

  open$ = this._open.asObservable();
  unreadCount$ = this._unreadCount.asObservable();
  mobileSidebarOpen$ = this._mobileSidebarOpen.asObservable();

  toggle(): void { this._open.next(!this._open.value); }
  open(): void { this._open.next(true); }
  close(): void { this._open.next(false); }
  setUnreadCount(count: number): void { this._unreadCount.next(count); }
  setMobileSidebarOpen(open: boolean): void { this._mobileSidebarOpen.next(open); }
}
