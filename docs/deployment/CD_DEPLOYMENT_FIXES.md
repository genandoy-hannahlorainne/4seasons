# CD Pipeline Deployment Fixes

## Issues Identified and Fixed

### 1. SSH Authentication Configuration
**Problem**: The CD workflow was using password authentication instead of SSH keys for staging deployment.

**Fix Applied**: Updated `.github/workflows/cd.yml` to use SSH keys for staging deployment.

### 2. Docker Image Name Mismatch
**Problem**: The Docker image name in `docker-compose.prod.yml` didn't match the GitHub Container Registry format.

**Fix Applied**: Updated `docker-compose.prod.yml` to use the correct image name format.

## Required Actions to Complete the Fix

### 1. Update GitHub Secrets
You need to add the following secrets to your GitHub repository (Settings → Secrets and variables → Actions):

#### Staging Environment:
- `STAGING_HOST`: Your staging server hostname or IP
- `STAGING_USER`: SSH username (e.g., `deploy`)
- `STAGING_SSH_KEY`: Private SSH key content (see SSH key generation below)
- `STAGING_PORT`: SSH port (optional, defaults to 22)
- `STAGING_PATH`: Deployment path (optional, defaults to `/var/www/4seasons`)
- `STAGING_URL`: Application URL for health checks

#### Production Environment:
- `PRODUCTION_HOST`: Your production server hostname or IP
- `PRODUCTION_USER`: SSH username (e.g., `deploy`)
- `PRODUCTION_SSH_KEY`: Private SSH key content
- `PRODUCTION_PORT`: SSH port (optional, defaults to 22)
- `PRODUCTION_PATH`: Deployment path (optional, defaults to `/var/www/4seasons`)
- `PRODUCTION_URL`: Application URL for health checks

### 2. Generate SSH Keys for Deployment

Run these commands on your local machine:

```bash
# Generate SSH key pair for deployment
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/4seasons_deploy

# Copy public key to your servers
ssh-copy-id -i ~/.ssh/4seasons_deploy.pub deploy@your-staging-server.com
ssh-copy-id -i ~/.ssh/4seasons_deploy.pub deploy@your-production-server.com

# Get private key content for GitHub secrets
cat ~/.ssh/4seasons_deploy
```

### 3. Update Docker Compose Image Reference

Update the image name in `docker-compose.prod.yml` to match your actual GitHub repository:

```yaml
backend:
  image: ghcr.io/YOUR_GITHUB_USERNAME/YOUR_REPO_NAME-backend:latest
```

Replace `YOUR_GITHUB_USERNAME` and `YOUR_REPO_NAME` with your actual values.

### 4. Server Setup Requirements

Ensure your deployment servers have:

1. **Docker and Docker Compose installed**
2. **Git configured with repository access**
3. **Deployment user with proper permissions**:
   ```bash
   # Create deployment user
   sudo useradd -m -s /bin/bash deploy
   sudo usermod -aG docker deploy
   
   # Create deployment directory
   sudo mkdir -p /var/www/4seasons
   sudo chown deploy:deploy /var/www/4seasons
   
   # Clone repository as deploy user
   sudo su - deploy
   cd /var/www/4seasons
   git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git .
   ```

4. **Environment files**:
   - Create `backend-laravel/.env.prod` for production
   - Create `backend-laravel/.env.staging` for staging

### 5. Test the Deployment

After setting up all secrets and server configuration:

1. Push a commit to the `main` branch
2. Check the Actions tab in GitHub
3. Verify the staging deployment runs successfully
4. For production deployment, use the manual workflow trigger

## Health Check Verification

The health check endpoint is already implemented at `/api/health` and returns:
```json
{
  "status": "ok",
  "timestamp": "2024-04-29T10:30:00.000000Z",
  "database": "connected"
}
```

## Troubleshooting Commands

If deployment fails, use these commands on your server:

```bash
# Check service status
docker compose -f docker-compose.prod.yml ps

# View logs
docker compose -f docker-compose.prod.yml logs backend

# Test health endpoint
curl -f http://localhost:8082/api/health

# Check deployment user permissions
groups deploy
docker ps
```

## Next Steps

1. Set up the GitHub secrets as listed above
2. Update the Docker image name in docker-compose.prod.yml
3. Configure your servers with the deployment user and directory structure
4. Test the deployment with a small change
5. Monitor the deployment logs for any additional issues

The health check endpoint is working, so the main issues were authentication and image name configuration.