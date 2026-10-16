#!/usr/bin/env bash
# ==============================================================================
# EPMS — PostgreSQL & Uploads Restore Script
# Usage: ./scripts/restore-db.sh <backup_folder_path>
# Example: ./scripts/restore-db.sh ./backups/20261016_120000
# ==============================================================================
set -euo pipefail

if [ $# -lt 1 ]; then
    echo "Usage: $0 <backup_folder_path>"
    exit 1
fi

SOURCE_DIR="$1"
if [ ! -d "${SOURCE_DIR}" ]; then
    echo "Error: Directory ${SOURCE_DIR} does not exist."
    exit 1
fi

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-pms}"
DB_USER="${DB_USER:-pms_user}"
export PGPASSWORD="${DB_PASSWORD:-pms_password}"

DUMP_FILE=$(find "${SOURCE_DIR}" -name "database_${DB_NAME}_*.dump" | head -n 1)
if [ -n "${DUMP_FILE}" ] && [ -f "${DUMP_FILE}" ]; then
    echo "==> [1/2] Restoring PostgreSQL database '${DB_NAME}' from ${DUMP_FILE}..."
    pg_restore -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" --clean --if-exists -v "${DUMP_FILE}" || true
    echo "    Database restored."
else
    echo "==> [1/2] No database dump file found matching database_${DB_NAME}_*.dump in ${SOURCE_DIR}."
fi

UPLOADS_TAR=$(find "${SOURCE_DIR}" -name "uploads_*.tar.gz" | head -n 1)
UPLOADS_DEST="${UPLOAD_DIR:-./uploads}"
if [ -n "${UPLOADS_TAR}" ] && [ -f "${UPLOADS_TAR}" ]; then
    echo "==> [2/2] Restoring uploads to $(dirname "${UPLOADS_DEST}")..."
    tar -xzf "${UPLOADS_TAR}" -C "$(dirname "${UPLOADS_DEST}")"
    echo "    Uploads restored."
else
    echo "==> [2/2] No uploads archive found in ${SOURCE_DIR}."
fi

echo "=============================================================================="
echo "Restore process finished."
echo "=============================================================================="
