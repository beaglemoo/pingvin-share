# Pingvin Share - Proxmox LXC Installation

This directory contains scripts to deploy Pingvin Share as a native LXC container on Proxmox VE.

## Quick Start

### 1. Copy scripts to your Proxmox host

```bash
# On your Proxmox host
mkdir -p /root/pingvin-lxc
# Copy the entire proxmox-lxc folder to your Proxmox host
```

### 2. Run the container creation script

```bash
cd /root/pingvin-lxc
chmod +x ct/PingvinShare.sh install/pingvin-share-install.sh
bash ct/PingvinShare.sh
```

### 3. Access Pingvin Share

After installation, access Pingvin Share at:
```
http://<container-ip>:3000
```

The first user to sign up becomes the admin.

## Container Specifications

| Resource | Default |
|----------|---------|
| CPU Cores | 2 |
| RAM | 2048 MB |
| Disk | 10 GB |
| OS | Debian 12 |
| Network | DHCP |

## Directory Structure

```
proxmox-lxc/
├── ct/
│   └── PingvinShare.sh      # Container creation script
├── install/
│   └── pingvin-share-install.sh  # Installation script (runs inside container)
└── README.md
```

## Updating

To update an existing installation, run inside the container:

```bash
bash /root/pingvin-lxc/ct/PingvinShare.sh update
```

Or manually:

```bash
cd /opt/pingvin-share
git pull
cd backend && npm install && npm run build && npx prisma migrate deploy
cd ../frontend && npm install && npm run build
systemctl restart pingvin-backend pingvin-frontend
```

## Services

The installation creates three systemd services:

- `pingvin-backend` - NestJS backend API (port 8080)
- `pingvin-frontend` - Next.js frontend (port 3333)
- `caddy` - Reverse proxy (port 3000)

Manage services with:
```bash
systemctl status pingvin-backend
systemctl restart pingvin-frontend
journalctl -u pingvin-backend -f
```

## Data Location

- **Database**: `/opt/pingvin-share/backend/data/pingvin-share.db`
- **Uploads**: `/opt/pingvin-share/backend/data/uploads/`
- **Config**: `/opt/pingvin-share/backend/data/config.yaml` (optional)

## Backup

To backup your data:

```bash
# Stop services
systemctl stop pingvin-backend pingvin-frontend

# Backup data directory
tar -czvf pingvin-backup.tar.gz /opt/pingvin-share/backend/data

# Start services
systemctl start pingvin-backend pingvin-frontend
```

## Troubleshooting

### Check service logs
```bash
journalctl -u pingvin-backend -f
journalctl -u pingvin-frontend -f
journalctl -u caddy -f
```

### Verify services are running
```bash
systemctl status pingvin-backend pingvin-frontend caddy
```

### Check ports
```bash
ss -tlnp | grep -E '3000|3333|8080'
```

## License

MIT License - Based on Proxmox VE Community Scripts format.
