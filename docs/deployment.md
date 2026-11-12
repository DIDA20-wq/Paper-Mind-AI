# PaperMind AI — Production Deployment Guide

This document describes the deployment architecture, configuration steps, and maintenance procedures for deploying PaperMind AI in production environments.

---

## 1. Quick Start: Containerized Deployment (Docker Compose)

The recommended production deployment method uses Docker Compose, which provisions all four microservices with private networking and persistent storage volumes:

- **PostgreSQL 16**: Relational user accounts, document metadata, chat histories, citations, and summaries.
- **Qdrant Vector Database**: High-speed cosine similarity vector indexing with payload-level multi-tenant user isolation.
- **FastAPI Application Server**: Asynchronous Python backend executing PyMuPDF extraction, sentence-transformer dense embeddings, and Gemini synthesis.
- **Nginx & React SPA**: Production Nginx container serving optimized static assets, handling client-side SPA routing, and reverse-proxying `/api/` traffic.

### Step 1: Clone Repository & Configure Environment

```bash
git clone https://github.com/your-username/paper-mind-ai.git
cd paper-mind-ai
cp .env.example .env
```

Edit `.env` to supply production secrets:
```bash
ENVIRONMENT=production
DEBUG=false
SECRET_KEY=generate-a-cryptographically-secure-random-string-at-least-64-chars
GEMINI_API_KEY=your-actual-google-gemini-api-key
```

### Step 2: Build & Launch Services

```bash
docker-compose up -d --build
```

### Step 3: Verify Container Health

```bash
docker-compose ps
```

All 4 services should report `healthy` or `running`:
- `papermind-postgres`: `healthy` (Port 5432)
- `papermind-qdrant`: `healthy` (Port 6333)
- `papermind-backend`: `healthy` (Port 8000)
- `papermind-frontend`: `running` (Port 80)

Visit `http://localhost` (or your domain name) to access the production application.

---

## 2. Bare-Metal & VPS Production Deployment

For deployments on cloud VMs (AWS EC2, Google Cloud Compute Engine, DigitalOcean Droplet, Hetzner):

### 1. System Requirements
- **OS**: Ubuntu 22.04 LTS or 24.04 LTS
- **RAM**: Minimum 4GB (8GB recommended for concurrent Sentence-Transformers embedding inference)
- **CPU**: 2+ Cores
- **Disk**: 20GB+ SSD

### 2. Install Prerequisites
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y python3.10 python3.10-venv python3-pip nodejs npm nginx postgresql postgresql-contrib curl
```

### 3. Database Initialization
```bash
sudo -u postgres psql -c "CREATE USER papermind_user WITH PASSWORD 'StrongPassword2026!';"
sudo -u postgres psql -c "CREATE DATABASE papermind OWNER papermind_user;"
```

### 4. Backend Service (systemd)
```bash
cd /opt/paper-mind-ai
python3 -m venv backend/venv
source backend/venv/bin/activate
pip install -r backend/requirements.txt
```

Create `/etc/systemd/system/papermind-backend.service`:
```ini
[Unit]
Description=PaperMind AI FastAPI Backend Service
After=network.target postgresql.service

[Service]
User=www-data
Group=www-data
WorkingDirectory=/opt/paper-mind-ai
Environment="PYTHONPATH=/opt/paper-mind-ai/backend"
EnvironmentFile=/opt/paper-mind-ai/.env
ExecStart=/opt/paper-mind-ai/backend/venv/bin/gunicorn app.main:app \
    --workers 4 \
    --worker-class uvicorn.workers.UvicornWorker \
    --bind 127.0.0.1:8000 \
    --access-logfile /var/log/papermind/access.log \
    --error-logfile /var/log/papermind/error.log
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable papermind-backend
sudo systemctl start papermind-backend
```

### 5. Frontend Build
```bash
cd /opt/paper-mind-ai/frontend
npm install
npm run build
sudo cp -r dist/* /var/www/papermind/
```

### 6. SSL Configuration (Let's Encrypt)
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## 3. Production Security Checklist

- [x] **Secret Keys**: Never use default or development secret keys in production.
- [x] **CORS Restrictons**: Specify explicit trusted domains in `BACKEND_CORS_ORIGINS`.
- [x] **File Uploads**: Restrict uploads to valid PDFs, enforcing max size of 30MB with magic-byte and PyMuPDF corruption checks.
- [x] **Multi-Tenant Boundaries**: Every document and session is foreign-keyed and filtered by authenticated `user_id`.
- [x] **Rate Limiting**: Use Nginx `limit_req_zone` to protect `/api/v1/auth/` and `/api/v1/chat/ask` from brute-force or denial-of-service abuse.
- [x] **HTTPS Only**: Enforce TLS 1.3 and HSTS headers.

---

## 4. Backup & Disaster Recovery

### PostgreSQL Database Backup:
```bash
# Automated daily dump
docker exec -t papermind-postgres pg_dump -U postgres papermind > backup_$(date +%Y%m%d).sql
```

### Qdrant Vector Collection Snapshot:
```bash
# Trigger Qdrant snapshot via REST API
curl -X POST "http://localhost:6333/collections/papermind_chunks/snapshots"
```
