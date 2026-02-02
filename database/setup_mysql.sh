#!/bin/bash

# MySQL/MariaDB Setup Script for PixelCut

echo "Setting up MySQL/MariaDB for PixelCut..."

# Check if MySQL/MariaDB is installed
if ! command -v mysql &> /dev/null; then
    echo "MySQL/MariaDB client not found. Installing..."
    sudo apt-get update
    sudo apt-get install -y mariadb-server mariadb-client
fi

# Start MySQL/MariaDB service
echo "Starting MySQL/MariaDB service..."
sudo service mariadb start 2>/dev/null || sudo systemctl start mariadb 2>/dev/null || sudo mysqld_safe --user=mysql &

# Wait a moment for service to start
sleep 3

# Check if service is running
if pgrep -x "mysqld" > /dev/null || pgrep -x "mariadb" > /dev/null; then
    echo "MySQL/MariaDB service is running."
else
    echo "Warning: Could not verify MySQL/MariaDB is running."
    echo "You may need to start it manually with: sudo service mariadb start"
fi

# Create database and tables
echo "Creating database and tables..."
mysql -u root -p < schema.sql

echo "Setup complete!"
echo ""
echo "To secure your MySQL installation, run: sudo mysql_secure_installation"
echo "To set a root password, run: sudo mysql -e \"ALTER USER 'root'@'localhost' IDENTIFIED BY 'your_password';\""
