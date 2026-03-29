#!/bin/bash

# Environment switcher script for Medical Record System

BACKEND_DIR="backend-laravel"

case "$1" in
    "docker")
        echo "Switching to Docker environment..."
        cp "$BACKEND_DIR/.env.docker" "$BACKEND_DIR/.env"
        echo "✅ Switched to Docker environment"
        echo "Services available at:"
        echo "  - Frontend: http://localhost:4200"
        echo "  - Backend: http://localhost:8081"
        echo "  - phpMyAdmin: http://localhost:8080"
        echo "  - MailHog: http://localhost:8025"
        ;;
    "local")
        echo "Switching to Local development environment..."
        cp "$BACKEND_DIR/.env.local" "$BACKEND_DIR/.env"
        echo "✅ Switched to Local environment"
        echo "Make sure your local MySQL server is running"
        ;;
    "testing")
        echo "Switching to Testing environment..."
        cp "$BACKEND_DIR/.env.testing" "$BACKEND_DIR/.env"
        echo "✅ Switched to Testing environment"
        echo "Run tests with: docker-compose exec backend php artisan test"
        ;;
    *)
        echo "Usage: $0 {docker|local|testing}"
        echo ""
        echo "Available environments:"
        echo "  docker  - Use Docker services (default)"
        echo "  local   - Use local development setup"
        echo "  testing - Use testing configuration"
        exit 1
        ;;
esac
