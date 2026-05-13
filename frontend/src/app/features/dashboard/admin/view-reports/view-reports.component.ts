import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../../core/services/admin.service';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Workbook } from 'exceljs';
import { saveAs } from 'file-saver';

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

  exportMenuOpen = false;

  toggleExportMenu(): void {
    this.exportMenuOpen = !this.exportMenuOpen;
  }

  exportReport(format: 'pdf' | 'excel'): void {
    this.exportMenuOpen = false;
    if (format === 'pdf') {
      if (this.activeReport === 'principal-health-trends') {
        this.exportPrincipalReportPdf();
      } else {
        this.exportSummaryPdf();
      }
    } else {
      this.exportGenericExcel();
    }
  }

  private exportSummaryPdf(): void {
    const NAVY: [number, number, number] = [10, 45, 110];
    const BLUE: [number, number, number] = [20, 71, 153];
    const BLUE_MID: [number, number, number] = [180, 205, 245];
    const GRAY: [number, number, number] = [100, 100, 100];
    const DARK: [number, number, number] = [30, 30, 30];
    const WHITE: [number, number, number] = [255, 255, 255];

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 15;
    const printedDate = new Date().toLocaleString('en-PH', { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });

    const logoImg = new Image();
    logoImg.src = 'assets/pdmhs-logo.png';

    const buildPDF = () => {
      try {
        if (logoImg.complete) doc.addImage(logoImg, 'PNG', margin, 11, 18, 18);
      } catch (_) {}

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(...NAVY);
      doc.text('StudentCare+: PDMHS Medical Record System', margin + 22, 16);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.4);
      doc.setTextColor(...GRAY);
      doc.text('President Diosdado Macapagal High School', margin + 22, 21.5);

      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7.2);
      doc.text('8th Street GHQ Village, Katuparan, Taguig, Philippines', margin + 22, 26);

      doc.setDrawColor(...BLUE_MID);
      doc.line(margin, 30.5, pageW - margin, 30.5);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12.2);
      doc.setTextColor(...NAVY);
      doc.text('SYSTEM SUMMARY REPORT', pageW / 2, 36, { align: 'center' });

      doc.setDrawColor(...BLUE_MID);
      doc.line(margin, 40, pageW - margin, 40);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.4);
      doc.setTextColor(...GRAY);
      doc.text(`Printed: ${printedDate}`, pageW - margin, 44, { align: 'right' });
      doc.line(margin, 46, pageW - margin, 46);

      const text = (v: any) => (v === null || v === undefined || v === '' ? 'N/A' : String(v));

      const drawSection = (title: string, lines: Array<[string, string]>, y: number) => {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.2);
        doc.setTextColor(...NAVY);
        doc.text(title, margin, y);
        doc.setDrawColor(...BLUE_MID);
        doc.setLineWidth(0.2);
        doc.line(margin, y + 1.4, pageW - margin, y + 1.4);

        let cy = y + 5;
        lines.forEach(([label, value]) => {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8.1);
          doc.setTextColor(85, 92, 105);
          doc.text(`${label}:`, margin, cy);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(...DARK);
          const valueLines = doc.splitTextToSize(value, pageW - margin - 42);
          doc.text(valueLines, margin + 38, cy);
          cy += Math.max(1, valueLines.length) * 3.5;
        });
        return cy + 1.5;
      };

      let y = 50;
      y = drawSection('USER STATISTICS', [
        ['Total Students', text(this.reportData.total_students)],
        ['Total Advisers', text(this.reportData.total_advisers)],
        ['Total Clinic Staff', text(this.reportData.total_staff)],
        ['Active Users', text(this.reportData.active_users)],
        ['Inactive Users', text(this.reportData.inactive_users)],
      ], y);

      y = drawSection('CLINIC STATISTICS', [
        ['Total Medical Visits', text(this.reportData.total_visits)],
        ['Total Allergies Recorded', text(this.reportData.total_allergies)],
      ], y);

      // Signature area
      doc.setDrawColor(...BLUE_MID);
      doc.line(margin, y, pageW - margin, y);
      y += 4;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.2);
      doc.setTextColor(...NAVY);
      doc.text('APPROVAL & SIGNATURE', margin, y);
      y += 5;
      const lineY = Math.min(y + 4, pageH - 24);
      doc.setDrawColor(140, 150, 165);
      doc.line(margin, lineY, margin + 75, lineY);
      doc.line(pageW - margin - 75, lineY, pageW - margin, lineY);
      doc.setFontSize(7.5);
      doc.setTextColor(...GRAY);
      doc.text('Admin Signature', margin, lineY + 4);
      doc.text('Approved By', pageW - margin - 75, lineY + 4);

      // Footer
      doc.setDrawColor(...BLUE_MID);
      doc.line(margin, pageH - 17, pageW - margin, pageH - 17);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.8);
      doc.setTextColor(...GRAY);
      doc.text(`StudentCare+ | Generated: ${printedDate}`, margin, pageH - 12.5);
      doc.text('Page 1', pageW - margin, pageH - 12.5, { align: 'right' });

      doc.save(`summary-report-${new Date().toISOString().split('T')[0]}.pdf`);
    };

    if (logoImg.complete) {
      buildPDF();
    } else {
      logoImg.onload = () => buildPDF();
      logoImg.onerror = () => buildPDF();
    }
  }

  private exportGenericExcel(): void {
    const wb = new Workbook();
    const ws = wb.addWorksheet(`${this.getReportLabel(this.activeReport)} Report`);
    const label = this.getReportLabel(this.activeReport);
    const generated = new Date().toLocaleString('en-PH');

    const addTitle = (cols: number) => {
      ws.columns = Array(cols).fill(null).map(() => ({ width: 28 }));
      const titleRow = ws.addRow([`${label} Report`]);
      titleRow.font = { bold: true, size: 13, color: { argb: 'FFFFFFFF' } };
      titleRow.alignment = { vertical: 'middle', horizontal: 'center' };
      titleRow.height = 22;
      titleRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0A2D6E' } };
      ws.mergeCells(titleRow.number, 1, titleRow.number, cols);

      const metaRow = ws.addRow([`Generated: ${generated}`]);
      metaRow.font = { italic: true, size: 9, color: { argb: 'FF404040' } };
      ws.mergeCells(metaRow.number, 1, metaRow.number, cols);
      ws.addRow([]);
    };

    const addHeaderRow = (headers: string[]) => {
      const headerRow = ws.addRow(headers);
      headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      headerRow.height = 18;
      headerRow.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF144799' } };
        cell.alignment = { vertical: 'middle' };
      });
    };

    const addDataRow = (values: any[]) => {
      const row = ws.addRow(values);
      row.eachCell(cell => { cell.alignment = { vertical: 'middle', wrapText: true }; });
    };

    if (this.activeReport === 'summary') {
      addTitle(2);
      ws.columns = [{ width: 34 }, { width: 20 }];
      addHeaderRow(['METRIC', 'VALUE']);
      addDataRow(['Total Students', this.reportData.total_students]);
      addDataRow(['Total Advisers', this.reportData.total_advisers]);
      addDataRow(['Total Clinic Staff', this.reportData.total_staff]);
      addDataRow(['Active Users', this.reportData.active_users]);
      addDataRow(['Inactive Users', this.reportData.inactive_users]);
      addDataRow(['Total Medical Visits', this.reportData.total_visits]);
      addDataRow(['Total Allergies Recorded', this.reportData.total_allergies]);

    } else if (this.activeReport === 'users' && Array.isArray(this.reportData)) {
      addTitle(4);
      ws.columns = [{ width: 20 }, { width: 12 }, { width: 12 }, { width: 12 }];
      addHeaderRow(['ROLE', 'TOTAL', 'ACTIVE', 'INACTIVE']);
      this.reportData.forEach((r: any) => addDataRow([r.role, r.total, r.active, r.inactive]));

    } else if (this.activeReport === 'medical' && Array.isArray(this.reportData)) {
      addTitle(4);
      ws.columns = [{ width: 20 }, { width: 16 }, { width: 18 }, { width: 16 }];
      addHeaderRow(['DATE', 'TOTAL VISITS', 'UNIQUE STUDENTS', 'STAFF INVOLVED']);
      this.reportData.forEach((r: any) => addDataRow([new Date(r.date).toLocaleDateString('en-PH'), r.total_visits, r.unique_students, r.staff_involved]));

    } else if (this.activeReport === 'registration' && Array.isArray(this.reportData)) {
      addTitle(3);
      ws.columns = [{ width: 20 }, { width: 18 }, { width: 20 }];
      addHeaderRow(['DATE', 'ROLE', 'NEW REGISTRATIONS']);
      this.reportData.forEach((r: any) => addDataRow([new Date(r.date).toLocaleDateString('en-PH'), r.role, r.count]));

    } else if (this.activeReport === 'allergies' && Array.isArray(this.reportData)) {
      addTitle(3);
      ws.columns = [{ width: 28 }, { width: 16 }, { width: 12 }];
      addHeaderRow(['ALLERGY', 'SEVERITY', 'COUNT']);
      this.reportData.forEach((r: any) => addDataRow([r.allergy, r.severity, r.count]));

    } else if (this.activeReport === 'principal-health-trends' && this.reportData) {
      const s = this.reportData.summary || {};
      const peak = this.reportData.peakSlot;
      const rec = this.reportData.recommendation || {};
      addTitle(2);
      ws.columns = [{ width: 30 }, { width: 40 }];
      addHeaderRow(['METRIC', 'VALUE']);
      addDataRow(['Total Visits', s.totalVisits ?? 0]);
      addDataRow(['Unique Students', s.uniqueStudents ?? 0]);
      addDataRow(['Emergency Visits', s.emergencyVisits ?? 0]);
      addDataRow(['Hospital Referrals', s.hospitalReferrals ?? 0]);
      addDataRow(['Peak Slot', peak ? `${peak.day} ${peak.timeRangeLabel || peak.timeRange} (${peak.visits} visits)` : 'N/A']);
      addDataRow(['Recommendation', rec.title || 'N/A']);
      addDataRow(['Details', rec.details || 'N/A']);
      ws.addRow([]);
      addHeaderRow(['TOP VISIT REASON', 'COUNT']);
      (this.reportData.topReasons || []).forEach((r: any) => addDataRow([r.reason, r.count]));
    }

    wb.xlsx.writeBuffer().then(buffer => {
      saveAs(new Blob([buffer], { type: 'application/octet-stream' }), `${this.activeReport}-report-${new Date().toISOString().split('T')[0]}.xlsx`);
    });
  }

  printReport(): void {
    const reportLabel = this.getReportLabel(this.activeReport);
    const now = new Date().toLocaleString();
    let bodyHtml = '';

    if (this.activeReport === 'summary') {
      bodyHtml = `
        <div class="stats-grid">
          <div class="stat-box"><div class="label">Total Students</div><div class="value">${this.reportData.total_students}</div></div>
          <div class="stat-box"><div class="label">Total Advisers</div><div class="value">${this.reportData.total_advisers}</div></div>
          <div class="stat-box"><div class="label">Total Staff</div><div class="value">${this.reportData.total_staff}</div></div>
          <div class="stat-box"><div class="label">Active Users</div><div class="value">${this.reportData.active_users}</div></div>
          <div class="stat-box"><div class="label">Inactive Users</div><div class="value">${this.reportData.inactive_users}</div></div>
          <div class="stat-box"><div class="label">Total Medical Visits</div><div class="value">${this.reportData.total_visits}</div></div>
          <div class="stat-box"><div class="label">Total Allergies</div><div class="value">${this.reportData.total_allergies}</div></div>
        </div>`;
    } else if (this.activeReport === 'users' && Array.isArray(this.reportData)) {
      const rows = this.reportData.map((r: any) =>
        `<tr><td>${r.role}</td><td>${r.total}</td><td>${r.active}</td><td>${r.inactive}</td></tr>`).join('');
      bodyHtml = `<table><thead><tr><th>Role</th><th>Total</th><th>Active</th><th>Inactive</th></tr></thead><tbody>${rows}</tbody></table>`;
    } else if (this.activeReport === 'medical' && Array.isArray(this.reportData)) {
      const rows = this.reportData.map((r: any) =>
        `<tr><td>${new Date(r.date).toLocaleDateString()}</td><td>${r.total_visits}</td><td>${r.unique_students}</td><td>${r.staff_involved}</td></tr>`).join('');
      bodyHtml = `<table><thead><tr><th>Date</th><th>Total Visits</th><th>Unique Students</th><th>Staff Involved</th></tr></thead><tbody>${rows}</tbody></table>`;
    } else if (this.activeReport === 'registration' && Array.isArray(this.reportData)) {
      const rows = this.reportData.map((r: any) =>
        `<tr><td>${new Date(r.date).toLocaleDateString()}</td><td>${r.role}</td><td>${r.count}</td></tr>`).join('');
      bodyHtml = `<table><thead><tr><th>Date</th><th>Role</th><th>New Registrations</th></tr></thead><tbody>${rows}</tbody></table>`;
    } else if (this.activeReport === 'allergies' && Array.isArray(this.reportData)) {
      const rows = this.reportData.map((r: any) =>
        `<tr><td>${r.allergy}</td><td>${r.severity}</td><td>${r.count}</td></tr>`).join('');
      bodyHtml = `<table><thead><tr><th>Allergy</th><th>Severity</th><th>Count</th></tr></thead><tbody>${rows}</tbody></table>`;
    } else if (this.activeReport === 'principal-health-trends' && this.reportData) {
      const s = this.reportData.summary || {};
      const peak = this.reportData.peakSlot;
      const rec = this.reportData.recommendation || {};
      const reasons = (this.reportData.topReasons || []).map((r: any) =>
        `<tr><td>${r.reason}</td><td>${r.count}</td></tr>`).join('');
      bodyHtml = `
        <div class="stats-grid">
          <div class="stat-box"><div class="label">Total Visits</div><div class="value">${s.totalVisits ?? 0}</div></div>
          <div class="stat-box"><div class="label">Unique Students</div><div class="value">${s.uniqueStudents ?? 0}</div></div>
          <div class="stat-box"><div class="label">Emergency Visits</div><div class="value">${s.emergencyVisits ?? 0}</div></div>
          <div class="stat-box"><div class="label">Hospital Referrals</div><div class="value">${s.hospitalReferrals ?? 0}</div></div>
        </div>
        <p><strong>Peak Slot:</strong> ${peak ? `${peak.day} ${peak.timeRangeLabel || peak.timeRange} (${peak.visits} visits)` : 'N/A'}</p>
        <p><strong>Recommendation:</strong> ${rec.title || 'N/A'} — ${rec.details || ''}</p>
        <h3>Top Visit Reasons</h3>
        <table><thead><tr><th>Reason</th><th>Count</th></tr></thead><tbody>${reasons}</tbody></table>`;
    }

    const dateRange = (this.activeReport !== 'summary' && this.activeReport !== 'users' && this.activeReport !== 'allergies')
      ? `<p class="meta">Period: ${this.startDate} to ${this.endDate}</p>` : '';

    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) return;

    win.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>PDMHS - ${reportLabel} Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 13px; color: #1a1a1a; padding: 2rem; }
    .print-header { text-align: center; border-bottom: 2px solid #052355; padding-bottom: 1rem; margin-bottom: 1.5rem; }
    .print-header h1 { font-size: 1.1rem; color: #052355; text-transform: uppercase; letter-spacing: 1px; }
    .print-header h2 { font-size: 1.4rem; color: #1a1a1a; margin: 0.3rem 0; }
    .meta { color: #555; font-size: 0.85rem; margin-bottom: 1rem; }
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
    .stat-box { border: 1px solid #d0daea; border-radius: 8px; padding: 1rem; text-align: center; }
    .stat-box .label { font-size: 0.8rem; color: #555; margin-bottom: 0.3rem; }
    .stat-box .value { font-size: 1.8rem; font-weight: 700; color: #052355; }
    table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
    th { background: #052355; color: white; padding: 0.6rem 0.8rem; text-align: left; font-size: 0.85rem; }
    td { padding: 0.6rem 0.8rem; border-bottom: 1px solid #e9ecef; }
    tr:nth-child(even) td { background: #f8f9fa; }
    h3 { margin-top: 1.5rem; margin-bottom: 0.5rem; color: #052355; }
    p { margin: 0.4rem 0; }
    .print-footer { margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #e9ecef; font-size: 0.8rem; color: #888; display: flex; justify-content: space-between; }
    @media print { body { padding: 1rem; } }
  </style>
</head>
<body>
  <div class="print-header">
    <h1>President Diosdado Macapagal High School</h1>
    <h2>${reportLabel} Report</h2>
  </div>
  ${dateRange}
  ${bodyHtml}
  <div class="print-footer">
    <span>PDMHS Medical Record System</span>
    <span>Generated: ${now}</span>
  </div>
  <script>window.onload = () => { window.print(); window.onafterprint = () => window.close(); }<\/script>
</body>
</html>`);
    win.document.close();
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
