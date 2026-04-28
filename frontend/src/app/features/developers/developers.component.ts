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
    {
      name: 'Hannah Lorainne Genandoy',
      role: 'Project Manager / Developer',
      github: 'https://github.com/genandoy-hannahlorainne',
      githubHandle: 'genandoy-hannahlorainne',
      image: 'assets/developers/genandoy.jpg'
    },
    {
      name: 'Clarence Villas',
      role: 'Tech Lead / Developer',
      github: 'https://github.com/villas-clarence',
      githubHandle: 'villas-clarence',
      image: 'assets/developers/villas.jpg'
    },
    {
      name: 'Mikka Kette Esparagoza',
      role: 'UI/UX Designer / Developer',
      github: 'https://github.com/esparagoza-mikkakette',
      githubHandle: 'esparagoza-mikkakette',
      image: 'assets/developers/esparagoza.jpg'
    },
    {
      name: 'Krislyn Janelle Francisco',
      role: 'System Analyst / Document Analyst',
      github: 'https://github.com/francisco-krislynjanelle',
      githubHandle: 'francisco-krislynjanelle',
      image: 'assets/developers/francisco.jpg'
    },
  ];
}
