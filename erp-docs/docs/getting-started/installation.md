---
sidebar_position: 1
---

# Installation

## Prerequisites

Before you begin, ensure you have the following installed:

- **Git** - Version control
- **Node.js** - v18 or higher
- **npm** - v9 or higher
- **Docker** - Latest version
- **Docker Compose** - Latest version
- **Java 21** - For Spring Boot services (optional)
- **Python 3.11+** - For ML services (optional)

## Quick Installation

### 1. Clone the Repositories

```bash
# Create a project directory
mkdir erp-project && cd erp-project

# Clone all repositories
git clone https://github.com/your-org/erp-api.git
git clone https://github.com/your-org/erp-web.git
git clone https://github.com/your-org/erp-mobile.git
git clone https://github.com/your-org/erp-accounting.git
git clone https://github.com/your-org/erp-infrastructure.git
git clone https://github.com/your-org/erp-database.git
```

### 2. Set Up Infrastructure

```bash
cd erp-infrastructure
docker-compose up -d
```

This starts:
- PostgreSQL
- KeyDB (Cache)
- Minio (Object Storage)
- Meilisearch (Search Engine)

### 3. Set Up Database

```bash
cd ../erp-database
psql -h localhost -U postgres -d erp_platform < migrations/001_initial_schema.sql
psql -h localhost -U postgres -d erp_platform < seeds/001_initial_data.sql
```

### 4. Install and Run API

```bash
cd ../erp-api
npm install
npm run start:dev
```

### 5. Install and Run Web

```bash
cd ../erp-web
npm install
npm run dev
```

## Configuration

See the Configuration Guide for detailed setup instructions.

## Next Steps

- [Configuration](./configuration.md)
- [Quick Start](./quick-start.md)
- [Troubleshooting](./troubleshooting.md)
