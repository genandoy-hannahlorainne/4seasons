import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminNotificationPanelService } from '../../../../core/services/admin-notification-panel.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-admin-notification-bell',
  standalone: true,
  imports: [CommonModule],
  styleUrls: ['./admin-notification-bell.component.scss'],
  encapsulation: ViewEncapsulation.None,
  template: `
    <button
      type="button"
      class="admin-notif-bell"
      [class.variant-hero]="variant === 'hero'"
      [class.variant-page-header]="variant === 'page-header'"
      [class.variant-page-header-corner]="variant === 'page-header-corner' || variant === 'hero'"
      [class.notif-active]="panelOpen"
      (click)="onClick($event)"
      title="Notifications">
      <i class="bi bi-bell-fill"></i>
      <span class="notif-badge" *ngIf="unreadCount > 0">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
    </button>
  `,
})
export class AdminNotificationBellComponent implements OnInit, OnDestroy {
  /** hero / page-header-corner = top-right like dashboard; page-header = inline with action buttons */
  @Input() variant: 'hero' | 'page-header' | 'page-header-corner' = 'page-header';

  panelOpen = false;
  unreadCount = 0;
  private subs = new Subscription();

  constructor(private notifPanelService: AdminNotificationPanelService) {}

  ngOnInit(): void {
    this.subs.add(this.notifPanelService.open$.subscribe(open => (this.panelOpen = open)));
    this.subs.add(this.notifPanelService.unreadCount$.subscribe(count => (this.unreadCount = count)));
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  onClick(event: Event): void {
    event.stopPropagation();
    this.notifPanelService.toggleFromAnchor(event.currentTarget as HTMLElement);
  }
}
