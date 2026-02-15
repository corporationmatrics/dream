# Optimized single-stage build for ERP ML (FastAPI + OCR/ML deps)
# Uses pip with PEP 517 backend (poetry-core) to install from pyproject.toml
FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    API_PORT=8000 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_DEFAULT_TIMEOUT=120 \
    PIP_RETRIES=5

WORKDIR /app

# Install system dependencies commonly required by scientific/ML/OCR stacks
# - libgomp1: OpenMP (numpy/scikit-learn)
# - libgl1, libglib2.0-0, libsm6, libxext6, libxrender1: OpenCV GUI deps
# - build-essential, gcc, g++: fallback for any source builds
# - libpq-dev: psycopg2 headers
# - libopenblas-dev: optimized BLAS (numpy/scipy/sklearn)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
    g++ \
    curl \
    libpq-dev \
    libopenblas-dev \
    libgomp1 \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    && rm -rf /var/lib/apt/lists/*

# Copy dependency manifests early for layer caching
COPY pyproject.toml poetry.lock* ./

# Install pip tooling and project dependencies from pyproject.toml using PEP 517
# (poetry-core backend is defined in pyproject.toml [build-system])
RUN python -m pip install --upgrade pip setuptools wheel && \
    pip install --no-cache-dir --prefer-binary .

# Copy application code after dependencies are installed
COPY . .

# Health check (FastAPI should expose /health)
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -fsS http://localhost:8000/health || exit 1

# Expose port
EXPOSE 8000

# Start FastAPI server (no reload in container)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
