#!/usr/bin/env powershell
# ERP Platform Local Development Setup Script
# This script sets up the complete development environment

param(
    [string]$SkipDependencies = $false,
    [string]$SkipDocker = $false
)

Write-Host "=== ERP Platform Development Setup ===" -ForegroundColor Green
Write-Host ""

# Configuration
$projectRoot = Get-Location
$nodeProjects = @('erp-api', 'erp-web', 'erp-mobile', 'erp-mobile-admin', 'erp-common-lib', 'erp-docs')
$envProjects = @('erp-api', 'erp-infrastructure', 'erp-ml')

# Functions
function Test-Command {
    param([string]$Command)
    try {
        & $Command --version | Out-Null
        return $true
    } catch {
        return $false
    }
}

function Install-NodeDependencies {
    Write-Host "`n--- Installing Node.js Dependencies ---" -ForegroundColor Cyan
    foreach ($project in $nodeProjects) {
        if (Test-Path "$project/package.json") {
            Write-Host "Installing $project..." -ForegroundColor Yellow
            Push-Location $project
            npm install --legacy-peer-deps --prefer-offline
            Pop-Location
            Write-Host "✓ $project installed" -ForegroundColor Green
        }
    }
}

function Create-EnvFiles {
    Write-Host "`n--- Creating Environment Files ---" -ForegroundColor Cyan
    foreach ($project in $envProjects) {
        if (Test-Path "$project/.env.example") {
            if (-not (Test-Path "$project/.env")) {
                Copy-Item "$project/.env.example" "$project/.env"
                Write-Host "✓ Created .env for $project" -ForegroundColor Green
            } else {
                Write-Host "⚠ .env already exists for $project (skipping)" -ForegroundColor Yellow
            }
        }
    }
}

function Start-Docker {
    Write-Host "`n--- Starting Docker Services ---" -ForegroundColor Cyan
    
    if (-not (Test-Command "docker")) {
        Write-Host "✗ Docker not found. Please install Docker Desktop." -ForegroundColor Red
        return $false
    }
    
    Push-Location erp-infrastructure
    Write-Host "Starting docker-compose services..." -ForegroundColor Yellow
    docker-compose up -d
    Pop-Location
    
    Write-Host "`n✓ Docker services started" -ForegroundColor Green
    Write-Host "Services:"
    Write-Host "  - PostgreSQL: localhost:5432"
    Write-Host "  - KeyDB: localhost:6379"
    Write-Host "  - MinIO: localhost:9000 (console: 9001)"
    Write-Host "  - Meilisearch: localhost:7700"
    return $true
}

function Verify-Services {
    Write-Host "`n--- Verifying Services ---" -ForegroundColor Cyan
    
    $services = @(
        @{ Name = "PostgreSQL"; Host = "localhost"; Port = 5432 },
        @{ Name = "KeyDB"; Host = "localhost"; Port = 6379 },
        @{ Name = "MinIO"; Host = "localhost"; Port = 9000 },
        @{ Name = "Meilisearch"; Host = "localhost"; Port = 7700 }
    )
    
    foreach ($service in $services) {
        try {
            $tcpConnection = Test-NetConnection -ComputerName $service.Host -Port $service.Port -WarningAction SilentlyContinue
            if ($tcpConnection.TcpTestSucceeded) {
                Write-Host "✓ $($service.Name) is running" -ForegroundColor Green
            } else {
                Write-Host "✗ $($service.Name) is not responding" -ForegroundColor Red
            }
        } catch {
            Write-Host "⚠ Could not check $($service.Name)" -ForegroundColor Yellow
        }
    }
}

function Show-NextSteps {
    Write-Host "`n=== Development Servers ===" -ForegroundColor Green
    Write-Host ""
    Write-Host "To start development servers, run in separate terminals:"
    Write-Host ""
    Write-Host "  # API Server (port 3000)" -ForegroundColor Cyan
    Write-Host "  cd erp-api && npm run start:dev" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  # Web Server (port 3000/3001)" -ForegroundColor Cyan
    Write-Host "  cd erp-web && npm run dev" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  # ML Server (port 8000)" -ForegroundColor Cyan
    Write-Host "  cd erp-ml && poetry install && poetry run python main.py" -ForegroundColor Gray
    Write-Host ""
}

# Main execution
Write-Host "Prerequisites Check:" -ForegroundColor Cyan
Write-Host "  Node.js: $(if (Test-Command 'node') { '✓' } else { '✗' })"
Write-Host "  npm: $(if (Test-Command 'npm') { '✓' } else { '✗' })"
Write-Host "  Docker: $(if (Test-Command 'docker') { '✓' } else { '✗' })"
Write-Host ""

if ($SkipDependencies -ne $true) {
    Install-NodeDependencies
}

Create-EnvFiles

if ($SkipDocker -ne $true) {
    Start-Docker
    Read-Host "Press Enter to verify services..."
    Verify-Services
}

Show-NextSteps

Write-Host "`n=== Setup Complete ===" -ForegroundColor Green
