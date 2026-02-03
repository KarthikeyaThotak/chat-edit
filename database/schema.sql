-- Drafft Database Schema
-- This file initializes the database tables for the Drafft application

CREATE DATABASE IF NOT EXISTS drafft_db;
USE drafft_db;

-- Videos table to store uploaded videos and their transcripts
CREATE TABLE IF NOT EXISTS videos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_url VARCHAR(500),
    file_size BIGINT,
    duration FLOAT,
    transcript_path VARCHAR(500),
    status VARCHAR(50) DEFAULT 'active',
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_uploaded_at (uploaded_at),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
