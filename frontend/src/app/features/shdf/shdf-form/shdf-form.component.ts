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
          address: [{ value: '', disabled: true }],
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
        learner_philhealth_id: ['', [Validators.pattern(/^[A-Za-z0-9]{12}$/)]],
        parent_philhealth_id: ['', [Validators.pattern(/^[A-Za-z0-9]{12}$/)]],
        parent_philhealth_name: [''],
        parent_relationship: [''],
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
          smoke_exposure: [false],
          is_4ps_beneficiary: [false],
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
          this.form.get('student')?.patchValue(record.student);
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
    if (this.form.invalid || !this.signatureFile) {
      return;
    }

    const raw = this.form.getRawValue();
    const payload = new FormData();

    // Flatten student fields
    Object.entries(raw.student).forEach(([k, v]) => payload.append(k, String(v ?? '')));

    // PhilHealth
    Object.entries(raw.philhealth).forEach(([k, v]) => payload.append(k, String(v ?? '')));

    // Immunizations
    Object.entries(raw.immunizations).forEach(([k, v]) =>
      payload.append(`immunizations[${k}]`, String(v ?? ''))
    );

    // Medical history
    Object.entries(raw.medical).forEach(([k, v]) => payload.append(k, String(v ?? '')));

    // Family history
    Object.entries(raw.family).forEach(([k, v]) =>
      payload.append(`family[${k}]`, String(v ?? ''))
    );

    // Consent
    Object.entries(raw.consent).forEach(([k, v]) => payload.append(k, String(v ?? '')));

    // Signature file
    payload.append('signature', this.signatureFile);

    this.loading = true;
    this.errorMessage = '';
    
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
        console.error('Submission error:', err);
      },
    });
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
      this.currentStep = step;
      this.scrollToTop();
    }
  }

  validateCurrentStep(): boolean {
    let isValid = true;
    
    switch (this.currentStep) {
      case 1: // Student Information
        const studentGroup = this.form.get('student');
        if (studentGroup) {
          ['parent_guardian_name', 'emergency_contact', 'emergency_contact_relation', 'emergency_contact_phone'].forEach(field => {
            const control = studentGroup.get(field);
            if (control && control.invalid) {
              control.markAsTouched();
              isValid = false;
            }
          });
        }
        break;
      
      case 3: // Immunizations
        const immunizations = this.form.get('immunizations') as FormArray;
        if (immunizations && immunizations.invalid) {
          Object.keys(immunizations.controls).forEach(key => {
            immunizations.get(key)?.markAsTouched();
          });
          isValid = false;
        }
        break;
      
      case 4: // Medical History
        const medical = this.form.get('medical');
        if (medical?.get('allergy_status')?.invalid) {
          medical.get('allergy_status')?.markAsTouched();
          isValid = false;
        }
        break;
      
      case 6: // Parental Consent
        const consent = this.form.get('consent');
        if (consent) {
          ['information_certified', 'deworming_consent'].forEach(field => {
            const control = consent.get(field);
            if (control && control.invalid) {
              control.markAsTouched();
              isValid = false;
            }
          });
        }
        if (!this.signatureFile) {
          this.errorMessage = 'Please upload your signature';
          isValid = false;
        }
        break;
    }
    
    if (!isValid) {
      this.errorMessage = 'Please fill in all required fields';
      setTimeout(() => this.errorMessage = '', 3000);
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
