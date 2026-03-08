# Docker Setup Guide (Option 3: Deterministic Seeders)

This guide standardizes local development using Docker and seeded data so teammates can get the same environment and baseline records.

## Goal

- Same runtime versions (PHP/MySQL/Node) via Docker
- Same baseline data via Laravel seeders
- Fewer login/500 issues after pull

## Prerequisites

- Docker Desktop installed and running
- Git installed
- Project pulled to local machine

Check tools:

```powershell
docker --version
docker compose version
```

## 1) First-Time Setup

From project root:

```powershell
docker compose up -d --build
```

If this is your first run after pulling Docker changes, force rebuild backend image:

```powershell
docker compose build backend
docker compose up -d
```

Check container status:

```powershell
docker compose ps
```

Install backend dependencies (inside container):

```powershell
docker compose exec backend composer install
```

If you get `service "backend" is not running`, run:

```powershell
docker compose up -d backend mysql
docker compose ps
```

Create `.env` if missing:

```powershell
docker compose exec backend sh -lc "test -f .env || cp .env.example .env"
```

Generate app key:

```powershell
docker compose exec backend php artisan key:generate
```

## 2) Database Sync (Option 3)

Standard sync after code updates:

```powershell
docker compose exec backend php artisan migrate --force
docker compose exec backend php artisan db:seed --force
```

Force same clean state for everyone:

```powershell
docker compose exec backend php artisan migrate:fresh --seed --force
```

## 3) Daily Workflow After `git pull`

```powershell
git pull origin main
docker compose up -d
docker compose exec backend php artisan migrate --force
docker compose exec backend php artisan db:seed --force
```

## 4) Full Reset (If Local DB Is Broken)

```powershell
docker compose down -v
docker compose up -d --build
docker compose exec backend php artisan migrate:fresh --seed --force
```

## 5) Useful Checks

Container logs:

```powershell
docker compose logs backend --tail=200
docker compose logs mysql --tail=200
docker compose logs frontend --tail=200
```

Laravel logs:

```powershell
docker compose exec backend tail -n 200 storage/logs/laravel.log
```

## 6) Ports Used

- Frontend: `http://localhost:4200`
- Laravel backend: `http://localhost:8080`
- Legacy backend: `http://localhost:8081`
- MySQL (host machine): `localhost:3307`

## 6.1) XAMPP MySQL vs Docker MySQL

- They are separate databases by default.
- XAMPP MySQL usually runs on `localhost:3306`.
- Docker MySQL in this project is exposed as `localhost:3307`.
- Data is not shared unless you intentionally connect both apps to the same DB host/port/database.

## 7) Important Repo Note

Current `docker-compose.yml` uses:

- `backend` service with `build: ./backend-laravel`

Make sure a Dockerfile exists at `backend-laravel/Dockerfile`; otherwise `docker compose up --build` will fail for backend service.

If frontend shows CORS errors after config changes, run:

```powershell
docker compose up -d --build backend
docker compose exec backend php artisan optimize:clear
```

## Recommended Team Rule

After every pull, always run:

```powershell
docker compose up -d
docker compose exec backend php artisan migrate --force
docker compose exec backend php artisan db:seed --force
```

This keeps schema and baseline data aligned across teammates.
