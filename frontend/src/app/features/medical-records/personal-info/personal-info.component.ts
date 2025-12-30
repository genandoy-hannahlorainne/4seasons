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
              <label>School</label>
              <input type="text" value="Dios Dada High School" readonly>
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
              <input type="text" value="Ms. Rea Letas" readonly>
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
              <input type="text" 
                [(ngModel)]="editableInfo.emergency_contact_relation" 
                [readonly]="!editMode"
                placeholder="e.g., Mother, Father, Guardian">
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
            <span class="readonly-badge">Read Only</span>
          </div>
          
          <!-- Allergies -->
          <div class="medical-section">
            <h3>1. Does your child have any allergies?</h3>
            <div class="checkbox-grid">
              <div class="checkbox-group">
                <label>Medicine</label>
                <div class="checkbox-options">
                  <label><input type="checkbox" disabled> Yes</label>
                  <label><input type="checkbox" disabled checked> No</label>
                </div>
              </div>
              <div class="checkbox-group">
                <label>Pollens</label>
                <div class="checkbox-options">
                  <label><input type="checkbox" disabled> Yes</label>
                  <label><input type="checkbox" disabled checked> No</label>
                </div>
              </div>
              <div class="checkbox-group">
                <label>Food</label>
                <div class="checkbox-options">
                  <label><input type="checkbox" disabled> Yes</label>
                  <label><input type="checkbox" disabled checked> No</label>
                </div>
              </div>
              <div class="checkbox-group">
                <label>Stinging Insects</label>
                <div class="checkbox-options">
                  <label><input type="checkbox" disabled> Yes</label>
                  <label><input type="checkbox" disabled checked> No</label>
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
                <label><input type="checkbox" disabled> Error of refraction (Wearing Corrective Lenses)</label>
              </div>
              <div class="checkbox-item">
                <label><input type="checkbox" disabled> Heart problem</label>
              </div>
              <div class="checkbox-item">
                <label><input type="checkbox" disabled> Bleeding disorder (nose, etc.)</label>
              </div>
              <div class="checkbox-item">
                <label><input type="checkbox" disabled> Hernia (painful bulge in the groin area)</label>
              </div>
              <div class="checkbox-item">
                <label><input type="checkbox" disabled> Asthma</label>
              </div>
              <div class="checkbox-item">
                <label><input type="checkbox" disabled> Anemia</label>
              </div>
              <div class="checkbox-item">
                <label><input type="checkbox" disabled> Anxiety/Depression</label>
              </div>
              <div class="checkbox-item">
                <label><input type="checkbox" disabled> Seizure</label>
              </div>
            </div>
          </div>

          <!-- Surgery/Hospitalization -->
          <div class="medical-section">
            <h3>3. Does your child have ever had surgery/hospitalization?</h3>
            <div class="radio-options">
              <label><input type="radio" name="surgery" disabled> Yes</label>
              <label><input type="radio" name="surgery" disabled checked> No</label>
            </div>
          </div>

          <!-- Family History -->
          <div class="medical-section">
            <h3>Family History</h3>
            <h4>4. Does anyone in your family have the following conditions:</h4>
            <div class="checkbox-grid">
              <div class="checkbox-item">
                <label><input type="checkbox" disabled> Tuberculosis</label>
              </div>
              <div class="checkbox-item">
                <label><input type="checkbox" disabled> Cancer</label>
              </div>
              <div class="checkbox-item">
                <label><input type="checkbox" disabled> Stroke/Cardiac Problem</label>
              </div>
              <div class="checkbox-item">
                <label><input type="checkbox" disabled checked> Diabetes Mellitus</label>
              </div>
              <div class="checkbox-item">
                <label><input type="checkbox" disabled> Hypertension</label>
              </div>
              <div class="checkbox-item">
                <label><input type="checkbox" disabled> Depression</label>
              </div>
              <div class="checkbox-item">
                <label><input type="checkbox" disabled> Thyroid Problem</label>
              </div>
              <div class="checkbox-item">
                <label><input type="checkbox" disabled> Phobia</label>
              </div>
            </div>
          </div>

          <!-- Smoke Exposure -->
          <div class="medical-section">
            <h3>5. Exposure to cigarette/vape smoke at home?</h3>
            <div class="radio-options">
              <label><input type="radio" name="smoke" disabled> Yes</label>
              <label><input type="radio" name="smoke" disabled checked> No</label>
            </div>
          </div>
        </div>

        <!-- Vaccination History -->
        <div class="info-card">
          <div class="card-header">
            <h2>Vaccination History (Dates of Immunization)</h2>
            <span class="readonly-badge">Read Only</span>
          </div>
          <div class="vaccination-table">
            <table>
              <thead>
                <tr>
                  <th>Vaccine</th>
                  <th>Given (Yes/No)</th>
                  <th>Date Given</th>
                  <th>Given by (Family/Health Center)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>DPT (Diphtheria Pertussis)</td>
                  <td>✓</td>
                  <td>7-25-12</td>
                  <td>Health Center</td>
                </tr>
                <tr>
                  <td>OPV (Oral polio Vaccine)</td>
                  <td>✓</td>
                  <td>5-28-12</td>
                  <td>Health Center</td>
                </tr>
                <tr>
                  <td>BCG (TB Vaccine)</td>
                  <td>✓</td>
                  <td>6-19-13</td>
                  <td>Health Center</td>
                </tr>
                <tr>
                  <td>MMR (Measles Mumps Rubella)</td>
                  <td>✓</td>
                  <td></td>
                  <td>Health Center</td>
                </tr>
                <tr>
                  <td>Chicken pox Vaccine</td>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>
                <tr>
                  <td>Hepa B</td>
                  <td>✓</td>
                  <td>4-5-12</td>
                  <td>Health Center</td>
                </tr>
                <tr>
                  <td>Tetanus</td>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>
                <tr>
                  <td>Flu Vaccine</td>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>
                <tr>
                  <td>Pneumococcal Vaccine</td>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>
                <tr>
                  <td>MR/TD Vaccine</td>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>
                <tr>
                  <td>Cervical Vaccine</td>
                  <td></td>
                  <td></td>
                  <td></td>
                </tr>
                <tr>
                  <td>Covid Vaccine</td>
                  <td>✓</td>
                  <td></td>
                  <td>Health Center</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Emergency Medication -->
        <div class="info-card">
          <div class="card-header">
            <h2>Emergency Medication Protocol</h2>
            <span class="readonly-badge">Read Only</span>
          </div>
          <div class="medication-section">
            <p><strong>If in case your child develops fever, pain, allergies he/she will be given:</strong></p>
            <div class="medication-options">
              <div class="medication-group">
                <label><input type="checkbox" disabled checked> Paracetamol</label>
                <label><input type="checkbox" disabled> Mefenamic</label>
                <label><input type="checkbox" disabled> Antihistamine</label>
                <label><input type="checkbox" disabled> Antacid</label>
              </div>
              <div class="medication-group">
                <label><input type="checkbox" disabled> Loperamide</label>
                <label><input type="checkbox" disabled> Nothing</label>
                <label><input type="checkbox" disabled> Others, specify: ___________</label>
              </div>
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

    this.medicalRecordsService.updateMedicalInfo(updateData).subscribe({
      next: (response) => {
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
        this.error = 'Failed to update information. Please try again.';
        this.saving = false;
      }
    });
  }
}