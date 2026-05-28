import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SHDFService } from '../shdf.service';

@Component({
  selector: 'app-shdf-basic',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './shdf-basic.component.html',
  styleUrls: ['./shdf-basic.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class SHDFBasicComponent implements OnInit {
  form!: FormGroup;
  studentId!: number;
  loading = false;
  submitted = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private shdService: SHDFService
  ) {}

  goToDashboard(): void {
    this.router.navigate(['/dashboard/student']);
  }

  ngOnInit(): void {
    this.studentId = Number(this.route.snapshot.paramMap.get('studentId'));
    this.buildForm();
    this.checkStatusAndLoadData();
  }

  private checkStatusAndLoadData(): void {
    // Check if basic info is already completed
    this.shdService.getStatus(this.studentId).subscribe({
      next: (status) => {
        // Status check received
        if (status.basic_completed) {
          // Already completed - redirect to success page
          this.router.navigate(['/shdf', this.studentId, 'success'], {
            queryParams: {
              stage: 'basic',
              deadline: status.comprehensive_deadline,
              returning: true
            }
          });
        } else {
          // Basic not completed, loading existing data
          // Not completed - load existing data if any
          this.loadExistingData();
        }
      },
      error: (err) => {
        // Status check failed
        // No status found - load existing data if any
        this.loadExistingData();
      }
    });
  }

  private buildForm(): void {
    this.form = this.fb.group({
      student_id: [this.studentId],
      parent_guardian_name: ['', Validators.required],
      emergency_contact: ['', Validators.required],
      emergency_contact_relation: ['', Validators.required],
      emergency_contact_phone: ['', Validators.required],
      address: ['', Validators.required],
      height_cm: ['', [Validators.min(0)]],
      weight_kg: ['', [Validators.min(0)]],
      blood_type: [''],
    });
  }

  private loadExistingData(): void {
    this.shdService.getShdf(this.studentId).subscribe({
      next: (record) => {
        if (record.student) {
          this.form.patchValue({
            parent_guardian_name: record.student.parent_guardian_name,
            emergency_contact: record.student.emergency_contact,
            emergency_contact_relation: record.student.emergency_contact_relation,
            emergency_contact_phone: record.student.emergency_contact_phone,
            address: record.student.address || '',
            height_cm: record.student.height_cm,
            weight_kg: record.student.weight_kg,
            blood_type: record.student.blood_type,
          });
        }
      },
      error: () => {
        // No existing data - form stays blank
      }
    });
  }

  onSubmit(): void {
    this.submitted = true;
    if (this.form.invalid) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.shdService.submitBasic(this.form.value).subscribe({
      next: (response) => {
        this.loading = false;
        this.successMessage = response.message || 'Basic information saved successfully!';

        // Show success message with options
        setTimeout(() => {
          this.router.navigate(['/shdf', this.studentId, 'success'], {
            queryParams: {
              stage: 'basic',
              deadline: response.comprehensive_deadline
            }
          });
        }, 1500);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err?.error?.message || 'Submission failed. Please try again.';
      }
    });
  }

  onCompleteFullForm(): void {
    this.submitted = true;
    if (this.form.invalid) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    // Save basic info first, then redirect to comprehensive form
    this.shdService.submitBasic(this.form.value).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/shdf', this.studentId, 'comprehensive']);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err?.error?.message || 'Submission failed. Please try again.';
      }
    });
  }
}
