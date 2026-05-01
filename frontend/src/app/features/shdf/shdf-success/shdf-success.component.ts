import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-shdf-success',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './shdf-success.component.html',
  styleUrls: ['./shdf-success.component.scss']
})
export class SHDFSuccessComponent implements OnInit, OnDestroy {
  stage: string = '';
  deadline: string = '';
  studentId!: number;
  daysLeft: number = 0;

  // Countdown for comprehensive stage
  countdown: number = 5;
  private countdownInterval?: ReturnType<typeof setInterval>;

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

    // Auto-redirect to dashboard after 5 seconds on comprehensive stage
    if (this.stage === 'comprehensive') {
      this.startCountdown();
    }
  }

  ngOnDestroy(): void {
    this.clearCountdown();
  }

  private startCountdown(): void {
    this.countdown = 5;
    this.countdownInterval = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) {
        this.clearCountdown();
        this.router.navigate(['/dashboard']);
      }
    }, 1000);
  }

  private clearCountdown(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = undefined;
    }
  }

  goToDashboard(): void {
    this.clearCountdown();
    this.router.navigate(['/dashboard']);
  }

  viewShdf(): void {
    this.clearCountdown();
    this.router.navigate(['/dashboard']);
  }

  completeNow(): void {
    this.router.navigate(['/shdf', this.studentId, 'comprehensive']);
  }

  remindLater(): void {
    this.router.navigate(['/dashboard']);
  }
}
