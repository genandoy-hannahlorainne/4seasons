import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface AdviserNotificationPanelAnchor {
  top: number;
  right: number;
}

@Injectable({ providedIn: 'root' })
export class AdviserNotificationPanelService {
  private _open = new BehaviorSubject<boolean>(false);
  private _unreadCount = new BehaviorSubject<number>(0);
  private _mobileSidebarOpen = new BehaviorSubject<boolean>(false);
  private _anchor = new BehaviorSubject<AdviserNotificationPanelAnchor | null>(null);

  open$ = this._open.asObservable();
  unreadCount$ = this._unreadCount.asObservable();
  mobileSidebarOpen$ = this._mobileSidebarOpen.asObservable();
  anchor$ = this._anchor.asObservable();

  private anchorButton: HTMLElement | null = null;

  get isOpen(): boolean {
    return this._open.value;
  }

  bindAnchorButton(button: HTMLElement): void {
    this.anchorButton = button;
    this.updateAnchorPosition();
  }

  updateAnchorPosition(): void {
    if (!this.anchorButton) return;
    const rect = this.anchorButton.getBoundingClientRect();
    const gap = 8;
    this._anchor.next({
      top: rect.bottom + gap,
      right: Math.max(8, window.innerWidth - rect.right),
    });
  }

  private clearAnchorButton(): void {
    this.anchorButton = null;
    this._anchor.next(null);
  }

  toggle(): void {
    const next = !this._open.value;
    this._open.next(next);
    if (!next) {
      this.clearAnchorButton();
    }
  }

  open(): void { this._open.next(true); }

  close(): void {
    this._open.next(false);
    this.clearAnchorButton();
  }
  setUnreadCount(count: number): void { this._unreadCount.next(count); }
  setMobileSidebarOpen(open: boolean): void { this._mobileSidebarOpen.next(open); }
}
