# Multi-stage Dockerfile for Railway deployment

# Stage 1: Build Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./
RUN npm run build

# Stage 2: Python Backend Runtime
FROM python:3.11-slim AS runner

WORKDIR /app

# Install minimal OS build tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libffi-dev \
    && rm -rf /var/lib/apt/lists/*

# Install PyTorch CPU-only first for fast builds and low image size (<180MB vs 2.5GB)
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu

# Install Python requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code, policies, and employee data
COPY backend/ ./backend/

# Copy built frontend assets from stage 1
COPY --from=frontend-builder /app/frontend/build ./frontend/build

# Set environment variables
ENV PORT=8000
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1

EXPOSE 8000

# Start Uvicorn bound to Railway's assigned $PORT
CMD ["sh", "-c", "uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
