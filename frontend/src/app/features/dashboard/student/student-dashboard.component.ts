import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './student-dashboard.component.html',
  styleUrls: ['./student-dashboard.component.scss']
})
export class StudentDashboardComponent {
  // Student information
  studentId = '123456-2025';
  gradeLevel = 'Grade 10 - HUMSS';
  
  // Info cards data
  bmi = '22.9';
  bloodType = 'O+';
  allergiesCount = '2';
  lastVisit = '09/04/2025';
  
  // Medical information
  height = '160 cm';
  weight = '52 kg';
  age = '16 y/o';
  bmiPercentage = '20.3%';
  
  // Known allergies
  knownAllergies = [
    'Peanut Allergy',
    'Drug Allergy'
  ];
  
  // Immunization records
  immunizationRecords = [
    { name: 'COVID-19', lastDate: 'Aug 2022', status: 'Updated' },
    { name: 'Tetanus', lastDate: 'Jan 2024', status: 'Updated' },
    { name: 'Anti-Rabies', lastDate: 'Nov 2020', status: 'Outdated' }
  ];
}
