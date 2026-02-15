# ============================================================================
# ERP PLATFORM - UNIFIED STARTUP SCRIPT
# ============================================================================
# Consolidated script to manage all services
# Run from: D:\UPENDRA\e-HA Matrix\Dream\
# ============================================================================

param(
    [ValidateSet("all", "backend", "frontend", "docker", "stop", "test")]
    [string]$Service = "all"
)

function Write-Header {
    param([string]$Text)
    Write-Host "`n╔════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║ $($Text.PadRight(64)) ║" -ForegroundColor Cyan
    Write-Host "╚════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
}

function Start-DockerServices {
    Write-Header "Starting Docker Services"
    Write-Host "▶ Starting PostgreSQL, KeyDB, MinIO, Keycloak..." -ForegroundColor White
    
    docker-compose up -d
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Docker services started" -ForegroundColor Green
        Write-Host "▶ Waiting for services to initialize (15 seconds)..." -ForegroundColor White
        Start-Sleep -Seconds 15
        
        Write-Host "▶ Service Status:" -ForegroundColor White
        docker ps --format "table {{.Names}}\t{{.Status}}"
    } else {
        Write-Host "❌ Failed to start Docker services" -ForegroundColor Red
        exit 1
    }
}

function Start-BackendService {
    Write-Header "Starting NestJS Backend"
    cd erp-api
    
    Write-Host "▶ Installing dependencies..." -ForegroundColor White
    npm install --legacy-peer-deps 2>&1 | Out-Null
    
    Write-Host "▶ Starting backend (npm run start:dev)..." -ForegroundColor White
    Write-Host "Backend will listen on http://localhost:3002" -ForegroundColor Cyan
    Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
    
    npm run start:dev
}

function Start-FrontendService {
    Write-Header "Starting Next.js Frontend"
    cd erp-web
    
    Write-Host "▶ Installing dependencies..." -ForegroundColor White
    npm install --legacy-peer-deps 2>&1 | Out-Null
    
    Write-Host "▶ Starting frontend (npm run dev)..." -ForegroundColor White
    Write-Host "Frontend available at http://localhost:3000" -ForegroundColor Cyan
    Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
    
    npm run dev
}

function Stop-AllServices {
    Write-Header "Stopping All Services"
    
    Write-Host "▶ Stopping Docker containers..." -ForegroundColor White
    docker-compose down
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ All services stopped" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to stop some services" -ForegroundColor Red
    }
}

function Test-AllServices {
    Write-Header "Testing All Services"
    
    Write-Host "▶ Backend Health Check..." -ForegroundColor White
    try {
        $health = Invoke-WebRequest -Uri "http://localhost:3002/health" -UseBasicParsing -TimeoutSec 5
        if ($health.StatusCode -eq 200) {
            Write-Host "✅ Backend running on port 3002" -ForegroundColor Green
        }
    } catch {
        Write-Host "❌ Backend not responding" -ForegroundColor Red
    }
    
    Write-Host "▶ Frontend Check..." -ForegroundColor White
    try {
        $frontend = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 5
        if ($frontend.StatusCode -eq 200) {
            Write-Host "✅ Frontend running on port 3000" -ForegroundColor Green
        }
    } catch {
        Write-Host "❌ Frontend not responding" -ForegroundColor Red
    }
    
    Write-Host "▶ Database Check..." -ForegroundColor White
    try {
        $db = docker exec erp-postgres psql -U postgres -d erp -c "SELECT 1;" 2>$null
        Write-Host "✅ Database is responsive" -ForegroundColor Green
    } catch {
        Write-Host "❌ Database not responding" -ForegroundColor Red
    }
}

# Show help
if ($Service -eq "help") {
    Write-Header "ERP Platform - Startup Script"
    Write-Host @"
USAGE: ./startup.ps1 [Service]

SERVICES:
  all       Start Docker, then show options (DEFAULT)
  docker    Start all Docker containers
  backend   Start NestJS backend (requires Docker running)
  frontend  Start Next.js frontend (requires Docker running)
  stop      Stop all Docker containers
  test      Test all services
  help      Show this message

QUICK START (use 3 terminals):
  Terminal 1: ./startup.ps1 docker
  Terminal 2: ./startup.ps1 backend
  Terminal 3: ./startup.ps1 frontend

SERVICES & PORTS:
  Frontend (Next.js)     → http://localhost:3000
  Backend (NestJS)       → http://localhost:3002
  Database (PostgreSQL)  → localhost:5432
  Keycloak               → http://localhost:8082
  MinIO                  → http://localhost:9000
  KeyDB                  → localhost:6379

MORE INFO:
  QUICK_START.md           - Setup and run guide
  PROJECT_JOURNEY.md       - Complete project overview
  AUTH_QUICK_REFERENCE.md  - API documentation
"@
    exit 0
}

$maxWait = 180  # 3 minutes
$elapsed = 0
$checkInterval = 5

while ($elapsed -lt $maxWait) {
    $status = docker-compose ps --format json 2>&1
    
    if ($status -and $status -notmatch "error") {
        try {
            $statusObj = $status | ConvertFrom-Json
            
            if ($statusObj) {
                $healthy = ($statusObj | Where-Object { $_.Health -eq "healthy" -or $_.State -eq "running" }).Count
                $total = $statusObj.Count
                
                Write-Host "  Services: $healthy/$total healthy/running" -ForegroundColor Gray
                
                # Check if all services are at least running
                $allRunning = ($statusObj | Where-Object { $_.State -ne "running" }).Count -eq 0
                
                if ($allRunning -and $healthy -ge 3) {
                    Write-Host ""
                    Write-Host "  ✓ All services are running!" -ForegroundColor Green
                    break
                }
            }
        }
        catch {
            # JSON parse error, continue waiting
        }
    }
    
    Start-Sleep -Seconds $checkInterval
    $elapsed += $checkInterval
}

if ($elapsed -ge $maxWait) {
    Write-Host ""
    Write-Host "  ⚠ Services took longer than expected to start" -ForegroundColor Yellow
    Write-Host "  Check status with: docker-compose ps" -ForegroundColor Gray
    Write-Host "  Check logs with: docker-compose logs" -ForegroundColor Gray
}

Write-Host ""

# ============================================================================
# STEP 4: Display service status
# ============================================================================
Write-Host "STEP 4: Verifying service status..." -ForegroundColor Yellow
Write-Host ""

docker-compose ps

Write-Host ""

# ============================================================================
# STEP 5: Create .env files for application services
# ============================================================================
Write-Host "STEP 5: Setting up .env files..." -ForegroundColor Yellow

# Copy .env.example to .env for erp-api if not exists
if (-not (Test-Path "$projectRoot\erp-api\.env")) {
    Copy-Item "$projectRoot\erp-api\.env.example" "$projectRoot\erp-api\.env"
    Write-Host "  ✓ Created erp-api/.env" -ForegroundColor Green
} else {
    Write-Host "  ✓ erp-api/.env already exists" -ForegroundColor Gray
}

# Copy .env.example to .env for erp-ml if not exists
if (-not (Test-Path "$projectRoot\erp-ml\.env")) {
    Copy-Item "$projectRoot\erp-ml\.env.example" "$projectRoot\erp-ml\.env"
    
    # Fix the database name in erp-ml/.env
    $envContent = Get-Content "$projectRoot\erp-ml\.env"
    $envContent = $envContent -replace "erp_platform", "erp"
    Set-Content "$projectRoot\erp-ml\.env" $envContent
    
    Write-Host "  ✓ Created erp-ml/.env (fixed database name)" -ForegroundColor Green
} else {
    Write-Host "  ✓ erp-ml/.env already exists" -ForegroundColor Gray
}

Write-Host ""

# ============================================================================
# STEP 6: Display next steps
# ============================================================================
Write-Host "=== FOUNDATION SERVICES STARTED SUCCESSFULLY ===" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps - Start Application Services Locally:" -ForegroundColor Cyan
Write-Host ""

Write-Host "TERMINAL 1 - Backend API (NestJS):" -ForegroundColor Yellow
Write-Host "  cd `"$projectRoot\erp-api`"" -ForegroundColor White
Write-Host "  npm install" -ForegroundColor White
Write-Host "  npm run start:dev" -ForegroundColor White
Write-Host "  Wait for: 'Application is running on: http://localhost:3002'" -ForegroundColor Gray
Write-Host ""

Write-Host "TERMINAL 2 - Frontend (Next.js):" -ForegroundColor Yellow
Write-Host "  cd `"$projectRoot\erp-web`"" -ForegroundColor White
Write-Host "  npm install" -ForegroundColor White
Write-Host "  npm run dev" -ForegroundColor White
Write-Host "  Wait for: 'Ready on http://localhost:3000'" -ForegroundColor Gray
Write-Host ""

Write-Host "TERMINAL 3 - ML Service (FastAPI) [OPTIONAL]:" -ForegroundColor Yellow
Write-Host "  cd `"$projectRoot\erp-ml`"" -ForegroundColor White
Write-Host "  poetry install" -ForegroundColor White
Write-Host "  poetry run python main.py" -ForegroundColor White
Write-Host "  Wait for: 'Uvicorn running on http://0.0.0.0:8000'" -ForegroundColor Gray
Write-Host ""

Write-Host "TERMINAL 4 - Accounting Service (Spring Boot) [OPTIONAL]:" -ForegroundColor Yellow
Write-Host "  cd `"$projectRoot\erp-accounting`"" -ForegroundColor White
Write-Host "  mvn spring-boot:run" -ForegroundColor White
Write-Host "  Wait for: 'Started Application in X seconds'" -ForegroundColor Gray
Write-Host ""

Write-Host "SERVICE URLs:" -ForegroundColor Cyan
Write-Host "  Frontend:      http://localhost:3000" -ForegroundColor White
Write-Host "  Backend API:   http://localhost:3002" -ForegroundColor White
Write-Host "  API Docs:      http://localhost:3002/api-docs" -ForegroundColor White
Write-Host "  ML Service:    http://localhost:8000" -ForegroundColor White
Write-Host "  Accounting:    http://localhost:8085" -ForegroundColor White
Write-Host "  PostgreSQL:    localhost:5432" -ForegroundColor White
Write-Host "  KeyDB:         localhost:6379" -ForegroundColor White
Write-Host "  MinIO Console: http://localhost:9001" -ForegroundColor White
Write-Host "  Keycloak:      http://localhost:8082" -ForegroundColor White
Write-Host ""

Write-Host "MONITORING:" -ForegroundColor Cyan
Write-Host "  Check Docker services:  docker-compose ps" -ForegroundColor White
Write-Host "  View Docker logs:       docker-compose logs -f" -ForegroundColor White
Write-Host "  Stop Docker services:   docker-compose down" -ForegroundColor White
Write-Host ""

Write-Host "TEST ACCOUNTS:" -ForegroundColor Cyan
Write-Host "  Email:    admin@test.com" -ForegroundColor White
Write-Host "  Password: Admin123" -ForegroundColor White
Write-Host ""

Write-Host "=== STARTUP COMPLETE ===" -ForegroundColor Green
