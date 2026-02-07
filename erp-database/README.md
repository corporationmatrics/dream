# ERP Database

Database schemas, migrations, and management scripts for ERP Platform.

## Directory Structure

- `migrations/` - SQL migration files
  - `001_initial_schema.sql` - Initial database schema
  - `002_accounting_schema.sql` - Accounting specific schema
- `schemas/` - Database schema documentation
- `seeds/` - Sample data scripts
- `scripts/` - Database management scripts
  - `backup.sh` - Database backup script
  - `restore.sh` - Database restore script
- `flyway.conf` - Flyway migration configuration

## Database Setup

### 1. Create Database

```sql
CREATE DATABASE erp_platform;
```

### 2. Run Migrations

```bash
# Using Flyway
flyway -configFiles=flyway.conf migrate

# Or using psql
psql -h localhost -U postgres -d erp_platform < migrations/001_initial_schema.sql
psql -h localhost -U postgres -d erp_platform < migrations/002_accounting_schema.sql
```

### 3. Load Seed Data

```bash
psql -h localhost -U postgres -d erp_platform < seeds/001_initial_data.sql
```

## Backup & Restore

### Backup

```bash
./scripts/backup.sh erp_platform ./backups
```

### Restore

```bash
./scripts/restore.sh ./backups/erp_platform_20260204_120000.sql.gz
```

## Schema Documentation

See `docs/` for entity relationship diagrams and schema documentation.

## License

MIT
