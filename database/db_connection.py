import mysql.connector
from mysql.connector import Error
import os
from pathlib import Path
from typing import Optional, Dict
from dotenv import load_dotenv

# Load .env from project root (parent of database/)
load_dotenv(Path(__file__).resolve().parent.parent / ".env")


class DatabaseConnection:
    def __init__(self):
        self.connection = None
        # Values loaded from .env via load_dotenv() at module import
        port = os.getenv('DB_PORT', '3306')
        self.config = {
            'host': os.getenv('DB_HOST', 'localhost'),
            'database': os.getenv('DB_NAME', 'pixelcut_db'),
            'user': os.getenv('DB_USER', 'root'),
            'password': os.getenv('DB_PASSWORD', ''),
            'port': int(port) if port else 3306
        }
    
    def connect(self):
        """Establish connection to MySQL database"""
        try:
            self.connection = mysql.connector.connect(**self.config)
            if self.connection.is_connected():
                return True
        except Error as e:
            print(f"Error connecting to MySQL: {e}")
            return False
    
    def disconnect(self):
        """Close database connection"""
        if self.connection and self.connection.is_connected():
            self.connection.close()
    
    def get_video_by_id(self, video_id: int) -> Optional[Dict]:
        """Get video information by ID from database"""
        try:
            if not self.connection or not self.connection.is_connected():
                self.connect()
            if self.connection is None:
                return None

            cursor = self.connection.cursor(dictionary=True)
            query = "SELECT * FROM videos WHERE id = %s"
            cursor.execute(query, (video_id,))
            result = cursor.fetchone()
            cursor.close()
            
            return result
        except Error as e:
            print(f"Error fetching video: {e}")
            return None

    def get_video_by_file_path(self, file_path: str) -> Optional[Dict]:
        """Get video record by file path (exact match or normalized path)."""
        try:
            if not self.connection or not self.connection.is_connected():
                self.connect()
            if self.connection is None:
                return None
            cursor = self.connection.cursor(dictionary=True)
            query = "SELECT * FROM videos WHERE file_path = %s"
            cursor.execute(query, (file_path,))
            result = cursor.fetchone()
            if result:
                cursor.close()
                return result
            # Try with normalized path (e.g. with forward slashes)
            normalized = str(Path(file_path).resolve())
            cursor.execute(query, (normalized,))
            result = cursor.fetchone()
            cursor.close()
            return result
        except Error as e:
            print(f"Error fetching video by path: {e}")
            return None

    def update_video_after_edit(self, video_id: int, file_path: str) -> bool:
        """Update video record after file was edited (e.g. trim, mute). Sets file_size from disk."""
        try:
            if not self.connection or not self.connection.is_connected():
                self.connect()
            if self.connection is None:
                return False
            if not os.path.isfile(file_path):
                return False
            file_size = os.path.getsize(file_path)
            cursor = self.connection.cursor()
            query = "UPDATE videos SET file_size = %s WHERE id = %s"
            cursor.execute(query, (file_size, video_id))
            self.connection.commit()
            cursor.close()
            return True
        except Error as e:
            print(f"Error updating video: {e}")
            if self.connection:
                self.connection.rollback()
            return False
    
    def insert_video(self, filename: str, file_path: str, file_url: str = None, file_size: int = None, duration: float = None, transcript_path: str = None) -> Optional[int]:
        """Insert a new video record and return the video ID"""
        try:
            if not self.connection or not self.connection.is_connected():
                self.connect()
            if self.connection is None:
                return None

            cursor = self.connection.cursor()
            query = """
                INSERT INTO videos (filename, file_path, file_url, file_size, duration, transcript_path, status)
                VALUES (%s, %s, %s, %s, %s, %s, 'active')
            """
            cursor.execute(query, (filename, file_path, file_url, file_size, duration, transcript_path))
            self.connection.commit()
            video_id = cursor.lastrowid
            cursor.close()
            
            return video_id
        except Error as e:
            print(f"Error inserting video: {e}")
            if self.connection:
                self.connection.rollback()
            return None

    def update_video_transcript(self, video_id: int, transcript_path: str) -> bool:
        """Set transcript_path for a video (e.g. after uploading transcript)."""
        try:
            if not self.connection or not self.connection.is_connected():
                self.connect()
            if self.connection is None:
                return False
            cursor = self.connection.cursor()
            query = "UPDATE videos SET transcript_path = %s WHERE id = %s"
            cursor.execute(query, (transcript_path, video_id))
            self.connection.commit()
            cursor.close()
            return True
        except Error as e:
            print(f"Error updating transcript: {e}")
            if self.connection:
                self.connection.rollback()
            return False
    
    def __enter__(self):
        self.connect()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.disconnect()
