#!/bin/sh
set -e

echo ">> Starting E-Devlet application..."

cd /var/www/html

# Lumen does not support config:cache or route:cache.
# We only need to clear the application data cache.
echo ">> Clearing application cache..."
php artisan cache:clear || echo "Cache clear failed, continuing..."

# Run migrations if needed
if [ "${RUN_MIGRATIONS:-false}" = "true" ]; then
    echo ">> Running database migrations..."
    php artisan migrate --force
fi

# Ensure storage directories exist and are writable for www-data/appuser
# Even with Redis sessions, Lumen needs 'storage/logs' and 'storage/framework/views'
mkdir -p storage/logs storage/framework/views
# Note: Since you are using a custom user/group, make sure they own these:
# chown -R www-data:www-data storage.

echo ">> Application ready. Starting services...."

exec "$@"
