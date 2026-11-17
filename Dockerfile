# Mini CRM — multi-stage Docker image
#
# Targets:
#   dev         → local development (docker-compose.yml). Code is bind-mounted; dev deps + Node included.
#   production  → PHP-FPM image for AWS (docker-compose.prod.yml). Code, vendor/ and built assets baked in.
#   web         → nginx image that serves public/ and forwards PHP to the production image.
#
# PHP 8.4 is required: composer.lock pins Symfony 8 packages (php >= 8.4).
#
# Author  : Xgenious (https://xgenious.com)
# License : MIT

# ── Base: PHP 8.4 + extensions + Composer ────────────────────────────────────
FROM php:8.4-fpm AS base

RUN apt-get update && apt-get install -y --no-install-recommends \
        git unzip curl libzip-dev libpng-dev libjpeg-dev libfreetype6-dev \
        libicu-dev libonig-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install pdo_mysql mbstring zip gd intl bcmath pcntl opcache \
    && pecl install redis && docker-php-ext-enable redis \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# ── Vendor: production PHP dependencies (no dev packages) ────────────────────
FROM base AS vendor

COPY composer.json composer.lock ./
RUN composer install --no-dev --no-interaction --no-scripts --no-autoloader --prefer-dist

COPY . .
RUN composer dump-autoload --optimize --no-dev

# ── Frontend: build React/Vite assets once, at image build time ──────────────
FROM node:22-alpine AS frontend

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
# Tailwind scans vendor/ for class names used in Laravel pagination views
COPY --from=vendor /var/www/html/vendor ./vendor
RUN npm run build

# ── Dev: used by docker-compose.yml ──────────────────────────────────────────
FROM base AS dev

RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*

COPY composer.json composer.lock ./
RUN composer install --no-interaction --no-scripts --no-autoloader --prefer-dist

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN composer dump-autoload --optimize \
    && chown -R www-data:www-data storage bootstrap/cache

EXPOSE 9000
CMD ["php-fpm"]

# ── Production: PHP-FPM app image (app, worker and scheduler services) ───────
FROM base AS production

# Production php.ini + OPcache (validate_timestamps off: code never changes at runtime)
RUN cp "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini" \
    && printf 'opcache.enable=1\nopcache.validate_timestamps=0\nopcache.memory_consumption=128\nopcache.max_accelerated_files=20000\n' \
       > "$PHP_INI_DIR/conf.d/99-opcache-prod.ini"

COPY --from=vendor /var/www/html /var/www/html
COPY --from=frontend /app/public/build /var/www/html/public/build

# Runtime directories + storage symlink (serves uploaded logo/favicon from storage/app/public)
RUN rm -f bootstrap/cache/packages.php bootstrap/cache/services.php \
    && mkdir -p storage/framework/cache/data storage/framework/sessions storage/framework/views \
               storage/logs storage/app/public bootstrap/cache \
    && ln -sfn ../storage/app/public public/storage \
    && php artisan package:discover --ansi \
    && chown -R www-data:www-data storage bootstrap/cache

EXPOSE 9000
CMD ["php-fpm"]

# ── Web: nginx serving public/ and proxying PHP to the app container ─────────
FROM nginx:alpine AS web

COPY docker/nginx/prod.conf /etc/nginx/conf.d/default.conf
COPY --from=production /var/www/html/public /var/www/html/public
