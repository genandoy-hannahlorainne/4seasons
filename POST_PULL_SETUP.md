# Post-Pull Setup (Windows)

Run this every time after pulling new changes:

1. Open PowerShell at project root (`C:\xampp\htdocs\4seasons`)
2. Run:

```powershell
.\after-pull-setup.ps1
```

Or double-click / run:

```bat
after-pull-setup.bat
```

## What it does

- Installs backend dependencies (`composer install`)
- Creates `backend-laravel/.env` from `.env.example` if missing
- Generates `APP_KEY` if missing
- Clears Laravel cache (`php artisan optimize:clear`)
- Links storage (`php artisan storage:link`)
- Runs migrations (`php artisan migrate --force`)
- Installs frontend dependencies (`npm install`)

## Start app

Backend:

```powershell
cd backend-laravel
php artisan serve
```

Frontend:

```powershell
cd frontend
npx ng serve
```
