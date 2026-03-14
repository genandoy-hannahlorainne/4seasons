import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { StudentService } from '../../../core/services/student.service';
import { BMIUtils } from '../../../shared/utils/bmi-utils';
import { QRCodeComponent } from 'angularx-qrcode';

interface PersonalInfo {
  full_name: string;
  student_number: string;
  grade_level: string;
  section: string;
  birth_date: string;
  gender: string;
  address: string;
  emergency_contact_phone: string;
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
  imports: [CommonModule, FormsModule, RouterModule, QRCodeComponent],
  templateUrl: './personal-info.component.html',
  styleUrls: ['./personal-info.component.scss']
})
export class PersonalInfoComponent implements OnInit {
  loading = true;
  error = '';
  successMessage = '';
  saving = false;
  
  medicalRecord: MedicalRecord | null = null;
  studentId: number | null = null;
  personalInfo: PersonalInfo = {
    full_name: '',
    student_number: '',
    grade_level: '',
    section: '',
    birth_date: '',
    gender: '',
    address: '',
    emergency_contact_phone: '',
    emergency_contact_person: '',
    emergency_contact_relation: ''
  };
  
  adviserName = '';
  
  // Edit modes
  editMode = false;
  physicalInfoEditMode = false;
  allergiesEditMode = false;
  medicalHistoryEditMode = false;
  
  // QR Code Modal
  showQRModal = false;
  qrCodeData: any = null;
  qrCodeImage: string = '';
  
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
          this.studentId = Number(medicalData.personal_info.student_id || profileData.student_id || 0) || null;

          const normalizedMedicalHistory = this.normalizeMedicalHistory(medicalData.medical_history);

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
            emergency_contact_phone: medicalData.personal_info.emergency_contact_phone || '',
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
            medical_history: normalizedMedicalHistory
          };
          
          this.physicalInfoEdit = { ...this.medicalRecord.physical_info };
          this.medicalHistoryData = { ...normalizedMedicalHistory };
          
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

  formatDateForInput(dateString: string): string {
    if (!dateString) return '';
    
    try {
      // Handle both ISO format and simple date format
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      
      // Return in YYYY-MM-DD format for HTML date input
      return date.toISOString().split('T')[0];
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  }

  calculateBMI(): string {
    if (!this.physicalInfoEdit.height_cm || !this.physicalInfoEdit.weight_kg) {
      return '';
    }
    
    // Use BMI utility for safe calculation
    const bmi = BMIUtils.calculateBMI(this.physicalInfoEdit.height_cm, this.physicalInfoEdit.weight_kg);
    return bmi ? bmi.toFixed(1) : '';
  }

  getBMICategory(): string {
    const bmiString = this.calculateBMI();
    if (!bmiString) return '';
    
    return BMIUtils.getBMICategory(parseFloat(bmiString));
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

      if (!this.studentId) {
        this.error = 'Student record not found';
        return;
      }

      const updatePayload = {
        personal_info: {
          address: this.editableInfo.address,
          emergency_contact: this.editableInfo.emergency_contact_person,
          emergency_contact_relation: this.editableInfo.emergency_contact_relation,
          emergency_contact_phone: this.editableInfo.emergency_contact_phone,
          blood_type: this.physicalInfoEdit.blood_type,
          email: currentUser.email
        }
      };

      console.log('Saving personal info with data:', updatePayload);

      const response = await this.studentService.updateMedicalData(this.studentId, updatePayload).toPromise();
      
      console.log('Save response:', response);
      
      if (response?.success) {
        this.personalInfo = { ...this.editableInfo };
        this.editMode = false;
        this.successMessage = 'Contact information updated successfully';
        setTimeout(() => this.successMessage = '', 3000);
        
        // Reload data to ensure consistency
        await this.loadPersonalInfo();
        await this.checkAndShowQRCode();
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

      if (!this.studentId) {
        this.error = 'Student record not found';
        return;
      }

      const payload = {
        physical_info: {
          height_cm: this.physicalInfoEdit.height_cm,
          weight_kg: this.physicalInfoEdit.weight_kg,
          blood_type: this.physicalInfoEdit.blood_type
        }
      };

      const response = await this.studentService.updateMedicalData(this.studentId, payload).toPromise();
      
      if (response?.success) {
        if (this.medicalRecord) {
          this.medicalRecord.physical_info = { ...this.physicalInfoEdit };
        }
        this.physicalInfoEditMode = false;
        this.successMessage = 'Physical information updated successfully';
        setTimeout(() => this.successMessage = '', 3000);

        await this.loadPersonalInfo();
        await this.checkAndShowQRCode();
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

      if (!this.studentId) {
        this.error = 'Student record not found';
        return;
      }

      if (!this.medicalRecord) {
        this.error = 'No medical record found';
        return;
      }

      const payload = {
        allergies: this.medicalRecord.allergies
          .filter((allergy: any) => (allergy.allergy_text || allergy.allergy_name || '').trim() !== '')
          .map((allergy: any) => ({
            allergy_name: (allergy.allergy_text || allergy.allergy_name || '').trim(),
            severity: this.normalizeSeverity(allergy.severity),
            reaction_description: allergy.reaction_description || null,
            treatment_notes: allergy.treatment_notes || null
          }))
      };

      console.log('Saving allergies:', {
        studentId: this.studentId,
        allergies: payload.allergies
      });

      const response = await this.studentService.updateMedicalData(this.studentId, payload).toPromise();
      
      console.log('Save allergies response:', response);
      
      if (response?.success) {
        this.allergiesEditMode = false;
        this.successMessage = 'Allergies updated successfully';
        setTimeout(() => this.successMessage = '', 3000);
        
        // Reload data to ensure consistency
        await this.loadPersonalInfo();
        await this.checkAndShowQRCode();
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

      if (!this.studentId) {
        this.error = 'Student record not found';
        return;
      }

      const medicalConditions = this.medicalHistoryData.medical_conditions || {};
      const familyHistory = this.medicalHistoryData.family_history || {};

      const familyHistoryList: string[] = [];
      if (familyHistory.tuberculosis) familyHistoryList.push('Tuberculosis');
      if (familyHistory.cancer) familyHistoryList.push('Cancer');
      if (familyHistory.stroke_cardiac) familyHistoryList.push('Stroke/Cardiac');
      if (familyHistory.diabetes) familyHistoryList.push('Diabetes');
      if (familyHistory.hypertension) familyHistoryList.push('Hypertension');
      if (familyHistory.depression) familyHistoryList.push('Depression');
      if (familyHistory.thyroid) familyHistoryList.push('Thyroid');
      if (familyHistory.phobia) familyHistoryList.push('Phobia');

      const otherConditionsList: string[] = [];
      if (medicalConditions.error_refraction) otherConditionsList.push('Error of refraction');
      if (medicalConditions.hernia) otherConditionsList.push('Hernia');
      if (medicalConditions.anemia) otherConditionsList.push('Anemia');
      if (this.medicalHistoryData.surgery_hospitalization) otherConditionsList.push('Surgery/Hospitalization history');

      const notesList: string[] = [];
      if (this.medicalHistoryData.smoke_exposure) notesList.push('Smoke exposure');
      if (this.medicalHistoryData.allergies?.medicine) notesList.push('Medicine allergy');
      if (this.medicalHistoryData.allergies?.pollens) notesList.push('Pollen allergy');
      if (this.medicalHistoryData.allergies?.food) notesList.push('Food allergy');
      if (this.medicalHistoryData.allergies?.stinging_insects) notesList.push('Stinging insects allergy');

      const payload = {
        medical_history: {
          condition_asthma: !!medicalConditions.asthma,
          condition_diabetes: !!familyHistory.diabetes,
          condition_heart_problem: !!medicalConditions.heart_problem,
          condition_hypertension: !!familyHistory.hypertension,
          condition_seizure_disorder: !!medicalConditions.seizure,
          condition_bleeding_disorder: !!medicalConditions.bleeding_disorder,
          condition_kidney_disease: false,
          condition_mental_health: !!medicalConditions.anxiety_depression,
          other_conditions: otherConditionsList.length ? otherConditionsList.join('; ') : null,
          current_medications: null,
          family_medical_history: familyHistoryList.length ? familyHistoryList.join(', ') : null,
          notes: notesList.length ? notesList.join('; ') : null
        }
      };

      console.log('Saving medical history:', {
        studentId: this.studentId,
        medicalHistory: payload.medical_history
      });

      const response = await this.studentService.updateMedicalData(this.studentId, payload).toPromise();
      
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
        
        // Check if forms are complete and show QR code modal
        await this.checkAndShowQRCode();
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

  async checkAndShowQRCode() {
    try {
      const currentUser = this.authService.currentUserValue;
      if (!currentUser || !this.medicalRecord) return;

      // Check if all required forms are completed
      const isComplete = this.isFormComplete();
      
      if (isComplete) {
        // Check if QR was already downloaded (stored in localStorage)
        const qrDownloaded = localStorage.getItem(`qr_downloaded_${currentUser.user_id}`);
        
        if (!qrDownloaded) {
          // Fetch QR code data
          const medicalData = await this.studentService.getStudentMedicalData(currentUser.user_id).toPromise();
          if (medicalData?.success && medicalData.data?.personal_info?.student_id) {
            const studentId = medicalData.data.personal_info.student_id;
            
            // Generate QR code content
            this.qrCodeData = {
              student_id: studentId,
              student_number: this.personalInfo.student_number,
              name: this.personalInfo.full_name
            };
            
            this.qrCodeImage = JSON.stringify(this.qrCodeData);
            this.showQRModal = true;
          }
        }
      }
    } catch (error) {
      console.error('Error checking QR code:', error);
    }
  }

  isFormComplete(): boolean {
    if (!this.medicalRecord) return false;

    const info = this.personalInfo;
    const physical = this.medicalRecord.physical_info;
    const history = this.medicalRecord.medical_history;
    
    // Check if all required fields are filled
    return !!(
      info.address &&
      info.emergency_contact_person &&
      info.emergency_contact_relation &&
      info.emergency_contact_phone &&
      physical.height_cm &&
      physical.weight_kg &&
      history // Medical history exists
    );
  }

  private normalizeMedicalHistory(raw: any): MedicalHistory {
    const defaults: MedicalHistory = {
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

    if (!raw) {
      return defaults;
    }

    const notesText = String(raw.notes || '').toLowerCase();
    const otherConditionsText = String(raw.other_conditions || '').toLowerCase();
    const familyHistoryText = String(raw.family_medical_history || '').toLowerCase();

    if (raw.allergies && raw.medical_conditions && raw.family_history) {
      return {
        allergies: {
          medicine: !!raw.allergies.medicine || notesText.includes('medicine allergy'),
          pollens: !!raw.allergies.pollens || notesText.includes('pollen allergy'),
          food: !!raw.allergies.food || notesText.includes('food allergy'),
          stinging_insects: !!raw.allergies.stinging_insects || notesText.includes('stinging insects allergy')
        },
        medical_conditions: {
          error_refraction: !!raw.medical_conditions.error_refraction || otherConditionsText.includes('error of refraction'),
          heart_problem: !!raw.medical_conditions.heart_problem,
          bleeding_disorder: !!raw.medical_conditions.bleeding_disorder,
          hernia: !!raw.medical_conditions.hernia || otherConditionsText.includes('hernia'),
          asthma: !!raw.medical_conditions.asthma,
          anemia: !!raw.medical_conditions.anemia || otherConditionsText.includes('anemia'),
          anxiety_depression: !!raw.medical_conditions.anxiety_depression,
          seizure: !!raw.medical_conditions.seizure
        },
        surgery_hospitalization: !!raw.surgery_hospitalization || otherConditionsText.includes('surgery/hospitalization history'),
        family_history: {
          tuberculosis: !!raw.family_history.tuberculosis,
          cancer: !!raw.family_history.cancer,
          stroke_cardiac: !!raw.family_history.stroke_cardiac,
          diabetes: !!raw.family_history.diabetes,
          hypertension: !!raw.family_history.hypertension,
          depression: !!raw.family_history.depression,
          thyroid: !!raw.family_history.thyroid,
          phobia: !!raw.family_history.phobia
        },
        smoke_exposure: !!raw.smoke_exposure || notesText.includes('smoke exposure')
      };
    }

    return {
      allergies: {
        medicine: notesText.includes('medicine allergy'),
        pollens: notesText.includes('pollen allergy'),
        food: notesText.includes('food allergy'),
        stinging_insects: notesText.includes('stinging insects allergy')
      },
      medical_conditions: {
        error_refraction: otherConditionsText.includes('error of refraction'),
        heart_problem: !!raw.condition_heart_problem,
        bleeding_disorder: !!raw.condition_bleeding_disorder,
        hernia: otherConditionsText.includes('hernia'),
        asthma: !!raw.condition_asthma,
        anemia: otherConditionsText.includes('anemia'),
        anxiety_depression: !!raw.condition_mental_health,
        seizure: !!raw.condition_seizure_disorder
      },
      surgery_hospitalization: otherConditionsText.includes('surgery/hospitalization history'),
      family_history: {
        tuberculosis: familyHistoryText.includes('tuberculosis'),
        cancer: familyHistoryText.includes('cancer'),
        stroke_cardiac: familyHistoryText.includes('stroke/cardiac') || familyHistoryText.includes('stroke') || familyHistoryText.includes('cardiac'),
        diabetes: !!raw.condition_diabetes || familyHistoryText.includes('diabetes'),
        hypertension: !!raw.condition_hypertension || familyHistoryText.includes('hypertension'),
        depression: familyHistoryText.includes('depression'),
        thyroid: familyHistoryText.includes('thyroid'),
        phobia: familyHistoryText.includes('phobia')
      },
      smoke_exposure: notesText.includes('smoke exposure')
    };
  }

  closeQRModal() {
    this.showQRModal = false;
  }

  downloadQRCode() {
    try {
      const canvas = document.querySelector('.qr-modal canvas') as HTMLCanvasElement;
      if (canvas) {
        const url = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = url;
        link.download = `QR_Code_${this.personalInfo.student_number}.png`;
        link.click();
        
        // Mark as downloaded
        const currentUser = this.authService.currentUserValue;
        if (currentUser) {
          localStorage.setItem(`qr_downloaded_${currentUser.user_id}`, 'true');
        }
        
        this.successMessage = 'QR Code downloaded successfully!';
        setTimeout(() => {
          this.successMessage = '';
          this.closeQRModal();
        }, 2000);
      }
    } catch (error) {
      console.error('Error downloading QR code:', error);
      this.error = 'Failed to download QR code';
    }
  }

  private normalizeSeverity(severity: string | undefined): 'mild' | 'moderate' | 'severe' {
    const value = (severity || 'mild').toLowerCase();
    if (value === 'severe') return 'severe';
    if (value === 'moderate') return 'moderate';
    return 'mild';
  }
}