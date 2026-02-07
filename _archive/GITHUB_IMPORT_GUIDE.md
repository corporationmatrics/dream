# GitHub Template Import & Customization Guide
**Version:** 1.0 | **Date:** February 4, 2026

---

## 🎯 Strategy: Import → Customize → Deploy

Instead of building from scratch, we'll **clone proven boilerplates** from GitHub and customize them for our stack.

**Time Savings:** ~2-3 weeks per repository

---

## 📥 Repository Import Plan

### **1. NestJS API (erp-api)**

#### Recommended Starting Template
```
Template: NestJS Starter Kit (Validated & Production-Ready)
Source:   https://github.com/TechSquidTV/nestjs-starter-template
Alternative: https://github.com/nestjs/nest/tree/master/sample

Why This:
  ✅ Complete project structure
  ✅ TypeORM setup (PostgreSQL)
  ✅ Authentication scaffold
  ✅ Swagger/OpenAPI included
  ✅ Docker & Docker-compose ready
  ✅ Jest testing setup
  ✅ ESLint + Prettier configured
```

#### Import Steps
```bash
# Step 1: Clone template
git clone https://github.com/TechSquidTV/nestjs-starter-template.git erp-api
cd erp-api

# Step 2: Remove git history
rm -rf .git
git init
git add .
git commit -m "Initial commit from NestJS starter template"

# Step 3: Update package.json
# - Change name to "erp-api"
# - Update description
# - Update repository URL to your GitLab

# Step 4: Customize
# - Keep: src/main.ts, src/app.module.ts, src/common/
# - Add: src/users/, src/products/, src/orders/, src/inventory/
# - Update: database.config.ts (PostgreSQL connection)
# - Update: .env.example with your variables
```

#### Files to Customize/Add
```
├── Update: .env.example
├── Update: src/app.module.ts (add modules)
├── Update: Dockerfile (add to erp-infrastructure)
├── Update: docker-compose.yml (add services)
├── Create: src/database/migrations/
├── Create: src/config/ (Keycloak config)
├── Create: src/websocket/ (Socket.io setup)
├── Create: src/notifications/ (email service)
└── Add: .gitlab-ci.yml (CI/CD pipeline)
```

---

### **2. Spring Boot Accounting (erp-accounting)**

#### Recommended Starting Template
```
Template: Spring Boot Starter Web (Spring Initializr)
Source:   https://start.spring.io/

Why This:
  ✅ Official Spring template
  ✅ Maven configured
  ✅ Spring Data JPA included
  ✅ PostgreSQL driver included
  ✅ Spring Security ready
  ✅ Actuator for monitoring
```

#### Import Steps
```bash
# Step 1: Generate from Spring Initializr
# Settings:
#   - Project: Maven
#   - Language: Java
#   - Spring Boot: 3.2.x
#   - Group: com.erp
#   - Artifact: accounting
#   - Dependencies:
#     * Spring Web
#     * Spring Data JPA
#     * PostgreSQL Driver
#     * Spring Security
#     * Validation
#     * Spring Actuator
#     * Lombok

# Step 2: Download & extract
unzip accounting.zip
cd accounting

# Step 3: Remove git history (if any)
rm -rf .git
git init

# Step 4: Update pom.xml
# - Add: Spring Cloud dependencies
# - Add: Kafka client
# - Add: Mapstruct (DTO mapping)
# - Add: JUnit 5 for testing
```

#### Files to Customize/Add
```
├── Create: src/main/java/com/erp/accounting/
│   ├── controller/
│   ├── service/
│   ├── repository/
│   ├── entity/
│   ├── dto/
│   └── config/
├── Create: src/main/resources/db/migration/ (Flyway)
├── Update: application.yml (PostgreSQL config)
├── Update: pom.xml (add dependencies)
├── Create: Dockerfile
├── Create: docker-compose.yml
└── Add: .gitlab-ci.yml
```

---

### **3. Next.js Web (erp-web)**

#### Recommended Starting Template
```
Template: Next.js with TypeScript (Official)
Source:   https://github.com/vercel/next.js/tree/canary/examples/with-typescript

Alternative: Next.js + Tailwind + TypeScript
Source:   https://github.com/shadcn-ui/next-template

Why This:
  ✅ Official Next.js template
  ✅ TypeScript configured
  ✅ Tailwind CSS ready
  ✅ API routes setup
  ✅ Dark mode support (shadcn)
  ✅ Responsive design included
```

#### Import Steps
```bash
# Step 1: Create Next.js with specific template
npx create-next-app@latest erp-web \
  --typescript \
  --tailwind \
  --eslint \
  --src-dir \
  --app

cd erp-web

# Or clone from GitHub
git clone https://github.com/shadcn-ui/next-template.git erp-web
cd erp-web

# Step 2: Remove .git and reinit
rm -rf .git
git init

# Step 3: Update package.json
# - Change name to "erp-web"
# - Update scripts for our needs

# Step 4: Add dependencies
npm install zustand axios next-auth
npm install -D tailwindcss @tailwindcss/forms
```

#### Files to Customize/Add
```
├── Update: src/app/
│   ├── Create: (auth)/
│   ├── Create: dashboard/
│   ├── Create: products/
│   ├── Create: orders/
│   └── Create: inventory/
├── Create: src/components/ui/ (shadcn/ui)
├── Create: src/lib/
│   ├── api.ts (API client)
│   └── auth.ts (Keycloak setup)
├── Create: src/store/ (Zustand stores)
├── Update: tailwind.config.ts
├── Update: next.config.js
├── Update: .env.example
├── Create: Dockerfile
└── Add: .gitlab-ci.yml
```

---

### **4. React Native Mobile (erp-mobile)**

#### Recommended Starting Template
```
Template: Expo with TypeScript & Router
Source:   https://github.com/expo/expo/tree/main/templates

Why This:
  ✅ Official Expo template
  ✅ TypeScript configured
  ✅ Expo Router setup (navigation)
  ✅ Built-in dev tools
  ✅ OTA updates ready
```

#### Import Steps
```bash
# Step 1: Create Expo app with TypeScript
npx create-expo-app erp-mobile --template

# Or use Expo Router template
npx create-expo-app erp-mobile --template expo-template-bare-minimum

cd erp-mobile

# Step 2: Initialize git
git init
git add .
git commit -m "Initial commit from Expo template"

# Step 3: Add dependencies
npx expo install react-native-screens react-native-safe-area-context
npm install expo-router zustand axios expo-notifications

# Step 4: Update app.json and eas.json
```

#### Files to Customize/Add
```
├── Update: app.json (project config)
├── Update: eas.json (build config)
├── Create: app/
│   ├── (auth)/
│   ├── (tabs)/
│   └── _layout.tsx
├── Create: components/
├── Create: lib/
│   ├── api.ts
│   └── storage.ts
├── Create: store/
├── Update: .env.example
└── Add: .gitlab-ci.yml
```

---

### **5. Infrastructure (erp-infrastructure)**

#### Recommended Starting Template
```
Template: Terraform + Kubernetes Boilerplate
Source:   https://github.com/terraform-aws-modules/terraform-aws-kubernetes

Alternative: Kubernetes Manifests
Source:   https://kubernetes.io/docs/concepts/workloads/controllers/deployment/

Why This:
  ✅ Production-ready patterns
  ✅ Kubernetes YAML examples
  ✅ Terraform best practices
  ✅ Monitoring setup
```

#### Import Steps
```bash
# Step 1: Create new repo
git init erp-infrastructure
cd erp-infrastructure

# Step 2: Create directory structure
mkdir -p terraform/{main,vpc,k8s,modules}
mkdir -p kubernetes/{deployments,services,configmaps,secrets,statefulsets}
mkdir -p docker
mkdir -p monitoring/{prometheus,grafana,loki}
mkdir -p scripts

# Step 3: Copy Terraform modules
# Download from: terraform-aws-modules or Google Cloud examples

# Step 4: Create Kubernetes manifests from scratch
# (No standard template needed - follow our ROADMAP.md examples)
```

#### Files to Create
```
├── terraform/
│   ├── main.tf (provider config)
│   ├── variables.tf
│   ├── outputs.tf
│   └── modules/ (custom modules)
├── kubernetes/
│   ├── deployments/ (NestJS, Spring Boot, etc.)
│   ├── services/
│   ├── configmaps/
│   ├── secrets/
│   ├── statefulsets/ (PostgreSQL, Redis, etc.)
│   └── ingress/
├── docker/
│   ├── api/Dockerfile
│   ├── accounting/Dockerfile
│   ├── web/Dockerfile
│   └── mobile/Dockerfile
├── monitoring/
│   ├── prometheus/prometheus.yml
│   ├── grafana/dashboards/
│   └── loki/config.yml
├── scripts/
│   ├── deploy.sh
│   ├── backup.sh
│   └── restore.sh
└── .gitlab-ci.yml
```

---

### **6. Database (erp-database)**

#### Recommended Starting Template
```
Template: Flyway PostgreSQL Migrations
Source:   https://github.com/flyway/flyway-community-db-migrations

Why This:
  ✅ Flyway best practices
  ✅ Version control for DB
  ✅ Rollback capabilities
  ✅ Team collaboration
```

#### Import Steps
```bash
# Step 1: Create repo structure
git init erp-database
cd erp-database

# Step 2: Create migration folders
mkdir -p migrations/sql
mkdir -p scripts

# Step 3: Create V1__Initial_Schema.sql
# (Write from our COMPATIBILITY_ANALYSIS.md schema)
```

#### Files to Create
```
├── migrations/
│   ├── V1__initial_schema.sql
│   ├── V2__add_indexes.sql
│   ├── V3__add_audit_tables.sql
│   └── ...
├── schemas/
│   ├── users.sql
│   ├── products.sql
│   ├── orders.sql
│   ├── accounting.sql
│   └── audit.sql
├── seeds/
│   ├── initial_data.sql
│   └── test_data.sql
├── scripts/
│   ├── backup.sh
│   ├── restore.sh
│   └── optimize.sql
├── flyway.conf
└── README.md
```

---

### **7. Shared Libraries (erp-shared)**

#### Recommended Starting Template
```
Template: TypeScript Monorepo (Nx or Turbo)
Source:   https://github.com/nrwl/nx
Alternative: https://github.com/vercel/turbo

Simpler Approach: Just NPM Package
Source:   https://github.com/sindresorhus/typescript-template
```

#### Import Steps (Simple Approach)
```bash
# Step 1: Create TypeScript package
npm init -y
npm install --save-dev typescript @types/node ts-node

# Step 2: Create tsconfig.json
npx tsc --init

# Step 3: Create src/ directory
mkdir src

# Step 4: Create package.json scripts
# Add: "build": "tsc", "prepublishOnly": "npm run build"
```

#### Files to Create
```
├── src/
│   ├── types/
│   │   ├── api.ts
│   │   ├── domain.ts
│   │   └── user.ts
│   ├── dto/
│   │   ├── user.dto.ts
│   │   ├── product.dto.ts
│   │   └── order.dto.ts
│   ├── validators/
│   ├── api/
│   │   └── client.ts
│   ├── utils/
│   └── constants/
├── dist/ (compiled output)
├── tsconfig.json
├── package.json
└── README.md
```

---

### **8. Documentation (erp-docs)**

#### Recommended Starting Template
```
Template: Docusaurus 3.x (React-based docs)
Source:   https://docusaurus.io/

Why This:
  ✅ React-based (familiar to team)
  ✅ Built-in search
  ✅ Versioning support
  ✅ MDX support (Markdown + React)
  ✅ Built-in sidebar generation
```

#### Import Steps
```bash
# Step 1: Create Docusaurus site
npx create-docusaurus@latest erp-docs classic

cd erp-docs

# Step 2: Reinitialize git
rm -rf .git
git init

# Step 3: Install additional plugins
npm install --save @docusaurus/plugin-google-analytics
```

#### Files to Create
```
├── docs/
│   ├── intro.md
│   ├── architecture/
│   │   ├── overview.md
│   │   ├── components.md
│   │   └── decisions.md
│   ├── api/
│   │   ├── overview.md
│   │   └── endpoints.md
│   ├── development/
│   ├── deployment/
│   ├── operations/
│   └── user-guides/
├── blog/
├── sidebars.js (customize)
├── docusaurus.config.js (customize)
└── package.json
```

---

## 🔄 Import Workflow Summary

### **Week 1: Set up all repositories**

```
Day 1-2: Import & Initialize
├─ erp-api (clone NestJS starter)
├─ erp-accounting (generate from Spring Initializr)
├─ erp-web (create Next.js app)
├─ erp-mobile (create Expo app)
└─ erp-database (create Flyway structure)

Day 3: Infrastructure & Shared
├─ erp-infrastructure (manual structure)
├─ erp-shared (create TypeScript package)
└─ erp-docs (create Docusaurus site)

Day 4-5: Customize & Push
├─ Update .env.example in all repos
├─ Update package.json/pom.xml
├─ Add .gitlab-ci.yml
├─ Remove unnecessary files
└─ Push to GitLab
```

---

## 📋 Cleanup Checklist (After Import)

### For Each Repository

```
□ Remove unnecessary files
  - Example code
  - Sample tests
  - Placeholder components

□ Update configuration files
  - .env.example (with our variables)
  - package.json/pom.xml (correct name)
  - tsconfig.json / babel.config.js

□ Update documentation
  - README.md (our project description)
  - CONTRIBUTING.md (our guidelines)
  - CODE_OF_CONDUCT.md

□ Set up code quality
  - Add ESLint config
  - Add Prettier config
  - Add .editorconfig

□ Set up CI/CD
  - Add .gitlab-ci.yml
  - Configure linting
  - Configure testing
  - Configure deployment

□ Security
  - Add .gitignore (comprehensive)
  - Remove secrets from commits
  - Update LICENSE
```

---

## 🎯 Customization Order (By Priority)

### **Priority 1: Critical (Weeks 1-2)**
```
1. Database schema (erp-database)
2. API structure (erp-api)
3. Web scaffold (erp-web)
4. Mobile scaffold (erp-mobile)
5. Infrastructure base (erp-infrastructure)
```

### **Priority 2: Important (Weeks 3-4)**
```
1. Accounting service (erp-accounting)
2. Shared DTOs/Types (erp-shared)
3. Documentation templates (erp-docs)
4. CI/CD pipelines (all repos)
5. Docker images (erp-infrastructure)
```

### **Priority 3: Nice to Have (Weeks 5-6)**
```
1. Advanced features in API
2. Admin dashboard in web
3. QA testing setup
4. Monitoring dashboards
5. Kubernetes manifests
```

---

## ✅ Verification Checklist

After importing & customizing each repo:

```
□ README.md describes the service
□ .gitignore is comprehensive
□ .env.example has all variables
□ Package/build files are correct
□ CI/CD pipeline is configured
□ Code linting passes
□ Basic tests run
□ Documentation is updated
□ LICENSE is in place
□ Team can clone & run locally
```

---

## 🚀 Local Testing (After Import)

### For Each Repo
```bash
# Clone
git clone <repo-url>
cd <repo-name>

# Install dependencies
npm install  # or mvn install

# Set up environment
cp .env.example .env
# Edit .env with local values

# Run locally
npm run dev  # or mvn spring-boot:run

# Verify it works
# - Should start without errors
# - Health check: http://localhost:3000 (or port)
# - API docs: http://localhost:3000/api (Swagger)
```

---

## 📊 Time Estimate

| Repository | Import | Customize | Test | Total |
|-----------|--------|-----------|------|-------|
| erp-api | 15 min | 2-3 hours | 30 min | ~3 hours |
| erp-accounting | 15 min | 2-3 hours | 30 min | ~3 hours |
| erp-web | 15 min | 1-2 hours | 30 min | ~2 hours |
| erp-mobile | 15 min | 1-2 hours | 30 min | ~2 hours |
| erp-infrastructure | 30 min | 3-4 hours | 30 min | ~4 hours |
| erp-database | 30 min | 1-2 hours | 30 min | ~2 hours |
| erp-shared | 15 min | 1 hour | 30 min | ~1.5 hours |
| erp-docs | 15 min | 1-2 hours | 30 min | ~2 hours |
| **Total** | | | | **~19.5 hours** |

**Timeline:** Can be completed in **1 week** with 2-3 people working in parallel

---

## 🎓 Team Assignments (Parallel Work)

```
Week 1 (Parallel):

Team A (Backend):
├─ Import erp-api + customize
├─ Import erp-accounting + customize
└─ Import erp-database + customize

Team B (Frontend):
├─ Import erp-web + customize
├─ Import erp-mobile + customize
└─ Import erp-shared + customize

Team C (DevOps):
├─ Import erp-infrastructure + customize
└─ Import erp-docs + customize

Daily Sync:
└─ 15-min standup to unblock issues
```

---

## 📚 Recommended GitHub Templates

### Quick Reference

```
NestJS:
  https://github.com/TechSquidTV/nestjs-starter-template
  https://github.com/nestjs/nest

Spring Boot:
  https://start.spring.io/
  https://github.com/spring-projects/spring-boot

Next.js:
  https://github.com/vercel/next.js/tree/canary/examples
  https://github.com/shadcn-ui/next-template

React Native/Expo:
  https://github.com/expo/expo
  https://github.com/expo/expo-router

Terraform:
  https://github.com/terraform-aws-modules
  https://github.com/gruntwork-io/terragrunt-infrastructure-templates

Kubernetes:
  https://kubernetes.io/docs/concepts/workloads/
  https://github.com/kubernetes/examples

Docusaurus:
  https://github.com/facebook/docusaurus
  https://docusaurus.io/docs/installation
```

---

## ✨ Best Practices After Import

1. **Keep Git History Clean**
   - Remove template git history
   - Create fresh initial commit
   - Clear .git cache of secrets

2. **Standardize Across Repos**
   - Same Node/Java/Python versions
   - Consistent code style (ESLint, Prettier)
   - Unified .gitignore

3. **Document Changes**
   - Keep CHANGELOG.md
   - Note why you removed/modified things
   - Create ADR (Architecture Decision Record)

4. **Test Immediately**
   - Verify each repo runs locally
   - Test CI/CD pipeline
   - Test Docker builds

5. **Version Control**
   - Tag initial commits: v1.0.0-base
   - Use semantic versioning
   - Document breaking changes

---

## 🎯 Final Recommendation

**Best Approach:**
1. ✅ **Import proven templates** (saves 2-3 weeks)
2. ✅ **Customize for our stack** (1-2 weeks)
3. ✅ **Extend with our features** (ongoing)

**NOT recommended:** Building from scratch (too time-consuming, might miss best practices)

---

**Document:** GitHub Template Import Guide  
**Version:** 1.0  
**Date:** February 4, 2026  
**Status:** ✅ READY FOR IMPLEMENTATION

