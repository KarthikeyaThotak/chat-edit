FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    ffmpeg \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .
COPY requirements-build.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY . .

# Build video-cli wheel if needed
RUN if [ -d "tools/video-cli" ]; then \
    cd tools/video-cli && \
    pip install wheel && \
    pip wheel . --no-deps -w .. || true; \
    fi

# Create uploads directory
RUN mkdir -p uploads

# Expose ports
EXPOSE 8000 8001

# Default command (will be overridden by docker-compose)
CMD ["python", "main.py"]
