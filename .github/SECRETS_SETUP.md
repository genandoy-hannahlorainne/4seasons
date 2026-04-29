# GitHub Secrets Setup Guide

This guide helps you configure the required secrets for the CD pipeline.

## Required Secrets

Navigate to your repository → Settings → Secrets and variables → Actions → New repository secret

### 1. Staging Environment Secrets

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `STAGING_HOST` | Staging server hostname or IP | `staging.4seasons.com` or `192.168.1.100` |
| `STAGING_USER` | SSH username for staging server | `deploy` or `ubuntu` |
| `STAGING_SSH_KEY` | Private SSH key for staging server | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `STAGING_PORT` | SSH port (optional) | `22` |
| `STAGING_PATH` | Deployment path (optional) | `/var/www/4seasons` |
| `STAGING_URL` | Application URL for health checks | `https://staging.4seasons.com` |

### 2. Production Environment Secrets

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `PRODUCTION_HOST` | Production server hostname or IP | `4seasons.com` or `192.168.1.200` |
| `PRODUCTION_USER` | SSH username for production server | `deploy` or `ubuntu` |
| `PRODUCTION_SSH_KEY` | Private SSH key for production server | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `PRODUCTION_PORT` | SSH port (optional) | `22` |
| `PRODUCTION_PATH` | Deployment path (optional) | `/var/www/4seasons` |
| `PRODUCTION_URL` | Application URL for health checks | `https://4seasons.com` |

### 3. Notification Secrets (Optional)

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `SLACK_WEBHOOK_URL` | Slack webhook for deployment notifications | `https://hooks.slack.com/services/...` |

## SSH Key Setup

### 1. Generate SSH Key Pair

On your local machine or CI/CD server:

```bash
# Generate a new SSH key pair for deployment
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/4seasons_deploy

# This creates two files:
# ~/.ssh/4seasons_deploy (private key - add to GitHub secrets)
# ~/.ssh/4seasons_deploy.pub (public key - add to server)
```

### 2. Add Public Key to Servers

Copy the public key to your staging and production servers:

```bash
# Copy public key to server
ssh-copy-id -i ~/.ssh/4seasons_deploy.pub deploy@staging.4seasons.com
ssh-copy-id -i ~/.ssh/4seasons_deploy.pub deploy@4seasons.com

# Or manually add to ~/.ssh/authorized_keys on the server
cat ~/.ssh/4seasons_deploy.pub >> ~/.ssh/authorized_keys
```

### 3. Add Private Key to GitHub Secrets

1. Copy the private key content:
   ```bash
   cat ~/.ssh/4seasons_deploy
   ```

2. In GitHub:
   - Go to repository Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `STAGING_SSH_KEY` or `PRODUCTION_SSH_KEY`
   - Value: Paste the entire private key content (including headers)

## Server User Setup

Create a dedicated deployment user on your servers:

```bash
# Create deployment user
sudo useradd -m -s /bin/bash deploy
sudo usermod -aG docker deploy

# Create necessary directories
sudo mkdir -p /var/www/4seasons
sudo chown deploy:deploy /var/www/4seasons

# Switch to deploy user
sudo su - deploy

# Clone repository
cd /var/www/4seasons
git clone https://github.com/your-username/4seasons.git .

# Set up environment files
cp backend-laravel/.env.example backend-laravel/.env.prod
# Edit .env.prod with production settings

# Set up Docker Compose override if needed
cp docker-compose.prod.yml docker-compose.override.yml
```

## Environment Files Setup

### Staging Environment (`backend-laravel/.env.staging`)

```env
APP_NAME="4Seasons Staging"
APP_ENV=staging
APP_DEBUG=false
APP_URL=https://staging.4seasons.com

DB_CONNECTION=mysql
DB_HOST=your-staging-db-host
DB_PORT=3306
DB_DATABASE=4seasons_staging
DB_USERNAME=staging_user
DB_PASSWORD=staging_password

REDIS_HOST=redis
REDIS_PASSWORD=null
REDIS_PORT=6379

MAIL_MAILER=smtp
MAIL_HOST=mailhog
MAIL_PORT=1025
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_ENCRYPTION=null

# Add other staging-specific variables
```

### Production Environment (`backend-laravel/.env.prod`)

```env
APP_NAME="4Seasons"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://4seasons.com

DB_CONNECTION=mysql
DB_HOST=your-production-db-host
DB_PORT=3306
DB_DATABASE=4seasons
DB_USERNAME=production_user
DB_PASSWORD=secure_production_password

REDIS_HOST=redis
REDIS_PASSWORD=secure_redis_password
REDIS_PORT=6379

MAIL_MAILER=smtp
MAIL_HOST=your-smtp-host
MAIL_PORT=587
MAIL_USERNAME=your-email@4seasons.com
MAIL_PASSWORD=your-email-password
MAIL_ENCRYPTION=tls

# Add other production-specific variables
```

## Slack Webhook Setup (Optional)

1. Go to your Slack workspace
2. Create a new app or use existing one
3. Enable Incoming Webhooks
4. Create a webhook for your deployment channel
5. Copy the webhook URL to `SLACK_WEBHOOK_URL` secret

## Testing the Setup

### 1. Test SSH Connection

```bash
# Test SSH connection with the deployment key
ssh -i ~/.ssh/4seasons_deploy deploy@staging.4seasons.com "echo 'SSH connection successful'"
```

### 2. Test Manual Deployment

```bash
# On your server, test the deployment process
cd /var/www/4seasons
./scripts/deploy.sh staging
```

### 3. Test GitHub Actions

1. Push a commit to the `main` branch
2. Check the Actions tab in GitHub
3. Verify the CI pipeline passes
4. Check if staging deployment triggers automatically

## Security Best Practices

1. **Dedicated SSH Keys**: Use separate SSH keys for deployment, not your personal keys
2. **Limited Permissions**: Deployment user should only have access to necessary directories
3. **Firewall Rules**: Restrict SSH access to specific IP ranges if possible
4. **Key Rotation**: Regularly rotate SSH keys and update secrets
5. **Environment Separation**: Use different databases and services for staging/production
6. **Secret Management**: Never commit secrets to the repository
7. **Audit Logs**: Monitor deployment activities and access logs

## Troubleshooting

### Common Issues

1. **SSH Permission Denied**
   - Check if public key is added to server's `~/.ssh/authorized_keys`
   - Verify SSH key format in GitHub secrets
   - Check server SSH configuration

2. **Docker Permission Denied**
   - Add deployment user to docker group: `sudo usermod -aG docker deploy`
   - Restart SSH session or reboot server

3. **Git Permission Denied**
   - Set up GitHub access for deployment user
   - Use HTTPS with personal access token or SSH with deploy key

4. **Health Check Failures**
   - Check application logs
   - Verify environment variables
   - Ensure database connectivity

### Debug Commands

```bash
# Check deployment user permissions
groups deploy

# Test Docker access
docker ps

# Check application status
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs backend

# Test health endpoint
curl -f http://localhost:8082/api/health
```

## Next Steps

After setting up all secrets:

1. Test the CI/CD pipeline with a small change
2. Monitor the first few deployments closely
3. Set up monitoring and alerting for your applications
4. Document any environment-specific configurations
5. Train your team on the deployment process