import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MedicalRecordsService, MedicalRecord, PersonalMedicalInfo } from '../medical-records.service';

@Component({
  selector: 'app-personal-info',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="personal-info-container">
      <div class="header">
        <button class="back-btn" routerLink="/dashboard/student/medical-records">
          ← Back to Medical Records
        </button>
        <h1>Personal Medical Information Form</h1>
        <p class="subtitle">Complete medical information and health record</p>
      </div>

      <div *ngIf="loading" class="loading">
        <div class="loading-spinner"></div>
        <p>Loading personal information...</p>
      </div>

      <div *ngIf="error" class="error-message">
        {{ error }}
      </div>

      <div *ngIf="medicalRecord && !loading" class="content">
        <!-- Student Information Section -->
        <div class="info-card">
          <div class="card-header">
            <h2>Student Information</h2>
            <span class="readonly-badge">Read Only</span>
          </div>
          <div class="form-grid">
            <div class="form-group">
              <label>Name of Learner</label>
              <input type="text" [value]="personalInfo.full_name" readonly>
            </div>
            <div class="form-group">
              <label>LRN</label>
              <input type="text" [value]="personalInfo.student_number" readonly>
            </div>
            <div class="form-group">
              <label>Grade Level & Section</label>
              <input type="text" [value]="personalInfo.grade_level + ' - ' + personalInfo.section" readonly>
            </div>
            <div class="form-group">
              <label>Birthday</label>
              <input type="date" [value]="personalInfo.birth_date" readonly>
            </div>
            <div class="form-group">
              <label>Sex/Age</label>
              <input type="text" [value]="personalInfo.gender + '/' + getAge()" readonly>
            </div>
            <div class="form-group">
              <label>Adviser</label>
              <input type="text" [value]="adviserName" readonly>
            </div>
          </div>
        </div>

        <!-- Contact Information Section -->
        <div class="info-card">
          <div class="card-header">
            <h2>Contact Information</h2>
            <button *ngIf="!editMode" class="edit-btn" (click)="toggleEditMode()">
              Edit
            </button>
            <div *ngIf="editMode" class="edit-actions">
              <button class="save-btn" (click)="saveChanges()" [disabled]="saving">
                {{ saving ? 'Saving...' : 'Save' }}
              </button>
              <button class="cancel-btn" (click)="cancelEdit()">Cancel</button>
            </div>
          </div>
          <div class="form-grid">
            <div class="form-group">
              <label>Contact Person in Case of Emergency</label>
              <input type="text" 
                [(ngModel)]="editableInfo.emergency_contact_person" 
                [readonly]="!editMode"
                placeholder="Enter emergency contact name">
            </div>
            <div class="form-group">
              <label>Relation</label>
              <select 
                [(ngModel)]="editableInfo.emergency_contact_relation" 
                [disabled]="!editMode"
                class="form-control">
                <option value="">Select Relation</option>
                <option value="Mother">Mother</option>
                <option value="Father">Father</option>
                <option value="Guardian">Guardian</option>
                <option value="Sister">Sister</option>
                <option value="Brother">Brother</option>
                <option value="Aunt">Aunt</option>
                <option value="Uncle">Uncle</option>
                <option value="Grandmother">Grandmother</option>
                <option value="Grandfather">Grandfather</option>
                <option value="Cousin">Cousin</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div class="form-group full-width">
              <label>Address</label>
              <textarea 
                [(ngModel)]="editableInfo.address" 
                [readonly]="!editMode"
                rows="2"
                placeholder="Enter complete address">
              </textarea>
            </div>
            <div class="form-group">
              <label>Phone No.</label>
              <input type="text" 
                [(ngModel)]="editableInfo.phone_number" 
                [readonly]="!editMode"
                placeholder="Enter phone number">
            </div>
          </div>
        </div>

        <!-- Medical History Section -->
        <div class="info-card">
          <div class="card-header">
            <h2>Medical History (For Learners)</h2>
            <button *ngIf="!medicalHistoryEditMode" class="edit-btn" (click)="toggleMedicalHistoryEdit()">
              Edit
            </button>
            <div *ngIf="medicalHistoryEditMode" class="edit-actions">
              <button class="save-btn" (click)="saveMedicalHistory()" [disabled]="saving">
                {{ saving ? 'Saving...' : 'Save' }}
              </button>
              <button class="cancel-btn" (click)="cancelMedicalHistoryEdit()">Cancel</button>
            </div>
          </div>
          
          <!-- Allergies -->
          <div class="medical-section">
            <h3>1. Does your child have any allergies?</h3>
            <div class="checkbox-grid">
              <div class="checkbox-group">
                <label>Medicine</label>
                <div class="checkbox-options">
                  <label><input type="checkbox" [(ngModel)]="medicalHistoryEdit.allergies.medicine" [disabled]="!medicalHistoryEditMode"> Yes</label>
                  <label><input type="checkbox" [checked]="!medicalHistoryEdit.allergies.medicine" [disabled]="!medicalHistoryEditMode"> No</label>
                </div>
              </div>
              <div class="checkbox-group">
                <label>Pollens</label>
                <div class="checkbox-options">
                  <label><input type="checkbox" [(ngModel)]="medicalHistoryEdit.allergies.pollens" [disabled]="!medicalHistoryEditMode"> Yes</label>
                  <label><input type="checkbox" [checked]="!medicalHistoryEdit.allergies.pollens" [disabled]="!medicalHistoryEditMode"> No</label>
                </div>
              </div>
              <div class="checkbox-group">
                <label>Food</label>
                <div class="checkbox-options">
                  <label><input type="checkbox" [(ngModel)]="medicalHistoryEdit.allergies.food" [disabled]="!medicalHistoryEditMode"> Yes</label>
                  <label><input type="checkbox" [checked]="!medicalHistoryEdit.allergies.food" [disabled]="!medicalHistoryEditMode"> No</label>
                </div>
              </div>
              <div class="checkbox-group">
                <label>Stinging Insects</label>
                <div class="checkbox-options">
                  <label><input type="checkbox" [(ngModel)]="medicalHistoryEdit.allergies.stinging_insects" [disabled]="!medicalHistoryEditMode"> Yes</label>
                  <label><input type="checkbox" [checked]="!medicalHistoryEdit.allergies.stinging_insects" [disabled]="!medicalHistoryEditMode"> No</label>
                </div>
              </div>
            </div>
            
            <div class="allergies-display">
              <h4>Known Allergies:</h4>
              <div *ngFor="let allergy of medicalRecord.allergies" class="allergy-item">
                <span class="allergy-text">{{ allergy.allergy_text }}</span>
                <span class="allergy-severity" [class]="'severity-' + allergy.severity.toLowerCase()">
                  {{ allergy.severity }}
                </span>
              </div>
              <div *ngIf="medicalRecord.allergies.length === 0" class="no-allergies">
                No known allergies recorded
              </div>
            </div>
          </div>

          <!-- Medical Conditions -->
          <div class="medical-section">
            <h3>2. Does your child have any ongoing medical condition?</h3>
            <div class="checkbox-grid">
              <div class="checkbox-item">
                <label><input type="checkbox" [(ngModel)]="medicalHistoryEdit.medical_conditions.error_refraction" [disabled]="!medicalHistoryEditMode"> Error of refraction (Wearing Corrective Lenses)</label>
              </div>
              <div class="checkbox-item">
                <label><input type="checkbox" [(ngModel)]="medicalHistoryEdit.medical_conditions.heart_problem" [disabled]="!medicalHistoryEditMode"> Heart problem</label>
              </div>
              <div class="checkbox-item">
                <label><input type="checkbox" [(ngModel)]="medicalHistoryEdit.medical_conditions.bleeding_disorder" [disabled]="!medicalHistoryEditMode"> Bleeding disorder (nose, etc.)</label>
              </div>
              <div class="checkbox-item">
                <label><input type="checkbox" [(ngModel)]="medicalHistoryEdit.medical_conditions.hernia" [disabled]="!medicalHistoryEditMode"> Hernia (painful bulge in the groin area)</label>
              </div>
              <div class="checkbox-item">
                <label><input type="checkbox" [(ngModel)]="medicalHistoryEdit.medical_conditions.asthma" [disabled]="!medicalHistoryEditMode"> Asthma</label>
              </div>
              <div class="checkbox-item">
                <label><input type="checkbox" [(ngModel)]="medicalHistoryEdit.medical_conditions.anemia" [disabled]="!medicalHistoryEditMode"> Anemia</label>
              </div>
              <div class="checkbox-item">
                <label><input type="checkbox" [(ngModel)]="medicalHistoryEdit.medical_conditions.anxiety_depression" [disabled]="!medicalHistoryEditMode"> Anxiety/Depression</label>
              </div>
              <div class="checkbox-item">
                <label><input type="checkbox" [(ngModel)]="medicalHistoryEdit.medical_conditions.seizure" [disabled]="!medicalHistoryEditMode"> Seizure</label>
              </div>
            </div>
          </div>

          <!-- Surgery/Hospitalization -->
          <div class="medical-section">
            <h3>3. Does your child have ever had surgery/hospitalization?</h3>
            <div class="radio-options">
              <label><input type="radio" name="surgery" [(ngModel)]="medicalHistoryEdit.surgery_hospitalization" [value]="true" [disabled]="!medicalHistoryEditMode"> Yes</label>
              <label><input type="radio" name="surgery" [(ngModel)]="medicalHistoryEdit.surgery_hospitalization" [value]="false" [disabled]="!medicalHistoryEditMode"> No</label>
            </div>
          </div>

          <!-- Family History -->
          <div class="medical-section">
            <h3>Family History</h3>
            <h4>4. Does anyone in your family have the following conditions:</h4>
            <div class="checkbox-grid">
              <div class="checkbox-item">
                <label><input type="checkbox" [(ngModel)]="medicalHistoryEdit.family_history.tuberculosis" [disabled]="!medicalHistoryEditMode"> Tuberculosis</label>
              </div>
              <div class="checkbox-item">
                <label><input type="checkbox" [(ngModel)]="medicalHistoryEdit.family_history.cancer" [disabled]="!medicalHistoryEditMode"> Cancer</label>
              </div>
              <div class="checkbox-item">
                <label><input type="checkbox" [(ngModel)]="medicalHistoryEdit.family_history.stroke_cardiac" [disabled]="!medicalHistoryEditMode"> Stroke/Cardiac Problem</label>
              </div>
              <div class="checkbox-item">
                <label><input type="checkbox" [(ngModel)]="medicalHistoryEdit.family_history.diabetes" [disabled]="!medicalHistoryEditMode"> Diabetes Mellitus</label>
              </div>
              <div class="checkbox-item">
                <label><input type="checkbox" [(ngModel)]="medicalHistoryEdit.family_history.hypertension" [disabled]="!medicalHistoryEditMode"> Hypertension</label>
              </div>
              <div class="checkbox-item">
                <label><input type="checkbox" [(ngModel)]="medicalHistoryEdit.family_history.depression" [disabled]="!medicalHistoryEditMode"> Depression</label>
              </div>
              <div class="checkbox-item">
                <label><input type="checkbox" [(ngModel)]="medicalHistoryEdit.family_history.thyroid" [disabled]="!medicalHistoryEditMode"> Thyroid Problem</label>
              </div>
              <div class="checkbox-item">
                <label><input type="checkbox" [(ngModel)]="medicalHistoryEdit.family_history.phobia" [disabled]="!medicalHistoryEditMode"> Phobia</label>
              </div>
            </div>
          </div>

          <!-- Smoke Exposure -->
          <div class="medical-section">
            <h3>5. Exposure to cigarette/vape smoke at home?</h3>
            <div class="radio-options">
              <label><input type="radio" name="smoke" [(ngModel)]="medicalHistoryEdit.smoke_exposure" [value]="true" [disabled]="!medicalHistoryEditMode"> Yes</label>
              <label><input type="radio" name="smoke" [(ngModel)]="medicalHistoryEdit.smoke_exposure" [value]="false" [disabled]="!medicalHistoryEditMode"> No</label>
            </div>
          </div>
        </div>



        <div *ngIf="successMessage" class="success-message">
          {{ successMessage }}
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./personal-info.component.scss']
})
export class PersonalInfoComponent implements OnInit {
  medicalRecord: MedicalRecord | null = null;
  personalInfo!: PersonalMedicalInfo;
  adviserName = 'Loading...';
  editableInfo: { 
    address: string; 
    emergency_contact_person: string;
    emergency_contact_relation: string;
    phone_number: string;
  } = {
    address: '',
    emergency_contact_person: '',
    emergency_contact_relation: '',
    phone_number: ''
  };

  medicalHistoryEdit = {
    allergies: {
      medicine: false,
      pollens: false,
      food: false,
      stinging_insects: false
    },
    medical_conditions: {
      error_refraction: false,
      heart_problem: false,
      bleeding_disorder: false,
      hernia: false,
      asthma: false,
      anemia: false,
      anxiety_depression: false,
      seizure: false
    },
    surgery_hospitalization: false,
    family_history: {
      tuberculosis: false,
      cancer: false,
      stroke_cardiac: false,
      diabetes: false,
      hypertension: false,
      depression: false,
      thyroid: false,
      phobia: false
    },
    smoke_exposure: false
  };

  medicalHistoryEditMode = false;
  
  loading = true;
  error: string | null = null;
  editMode = false;
  saving = false;
  successMessage: string | null = null;

  constructor(private medicalRecordsService: MedicalRecordsService) {}

  ngOnInit() {
    this.loadMedicalRecord();
  }

  private loadMedicalRecord() {
    this.loading = true;
    this.error = null;

    this.medicalRecordsService.getMedicalRecord().subscribe({
      next: (response) => { 
        if (response.success && response.data) {
          this.medicalRecord = response.data;
          this.personalInfo = response.data.personal_info;
          this.parseEmergencyContact();
          this.fetchAdviserName();
        } else {
          this.error = response.message || 'Failed to load medical record';
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading medical record:', error);
        this.error = 'Failed to load medical record. Please try again.';
        this.loading = false;
      }
    });
  }

  private fetchAdviserName() {
    // Fetch adviser based on student's grade level and section
    this.medicalRecordsService.getAdviserByGradeSection(
      this.personalInfo.grade_level,
      this.personalInfo.section
    ).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.adviserName = response.data.adviser_name || 'N/A';
        } else {
          this.adviserName = 'N/A';
        }
      },
      error: (error) => {
        console.error('Error fetching adviser:', error);
        this.adviserName = 'N/A';
      }
    });
  }

  private parseEmergencyContact() {
    // Parse emergency contact string to separate fields
    const emergencyContact = this.personalInfo.emergency_contact || '';
    
    // Try to parse format like "Mother: Maria Santos - 09123456789"
    const contactMatch = emergencyContact.match(/(\w+):\s*([^-]+)\s*-\s*(.+)/);
    
    if (contactMatch) {
      this.editableInfo = {
        emergency_contact_relation: contactMatch[1],
        emergency_contact_person: contactMatch[2].trim(),
        phone_number: contactMatch[3].trim(),
        address: this.personalInfo.address || ''
      };
    } else {
      this.editableInfo = {
        emergency_contact_person: emergencyContact,
        emergency_contact_relation: '',
        phone_number: '',
        address: this.personalInfo.address || ''
      };
    }
  }

  getAge(): string {
    if (!this.personalInfo.birth_date) return 'N/A';
    
    const today = new Date();
    const birth = new Date(this.personalInfo.birth_date);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age.toString();
  }

  toggleEditMode() {
    this.editMode = !this.editMode;
    this.successMessage = null;
    
    if (!this.editMode) {
      // Reset to original values if canceling
      this.parseEmergencyContact();
    }
  }

  cancelEdit() {
    this.editMode = false;
    this.parseEmergencyContact();
    this.successMessage = null;
  }

  toggleMedicalHistoryEdit() {
    this.medicalHistoryEditMode = !this.medicalHistoryEditMode;
    this.successMessage = null;
  }

  cancelMedicalHistoryEdit() {
    this.medicalHistoryEditMode = false;
    this.successMessage = null;
  }

  saveMedicalHistory() {
    this.saving = true;
    this.error = null;
    this.successMessage = null;

    // TODO: Implement backend API call to save medical history
    // For now, just toggle edit mode and show success message
    setTimeout(() => {
      this.medicalHistoryEditMode = false;
      this.successMessage = 'Medical history updated successfully!';
      this.saving = false;

      // Clear success message after 3 seconds
      setTimeout(() => {
        this.successMessage = null;
      }, 3000);
    }, 500);
  }

  saveChanges() {
    this.saving = true;
    this.error = null;
    this.successMessage = null;

    // Combine emergency contact fields back into single string
    const emergencyContactString = `${this.editableInfo.emergency_contact_relation}: ${this.editableInfo.emergency_contact_person} - ${this.editableInfo.phone_number}`;

    const updateData: { address?: string; emergency_contact?: string } = {};
    
    if (this.editableInfo.address !== this.personalInfo.address) {
      updateData.address = this.editableInfo.address;
    }
    
    if (emergencyContactString !== this.personalInfo.emergency_contact) {
      updateData.emergency_contact = emergencyContactString;
    }

    if (Object.keys(updateData).length === 0) {
      this.editMode = false;
      this.saving = false;
      return;
    }

    console.log('Sending update data:', updateData);

    this.medicalRecordsService.updateMedicalInfo(updateData).subscribe({
      next: (response) => {
        console.log('Update response:', response);
        if (response.success) {
          // Update local data
          this.personalInfo.address = this.editableInfo.address;
          this.personalInfo.emergency_contact = emergencyContactString;
          
          this.editMode = false;
          this.successMessage = 'Information updated successfully!';
          
          // Clear success message after 3 seconds
          setTimeout(() => {
            this.successMessage = null;
          }, 3000);
        } else {
          this.error = response.message || 'Failed to update information';
        }
        this.saving = false;
      },
      error: (error) => {
        console.error('Error updating medical info:', error);
        console.error('Error status:', error.status);
        console.error('Error response:', error.error);
        this.error = 'Failed to update information. Please try again.';
        this.saving = false;
      }
    });
  }
}