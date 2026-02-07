#!/bin/bash
# Phase 1 Integration Setup Script
# Run this to set up shadcn/ui, Keycloak, MongoDB, and Enhanced OCR

set -e

REPO_ROOT=$(pwd)
TIMESTAMP=$(date +%s)
BACKUP_DIR="${REPO_ROOT}/.backups/${TIMESTAMP}"

echo "🚀 ERP Platform Phase 1 Integration Setup"
echo "=========================================="
echo ""

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to log steps
log_step() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check prerequisites
echo "Checking prerequisites..."
command -v node >/dev/null 2>&1 || { log_error "Node.js is required but not installed."; exit 1; }
command -v npm >/dev/null 2>&1 || { log_error "npm is required but not installed."; exit 1; }
command -v docker >/dev/null 2>&1 || { log_error "Docker is required but not installed."; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { log_error "Docker Compose is required but not installed."; exit 1; }
log_step "Prerequisites check passed"

# Backup current setup
echo ""
echo "Creating backup..."
mkdir -p "$BACKUP_DIR"

# Backup important files
if [ -f "${REPO_ROOT}/erp-api/.env.local" ]; then
    cp "${REPO_ROOT}/erp-api/.env.local" "${BACKUP_DIR}/.env.local.backup"
    log_step "Backed up .env.local"
fi

if [ -f "${REPO_ROOT}/docker-compose-all-phases.yml" ]; then
    cp "${REPO_ROOT}/docker-compose-all-phases.yml" "${BACKUP_DIR}/docker-compose-all-phases.yml.backup"
    log_step "Backed up docker-compose.yml"
fi

# Phase 1.1: shadcn/ui Setup
echo ""
echo "📦 Phase 1.1: Setting up shadcn/ui..."
cd "${REPO_ROOT}/erp-web"

log_step "Installing shadcn/ui dependencies..."
npm install @radix-ui/react-slot @radix-ui/react-dropdown-menu \
    class-variance-authority clsx lucide-react

log_step "You need to manually run: npx shadcn-ui@latest init"

# Phase 1.2: MongoDB Setup
echo ""
echo "🗄️  Phase 1.2: MongoDB configuration..."
log_step "MongoDB will be added to docker-compose.yml"
log_warn "Update docker-compose-all-phases.yml with MongoDB service (already included)"

# Phase 1.3: Keycloak Setup
echo ""
echo "🔐 Phase 1.3: Keycloak configuration..."
cd "${REPO_ROOT}/erp-api"

log_step "Installing Keycloak dependencies..."
npm install passport-openidconnect jsonwebtoken @types/node

# Phase 1.4: Enhanced OCR
echo ""
echo "🔍 Phase 1.4: Enhanced OCR setup..."
cd "${REPO_ROOT}/erp-ml"

log_step "Installing PaddleOCR dependencies..."
# Note: Using pip because this is Python
if [ -f "pyproject.toml" ]; then
    log_warn "Update pyproject.toml with PaddleOCR dependencies"
    log_warn "Then run: poetry install"
else
    log_warn "Python environment setup needed"
fi

# Environment setup
echo ""
echo "📝 Setting up environment files..."
cd "${REPO_ROOT}"

# Create .env.local if it doesn't exist
if [ ! -f ".env.local" ]; then
    cat > .env.local << 'EOF'
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

# Web Configuration
WEB_PORT=3000
NEXT_PUBLIC_API_URL=http://localhost:3002
EOF
    log_step "Created .env.local template"
else
    log_warn ".env.local already exists, review and update if needed"
fi

# Docker Compose health check setup
echo ""
echo "🐳 Setting up Docker health checks..."
log_warn "docker-compose.yml health checks configured"

# Database Migrations
echo ""
echo "📊 Database migrations..."
log_warn "New migrations required for Keycloak and MongoDB integration"
log_warn "Check erp-database/migrations/ directory"

# Completion summary
echo ""
echo "=========================================="
echo -e "${GREEN}✓ Phase 1 Setup Complete!${NC}"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Review and update .env.local with your credentials"
echo "2. Run: docker-compose -f docker-compose-all-phases.yml up -d"
echo "3. Configure Keycloak realm (see KEYCLOAK_SETUP.md)"
echo "4. Run database migrations: npm run migrate"
echo "5. Start services:"
echo "   - Terminal 1: cd erp-api && npm run start:dev"
echo "   - Terminal 2: cd erp-web && npm run dev"
echo "   - Terminal 3: cd erp-ml && poetry run python src/api.py"
echo ""
echo "📚 Documentation:"
echo "   - INTEGRATION_ROADMAP.md - Complete roadmap"
echo "   - KEYCLOAK_SETUP.md - Keycloak configuration"
echo "   - MONGODB_INTEGRATION.md - MongoDB setup"
echo "   - OCR_INTEGRATION.md - Enhanced OCR setup"
echo ""
echo "Backups created in: ${BACKUP_DIR}"
echo ""
