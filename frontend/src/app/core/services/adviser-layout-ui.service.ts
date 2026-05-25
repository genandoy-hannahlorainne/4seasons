import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AdviserLayoutUiService {
  private readonly _mobileSidebarOpen = new BehaviorSubject<boolean>(false);
  readonly mobileSidebarOpen$ = this._mobileSidebarOpen.asObservable();

  setMobileSidebarOpen(open: boolean): void {
    this._mobileSidebarOpen.next(open);
  }
}
