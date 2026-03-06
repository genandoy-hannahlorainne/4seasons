# Post-Pull Setup (Windows)

Run this every time after pulling new changes:

1. Open PowerShell at project root (`C:\xampp\htdocs\4seasons`)
2. Run:

```powershell
.\after-pull-setup.ps1
```

If you need migration + seed in one run:

```powershell
.\after-pull-setup-seed.ps1
```

Or double-click / run:

```bat
after-pull-setup.bat
```

For migration + seed variant:

```bat
after-pull-setup-seed.bat
```

## Docker + Option 3 Guide

For Docker-based teammate setup using deterministic seeders, see:

- [DOCKER_OPTION3_SETUP.md](DOCKER_OPTION3_SETUP.md)

## What it does

- Installs backend dependencies (`composer install`)
- Creates `backend-laravel/.env` from `.env.example` if missing
- Generates `APP_KEY` if missing
- Clears Laravel cache (`php artisan optimize:clear`)
- Links storage (`php artisan storage:link`)
- Runs migrations (`php artisan migrate --force`)
- Installs frontend dependencies (`npm install`)

## Seed variant

`after-pull-setup-seed.ps1` does the same steps, but runs:

- `php artisan migrate --seed --force`

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
