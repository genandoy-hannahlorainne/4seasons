import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../../core/services/admin.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  selectedQuarter = 1;
  selectedYear = new Date().getFullYear();
  quarterOptions = [
    { value: 1, label: 'Q1 (Jan-Mar)' },
    { value: 2, label: 'Q2 (Apr-Jun)' },
    { value: 3, label: 'Q3 (Jul-Sep)' },
    { value: 4, label: 'Q4 (Oct-Dec)' }
  ];
  errorMessage = '';

  reportTypes = [
    { id: 'summary', label: 'Summary', icon: 'fa-solid fa-chart-column' },
    { id: 'users', label: 'Users', icon: 'fa-solid fa-users' },
    { id: 'medical', label: 'Medical Records', icon: 'fa-solid fa-notes-medical' },
    { id: 'registration', label: 'Registrations', icon: 'fa-solid fa-user-plus' },
    { id: 'allergies', label: 'Allergies', icon: 'fa-solid fa-triangle-exclamation' },
    { id: 'principal-health-trends', label: 'Principal Health Trends', icon: 'fa-solid fa-file-pdf' }
  ];

  constructor(private adminService: AdminService) {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    this.startDate = firstDay.toISOString().split('T')[0];
    this.endDate = today.toISOString().split('T')[0];
    this.selectedQuarter = Math.ceil((today.getMonth() + 1) / 3);
    this.selectedYear = today.getFullYear();
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
      case 'principal-health-trends':
        observable = this.adminService.getPrincipalHealthTrendReport({
          year: this.selectedYear,
          quarter: this.selectedQuarter
        });
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
        // Error loading report
        this.errorMessage = 'Failed to load report';
        this.loading = false;
      }
    });
  }

  refreshReport(): void {
    this.loadReport(this.activeReport);
  }

  setCurrentQuarter(): void {
    const now = new Date();
    this.selectedQuarter = Math.ceil((now.getMonth() + 1) / 3);
    this.selectedYear = now.getFullYear();
    if (this.activeReport === 'principal-health-trends') {
      this.refreshReport();
    }
  }

  setPreviousQuarter(): void {
    const now = new Date();
    const currentQuarter = Math.ceil((now.getMonth() + 1) / 3);
    if (currentQuarter === 1) {
      this.selectedQuarter = 4;
      this.selectedYear = now.getFullYear() - 1;
    } else {
      this.selectedQuarter = currentQuarter - 1;
      this.selectedYear = now.getFullYear();
    }

    if (this.activeReport === 'principal-health-trends') {
      this.refreshReport();
    }
  }

  exportReport(): void {
    if (this.activeReport === 'principal-health-trends') {
      this.exportPrincipalReportPdf();
      return;
    }

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

  getReportIconClass(reportId: string): string {
    const report = this.reportTypes.find(r => r.id === reportId);
    return report ? report.icon : 'fa-solid fa-file-lines';
  }

  private exportPrincipalReportPdf(): void {
    if (!this.reportData) {
      return;
    }

    const reportMeta = this.reportData.reportMeta || {};
    const summary = this.reportData.summary || {};
    const peakSlot = this.reportData.peakSlot || null;
    const recommendation = this.reportData.recommendation || {};
    const topReasons = Array.isArray(this.reportData.topReasons) ? this.reportData.topReasons : [];
    const dayHour = Array.isArray(this.reportData.visitsByDayHour) ? this.reportData.visitsByDayHour : [];

    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text('Quarterly School Clinic Health Trend Report', 14, 18);
    doc.setFontSize(10);
    doc.text(`Period: ${reportMeta.periodStart || this.startDate} to ${reportMeta.periodEnd || this.endDate}`, 14, 26);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 32);
    doc.text(`Prepared by: ${reportMeta.preparedBy || 'Admin'}`, 14, 38);

    autoTable(doc, {
      startY: 44,
      head: [['Summary Metric', 'Value']],
      body: [
        ['Total Visits', String(summary.totalVisits ?? 0)],
        ['Unique Students', String(summary.uniqueStudents ?? 0)],
        ['Emergency Visits', String(summary.emergencyVisits ?? 0)],
        ['Hospital Referrals', String(summary.hospitalReferrals ?? 0)]
      ],
      theme: 'grid',
      headStyles: { fillColor: [52, 152, 219] }
    });

    const peakY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.text('Peak Slot Analysis', 14, peakY);
    doc.setFontSize(10);
    doc.text(
      peakSlot
        ? `${peakSlot.day}, ${peakSlot.timeRangeLabel || peakSlot.timeRange} (${peakSlot.visits} visits)`
        : 'No peak slot data available for selected period.',
      14,
      peakY + 6
    );

    const recY = peakY + 16;
    doc.setFontSize(12);
    doc.text('Recommended Action', 14, recY);
    doc.setFontSize(10);
    doc.text(`${recommendation.title || 'No recommendation available'}`, 14, recY + 6);
    doc.text(`${recommendation.details || ''}`, 14, recY + 12, { maxWidth: 180 });

    const reasonsY = recY + 26;
    autoTable(doc, {
      startY: reasonsY,
      head: [['Top Visit Reasons', 'Count']],
      body: topReasons.length > 0
        ? topReasons.map((row: any) => [row.reason || 'Unspecified', String(row.count || 0)])
        : [['No data available', '-']],
      theme: 'striped',
      headStyles: { fillColor: [46, 204, 113] }
    });

    const heatmapY = (doc as any).lastAutoTable.finalY + 8;
    autoTable(doc, {
      startY: heatmapY,
      head: [['Day', 'Time Slot', 'Visits']],
      body: dayHour.length > 0
        ? dayHour.slice(0, 20).map((row: any) => [row.day || '-', row.timeRangeLabel || row.timeRange || '-', String(row.visits || 0)])
        : [['No data available', '-', '-']],
      theme: 'striped',
      headStyles: { fillColor: [155, 89, 182] }
    });

    const pageCount = (doc as any).internal.getNumberOfPages();
    doc.setFontSize(8);
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.text(`Page ${i} of ${pageCount}`, 190, 287, { align: 'right' });
    }

    const filename = `principal-health-trends-${reportMeta.periodStart || this.startDate}-to-${reportMeta.periodEnd || this.endDate}.pdf`;
    doc.save(filename);
  }
}
