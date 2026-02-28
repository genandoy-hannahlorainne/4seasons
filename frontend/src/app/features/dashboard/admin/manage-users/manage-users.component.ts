import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../../core/services/admin.service';
import { Subject, interval } from 'rxjs';
import { takeUntil, switchMap, startWith } from 'rxjs/operators';

@Component({
  selector: 'app-manage-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './manage-users.component.html',
  styleUrls: ['./manage-users.component.scss']
})
export class ManageUsersComponent implements OnInit, OnDestroy {
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
  private destroy$ = new Subject<void>();
  private refreshInterval = 30000; // 30 seconds

  // Create User Modal
  showCreateUserModal = false;
  creatingUser = false;
  createSuccessMessage = '';
  createErrorMessage = '';
  newUser: any = {
    role: '',
    email: '',
    phone: '',
    full_name: '',
    // Student fields
    student_number: '',
    first_name: '',
    middle_name: '',
    last_name: '',
    gender: '',
    birth_date: '',
    grade_level: '',
    section_id: '', // Changed from section to section_id
    // Adviser fields
    employee_number: '',
    // Clinic Staff fields
    staff_code: '',
    position: ''
  };

  // Available sections for selected grade level
  availableSections: any[] = [];
  loadingSections = false;

  // Debug properties
  userCounts = {
    students: 0,
    advisers: 0,
    clinicStaff: 0,
    admins: 0
  };

  // Bulk Import properties
  showBulkImportModal = false;
  selectedFile: File | null = null;
  importing = false;
  isDragging = false;
  importResults: any = null;

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadUsers();
    
    // Auto-refresh users every 30 seconds
    interval(this.refreshInterval)
      .pipe(
        startWith(0),
        switchMap(() => this.adminService.getAllUsers()),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response) => {
          if (response.success && response.users) {
            this.updateUsersList(response);
          }
        },
        error: (err) => {
          console.error('Auto-refresh error:', err);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadUsers(): void {
    this.loading = true;
    console.log('👥 Loading users for manage-users component...');
    this.adminService.getAllUsers().subscribe({
      next: (response) => {
        console.log('✅ getAllUsers response received:', response);
        console.log('✅ Response.success:', response?.success);
        console.log('✅ Response.users keys:', response?.users ? Object.keys(response.users) : 'no users object');
        this.updateUsersList(response);
        this.loading = false;
      },
      error: (err) => {
        console.error('❌ Error loading users:', err);
        console.error('❌ Error details:', err.error);
        this.errorMessage = 'Failed to load users. Make sure you are logged in as admin.';
        this.loading = false;
      }
    });
  }

  private updateUsersList(response: any): void {
    console.log('👥 updateUsersList called with response:', response);
    
    if (response.success && response.users) {
      console.log('✅ Response is successful and has users');
      
      // Handle grouped response (when no role filter)
      if (response.users.student || response.users.adviser || response.users.clinic_staff || response.users.admin) {
        console.log('📊 Detected grouped response format');
        console.log('   student count:', response.users.student?.length || 0);
        console.log('   adviser count:', response.users.adviser?.length || 0);
        console.log('   clinic_staff count:', response.users.clinic_staff?.length || 0);
        console.log('   admin count:', response.users.admin?.length || 0);
        
        this.users = [
          ...(response.users.student || []).map((u: any) => ({ 
            ...u, 
            roleDisplay: 'Student',
            role: 'student'
          })),
          ...(response.users.adviser || []).map((u: any) => ({ 
            ...u, 
            roleDisplay: 'Faculty/Adviser',
            role: 'adviser'
          })),
          ...(response.users.clinic_staff || []).map((u: any) => ({ 
            ...u, 
            roleDisplay: 'Clinic Staff',
            role: 'clinic_staff'
          })),
          ...(response.users.admin || []).map((u: any) => ({ 
            ...u, 
            roleDisplay: 'Admin',
            role: 'admin'
          }))
        ];
        
        console.log('✅ Mapped users array, total count:', this.users.length);
        console.log('✅ Users breakdown:', {
          students: this.users.filter(u => u.role === 'student').length,
          advisers: this.users.filter(u => u.role === 'adviser').length,
          clinicStaff: this.users.filter(u => u.role === 'clinic_staff').length,
          admins: this.users.filter(u => u.role === 'admin').length
        });
      } else {
        console.log('📊 Detected flat response format');
        // Handle flat response (when role filter is applied)
        this.users = (response.users || []).map((u: any) => ({
          ...u,
          roleDisplay: this.formatRoleName(u.role_name || 'Unknown'),
          role: u.role_name?.toLowerCase() || 'unknown'
        }));
        console.log('✅ Mapped flat users array, total count:', this.users.length);
      }
      
      this.filterUsers();
      console.log('✅ Users loaded and filtered:', this.filteredUsers.length);
      
      // Update counts
      this.userCounts = {
        students: this.users.filter(u => u.role === 'student').length,
        advisers: this.users.filter(u => u.role === 'adviser').length,
        clinicStaff: this.users.filter(u => u.role === 'clinic_staff').length,
        admins: this.users.filter(u => u.role === 'admin').length
      };
      console.log('✅ User counts:', this.userCounts);
    } else {
      console.error('❌ Invalid response structure:', response);
      this.errorMessage = 'Invalid response from server';
    }
  }

  private formatRoleName(roleName: string): string {
    const roleMap: { [key: string]: string } = {
      'student': 'Student',
      'adviser': 'Faculty/Adviser',
      'clinic staff': 'Clinic Staff',
      'admin': 'Admin'
    };
    return roleMap[roleName.toLowerCase()] || roleName;
  }

  filterUsers(): void {
    this.filteredUsers = this.users.filter(user => {
      const userRole = user.role || user.roleDisplay?.toLowerCase();
      const matchesRole = this.selectedRole === 'all' || userRole === this.selectedRole;
      const matchesSearch = !this.searchQuery || 
        user.full_name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        user.username.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        (user.email && user.email.toLowerCase().includes(this.searchQuery.toLowerCase()));
      
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

    const observable = this.selectedUser.is_active ? 
      this.adminService.deactivateUser(this.selectedUser.user_id) :
      this.adminService.activateUser(this.selectedUser.user_id);

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

  // Create User Modal Methods
  openCreateUserModal(): void {
    this.showCreateUserModal = true;
    this.resetNewUserForm();
    this.createSuccessMessage = '';
    this.createErrorMessage = '';
  }

  closeCreateUserModal(): void {
    this.showCreateUserModal = false;
    this.resetNewUserForm();
  }

  resetNewUserForm(): void {
    this.newUser = {
      role: '',
      email: '',
      phone: '',
      full_name: '',
      student_number: '',
      first_name: '',
      middle_name: '',
      last_name: '',
      gender: '',
      birth_date: '',
      grade_level: '',
      section_id: '', // Changed from section to section_id
      employee_number: '',
      staff_code: '',
      position: ''
    };
    this.availableSections = [];
  }

  onRoleSelect(): void {
    // Clear role-specific fields when role changes
    this.newUser.student_number = '';
    this.newUser.first_name = '';
    this.newUser.middle_name = '';
    this.newUser.last_name = '';
    this.newUser.gender = '';
    this.newUser.birth_date = '';
    this.newUser.grade_level = '';
    this.newUser.section_id = ''; // Changed from section to section_id
    this.newUser.employee_number = '';
    this.newUser.staff_code = '';
    this.newUser.position = '';
    this.newUser.full_name = '';
    this.availableSections = [];
  }

  onGradeLevelChange(): void {
    // Clear section when grade level changes
    this.newUser.section_id = '';
    this.availableSections = [];
    
    // Load sections for the selected grade level (for students and advisers)
    if ((this.newUser.role === 'student' || this.newUser.role === 'adviser') && this.newUser.grade_level) {
      this.loadSectionsForGrade(parseInt(this.newUser.grade_level));
    }
  }

  loadSectionsForGrade(gradeLevel: number): void {
    this.loadingSections = true;
    this.adminService.getSectionsForGrade(gradeLevel).subscribe({
      next: (response) => {
        this.loadingSections = false;
        if (response.success && response.data.sections) {
          this.availableSections = response.data.sections;
          console.log('✅ Loaded sections for grade', gradeLevel, ':', this.availableSections);
        } else {
          this.availableSections = [];
          console.error('❌ Failed to load sections:', response.message);
        }
      },
      error: (err) => {
        this.loadingSections = false;
        this.availableSections = [];
        console.error('❌ Error loading sections:', err);
      }
    });
  }

  getAvailableSections(): any[] {
    return this.availableSections;
  }

  parseInt(value: string): number {
    return parseInt(value);
  }

  isCreateFormValid(): boolean {
    // Basic validation
    if (!this.newUser.role || !this.newUser.email) {
      return false;
    }

    // Role-specific validation
    if (this.newUser.role === 'student') {
      return !!(
        this.newUser.student_number &&
        this.newUser.first_name &&
        this.newUser.last_name &&
        this.newUser.gender &&
        this.newUser.birth_date &&
        this.newUser.grade_level &&
        this.newUser.section_id // Changed from section to section_id
      );
    } else if (this.newUser.role === 'adviser') {
      return !!(
        this.newUser.employee_number &&
        this.newUser.first_name &&
        this.newUser.last_name
      );
    } else if (this.newUser.role === 'clinic_staff') {
      return !!(
        this.newUser.full_name &&
        this.newUser.staff_code &&
        this.newUser.position
      );
    }

    return false;
  }

  createUser(): void {
    if (!this.isCreateFormValid()) {
      this.createErrorMessage = 'Please fill in all required fields';
      return;
    }

    this.creatingUser = true;
    this.createSuccessMessage = '';
    this.createErrorMessage = '';

    // Build full_name for student and adviser
    if (this.newUser.role === 'student' || this.newUser.role === 'adviser') {
      this.newUser.full_name = `${this.newUser.first_name} ${this.newUser.middle_name || ''} ${this.newUser.last_name}`.trim();
    }

    // For students, use Laravel API
    if (this.newUser.role === 'student') {
      this.adminService.createUser(this.newUser).subscribe({
        next: (response) => {
          this.creatingUser = false;
          if (response.success) {
            const studentData = response.data.student;
            this.createSuccessMessage = `Student account created successfully! Username: ${studentData.username}, Temporary Password: ${studentData.temp_password}`;
            
            // Reload users list
            this.loadUsers();
            
            // Close modal after 5 seconds
            setTimeout(() => {
              this.closeCreateUserModal();
            }, 5000);
          } else {
            this.createErrorMessage = response.message || 'Failed to create student account';
          }
        },
        error: (err) => {
          this.creatingUser = false;
          console.error('Error creating student:', err);
          this.createErrorMessage = err.error?.message || 'Failed to create student account. Please try again.';
        }
      });
    } else {
      // For other roles, use legacy API
      this.adminService.createUserLegacy(this.newUser).subscribe({
        next: (response) => {
          this.creatingUser = false;
          if (response.success) {
            this.createSuccessMessage = `Account created successfully! Username: ${response.data.username}. An email has been sent with login credentials.`;
            
            // Reload users list
            this.loadUsers();
            
            // Close modal after 3 seconds
            setTimeout(() => {
              this.closeCreateUserModal();
            }, 3000);
          } else {
            this.createErrorMessage = response.message || 'Failed to create user account';
          }
        },
        error: (err) => {
          this.creatingUser = false;
          console.error('Error creating user:', err);
          this.createErrorMessage = err.error?.message || 'Failed to create user account. Please try again.';
        }
      });
    }
  }

  // Bulk Import Methods
  openBulkImportModal(): void {
    this.showBulkImportModal = true;
    this.selectedFile = null;
    this.importResults = null;
  }

  closeBulkImportModal(): void {
    this.showBulkImportModal = false;
    this.selectedFile = null;
    this.importResults = null;
    this.isDragging = false;
  }

  downloadCSVTemplate(): void {
    const csvContent = 'student_number,first_name,last_name,email,grade_level,section,gender,date_of_birth\n' +
                      '2024001,Juan,Dela Cruz,juan.delacruz@example.com,7,Section A,Male,2010-01-15\n' +
                      '2024002,Maria,Santos,maria.santos@example.com,7,Section A,Female,2010-03-20\n' +
                      '2024003,Pedro,Reyes,pedro.reyes@example.com,8,Section B,Male,2009-05-10';
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'student_import_template.csv';
    link.click();
    window.URL.revokeObjectURL(url);
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    console.log('File selected:', file);
    if (file) {
      // Accept both text/csv and application/vnd.ms-excel
      if (file.type === 'text/csv' || file.type === 'application/vnd.ms-excel' || file.name.endsWith('.csv')) {
        this.selectedFile = file;
        this.importResults = null;
        console.log('File accepted:', file.name, file.type);
      } else {
        console.error('Invalid file type:', file.type);
        alert('Please select a valid CSV file');
      }
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    const files = event.dataTransfer?.files;
    console.log('Files dropped:', files);
    if (files && files.length > 0) {
      const file = files[0];
      console.log('Dropped file:', file.name, file.type);
      // Accept both text/csv and application/vnd.ms-excel
      if (file.type === 'text/csv' || file.type === 'application/vnd.ms-excel' || file.name.endsWith('.csv')) {
        this.selectedFile = file;
        this.importResults = null;
        console.log('File accepted from drop:', file.name);
      } else {
        console.error('Invalid file type from drop:', file.type);
        alert('Please drop a valid CSV file');
      }
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  uploadCSV(): void {
    if (!this.selectedFile) {
      alert('Please select a CSV file first');
      return;
    }

    console.log('Starting CSV upload:', this.selectedFile.name);
    this.importing = true;
    this.importResults = null;

    this.adminService.bulkImportStudents(this.selectedFile).subscribe({
      next: (response) => {
        console.log('Import response:', response);
        this.importing = false;
        if (response.success) {
          this.importResults = response;
          this.successMessage = response.message;
          
          // Refresh user list
          this.loadUsers();
          
          // Clear file selection if all successful
          if (response.error_count === 0) {
            setTimeout(() => {
              this.closeBulkImportModal();
            }, 3000);
          }
        } else {
          this.errorMessage = response.message || 'Import failed';
        }
      },
      error: (err) => {
        console.error('Import error:', err);
        this.importing = false;
        this.errorMessage = err.error?.message || 'Failed to import students. Please check your CSV file and try again.';
      }
    });
  }
}
