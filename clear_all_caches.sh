#!/bin/bash

echo "=== COMPREHENSIVE CACHE CLEARING ==="
echo ""

# 1. Clear PHP OpCache via web
echo "1. Clearing PHP OpCache via web..."
curl -s http://localhost/verify_loaded_code.php > /dev/null
echo "   Done"

# 2. Restart PHP-FPM (try multiple possible versions)
echo ""
echo "2. Restarting PHP-FPM..."
for version in php8.4-fpm php8.3-fpm php8.2-fpm php8.1-fpm php8.0-fpm php-fpm php7.4-fpm; do
    if systemctl list-unit-files | grep -q "^$version.service"; then
        echo "   Found $version, restarting..."
        sudo systemctl restart $version
        echo "   ✓ $version restarted"
    fi
done

# 3. Restart Apache/Nginx
echo ""
echo "3. Restarting web server..."
if systemctl list-unit-files | grep -q "^apache2.service"; then
    sudo systemctl restart apache2
    echo "   ✓ Apache2 restarted"
elif systemctl list-unit-files | grep -q "^httpd.service"; then
    sudo systemctl restart httpd
    echo "   ✓ httpd restarted"
fi

if systemctl list-unit-files | grep -q "^nginx.service"; then
    sudo systemctl restart nginx
    echo "   ✓ Nginx restarted"
fi

# 4. Touch all PHP files to update timestamps
echo ""
echo "4. Updating file timestamps..."
find /home/user/Mindline/custom -name "*.php" -exec touch {} \;
echo "   ✓ All PHP files touched"

# 5. Check if everything is running
echo ""
echo "5. Service status:"
for service in php8.4-fpm php8.3-fpm php8.2-fpm apache2 nginx; do
    if systemctl list-unit-files | grep -q "^$service.service"; then
        status=$(systemctl is-active $service)
        echo "   $service: $status"
    fi
done

echo ""
echo "=== CACHE CLEARING COMPLETE ==="
echo "Now test your application again"
