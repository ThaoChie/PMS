#!/usr/bin/env bash
# ==============================================================================
# EPMS — PostgreSQL & Uploads Backup Script
# Usage: ./scripts/backup-db.sh [backup_destination_dir]
# ==============================================================================
set -euo pipefail

BACKUP_DIR="${1:-./backups}"
TIMESTAMP="$(date +'%Y%m%d_%H%M%S')"
TARGET_DIR="${BACKUP_DIR}/${TIMESTAMP}"

mkdir -p "${TARGET_DIR}"

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-pms}"
DB_USER="${DB_USER:-pms_user}"
export PGPASSWORD="${DB_PASSWORD:-pms_password}"

echo "==> [1/2] Backing up PostgreSQL database '${DB_NAME}' from ${DB_HOST}:${DB_PORT}..."
pg_dump -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -F c -b -v -f "${TARGET_DIR}/database_${DB_NAME}_${TIMESTAMP}.dump" "${DB_NAME}"
echo "    Database backup saved: ${TARGET_DIR}/database_${DB_NAME}_${TIMESTAMP}.dump"

UPLOADS_DIR="${UPLOAD_DIR:-./uploads}"
if [ -d "${UPLOADS_DIR}" ]; then
    echo "==> [2/2] Archiving uploads directory '${UPLOADS_DIR}'..."
    tar -czf "${TARGET_DIR}/uploads_${TIMESTAMP}.tar.gz" -C "$(dirname "${UPLOADS_DIR}")" "$(basename "${UPLOADS_DIR}")"
    echo "    Uploads backup saved: ${TARGET_DIR}/uploads_${TIMESTAMP}.tar.gz"
else
    echo "==> [2/2] Uploads directory not found at ${UPLOADS_DIR}, skipping."
fi

echo "=============================================================================="
echo "Backup completed successfully! Files stored in: ${TARGET_DIR}"
echo "=============================================================================="
