# =============================================================================
# Bookify API - Multi-stage Dockerfile (Root directory)
# Optimized for Render.com free tier (512MB RAM)
# =============================================================================

# Stage 1: Build Node.js dependencies
FROM node:20-bookworm-slim AS node-builder
WORKDIR /app

# Copy root package.json and lockfile (to leverage workspaces natively)
COPY package.json package-lock.json ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/

# Install dependencies for workspaces
RUN npm ci --ignore-scripts && npm cache clean --force

# Copy frontend source and build
COPY frontend/ frontend/
RUN cd frontend && npm run build

# Stage 2: Production runtime (Python + Node.js)
FROM python:3.11-slim-bookworm AS production

# Install WeasyPrint system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
  libpango-1.0-0 \
  libpangocairo-1.0-0 \
  libpangoft2-1.0-0 \
  libgdk-pixbuf2.0-0 \
  libffi-dev \
  libcairo2 \
  libcairo-gobject2 \
  libgirepository1.0-dev \
  gir1.2-pango-1.0 \
  fonts-liberation \
  fonts-dejavu-core \
  fonts-noto-core \
  curl \
  && rm -rf /var/lib/apt/lists/*

# Install WeasyPrint
RUN pip install --no-cache-dir weasyprint==62.3

# Install Node.js 20 in the Python image
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
  && apt-get install -y --no-install-recommends nodejs \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy the monorepo from builder
COPY --from=node-builder /app/node_modules ./node_modules
COPY --from=node-builder /app/package.json ./package.json

# Copy backend application code
COPY backend/ ./backend/

# Copy frontend build output
COPY --from=node-builder /app/frontend/dist ./frontend/dist

# Make Python scripts executable
RUN chmod +x backend/python/pdf_render.py

# Create non-root user for security
RUN useradd --create-home --shell /bin/bash appuser
RUN chown -R appuser:appuser /app
USER appuser

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

EXPOSE 3000

ENV NODE_ENV=production

# Set root directory to backend for executing
WORKDIR /app/backend

# Limit Node.js heap to 256MB (leave ~256MB for WeasyPrint/Python)
CMD ["node", "--max-old-space-size=256", "src/server.js"]
