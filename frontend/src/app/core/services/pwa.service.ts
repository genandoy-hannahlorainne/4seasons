import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

/**
 * PWA (Progressive Web App) Service
 * Manages PWA installation, app updates, and offline capabilities
 */
@Injectable({
  providedIn: 'root'
})
export class PwaService {
  private deferredPrompt: any = null;
  private isInstalled$ = new BehaviorSubject<boolean>(this.checkIfInstalled());
  private updateAvailable$ = new BehaviorSubject<boolean>(false);

  constructor() {
    this.setupInstallPrompt();
  }

  /**
   * Check if app is installed on home screen
   */
  isAppInstalled(): boolean {
    return this.checkIfInstalled();
  }

  /**
   * Get observable for installation status changes
   */
  getInstallationStatus() {
    return this.isInstalled$.asObservable();
  }

  /**
   * Check if update is available
   */
  hasUpdateAvailable(): boolean {
    return this.updateAvailable$.value;
  }

  /**
   * Get observable for update availability
   */
  getUpdateAvailable() {
    return this.updateAvailable$.asObservable();
  }

  /**
   * Prompt user to install app (call from user gesture/button click)
   */
  async promptInstall(): Promise<boolean> {
    if (!this.deferredPrompt) {
      console.info('PWA: Install prompt not available');
      return false;
    }

    try {
      this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
      this.deferredPrompt = null;

      if (outcome === 'accepted') {
        console.info('PWA: App installed successfully');
        this.isInstalled$.next(true);
        return true;
      }
      return false;
    } catch (err) {
      console.warn('PWA: Install prompt failed', err);
      return false;
    }
  }

  /**
   * Check for app updates
   */
  async checkForUpdates(): Promise<void> {
    if (!('serviceWorker' in navigator)) return;

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) return;

      await registration.update();
      
      if (registration.waiting) {
        console.info('PWA: Update available');
        this.updateAvailable$.next(true);
      }
    } catch (err) {
      console.warn('PWA: Update check failed', err);
    }
  }

  /**
   * Reload app with new version
   */
  reloadWithUpdate(): void {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration?.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          window.location.reload();
        }
      });
    }
  }

  // â”€â”€â”€ Private helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  private setupInstallPrompt(): void {
    // Listen for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      console.info('PWA: Install prompt available');
    });

    // Listen for app installed event
    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      this.isInstalled$.next(true);
      console.info('PWA: App installed from home screen');
    });
  }

  private checkIfInstalled(): boolean {
    // Check if running in standalone mode (PWA installed)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isPwaInstalled = (navigator as any).standalone === true; // iOS

    return isStandalone || isPwaInstalled;
  }
}

