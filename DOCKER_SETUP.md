# Docker Setup Guide

## Prerequisites
- Docker Desktop installed and running

## Quick Start

### 1. Start Everything
```bash
docker-compose up
```

Wait for all services to start. You'll see:
- ✅ Database initializing from `4seasons.sql`
- ✅ Backend running on http://localhost:8080
- ✅ Frontend running on http://localhost:4200

### 2. Access the Application
- **Frontend**: http://localhost:4200
- **Backend API**: http://localhost:8080/api/
- **Database**: localhost:3306 (root/root)

### 3. Stop Everything
```bash
docker-compose down
```

## Common Commands

### Start in background (detached mode)
```bash
docker-compose up -d
```

### View logs
```bash
docker-compose logs -f
```

### Restart services
```bash
docker-compose restart
```

### Stop and remove everything (including database data)
```bash
docker-compose down -v
```

### Rebuild containers (after changing Dockerfile)
```bash
docker-compose up --build
```

## Database Updates

When you update `database/4seasons.sql`:

1. Stop containers and remove database volume:
```bash
docker-compose down -v
```

2. Start again (database will reinitialize):
```bash
docker-compose up
```

## Troubleshooting

### Port already in use
If ports 3306, 4200, or 8080 are already in use:
- Stop XAMPP/MySQL
- Or change ports in `docker-compose.yml`

### Database not connecting
Check if database is ready:
```bash
docker-compose logs db
```

### Frontend not loading
Check if npm install completed:
```bash
docker-compose logs frontend
```

## For Your Team

**Share these steps:**

1. Install Docker Desktop
2. Clone the repo
3. Run `docker-compose up`
4. Access http://localhost:4200

That's it! No XAMPP, no manual SQL imports, no version conflicts.

## Development Workflow

- Code changes in `frontend/` and `backend/` are automatically reflected
- Database schema changes: update `database/4seasons.sql` and restart with `docker-compose down -v && docker-compose up`
- No need to restart containers for code changes (volumes are mounted)
