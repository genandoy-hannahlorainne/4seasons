#!/bin/bash

# Optimize composer autoload at runtime (skip if it fails)
echo "Optimizing composer autoload..."
composer dump-autoload --optimize --no-scripts || echo "Autoload optimization skipped"

# Wait for database to be ready using a simple connection test
echo "Waiting for database connection..."
max_attempts=30
attempt=0
until php -r "
try {
    \$pdo = new PDO('mysql:host=mysql;port=3306;dbname=4seasons', 'root', 'root');
    echo 'Database connection successful!';
    exit(0);
} catch (Exception \$e) {
    exit(1);
}
" > /dev/null 2>&1; do
    attempt=$((attempt + 1))
    if [ $attempt -ge $max_attempts ]; then
        echo "Database connection failed after $max_attempts attempts"
        echo "Starting Apache anyway..."
        break
    fi
    echo "Database not ready, waiting... (attempt $attempt/$max_attempts)"
    sleep 2
done

if [ $attempt -lt $max_attempts ]; then
    echo "Database connection successful!"
    
    # Fix Laravel storage permissions
    echo "Setting proper permissions..."
    chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache
    chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache
    
    # Create storage directories if they don't exist
    mkdir -p /var/www/html/storage/logs
    mkdir -p /var/www/html/storage/framework/cache
    mkdir -p /var/www/html/storage/framework/sessions
    mkdir -p /var/www/html/storage/framework/views
    
    # Set proper ownership for storage directories
    chown -R www-data:www-data /var/www/html/storage
    chmod -R 775 /var/www/html/storage
    
    # Clear Laravel caches
    echo "Clearing Laravel caches..."
    php artisan config:clear || true
    php artisan cache:clear || true
    php artisan route:clear || true
    php artisan view:clear || true

    # Run migrations
    echo "Running database migrations..."
    php artisan migrate --force || echo "Migration failed, continuing..."
    
    # Generate app key if not set
    if [ -z "$APP_KEY" ] || [ "$APP_KEY" = "base64:YourGeneratedKeyWillGoHere" ]; then
        echo "Generating Laravel app key..."
        php artisan key:generate --force || true
    fi
fi

# Start Apache
echo "Starting Apache..."
exec apache2-foreground