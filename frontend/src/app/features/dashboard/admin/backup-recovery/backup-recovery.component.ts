import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../../core/services/admin.service';

@Component({
  selector: 'app-backup-recovery',
  standalone: true,
  imports: [CommonModule],
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

  loadBackups(): void {
    this.loading = true;
    this.error = '';
    
    this.adminService.getBackupHistory().subscribe({
      next: (response: any) => {
        this.loading = false;
        if (response.success) {
          this.backups = response.backups;
        } else {
          this.error = response.message || 'Failed to load backups';
        }
      },
      error: (err: any) => {
        this.loading = false;
        this.error = 'Failed to load backup history';
        console.error('Error loading backups:', err);
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
        if (response.success) {
          this.success = 'Backup created successfully!';
          this.loadBackups();
          setTimeout(() => this.success = '', 5000);
        } else {
          this.error = response.message || 'Failed to create backup';
        }
      },
      error: (err: any) => {
        this.creating = false;
        this.error = 'Failed to create backup. Please try again.';
        console.error('Error creating backup:', err);
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
        if (response.success) {
          this.success = 'Backup deleted successfully';
          this.loadBackups();
          setTimeout(() => this.success = '', 3000);
        } else {
          this.error = response.message || 'Failed to delete backup';
        }
      },
      error: (err: any) => {
        this.error = 'Failed to delete backup';
        console.error('Error deleting backup:', err);
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
        if (response.success) {
          this.success = '✅ Database restored successfully! The page will reload in 3 seconds...';
          setTimeout(() => {
            window.location.reload();
          }, 3000);
        } else {
          this.error = response.message || 'Failed to restore backup';
        }
      },
      error: (err: any) => {
        this.loading = false;
        this.error = 'Failed to restore backup. Please try again or restore manually.';
        console.error('Error restoring backup:', err);
      }
    });
  }
}
