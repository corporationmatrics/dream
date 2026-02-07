# PowerShell import script for ERP repositories
# Run with: powershell -ExecutionPolicy Bypass -File .\import-all-repos.ps1

Set-StrictMode -Version Latest

function Run-Command {
    param($cmd)
    Write-Host "`n> $cmd" -ForegroundColor Yellow
    & cmd /c $cmd
    if ($LASTEXITCODE -ne 0) {
        throw "Command failed: $cmd (exit $LASTEXITCODE)"
    }
}

# 1. erp-api (NestJS)
Write-Host "[1/8] Importing erp-api (NestJS)" -ForegroundColor Cyan
if (-not (Test-Path -Path "erp-api")) {
    Run-Command "git clone https://github.com/TechSquidTV/nestjs-starter-template.git erp-api"
    Push-Location erp-api
    if (Test-Path -Path ".git") { Remove-Item -Recurse -Force .git }
    Run-Command "git init"
    Run-Command "git add ."
    Run-Command "git commit -m \"Initial commit from NestJS starter template\""
    Run-Command "npm install --legacy-peer-deps"
    Pop-Location
    Write-Host "✓ erp-api imported" -ForegroundColor Green
} else { Write-Host "erp-api already exists, skipping" -ForegroundColor Yellow }

# 2. erp-accounting (Spring Boot)
Write-Host "`n[2/8] Creating erp-accounting (Spring Boot)" -ForegroundColor Cyan
if (-not (Test-Path -Path "erp-accounting")) {
    New-Item -ItemType Directory -Path "erp-accounting/src/main/java/com/erp/accounting/controller" -Force | Out-Null
    New-Item -ItemType Directory -Path "erp-accounting/src/main/java/com/erp/accounting/service" -Force | Out-Null
    New-Item -ItemType Directory -Path "erp-accounting/src/main/java/com/erp/accounting/repository" -Force | Out-Null
    New-Item -ItemType Directory -Path "erp-accounting/src/main/java/com/erp/accounting/entity" -Force | Out-Null
    New-Item -ItemType Directory -Path "erp-accounting/src/main/java/com/erp/accounting/dto" -Force | Out-Null
    New-Item -ItemType Directory -Path "erp-accounting/src/main/resources/db/migration" -Force | Out-Null
    New-Item -ItemType Directory -Path "erp-accounting/src/test/java" -Force | Out-Null

    Push-Location erp-accounting
    git init

    @"
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <groupId>com.erp</groupId>
    <artifactId>accounting</artifactId>
    <version>1.0.0-SNAPSHOT</version>
    <packaging>jar</packaging>
    <name>ERP Accounting Service</name>
    <description>Core accounting and financial ledger service</description>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>3.2.0</version>
    </parent>
    <properties>
        <java.version>21</java.version>
    </properties>
    <dependencies>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-web</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-data-jpa</artifactId>
        </dependency>
        <dependency>
            <groupId>org.postgresql</groupId>
            <artifactId>postgresql</artifactId>
            <scope>runtime</scope>
        </dependency>
    </dependencies>
    <build>
        <plugins>
            <plugin>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-maven-plugin</artifactId>
            </plugin>
        </plugins>
    </build>
</project>
"@ > pom.xml

    New-Item -ItemType Directory -Path src/main/java/com/erp/accounting -Force | Out-Null
    @"
package com.erp.accounting;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
@SpringBootApplication
public class AccountingApplication {
    public static void main(String[] args) {
        SpringApplication.run(AccountingApplication.class, args);
    }
}
"@ > src/main/java/com/erp/accounting/AccountingApplication.java

    New-Item -ItemType Directory -Path src/main/resources -Force | Out-Null
    @"
spring:
  application:
    name: erp-accounting
  datasource:
    url: jdbc:postgresql://localhost:5432/erp_accounting
    username: postgres
    password: postgres
  jpa:
    hibernate:
      ddl-auto: validate
server:
  port: 8080
"@ > src/main/resources/application.yml

    @"target/
*.jar
*.class
.idea/
.vscode/
.env
*.log
node_modules/
"@ > .gitignore

    @"# ERP Accounting Service

Spring Boot service for accounting and financial ledger.

## Running Locally

```bash
mvn spring-boot:run
```

Service will start on http://localhost:8080
"@ > README.md

    git add .
    git commit -m "Initial commit - Spring Boot skeleton" | Out-Null
    Pop-Location
    Write-Host "✓ erp-accounting created" -ForegroundColor Green
} else { Write-Host "erp-accounting already exists, skipping" -ForegroundColor Yellow }

# 3. erp-web (Next.js)
Write-Host "`n[3/8] Creating erp-web (Next.js)" -ForegroundColor Cyan
if (-not (Test-Path -Path "erp-web")) {
    Run-Command "npx create-next-app@latest erp-web --typescript --tailwind --eslint --src-dir --app --no-git --skip-install"
    Push-Location erp-web
    git init
    git add .
    git commit -m "Initial commit from Next.js template"
    Run-Command "npm install --legacy-peer-deps zustand axios next-auth"
    Pop-Location
    Write-Host "✓ erp-web created" -ForegroundColor Green
} else { Write-Host "erp-web already exists, skipping" -ForegroundColor Yellow }

# 4. erp-mobile (Expo)
Write-Host "`n[4/8] Creating erp-mobile (Expo)" -ForegroundColor Cyan
if (-not (Test-Path -Path "erp-mobile")) {
    Run-Command "npx create-expo-app@latest erp-mobile"
    Push-Location erp-mobile
    git init
    git add .
    git commit -m "Initial commit from Expo template"
    Run-Command "npm install --legacy-peer-deps expo-router zustand axios"
    Pop-Location
    Write-Host "✓ erp-mobile created" -ForegroundColor Green
} else { Write-Host "erp-mobile already exists, skipping" -ForegroundColor Yellow }

# 5. erp-database
Write-Host "`n[5/8] Creating erp-database (Flyway migrations)" -ForegroundColor Cyan
if (-not (Test-Path -Path "erp-database")) {
    New-Item -ItemType Directory -Path "erp-database/migrations" -Force | Out-Null
    New-Item -ItemType Directory -Path "erp-database/schemas" -Force | Out-Null
    New-Item -ItemType Directory -Path "erp-database/seeds" -Force | Out-Null
    New-Item -ItemType Directory -Path "erp-database/scripts" -Force | Out-Null

    Push-Location erp-database
    git init

    @"*.db
*.sqlite
.env
.env.local
.idea/
.vscode/
"@ > .gitignore

    @"flyway.url=jdbc:postgresql://localhost:5432/erp
flyway.user=postgres
flyway.password=postgres
"@ > flyway.conf

    @"CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
    id BIGSERIAL PRIMARY KEY,
    sku VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id),
    total DECIMAL(12,2),
    status VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_products_sku ON products(sku);
"@ > migrations/V1__initial_schema.sql

    @"# ERP Database Migrations

Database schemas and migrations.

## Running Migrations

```bash
flyway -configFiles=flyway.conf migrate
```
"@ > README.md

    git add .
    git commit -m "Initial commit - Database schema" | Out-Null
    Pop-Location
    Write-Host "✓ erp-database created" -ForegroundColor Green
} else { Write-Host "erp-database already exists, skipping" -ForegroundColor Yellow }

# 6. erp-infrastructure
Write-Host "`n[6/8] Creating erp-infrastructure (DevOps)" -ForegroundColor Cyan
if (-not (Test-Path -Path "erp-infrastructure")) {
    New-Item -ItemType Directory -Path "erp-infrastructure/terraform" -Force | Out-Null
    New-Item -ItemType Directory -Path "erp-infrastructure/kubernetes" -Force | Out-Null
    New-Item -ItemType Directory -Path "erp-infrastructure/docker" -Force | Out-Null
    New-Item -ItemType Directory -Path "erp-infrastructure/monitoring/prometheus" -Force | Out-Null
    New-Item -ItemType Directory -Path "erp-infrastructure/monitoring/grafana" -Force | Out-Null
    New-Item -ItemType Directory -Path "erp-infrastructure/monitoring/loki" -Force | Out-Null
    New-Item -ItemType Directory -Path "erp-infrastructure/scripts" -Force | Out-Null

    Push-Location erp-infrastructure
    git init

    @"*.tfstate
*.tfstate.*
.terraform/
.terraform.lock.hcl
*.log
.idea/
.vscode/
"@ > .gitignore

    @"# ERP Infrastructure

Infrastructure as Code for deployment.

## Directory Structure

- terraform/ - Terraform configurations
- kubernetes/ - Kubernetes manifests
- docker/ - Docker images
- monitoring/ - Prometheus, Grafana, Loki
- scripts/ - Deployment scripts
"@ > README.md

    git add .
    git commit -m "Initial commit - Infrastructure skeleton" | Out-Null
    Pop-Location
    Write-Host "✓ erp-infrastructure created" -ForegroundColor Green
} else { Write-Host "erp-infrastructure already exists, skipping" -ForegroundColor Yellow }

# 7. erp-shared
Write-Host "`n[7/8] Creating erp-shared (TypeScript package)" -ForegroundColor Cyan
if (-not (Test-Path -Path "erp-shared")) {
    New-Item -ItemType Directory -Path "erp-shared/src/types" -Force | Out-Null
    New-Item -ItemType Directory -Path "erp-shared/src/dto" -Force | Out-Null
    New-Item -ItemType Directory -Path "erp-shared/src/validators" -Force | Out-Null
    New-Item -ItemType Directory -Path "erp-shared/src/api" -Force | Out-Null
    New-Item -ItemType Directory -Path "erp-shared/src/utils" -Force | Out-Null
    New-Item -ItemType Directory -Path "erp-shared/src/constants" -Force | Out-Null

    Push-Location erp-shared
    git init

    @"{
  "name": "erp-shared",
  "version": "1.0.0",
  "description": "Shared types and utilities",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0"
  }
}
"@ > package.json

    @"{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true
  },
  "include": ["src"]
}
"@ > tsconfig.json

    @"export * from './types';
export * from './dto';
export * from './validators';
"@ > src/index.ts

    @"export interface User {
  id: number;
  email: string;
}
"@ > src/types/index.ts

    @"export interface CreateUserDTO {
  email: string;
  firstName: string;
}
"@ > src/dto/index.ts

    @"export const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};
"@ > src/validators/index.ts

    @"# ERP Shared

Shared types and utilities for ERP platform.
"@ > README.md

    git add .
    git commit -m "Initial commit - Shared library" | Out-Null
    Run-Command "npm install"
    Pop-Location
    Write-Host "✓ erp-shared created" -ForegroundColor Green
} else { Write-Host "erp-shared already exists, skipping" -ForegroundColor Yellow }

# 8. erp-docs
Write-Host "`n[8/8] Creating erp-docs (Docusaurus)" -ForegroundColor Cyan
if (-not (Test-Path -Path "erp-docs")) {
    Run-Command "npx create-docusaurus@latest erp-docs classic --typescript --no-git"
    Push-Location erp-docs
    git init
    git add .
    git commit -m "Initial commit from Docusaurus"
    Pop-Location
    Write-Host "✓ erp-docs created" -ForegroundColor Green
} else { Write-Host "erp-docs already exists, skipping" -ForegroundColor Yellow }

# Summary
Write-Host "`n=====================================`n" -ForegroundColor Green
Write-Host "✓ ALL REPOSITORIES IMPORTED!" -ForegroundColor Green
Write-Host "=====================================`n" -ForegroundColor Green

Write-Host "Repositories created:" -ForegroundColor Yellow
Get-ChildItem -Directory -Name erp-* | ForEach-Object { Write-Host "  ✓ $_" }

Write-Host "`nNext Steps:`n1. Verify all repos: ./verify-repos.ps1`n2. Configure .env files`n3. Test locally (npm run dev / mvn spring-boot:run)`n4. Push to GitLab` -ForegroundColor Yellow

Write-Host "`nDone! ✓`n" -ForegroundColor Green
