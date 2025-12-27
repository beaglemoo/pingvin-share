#!/usr/bin/env bash

# Copyright (c) 2024 beaglemoo
# License: MIT
# Pingvin Share Installation Script for Proxmox LXC
# This script runs inside the LXC container

set -Eeuo pipefail

# Color codes
YW='\033[33m'
GN='\033[1;92m'
RD='\033[01;31m'
BL='\033[36m'
CL='\033[m'

# Message functions
msg_info() { echo -e " ${BL}ℹ${CL} ${YW}${1}...${CL}"; }
msg_ok() { echo -e " ${GN}✓${CL} ${GN}${1}${CL}"; }
msg_error() { echo -e " ${RD}✗${CL} ${RD}${1}${CL}"; }

# Error handler
trap 'msg_error "Error in line ${LINENO}: ${BASH_COMMAND}"; exit 1' ERR

# Configuration
APP="pingvin-share"
INSTALL_DIR="/opt/pingvin-share"
GITHUB_REPO="https://github.com/beaglemoo/pingvin-share.git"

echo ""
echo -e "${GN}Starting Pingvin Share Installation${CL}"
echo ""

# Update system
msg_info "Updating system packages"
apt-get update -qq
apt-get upgrade -y -qq
msg_ok "System updated"

# Install dependencies
msg_info "Installing dependencies"
apt-get install -y -qq \
  curl \
  git \
  build-essential \
  python3 \
  ca-certificates \
  gnupg \
  debian-keyring \
  debian-archive-keyring \
  apt-transport-https
msg_ok "Dependencies installed"

# Install Node.js 22 LTS
msg_info "Installing Node.js 22 LTS"
mkdir -p /etc/apt/keyrings
curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_22.x nodistro main" > /etc/apt/sources.list.d/nodesource.list
apt-get update -qq
apt-get install -y -qq nodejs
msg_ok "Node.js $(node --version) installed"

# Install Caddy
msg_info "Installing Caddy"
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list > /dev/null
apt-get update -qq
apt-get install -y -qq caddy
msg_ok "Caddy installed"

# Clone Pingvin Share
msg_info "Cloning Pingvin Share repository"
git clone "$GITHUB_REPO" "$INSTALL_DIR"
cd "$INSTALL_DIR"
CURRENT_VERSION=$(git rev-parse --short HEAD)
msg_ok "Repository cloned (commit: $CURRENT_VERSION)"

# Install and build backend
msg_info "Installing backend dependencies"
cd "$INSTALL_DIR/backend"
npm install --legacy-peer-deps 2>/dev/null
msg_ok "Backend dependencies installed"

msg_info "Building backend"
npm run build
msg_ok "Backend built"

msg_info "Setting up database"
npx prisma generate
npx prisma migrate deploy
msg_ok "Database configured"

# Install and build frontend
msg_info "Installing frontend dependencies"
cd "$INSTALL_DIR/frontend"
npm install --legacy-peer-deps 2>/dev/null
msg_ok "Frontend dependencies installed"

msg_info "Building frontend"
npm run build
msg_ok "Frontend built"

# Create data directory
mkdir -p "$INSTALL_DIR/backend/data"
mkdir -p "$INSTALL_DIR/frontend/public/img"

# Copy default images
if [ -d "$INSTALL_DIR/frontend/public/img.default" ]; then
  cp -rn "$INSTALL_DIR/frontend/public/img.default/"* "$INSTALL_DIR/frontend/public/img/" 2>/dev/null || true
fi

# Configure Caddy
msg_info "Configuring Caddy"
cat > /etc/caddy/Caddyfile << 'EOF'
:3000 {
    reverse_proxy /api/* localhost:8080
    reverse_proxy /* localhost:3333
}
EOF
msg_ok "Caddy configured"

# Create systemd service for backend
msg_info "Creating systemd services"
cat > /etc/systemd/system/pingvin-backend.service << EOF
[Unit]
Description=Pingvin Share Backend
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$INSTALL_DIR/backend
ExecStart=/usr/bin/npm run prod
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

# Create systemd service for frontend
cat > /etc/systemd/system/pingvin-frontend.service << EOF
[Unit]
Description=Pingvin Share Frontend
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$INSTALL_DIR/frontend
ExecStart=/usr/bin/npm run start
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3333
Environment=HOSTNAME=0.0.0.0

[Install]
WantedBy=multi-user.target
EOF
msg_ok "Systemd services created"

# Enable and start services
msg_info "Starting services"
systemctl daemon-reload
systemctl enable caddy pingvin-backend pingvin-frontend
systemctl restart caddy
systemctl start pingvin-backend
sleep 5
systemctl start pingvin-frontend
msg_ok "Services started"

# Save version
echo "$CURRENT_VERSION" > /opt/pingvin_version.txt

# Cleanup
msg_info "Cleaning up"
apt-get autoremove -y -qq
apt-get clean
rm -rf /var/lib/apt/lists/*
rm -f /tmp/pingvin-share-install.sh
msg_ok "Cleanup complete"

# Get IP
IP=$(hostname -I | awk '{print $1}')

echo ""
echo -e "${GN}========================================${CL}"
echo -e "${GN}  Pingvin Share Installation Complete!${CL}"
echo -e "${GN}========================================${CL}"
echo ""
echo -e "${YW}Version:${CL} $CURRENT_VERSION"
echo -e "${YW}Install Dir:${CL} $INSTALL_DIR"
echo ""
echo -e "${BL}Access Pingvin Share at:${CL}"
echo -e "  ${GN}http://${IP}:3000${CL}"
echo ""
echo -e "${YW}Default admin user will be created on first access.${CL}"
echo ""
