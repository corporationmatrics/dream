#!/bin/bash

# Backup script for ERP Database
# Usage: ./backup.sh [database_name] [backup_dir]

DB_NAME=${1:-erp_platform}
BACKUP_DIR=${2:-.}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}.sql.gz"

echo "Backing up database: $DB_NAME"
echo "Backup file: $BACKUP_FILE"

pg_dump $DB_NAME | gzip > $BACKUP_FILE

if [ $? -eq 0 ]; then
    echo "✓ Database backup completed successfully"
    echo "File size: $(du -h $BACKUP_FILE | cut -f1)"
else
    echo "✗ Database backup failed"
    exit 1
fi
