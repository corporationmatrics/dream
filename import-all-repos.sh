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

The create_file call succeeded. Now need to run the script. Sending run_in_terminal. 