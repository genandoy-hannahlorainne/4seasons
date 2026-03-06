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

Check container status:

```powershell
docker compose ps
```

Install backend dependencies (inside container):

```powershell
docker compose exec backend composer install
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

## 7) Important Repo Note

Current `docker-compose.yml` uses:

- `backend` service with `build: ./backend-laravel`

Make sure a Dockerfile exists at `backend-laravel/Dockerfile`; otherwise `docker compose up --build` will fail for backend service.

## Recommended Team Rule

After every pull, always run:

```powershell
docker compose up -d
docker compose exec backend php artisan migrate --force
docker compose exec backend php artisan db:seed --force
```

This keeps schema and baseline data aligned across teammates.
