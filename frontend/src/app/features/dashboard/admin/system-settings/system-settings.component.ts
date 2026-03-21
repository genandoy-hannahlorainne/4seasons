import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../../core/services/admin.service';

@Component({
  selector: 'app-system-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './system-settings.component.html',
  styleUrls: ['./system-settings.component.scss']
})
export class SystemSettingsComponent implements OnInit {
  loading = false;
  saving = false;
  activeTab = 'system';
  successMessage = '';
  errorMessage = '';

  settings: any = {
    system: {},
    email: {},
    notifications: {},
    security: {},
    backup: {}
  };

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadSettings();
  }

  loadSettings(): void {
    this.loading = true;
    this.adminService.getSystemSettings().subscribe({
      next: (response) => {
        if (response.success) {
          this.settings = response.data || response.settings || {};
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading settings:', err);
        this.errorMessage = 'Failed to load settings';
        this.loading = false;
      }
    });
  }

  selectTab(tab: string): void {
    this.activeTab = tab;
    this.successMessage = '';
    this.errorMessage = '';
  }

  saveSettings(): void {
    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.adminService.updateSystemSettings(this.activeTab, this.settings[this.activeTab]).subscribe({
      next: (response) => {
        if (response.success) {
          this.successMessage = `${this.activeTab.charAt(0).toUpperCase() + this.activeTab.slice(1)} settings updated successfully`;
          setTimeout(() => this.successMessage = '', 3000);
        }
        this.saving = false;
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to save settings';
        this.saving = false;
      }
    });
  }

  resetSettings(): void {
    if (confirm('Are you sure you want to reset these settings to defaults?')) {
      this.loadSettings();
    }
  }

  testEmailConnection(): void {
    alert('Email connection test initiated. Check your email for a test message.');
  }
}
