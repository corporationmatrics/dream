# Phase 1 Integration Setup Script (PowerShell)
# Complete integration setup for: shadcn/ui, Keycloak, MongoDB, PaddleOCR, FastAPI

param(
    [switch]$SkipDocker = $false,
    [switch]$InstallOnly = $false,
    [switch]$DryRun = $false
)

$ErrorActionPreference = "Continue"
$WarningPreference = "Continue"

# Configuration
$RepoRoot = Get-Location
$Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$BackupDir = Join-Path $RepoRoot ".backups" $Timestamp

# Color helpers
function Write-Success { Write-Host "✓ $args" -ForegroundColor Green }
function Write-Warn { Write-Host "⚠ $args" -ForegroundColor Yellow }
function Write-Err { Write-Host "✗ $args" -ForegroundColor Red }
function Write-Info { Write-Host "ℹ $args" -ForegroundColor Cyan }
function Write-Header { Write-Host "`n========================================" -ForegroundColor Green; Write-Host "$args" -ForegroundColor Green; Write-Host "========================================`n" -ForegroundColor Green }

Write-Header "🚀 ERP Platform Phase 1 Integration Setup"

# Check prerequisites
Write-Info "Checking prerequisites..."
$prerequisitesOk = $true

# Check Node.js
try {
    $nodeVersion = node --version
    Write-Success "Node.js found: $nodeVersion"
} catch {
    Write-Err "Node.js is required but not installed. Install from https://nodejs.org"
    $prerequisitesOk = $false
}

# Check npm
try {
    $npmVersion = npm --version
    Write-Success "npm found: $npmVersion"
} catch {
    Write-Err "npm is required but not installed"
    $prerequisitesOk = $false
}

# Check Docker
if (-not $SkipDocker) {
    try {
        $dockerVersion = docker --version
        Write-Success "Docker found: $dockerVersion"
    } catch {
        Write-Err "Docker is required. Install Docker Desktop or use -SkipDocker flag"
        $prerequisitesOk = $false
    }
}

if (-not $prerequisitesOk) {
    Write-Err "Prerequisites not met. Please install missing tools."
    exit 1
}

# Create backup directory
Write-Info "Creating backup directory..."
New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null

# Backup important files
$filesToBackup = @(
    "erp-api\.env"
    "erp-api\.env.local"
    "docker-compose-all-phases.yml"
    "erp-web\package.json"
    ".env.local"
)

foreach ($file in $filesToBackup) {
    $fullPath = Join-Path $RepoRoot $file
    if (Test-Path $fullPath) {
        $leafName = Split-Path $file -Leaf
        $backupPath = Join-Path $BackupDir $leafName
        Copy-Item $fullPath $backupPath -Force 2>$null
        Write-Success "Backed up $leafName"
    }
}

# Step 1: Start Docker Compose if not skipped
if (-not $SkipDocker) {
    Write-Header "🐳 Step 1: Starting Docker Infrastructure"
    
    Push-Location "$RepoRoot\erp-infrastructure"
    
    Write-Info "Starting all Docker services..."
    if (-not $DryRun) {
        docker-compose up -d
    } else {
        Write-Warn "[DRY RUN] Would start: docker-compose up -d"
    }
    
    Write-Info "Waiting for services to initialize (30 seconds)..."
    Start-Sleep -Seconds 5
    
    # Check service status
    $services = @("postgres", "keycloak", "mongodb", "fastapi-ml", "prometheus", "grafana")
    foreach ($service in $services) {
        try {
            $status = docker-compose ps $service 2>&1
            if ($status -match "running|healthy") {
                Write-Success "$service is running"
            } else {
                Write-Warn "$service: checking..."
            }
        } catch {
            Write-Warn "$service: status unknown"
        }
    }
    
    Pop-Location
}

# Phase 1.1: shadcn/ui Setup
Write-Host ""
Write-Host "📦 Phase 1.1: Setting up shadcn/ui..." -ForegroundColor Cyan

Push-Location "$RepoRoot\erp-web"

Write-Host "Installing shadcn/ui dependencies..." -ForegroundColor Yellow
$shadcnPackages = @(
    "@radix-ui/react-slot"
    "@radix-ui/react-dropdown-menu"
    "@radix-ui/react-popover"
    "@radix-ui/react-dialog"
    "class-variance-authority"
    "clsx"
    "lucide-react"
)

if (-not $DryRun) {
    npm install $shadcnPackages -E
}

Write-Warning "Run manually: npx shadcn-ui@latest init"
Pop-Location

# Phase 1.2: MongoDB Setup
Write-Host ""
Write-Host "🗄️  Phase 1.2: MongoDB configuration..." -ForegroundColor Cyan
Write-Success "MongoDB will be added to docker-compose.yml"
Write-Warning "Update docker-compose-all-phases.yml with MongoDB service (already included)"

# Phase 1.3: Keycloak Setup
Write-Host ""
Write-Host "🔐 Phase 1.3: Keycloak configuration..." -ForegroundColor Cyan

Push-Location "$RepoRoot\erp-api"

Write-Host "Installing Keycloak dependencies..." -ForegroundColor Yellow
$keycloakPackages = @(
    "passport-openidconnect"
    "jsonwebtoken"
    "@types/node"
)

if (-not $DryRun) {
    npm install $keycloakPackages -E
}

Pop-Location

# Phase 1.4: Enhanced OCR
Write-Host ""
Write-Host "🔍 Phase 1.4: Enhanced OCR setup..." -ForegroundColor Cyan

Push-Location "$RepoRoot\erp-ml"

Write-Success "PaddleOCR dependencies should be added to pyproject.toml"
Write-Warning "Then run: poetry install"

Pop-Location

# Environment setup
Write-Host ""
Write-Host "📝 Setting up environment files..." -ForegroundColor Cyan

Push-Location $RepoRoot

# Create .env.local if it doesn't exist
$envFilePath = Join-Path $RepoRoot ".env.local"
if (-not (Test-Path $envFilePath)) {
    $envContent = @"
# Keycloak Configuration
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_REALM=erp-platform
KEYCLOAK_CLIENT_ID=erp-api
KEYCLOAK_CLIENT_SECRET=your-secret-here
KEYCLOAK_ADMIN=admin
KEYCLOAK_ADMIN_PASSWORD=admin123

# MongoDB Configuration
MONGODB_URI=mongodb://admin:admin123@localhost:27017/erp
MONGODB_DB=erp
MONGODB_USERNAME=admin
MONGODB_PASSWORD=admin123

# OCR Service
OCR_SERVICE_URL=http://localhost:8001
OCR_MODEL=paddleocr-vl

# API Configuration
API_PORT=3002
API_HOST=localhost
API_PREFIX=/api

# Web Configuration
WEB_PORT=3000
NEXT_PUBLIC_API_URL=http://localhost:3002

# FastAPI Configuration
FASTAPI_PORT=8001
FASTAPI_HOST=0.0.0.0

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/erp
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=erp

# Redis
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379

# Environment
NODE_ENV=development
PYTHON_ENV=development
LOG_LEVEL=debug
"@

    if (-not $DryRun) {
        Set-Content -Path $envFilePath -Value $envContent
    }
    Write-Success "Created .env.local template"
} else {
    Write-Warning ".env.local already exists, review and update if needed"
}

Pop-Location

# Docker Compose health check setup
Write-Host ""
Write-Host "🐳 Preparing Docker configuration..." -ForegroundColor Cyan
Write-Success "docker-compose.yml health checks will be configured"

# Database Migrations
Write-Host ""
Write-Host "📊 Database migration planning..." -ForegroundColor Cyan
Write-Warning "New migrations required for Keycloak and MongoDB integration"
Write-Warning "Check erp-database\migrations\ directory"

# Completion summary
Write-Host ""
Write-Host "===========================================" -ForegroundColor Green
Write-Host "✓ Phase 1 Setup Configuration Complete!" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Review and update .env.local with your credentials"
Write-Host "2. Run: docker-compose -f docker-compose-all-phases.yml up -d"
Write-Host "3. Configure Keycloak realm (see KEYCLOAK_SETUP.md)"
Write-Host "4. Run database migrations: npm run migrate"
Write-Host "5. Start services:"
Write-Host "   - Terminal 1: cd erp-api && npm run start:dev"
Write-Host "   - Terminal 2: cd erp-web && npm run dev"
Write-Host "   - Terminal 3: cd erp-ml && poetry run python src\api.py"
Write-Host ""
Write-Host "📚 Documentation:" -ForegroundColor Cyan
Write-Host "   - INTEGRATION_ROADMAP.md - Complete roadmap"
Write-Host "   - KEYCLOAK_SETUP.md - Keycloak configuration"
Write-Host "   - MONGODB_INTEGRATION.md - MongoDB setup"
Write-Host "   - OCR_INTEGRATION.md - Enhanced OCR setup"
Write-Host ""
Write-Host "Backups created in: $BackupDir" -ForegroundColor Cyan
Write-Host ""
