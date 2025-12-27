#!/usr/bin/env bash

# Copyright (c) 2024 beaglemoo
# License: MIT
# Pingvin Share LXC Container Script
# Based on Proxmox VE Helper Scripts format

# App configuration
APP="PingvinShare"
var_tags="file-sharing;self-hosted"
var_cpu="2"
var_ram="2048"
var_disk="10"
var_os="debian"
var_version="12"
var_unprivileged="1"

# Header display function
header_info() {
  clear
  cat <<"EOF"
    ____  _                 _         _____ __
   / __ \(_)___  ____ ___  (_)___    / ___// /_  ____ _________
  / /_/ / / __ \/ __ `__ \/ / __ \   \__ \/ __ \/ __ `/ ___/ _ \
 / ____/ / / / / / / / / / / / / /  ___/ / / / / /_/ / /  /  __/
/_/   /_/_/ /_/_/ /_/ /_/_/_/ /_/  /____/_/ /_/\__,_/_/   \___/

EOF
}

# Variables
NEXTID=$(pvesh get /cluster/nextid)
TEMPLATE_SEARCH="debian-12"
STORAGE=""
CTID=""
HN="pingvin-share"
DISK_SIZE="${var_disk}"
CORE_COUNT="${var_cpu}"
RAM_SIZE="${var_ram}"
BRIDGE="vmbr0"
GATE=""
MAC=""
VLAN=""
MTU=""
START_AFTER_CREATE="yes"
VERBOSE="no"

# Color codes
YW=$(echo "\033[33m")
BL=$(echo "\033[36m")
GN=$(echo "\033[1;92m")
RD=$(echo "\033[01;31m")
CL=$(echo "\033[m")
CM="${GN}✓${CL}"
CROSS="${RD}✗${CL}"
INFO="${BL}ℹ${CL}"

# Message functions
msg_info() { echo -ne " ${INFO} ${YW}${1}...${CL}"; }
msg_ok() { echo -e "${CM} ${GN}${1}${CL}"; }
msg_error() { echo -e "${CROSS} ${RD}${1}${CL}"; }

# Error handling
set -Eeuo pipefail
trap 'error_handler $LINENO "$BASH_COMMAND"' ERR

error_handler() {
  local line_number=$1
  local command=$2
  msg_error "Error in line ${line_number}: ${command}"
  exit 1
}

# Check if running on Proxmox
check_pve() {
  if ! command -v pveversion &> /dev/null; then
    msg_error "This script must be run on a Proxmox VE host."
    exit 1
  fi
}

# Get storage pools
get_storage() {
  local storage_type=$1
  local storages
  storages=$(pvesm status -content $storage_type 2>/dev/null | awk 'NR>1 {print $1}')
  echo "$storages"
}

# Select storage
select_storage() {
  local content_type=$1
  local storages
  storages=$(get_storage $content_type)

  if [ -z "$storages" ]; then
    msg_error "No storage found for $content_type"
    exit 1
  fi

  echo "$storages" | head -1
}

# Download template
download_template() {
  local storage=$1
  local template

  msg_info "Searching for Debian 12 template"
  template=$(pveam available -section system | grep "$TEMPLATE_SEARCH" | head -1 | awk '{print $2}')

  if [ -z "$template" ]; then
    msg_error "Debian 12 template not found"
    exit 1
  fi

  msg_ok "Found template: $template"

  # Check if already downloaded
  if ! pveam list "$storage" | grep -q "$template"; then
    msg_info "Downloading template"
    pveam download "$storage" "$template" >/dev/null 2>&1
    msg_ok "Template downloaded"
  else
    msg_ok "Template already available"
  fi

  echo "$template"
}

# Create container
create_container() {
  local storage=$1
  local template=$2

  msg_info "Creating LXC Container"

  CTID=$NEXTID

  pct create "$CTID" "${storage}:vztmpl/${template}" \
    -arch amd64 \
    -ostype debian \
    -hostname "$HN" \
    -cores "$CORE_COUNT" \
    -memory "$RAM_SIZE" \
    -rootfs "${storage}:${DISK_SIZE}" \
    -net0 name=eth0,bridge="$BRIDGE",ip=dhcp \
    -unprivileged "$var_unprivileged" \
    -features nesting=1 \
    -onboot 1 \
    -tags "${var_tags}" \
    >/dev/null 2>&1

  msg_ok "Container $CTID created"
}

# Start container
start_container() {
  msg_info "Starting Container"
  pct start "$CTID" >/dev/null 2>&1
  sleep 5
  msg_ok "Container started"
}

# Run install script
run_install() {
  msg_info "Running installation script"

  # GitHub raw URL for install script
  INSTALL_URL="https://raw.githubusercontent.com/beaglemoo/pingvin-share/main/proxmox-lxc/install/pingvin-share-install.sh"

  # Download and execute install script inside container
  pct exec "$CTID" -- bash -c "curl -fsSL '$INSTALL_URL' -o /tmp/pingvin-share-install.sh"
  pct exec "$CTID" -- chmod +x /tmp/pingvin-share-install.sh
  pct exec "$CTID" -- bash /tmp/pingvin-share-install.sh

  msg_ok "Installation complete"
}

# Get container IP
get_ip() {
  local ip
  ip=$(pct exec "$CTID" -- hostname -I | awk '{print $1}')
  echo "$ip"
}

# Main function
main() {
  header_info
  check_pve

  echo -e "\n${BL}Creating Pingvin Share LXC Container${CL}\n"
  echo -e "${YW}CPU Cores:${CL} ${CORE_COUNT}"
  echo -e "${YW}RAM:${CL} ${RAM_SIZE}MB"
  echo -e "${YW}Disk:${CL} ${DISK_SIZE}GB"
  echo -e "${YW}OS:${CL} Debian 12"
  echo ""

  # Select storage
  STORAGE=$(select_storage "vztmpl")
  msg_ok "Using storage: $STORAGE"

  # Download template
  TEMPLATE=$(download_template "$STORAGE")

  # Create and start container
  create_container "$STORAGE" "$TEMPLATE"
  start_container

  # Run installation
  run_install

  # Get IP and display info
  IP=$(get_ip)

  echo ""
  echo -e "${GN}Pingvin Share installation complete!${CL}"
  echo ""
  echo -e "${YW}Container ID:${CL} $CTID"
  echo -e "${YW}Hostname:${CL} $HN"
  echo -e "${YW}IP Address:${CL} $IP"
  echo ""
  echo -e "${BL}Access Pingvin Share at:${CL} ${GN}http://${IP}:3000${CL}"
  echo ""
}

# Update function for existing installations
update_script() {
  header_info

  if [ ! -f /opt/pingvin_version.txt ]; then
    msg_error "Pingvin Share is not installed on this system"
    exit 1
  fi

  CURRENT_VERSION=$(cat /opt/pingvin_version.txt)
  msg_info "Current version: $CURRENT_VERSION"

  # Get latest version from GitHub
  LATEST_VERSION=$(curl -s https://api.github.com/repos/beaglemoo/pingvin-share/releases/latest | grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/')

  if [ -z "$LATEST_VERSION" ]; then
    # If no releases, check commits
    LATEST_VERSION=$(curl -s https://api.github.com/repos/beaglemoo/pingvin-share/commits/main | grep '"sha":' | head -1 | sed -E 's/.*"([^"]+)".*/\1/' | cut -c1-7)
  fi

  msg_info "Latest version: $LATEST_VERSION"

  if [ "$CURRENT_VERSION" = "$LATEST_VERSION" ]; then
    msg_ok "Already up to date"
    exit 0
  fi

  msg_info "Updating Pingvin Share"

  # Backup data
  msg_info "Backing up data"
  cp -r /opt/pingvin-share/backend/data /tmp/pingvin-backup
  msg_ok "Data backed up"

  # Pull latest changes
  cd /opt/pingvin-share
  git fetch --all
  git reset --hard origin/main

  # Rebuild
  msg_info "Rebuilding backend"
  cd /opt/pingvin-share/backend
  npm install
  npm run build
  npx prisma migrate deploy
  msg_ok "Backend rebuilt"

  msg_info "Rebuilding frontend"
  cd /opt/pingvin-share/frontend
  npm install
  npm run build
  msg_ok "Frontend rebuilt"

  # Restore data
  msg_info "Restoring data"
  cp -r /tmp/pingvin-backup/* /opt/pingvin-share/backend/data/
  rm -rf /tmp/pingvin-backup
  msg_ok "Data restored"

  # Restart services
  msg_info "Restarting services"
  systemctl restart pingvin-backend
  systemctl restart pingvin-frontend
  msg_ok "Services restarted"

  # Update version file
  echo "$LATEST_VERSION" > /opt/pingvin_version.txt

  msg_ok "Pingvin Share updated to $LATEST_VERSION"
}

# Check if running update
if [ "${1:-}" = "update" ]; then
  update_script
  exit 0
fi

main "$@"
