import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-shdf-success',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './shdf-success.component.html',
  styleUrls: ['./shdf-success.component.scss']
})
export class SHDFSuccessComponent implements OnInit {
  stage: string = '';
  deadline: string = '';
  studentId!: number;
  daysLeft: number = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.studentId = Number(this.route.snapshot.paramMap.get('studentId'));
    this.stage = this.route.snapshot.queryParamMap.get('stage') || '';
    this.deadline = this.route.snapshot.queryParamMap.get('deadline') || '';

    if (this.deadline) {
      const deadlineDate = new Date(this.deadline);
      const today = new Date();
      this.daysLeft = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    }
  }

  goToDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  completeNow(): void {
    this.router.navigate(['/shdf', this.studentId, 'comprehensive']);
  }

  remindLater(): void {
    this.router.navigate(['/dashboard']);
  }
}
