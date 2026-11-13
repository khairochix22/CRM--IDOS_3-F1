# Mini CRM — PHP-FPM application image
#
# Used by docker-compose.yml (dev) and docker-compose.prod.yml.
# PHP 8.4 is required: composer.lock pins Symfony 8 packages (php >= 8.4).
#
# Author  : Xgenious (https://xgenious.com)
# License : MIT

FROM php:8.4-fpm

# System packages + PHP extensions used by Laravel / this project
RUN apt-get update && apt-get install -y --no-install-recommends \
        git unzip curl libzip-dev libpng-dev libjpeg-dev libfreetype6-dev \
        libicu-dev libonig-dev supervisor \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install pdo_mysql mbstring zip gd intl bcmath pcntl opcache \
    && pecl install redis && docker-php-ext-enable redis \
    && rm -rf /var/lib/apt/lists/*

# Node.js 22 (for building the React/Vite frontend inside the container)
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*

# Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Install PHP deps first (better layer caching)
COPY composer.json composer.lock ./
RUN composer install --no-interaction --no-scripts --no-autoloader --prefer-dist

# Install JS deps
COPY package.json package-lock.json ./
RUN npm ci

# Copy the application and finish composer setup
COPY . .
RUN composer dump-autoload --optimize \
    && chown -R www-data:www-data storage bootstrap/cache

EXPOSE 9000
CMD ["php-fpm"]
