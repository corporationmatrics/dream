# Development Quick Start Guide

## Prerequisites

Ensure the following are installed:
- Node.js v18+ ([Download](https://nodejs.org/))
- npm v9+ (included with Node.js)
- Docker Desktop ([Download](https://www.docker.com/products/docker-desktop))
- Git

## Installation Steps

### 1. Install Node.js Dependencies

Run the automated setup script:

```powershell
powershell -ExecutionPolicy Bypass -File .\setup-dev.ps1
```

Or manually for each project:

```bash
# API
cd erp-api && npm install --legacy-peer-deps && cd ..

# Web
cd erp-web && npm install --legacy-peer-deps && cd ..

# Common Library
cd erp-common-lib && npm install && cd ..

# Mobile
cd erp-mobile && npm install && cd ..

# Mobile Admin
cd erp-mobile-admin && npm install && cd ..

# Documentation
cd erp-docs && npm install && cd ..
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` in each project:

```bash
# API
cp erp-api/.env.example erp-api/.env

# Infrastructure
cp erp-infrastructure/.env.example erp-infrastructure/.env

# ML
cp erp-ml/.env.example erp-ml/.env
```

### 3. Start Infrastructure Services

Start Docker services (PostgreSQL, KeyDB, MinIO, Meilisearch):

```bash
cd erp-infrastructure
docker-compose up -d
cd ..
```

Verify services are running:

```bash
docker-compose ps
```

Services will be available at:
- **PostgreSQL**: `localhost:5432` (user: `postgres`, password: `postgres`)
- **KeyDB**: `localhost:6379`
- **MinIO**: `http://localhost:9000` (console: `http://localhost:9001`)
- **Meilisearch**: `http://localhost:7700`

### 4. Initialize Database

Run database migrations:

```bash
cd erp-database

# Using psql directly
psql -h localhost -U postgres -c "CREATE DATABASE erp_platform;" 2>/dev/null || true
psql -h localhost -U postgres -d erp_platform < migrations/001_initial_schema.sql
psql -h localhost -U postgres -d erp_platform < migrations/002_accounting_schema.sql
psql -h localhost -U postgres -d erp_platform < seeds/001_initial_data.sql

cd ..
```

## Running Development Servers

Open separate terminal windows for each service:

### Terminal 1: API Server

```bash
cd erp-api
npm run start:dev
```

API will be available at: `http://localhost:3000`
- Health check: `http://localhost:3000/health`

### Terminal 2: Web Application

```bash
cd erp-web
npm run dev
```

Web app will be available at: `http://localhost:3000` (or next available port)

### Terminal 3: ML Services (Optional)

```bash
cd erp-ml
poetry install  # First time only
poetry run python main.py
```

ML API will be available at: `http://localhost:8000`

### Terminal 4: Mobile Development (Optional)

```bash
cd erp-mobile
npm start
```

Press `a` for Android, `i` for iOS, or `w` for web.

## Useful Development Commands

### API (NestJS)

```bash
cd erp-api

# Development mode with hot reload
npm run start:dev

# Production mode
npm run build && npm run start:prod

# Run tests
npm run test

# Run tests with coverage
npm run test:cov

# Lint code
npm run lint
```

### Web (Next.js)

```bash
cd erp-web

# Development mode
npm run dev

# Build for production
npm run build

# Run production build
npm run start

# Lint code
npm run lint
```

### Database Management

```bash
cd erp-database

# Create backup
./scripts/backup.sh erp_platform ./backups

# Restore from backup
./scripts/restore.sh ./backups/erp_platform_20260204_000000.sql.gz
```

### Infrastructure

```bash
cd erp-infrastructure

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: Deletes data)
docker-compose down -v

# Rebuild images
docker-compose build
```

## Environment Variables

Each service has configuration in `.env`:

### erp-api
```
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=erp_platform
JWT_SECRET=your-secret-key-here
APP_PORT=3000
NODE_ENV=development
```

### erp-infrastructure
```
DATABASE_HOST=postgres
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin
```

### erp-ml
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/erp_platform
API_PORT=8000
ENVIRONMENT=development
```

## Troubleshooting

### Port Already in Use

If port 3000 is already in use:

**For API:**
```bash
cd erp-api
npm run start:dev -- --port 3001
```

**For Web:**
```bash
cd erp-web
PORT=3001 npm run dev
```

### Database Connection Error

Verify PostgreSQL is running:

```bash
psql -h localhost -U postgres -c "SELECT version();"
```

### Docker Services Won't Start

Ensure Docker Desktop is running and has sufficient resources allocated.

### npm Install Fails

Try clearing npm cache:

```bash
npm cache clean --force
npm install --legacy-peer-deps
```

## Next Steps

1. ✅ Install dependencies
2. ✅ Configure environment variables
3. ✅ Start infrastructure
4. ✅ Initialize database
5. 🔨 **You are here**: Start development servers
6. 📚 Check [Architecture Documentation](./erp-docs/docs/architecture/overview.md)
7. 🔀 Create a feature branch: `git checkout -b feature/your-feature`
8. 💻 Start developing!

## API Documentation

Once the API server is running, visit:
- Swagger UI: `http://localhost:3000/api/docs`
- OpenAPI JSON: `http://localhost:3000/api-json`

## Git Workflow

```bash
# Create feature branch
git checkout -b feature/feature-name

# Make changes and commit
git add .
git commit -m "feat: description of changes"

# Push to repository
git push origin feature/feature-name

# Create pull request on GitHub
```

## Support

For detailed documentation, see:
- [Installation Guide](./erp-docs/docs/getting-started/installation.md)
- [Architecture Overview](./erp-docs/docs/architecture/overview.md)
- [Technology Stack](./FINAL_README.md)

---

**Happy coding!** 🚀
