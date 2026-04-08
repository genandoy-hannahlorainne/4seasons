import { Component, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-developers',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './developers.component.html',
  styleUrls: ['./developers.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class DevelopersComponent {
  developers = [
    { name: 'Esparagoza', role: 'Full Stack Developer', image: 'assets/developers/esparagoza.jpg' },
    { name: 'Francisco',  role: 'Full Stack Developer', image: 'assets/developers/francisco.jpg' },
    { name: 'Genandoy',   role: 'Full Stack Developer', image: 'assets/developers/genandoy.jpg' },
    { name: 'Villas',     role: 'Full Stack Developer', image: 'assets/developers/villas.jpg' },
  ];
}
