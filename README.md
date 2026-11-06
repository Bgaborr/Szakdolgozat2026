docker compose exec laravel cp .env.example .env
docker compose exec laravel php artisan key:generate
docker compose exec laravel php artisan storage:link
docker compose exec laravel chown -R www-data:www-data storage bootstrap/cache
