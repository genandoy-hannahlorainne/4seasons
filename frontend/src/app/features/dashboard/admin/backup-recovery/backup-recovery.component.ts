import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../../core/services/admin.service';
import { AdminNotificationBellComponent } from '../shared/admin-notification-bell.component';

@Component({
  selector: 'app-backup-recovery',
  standalone: true,
  imports: [CommonModule, AdminNotificationBellComponent],
  templateUrl: './backup-recovery.component.html',
  styleUrls: ['./backup-recovery.component.scss']
})
export class BackupRecoveryComponent implements OnInit {
  backups: any[] = [];
  loading = false;
  creating = false;
  error = '';
  success = '';

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadBackups();
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  loadBackups(): void {
    this.loading = true;
    this.error = '';
    
    this.adminService.getBackupHistory().subscribe({
      next: (response: any) => {
        this.loading = false;
        this.backups = response.data?.backups || response.backups || [];
      },
      error: (err: any) => {
        this.loading = false;
        this.error = 'Failed to load backup history';
        // Error loading backups
      }
    });
  }

  createBackup(): void {
    if (this.creating) return;
    
    this.creating = true;
    this.error = '';
    this.success = '';
    
    this.adminService.createBackup().subscribe({
      next: (response: any) => {
        this.creating = false;
        this.success = 'Backup created successfully!';
        this.loadBackups();
        setTimeout(() => this.success = '', 5000);
      },
      error: (err: any) => {
        this.creating = false;
        this.error = 'Failed to create backup. Please try again.';
        // Error creating backup
      }
    });
  }

  downloadBackup(filename: string): void {
    this.adminService.downloadBackup(filename);
  }

  deleteBackup(filename: string): void {
    if (!confirm(`Are you sure you want to delete backup: ${filename}?`)) {
      return;
    }
    
    this.adminService.deleteBackup(filename).subscribe({
      next: (response: any) => {
        this.success = 'Backup deleted successfully';
        this.loadBackups();
        setTimeout(() => this.success = '', 3000);
      },
      error: (err: any) => {
        this.error = 'Failed to delete backup';
        // Error deleting backup
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
    
    this.loading = true;
    this.error = '';
    this.success = '';
    
    this.adminService.restoreBackup(filename).subscribe({
      next: (response: any) => {
        this.loading = false;
        this.success = '✅ Database restored successfully! The page will reload in 3 seconds...';
        setTimeout(() => window.location.reload(), 3000);
      },
      error: (err: any) => {
        this.loading = false;
        this.error = 'Failed to restore backup. Please try again or restore manually.';
        // Error restoring backup
      }
    });
  }
}
