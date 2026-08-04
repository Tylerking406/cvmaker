#!/usr/bin/env bash
# Nightly Postgres backup.
#
# This matters more than it looks: EF migrations apply automatically on API startup, so a
# bad migration reaching production rewrites the schema with no undo. Without a dump there
# is nothing to roll back to.
#
# Install (as the user that owns the deploy):
#   crontab -e
#   15 3 * * *  /opt/cvmaker/scripts/backup-db.sh >> /var/log/cvmaker-backup.log 2>&1
set -euo pipefail

COMPOSE_DIR="${COMPOSE_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
BACKUP_DIR="${BACKUP_DIR:-$COMPOSE_DIR/backups}"
RETAIN_DAYS="${RETAIN_DAYS:-14}"

cd "$COMPOSE_DIR"
mkdir -p "$BACKUP_DIR"

stamp=$(date -u +%Y%m%dT%H%M%SZ)
target="$BACKUP_DIR/cvmaker-$stamp.sql.gz"

echo "[$(date -u +%FT%TZ)] dumping to $target"

# Write to a .partial first so a dump interrupted halfway can never be mistaken for a
# usable backup by the restore step or the retention sweep.
docker compose exec -T db pg_dump -U cvmaker -d cvmaker --clean --if-exists \
  | gzip > "$target.partial"
mv "$target.partial" "$target"

size=$(du -h "$target" | cut -f1)
echo "[$(date -u +%FT%TZ)] wrote $target ($size)"

# A dump that gunzip cannot read is worse than no dump, because it looks like protection.
if ! gunzip -t "$target" 2>/dev/null; then
  echo "[$(date -u +%FT%TZ)] ERROR: $target failed integrity check" >&2
  exit 1
fi

deleted=$(find "$BACKUP_DIR" -name 'cvmaker-*.sql.gz' -mtime "+$RETAIN_DAYS" -print -delete | wc -l)
[ "$deleted" -gt 0 ] && echo "[$(date -u +%FT%TZ)] pruned $deleted backup(s) older than ${RETAIN_DAYS}d"

echo "[$(date -u +%FT%TZ)] ok"

# ── Restore ───────────────────────────────────────────────────────────────────
# Stop the API first, or its startup migration can race the restore:
#
#   docker compose -f docker-compose.yml -f docker-compose.prod.yml stop api frontend
#   gunzip -c backups/cvmaker-<stamp>.sql.gz | docker compose exec -T db psql -U cvmaker -d cvmaker
#   docker compose -f docker-compose.yml -f docker-compose.prod.yml start api frontend
