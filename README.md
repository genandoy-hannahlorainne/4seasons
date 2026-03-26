<div align="center">

<svg width="800" height="120" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#8bfde4;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#4fd1c5;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="800" height="120" rx="16" fill="url(#grad)"/>
  <text x="400" y="58" font-family="Segoe UI, Arial, sans-serif" font-size="32" font-weight="bold" fill="#0d3d36" text-anchor="middle">PDMHS Medical Record System</text>
  <text x="400" y="92" font-family="Segoe UI, Arial, sans-serif" font-size="15" fill="#0d3d36" text-anchor="middle">Student Health Management · Medical Visits · Emergency Drills</text>
</svg>

<br/>

![Angular](https://img.shields.io/badge/Angular_20-DD0031?style=for-the-badge&logo=angular&logoColor=white)
![Laravel](https://img.shields.io/badge/Laravel_12-FF2D20?style=for-the-badge&logo=laravel&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL_8-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)

</div>

<br/>

> A web-based medical record management system for PDMHS, designed to streamline student health data, medical visits, emergency drills, and health monitoring across multiple user roles.

<img src="https://capsule-render.vercel.app/api?type=rect&color=8bfde4&height=4&section=header" width="100%"/>

## 👥 Team

<table>
  <tr>
    <th style="background-color:#8bfde4">Name</th>
    <th style="background-color:#8bfde4">Role</th>
  </tr>
  <tr><td>Hannah Lorainne M. Genandoy</td><td>Project Manager / Developer</td></tr>
  <tr><td>Clarence F. Villas</td><td>Tech Lead / Developer</td></tr>
  <tr><td>Mikka Esparagoza</td><td>UI/UX Designer / Developer</td></tr>
  <tr><td>Krislyn Janelle Francisco</td><td>System Analyst / Document Analyst</td></tr>
</table>

<img src="https://capsule-render.vercel.app/api?type=rect&color=8bfde4&height=4&section=header" width="100%"/>

## ✨ Features

<details>
<summary><b>🔐 Admin</b></summary>

- User management (create, update, deactivate, bulk CSV import)
- Section and class management with adviser assignment
- School year management and grade promotion
- Emergency drill management with QR code scanning
- Health risk visualization and reporting
- System settings, audit logs, and backup & recovery

</details>

<details>
<summary><b>🏥 Clinic Staff</b></summary>

- Student record search and management
- Medical visit recording (vitals, diagnosis, treatment, chief complaint)
- Medical history tracking
- Visit statistics and analytics

</details>

<details>
<summary><b>📋 Adviser (Teacher)</b></summary>

- Class roster and advisory student management
- Health monitoring dashboard and heatmap
- Student health alerts and BMI distribution tracking

</details>

<details>
<summary><b>🎓 Student</b></summary>

- Personal medical records and visit history
- SHDF (Student Health Data Form) submission
- Streak badge system for health engagement

</details>

<img src="https://capsule-render.vercel.app/api?type=rect&color=8bfde4&height=4&section=header" width="100%"/>

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Angular 20, TypeScript 5.9, RxJS |
| Backend | Laravel 12, PHP 8.2 |
| Database | MySQL 8.0 |
| Cache / Sessions | Redis |
| Auth | Laravel Sanctum (token-based) |
| Email | Resend (production), Mailtrap (dev) |
| AI Integration | Groq API |
| Containerization | Docker, Docker Compose |
| Reverse Proxy | Nginx |
| PDF / Excel Export | jsPDF, ExcelJS |
| QR Code | html5-qrcode, angularx-qrcode |
| Testing | Playwright (E2E), PHPUnit |

<img src="https://capsule-render.vercel.app/api?type=rect&color=8bfde4&height=4&section=header" width="100%"/>

## 📁 Project Structure

```
├── backend-laravel/          # Laravel REST API
│   ├── app/
│   │   ├── Http/Controllers/Api/   # API controllers
│   │   ├── Models/                 # Eloquent models
│   │   ├── Services/               # Business logic
│   │   └── Middleware/             # Role & audit middleware
│   ├── database/
│   │   ├── migrations/
│   │   └── seeders/
│   └── routes/api.php
│
├── frontend/                 # Angular SPA
│   ├── src/app/
│   │   ├── features/               # Feature modules
│   │   ├── core/                   # Guards, interceptors, services
│   │   └── shared/                 # Shared components
│   └── nginx.conf
│
├── docker-compose.yml        # Dev environment
├── AWS_DEPLOYMENT.md         # Production deployment guide
└── USER_MANUAL.md            # End-user documentation
```

<img src="https://capsule-render.vercel.app/api?type=rect&color=8bfde4&height=4&section=header" width="100%"/>

## 🚀 Getting Started

### Prerequisites

- [Docker](https://www.docker.com/) and Docker Compose
- Git

### Run with Docker (recommended)

```bash
git clone <repo-url>
cd <project-folder>

# Copy and configure environment
cp backend-laravel/.env.example backend-laravel/.env

# Start all services
docker compose up --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:4200 |
| Backend API | http://localhost:8082/api |
| phpMyAdmin | http://localhost:8081 |
| MailHog (email UI) | http://localhost:8025 |

> The backend will automatically run migrations and seed default roles, admin, and sections on first start.

### Run Locally (without Docker)

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

<img src="https://capsule-render.vercel.app/api?type=rect&color=8bfde4&height=4&section=header" width="100%"/>

## 🔌 API Overview

All protected routes require a Bearer token from `POST /api/login`.

| Prefix | Role | Description |
|--------|------|-------------|
| `/api/admin/*` | Admin | Users, sections, school years, reports, backup |
| `/api/adviser/*` | Adviser | Dashboard, advisory students, health heatmap |
| `/api/staff/*` | Clinic Staff | Students, dashboard, reports |
| `/api/students/*` | All | Medical data, visits, badges |
| `/api/medical-visits/*` | Staff | Visit records |
| `/api/emergency-drills/*` | Admin/Staff | Drill management |
| `/api/shdf/*` | All | Student Health Data Form |

<img src="https://capsule-render.vercel.app/api?type=rect&color=8bfde4&height=4&section=header" width="100%"/>

## ☁️ Deployment

See [AWS_DEPLOYMENT.md](./AWS_DEPLOYMENT.md) for the full guide on deploying to AWS EC2 with Docker, Nginx, and SSL.

```
Internet → Nginx (80/443)
              ├── /api/*  → Laravel backend (port 8082)
              └── /*      → Angular frontend (static via Nginx)
```

> Estimated cost: ~$20–35/month on AWS `t3.small` / `t3.medium`.

<img src="https://capsule-render.vercel.app/api?type=rect&color=8bfde4&height=4&section=header" width="100%"/>

## 🔑 User Roles

| Role | Access |
|------|--------|
| Admin | Full system access |
| Clinic Staff | Medical visits and student records |
| Adviser | Class students and health monitoring |
| Student | Own medical records and profile |

See [USER_MANUAL.md](./USER_MANUAL.md) for detailed usage instructions per role.

<img src="https://capsule-render.vercel.app/api?type=rect&color=8bfde4&height=4&section=header" width="100%"/>

## 📄 License

For academic and institutional use only.

<div align="center">
<br/>
<sub>Made by Team 4seasons</sub>
</div>
