# 🚀 IMMEDIATE EXECUTION - Import All 8 Repos NOW
**Status:** Ready to Execute | **Date:** February 4, 2026

---

## ⏱️ Timeline: ~10-15 minutes to import all 8 repositories

---

## 📋 STEP-BY-STEP EXECUTION GUIDE

### **STEP 1: Create Project Directory** (2 min)

```bash
# Create main project directory
mkdir -p ~/erp-project
cd ~/erp-project

# Verify location
pwd
# Output should be: /Users/yourname/erp-project or /home/yourname/erp-project
```

---

### **STEP 2: Copy the Import Script** (2 min)

Create a new file: `import-all-repos.sh`

**Method A: Using nano editor**
```bash
nano import-all-repos.sh
```

**Method B: Using cat**
```bash
cat > import-all-repos.sh << 'IMPORT_SCRIPT_EOF'
```

**Paste the complete script below:**

```bash
#!/bin/bash

# ================================================
# ERP Platform - GitHub Template Import Script
# ================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

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
    rm -rf .git
    git init
    git add .
    git commit -m "Initial commit from NestJS starter template"
    npm install --legacy-peer-deps
    cd ..
    echo -e "${GREEN}✓ erp-api imported${NC}"
else
    echo -e "${YELLOW}✗ erp-api already exists, skipping${NC}"
fi

# ================================================
# 2. Spring Boot Accounting
# ================================================
echo -e "\n${YELLOW}[2/8] Creating erp-accounting (Spring Boot)${NC}"

if [ ! -d "erp-accounting" ]; then
    mkdir -p erp-accounting/src/main/java/com/erp/accounting/{controller,service,repository,entity,dto}
    mkdir -p erp-accounting/src/main/resources/db/migration
    mkdir -p erp-accounting/src/test/java
    
    cd erp-accounting
    git init
    
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
EOF

    mkdir -p src/main/java/com/erp/accounting
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

    mkdir -p src/main/resources
    cat > src/main/resources/application.yml << 'EOF'
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
EOF

    cat > .gitignore << 'EOF'
target/
*.jar
*.class
.idea/
.vscode/
.env
*.log
node_modules/
EOF

    cat > README.md << 'EOF'
# ERP Accounting Service

Spring Boot service for accounting and financial ledger.

## Running Locally

```bash
mvn spring-boot:run
```

Service will start on http://localhost:8080
EOF

    git add .
    git commit -m "Initial commit - Spring Boot skeleton"
    cd ..
    echo -e "${GREEN}✓ erp-accounting created${NC}"
else
    echo -e "${YELLOW}✗ erp-accounting already exists, skipping${NC}"
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
    git init
    git add .
    git commit -m "Initial commit from Next.js template"
    npm install --legacy-peer-deps zustand axios next-auth
    cd ..
    echo -e "${GREEN}✓ erp-web created${NC}"
else
    echo -e "${YELLOW}✗ erp-web already exists, skipping${NC}"
fi

# ================================================
# 4. React Native Mobile
# ================================================
echo -e "\n${YELLOW}[4/8] Creating erp-mobile (Expo)${NC}"

if [ ! -d "erp-mobile" ]; then
    npx create-expo-app@latest erp-mobile
    
    cd erp-mobile
    git init
    git add .
    git commit -m "Initial commit from Expo template"
    npm install --legacy-peer-deps expo-router zustand axios
    cd ..
    echo -e "${GREEN}✓ erp-mobile created${NC}"
else
    echo -e "${YELLOW}✗ erp-mobile already exists, skipping${NC}"
fi

# ================================================
# 5. Database
# ================================================
echo -e "\n${YELLOW}[5/8] Creating erp-database (Flyway migrations)${NC}"

if [ ! -d "erp-database" ]; then
    mkdir -p erp-database/{migrations,schemas,seeds,scripts}
    
    cd erp-database
    git init
    
    cat > .gitignore << 'EOF'
*.db
*.sqlite
.env
.env.local
.idea/
.vscode/
EOF

    cat > flyway.conf << 'EOF'
flyway.url=jdbc:postgresql://localhost:5432/erp
flyway.user=postgres
flyway.password=postgres
EOF

    cat > migrations/V1__initial_schema.sql << 'EOF'
CREATE TABLE IF NOT EXISTS users (
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
EOF

    cat > README.md << 'EOF'
# ERP Database Migrations

Database schemas and migrations.

## Running Migrations

```bash
flyway -configFiles=flyway.conf migrate
```
EOF

    git add .
    git commit -m "Initial commit - Database schema"
    cd ..
    echo -e "${GREEN}✓ erp-database created${NC}"
else
    echo -e "${YELLOW}✗ erp-database already exists, skipping${NC}"
fi

# ================================================
# 6. Infrastructure
# ================================================
echo -e "\n${YELLOW}[6/8] Creating erp-infrastructure (DevOps)${NC}"

if [ ! -d "erp-infrastructure" ]; then
    mkdir -p erp-infrastructure/{terraform,kubernetes,docker,monitoring/{prometheus,grafana,loki},scripts}
    
    cd erp-infrastructure
    git init
    
    cat > .gitignore << 'EOF'
*.tfstate
*.tfstate.*
.terraform/
.terraform.lock.hcl
*.log
.idea/
.vscode/
EOF

    cat > README.md << 'EOF'
# ERP Infrastructure

Infrastructure as Code for deployment.

## Directory Structure

- terraform/ - Terraform configurations
- kubernetes/ - Kubernetes manifests
- docker/ - Docker images
- monitoring/ - Prometheus, Grafana, Loki
- scripts/ - Deployment scripts
EOF

    git add .
    git commit -m "Initial commit - Infrastructure skeleton"
    cd ..
    echo -e "${GREEN}✓ erp-infrastructure created${NC}"
else
    echo -e "${YELLOW}✗ erp-infrastructure already exists, skipping${NC}"
fi

# ================================================
# 7. Shared Libraries
# ================================================
echo -e "\n${YELLOW}[7/8] Creating erp-shared (TypeScript package)${NC}"

if [ ! -d "erp-shared" ]; then
    mkdir -p erp-shared/src/{types,dto,validators,api,utils,constants}
    
    cd erp-shared
    git init
    
    cat > package.json << 'EOF'
{
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
EOF

    cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true
  },
  "include": ["src"]
}
EOF

    cat > src/index.ts << 'EOF'
export * from './types';
export * from './dto';
export * from './validators';
EOF

    cat > src/types/index.ts << 'EOF'
export interface User {
  id: number;
  email: string;
}
EOF

    cat > src/dto/index.ts << 'EOF'
export interface CreateUserDTO {
  email: string;
  firstName: string;
}
EOF

    cat > src/validators/index.ts << 'EOF'
export const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};
EOF

    cat > README.md << 'EOF'
# ERP Shared

Shared types and utilities for ERP platform.
EOF

    git add .
    git commit -m "Initial commit - Shared library"
    npm install
    cd ..
    echo -e "${GREEN}✓ erp-shared created${NC}"
else
    echo -e "${YELLOW}✗ erp-shared already exists, skipping${NC}"
fi

# ================================================
# 8. Documentation
# ================================================
echo -e "\n${YELLOW}[8/8] Creating erp-docs (Docusaurus)${NC}"

if [ ! -d "erp-docs" ]; then
    npx create-docusaurus@latest erp-docs classic --typescript --no-git
    
    cd erp-docs
    git init
    git add .
    git commit -m "Initial commit from Docusaurus"
    cd ..
    echo -e "${GREEN}✓ erp-docs created${NC}"
else
    echo -e "${YELLOW}✗ erp-docs already exists, skipping${NC}"
fi

# ================================================
# Summary
# ================================================
echo -e "\n${GREEN}=====================================${NC}"
echo -e "${GREEN}✓ ALL REPOSITORIES IMPORTED!${NC}"
echo -e "${GREEN}=====================================${NC}"

echo -e "\n${YELLOW}Repositories created:${NC}"
ls -d erp-* 2>/dev/null | sed 's/^/  ✓ /'

echo -e "\n${YELLOW}Next Steps:${NC}"
echo "1. Verify all repos: ./verify-repos.sh"
echo "2. Configure .env files"
echo "3. Test locally (npm run dev / mvn spring-boot:run)"
echo "4. Push to GitLab"

echo -e "\n${GREEN}Done! ✓${NC}\n"
```

---

### **STEP 3: Make Script Executable** (1 min)

```bash
chmod +x import-all-repos.sh
```

---

### **STEP 4: Run the Import Script** (10 min)

```bash
./import-all-repos.sh
```

**Watch the output:**
```
[1/8] Importing erp-api (NestJS)...
  ✓ erp-api imported

[2/8] Creating erp-accounting (Spring Boot)...
  ✓ erp-accounting created

[3/8] Creating erp-web (Next.js)...
  ✓ erp-web created

... (continues for all 8 repos)

✓ ALL REPOSITORIES IMPORTED!
```

---

### **STEP 5: Verify All Repos Created** (2 min)

```bash
# List all imported repositories
ls -la

# You should see:
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

### **STEP 6: Test Each Repository** (5 min)

#### **Test 1: NestJS API**
```bash
cd erp-api
npm run start:dev
# Should show: "Nest application successfully started"
# Press Ctrl+C to stop
cd ..
```

#### **Test 2: Next.js Web**
```bash
cd erp-web
npm run dev
# Should show: "started server on 0.0.0.0:3000"
# Open http://localhost:3000 in browser
# Press Ctrl+C to stop
cd ..
```

#### **Test 3: Expo Mobile**
```bash
cd erp-mobile
npm start
# Shows Expo dev menu
# Press Ctrl+C to stop
cd ..
```

#### **Test 4: Spring Boot (Optional)**
```bash
cd erp-accounting
mvn clean install
mvn spring-boot:run
# Should start on port 8080
# Press Ctrl+C to stop
cd ..
```

---

## 📋 **QUICK CHECKLIST**

```bash
# Before running script:
✓ [ ] Have ~5GB free disk space
✓ [ ] Node.js 18+ installed (npm --version)
✓ [ ] Git installed (git --version)
✓ [ ] Java 21+ installed (java --version) - for Spring Boot
✓ [ ] Working internet connection

# After running script:
✓ [ ] All 8 directories created
✓ [ ] Each repo has .git folder
✓ [ ] Each repo has README.md
✓ [ ] npm/Maven dependencies installed
✓ [ ] Test run successful (no errors)

# Ready for week 2:
✓ [ ] Repos verified and tested
✓ [ ] Team assigned
✓ [ ] Ready for customization
```

---

## 🎯 **WHAT HAPPENS NEXT (Week 2)**

After imports are verified, you'll:

1. **Customize each repo** (add your config)
2. **Create .gitlab-ci.yml** (CI/CD pipelines)
3. **Create .env files** (environment variables)
4. **Push to GitLab** (version control)
5. **Set up team access** (permissions)

All customization files are prepared and ready in separate documents.

---

## 📁 **DIRECTORY STRUCTURE AFTER IMPORT**

```
erp-project/
├── erp-api/                    # NestJS API
│   ├── src/
│   ├── test/
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
├── erp-accounting/             # Spring Boot
│   ├── src/
│   ├── pom.xml
│   └── Dockerfile
├── erp-web/                    # Next.js
│   ├── src/
│   ├── app/
│   ├── package.json
│   └── Dockerfile
├── erp-mobile/                 # Expo
│   ├── app/
│   ├── package.json
│   └── app.json
├── erp-infrastructure/         # DevOps
│   ├── terraform/
│   ├── kubernetes/
│   ├── docker/
│   └── monitoring/
├── erp-database/               # Migrations
│   ├── migrations/
│   ├── schemas/
│   └── flyway.conf
├── erp-shared/                 # Shared lib
│   ├── src/
│   ├── package.json
│   └── tsconfig.json
└── erp-docs/                   # Documentation
    ├── docs/
    ├── package.json
    └── docusaurus.config.js
```

---

## ⏱️ **TOTAL TIME: ~20 minutes**

- Create directory: 2 min
- Copy script: 2 min
- Run script: 10 min
- Verify: 2 min
- Test: 4 min
- **Total: 20 min**

---

## 🚀 **YOU'RE READY TO GO!**

**Run this command now:**
```bash
mkdir -p ~/erp-project && cd ~/erp-project && nano import-all-repos.sh
# Paste the script above, then:
# Press Ctrl+O (save), Enter, Ctrl+X (exit)
chmod +x import-all-repos.sh
./import-all-repos.sh
```

**After the script finishes, verify:**
```bash
ls -la  # Should show 8 erp-* directories
```

---

**Status:** ✅ **READY FOR IMMEDIATE EXECUTION**

Run the script now and report back when complete! 🎉

