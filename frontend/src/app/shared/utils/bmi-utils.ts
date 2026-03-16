/**
 * BMI Utility Functions
 * Provides safe BMI calculation and formatting methods
 */

export class BMIUtils {
  /**
   * Safely format BMI value to 1 decimal place
   * @param bmi - BMI value (number, string, or any)
   * @returns Formatted BMI string or '--' if invalid
   */
  static formatBMI(bmi: any): string {
    if (!bmi && bmi !== 0) return '--';
    
    let bmiValue: number;
    
    if (typeof bmi === 'string') {
      bmiValue = parseFloat(bmi);
    } else if (typeof bmi === 'number') {
      bmiValue = bmi;
    } else {
      return '--';
    }
    
    if (isNaN(bmiValue) || !isFinite(bmiValue) || bmiValue < 0 || bmiValue > 100) {
      return '--';
    }
    
    return bmiValue.toFixed(1);
  }

  /**
   * Calculate BMI from height and weight
   * @param heightCm - Height in centimeters
   * @param weightKg - Weight in kilograms
   * @returns BMI value or null if invalid inputs
   */
  static calculateBMI(heightCm: number | string, weightKg: number | string): number | null {
    const height = typeof heightCm === 'string' ? parseFloat(heightCm) : heightCm;
    const weight = typeof weightKg === 'string' ? parseFloat(weightKg) : weightKg;
    
    if (isNaN(height) || isNaN(weight) || height <= 0 || weight <= 0) {
      return null;
    }
    
    const heightInMeters = height / 100;
    const bmi = weight / (heightInMeters * heightInMeters);
    
    if (isNaN(bmi) || !isFinite(bmi)) {
      return null;
    }
    
    return Math.round(bmi * 10) / 10; // Round to 1 decimal place
  }

  /**
   * Get BMI category based on BMI value
   * @param bmi - BMI value
   * @returns BMI category string
   */
  static getBMICategory(bmi: number | string): string {
    const bmiValue = typeof bmi === 'string' ? parseFloat(bmi) : bmi;
    
    if (isNaN(bmiValue) || !isFinite(bmiValue)) {
      return '';
    }
    
    if (bmiValue < 18.5) return 'Underweight';
    if (bmiValue < 25) return 'Normal weight';
    if (bmiValue < 30) return 'Overweight';
    return 'Obese';
  }

  /**
   * Get BMI status color for UI display
   * @param bmi - BMI value
   * @returns CSS color class or hex color
   */
  static getBMIStatusColor(bmi: number | string): string {
    const bmiValue = typeof bmi === 'string' ? parseFloat(bmi) : bmi;
    
    if (isNaN(bmiValue) || !isFinite(bmiValue)) {
      return '#6c757d'; // Gray for unknown
    }
    
    if (bmiValue < 18.5) return '#17a2b8'; // Blue for underweight
    if (bmiValue < 25) return '#28a745';   // Green for normal
    if (bmiValue < 30) return '#ffc107';   // Yellow for overweight
    return '#dc3545'; // Red for obese
  }

  /**
   * Validate if BMI value is within reasonable range
   * @param bmi - BMI value to validate
   * @returns true if BMI is valid and reasonable
   */
  static isValidBMI(bmi: any): boolean {
    const bmiValue = typeof bmi === 'string' ? parseFloat(bmi) : bmi;
    
    return typeof bmiValue === 'number' && 
           !isNaN(bmiValue) && 
           isFinite(bmiValue) && 
           bmiValue >= 10 && 
           bmiValue <= 60; // Reasonable BMI range
  }
}