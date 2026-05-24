import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminService } from '../../../../core/services/admin.service';
import { AuthService } from '../../../../core/services/auth.service';
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
  createErrorMessages: string[] = [];   // all error messages for the popup list
  createFieldErrors: Record<string, string> = {};  // field → first error message
  showErrorModal = false;

  showCreateError(errorsObj: Record<string, string[]> | null, fallbackMessage?: string): void {
    this.createFieldErrors = {};
    this.createErrorMessages = [];

    if (errorsObj && typeof errorsObj === 'object' && Object.keys(errorsObj).length > 0) {
      for (const [field, msgs] of Object.entries(errorsObj)) {
        const msg = Array.isArray(msgs) ? msgs[0] : String(msgs);
        this.createFieldErrors[field] = msg;
        this.createErrorMessages.push(msg);
      }
    } else if (fallbackMessage) {
      this.createErrorMessages = [fallbackMessage];
    }

    this.createErrorMessage = this.createErrorMessages.join(' | ');
    this.showErrorModal = true;
  }

  closeErrorModal(): void {
    this.showErrorModal = false;
  }

  hasFieldError(field: string): boolean {
    return !!this.createFieldErrors[field];
  }

  getFieldError(field: string): string {
    return this.createFieldErrors[field] || '';
  }

  private parseApiErrors(err: any): Record<string, string[]> | null {
    const errors = err.error?.errors;
    if (!errors) return null;

    // Backend now returns toArray() — an object like { email: ['msg'], staff_code: ['msg'] }
    if (typeof errors === 'object' && !Array.isArray(errors)) {
      return errors as Record<string, string[]>;
    }
    // Fallback: plain string message
    if (typeof errors === 'string') {
      try {
        const parsed = JSON.parse(errors);
        if (typeof parsed === 'object') return parsed;
      } catch { /* not JSON */ }
      return { _general: [errors] };
    }
    return null;
  }
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
    employee_id: '',
    // Clinic Staff fields
    staff_code: '',
    position: ''
  };

  // Available sections for selected grade level
  availableSections: any[] = [];
  loadingSections = false;

  // Available grade levels
  gradeLevels: any[] = [];
  loadingGradeLevels = false;

  // Debug properties
  userCounts = {
    students: 0,
    advisers: 0,
    clinicStaff: 0,
    admins: 0
  };

  // Pagination
  currentPage = 1;
  pageSize = 10;

  get totalPages(): number {
    return Math.ceil(this.filteredUsers.length / this.pageSize);
  }

  get paginatedUsers(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredUsers.slice(start, start + this.pageSize);
  }

  get pageNumbers(): number[] {
    const pages: number[] = [];
    const total = this.totalPages;
    const current = this.currentPage;
    const delta = 2;
    for (let i = Math.max(1, current - delta); i <= Math.min(total, current + delta); i++) {
      pages.push(i);
    }
    return pages;
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
  }

  // Bulk Import properties
  showBulkImportModal = false;
  selectedFile: File | null = null;
  importing = false;
  isDragging = false;
  importResults: any = null;

  constructor(private adminService: AdminService, public authService: AuthService, private router: Router) {}

  // Make localStorage accessible in template
  get localStorage() {
    return localStorage;
  }

  // Debug methods
  debugReload(): void {
    // Force reloading users
    this.users = [];
    this.filteredUsers = [];
    this.userCounts = { students: 0, advisers: 0, clinicStaff: 0, admins: 0 };
    this.loadUsers();
  }

  debugAuth(): void {
    // Testing authentication
    const token = localStorage.getItem('token');
    const user = this.authService.currentUserValue;
    // Token and user retrieved for auth test

    if (token) {
      // Test auth endpoint first
      this.adminService.testAuth().subscribe({
        next: (response) => {
          // Auth test successful

          // Now test getAllUsers directly
          this.adminService.getAllUsers().subscribe({
            next: (usersResponse) => {
              // getAllUsers test successful
              alert('Authentication and API test successful!\n\n' +
                'Auth User: ' + (response.user?.username || 'Unknown') + '\n' +
                'Auth Role: ' + (response.user?.role || 'Unknown') + '\n\n' +
                'Users API Success: ' + (usersResponse.success ? 'Yes' : 'No') + '\n' +
                'Users Data Present: ' + (usersResponse.data ? 'Yes' : 'No') + '\n' +
                'Users.users Present: ' + (usersResponse.data?.users ? 'Yes' : 'No') + '\n' +
                'Response Keys: ' + Object.keys(usersResponse).join(', '));
            },
            error: (usersErr) => {
              // getAllUsers test failed
              alert('Authentication successful but getAllUsers failed!\n\n' +
                'Auth User: ' + (response.user?.username || 'Unknown') + '\n' +
                'Users API Error: ' + (usersErr.error?.message || usersErr.message || 'Unknown error'));
            }
          });
        },
          error: (err) => {
            // Auth test failed
            alert('Authentication test failed!\n\nError: ' + (err.error?.message || err.message || 'Unknown error') + '\n\nPlease login again.');
          }
      });
    } else {
      alert('No authentication token found. Please login again.');
    }
  }

  debugClearAndRelogin(): void {
    if (confirm('This will clear all authentication data and redirect to login. Continue?')) {
      localStorage.removeItem('currentUser');
      localStorage.removeItem('token');
      localStorage.removeItem('tokenExpiry');
      // Cleared all auth data
      alert('Authentication data cleared. Redirecting to login...');
      this.router.navigate(['/login']);
    }
  }

  ngOnInit(): void {
    // Enhanced authentication check
    if (!this.authService.checkAuthenticationStatus()) {
      this.errorMessage = 'Please login as admin to access this page';
      this.router.navigate(['/login']);
      return;
    }

    const currentUser = this.authService.currentUserValue;
    const token = localStorage.getItem('token');

    // Authentication verified for manage-users

    if (currentUser?.role_name?.toLowerCase() !== 'admin') {
      this.errorMessage = 'Access denied. Admin privileges required.';
      return;
    }

    if (!token) {
      // No authentication token found
      this.errorMessage = 'Authentication token missing. Please login again.';
      this.router.navigate(['/login']);
      return;
    }

    // Authenticated as admin, loading users
    this.loadGradeLevels();

    // Auto-refresh users every 30 seconds (startWith(0) handles initial load)
    interval(this.refreshInterval)
      .pipe(
        startWith(0),
        switchMap(() => this.adminService.getAllUsers()),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response) => {
          if (response?.success) {
            this.updateUsersList(response);
          }
        },
        error: (err) => {
          // Auto-refresh error
          if (err.status === 401) {
            this.errorMessage = 'Session expired. Please login again.';
            this.router.navigate(['/login']);
          }
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadUsers(): void {
    this.loading = true;
    // Loading users for manage-users component

    // Check authentication first
    const currentUser = this.authService.currentUserValue;
    const token = localStorage.getItem('token');
    // Current user and token checked

    if (!currentUser || !token) {
      this.errorMessage = 'Authentication required. Please login again.';
      this.loading = false;
      this.router.navigate(['/login']);
      return;
    }

    // Load users directly
    this.adminService.getAllUsers().subscribe({
      next: (response) => {
        // getAllUsers response received
        if (response?.success) {
          this.updateUsersList(response);
        } else {
          this.errorMessage = response?.message || 'Failed to load users';
        }
        this.loading = false;
      },
      error: (err) => {
        // Error loading users
        if (err.status === 401) {
          this.errorMessage = 'Authentication failed. Please login again.';
          this.router.navigate(['/login']);
        } else if (err.status === 403) {
          this.errorMessage = 'Access denied. Admin privileges required.';
        } else {
          this.errorMessage = 'Failed to load users. Please try again.';
        }

        this.loading = false;
      }
    });
  }

  private updateUsersList(response: any): void {
    // updateUsersList called
    if (response.success) {

      let users: any;

      // Handle different response formats
      if (response.data && response.data.users) {
        // Using response.data.users format
        users = response.data.users;
      } else if (response.users) {
        // Using response.users format
        users = response.users;
      } else {
        // No users data found in response structure
        this.errorMessage = 'Invalid response structure from server';
        return;
      }

      // Handle grouped response (when no role filter)
      if (!Array.isArray(users) && typeof users === 'object' && users !== null &&
          ('student' in users || 'adviser' in users || 'clinic_staff' in users || 'admin' in users)) {
        // Detected grouped response format

        this.users = [
          ...(users.student || []).map((u: any) => ({
            ...u,
            roleDisplay: 'Student',
            role: 'student'
          })),
          ...(users.adviser || []).map((u: any) => ({
            ...u,
            roleDisplay: 'Faculty/Adviser',
            role: 'adviser'
          })),
          ...(users.clinic_staff || []).map((u: any) => ({
            ...u,
            roleDisplay: 'Clinic Staff',
            role: 'clinic_staff'
          })),
          ...(users.admin || []).map((u: any) => ({
            ...u,
            roleDisplay: 'Admin',
            role: 'admin'
          }))
        ];

        // Mapped users array
      } else if (Array.isArray(users)) {
        // Detected flat array response format
        // Handle flat response (when role filter is applied or direct array)
        this.users = users.map((u: any) => ({
          ...u,
          roleDisplay: this.formatRoleName(u.role_name || 'Unknown'),
          role: u.role_name?.toLowerCase() || 'unknown'
        }));
        // Mapped flat users array
      } else {
        // Unexpected users data structure
        this.errorMessage = 'Unexpected data format from server';
        return;
      }

      this.filterUsers();

      // Update counts
      this.userCounts = {
        students: this.users.filter(u => u.role === 'student').length,
        advisers: this.users.filter(u => u.role === 'adviser').length,
        clinicStaff: this.users.filter(u => u.role === 'clinic_staff').length,
        admins: this.users.filter(u => u.role === 'admin').length
      };
    } else {
      // Response indicates failure
      this.errorMessage = response?.message || 'API request failed';
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
        (user.full_name && user.full_name.toLowerCase().includes(this.searchQuery.toLowerCase())) ||
        (user.username && user.username.toLowerCase().includes(this.searchQuery.toLowerCase())) ||
        (user.email && user.email.toLowerCase().includes(this.searchQuery.toLowerCase()));

      // Adviser grade filter — match via grade_level field OR via gradeLevels sections data
      let matchesGradeLevel = true;
      if (this.adviserFilterGrade && userRole === 'adviser') {
        // Primary: match by grade_level field on user
        const byField = String(user.grade_level || '') === String(this.adviserFilterGrade);

        // Fallback: check if this user's user_id appears as adviser_id in any section of the selected grade
        const gradeObj = this.gradeLevels.find(g => g.level_name === this.adviserFilterGrade);
        const bySection = gradeObj?.sections?.some((s: any) => s.adviser_id === user.user_id) ?? false;

        matchesGradeLevel = byField || bySection;
      }

      const matchesSection = !this.adviserFilterSection ||
        String(user.section || '').toLowerCase() === String(this.adviserFilterSection).toLowerCase();

      return matchesRole && matchesSearch && matchesGradeLevel && matchesSection;
    });
    this.currentPage = 1;
  }

  onRoleChange(): void {
    this.filterUsers();
  }

  onSearchChange(): void {
    this.filterUsers();
  }

  selectRole(role: string): void {
    this.selectedRole = role;
    this.searchQuery = '';
    this.adviserFilterGrade = '';
    this.adviserFilterSection = '';
    this.filterUsers();
  }

  backToRoleCards(): void {
    this.selectedRole = 'all';
    this.searchQuery = '';
    this.adviserFilterGrade = '';
    this.adviserFilterSection = '';
    this.filterUsers();
  }

  /** Single back handler — context-aware */
  handleBack(): void {
    if (this.selectedRole === 'adviser' && this.adviserFilterGrade) {
      // Step back from section table → grade cards
      this.adviserFilterGrade = '';
      this.adviserFilterSection = '';
      this.searchQuery = '';
    } else {
      this.backToRoleCards();
    }
  }

  selectAdviserGrade(grade: string): void {
    this.adviserFilterGrade = grade;
    this.adviserFilterSection = '';
    this.searchQuery = '';
    this.filterUsers();
  }

  selectAdviserSection(section: string): void {
    this.adviserFilterSection = section;
    this.searchQuery = '';
    this.filterUsers();
  }

  getPageTitle(): string {
    if (this.selectedRole === 'all') return 'Manage Users';
    if (this.selectedRole === 'adviser') {
      if (!this.adviserFilterGrade) return 'Faculty / Advisers';
      return this.adviserFilterGrade + ' Sections';
    }
    return this.getRoleLabel(this.selectedRole);
  }

  getPageSubtitle(): string {
    if (this.selectedRole === 'all') return 'View, edit, and manage all system users';
    if (this.selectedRole === 'adviser') {
      if (!this.adviserFilterGrade) return 'Select a grade level to view sections and advisers';
      return 'Sections and assigned advisers for ' + this.adviserFilterGrade;
    }
    return 'Manage ' + this.getRoleLabel(this.selectedRole) + ' accounts';
  }

  getRoleLabel(role: string): string {
    const labels: Record<string, string> = {
      student: 'Students',
      adviser: 'Faculty / Advisers',
      clinic_staff: 'Clinic Staff',
      admin: 'Admins'
    };
    return labels[role] || role;
  }

  getActiveCount(role: string): number {
    return this.users.filter(u => u.role === role && u.is_active).length;
  }

  // Adviser filters
  adviserFilterGrade = '';
  adviserFilterSection = '';

  get adviserGradeLevels(): string[] {
    return [...new Set(
      this.users
        .filter(u => u.role === 'adviser' && u.grade_level)
        .map(u => String(u.grade_level))
    )].sort();
  }

  get adviserSections(): string[] {
    return [...new Set(
      this.users
        .filter(u => u.role === 'adviser' && u.section &&
          (!this.adviserFilterGrade || String(u.grade_level) === String(this.adviserFilterGrade)))
        .map(u => String(u.section))
    )].sort();
  }

  getAdviserCountForGrade(grade: string): number {
    if (grade === '__unassigned__') {
      return this.users.filter(u => u.role === 'adviser' && !u.grade_level).length;
    }
    return this.users.filter(u => u.role === 'adviser' && String(u.grade_level) === grade).length;
  }

  getAdviserSectionCountForGrade(grade: string): number {
    return [...new Set(
      this.users
        .filter(u => u.role === 'adviser' && String(u.grade_level) === grade && u.section)
        .map(u => String(u.section))
    )].length;
  }

  /** Count sections that have an adviser assigned for a grade level */
  getAssignedAdviserCount(grade: any): number {
    return (grade.sections || []).filter((s: any) => s.adviser_id != null).length;
  }

  /** Sections with adviser info for the selected grade level (for the table view) */
  get adviserSectionRows(): any[] {
    if (!this.adviserFilterGrade) return [];
    const grade = this.gradeLevels.find(g => g.level_name === this.adviserFilterGrade);
    if (!grade?.sections) return [];
    return grade.sections.map((s: any, i: number) => ({
      index: i + 1,
      section_id: s.id,
      section_name: s.section_name,
      adviser_name: s.adviser_name || '—',
      adviser_user_id: s.adviser_id ?? null,
      capacity: s.capacity,
      current_enrollment: s.current_enrollment ?? 0
    }));
  }

  /** Find a user object by user_id to open the modal */
  viewAdviserByUserId(userId: number): void {
    const user = this.users.find(u => u.user_id === userId);
    if (user) this.viewUser(user);
  }

  onAdviserFilterChange(): void {
    this.filterUsers();
  }

  onAdviserGradeChange(): void {
    this.adviserFilterSection = '';
    this.filterUsers();
  }

  viewUser(user: any): void {
    // Viewing user
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
    this.showErrorModal = false;
    // Reload grade levels if not yet loaded
    if (this.gradeLevels.length === 0) {
      this.loadGradeLevels();
    }
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
      employee_id: '',
      staff_code: '',
      position: ''
    };
    this.availableSections = [];
    this.createFieldErrors = {};
    this.createErrorMessages = [];
    this.createErrorMessage = '';
    this.showErrorModal = false;
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
    this.newUser.section_id = '';
    this.newUser.employee_id = '';
    this.newUser.staff_code = '';
    this.newUser.position = '';
    this.newUser.full_name = '';
    this.availableSections = [];
  }

  onGradeLevelChange(): void {
    this.newUser.section_id = '';
    this.loadingSections = false;

    if ((this.newUser.role === 'student' || this.newUser.role === 'adviser') && this.newUser.grade_level) {
      const selectedId = Number(this.newUser.grade_level);
      const selectedGrade = this.gradeLevels.find(g => Number(g.id) === selectedId);
      this.availableSections = selectedGrade?.sections ?? [];
    } else {
      this.availableSections = [];
    }
  }

  loadSectionsForGrade(gradeLevelId: number): void {
    const selectedGrade = this.gradeLevels.find(g => Number(g.id) === gradeLevelId);
    this.availableSections = selectedGrade?.sections ?? [];
  }

  loadGradeLevels(): void {
    this.loadingGradeLevels = true;
    this.adminService.getGradeLevelsWithSections().subscribe({
      next: (response) => {
        this.loadingGradeLevels = false;
        if (response.success && response.data) {
          this.gradeLevels = response.data;
        } else {
          this.gradeLevels = [];
        }
      },
      error: (err) => {
        this.loadingGradeLevels = false;
        this.gradeLevels = [];
        // Error loading grade levels
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
    if (!this.newUser.role) return false;

    // Role-specific validation
    if (this.newUser.role === 'student') {
      const validStudentNumber = /^13\d{10}$/.test(this.newUser.student_number);
      return !!(
        validStudentNumber &&
        this.newUser.first_name &&
        this.newUser.last_name &&
        this.newUser.gender &&
        this.newUser.birth_date &&
        this.newUser.grade_level &&
        this.newUser.section_id
      );
    } else if (this.newUser.role === 'adviser') {
      return !!(
        this.newUser.employee_id &&
        this.newUser.first_name &&
        this.newUser.last_name
      );
    } else if (this.newUser.role === 'clinic_staff') {
      return !!(
        this.newUser.full_name &&
        this.newUser.staff_code &&
        this.newUser.staff_code.trim().length <= 20 &&
        this.newUser.position
      );
    }

    return false;
  }

  createUser(): void {
    if (!this.isCreateFormValid()) {
      this.showCreateError(null, 'Please fill in all required fields');
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
      // Sending student payload
      this.adminService.createUser(this.newUser).subscribe({
        next: (response) => {
          this.creatingUser = false;
          if (response.success && response.data) {
            const userData = response.data;
            this.createSuccessMessage = `Student account created successfully! Username: ${userData.username || 'N/A'}. An email has been sent with login credentials.`;
            this.loadUsers();
            setTimeout(() => { this.closeCreateUserModal(); }, 5000);
          } else {
            this.showCreateError(null, response.message || 'Failed to create student account');
          }
        },
        error: (err) => {
          this.creatingUser = false;
          this.showCreateError(this.parseApiErrors(err), 'Failed to create student account.');
        }
      });
    } else {
      // For other roles, use Laravel endpoint
      // Build a clean payload with only relevant fields
      const payload: any = {
        role: this.newUser.role,
        full_name: this.newUser.full_name?.trim() || '',
        email: this.newUser.email?.trim() || null,
        phone: this.newUser.phone?.trim() || null,
      };

      if (this.newUser.role === 'clinic_staff') {
        payload.staff_code = this.newUser.staff_code?.trim();
        payload.position   = this.newUser.position?.trim();
      } else if (this.newUser.role === 'adviser') {
        payload.employee_id = this.newUser.employee_id?.trim();
      }

      this.adminService.createUserLegacy(payload).subscribe({
        next: (response) => {
          this.creatingUser = false;
          if (response.success && response.data) {
            const user = response.data.user || response.data;
            this.createSuccessMessage = `Account created successfully! Username: ${user.username || 'N/A'}, Temp Password: ${user.temp_password || 'N/A'}`;

            // Reload users list
            this.loadUsers();

            // Close modal after 3 seconds
            setTimeout(() => {
              this.closeCreateUserModal();
            }, 3000);
          } else {
            this.showCreateError(null, response.message || 'Failed to create user account');
          }
        },
        error: (err) => {
            this.creatingUser = false;
            this.showCreateError(this.parseApiErrors(err), 'Failed to create user account. Please try again.');
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
    const csvContent = 'student_number,first_name,middle_name,last_name,birth_date,gender,grade_level,section_name,email,phone,emergency_contact_name,emergency_contact_phone\n' +
                      '2024001,Juan,,Dela Cruz,2010-01-15,M,Grade 7,Genesis,juan.delacruz@email.com,09171234567,Maria Dela Cruz,09181234567\n' +
                      '2024002,Maria,Santos,Reyes,2010-03-20,F,Grade 7,Isaiah,maria.reyes@email.com,09171234568,Pedro Reyes,09181234568\n' +
                      '2024003,Pedro,,Santos,2009-05-10,M,Grade 8,Charity,,,Jose Santos,09181234569';

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
    // File selected
    if (file) {
      // Accept both text/csv and application/vnd.ms-excel
      if (file.type === 'text/csv' || file.type === 'application/vnd.ms-excel' || file.name.endsWith('.csv')) {
        this.selectedFile = file;
        this.importResults = null;
      } else {
        // Invalid file type
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
    // Files dropped
    if (files && files.length > 0) {
      const file = files[0];
      // Dropped file
      // Accept both text/csv and application/vnd.ms-excel
      if (file.type === 'text/csv' || file.type === 'application/vnd.ms-excel' || file.name.endsWith('.csv')) {
        this.selectedFile = file;
        this.importResults = null;
        // File accepted from drop
      } else {
        // Invalid file type from drop
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

    // Starting CSV upload
    this.importing = true;
    this.importResults = null;

    this.adminService.bulkImportStudents(this.selectedFile).subscribe({
        next: (response) => {
        // Import response received
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
        // Import error
        this.importing = false;
        this.errorMessage = err.error?.message || 'Failed to import students. Please check your CSV file and try again.';
      }
    });
  }
}
