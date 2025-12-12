# SỬ DỤNG IMAGE PHP-FPM: Tiêu chuẩn cho môi trường Production
FROM php:8.2-fpm

# CÀI ĐẶT CÁC THƯ VIỆN HỆ THỐNG VÀ EXTENSION
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    libzip-dev \
    # Cài đặt Node.js và NPM để build frontend (Vite/Mix)
    && curl -sL https://deb.nodesource.com/setup_lts.x | bash - \
    && apt-get install -y nodejs \
    # Cài đặt các extension PHP cần thiết
    && docker-php-ext-install pdo_mysql pdo_sqlite mbstring exif pcntl bcmath gd zip \
    # Dọn dẹp cache
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# CÀI ĐẶT COMPOSER
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# THIẾT LẬP THƯ MỤC LÀM VIỆC
WORKDIR /var/www

# COPY CÁC FILE CẦN THIẾT ĐỂ LỢI DỤNG CACHING
COPY composer.json composer.lock ./

# CÀI ĐẶT DEPENDENCIES PHP (Sử dụng --no-dev cho Production)
RUN composer install --no-dev --optimize-autoloader

# COPY TẤT CẢ SOURCE CODE
COPY . .

# BUILD FRONTEND ASSETS (Vite/Mix)
# Bước này phải chạy sau khi COPY toàn bộ code và dependencies (node_modules,...)
RUN npm install && npm run build

# THIẾT LẬP QUYỀN HẠN VÀ USER (www-data là user mặc định của PHP-FPM)
RUN chown -R www-data:www-data /var/www \
    && chmod -R 775 /var/www/storage \
    && chmod -R 775 /var/www/bootstrap/cache

# EXPOSE CỔNG FPM (Cổng mặc định là 9000)
EXPOSE 9000

# KHỞI ĐỘNG ỨNG DỤNG (Chạy PHP-FPM)
# Railway sẽ tự động xử lý Web Server (Nginx/Caddy) và proxy tới cổng 9000 này.
# Chúng ta sẽ định nghĩa lệnh Migration/Caching trong Railway Start Command.
CMD ["php-fpm"]