import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AssignmentValidationResult {
  success: boolean;
  message: string;
  data: {
    health_status: 'excellent' | 'warning' | 'needs_attention' | 'critical';
    statistics: {
      total_students: number;
      assigned_students: number;
      unassigned_students: number;
      students_with_section: number;
      students_without_section: number;
      assignment_percentage: number;
    };
    unassigned_students: any[];
    adviser_workload: any[];
    sections: any[];
    integrity_issues: any[];
    recommendations: any[];
  };
}

export interface AssignmentFixResult {
  success: boolean;
  message: string;
  data: {
    fixed_count: number;
    total_students: number;
    assigned_students: number;
    unassigned_students: number;
    errors: string[];
  };
}

@Injectable({
  providedIn: 'root'
})
export class StudentAssignmentService {

  constructor(private http: HttpClient) { }

  /**
   * Validate all student-adviser assignments
   * Returns detailed report of assignment status
   */
  validateAssignments(): Observable<AssignmentValidationResult> {
    return this.http.get<AssignmentValidationResult>(`${environment.apiUrl}/admin/validate-assignments`);
  }

  /**
   * Fix all student-adviser assignment issues
   * Automatically assigns unassigned students to appropriate advisers
   */
  fixAssignments(): Observable<AssignmentFixResult> {
    return this.http.post<AssignmentFixResult>(`${environment.apiUrl}/admin/fix-student-assignments`, {});
  }

  /**
   * Get assignment health status for dashboard widgets
   */
  getAssignmentHealth(): Observable<{success: boolean, health_status: string, assignment_percentage: number}> {
    return this.http.get<any>(`${environment.apiUrl}/admin/assignment-health`)
      .pipe(
        // Extract just the health info for quick dashboard display
        // Full validation can be done separately when needed
      );
  }

  /**
   * Check if assignments need attention (for admin notifications)
   */
  needsAttention(): Observable<boolean> {
    return new Observable(observer => {
      this.validateAssignments().subscribe({
        next: (result) => {
          const needsAttention = result.data.health_status !== 'excellent' || 
                               result.data.statistics.unassigned_students > 0;
          observer.next(needsAttention);
          observer.complete();
        },
        error: (err) => {
          observer.next(true); // Assume needs attention if we can't check
          observer.complete();
        }
      });
    });
  }

  /**
   * Get summary statistics for admin dashboard
   */
  getAssignmentSummary(): Observable<any> {
    return new Observable(observer => {
      this.validateAssignments().subscribe({
        next: (result) => {
          observer.next({
            total_students: result.data.statistics.total_students,
            assigned_students: result.data.statistics.assigned_students,
            unassigned_students: result.data.statistics.unassigned_students,
            assignment_percentage: result.data.statistics.assignment_percentage,
            health_status: result.data.health_status,
            needs_fix: result.data.statistics.unassigned_students > 0
          });
          observer.complete();
        },
        error: (err) => {
          observer.error(err);
        }
      });
    });
  }
}