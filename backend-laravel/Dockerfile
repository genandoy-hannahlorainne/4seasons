FROM php:8.2-apache

# System deps + PHP extensions required by Laravel/MySQL
RUN apt-get update \
    && apt-get install -y --no-install-recommends git unzip libzip-dev curl \
    && docker-php-ext-install pdo pdo_mysql mysqli \
    && a2enmod rewrite headers \
    && rm -rf /var/lib/apt/lists/*

# Install Composer in the container for `docker compose exec backend composer ...`
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html
COPY . /var/www/html

# Serve Laravel from /public
RUN sed -ri -e 's!/var/www/html!/var/www/html/public!g' /etc/apache2/sites-available/000-default.conf /etc/apache2/apache2.conf

# Ensure writable directories are owned by Apache user
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

EXPOSE 80
