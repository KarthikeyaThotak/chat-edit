# Docker Setup for Drafft Backend

This setup containerizes all backend services including Python APIs and MySQL database.

## Services

- **MySQL Database** (Port 3306)
- **Main Backend API** (Port 8000) - FastAPI server with video editing tools
- **Transcript Backend API** (Port 8001) - Gemini-based transcript generation

## Prerequisites

- Docker and Docker Compose installed
- `.env` file with required environment variables (see below)

## Environment Variables

Create a `.env` file in the project root with:

```env
# Database Configuration
DB_HOST=mysql
DB_PORT=3306
DB_NAME=pixelcut_db
DB_USER=root
DB_PASSWORD=your_mysql_password

# API Keys
GEMINI_API_KEY=your_gemini_api_key
GOOGLE_API_KEY=your_google_api_key

# Firebase (if needed)
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

## Quick Start

### Using the main.sh script (Recommended)

```bash
./main.sh
```

This script will:
1. Check for `.env` file
2. Build Docker images
3. Start MySQL and wait for it to be ready
4. Initialize database schema
5. Start both backend services
6. Show service status and URLs

### Using Docker Compose directly

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Stop and remove volumes (clears database)
docker-compose down -v
```

## Service URLs

Once running, services are available at:

- **Main API**: http://localhost:8000
  - API docs: http://localhost:8000/docs
  - Endpoints: `/upload`, `/chat`, `/download/{video_id}`, `/tools/*`

- **Transcript API**: http://localhost:8001
  - Endpoint: `/generate-transcript`

- **MySQL**: localhost:3306
  - Database: `pixelcut_db`
  - User: `root` (or from DB_USER env var)

## Useful Commands

```bash
# View logs for specific service
docker-compose logs -f backend-main
docker-compose logs -f backend-transcript
docker-compose logs -f mysql

# Restart a service
docker-compose restart backend-main

# Execute command in container
docker-compose exec backend-main bash
docker-compose exec mysql mysql -uroot -p pixelcut_db

# Rebuild after code changes
docker-compose build backend-main
docker-compose up -d backend-main
```

## Troubleshooting

### Port already in use
If ports 8000, 8001, or 3306 are already in use:
```bash
# Stop existing containers
docker-compose down

# Or change ports in docker-compose.yml
```

### Database connection issues
- Check MySQL is healthy: `docker-compose ps`
- Check logs: `docker-compose logs mysql`
- Verify environment variables in `.env`

### Service won't start
- Check logs: `docker-compose logs [service-name]`
- Verify all environment variables are set
- Rebuild: `docker-compose build --no-cache`

## Development

For development with hot-reload, you can mount volumes (already configured):
- Code changes in `backend/` are reflected immediately
- Uploads are persisted in `backend/uploads/`

## Production Considerations

For production:
1. Use strong passwords in `.env`
2. Set up proper MySQL backups
3. Configure resource limits in `docker-compose.yml`
4. Use environment-specific `.env` files
5. Set up reverse proxy (nginx) for HTTPS
6. Configure proper CORS origins
