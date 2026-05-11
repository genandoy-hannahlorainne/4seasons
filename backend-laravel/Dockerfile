FROM php:8.2-apache

# Build arg to bust cache when needed
ARG CACHE_BUST=1

# System deps + PHP extensions required by Laravel/MySQL
RUN printf 'Types: deb\nURIs: http://ftp.us.debian.org/debian\nSuites: trixie trixie-updates\nComponents: main\nSigned-By: /usr/share/keyrings/debian-archive-keyring.gpg\n' > /etc/apt/sources.list.d/debian.sources \
    && apt-get update \
    && apt-get install -y --no-install-recommends git unzip libzip-dev curl \
    && docker-php-ext-install pdo pdo_mysql mysqli zip bcmath \
    && pecl install redis \
    && docker-php-ext-enable redis \
    && a2enmod rewrite headers \
    && rm -rf /var/lib/apt/lists/*

# Install Composer in the container for `docker compose exec backend composer ...`
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Copy composer files first for better layer caching
COPY composer.json composer.lock ./
RUN composer install --no-interaction --optimize-autoloader --no-scripts

# Copy the rest of the app
COPY . /var/www/html

# Run post-install scripts after full copy
RUN composer run-script post-autoload-dump || true

# Serve Laravel from /public
RUN sed -ri -e 's!/var/www/html!/var/www/html/public!g' /etc/apache2/sites-available/000-default.conf /etc/apache2/apache2.conf

# Ensure writable directories are owned by Apache user
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache \
    && chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

EXPOSE 80
