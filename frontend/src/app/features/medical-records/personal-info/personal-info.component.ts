import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { StudentService } from '../../../core/services/student.service';

interface PersonalInfo {
  full_name: string;
  student_number: string;
  grade_level: string;
  section: string;
  birth_date: string;
  gender: string;
  address: string;
  phone_number: string;
  emergency_contact_person: string;
  emergency_contact_relation: string;
}

interface PhysicalInfo {
  height_cm: number | null;
  weight_kg: number | null;
  blood_type: string;
}

interface Allergy {
  allergy_text: string;
  severity: 'Mild' | 'Moderate' | 'Severe';
}

interface MedicalHistory {
  allergies: {
    medicine: boolean;
    pollens: boolean;
    food: boolean;
    stinging_insects: boolean;
  };
  medical_conditions: {
    error_refraction: boolean;
    heart_problem: boolean;
    bleeding_disorder: boolean;
    hernia: boolean;
    asthma: boolean;
    anemia: boolean;
    anxiety_depression: boolean;
    seizure: boolean;
  };
  surgery_hospitalization: boolean;
  family_history: {
    tuberculosis: boolean;
    cancer: boolean;
    stroke_cardiac: boolean;
    diabetes: boolean;
    hypertension: boolean;
    depression: boolean;
    thyroid: boolean;
    phobia: boolean;
  };
  smoke_exposure: boolean;
}

interface MedicalRecord {
  personal_info: PersonalInfo;
  physical_info: PhysicalInfo;
  allergies: Allergy[];
  medical_history: MedicalHistory;
}

@Component({
  selector: 'app-personal-info',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './personal-info.component.html',
  styleUrls: ['./personal-info.component.scss']
})
export class PersonalInfoComponent implements OnInit {
  loading = true;
  error = '';
  successMessage = '';
  saving = false;
  
  medicalRecord: MedicalRecord | null = null;
  personalInfo: PersonalInfo = {
    full_name: '',
    student_number: '',
    grade_level: '',
    section: '',
    birth_date: '',
    gender: '',
    address: '',
    phone_number: '',
    emergency_contact_person: '',
    emergency_contact_relation: ''
  };
  
  adviserName = '';
  
  // Edit modes
  editMode = false;
  physicalInfoEditMode = false;
  allergiesEditMode = false;
  medicalHistoryEditMode = false;
  
  // Editable copies
  editableInfo: PersonalInfo = { ...this.personalInfo };
  physicalInfoEdit: PhysicalInfo = {
    height_cm: null,
    weight_kg: null,
    blood_type: ''
  };
  
  public medicalHistoryData: MedicalHistory = {
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
  
  newAllergy: Allergy = {
    allergy_text: '',
    severity: 'Mild'
  };

  constructor(
    private authService: AuthService,
    private studentService: StudentService
  ) {}

  ngOnInit() {
    this.loadPersonalInfo();
  }

  async loadPersonalInfo() {
    try {
      this.loading = true;
      this.error = '';
      
      const currentUser = this.authService.currentUserValue;
      if (!currentUser) {
        this.error = 'User not authenticated';
        return;
      }

      console.log('Loading personal info for user:', currentUser.user_id);

      // Load student profile and medical data
      const [profileResponse, medicalResponse] = await Promise.all([
        this.studentService.getStudentProfile(currentUser.user_id).toPromise(),
        this.studentService.getStudentMedicalData(currentUser.user_id).toPromise()
      ]);

      console.log('Profile response:', profileResponse);
      console.log('Medical response:', medicalResponse);

      if (profileResponse?.success && medicalResponse?.success) {
        // Handle the actual API response structure
        const profileData = profileResponse.student || profileResponse.profile || profileResponse.data;
        const medicalData = medicalResponse.data;
        
        console.log('Profile data:', profileData);
        console.log('Medical data:', medicalData);
        
        if (profileData && medicalData && medicalData.personal_info) {
          // Map the profile data to the expected format
          this.personalInfo = {
            full_name: medicalData.personal_info.full_name || profileData.name || 
                      (profileData.first_name + ' ' + (profileData.middle_name ? profileData.middle_name + ' ' : '') + profileData.last_name),
            student_number: medicalData.personal_info.student_number || profileData.student_number,
            grade_level: medicalData.personal_info.grade_level || profileData.grade_level,
            section: medicalData.personal_info.section || profileData.section,
            birth_date: medicalData.personal_info.birth_date || profileData.birth_date,
            gender: medicalData.personal_info.gender || profileData.gender,
            address: medicalData.personal_info.address || '',
            phone_number: medicalData.personal_info.emergency_contact_phone || '',
            emergency_contact_person: medicalData.personal_info.emergency_contact || '',
            emergency_contact_relation: medicalData.personal_info.emergency_contact_relation || ''
          };
          
          this.editableInfo = { ...this.personalInfo };
          
          this.medicalRecord = {
            personal_info: this.personalInfo,
            physical_info: {
              height_cm: medicalData.personal_info.height_cm,
              weight_kg: medicalData.personal_info.weight_kg,
              blood_type: medicalData.personal_info.blood_type || profileData.blood_type
            },
            allergies: medicalData.allergies || [],
            medical_history: medicalData.medical_history || this.medicalHistoryData
          };
          
          this.physicalInfoEdit = { ...this.medicalRecord.physical_info };
          this.medicalHistoryData = { ...this.medicalRecord.medical_history };
          
          // Load adviser name if available
          if (medicalData.personal_info?.adviser_name) {
            this.adviserName = medicalData.personal_info.adviser_name;
          }
          
          console.log('Successfully loaded data:', {
            personalInfo: this.personalInfo,
            medicalRecord: this.medicalRecord,
            adviserName: this.adviserName
          });
        } else {
          console.error('Invalid data structure:', { profileData, medicalData });
          this.error = 'Invalid data format received from server';
        }
      } else {
        console.error('API responses failed:', { profileResponse, medicalResponse });
        this.error = profileResponse?.message || medicalResponse?.message || 'Failed to load personal information';
      }
    } catch (error) {
      console.error('Error loading personal info:', error);
      this.error = 'An error occurred while loading your information';
    } finally {
      this.loading = false;
    }
  }

  getAge(): number {
    if (!this.personalInfo.birth_date) return 0;
    
    const birthDate = new Date(this.personalInfo.birth_date);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  calculateBMI(): string {
    if (!this.physicalInfoEdit.height_cm || !this.physicalInfoEdit.weight_kg) {
      return '';
    }
    
    const heightInMeters = this.physicalInfoEdit.height_cm / 100;
    const bmi = this.physicalInfoEdit.weight_kg / (heightInMeters * heightInMeters);
    return bmi.toFixed(1);
  }

  getBMICategory(): string {
    const bmiValue = parseFloat(this.calculateBMI());
    if (!bmiValue) return '';
    
    if (bmiValue < 18.5) return 'Underweight';
    if (bmiValue < 25) return 'Normal weight';
    if (bmiValue < 30) return 'Overweight';
    return 'Obese';
  }

  // Contact Information Edit Methods
  toggleEditMode() {
    this.editMode = !this.editMode;
    if (this.editMode) {
      this.editableInfo = { ...this.personalInfo };
    }
  }

  cancelEdit() {
    this.editMode = false;
    this.editableInfo = { ...this.personalInfo };
  }

  async saveChanges() {
    try {
      this.saving = true;
      this.error = '';
      
      const currentUser = this.authService.currentUserValue;
      if (!currentUser) {
        this.error = 'User not authenticated';
        return;
      }

      // Transform the data to match backend expectations
      const updateData = {
        full_name: this.editableInfo.full_name,
        birth_date: this.editableInfo.birth_date,
        gender: this.editableInfo.gender,
        grade_level: this.editableInfo.grade_level,
        section: this.editableInfo.section,
        address: this.editableInfo.address,
        phone: currentUser.phone || '', // Keep student's own phone from users table
        emergency_contact: this.editableInfo.emergency_contact_person,
        emergency_contact_relation: this.editableInfo.emergency_contact_relation,
        emergency_contact_phone: this.editableInfo.phone_number,
        email: currentUser.email // Keep existing email
      };

      console.log('Saving personal info with data:', updateData);

      const response = await this.studentService.updateStudentProfile(currentUser.user_id, updateData).toPromise();
      
      console.log('Save response:', response);
      
      if (response?.success) {
        this.personalInfo = { ...this.editableInfo };
        this.editMode = false;
        this.successMessage = 'Contact information updated successfully';
        setTimeout(() => this.successMessage = '', 3000);
        
        // Reload data to ensure consistency
        await this.loadPersonalInfo();
      } else {
        this.error = response?.message || 'Failed to update contact information';
      }
    } catch (error) {
      console.error('Error saving changes:', error);
      this.error = 'An error occurred while saving changes';
    } finally {
      this.saving = false;
    }
  }

  // Physical Information Edit Methods
  togglePhysicalInfoEdit() {
    this.physicalInfoEditMode = !this.physicalInfoEditMode;
    if (this.physicalInfoEditMode && this.medicalRecord) {
      this.physicalInfoEdit = { ...this.medicalRecord.physical_info };
    }
  }

  cancelPhysicalInfoEdit() {
    this.physicalInfoEditMode = false;
    if (this.medicalRecord) {
      this.physicalInfoEdit = { ...this.medicalRecord.physical_info };
    }
  }

  async savePhysicalInfo() {
    try {
      this.saving = true;
      this.error = '';
      
      const currentUser = this.authService.currentUserValue;
      if (!currentUser) {
        this.error = 'User not authenticated';
        return;
      }

      const response = await this.studentService.updateStudentPhysicalInfo(currentUser.user_id, this.physicalInfoEdit).toPromise();
      
      if (response?.success) {
        if (this.medicalRecord) {
          this.medicalRecord.physical_info = { ...this.physicalInfoEdit };
        }
        this.physicalInfoEditMode = false;
        this.successMessage = 'Physical information updated successfully';
        setTimeout(() => this.successMessage = '', 3000);
      } else {
        this.error = response?.message || 'Failed to update physical information';
      }
    } catch (error) {
      console.error('Error saving physical info:', error);
      this.error = 'An error occurred while saving physical information';
    } finally {
      this.saving = false;
    }
  }

  // Allergies Edit Methods
  toggleAllergiesEdit() {
    this.allergiesEditMode = !this.allergiesEditMode;
    if (!this.allergiesEditMode) {
      this.newAllergy = { allergy_text: '', severity: 'Mild' };
    }
  }

  cancelAllergiesEdit() {
    this.allergiesEditMode = false;
    this.newAllergy = { allergy_text: '', severity: 'Mild' };
  }

  addAllergy() {
    if (!this.newAllergy.allergy_text.trim()) return;
    
    if (this.medicalRecord) {
      this.medicalRecord.allergies.push({ ...this.newAllergy });
      this.newAllergy = { allergy_text: '', severity: 'Mild' };
    }
  }

  removeAllergy(index: number) {
    if (this.medicalRecord) {
      this.medicalRecord.allergies.splice(index, 1);
    }
  }

  async saveAllergies() {
    try {
      this.saving = true;
      this.error = '';
      
      const currentUser = this.authService.currentUserValue;
      if (!currentUser) {
        this.error = 'User not authenticated';
        return;
      }

      if (!this.medicalRecord) {
        this.error = 'No medical record found';
        return;
      }

      console.log('Saving allergies:', {
        userId: currentUser.user_id,
        allergies: this.medicalRecord.allergies
      });

      const response = await this.studentService.updateStudentAllergies(currentUser.user_id, this.medicalRecord.allergies).toPromise();
      
      console.log('Save allergies response:', response);
      
      if (response?.success) {
        this.allergiesEditMode = false;
        this.successMessage = 'Allergies updated successfully';
        setTimeout(() => this.successMessage = '', 3000);
        
        // Reload data to ensure consistency
        await this.loadPersonalInfo();
      } else {
        console.error('Save allergies failed:', response);
        this.error = response?.message || 'Failed to update allergies';
      }
    } catch (error) {
      console.error('Error saving allergies:', error);
      this.error = 'An error occurred while saving allergies';
    } finally {
      this.saving = false;
    }
  }

  // Medical History Edit Methods
  toggleMedicalHistoryEdit() {
    this.medicalHistoryEditMode = !this.medicalHistoryEditMode;
    if (this.medicalHistoryEditMode && this.medicalRecord) {
      this.medicalHistoryData = { ...this.medicalRecord.medical_history };
    }
  }

  cancelMedicalHistoryEdit() {
    this.medicalHistoryEditMode = false;
    if (this.medicalRecord) {
      this.medicalHistoryData = { ...this.medicalRecord.medical_history };
    }
  }

  async saveMedicalHistory() {
    try {
      this.saving = true;
      this.error = '';
      
      const currentUser = this.authService.currentUserValue;
      if (!currentUser) {
        this.error = 'User not authenticated';
        return;
      }

      console.log('Saving medical history:', {
        userId: currentUser.user_id,
        medicalHistory: this.medicalHistoryData
      });

      const response = await this.studentService.updateMedicalHistory(currentUser.user_id, this.medicalHistoryData).toPromise();
      
      console.log('Save medical history response:', response);
      
      if (response?.success) {
        if (this.medicalRecord) {
          this.medicalRecord.medical_history = { ...this.medicalHistoryData };
        }
        this.medicalHistoryEditMode = false;
        this.successMessage = 'Medical history updated successfully';
        setTimeout(() => this.successMessage = '', 3000);
        
        // Reload data to ensure consistency
        await this.loadPersonalInfo();
      } else {
        this.error = response?.message || 'Failed to update medical history';
      }
    } catch (error) {
      console.error('Error saving medical history:', error);
      this.error = 'An error occurred while saving medical history';
    } finally {
      this.saving = false;
    }
  }
}