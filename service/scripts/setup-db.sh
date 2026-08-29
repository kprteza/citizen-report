#!/usr/bin/env bash
# Optional: provision a local PostgreSQL for RDS-parity development and for the
# service integration tests. Idempotent. Requires sudo + apt (Debian/Ubuntu).
set -euo pipefail

DB_NAME="${DB_NAME:-citizen_report}"
DB_USER="${DB_USER:-citizen}"
DB_PASS="${DB_PASS:-citizen}"

if ! command -v psql >/dev/null 2>&1; then
  echo "Installing PostgreSQL..."
  sudo apt-get update -y
  sudo apt-get install -y postgresql postgresql-contrib
fi

echo "Starting PostgreSQL..."
sudo service postgresql start 2>/dev/null || \
  sudo pg_ctlcluster "$(pg_lsclusters -h | awk 'NR==1{print $1}')" main start 2>/dev/null || true

echo "Ensuring role and database..."
sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='${DB_USER}'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE ROLE ${DB_USER} LOGIN PASSWORD '${DB_PASS}'"
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1 || \
  sudo -u postgres createdb -O "${DB_USER}" "${DB_NAME}"

echo "Done. DATABASE_URL=postgres://${DB_USER}:${DB_PASS}@127.0.0.1:5432/${DB_NAME}"
