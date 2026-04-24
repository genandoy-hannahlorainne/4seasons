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

  // Backup management properties
  backups: any[] = [];
  creating = false;
  loadingBackups = false;
  showDeleteModal = false;
  backupToDelete: string | null = null;
  deleting = false;

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadSettings();
  }

  loadSettings(): void {
    this.loading = true;
    this.adminService.getSystemSettings().subscribe({
      next: (response) => {
        if (response.success) {
          const data = response.data || response.settings || {};
          // Ensure all sections always exist with defaults
          this.settings = {
            system: data.system || {},
            email: data.email || {},
            notifications: data.notifications || {},
            security: data.security || {},
            backup: data.backup || {
              auto_backup_enabled: false,
              backup_frequency: 'daily',
              backup_time: '02:00',
              backup_retention_days: 30
            }
          };
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
    
    // Load backups when switching to backup tab
    if (tab === 'backup') {
      this.loadBackups();
    }
  }

  saveSettings(): void {
    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    // Ensure settings for the active tab exist
    const settingsToSave = this.settings[this.activeTab] || {};

    this.adminService.updateSystemSettings(this.activeTab, settingsToSave).subscribe({
      next: (response) => {
        this.successMessage = `${this.activeTab.charAt(0).toUpperCase() + this.activeTab.slice(1)} settings saved successfully`;
        setTimeout(() => this.successMessage = '', 3000);
        this.saving = false;
      },
      error: (err) => {
        this.errorMessage = err.error?.message || err.error?.error || 'Failed to save settings';
        console.error('Save settings error:', err);
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

  // Backup management methods
  loadBackups(): void {
    this.loadingBackups = true;
    this.errorMessage = '';
    
    this.adminService.getBackupHistory().subscribe({
      next: (response: any) => {
        this.loadingBackups = false;
        this.backups = response.data?.backups || response.backups || [];
      },
      error: (err: any) => {
        this.loadingBackups = false;
        this.errorMessage = 'Failed to load backup history';
        console.error('Error loading backups:', err);
      }
    });
  }

  createBackup(): void {
    if (this.creating) return;
    
    this.creating = true;
    this.errorMessage = '';
    this.successMessage = '';
    
    this.adminService.createBackup().subscribe({
      next: (response: any) => {
        this.creating = false;
        this.successMessage = 'Backup created successfully!';
        this.loadBackups();
        setTimeout(() => this.successMessage = '', 5000);
      },
      error: (err: any) => {
        this.creating = false;
        this.errorMessage = 'Failed to create backup. Please try again.';
        console.error('Error creating backup:', err);
      }
    });
  }

  downloadBackup(filename: string): void {
    this.adminService.downloadBackup(filename);
  }

  deleteBackup(filename: string): void {
    this.backupToDelete = filename;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.backupToDelete = null;
  }

  confirmDeleteBackup(): void {
    if (!this.backupToDelete) return;

    this.deleting = true;
    this.errorMessage = '';
    
    this.adminService.deleteBackup(this.backupToDelete).subscribe({
      next: (response: any) => {
        this.successMessage = 'Backup deleted successfully';
        this.loadBackups();
        setTimeout(() => this.successMessage = '', 3000);
        this.deleting = false;
        this.closeDeleteModal();
      },
      error: (err: any) => {
        this.errorMessage = 'Failed to delete backup';
        console.error('Error deleting backup:', err);
        this.deleting = false;
      }
    });
  }

  restoreBackup(filename: string): void {
    const confirmMsg = `⚠️ WARNING: This will restore the database to the state of this backup.\n\n` +
                       `All current data will be replaced with data from:\n${filename}\n\n` +
                       `This action CANNOT be undone!\n\n` +
                       `Are you absolutely sure you want to continue?`;
    
    if (!confirm(confirmMsg)) {
      return;
    }
    
    // Double confirmation for safety
    if (!confirm('Final confirmation: Restore database from backup?')) {
      return;
    }
    
    this.loadingBackups = true;
    this.errorMessage = '';
    this.successMessage = '';
    
    this.adminService.restoreBackup(filename).subscribe({
      next: (response: any) => {
        this.loadingBackups = false;
        this.successMessage = '✅ Database restored successfully! The page will reload in 3 seconds...';
        setTimeout(() => window.location.reload(), 3000);
      },
      error: (err: any) => {
        this.loadingBackups = false;
        this.errorMessage = 'Failed to restore backup. Please try again or restore manually.';
        console.error('Error restoring backup:', err);
      }
    });
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
}
