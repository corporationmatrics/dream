# GitHub Template Import - Execution Scripts
**Version:** 1.0 | **Date:** February 4, 2026 | **Status:** Ready to Execute

---

## 🚀 One-Command Setup (For All 8 Repos)

### **Prerequisites Check**
```bash
# Verify you have installed:
git --version          # Git
node --version         # Node.js 18+
npm --version          # npm
java -version          # Java 21+ (for Spring Boot)
mvn --version          # Maven (optional)
```

---

## 📦 Master Import Script

### **Copy & Save as: `import-all-repos.sh`**

```bash
#!/bin/bash

# ================================================
# ERP Platform - GitHub Template Import Script
# ================================================
# This script imports all 8 core repositories
# from proven GitHub templates and sets them up
# ================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BASE_DIR="/path/to/erp-project"  # ← CHANGE THIS
GITLAB_GROUP="erp-platform"      # ← CHANGE THIS
GITLAB_TOKEN="your-token-here"   # ← CHANGE THIS

mkdir -p "$BASE_DIR"
cd "$BASE_DIR"

echo -e "${GREEN}=====================================${NC}"
echo -e "${GREEN}ERP Platform - Repository Import${NC}"
echo -e "${GREEN}=====================================${NC}"

# ================================================
# 1. NestJS API
# ================================================
echo -e "\n${YELLOW}[1/8] Importing erp-api (NestJS)${NC}"

if [ ! -d "erp-api" ]; then
    git clone https://github.com/TechSquidTV/nestjs-starter-template.git erp-api
    cd erp-api
    
    # Clean git history
    rm -rf .git
    git init
    git add .
    git commit -m "Initial commit from NestJS starter template"
    
    # Update package.json
    sed -i 's/"name": ".*"/"name": "erp-api"/' package.json
    
    # Clean up
    npm install
    
    echo -e "${GREEN}✓ erp-api imported${NC}"
    cd ..
else
    echo -e "${YELLOW}✗ erp-api already exists${NC}"
fi

# ================================================
# 2. Spring Boot Accounting
# ================================================
echo -e "\n${YELLOW}[2/8] Creating erp-accounting (Spring Boot)${NC}"

if [ ! -d "erp-accounting" ]; then
    mkdir -p erp-accounting/src/main/java/com/erp/accounting
    mkdir -p erp-accounting/src/main/resources
    mkdir -p erp-accounting/src/test/java
    
    cd erp-accounting
    
    # Initialize git
    git init
    
    # Create pom.xml
    cat > pom.xml << 'EOF'
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
        <relativePath/>
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
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-validation</artifactId>
        </dependency>
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-actuator</artifactId>
        </dependency>
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
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
EOF
    
    # Create main application class
    cat > src/main/java/com/erp/accounting/AccountingApplication.java << 'EOF'
package com.erp.accounting;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class AccountingApplication {
    public static void main(String[] args) {
        SpringApplication.run(AccountingApplication.class, args);
    }
}
EOF

    # Create application.yml
    mkdir -p src/main/resources
    cat > src/main/resources/application.yml << 'EOF'
spring:
  application:
    name: erp-accounting
  datasource:
    url: jdbc:postgresql://localhost:5432/erp_accounting
    username: postgres
    password: postgres
    driver-class-name: org.postgresql.Driver
  jpa:
    hibernate:
      ddl-auto: validate
    show-sql: false
server:
  port: 8080
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics
EOF

    git add .
    git commit -m "Initial commit - Spring Boot skeleton"
    
    echo -e "${GREEN}✓ erp-accounting created${NC}"
    cd ..
else
    echo -e "${YELLOW}✗ erp-accounting already exists${NC}"
fi

# ================================================
# 3. Next.js Web
# ================================================
echo -e "\n${YELLOW}[3/8] Creating erp-web (Next.js)${NC}"

if [ ! -d "erp-web" ]; then
    npx create-next-app@latest erp-web \
        --typescript \
        --tailwind \
        --eslint \
        --src-dir \
        --app \
        --no-git \
        --skip-install
    
    cd erp-web
    
    # Initialize git
    git init
    git add .
    git commit -m "Initial commit from Next.js template"
    
    # Install dependencies
    npm install zustand axios next-auth
    npm install -D @types/node
    
    echo -e "${GREEN}✓ erp-web created${NC}"
    cd ..
else
    echo -e "${YELLOW}✗ erp-web already exists${NC}"
fi

# ================================================
# 4. React Native Mobile
# ================================================
echo -e "\n${YELLOW}[4/8] Creating erp-mobile (Expo)${NC}"

if [ ! -d "erp-mobile" ]; then
    npx create-expo-app erp-mobile --template
    
    cd erp-mobile
    
    # Initialize git
    git init
    git add .
    git commit -m "Initial commit from Expo template"
    
    # Install dependencies
    npx expo install expo-router zustand axios
    
    echo -e "${GREEN}✓ erp-mobile created${NC}"
    cd ..
else
    echo -e "${YELLOW}✗ erp-mobile already exists${NC}"
fi

# ================================================
# 5. Database
# ================================================
echo -e "\n${YELLOW}[5/8] Creating erp-database (Flyway migrations)${NC}"

if [ ! -d "erp-database" ]; then
    mkdir -p erp-database/{migrations,schemas,seeds,scripts}
    
    cd erp-database
    
    git init
    
    # Create .gitignore
    cat > .gitignore << 'EOF'
# Database
*.db
*.sqlite
.env
.env.local

# IDEs
.idea/
.vscode/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db
EOF

    # Create flyway.conf
    cat > flyway.conf << 'EOF'
flyway.url=jdbc:postgresql://localhost:5432/erp
flyway.user=postgres
flyway.password=postgres
flyway.locations=filesystem:./migrations
EOF

    # Create initial schema
    cat > migrations/V1__initial_schema.sql << 'EOF'
-- Users table
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    org_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_org_id ON users(org_id);
EOF

    # Create README
    cat > README.md << 'EOF'
# ERP Database Migrations

Database schemas and migrations for ERP platform.

## Running Migrations

### Local PostgreSQL
```bash
flyway -configFiles=flyway.conf migrate
```

### Docker
```bash
docker run --rm \
  -v $(pwd)/migrations:/flyway/sql \
  -e FLYWAY_URL=jdbc:postgresql://postgres:5432/erp \
  -e FLYWAY_USER=postgres \
  -e FLYWAY_PASSWORD=postgres \
  flyway/flyway migrate
```
EOF

    git add .
    git commit -m "Initial commit - Database schema"
    
    echo -e "${GREEN}✓ erp-database created${NC}"
    cd ..
else
    echo -e "${YELLOW}✗ erp-database already exists${NC}"
fi

# ================================================
# 6. Infrastructure
# ================================================
echo -e "\n${YELLOW}[6/8] Creating erp-infrastructure (DevOps)${NC}"

if [ ! -d "erp-infrastructure" ]; then
    mkdir -p erp-infrastructure/{terraform,kubernetes,docker,monitoring/prometheus,monitoring/grafana,monitoring/loki,scripts}
    
    cd erp-infrastructure
    
    git init
    
    # Create .gitignore
    cat > .gitignore << 'EOF'
# Terraform
*.tfstate
*.tfstate.*
.terraform/
.terraform.lock.hcl
crash.log

# IDEs
.idea/
.vscode/

# OS
.DS_Store
EOF

    # Create README
    cat > README.md << 'EOF'
# ERP Infrastructure

Infrastructure as Code (IaC) for ERP platform deployment.

## Directory Structure

- `terraform/` - Terraform configurations for cloud resources
- `kubernetes/` - Kubernetes manifests for container orchestration
- `docker/` - Docker images and build configurations
- `monitoring/` - Prometheus, Grafana, and Loki configurations
- `scripts/` - Deployment and utility scripts

## Getting Started

```bash
# Initialize Terraform
cd terraform
terraform init
terraform plan
terraform apply

# Deploy to Kubernetes
cd ../kubernetes
kubectl apply -f .
```
EOF

    git add .
    git commit -m "Initial commit - Infrastructure skeleton"
    
    echo -e "${GREEN}✓ erp-infrastructure created${NC}"
    cd ..
else
    echo -e "${YELLOW}✗ erp-infrastructure already exists${NC}"
fi

# ================================================
# 7. Shared Libraries
# ================================================
echo -e "\n${YELLOW}[7/8] Creating erp-shared (TypeScript package)${NC}"

if [ ! -d "erp-shared" ]; then
    mkdir -p erp-shared/src/{types,dto,validators,api,utils,constants}
    
    cd erp-shared
    
    git init
    
    # Create package.json
    cat > package.json << 'EOF'
{
  "name": "erp-shared",
  "version": "1.0.0",
  "description": "Shared types and utilities for ERP platform",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "prepublishOnly": "npm run build"
  },
  "keywords": ["erp", "shared"],
  "author": "ERP Team",
  "license": "MIT",
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0"
  }
}
EOF

    # Create tsconfig.json
    cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
EOF

    # Create .gitignore
    cat > .gitignore << 'EOF'
node_modules/
dist/
*.tsbuildinfo
.env
.env.local
EOF

    # Create src/index.ts
    cat > src/index.ts << 'EOF'
// Export types, DTOs, validators, utilities
export * from './types';
export * from './dto';
export * from './validators';
export * from './api';
export * from './utils';
export * from './constants';
EOF

    # Create type files
    cat > src/types/index.ts << 'EOF'
// Define shared types here
export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
}
EOF

    cat > src/dto/index.ts << 'EOF'
// Define DTOs here
export interface CreateUserDTO {
  email: string;
  firstName: string;
  lastName: string;
}
EOF

    cat > src/validators/index.ts << 'EOF'
// Define validators here
export const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};
EOF

    cat > src/api/index.ts << 'EOF'
// Define API client here
export class APIClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }
}
EOF

    cat > src/utils/index.ts << 'EOF'
// Define utility functions here
export const formatDate = (date: Date): string => {
  return date.toISOString();
};
EOF

    cat > src/constants/index.ts << 'EOF'
// Define constants here
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';
export const API_TIMEOUT = 30000;
EOF

    # Create README
    cat > README.md << 'EOF'
# ERP Shared

Shared types, DTOs, validators, and utilities for ERP platform.

## Installation

```bash
npm install erp-shared
```

## Usage

```typescript
import { User, validateEmail, APIClient } from 'erp-shared';
```
EOF

    git add .
    git commit -m "Initial commit - Shared library skeleton"
    
    npm install
    
    echo -e "${GREEN}✓ erp-shared created${NC}"
    cd ..
else
    echo -e "${YELLOW}✗ erp-shared already exists${NC}"
fi

# ================================================
# 8. Documentation
# ================================================
echo -e "\n${YELLOW}[8/8] Creating erp-docs (Docusaurus)${NC}"

if [ ! -d "erp-docs" ]; then
    npx create-docusaurus@latest erp-docs classic --typescript --no-git
    
    cd erp-docs
    
    # Initialize git
    git init
    git add .
    git commit -m "Initial commit from Docusaurus template"
    
    # Install additional plugins
    npm install --save @docusaurus/plugin-content-blog
    
    echo -e "${GREEN}✓ erp-docs created${NC}"
    cd ..
else
    echo -e "${YELLOW}✗ erp-docs already exists${NC}"
fi

# ================================================
# Summary
# ================================================
echo -e "\n${GREEN}=====================================${NC}"
echo -e "${GREEN}✓ All repositories imported!${NC}"
echo -e "${GREEN}=====================================${NC}"

echo -e "\n${YELLOW}Next Steps:${NC}"
echo "1. Review each repository"
echo "2. Run: npm install (for each Node.js project)"
echo "3. Run: mvn install (for each Java project)"
echo "4. Configure .env files"
echo "5. Push to GitLab"
echo "6. Set up CI/CD pipelines"

echo -e "\n${YELLOW}Repositories created:${NC}"
ls -d erp-* 2>/dev/null | sed 's/^/  ✓ /'

echo -e "\n${GREEN}Done!${NC}\n"
```

---

## 🔧 **How to Use This Script**

### **Step 1: Download & Configure**
```bash
# Save the script
nano import-all-repos.sh
# Paste the script above

# Make executable
chmod +x import-all-repos.sh

# Edit configuration
# - Change BASE_DIR to your project directory
# - Change GITLAB_GROUP to your GitLab group
# - Change GITLAB_TOKEN (optional, for automation)
```

### **Step 2: Run the Script**
```bash
./import-all-repos.sh
```

### **Step 3: Verify All Imports**
```bash
ls -la
# Should show 8 directories:
# drwxr-xr-x  erp-api
# drwxr-xr-x  erp-accounting
# drwxr-xr-x  erp-web
# drwxr-xr-x  erp-mobile
# drwxr-xr-x  erp-infrastructure
# drwxr-xr-x  erp-database
# drwxr-xr-x  erp-shared
# drwxr-xr-x  erp-docs
```

---

## 📋 **Manual Import (If Script Doesn't Work)**

If you prefer manual import, use this step-by-step guide:

### **1. NestJS API**
```bash
git clone https://github.com/TechSquidTV/nestjs-starter-template.git erp-api
cd erp-api
rm -rf .git
git init
git add .
git commit -m "Initial commit"
npm install
cd ..
```

### **2. Spring Boot**
```bash
mkdir erp-accounting
cd erp-accounting
# Use Maven Spring Boot archetype
mvn archetype:generate \
  -DgroupId=com.erp \
  -DartifactId=accounting \
  -DarchetypeArtifactId=maven-archetype-quickstart
cd ..
```

### **3. Next.js**
```bash
npx create-next-app@latest erp-web --typescript --tailwind --eslint
cd erp-web
git init
git add .
git commit -m "Initial commit"
npm install zustand axios
cd ..
```

### **4. Expo Mobile**
```bash
npx create-expo-app erp-mobile
cd erp-mobile
git init
git add .
git commit -m "Initial commit"
npm install expo-router zustand axios
cd ..
```

### **5-8. Remaining Repos**
Create manually as shown in script above.

---

## ✅ **Post-Import Verification Checklist**

After running imports, verify each repo:

```bash
#!/bin/bash
# Save as: verify-imports.sh

for repo in erp-api erp-accounting erp-web erp-mobile erp-infrastructure erp-database erp-shared erp-docs; do
  echo "Checking $repo..."
  
  if [ -d "$repo" ]; then
    cd "$repo"
    
    # Check git initialized
    if [ -d ".git" ]; then
      echo "  ✓ Git repository"
    else
      echo "  ✗ No .git directory"
    fi
    
    # Check README
    if [ -f "README.md" ]; then
      echo "  ✓ README.md exists"
    else
      echo "  ✗ No README.md"
    fi
    
    # Check package.json/pom.xml
    if [ -f "package.json" ] || [ -f "pom.xml" ]; then
      echo "  ✓ Config file exists"
    else
      echo "  ✗ No config file"
    fi
    
    cd ..
  else
    echo "  ✗ Directory not found"
  fi
  
  echo ""
done
```

---

## 🚀 **Next Steps After Import**

### **Week 2: Customization**
1. Update `.env.example` in each repo
2. Update `package.json` / `pom.xml` names
3. Remove unnecessary template files
4. Add `.gitlab-ci.yml` to each repo
5. Test local run: `npm run dev` / `mvn spring-boot:run`

### **Week 3: Push to GitLab**
1. Create GitLab group: `erp-platform`
2. Create 8 repositories on GitLab
3. Add remotes to local repos:
   ```bash
   git remote add origin https://gitlab.com/erp-platform/erp-api.git
   git push -u origin main
   ```
4. Configure branch protection & CI/CD

### **Week 4: Begin Development**
1. Set up development environment
2. Start Phase 1 tasks
3. First feature implementation

---

## 📊 **Time Estimate**

| Step | Time |
|------|------|
| Run script | 5-10 min |
| Verify imports | 5 min |
| Customize repos | 2-3 hours |
| Test locally | 1 hour |
| Push to GitLab | 30 min |
| **Total** | **~4-5 hours** |

---

## 🎯 **Summary**

You now have:
- ✅ Master import script for all 8 repos
- ✅ Manual import instructions
- ✅ Verification checklist
- ✅ Post-import customization guide
- ✅ Timeline to production-ready repos

**Ready to import? Run:**
```bash
./import-all-repos.sh
```

---

**Document:** GitHub Import Execution Scripts  
**Version:** 1.0  
**Date:** February 4, 2026  
**Status:** ✅ READY TO EXECUTE

