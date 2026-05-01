import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { SHDFService } from '../shdf.service';

// Cross-field validators
function noneExclusivityValidator(noneKey: string, otherKeys: string[]) {
  return (group: AbstractControl): ValidationErrors | null => {
    if (!group.get(noneKey)?.value) return null;
    const hasOther = otherKeys.some(k => group.get(k)?.value);
    return hasOther ? { noneExclusivity: true } : null;
  };
}

function requiredIfValidator(conditionKey: string, conditionValue: string, targetKey: string) {
  return (group: AbstractControl): ValidationErrors | null => {
    if (group.get(conditionKey)?.value !== conditionValue) return null;
    const val = group.get(targetKey)?.value;
    return !val ? { [`${targetKey}Required`]: true } : null;
  };
}

function philhealthIdValidator() {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    // If empty, it's valid (optional field)
    if (!value || value.trim() === '') {
      return null;
    }
    // If has value, must be exactly 12 alphanumeric characters
    const pattern = /^[A-Za-z0-9]{12}$/;
    return pattern.test(value) ? null : { pattern: true };
  };
}

@Component({
  selector: 'app-shdf-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './shdf-form.component.html',
  styleUrls: ['./shdf-form.component.scss'],
})
export class SHDFFormComponent implements OnInit {
  @Input() studentId!: number;
  @Input() isModal: boolean = false;
  @Output() formSubmitted = new EventEmitter<void>();
  @Output() formCancelled = new EventEmitter<void>();

  form!: FormGroup;
  loading = false;
  submitted = false;
  errorMessage = '';
  successMessage = '';
  signatureFile: File | null = null;

  // Multi-step form state
  currentStep = 1;
  totalSteps = 6;

  steps = [
    { number: 1, title: 'Student Information', icon: '👤' },
    { number: 2, title: 'PhilHealth Information', icon: '🏥' },
    { number: 3, title: 'Immunization Records', icon: '💉' },
    { number: 4, title: 'Medical History', icon: '📋' },
    { number: 5, title: 'Family History', icon: '👨‍👩‍👧‍👦' },
    { number: 6, title: 'Parental Consent', icon: '✍️' }
  ];

  readonly vaccines = [
    { key: 'bcg', label: 'BCG (Tuberculosis Vaccine)' },
    { key: 'diphtheria_pertussis', label: 'Diphtheria Pertussis' },
    { key: 'oral_polio', label: 'Oral Polio Vaccine' },
    { key: 'mmr', label: 'Measles, Mumps, Rubella' },
    { key: 'chicken_pox', label: 'Chicken Pox Vaccine' },
    { key: 'hepatitis_b', label: 'Hepatitis B Vaccine' },
    { key: 'tetanus_toxoid', label: 'Tetanus Toxoid Vaccine' },
    { key: 'flu', label: 'Flu Vaccine' },
    { key: 'pneumococcal', label: 'Pneumococcal Vaccine' },
  ];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private shdService: SHDFService
  ) {}

  ngOnInit(): void {
    // Use Input studentId if provided (modal mode), otherwise get from route
    if (!this.studentId) {
      this.studentId = Number(this.route.snapshot.paramMap.get('studentId'));
    }
    this.buildForm();
    this.loadExisting();
  }

  get isFemale(): boolean {
    return this.form.get('student.gender')?.value === 'F';
  }

  get isGrade7(): boolean {
    return this.form.get('student.grade_level')?.value === 'Grade 7';
  }

  get dewormingIsHindi(): boolean {
    return this.form.get('consent.deworming_consent')?.value === 'hindi';
  }

  get emergencyRelationIsOther(): boolean {
    return this.form.get('student.emergency_contact_relation')?.value === 'other';
  }

  get pwdIsCongenital(): boolean {
    return this.form.get('medical.pwd_status')?.value === 'congenital';
  }

  private buildForm(): void {
    const vaccineControls: Record<string, any> = {};
    this.vaccines.forEach(v => (vaccineControls[v.key] = [null, Validators.required]));

    this.form = this.fb.group({
      student: this.fb.group(
        {
          student_id: [this.studentId],
          first_name: [{ value: '', disabled: true }],
          last_name: [{ value: '', disabled: true }],
          middle_name: [{ value: '', disabled: true }],
          student_number: [{ value: '', disabled: true }],
          grade_level: [{ value: '', disabled: true }],
          section: [{ value: '', disabled: true }],
          birth_date: [{ value: '', disabled: true }],
          address: ['', Validators.required],
          gender: [{ value: '', disabled: true }],
          parent_guardian_name: ['', Validators.required],
          emergency_contact: ['', Validators.required],
          emergency_contact_relation: ['', Validators.required],
          emergency_contact_relation_other: [''],
          emergency_contact_phone: ['', Validators.required],
        },
        {
          validators: [
            requiredIfValidator('emergency_contact_relation', 'other', 'emergency_contact_relation_other'),
          ],
        }
      ),

      philhealth: this.fb.group({
        learner_philhealth_id: ['', [Validators.required, philhealthIdValidator()]],
        parent_philhealth_id: ['', [Validators.required, philhealthIdValidator()]],
        parent_philhealth_name: ['', Validators.required],
        parent_relationship: ['', Validators.required],
      }),

      immunizations: this.fb.group(vaccineControls),

      medical: this.fb.group(
        {
          menarche_age: [''],
          menarche_age_other: [''],
          allergy_status: ['', Validators.required],
          condition_error_of_refraction: [false],
          condition_asthma: [false],
          condition_seizure_disorder: [false],
          condition_heart_problem: [false],
          condition_anemia: [false],
          condition_bleeding_disorder: [false],
          condition_diabetes: [false],
          condition_gastric_ulcer: [false],
          condition_anxiety_depression: [false],
          condition_g6pd: [false],
          condition_none: [false],
          condition_other_text: [''],
          medications_paracetamol: [false],
          medications_mefenamic: [false],
          medications_anti_allergy: [false],
          medications_anti_asthma: [false],
          medications_loperamide: [false],
          medications_antacids: [false],
          medications_or_solution: [false],
          medications_none: [false],
          medications_other_text: [''],
          pwd_status: [''],
          pwd_congenital_detail: [''],
          surgery_history: [false],
        },
        {
          validators: [
            noneExclusivityValidator('condition_none', [
              'condition_error_of_refraction', 'condition_asthma', 'condition_seizure_disorder',
              'condition_heart_problem', 'condition_anemia', 'condition_bleeding_disorder',
              'condition_diabetes', 'condition_gastric_ulcer', 'condition_anxiety_depression', 'condition_g6pd',
            ]),
            noneExclusivityValidator('medications_none', [
              'medications_paracetamol', 'medications_mefenamic', 'medications_anti_allergy',
              'medications_anti_asthma', 'medications_loperamide', 'medications_antacids', 'medications_or_solution',
            ]),
            requiredIfValidator('pwd_status', 'congenital', 'pwd_congenital_detail'),
          ],
        }
      ),

      family: this.fb.group(
        {
          condition_tuberculosis: [false],
          condition_cancer: [false],
          condition_stroke: [false],
          condition_hypertension: [false],
          condition_diabetes: [false],
          condition_pneumonia: [false],
          condition_gastric_ulcer: [false],
          condition_anxiety_depression: [false],
          condition_none: [false],
          condition_other_text: [''],
          smoke_exposure: ['', Validators.required],
          is_4ps_beneficiary: ['', Validators.required],
          is_sbfp_beneficiary: [false],
        },
        {
          validators: [
            noneExclusivityValidator('condition_none', [
              'condition_tuberculosis', 'condition_cancer', 'condition_stroke',
              'condition_hypertension', 'condition_diabetes', 'condition_pneumonia',
              'condition_gastric_ulcer', 'condition_anxiety_depression',
            ]),
          ],
        }
      ),

      consent: this.fb.group(
        {
          information_certified: [false, Validators.requiredTrue],
          deworming_consent: ['', Validators.required],
          deworming_refusal_reason: [''],
          deworming_refusal_other: [''],
          mrtd_consent: ['not_applicable'],
          wifa_consent: ['not_applicable'],
        },
        {
          validators: [
            requiredIfValidator('deworming_consent', 'hindi', 'deworming_refusal_reason'),
          ],
        }
      ),
    });

    // Add dynamic validators based on student gender and grade
    this.form.get('student.gender')?.valueChanges.subscribe(() => this.updateConditionalValidators());
    this.form.get('student.grade_level')?.valueChanges.subscribe(() => this.updateConditionalValidators());
  }

  private updateConditionalValidators(): void {
    const menarcheAge = this.form.get('medical.menarche_age');
    const mrtdConsent = this.form.get('consent.mrtd_consent');
    const wifaConsent = this.form.get('consent.wifa_consent');

    // Menarche age required for female students
    if (this.isFemale) {
      menarcheAge?.setValidators([Validators.required]);
    } else {
      menarcheAge?.clearValidators();
    }
    menarcheAge?.updateValueAndValidity({ emitEvent: false });

    // MRTD consent required for Grade 7
    if (this.isGrade7) {
      mrtdConsent?.setValidators([Validators.required]);
    } else {
      mrtdConsent?.clearValidators();
    }
    mrtdConsent?.updateValueAndValidity({ emitEvent: false });

    // WIFA consent required for female students
    if (this.isFemale) {
      wifaConsent?.setValidators([Validators.required]);
    } else {
      wifaConsent?.clearValidators();
    }
    wifaConsent?.updateValueAndValidity({ emitEvent: false });
  }

  private loadExisting(): void {
    if (!this.studentId) return;
    this.shdService.getShdf(this.studentId).subscribe({
      next: (record) => {
        if (record.student) {
          const studentData = { ...record.student };
          // Strip time portion from birth_date (e.g. "2004-10-03T16:00:00.000000Z" → "2004-10-03")
          if (studentData.birth_date) {
            studentData.birth_date = studentData.birth_date.split('T')[0];
          }
          this.form.get('student')?.patchValue(studentData);
        }
        if (record.philhealth) {
          this.form.get('philhealth')?.patchValue(record.philhealth);
        }
        if (record.immunization) {
          this.form.get('immunizations')?.patchValue(record.immunization);
        }
        if (record.medical_history) {
          this.form.get('medical')?.patchValue(record.medical_history);
        }
        if (record.family_history) {
          this.form.get('family')?.patchValue(record.family_history);
        }
        if (record.parental_consent) {
          this.form.get('consent')?.patchValue(record.parental_consent);
        }
      },
      error: () => {
        // No existing record — form stays blank (new submission)
      },
    });
  }

  onSignatureChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.signatureFile = input.files?.[0] ?? null;
  }

  onSubmit(): void {
    this.submitted = true;

    // Check signature file first
    if (!this.signatureFile) {
      this.errorMessage = 'Please upload your signature';
      this.scrollToTop();
      return;
    }

    // Validate the form
    if (this.form.invalid) {
      this.errorMessage = this.getErrorMessage();
      // Form validation errors (removed debug log)

      // Find which step has errors and navigate to it
      const errors = this.getFormValidationErrors();
      if (errors['student'] || Object.keys(errors).some(k => k.startsWith('student.'))) {
        this.currentStep = 1;
      } else if (errors['philhealth'] || Object.keys(errors).some(k => k.startsWith('philhealth.'))) {
        this.currentStep = 2;
      } else if (errors['immunizations'] || Object.keys(errors).some(k => k.startsWith('immunizations.'))) {
        this.currentStep = 3;
      } else if (errors['medical'] || Object.keys(errors).some(k => k.startsWith('medical.'))) {
        this.currentStep = 4;
      } else if (errors['family'] || Object.keys(errors).some(k => k.startsWith('family.'))) {
        this.currentStep = 5;
      } else if (errors['consent'] || Object.keys(errors).some(k => k.startsWith('consent.'))) {
        this.currentStep = 6;
      }

      this.scrollToTop();
      return;
    }

    const raw = this.form.getRawValue();
    const payload = new FormData();

    // Always include student_id first
    payload.append('student_id', String(this.studentId));

    // Flatten student fields (skip student_id as we already added it)
    Object.entries(raw.student).forEach(([k, v]) => {
      if (k !== 'student_id') {
        // Include all values, even empty strings and false
        payload.append(k, v === null || v === undefined ? '' : String(v));
      }
    });

    // PhilHealth
    Object.entries(raw.philhealth).forEach(([k, v]) => {
      payload.append(k, v === null || v === undefined ? '' : String(v));
    });

    // Immunizations
    Object.entries(raw.immunizations).forEach(([k, v]) => {
      payload.append(`immunizations[${k}]`, v === null || v === undefined ? '' : String(v));
    });

    // Medical history
    Object.entries(raw.medical).forEach(([k, v]) => {
      payload.append(k, v === null || v === undefined ? '' : String(v));
    });

    // Family history
    Object.entries(raw.family).forEach(([k, v]) => {
      payload.append(`family[${k}]`, v === null || v === undefined ? '' : String(v));
    });

    // Consent
    Object.entries(raw.consent).forEach(([k, v]) => {
      payload.append(k, v === null || v === undefined ? '' : String(v));
    });

    // Signature file
    payload.append('signature', this.signatureFile);

    this.loading = true;
    this.errorMessage = '';

    // Debug: payload contents removed for production

    // Use submitComprehensive for the comprehensive form
    this.shdService.submitComprehensive(payload).subscribe({
      next: (response: any) => {
        this.loading = false;
        this.successMessage = response.message || 'Health form submitted successfully.';

        if (this.isModal) {
          // Emit event for modal mode
          setTimeout(() => {
            this.formSubmitted.emit();
          }, 1500);
        } else {
          // Redirect for standalone mode
          setTimeout(() => {
            window.location.href = `/shdf/${this.studentId}/success?stage=comprehensive`;
          }, 2000);
        }
      },
        error: (err: any) => {
        this.loading = false;
        this.errorMessage = err?.error?.message ?? 'Submission failed. Please try again.';
        this.scrollToTop();
      },
    });
  }

  // Helper method to get form validation errors for debugging
  getFormValidationErrors(): any {
    const errors: any = {};
    Object.keys(this.form.controls).forEach(key => {
      const control = this.form.get(key);
      if (control && control.invalid) {
        errors[key] = control.errors;
        if (control instanceof FormGroup) {
          Object.keys((control as FormGroup).controls).forEach(subKey => {
            const subControl = control.get(subKey);
            if (subControl && subControl.invalid) {
              errors[`${key}.${subKey}`] = subControl.errors;
            }
          });
        }
      }
    });
    return errors;
  }

  // Helper method to get user-friendly error messages
  getErrorMessage(): string {
    const errors = this.getFormValidationErrors();
    const errorMessages: string[] = [];

    Object.keys(errors).forEach(key => {
      const error = errors[key];
      if (!error) return; // Skip if error is null/undefined

      if (error.required) {
        errorMessages.push(`${key} is required`);
      } else if (error.noneExclusivity) {
        errorMessages.push(`Cannot select "None" with other options in ${key}`);
      } else if (error.pattern) {
        errorMessages.push(`${key} has invalid format`);
      } else if (error.requiredTrue) {
        errorMessages.push(`${key} must be accepted`);
      } else {
        // Generic error message for other validation errors
        errorMessages.push(`${key} is invalid`);
      }
    });

    return errorMessages.length > 0
      ? errorMessages.join('; ')
      : 'Please fill in all required fields correctly';
  }

  onCancel(): void {
    if (this.isModal) {
      this.formCancelled.emit();
    }
  }

  // Step navigation methods
  nextStep(): void {
    if (this.currentStep < this.totalSteps) {
      // Validate current step before proceeding
      if (this.validateCurrentStep()) {
        this.currentStep++;
        this.scrollToTop();
      }
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.scrollToTop();
    }
  }

  goToStep(step: number): void {
    if (step >= 1 && step <= this.totalSteps) {
      // Only allow going back, not skipping forward past unvalidated steps
      if (step < this.currentStep) {
        this.currentStep = step;
        this.scrollToTop();
      }
    }
  }

  validateCurrentStep(): boolean {
    let isValid = true;
    this.errorMessage = '';

    if (this.currentStep === 1) {
      const studentGroup = this.form.get('student');
      if (studentGroup) {
        ['parent_guardian_name', 'emergency_contact', 'emergency_contact_relation', 'emergency_contact_phone', 'address'].forEach(field => {
          const control = studentGroup.get(field);
          if (control) {
            control.markAsTouched();
            control.markAsDirty();
            const val = control.value;
            if (control.invalid || !val || (typeof val === 'string' && val.trim() === '')) {
              isValid = false;
            }
          }
        });
      }
    } else if (this.currentStep === 2) {
      const philhealth = this.form.get('philhealth');
      if (philhealth) {
        ['learner_philhealth_id', 'parent_philhealth_id', 'parent_philhealth_name', 'parent_relationship'].forEach(field => {
          const control = philhealth.get(field);
          if (control) {
            control.markAsTouched();
            control.markAsDirty();
            const val = control.value;
            if (control.invalid || !val || (typeof val === 'string' && val.trim() === '')) {
              isValid = false;
            }
          }
        });
      }
    } else if (this.currentStep === 3) {
      const immunizationsGroup = this.form.get('immunizations') as FormGroup;
      if (immunizationsGroup && immunizationsGroup.invalid) {
        Object.keys(immunizationsGroup.controls).forEach(key => {
          const control = immunizationsGroup.get(key);
          if (control && control.invalid) {
            control.markAsTouched();
            isValid = false;
          }
        });
      }
    } else if (this.currentStep === 4) {
      const medical = this.form.get('medical');
      if (medical?.get('allergy_status')?.invalid) {
        medical.get('allergy_status')?.markAsTouched();
        isValid = false;
      }
      if (this.isFemale && medical?.get('menarche_age')?.invalid) {
        medical.get('menarche_age')?.markAsTouched();
        isValid = false;
      }
    } else if (this.currentStep === 5) {
      const family = this.form.get('family');
      if (family) {
        ['smoke_exposure', 'is_4ps_beneficiary'].forEach(field => {
          const control = family.get(field);
          if (control && control.invalid) {
            control.markAsTouched();
            isValid = false;
          }
        });
      }
    } else if (this.currentStep === 6) {
      const consent = this.form.get('consent');
      if (consent) {
        ['information_certified', 'deworming_consent'].forEach(field => {
          const control = consent.get(field);
          if (control && control.invalid) {
            control.markAsTouched();
            isValid = false;
          }
        });
        if (this.isGrade7 && consent.get('mrtd_consent')?.invalid) {
          consent.get('mrtd_consent')?.markAsTouched();
          isValid = false;
        }
        if (this.isFemale && consent.get('wifa_consent')?.invalid) {
          consent.get('wifa_consent')?.markAsTouched();
          isValid = false;
        }
      }
      if (!this.signatureFile) {
        this.errorMessage = 'Please upload your signature';
        isValid = false;
      }
    }

    if (!isValid && !this.errorMessage) {
      this.errorMessage = 'Please fill in all required fields';
    }

    if (!isValid) {
      setTimeout(() => this.errorMessage = '', 5000);
    }

    return isValid;
  }

  scrollToTop(): void {
    const modalBody = document.querySelector('.modal-body');
    if (modalBody) {
      modalBody.scrollTop = 0;
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  getProgressPercentage(): number {
    return (this.currentStep / this.totalSteps) * 100;
  }
}
