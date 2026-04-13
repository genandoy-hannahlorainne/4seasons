import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-staff-notifications',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="notifications-page">
      <div class="page-header">
        <h1>Notifications Center</h1>
        <p>Send and manage notifications to advisers</p>
      </div>

      <!-- Tabs -->
      <div class="tabs">
        <button class="tab" [class.active]="activeTab === 'send'" (click)="activeTab = 'send'">Send Notification</button>
        <button class="tab" [class.active]="activeTab === 'history'" (click)="activeTab = 'history'">History</button>
        <button class="tab" [class.active]="activeTab === 'pending'" (click)="activeTab = 'pending'">Pending ({{ pendingCount }})</button>
      </div>

      <!-- Send Notification Tab -->
      <div class="card" *ngIf="activeTab === 'send'">
        <div class="form-section">
          <h3>Recipient</h3>
          <div class="form-group">
            <label>Select Adviser *</label>
            <select [(ngModel)]="notification.adviserId" class="form-control">
              <option value="">Select an adviser</option>
              <option *ngFor="let adviser of advisers" [value]="adviser.id">
                {{ adviser.name }} (Grade {{ adviser.gradeLevel }} - {{ adviser.section }})
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>Related Student (Optional)</label>
            <input type="text" [(ngModel)]="studentSearch" placeholder="Search student..." class="form-control">
          </div>
        </div>

        <div class="form-section">
          <h3>Message</h3>
          <div class="form-group">
            <label>Subject *</label>
            <input type="text" [(ngModel)]="notification.subject" class="form-control" placeholder="e.g., Clinic Visit - Fever Symptoms">
          </div>
          <div class="form-group">
            <label>Priority</label>
            <div class="priority-options">
              <label class="priority-option">
                <input type="radio" [(ngModel)]="notification.priority" value="normal">
                <span class="priority-badge normal">Normal</span>
              </label>
              <label class="priority-option">
                <input type="radio" [(ngModel)]="notification.priority" value="urgent">
                <span class="priority-badge urgent">Urgent</span>
              </label>
            </div>
          </div>
          <div class="form-group">
            <label>Message *</label>
            <textarea [(ngModel)]="notification.message" class="form-control" rows="6" placeholder="Enter your message..."></textarea>
          </div>
        </div>

        <div class="form-section">
          <h3>Delivery Method</h3>
          <div class="checkbox-group">
            <label class="checkbox-label">
              <input type="checkbox" [(ngModel)]="notification.sendInApp">
              <span>In-App Notification</span>
            </label>
            <label class="checkbox-label">
              <input type="checkbox" [(ngModel)]="notification.sendEmail">
              <span>Email</span>
            </label>
            <label class="checkbox-label">
              <input type="checkbox" [(ngModel)]="notification.sendSMS">
              <span>SMS</span>
            </label>
          </div>
        </div>

        <div class="form-actions">
          <button class="btn btn-secondary" (click)="resetForm()">Clear</button>
          <button class="btn btn-primary" (click)="sendNotification()" [disabled]="sending">
            {{ sending ? 'Sending...' : 'Send Notification' }}
          </button>
        </div>
      </div>

      <!-- History Tab -->
      <div class="card" *ngIf="activeTab === 'history'">
        <div class="empty-state" *ngIf="notificationHistory.length === 0">
          <div class="empty-title">No Notifications Sent</div>
          <div class="empty-text">Your sent notifications will appear here</div>
        </div>
      </div>

      <!-- Pending Tab -->
      <div class="card" *ngIf="activeTab === 'pending'">
        <div class="empty-state" *ngIf="pendingNotifications.length === 0">
          <div class="empty-title">No Pending Notifications</div>
          <div class="empty-text">All notifications have been sent</div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .notifications-page {
      padding: 2rem;
      background: #f0f4f8;
      min-height: 100vh;
    }

    .page-header {
      margin-bottom: 2rem;
      background: linear-gradient(135deg, #052355 0%, #5381b2 100%);
      padding: 2rem 1.5rem;
      border-radius: 12px;
      box-shadow: 0 4px 16px rgba(5, 35, 85, 0.25);
      
      h1 { 
        font-size: 2rem; 
        color: #ffffff; 
        margin-bottom: 0.5rem; 
        font-weight: 700; 
      }
      p { 
        color: rgba(255, 255, 255, 0.8); 
        font-size: 1.1rem; 
        margin: 0; 
      }
    }

    .tabs {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1.5rem;
      background: white;
      padding: 0.5rem;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);

      .tab {
        padding: 0.75rem 1.5rem;
        border: none;
        background: transparent;
        color: #6c757d;
        cursor: pointer;
        border-radius: 8px;
        font-weight: 500;
        transition: all 0.2s ease;

        &:hover { background: #f8f9fa; }
        &.active { background: #007bff; color: white; }
      }
    }

    .card {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }

    .form-section {
      margin-bottom: 1.5rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid #e9ecef;

      &:last-of-type { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
      h3 { color: #052355; margin: 0 0 1rem; font-size: 1.1rem; font-weight: 600; }
    }

    .form-group {
      margin-bottom: 1rem;

      label { display: block; margin-bottom: 0.5rem; font-weight: 500; color: #2c3e50; }

      .form-control {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid #e9ecef;
        border-radius: 8px;
        font-size: 1rem;
        box-sizing: border-box;
        &:focus { outline: none; border-color: #007bff; }
      }

      textarea.form-control { resize: vertical; }
    }

    .priority-options { display: flex; gap: 1rem; }

    .priority-option {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;

      input { display: none; }
      .priority-badge {
        padding: 0.5rem 1rem;
        border-radius: 20px;
        font-size: 0.9rem;
        border: 2px solid transparent;

        &.normal { background: #e3f2fd; color: #1976d2; }
        &.urgent { background: #ffebee; color: #c62828; }
      }

      input:checked + .priority-badge {
        &.normal { border-color: #1976d2; }
        &.urgent { border-color: #c62828; }
      }
    }

    .checkbox-group {
      display: flex;
      gap: 1.5rem;

      .checkbox-label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        cursor: pointer;

        input { width: 18px; height: 18px; }
      }
    }

    .form-actions {
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
      margin-top: 1.5rem;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.2s ease;

      &.btn-primary { background: #007bff; color: white; &:hover { background: #0056b3; } }
      &.btn-secondary { background: #6c757d; color: white; &:hover { background: #545b62; } }
      &:disabled { opacity: 0.6; cursor: not-allowed; }
    }

    .empty-state {
      text-align: center;
      padding: 4rem 2rem;

      .empty-title { font-size: 1.3rem; font-weight: 600; color: #2c3e50; margin-bottom: 0.5rem; }
      .empty-text { color: #7f8c8d; }
    }
  `]
})
export class StaffNotificationsComponent implements OnInit {
  activeTab = 'send';
  sending = false;
  studentSearch = '';

  notification = {
    adviserId: '',
    subject: '',
    message: '',
    priority: 'normal',
    sendInApp: true,
    sendEmail: false,
    sendSMS: false
  };

  advisers: any[] = [];
  notificationHistory: any[] = [];
  pendingNotifications: any[] = [];

  get pendingCount(): number {
    return this.pendingNotifications.length;
  }

  ngOnInit(): void {}

  sendNotification(): void {
    if (!this.notification.adviserId || !this.notification.subject || !this.notification.message) {
      alert('Please fill in all required fields');
      return;
    }

    this.sending = true;
    setTimeout(() => {
      this.sending = false;
      alert('Notification sent successfully!');
      this.resetForm();
    }, 1000);
  }

  resetForm(): void {
    this.notification = {
      adviserId: '',
      subject: '',
      message: '',
      priority: 'normal',
      sendInApp: true,
      sendEmail: false,
      sendSMS: false
    };
    this.studentSearch = '';
  }
}
