#!/bin/bash

# Main script to run all Python services and databases
# This script sets up and runs the entire backend infrastructure

set -e

echo "🚀 Starting Drafft Backend Services..."

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env file not found. Creating from .env.example if it exists..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "📝 Created .env from .env.example. Please update it with your actual values."
    else
        echo "❌ Error: .env file not found and .env.example doesn't exist."
        echo "Please create a .env file with required environment variables."
        exit 1
    fi
fi

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running. Please start Docker and try again."
    exit 1
fi

# Clean up any old/corrupted containers
echo "🧹 Cleaning up old containers..."
docker-compose down -v 2>/dev/null || true
docker-compose rm -f 2>/dev/null || true

# Remove any corrupted containers
docker ps -a --filter "name=drafft-" --format "{{.ID}}" | xargs -r docker rm -f 2>/dev/null || true

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        echo "⚠️  Port $port is already in use. Stopping existing container..."
        docker-compose down
        sleep 2
    fi
}

# Check ports
check_port 8080
check_port 8000
check_port 8001
check_port 3306

# Build and start services
echo "📦 Building Docker images..."
docker-compose build

echo "🗄️  Starting MySQL database..."
docker-compose up -d mysql

# Wait for MySQL to be ready
echo "⏳ Waiting for MySQL to be ready..."
timeout=60
counter=0
while ! docker-compose exec -T mysql mysqladmin ping -h localhost --silent >/dev/null 2>&1; do
    sleep 2
    counter=$((counter + 2))
    if [ $counter -ge $timeout ]; then
        echo "❌ Error: MySQL failed to start within $timeout seconds"
        docker-compose logs mysql
        exit 1
    fi
    echo -n "."
done
echo ""
echo "✅ MySQL is ready!"

# Initialize database schema if needed
echo "📋 Initializing database schema..."
sleep 2
docker-compose exec -T mysql mysql -uroot -p${DB_PASSWORD:-rootpassword} ${DB_NAME:-pixelcut_db} < database/schema.sql 2>/dev/null || echo "⚠️  Schema initialization skipped (may already exist)"

# Start backend and frontend services
echo "🚀 Starting backend and frontend services..."
docker-compose up -d backend-main backend-transcript frontend

# Wait a moment for services to start
sleep 3

# Show status
echo ""
echo "📊 Service Status:"
docker-compose ps

echo ""
echo "✅ All services are running!"
echo ""
echo "🌐 Service URLs:"
echo "   Frontend:      http://localhost:8080"
echo "   Main API:      http://localhost:8000"
echo "   Transcript API: http://localhost:8001"
echo "   MySQL:         localhost:3306"
echo ""
echo "📝 Useful commands:"
echo "   View logs:     docker-compose logs -f"
echo "   Stop services: docker-compose down"
echo "   Restart:       docker-compose restart"
echo ""
echo "🔍 To view logs in real-time, run:"
echo "   docker-compose logs -f frontend backend-main backend-transcript"

