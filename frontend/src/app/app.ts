import { Component, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { PwaService } from './core/services/pwa.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected readonly title = signal('frontend');
  showUpdateBanner = false;

  constructor(private pwaService: PwaService) {}

  ngOnInit(): void {
    // Check for SW updates on startup, then every 6 hours
    this.pwaService.checkForUpdates();
    setInterval(() => this.pwaService.checkForUpdates(), 6 * 60 * 60 * 1000);

    // Show banner when an update is ready
    this.pwaService.getUpdateAvailable().subscribe((available) => {
      this.showUpdateBanner = available;
    });
  }

  applyUpdate(): void {
    this.pwaService.reloadWithUpdate();
  }

  dismissUpdate(): void {
    this.showUpdateBanner = false;
  }
}
