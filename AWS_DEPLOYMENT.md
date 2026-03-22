# AWS Deployment Guide — Medical Record System

This guide walks you through deploying the full system (Laravel backend + Angular frontend + MySQL + Redis) on AWS EC2 using Docker Compose.

---

## Architecture Overview

```
Internet
    │
    ▼
EC2 Instance (Ubuntu 22.04)
    │
    ├── Nginx (port 80/443) ← SSL termination + reverse proxy
    │       ├── /api/*  → Laravel backend container (port 8082)
    │       └── /*      → Angular frontend container (port 4200 or built static)
    │
    ├── Laravel Backend (Docker)
    ├── Angular Frontend (Docker, built as static via Nginx)
    ├── MySQL (Docker)
    └── Redis (Docker)
```

Estimated cost: **~$20–35/month** on `t3.small` or `t3.medium`.

---

## Step 1: Launch EC2 Instance

1. Go to [AWS Console](https://console.aws.amazon.com) → EC2 → **Launch Instance**
2. Settings:
   - **Name**: `medical-record-system`
   - **AMI**: Ubuntu Server 22.04 LTS (free tier eligible)
   - **Instance type**: `t3.small` (2 vCPU, 2GB RAM) minimum — `t3.medium` recommended
   - **Key pair**: Create new → download `.pem` file (keep this safe)
   - **Storage**: 20GB gp3 minimum (30GB recommended)
3. **Security Group** — open these ports:
   | Port | Protocol | Source | Purpose |
   |------|----------|--------|---------|
   | 22   | TCP | Your IP only | SSH access |
   | 80   | TCP | 0.0.0.0/0 | HTTP |
   | 443  | TCP | 0.0.0.0/0 | HTTPS (SSL) |
4. Click **Launch Instance**
5. Note your **Public IPv4 address** (e.g. `54.123.45.67`)

---

## Step 2: Connect to EC2

```bash
# On your local machine (Windows: use Git Bash or WSL)
chmod 400 your-key.pem
ssh -i your-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
```

---

## Step 3: Install Docker on EC2

```bash
# Update packages
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add ubuntu user to docker group (no sudo needed)
sudo usermod -aG docker ubuntu

# Install Docker Compose plugin
sudo apt install docker-compose-plugin -y

# Apply group change (re-login or run this)
newgrp docker

# Verify
docker --version
docker compose version
```

---

## Step 4: Upload Project to EC2

### Option A: Using Git (recommended)

```bash
# On EC2
sudo apt install git -y
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO
```

### Option B: Using SCP (upload from local)

```bash
# On your local machine
scp -i your-key.pem -r ./your-project ubuntu@YOUR_EC2_PUBLIC_IP:~/medical-system
```

---

## Step 5: Create Production Environment File

On EC2, inside the project folder:

```bash
cp backend-laravel/.env.docker backend-laravel/.env
nano backend-laravel/.env
```

Update these values:

```env
APP_ENV=production
APP_DEBUG=false
APP_URL=http://YOUR_EC2_PUBLIC_IP
# If you have a domain: APP_URL=https://yourdomain.com

APP_KEY=base64:F7xSMYbmECxKhU/++3Xkc2eCu73jBsMXGRgFs7SYeBI=
# IMPORTANT: Generate a new key for production:
# docker compose run --rm backend php artisan key:generate --show

# Database — change the password!
DB_CONNECTION=mysql
DB_HOST=mysql
DB_PORT=3306
DB_DATABASE=4seasons
DB_USERNAME=root
DB_PASSWORD=CHANGE_THIS_STRONG_PASSWORD

# Redis
REDIS_HOST=redis
REDIS_PASSWORD=null
REDIS_PORT=6379

# Email — use Resend for production (real emails)
MAIL_MAILER=resend
MAIL_FROM_ADDRESS="noreply@yourschool.edu.ph"
MAIL_FROM_NAME="PDMHS Medical System"
RESEND_KEY=re_your_actual_resend_api_key

# Logging
LOG_LEVEL=error
```

Save with `Ctrl+O`, exit with `Ctrl+X`.

---

## Step 6: Create Production docker-compose

Create a `docker-compose.prod.yml` at the project root:

```bash
nano docker-compose.prod.yml
```

Paste this content:

```yaml
services:
  backend:
    build:
      context: ./backend-laravel
      dockerfile: Dockerfile
    expose:
      - "80"
    environment:
      - APP_ENV=production
      - APP_DEBUG=false
      - APP_KEY=${APP_KEY}
      - DB_CONNECTION=mysql
      - DB_HOST=mysql
      - DB_PORT=3306
      - DB_DATABASE=4seasons
      - DB_USERNAME=root
      - DB_PASSWORD=${DB_PASSWORD}
      - REDIS_HOST=redis
      - MAIL_MAILER=${MAIL_MAILER}
      - RESEND_KEY=${RESEND_KEY}
      - MAIL_FROM_ADDRESS=${MAIL_FROM_ADDRESS}
      - MAIL_FROM_NAME=${MAIL_FROM_NAME}
    depends_on:
      mysql:
        condition: service_healthy
      redis:
        condition: service_started
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost/api/health"]
      interval: 30s
      timeout: 10s
      retries: 10
      start_period: 120s
    volumes:
      - app_storage:/var/www/html/storage
    command: >
      sh -c "php artisan config:clear &&
             php artisan config:cache &&
             php artisan migrate --force &&
             php artisan db:seed --force --class=RoleSeeder || true &&
             php artisan db:seed --force --class=AdminSeeder || true &&
             php artisan db:seed --force --class=SectionSeeder || true &&
             apache2-foreground"
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    expose:
      - "80"
    depends_on:
      backend:
        condition: service_healthy
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.prod.conf:/etc/nginx/conf.d/default.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - backend
      - frontend
    restart: unless-stopped

  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_PASSWORD}
      MYSQL_DATABASE: 4seasons
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      timeout: 20s
      retries: 10
    volumes:
      - mysql_data:/var/lib/mysql
    restart: unless-stopped

  redis:
    image: redis:alpine
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  mysql_data:
  redis_data:
  app_storage:
```

---

## Step 7: Create Production Nginx Config

```bash
nano nginx.prod.conf
```

Paste this:

```nginx
server {
    listen 80;
    server_name YOUR_EC2_PUBLIC_IP;  # or yourdomain.com

    # Frontend
    location / {
        proxy_pass http://frontend:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api/ {
        proxy_pass http://backend:80/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 60s;
        proxy_send_timeout 120s;
        proxy_read_timeout 120s;
    }
}
```

Replace `YOUR_EC2_PUBLIC_IP` with your actual IP or domain.

---

## Step 8: Set Environment Variables

```bash
# Create a .env file at project root for docker-compose to read
cat > .env << EOF
APP_KEY=base64:F7xSMYbmECxKhU/++3Xkc2eCu73jBsMXGRgFs7SYeBI=
DB_PASSWORD=CHANGE_THIS_STRONG_PASSWORD
MAIL_MAILER=resend
RESEND_KEY=re_your_actual_key
MAIL_FROM_ADDRESS=noreply@yourschool.edu.ph
MAIL_FROM_NAME=PDMHS Medical System
EOF
```

---

## Step 9: Build and Run

```bash
# Build all images (takes 5-10 minutes first time)
docker compose -f docker-compose.prod.yml build

# Start everything in background
docker compose -f docker-compose.prod.yml up -d

# Watch logs to confirm everything started
docker compose -f docker-compose.prod.yml logs -f
```

After a few minutes, visit `http://YOUR_EC2_PUBLIC_IP` — system should be live.

---

## Step 10: SSL/HTTPS with Let's Encrypt (Optional but Recommended)

Only do this if you have a domain name pointing to your EC2 IP.

```bash
# Install Certbot
sudo apt install certbot -y

# Stop nginx temporarily
docker compose -f docker-compose.prod.yml stop nginx

# Get certificate
sudo certbot certonly --standalone -d yourdomain.com

# Certificates will be at:
# /etc/letsencrypt/live/yourdomain.com/fullchain.pem
# /etc/letsencrypt/live/yourdomain.com/privkey.pem

# Copy to project ssl folder
mkdir -p ssl
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ssl/
sudo chmod 644 ssl/*.pem
```

Then update `nginx.prod.conf` to add HTTPS:

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;

    location / {
        proxy_pass http://frontend:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }

    location /api/ {
        proxy_pass http://backend:80/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_connect_timeout 60s;
        proxy_send_timeout 120s;
        proxy_read_timeout 120s;
    }
}
```

Restart nginx:

```bash
docker compose -f docker-compose.prod.yml restart nginx
```

---

## Useful Commands After Deployment

```bash
# View running containers
docker compose -f docker-compose.prod.yml ps

# View backend logs
docker compose -f docker-compose.prod.yml logs backend

# Run artisan commands
docker compose -f docker-compose.prod.yml exec backend php artisan migrate
docker compose -f docker-compose.prod.yml exec backend php artisan config:clear

# Restart a specific service
docker compose -f docker-compose.prod.yml restart backend

# Stop everything
docker compose -f docker-compose.prod.yml down

# Stop and delete all data (CAREFUL — deletes DB!)
docker compose -f docker-compose.prod.yml down -v
```

---

## Checklist Before Going Live

- [ ] Changed `DB_PASSWORD` to a strong password
- [ ] Set `APP_ENV=production` and `APP_DEBUG=false`
- [ ] Generated new `APP_KEY` (don't reuse the dev key)
- [ ] Set real `RESEND_KEY` for email delivery
- [ ] EC2 Security Group only allows port 22 from your IP
- [ ] MySQL port 3306 is NOT exposed publicly (it's internal Docker only)
- [ ] SSL certificate installed (if using a domain)
- [ ] `APP_URL` updated to your domain or EC2 IP

---

## Cost Summary

| Resource | Type | Est. Monthly Cost |
|----------|------|-------------------|
| EC2 t3.small | Compute | ~$15 |
| EBS 30GB gp3 | Storage | ~$2.40 |
| Data transfer | Network | ~$1–5 |
| **Total** | | **~$18–22/month** |

> Free tier: If your AWS account is less than 12 months old, `t2.micro` is free (750 hrs/month) but may be too slow for this system under load.
