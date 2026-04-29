#!/bin/bash

# 4Seasons Deployment Script
# Usage: ./scripts/deploy.sh [staging|production] [--rollback]

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ENVIRONMENT=${1:-staging}
ROLLBACK=${2}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Validate environment
if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
    log_error "Invalid environment. Use 'staging' or 'production'"
    exit 1
fi

# Check if Docker and Docker Compose are installed
check_dependencies() {
    log_info "Checking dependencies..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    
    if ! command -v docker compose &> /dev/null; then
        log_error "Docker Compose is not installed"
        exit 1
    fi
    
    log_success "Dependencies check passed"
}

# Create backup
create_backup() {
    if [[ "$ENVIRONMENT" == "production" ]]; then
        log_info "Creating backup..."
        
        BACKUP_DIR="/var/backups/4seasons/$(date +%Y%m%d_%H%M%S)"
        mkdir -p "$BACKUP_DIR"
        
        # Backup database
        docker compose -f docker-compose.prod.yml exec -T backend php artisan backup:run --only-db || log_warning "Database backup failed"
        
        # Backup current files
        cp -r "$PROJECT_DIR"/* "$BACKUP_DIR/" || log_warning "File backup failed"
        
        log_success "Backup created at $BACKUP_DIR"
        echo "$BACKUP_DIR" > /tmp/last_backup_path
    fi
}

# Rollback function
rollback() {
    log_warning "Starting rollback process..."
    
    if [[ -f /tmp/last_backup_path ]]; then
        BACKUP_PATH=$(cat /tmp/last_backup_path)
        if [[ -d "$BACKUP_PATH" ]]; then
            log_info "Restoring from backup: $BACKUP_PATH"
            cp -r "$BACKUP_PATH"/* "$PROJECT_DIR/"
            docker compose -f docker-compose.prod.yml up -d --force-recreate
            log_success "Rollback completed"
            return 0
        fi
    fi
    
    log_warning "No recent backup found, rolling back to previous git commit"
    git reset --hard HEAD~1
    docker compose -f docker-compose.prod.yml up -d --force-recreate
    log_success "Git rollback completed"
}

# Health check function
health_check() {
    local url=${1:-"http://localhost:8082/api/health"}
    local max_attempts=10
    local attempt=1
    
    log_info "Performing health check on $url"
    
    while [[ $attempt -le $max_attempts ]]; do
        if curl -f --max-time 30 "$url" &> /dev/null; then
            log_success "Health check passed"
            return 0
        else
            log_warning "Health check failed (attempt $attempt/$max_attempts)"
            if [[ $attempt -eq $max_attempts ]]; then
                log_error "Health check failed after $max_attempts attempts"
                return 1
            fi
            sleep 30
            ((attempt++))
        fi
    done
}

# Deploy function
deploy() {
    log_info "Starting deployment to $ENVIRONMENT environment"
    
    cd "$PROJECT_DIR"
    
    # Pull latest code
    log_info "Pulling latest code..."
    git pull origin main
    
    # Build and deploy
    if [[ "$ENVIRONMENT" == "staging" ]]; then
        log_info "Deploying to staging..."
        docker compose -f docker-compose.prod.yml pull
        docker compose -f docker-compose.prod.yml up -d --remove-orphans
    else
        log_info "Deploying to production with zero-downtime strategy..."
        
        # Pull new images
        docker compose -f docker-compose.prod.yml pull
        
        # Start new containers alongside old ones
        docker compose -f docker-compose.prod.yml up -d --remove-orphans --scale backend=2
        
        # Wait for new containers to be healthy
        log_info "Waiting for new containers to be healthy..."
        timeout 300 bash -c 'until [ $(docker compose -f docker-compose.prod.yml ps backend --filter "health=healthy" -q | wc -l) -ge 1 ]; do sleep 5; done'
        
        # Scale down to single instance
        docker compose -f docker-compose.prod.yml up -d --remove-orphans --scale backend=1
    fi
    
    # Wait for services to be ready
    log_info "Waiting for services to be ready..."
    sleep 10
    
    # Run database migrations
    log_info "Running database migrations..."
    docker compose -f docker-compose.prod.yml exec -T backend php artisan migrate --force
    
    # Clear and optimize caches
    log_info "Optimizing application..."
    docker compose -f docker-compose.prod.yml exec -T backend php artisan config:clear
    docker compose -f docker-compose.prod.yml exec -T backend php artisan cache:clear
    docker compose -f docker-compose.prod.yml exec -T backend php artisan route:clear
    docker compose -f docker-compose.prod.yml exec -T backend php artisan view:clear
    
    # Cache for production
    docker compose -f docker-compose.prod.yml exec -T backend php artisan config:cache
    docker compose -f docker-compose.prod.yml exec -T backend php artisan route:cache
    docker compose -f docker-compose.prod.yml exec -T backend php artisan view:cache
    
    # Clean up old Docker images
    docker image prune -f
    
    log_success "Deployment completed successfully!"
}

# Main execution
main() {
    log_info "4Seasons Deployment Script"
    log_info "Environment: $ENVIRONMENT"
    
    if [[ "$ROLLBACK" == "--rollback" ]]; then
        rollback
        exit 0
    fi
    
    check_dependencies
    create_backup
    deploy
    
    # Perform health check
    if [[ "$ENVIRONMENT" == "staging" ]]; then
        health_check "http://localhost:8082/api/health"
    else
        health_check "http://localhost:8082/api/health"
    fi
    
    log_success "Deployment process completed successfully!"
    
    # Show useful information
    echo ""
    log_info "Useful commands:"
    echo "  View logs: docker compose -f docker-compose.prod.yml logs -f backend"
    echo "  Check status: docker compose -f docker-compose.prod.yml ps"
    echo "  Execute commands: docker compose -f docker-compose.prod.yml exec backend php artisan --version"
    
    if [[ "$ENVIRONMENT" == "production" && -f /tmp/last_backup_path ]]; then
        echo "  Rollback: $0 production --rollback"
        echo "  Backup location: $(cat /tmp/last_backup_path)"
    fi
}

# Handle script interruption
trap 'log_error "Deployment interrupted"; exit 1' INT TERM

# Run main function
main "$@"