<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=12,14,20&height=200&section=header&text=PDMHS%20Clinic%20Management%20System&fontSize=38&fontColor=ffffff&fontAlignY=38&desc=Student%20Health%20Management%20%C2%B7%20Medical%20Visits%20%C2%B7%20SMS%20Notification&descAlignY=58&descSize=16&descColor=d0fff8&animation=fadeIn"/>

<br/>

![Angular](https://img.shields.io/badge/Angular_20-DD0031?style=for-the-badge&logo=angular&logoColor=white)
![Laravel](https://img.shields.io/badge/Laravel_12-FF2D20?style=for-the-badge&logo=laravel&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL_8-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![PHP](https://img.shields.io/badge/PHP_8.2-777BB4?style=for-the-badge&logo=php&logoColor=white)

<br/>

> **Studentcare+: A Web-Based Clinic Management System with QR Scanning and SMS Notifications at President Diosdado Macapagal High School (PDMHS). Streamlines student health data, medical visits, and health monitoring across multiple user roles.

</div>

<img src="https://capsule-render.vercel.app/api?type=rect&color=gradient&customColorList=12,14,20&height=3" width="100%"/>

<br/>

## 👥 Team

<div align="center">

<table>
  <thead>
    <tr>
      <th>👤 Name</th>
      <th>🎯 Role</th>
      <th>🔗 GitHub</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>HANNAH LORAINNE GENANDOY</td>
      <td>Project Manager / Developer</td>
      <td><a href="https://github.com/genandoy-hannahlorainne"><img src="https://img.shields.io/badge/GitHub-genandoy--hannahlorainne-181717?style=flat-square&logo=github"/></a></td>
    </tr>
    <tr>
      <td>CLARENCE VILLAS</td>
      <td>Tech Lead / Developer</td>
      <td><a href="https://github.com/villas-clarence"><img src="https://img.shields.io/badge/GitHub-villas--clarence-181717?style=flat-square&logo=github"/></a></td>
    </tr>
    <tr>
      <td>MIKKA KETTE ESPARAGOZA</td>
      <td>UI/UX Designer / Developer</td>
      <td><a href="https://github.com/esparagoza-mikkakette"><img src="https://img.shields.io/badge/GitHub-esparagoza--mikkakette-181717?style=flat-square&logo=github"/></a></td>
    </tr>
    <tr>
      <td>KRISLYN JANELLE FRANCISCO</td>
      <td>Document Analyst</td>
      <td><a href="https://github.com/francisco-krislynjanelle"><img src="https://img.shields.io/badge/GitHub-francisco--krislynjanelle-181717?style=flat-square&logo=github"/></a></td>
    </tr>
  </tbody>
</table>

<br/>

📅 &nbsp;**Project Timeline** &nbsp;→&nbsp; [![Gantt Chart](https://img.shields.io/badge/Notion-Gantt%20Chart-000000?style=for-the-badge&logo=notion&logoColor=white)](https://www.notion.so/Gantt-Chart-2b13004cee4780118661f589b1e81092?source=copy_link)

</div>

<br/>
<img src="https://capsule-render.vercel.app/api?type=rect&color=gradient&customColorList=12,14,20&height=3" width="100%"/>

## ✨ Features

<div align="center">

| 🔐 ADMIN | 🏥 CLINIC STAFF | 👨‍🏫 ADVISER | 🎓 STUDENT |
|----------|----------------|------------|-----------|
| User management | Student record search | Class roster management | Personal medical records |
| Section & class management | Medical visit recording | Health monitoring dashboard | SHDF form submission |
| School year & grade promotion | Vitals & diagnosis tracking | Health heatmap & alerts | Visit history |
| Emergency drill management | Medical history tracking | BMI distribution tracking | Wellness streak badges |
| Health risk visualization | Visit statistics | Advisory student management | QR code access |
| System settings & audit logs | Analytics & reports | Notifications | Profile management |
| Semaphore SMS settings | Emergency visit SMS alerts |

</div>

<br/>
<img src="https://capsule-render.vercel.app/api?type=rect&color=gradient&customColorList=12,14,20&height=3" width="100%"/>

## 🛠 Tech Stack

<div align="center">

| Layer | Technology |
|-------|-----------|
| 🎨 Frontend | Angular 20, TypeScript 5.9, RxJS |
| ⚙️ Backend | Laravel 12, PHP 8.2 |
| 🗄️ Database | MySQL 8.0 |
| ⚡ Cache / Sessions | Redis |
| 🔐 Auth | Laravel Sanctum (token-based) |
| 📧 Email | Resend (production), Mailtrap (dev) |
| 🤖 AI Integration | Groq API |
| 📱 SMS | Semaphore SMS Gateway |
| 🐳 Containerization | Docker, Docker Compose |
| 🔀 Reverse Proxy | Nginx |
| 📄 PDF / Excel Export | jsPDF, ExcelJS |
| 📷 QR Code | html5-qrcode, angularx-qrcode |
| 🧪 Testing | Playwright (E2E), PHPUnit |

</div>

<br/>
<img src="https://capsule-render.vercel.app/api?type=rect&color=gradient&customColorList=12,14,20&height=3" width="100%"/>

## 📁 Project Structure

```
4seasons/
├── 📂 backend-laravel/           # Laravel REST API
│   ├── app/
│   │   ├── Http/Controllers/Api/ # API controllers (Admin, Student, Staff...)
│   │   ├── Models/               # Eloquent models
│   │   ├── Services/             # Business logic (SHDF, Groq, Hashid)
│   │   └── Middleware/           # Role & audit middleware
│   ├── database/
│   │   ├── migrations/           # 38 migration files
│   │   └── seeders/
│   └── routes/api.php            # All API routes
│
├── 📂 frontend/                  # Angular SPA
│   ├── src/app/
│   │   ├── features/             # Feature modules per role
│   │   ├── core/                 # Guards, interceptors, services
│   │   └── shared/               # Shared components & pipes
│   └── nginx.conf
│
├── 📂 documents/                 # Project documentation
│   ├── API_DOCUMENTATION.md
│   ├── ERD.md
│   └── USE_CASE.md
│
├── 🐳 docker-compose.local.yml   # Local/dev environment
├── 🐳 docker-compose.prod.yml    # Production environment
└── 📖 README.md
```

<br/>
<img src="https://capsule-render.vercel.app/api?type=rect&color=gradient&customColorList=12,14,20&height=3" width="100%"/>

## 🚀 Getting Started

### Prerequisites

![Docker](https://img.shields.io/badge/Docker-required-2496ED?style=flat-square&logo=docker)
![Git](https://img.shields.io/badge/Git-required-F05032?style=flat-square&logo=git)

### ▶️ Run with Docker (recommended)

```bash
git clone <repo-url>
cd 4seasons

# Copy environment file
cp backend-laravel/.env.example backend-laravel/.env

# Start all services
docker compose -f docker-compose.local.yml up --build
```

Use `docker-compose.prod.yml` for production deployments.

<div align="center">

| Service | URL |
|---------|-----|
| 🌐 Frontend | http://localhost:4200 |
| ⚙️ Backend API | http://localhost:8082/api |
| 🗄️ phpMyAdmin | http://localhost:8081 |
| 📧 MailHog | http://localhost:8025 |

</div>

> Migrations and default seeds (roles, admin, sections) run automatically on first start.

> Emergency clinic visits can trigger an SMS notification to the student's emergency contact through Semaphore when SMS is enabled.

### 📱 SMS Notification Setup

Add the Semaphore values to `backend-laravel/.env`:

```env
SEMAPHORE_ENABLED=false
SEMAPHORE_API_KEY=your_semaphore_api_key_here
SEMAPHORE_SENDER_NAME=SEMAPHORE
```

Set `SEMAPHORE_ENABLED=true` to turn on emergency contact SMS alerts. The sender name must match a registered Semaphore sender name, and `SEMAPHORE` can be used while testing in sandbox mode.

When a clinic staff member records an emergency medical visit, the backend sends the SMS after the visit is saved. The service uses the student's `emergency_contact_phone` first, then falls back to the student's own `phone` if needed.

### 💻 Run Locally (without Docker)

**Backend**
```bash
cd backend-laravel
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

**Frontend**
```bash
cd frontend
npm install
npm start
```

<br/>
<img src="https://capsule-render.vercel.app/api?type=rect&color=gradient&customColorList=12,14,20&height=3" width="100%"/>

## 🔌 API Overview

All protected routes require `Authorization: Bearer <token>` from `POST /api/login`.

<div align="center">

| Prefix | Role | Description |
|--------|------|-------------|
| `/api/admin/*` | Admin | Users, sections, school years, reports, backup |
| `/api/adviser/*` | Adviser | Dashboard, advisory students, health heatmap |
| `/api/staff/*` | Clinic Staff | Students, dashboard, reports |
| `/api/students/*` | All | Medical data, visits, badges |
| `/api/medical-visits/*` | Staff | Visit records |
| `/api/emergency-drills/*` | Admin / Staff | Drill management |
| `/api/shdf/*` | All | Student Health Data Form |

</div>

📖 Full documentation → [`documents/API_DOCUMENTATION.md`](./documents/API_DOCUMENTATION.md)

<br/>
<img src="https://capsule-render.vercel.app/api?type=rect&color=gradient&customColorList=12,14,20&height=3" width="100%"/>

## 🔑 User Roles

<div align="center">

| Role | Access Level |
|------|-------------|
| 🔐 Admin | Full system access |
| 🏥 Clinic Staff | Medical visits and student records |
| 👨‍🏫 Adviser | Class students and health monitoring |
| 🎓 Student | Own medical records and profile |

</div>

<br/>
<img src="https://capsule-render.vercel.app/api?type=rect&color=gradient&customColorList=12,14,20&height=3" width="100%"/>

## 🏫 About

For capstone project use only.
Diploma in Information Technology - 2026.

<br/>

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=12,14,20&height=100&section=footer&text=Made%20with%20%E2%9D%A4%EF%B8%8F%20by%20Team%204seasons&fontSize=16&fontColor=ffffff&fontAlignY=65"/>
