#!/bin/bash

# Optimize composer autoload at runtime (skip if it fails)
echo "Optimizing composer autoload..."
composer dump-autoload --optimize --no-scripts || echo "Autoload optimization skipped"

# Wait for database to be ready
echo "Waiting for database connection..."
max_attempts=30
attempt=0
until php artisan migrate:status > /dev/null 2>&1; do
    attempt=$((attempt + 1))
    if [ $attempt -ge $max_attempts ]; then
        echo "Database connection failed after $max_attempts attempts"
        echo "Checking database connection details..."
        php artisan tinker --execute="echo 'DB Host: ' . config('database.connections.mysql.host'); echo 'DB Name: ' . config('database.connections.mysql.database');"
        exit 1
    fi
    echo "Database not ready, waiting... (attempt $attempt/$max_attempts)"
    sleep 2
done

# Clear Laravel caches
echo "Clearing Laravel caches..."
php artisan config:clear || true
php artisan cache:clear || true
php artisan route:clear || true
php artisan view:clear || true

# Run migrations
echo "Running database migrations..."
php artisan migrate --force

# Start Apache
echo "Starting Apache..."
exec apache2-foreground