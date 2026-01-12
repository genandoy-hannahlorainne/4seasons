import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../../core/services/admin.service';

@Component({
  selector: 'app-view-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './view-reports.component.html',
  styleUrls: ['./view-reports.component.scss']
})
export class ViewReportsComponent implements OnInit {
  loading = false;
  activeReport = 'summary';
  reportData: any = null;
  startDate = '';
  endDate = '';
  errorMessage = '';

  reportTypes = [
    { id: 'summary', label: 'Summary', icon: '📊' },
    { id: 'users', label: 'Users', icon: '👥' },
    { id: 'medical', label: 'Medical Records', icon: '🏥' },
    { id: 'registration', label: 'Registrations', icon: '📝' },
    { id: 'allergies', label: 'Allergies', icon: '⚠️' }
  ];

  constructor(private adminService: AdminService) {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    this.startDate = firstDay.toISOString().split('T')[0];
    this.endDate = today.toISOString().split('T')[0];
  }

  ngOnInit(): void {
    this.loadReport('summary');
  }

  selectReport(reportId: string): void {
    this.activeReport = reportId;
    this.loadReport(reportId);
  }

  loadReport(reportType: string): void {
    this.loading = true;
    this.errorMessage = '';

    let observable;
    switch (reportType) {
      case 'summary':
        observable = this.adminService.getSummaryReport();
        break;
      case 'users':
        observable = this.adminService.getUsersReport();
        break;
      case 'medical':
        observable = this.adminService.getMedicalReport(this.startDate, this.endDate);
        break;
      case 'registration':
        observable = this.adminService.getRegistrationReport(this.startDate, this.endDate);
        break;
      case 'allergies':
        observable = this.adminService.getAllergiesReport();
        break;
      default:
        observable = this.adminService.getSummaryReport();
    }

    observable.subscribe({
      next: (response) => {
        if (response.success) {
          this.reportData = response.data;
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading report:', err);
        this.errorMessage = 'Failed to load report';
        this.loading = false;
      }
    });
  }

  refreshReport(): void {
    this.loadReport(this.activeReport);
  }

  exportReport(): void {
    const dataStr = JSON.stringify(this.reportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${this.activeReport}-report-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  printReport(): void {
    window.print();
  }

  getReportLabel(reportId: string): string {
    const report = this.reportTypes.find(r => r.id === reportId);
    return report ? report.label : reportId;
  }

  getReportIcon(reportId: string): string {
    const report = this.reportTypes.find(r => r.id === reportId);
    return report ? report.icon : '📄';
  }
}
