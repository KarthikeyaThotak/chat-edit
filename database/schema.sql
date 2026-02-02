-- Create database
CREATE DATABASE IF NOT EXISTS pixelcut_db;
USE pixelcut_db;

-- If you already have the videos table, add transcript_path with:
-- ALTER TABLE videos ADD COLUMN transcript_path VARCHAR(500) AFTER file_url;

-- Create videos table
CREATE TABLE IF NOT EXISTS videos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_url VARCHAR(500),
    transcript_path VARCHAR(500),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    file_size BIGINT,
    duration FLOAT,
    status VARCHAR(50) DEFAULT 'active',
    INDEX idx_status (status),
    INDEX idx_uploaded_at (uploaded_at)
);
