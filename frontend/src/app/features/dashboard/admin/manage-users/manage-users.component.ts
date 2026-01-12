import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../../core/services/admin.service';

@Component({
  selector: 'app-manage-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './manage-users.component.html',
  styleUrls: ['./manage-users.component.scss']
})
export class ManageUsersComponent implements OnInit {
  users: any[] = [];
  filteredUsers: any[] = [];
  loading = false;
  selectedRole = 'all';
  searchQuery = '';
  selectedUser: any = null;
  showUserModal = false;
  showPasswordModal = false;
  newPassword = '';
  editingUser: any = null;
  successMessage = '';
  errorMessage = '';

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.adminService.getAllUsers().subscribe({
      next: (response) => {
        if (response.success) {
          this.users = [
            ...response.users.student.map((u: any) => ({ ...u, roleDisplay: 'Student' })),
            ...response.users.adviser.map((u: any) => ({ ...u, roleDisplay: 'Adviser' })),
            ...response.users.clinic_staff.map((u: any) => ({ ...u, roleDisplay: 'Clinic Staff' }))
          ];
          this.filterUsers();
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading users:', err);
        this.errorMessage = 'Failed to load users';
        this.loading = false;
      }
    });
  }

  filterUsers(): void {
    this.filteredUsers = this.users.filter(user => {
      const matchesRole = this.selectedRole === 'all' || user.role === this.selectedRole;
      const matchesSearch = !this.searchQuery || 
        user.full_name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        user.username.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(this.searchQuery.toLowerCase());
      
      return matchesRole && matchesSearch;
    });
  }

  onRoleChange(): void {
    this.filterUsers();
  }

  onSearchChange(): void {
    this.filterUsers();
  }

  viewUser(user: any): void {
    this.selectedUser = { ...user };
    this.editingUser = { ...user };
    this.showUserModal = true;
    this.successMessage = '';
    this.errorMessage = '';
  }

  closeUserModal(): void {
    this.showUserModal = false;
    this.selectedUser = null;
    this.editingUser = null;
  }

  openPasswordModal(): void {
    this.showPasswordModal = true;
    this.newPassword = '';
    this.errorMessage = '';
  }

  closePasswordModal(): void {
    this.showPasswordModal = false;
    this.newPassword = '';
  }

  saveUserChanges(): void {
    if (!this.editingUser) return;

    const updates = {
      full_name: this.editingUser.full_name,
      email: this.editingUser.email,
      phone: this.editingUser.phone || null
    };

    this.adminService.updateUser(this.editingUser.user_id, updates).subscribe({
      next: (response) => {
        if (response.success) {
          this.successMessage = 'User updated successfully';
          const index = this.users.findIndex(u => u.user_id === this.editingUser.user_id);
          if (index > -1) {
            this.users[index] = { ...this.editingUser, roleDisplay: this.users[index].roleDisplay };
          }
          this.filterUsers();
          setTimeout(() => this.closeUserModal(), 2000);
        }
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to update user';
      }
    });
  }

  resetPassword(): void {
    if (!this.newPassword || this.newPassword.length < 6) {
      this.errorMessage = 'Password must be at least 6 characters';
      return;
    }

    this.adminService.resetPassword(this.selectedUser.user_id, this.newPassword).subscribe({
      next: (response) => {
        if (response.success) {
          this.successMessage = 'Password reset successfully';
          this.newPassword = '';
          setTimeout(() => this.closePasswordModal(), 2000);
        }
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to reset password';
      }
    });
  }

  toggleUserStatus(): void {
    if (!this.selectedUser) return;

    const action = this.selectedUser.is_active ? 'deactivate' : 'activate';
    const observable = this.selectedUser.is_active 
      ? this.adminService.deactivateUser(this.selectedUser.user_id)
      : this.adminService.activateUser(this.selectedUser.user_id);

    observable.subscribe({
      next: (response) => {
        if (response.success) {
          this.successMessage = response.message;
          this.selectedUser.is_active = !this.selectedUser.is_active;
          const index = this.users.findIndex(u => u.user_id === this.selectedUser.user_id);
          if (index > -1) {
            this.users[index].is_active = this.selectedUser.is_active;
          }
          this.filterUsers();
          setTimeout(() => this.closeUserModal(), 2000);
        }
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to update user status';
      }
    });
  }

  deleteUser(): void {
    if (!this.selectedUser || !confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    this.adminService.deleteUser(this.selectedUser.user_id).subscribe({
      next: (response) => {
        if (response.success) {
          this.successMessage = 'User deleted successfully';
          this.users = this.users.filter(u => u.user_id !== this.selectedUser.user_id);
          this.filterUsers();
          setTimeout(() => this.closeUserModal(), 2000);
        }
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to delete user';
      }
    });
  }

  getStatusClass(isActive: boolean): string {
    return isActive ? 'active' : 'inactive';
  }

  getStatusText(isActive: boolean): string {
    return isActive ? 'Active' : 'Inactive';
  }
}
