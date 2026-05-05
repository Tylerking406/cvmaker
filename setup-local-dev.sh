#!/bin/bash
set -e

# ─────────────────────────────────────────
# CvMaker — Local Dev Setup Script (Ubuntu)
# ─────────────────────────────────────────

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

info()    { echo -e "${GREEN}[INFO]${NC} $1"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $1"; }
error()   { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }
prompt()  { echo -e "${YELLOW}[INPUT]${NC} $1"; }

# ── DB credentials (edit these or they'll be prompted) ──
DB_NAME="cvmakerdb"
DB_USER="cvmaker"
DB_PASS=""   # leave blank to be prompted

# ─────────────────────────────────────────
# 0. Ask for DB password if not set above
# ─────────────────────────────────────────
if [ -z "$DB_PASS" ]; then
  prompt "Enter a password for the local PostgreSQL user '$DB_USER':"
  read -s DB_PASS < /dev/tty
  echo
  [ -z "$DB_PASS" ] && error "Password cannot be empty."
fi

# ─────────────────────────────────────────
# 1. System packages
# ─────────────────────────────────────────
info "Updating apt and installing system packages..."
sudo apt-get update -qq
sudo apt-get install -y -qq git wget gpg curl postgresql postgresql-contrib

# ─────────────────────────────────────────
# 2. .NET 8 SDK
# ─────────────────────────────────────────
if ! command -v dotnet &>/dev/null || [[ "$(dotnet --version)" != 8* ]]; then
  info "Installing .NET 8 SDK..."
  sudo apt-get install -y -qq dotnet-sdk-8.0 2>/dev/null || {
    # Fallback: Microsoft feed
    wget -q https://packages.microsoft.com/config/ubuntu/$(lsb_release -rs)/packages-microsoft-prod.deb -O /tmp/packages-microsoft-prod.deb
    sudo dpkg -i /tmp/packages-microsoft-prod.deb
    sudo apt-get update -qq
    sudo apt-get install -y -qq dotnet-sdk-8.0
  }
else
  info ".NET 8 SDK already installed ($(dotnet --version))."
fi

# ─────────────────────────────────────────
# 3. VS Code
# ─────────────────────────────────────────
if ! command -v code &>/dev/null; then
  info "Installing VS Code..."
  wget -qO- https://packages.microsoft.com/keys/microsoft.asc \
    | gpg --dearmor \
    | sudo tee /etc/apt/keyrings/packages.microsoft.gpg > /dev/null
  echo "deb [arch=amd64 signed-by=/etc/apt/keyrings/packages.microsoft.gpg] \
https://packages.microsoft.com/repos/code stable main" \
    | sudo tee /etc/apt/sources.list.d/vscode.list > /dev/null
  sudo apt-get update -qq
  sudo apt-get install -y -qq code
else
  info "VS Code already installed."
fi

# ─────────────────────────────────────────
# 4. VS Code extensions
# ─────────────────────────────────────────
info "Installing VS Code extensions..."
code --install-extension ms-dotnettools.csdevkit       --force 2>/dev/null || warn "Could not install C# Dev Kit (needs a display — run manually if in SSH)."
code --install-extension ckolkman.vscode-postgres      --force 2>/dev/null || true
code --install-extension patcx.vscode-nuget-gallery    --force 2>/dev/null || true

# ─────────────────────────────────────────
# 5. PostgreSQL — start & create DB/user
# ─────────────────────────────────────────
info "Starting PostgreSQL..."
sudo systemctl start postgresql
sudo systemctl enable postgresql

info "Creating DB user '$DB_USER' and database '$DB_NAME'..."
sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';"

sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" | grep -q 1 || \
  sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"

# Make sure the user owns the DB (idempotent)
sudo -u postgres psql -c "ALTER DATABASE $DB_NAME OWNER TO $DB_USER;" 2>/dev/null || true

# ─────────────────────────────────────────
# 6. Clone repo (skip if already cloned)
# ─────────────────────────────────────────
REPO_URL="https://github.com/Tylerking406/cvmaker.git"
BRANCH="claude/setup-local-dev-environment-QQ4PN"
CLONE_DIR="$HOME/cvmaker"

if [ -d "$CLONE_DIR/.git" ]; then
  info "Repo already cloned at $CLONE_DIR — pulling latest..."
  git -C "$CLONE_DIR" fetch origin
  git -C "$CLONE_DIR" checkout "$BRANCH"
  git -C "$CLONE_DIR" pull origin "$BRANCH"
else
  info "Cloning repo into $CLONE_DIR..."
  git clone "$REPO_URL" "$CLONE_DIR"
  git -C "$CLONE_DIR" checkout "$BRANCH"
fi

# ─────────────────────────────────────────
# 7. appsettings.Development.json
# ─────────────────────────────────────────
SETTINGS_FILE="$CLONE_DIR/CvMaker.Api/appsettings.Development.json"

if [ ! -f "$SETTINGS_FILE" ]; then
  info "Creating appsettings.Development.json..."
  cat > "$SETTINGS_FILE" <<EOF
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=$DB_NAME;Username=$DB_USER;Password=$DB_PASS"
  }
}
EOF
else
  info "appsettings.Development.json already exists — skipping."
fi

# ─────────────────────────────────────────
# 8. Apply DB schema
# ─────────────────────────────────────────
info "Applying schema.local.sql to '$DB_NAME'..."
PGPASSWORD="$DB_PASS" psql -U "$DB_USER" -d "$DB_NAME" -h localhost -f "$CLONE_DIR/schema.local.sql"

# ─────────────────────────────────────────
# 9. Restore NuGet packages
# ─────────────────────────────────────────
info "Restoring .NET packages..."
dotnet restore "$CLONE_DIR/CvMaker.Api/CvMaker.Api.csproj"

# ─────────────────────────────────────────
# Done
# ─────────────────────────────────────────
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  Setup complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "  To run the API:"
echo "    cd $CLONE_DIR/CvMaker.Api"
echo "    dotnet run"
echo ""
echo "  Swagger UI: http://localhost:5000/swagger"
echo "  Health check: http://localhost:5000/health"
echo ""
echo "  To open in VS Code:"
echo "    code $CLONE_DIR"
echo ""
