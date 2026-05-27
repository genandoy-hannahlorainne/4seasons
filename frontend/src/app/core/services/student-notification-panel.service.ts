import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class StudentNotificationPanelService {
  private toggleSource = new Subject<MouseEvent>();
  toggle$ = this.toggleSource.asObservable();

  toggle(event: MouseEvent): void {
    this.toggleSource.next(event);
  }
}
