FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ ./backend/

# Copy models directory (if exists)
COPY models/ ./models/ 2>/dev/null || mkdir -p ./models

# Copy data directory if it exists
COPY data/ ./data/

# Use environment variables or Docker secrets instead of copying .env

# Expose port
EXPOSE 8000

# Run backend (bind to Railway's PORT if provided)
CMD ["sh", "-c", "uvicorn backend.api:app --host 0.0.0.0 --port ${PORT:-8000}"]

