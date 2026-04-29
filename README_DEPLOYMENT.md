# 4Seasons Deployment Setup

This document summarizes the continuous deployment (CD) setup that has been added to your 4Seasons project.

## What's Been Added

### 1. GitHub Actions Workflows

#### CI Pipeline (`.github/workflows/ci.yml`) - Enhanced
- **Existing**: Backend tests, frontend tests, integration tests, E2E tests, security scanning
- **Added**: Automatic trigger for CD pipeline when all tests pass on `main` branch

#### CD Pipeline (`.github/workflows/cd.yml`) - New
- **Docker Build**: Builds and pushes backend Docker image to GitHub Container Registry
- **Frontend Build**: Builds production frontend assets
- **Staging Deployment**: Automatic deployment to staging when code is pushed to `main`
- **Production Deployment**: Manual deployment via GitHub Actions UI
- **Health Checks**: Automatic verification that deployments are successful
- **Notifications**: Slack notifications for deployment status (optional)

### 2. Deployment Scripts

#### Bash Script (`scripts/deploy.sh`)
- Cross-platform deployment script for Linux/macOS
- Supports staging and production environments
- Includes backup, rollback, and health check functionality

#### PowerShell Script (`scripts/deploy.ps1`)
- Windows-compatible deployment script
- Same functionality as bash script
- Native PowerShell implementation

### 3. Documentation

#### Deployment Guide (`.github/DEPLOYMENT.md`)
- Comprehensive deployment documentation
- Architecture overview with mermaid diagrams
- Troubleshooting guide
- Security considerations

#### Secrets Setup Guide (`.github/SECRETS_SETUP.md`)
- Step-by-step guide for configuring GitHub secrets
- SSH key setup instructions
- Server configuration requirements
- Environment file templates

## Deployment Flow

```
Push to main → CI Tests → Build Docker Image → Deploy to Staging → Health Check
                                                      ↓
Manual Trigger → Deploy to Production → Health Check → Notify Team
```

## Quick Start

### 1. Set Up GitHub Secrets

Go to your repository → Settings → Secrets and variables → Actions

**Required secrets:**
- `STAGING_HOST`, `STAGING_USER`, `STAGING_SSH_KEY`
- `PRODUCTION_HOST`, `PRODUCTION_USER`, `PRODUCTION_SSH_KEY`
- `SLACK_WEBHOOK_URL` (optional)

See `.github/SECRETS_SETUP.md` for detailed instructions.

### 2. Prepare Your Servers

1. Install Docker and Docker Compose
2. Create deployment user with Docker permissions
3. Clone repository to deployment directory
4. Set up environment files (`.env.prod`)
5. Configure SSH access for deployment user

### 3. Test the Pipeline

1. Push a commit to `main` branch
2. Watch the CI pipeline complete
3. Verify automatic staging deployment
4. Test manual production deployment

## Key Features

### Zero-Downtime Deployment
- Production deployments use rolling updates
- New containers start alongside old ones
- Traffic switches only after health checks pass

### Automatic Backups
- Database and file backups before production deployments
- Stored with timestamp for easy identification
- Rollback capability to previous state

### Health Monitoring
- Automatic health checks after deployment
- Configurable retry logic with timeouts
- Deployment fails if health checks don't pass

### Multi-Environment Support
- Separate staging and production environments
- Environment-specific configurations
- Different deployment strategies per environment

## Manual Deployment

### Using GitHub Actions UI
1. Go to Actions tab → CD Pipeline
2. Click "Run workflow"
3. Select environment (staging/production)
4. Click "Run workflow"

### Using Local Scripts
```bash
# Linux/macOS
./scripts/deploy.sh staging
./scripts/deploy.sh production

# Windows PowerShell
.\scripts\deploy.ps1 staging
.\scripts\deploy.ps1 production
```

## Rollback Procedures

### Automatic Rollback
```bash
# Linux/macOS
./scripts/deploy.sh production --rollback

# Windows PowerShell
.\scripts\deploy.ps1 production -Rollback
```

### Manual Rollback
```bash
# On server
cd /var/www/4seasons
git reset --hard HEAD~1
docker compose -f docker-compose.prod.yml up -d --force-recreate
```

## Monitoring

### Health Check Endpoint
- **URL**: `/api/health`
- **Response**: JSON with status, timestamp, and database connection
- **Used by**: Deployment scripts and Docker health checks

### Useful Commands
```bash
# Check deployment status
docker compose -f docker-compose.prod.yml ps

# View application logs
docker compose -f docker-compose.prod.yml logs -f backend

# Execute Laravel commands
docker compose -f docker-compose.prod.yml exec backend php artisan --version
```

## Security Features

- **Dedicated SSH keys** for deployment
- **Limited user permissions** on servers
- **Environment separation** between staging/production
- **Automatic security scanning** with Trivy
- **Secret management** via GitHub Secrets

## Next Steps

1. **Configure Secrets**: Follow `.github/SECRETS_SETUP.md`
2. **Set Up Servers**: Prepare staging and production environments
3. **Test Pipeline**: Make a small change and push to `main`
4. **Monitor Deployments**: Watch the first few deployments closely
5. **Train Team**: Share deployment procedures with your team

## Support

- **Documentation**: See `.github/DEPLOYMENT.md` for detailed information
- **Troubleshooting**: Check logs and health endpoints
- **Issues**: Review GitHub Actions logs for deployment failures

---

**Note**: This setup assumes you have existing Docker Compose configurations and a Laravel backend with a health check endpoint. The deployment process is designed to work with your current infrastructure while adding automated CI/CD capabilities.