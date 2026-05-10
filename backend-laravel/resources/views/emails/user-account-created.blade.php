<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Your Account Has Been Created - StudentCare+</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: 'Segoe UI', Arial, sans-serif;
            line-height: 1.6;
            color: #334155;
            background-color: #f1f5f9;
        }
        .wrapper {
            max-width: 600px;
            margin: 32px auto;
            background: #ffffff;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 24px rgba(5, 35, 85, 0.10);
        }
        .header {
            background: linear-gradient(135deg, #052355 0%, #5381b2 100%);
            padding: 36px 32px 28px;
            text-align: center;
        }
        .header .logo-text {
            font-size: 26px;
            font-weight: 800;
            color: #ffffff;
            letter-spacing: -0.5px;
        }
        .header .logo-sub {
            font-size: 13px;
            color: rgba(255,255,255,0.75);
            margin-top: 4px;
        }
        .header .badge {
            display: inline-block;
            background: rgba(255,255,255,0.15);
            border: 1px solid rgba(255,255,255,0.3);
            color: #fff;
            font-size: 12px;
            font-weight: 600;
            padding: 4px 14px;
            border-radius: 100px;
            margin-top: 14px;
            letter-spacing: 0.5px;
            text-transform: uppercase;
        }
        .content {
            padding: 36px 32px;
        }
        .greeting {
            font-size: 20px;
            font-weight: 700;
            color: #052355;
            margin-bottom: 12px;
        }
        .intro {
            font-size: 15px;
            color: #475569;
            margin-bottom: 28px;
        }
        .credentials-box {
            background: #f8fafc;
            border: 1.5px solid #e2e8f0;
            border-radius: 12px;
            padding: 24px;
            margin-bottom: 24px;
        }
        .credentials-box h3 {
            font-size: 14px;
            font-weight: 700;
            color: #052355;
            text-transform: uppercase;
            letter-spacing: 0.6px;
            margin-bottom: 16px;
            padding-bottom: 10px;
            border-bottom: 1.5px solid #e2e8f0;
        }
        .credential-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #f1f5f9;
        }
        .credential-row:last-child { border-bottom: none; }
        .credential-label {
            font-size: 13px;
            font-weight: 600;
            color: #64748b;
        }
        .credential-value {
            font-family: 'Courier New', monospace;
            font-size: 14px;
            font-weight: 700;
            background: #ffffff;
            color: #052355;
            padding: 5px 12px;
            border-radius: 6px;
            border: 1.5px solid #cbd5e1;
        }
        .warning-box {
            background: #fffbeb;
            border: 1.5px solid #fcd34d;
            border-left: 4px solid #f59e0b;
            border-radius: 10px;
            padding: 16px 20px;
            margin-bottom: 24px;
        }
        .warning-box h4 {
            font-size: 13px;
            font-weight: 700;
            color: #92400e;
            margin-bottom: 8px;
        }
        .warning-box ul {
            padding-left: 18px;
            font-size: 13px;
            color: #92400e;
        }
        .warning-box ul li { margin-bottom: 4px; }
        .info-section {
            background: #eff6ff;
            border: 1.5px solid #bfdbfe;
            border-radius: 10px;
            padding: 16px 20px;
            margin-bottom: 24px;
        }
        .info-section h3 {
            font-size: 13px;
            font-weight: 700;
            color: #1e40af;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 10px;
        }
        .info-section ul {
            padding-left: 18px;
            font-size: 13px;
            color: #1e40af;
        }
        .info-section ul li { margin-bottom: 4px; }
        .cta-btn {
            display: block;
            text-align: center;
            background: linear-gradient(135deg, #052355, #5381b2);
            color: #ffffff;
            text-decoration: none;
            font-size: 15px;
            font-weight: 700;
            padding: 14px 28px;
            border-radius: 10px;
            margin: 24px 0;
        }
        .sign-off {
            font-size: 14px;
            color: #475569;
            margin-top: 8px;
        }
        .sign-off strong { color: #052355; }
        .footer {
            background: #f8fafc;
            border-top: 1.5px solid #e2e8f0;
            text-align: center;
            padding: 20px 32px;
            font-size: 12px;
            color: #94a3b8;
        }
        .footer a { color: #5381b2; text-decoration: none; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="header">
            <div class="logo-text">StudentCare+</div>
            <div class="logo-sub">President Diosdado Macapagal High School</div>
            <div class="badge">Account Created</div>
        </div>

        <div class="content">
            <div class="greeting">
                Hello, {{ $userData['full_name'] ?? (($userData['first_name'] ?? '') . ' ' . ($userData['last_name'] ?? '')) }}!
            </div>
            <p class="intro">
                Your <strong>{{ ucfirst(str_replace('_', ' ', $role)) }}</strong> account has been created on the StudentCare+ Clinic Management System.
                Use the credentials below to log in for the first time.
            </p>

            <div class="credentials-box">
                <h3>🔐 Your Login Credentials</h3>
                <div class="credential-row">
                    <span class="credential-label">Username</span>
                    <span class="credential-value">{{ $userData['username'] }}</span>
                </div>
                <div class="credential-row">
                    <span class="credential-label">Temporary Password</span>
                    <span class="credential-value">{{ $tempPassword }}</span>
                </div>
                <div class="credential-row">
                    <span class="credential-label">Role</span>
                    <span class="credential-value">{{ ucfirst(str_replace('_', ' ', $role)) }}</span>
                </div>
            </div>

            <div class="warning-box">
                <h4>⚠️ Important Security Notice</h4>
                <ul>
                    <li>You <strong>must change your password</strong> on your first login.</li>
                    <li>Do not share your credentials with anyone.</li>
                    <li>Contact the system administrator if you have trouble logging in.</li>
                </ul>
            </div>

            @if($role === 'student')
            <div class="info-section">
                <h3>📋 Student Information</h3>
                <ul>
                    <li><strong>Student Number:</strong> {{ $userData['student_number'] ?? 'N/A' }}</li>
                    <li><strong>Grade &amp; Section:</strong> {{ $userData['grade_section'] ?? 'N/A' }}</li>
                    <li><strong>Email:</strong> {{ $userData['email'] ?? 'N/A' }}</li>
                </ul>
            </div>
            @endif

            @if($role === 'adviser')
            <div class="info-section">
                <h3>👨‍🏫 Faculty Information</h3>
                <ul>
                    <li><strong>Employee Number:</strong> {{ $userData['employee_number'] ?? 'N/A' }}</li>
                    <li><strong>Email:</strong> {{ $userData['email'] ?? 'N/A' }}</li>
                </ul>
            </div>
            @endif

            @if($role === 'clinic_staff')
            <div class="info-section">
                <h3>🏥 Clinic Staff Information</h3>
                <ul>
                    <li><strong>Staff Code:</strong> {{ $userData['staff_code'] ?? 'N/A' }}</li>
                    <li><strong>Position:</strong> {{ $userData['position'] ?? 'N/A' }}</li>
                    <li><strong>Email:</strong> {{ $userData['email'] ?? 'N/A' }}</li>
                </ul>
            </div>
            @endifw

            <a href="https://studentcare.site" class="cta-btn">Login to StudentCare+</a>

            <p class="sign-off">
                If you have any questions, contact the IT administrator.<br><br>
                Best regards,<br>
                <strong>StudentCare+ Capstone Team</strong><br>
                President Diosdado Macapagal High School
            </p>
        </div>

        <div class="footer">
            <p>This is an automated message. Please do not reply to this email.</p>
            <p style="margin-top:6px;">&copy; {{ date('Y') }} StudentCare+ &mdash; PDMHS Clinic Management System. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
