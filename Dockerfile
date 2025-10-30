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

# Copy data directory (for customer keys)
COPY data/ ./data/ 2>/dev/null || mkdir -p ./data

# Copy .env (if exists, or use environment variables)
COPY .env .env 2>/dev/null || echo "OPENAI_API_KEY=your_key_here" > .env

# Expose port
EXPOSE 8000

# Run backend
CMD ["python", "backend/api.py"]

