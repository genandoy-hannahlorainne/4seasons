import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-visit-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="visit-list-container">
      <h2>Medical Visits</h2>
      <p>Medical visits management coming soon...</p>
    </div>
  `,
  styles: [`
    .visit-list-container {
      padding: 2rem;
    }
  `]
})
export class VisitListComponent {}
