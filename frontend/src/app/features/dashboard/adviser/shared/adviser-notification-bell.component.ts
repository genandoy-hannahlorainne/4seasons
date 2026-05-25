import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdviserNotificationPanelService } from '../../../../core/services/adviser-notification-panel.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-adviser-notification-bell',
  standalone: true,
  imports: [CommonModule],
  styleUrls: ['./adviser-notification-bell.component.scss'],
  encapsulation: ViewEncapsulation.None,
  template: `
    <button
      type="button"
      class="adviser-notif-bell"
      [class.variant-hero]="variant === 'hero'"
      [class.variant-page-header]="variant === 'page-header'"
      [class.variant-page-header-corner]="variant === 'page-header-corner' || variant === 'hero'"
      [class.variant-topbar]="variant === 'topbar'"
      [class.notif-active]="panelOpen"
      (click)="onClick($event)"
      title="Notifications">
      <i class="bi bi-bell-fill"></i>
      <span class="notif-badge" *ngIf="unreadCount > 0">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
    </button>
  `,
})
export class AdviserNotificationBellComponent implements OnInit, OnDestroy {
  @Input() variant: 'hero' | 'page-header' | 'page-header-corner' | 'topbar' = 'page-header';

  panelOpen = false;
  unreadCount = 0;
  private subs = new Subscription();

  constructor(private notifPanelService: AdviserNotificationPanelService) {}

  ngOnInit(): void {
    this.subs.add(this.notifPanelService.open$.subscribe(open => (this.panelOpen = open)));
    this.subs.add(this.notifPanelService.unreadCount$.subscribe(count => (this.unreadCount = count)));
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  onClick(event: Event): void {
    event.stopPropagation();
    if (!this.notifPanelService.isOpen) {
      this.notifPanelService.bindAnchorButton(event.currentTarget as HTMLElement);
    }
    this.notifPanelService.toggle();
  }
}
