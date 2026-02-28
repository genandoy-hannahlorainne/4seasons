<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Account Created - Medical Record System</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background-color: #2c5aa0;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
        }
        .content {
            background-color: #f9f9f9;
            padding: 30px;
            border-radius: 0 0 8px 8px;
        }
        .credentials {
            background-color: #e8f4fd;
            border: 1px solid #bee5eb;
            border-radius: 5px;
            padding: 20px;
            margin: 20px 0;
        }
        .credentials h3 {
            margin-top: 0;
            color: #0c5460;
        }
        .credential-item {
            margin: 10px 0;
            font-size: 16px;
        }
        .credential-label {
            font-weight: bold;
            color: #495057;
        }
        .credential-value {
            font-family: 'Courier New', monospace;
            background-color: #fff;
            padding: 5px 10px;
            border-radius: 3px;
            border: 1px solid #dee2e6;
            display: inline-block;
            margin-left: 10px;
        }
        .warning {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 5px;
            padding: 15px;
            margin: 20px 0;
        }
        .warning h4 {
            margin-top: 0;
            color: #856404;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #dee2e6;
            color: #6c757d;
            font-size: 14px;
        }
        .btn {
            display: inline-block;
            padding: 12px 24px;
            background-color: #28a745;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Welcome to Medical Record System</h1>
        <p>Your account has been successfully created</p>
    </div>
    
    <div class="content">
        <h2>Hello {{ $userData['full_name'] ?? $userData['first_name'] . ' ' . $userData['last_name'] }},</h2>
        
        <p>Your {{ ucfirst($role) }} account has been created for the Medical Record System. You can now access the system using the credentials below.</p>
        
        <div class="credentials">
            <h3>🔐 Your Login Credentials</h3>
            <div class="credential-item">
                <span class="credential-label">Username:</span>
                <span class="credential-value">{{ $userData['username'] }}</span>
            </div>
            <div class="credential-item">
                <span class="credential-label">Temporary Password:</span>
                <span class="credential-value">{{ $tempPassword }}</span>
            </div>
            <div class="credential-item">
                <span class="credential-label">Role:</span>
                <span class="credential-value">{{ ucfirst($role) }}</span>
            </div>
        </div>
        
        <div class="warning">
            <h4>⚠️ Important Security Notice</h4>
            <ul>
                <li><strong>You must change your password</strong> on your first login</li>
                <li>Keep your login credentials secure and do not share them</li>
                <li>If you have any issues logging in, contact the system administrator</li>
            </ul>
        </div>
        
        <p><strong>System Access URL:</strong> <a href="{{ config('app.url') }}">{{ config('app.url') }}</a></p>
        
        @if($role === 'student')
        <h3>📋 Student Information</h3>
        <ul>
            <li><strong>Student Number:</strong> {{ $userData['student_number'] ?? 'N/A' }}</li>
            <li><strong>Grade & Section:</strong> {{ $userData['grade_section'] ?? 'N/A' }}</li>
            <li><strong>Email:</strong> {{ $userData['email'] ?? 'N/A' }}</li>
        </ul>
        @endif
        
        @if($role === 'adviser')
        <h3>👨‍🏫 Faculty Information</h3>
        <ul>
            <li><strong>Employee Number:</strong> {{ $userData['employee_number'] ?? 'N/A' }}</li>
            <li><strong>Email:</strong> {{ $userData['email'] ?? 'N/A' }}</li>
        </ul>
        @endif
        
        @if($role === 'clinic_staff')
        <h3>🏥 Clinic Staff Information</h3>
        <ul>
            <li><strong>Staff Code:</strong> {{ $userData['staff_code'] ?? 'N/A' }}</li>
            <li><strong>Position:</strong> {{ $userData['position'] ?? 'N/A' }}</li>
            <li><strong>Email:</strong> {{ $userData['email'] ?? 'N/A' }}</li>
        </ul>
        @endif
        
        <p>If you have any questions or need assistance, please contact the system administrator.</p>
        
        <p>Best regards,<br>
        <strong>Medical Record System Team</strong></p>
    </div>
    
    <div class="footer">
        <p>This is an automated message. Please do not reply to this email.</p>
        <p>&copy; {{ date('Y') }} Medical Record System. All rights reserved.</p>
    </div>
</body>
</html>