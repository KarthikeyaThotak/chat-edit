# Database Module

This module handles MySQL database connections and queries for the PixelCut backend.

## Setup

### Quick Setup (Using setup script)
```bash
cd database
./setup_mysql.sh
```

### Manual Setup

1. **Install MySQL/MariaDB server** (if not already installed):
   ```bash
   sudo apt-get update
   sudo apt-get install -y mariadb-server mariadb-client
   ```

2. **Start MySQL/MariaDB service**:
   ```bash
   sudo service mariadb start
   # OR
   sudo systemctl start mariadb
   ```

3. **Secure installation** (optional but recommended):
   ```bash
   sudo mysql_secure_installation
   ```

4. **Create database and tables**:
   ```bash
   mysql -u root -p < schema.sql
   ```
   
   If you don't have a password set, try:
   ```bash
   sudo mysql < schema.sql
   ```

### Troubleshooting Connection Errors

**Error: "Can't connect to local server through socket"**

This usually means MySQL/MariaDB server is not running. Try:

1. **Check if MySQL is running**:
   ```bash
   ps aux | grep mysql
   ```

2. **Start the service**:
   ```bash
   sudo service mariadb start
   ```

3. **For WSL users**, you may need to start MySQL manually:
   ```bash
   sudo mysqld_safe --user=mysql &
   ```

4. **Check service status**:
   ```bash
   sudo service mariadb status
   ```

5. **If using MariaDB**, the service might be named `mariadb` instead of `mysql`

### Database Schema

The `videos` table structure:

```sql
CREATE TABLE videos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_url VARCHAR(500),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    file_size BIGINT,
    duration FLOAT,
    status VARCHAR(50) DEFAULT 'active'
);
```

## Environment Variables

Set these environment variables or update the defaults in `db_connection.py`:

- `DB_HOST`: MySQL host (default: localhost)
- `DB_NAME`: Database name (default: pixelcut_db)
- `DB_USER`: MySQL username (default: root)
- `DB_PASSWORD`: MySQL password (default: empty)
- `DB_PORT`: MySQL port (default: 3306)

## For DigitalOcean Deployment

On DigitalOcean, you'll need to:
1. Install MySQL server on your droplet
2. Configure firewall to allow MySQL connections (if needed)
3. Set environment variables in your deployment configuration
4. Run the schema.sql to create the database and tables
