#!/bin/sh

# It's important to change to the correct directory first
cd /var/www

# Wait for the database to be ready
echo "Waiting for database..."
sleep 15

# Run database migrations
echo "Running database migrations..."
php artisan migrate --force --no-interaction

# Start PHP-FPM in the background
php-fpm -D

# Start Nginx in the foreground
echo "Starting Nginx..."
nginx -g "daemon off;"