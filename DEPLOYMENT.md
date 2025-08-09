# Globalink Deployment Guide

This guide explains how to deploy Globalink (VoIP Communication Platform) locally or on a VPS server.

## Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (optional, uses in-memory storage by default)
- SSL certificate for production (WebRTC requires HTTPS)

## Quick Local Development

```bash
# Clone and install dependencies
git clone <your-repo>
cd globalink
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:5000`

## Local Production Build

```bash
# Build the application
npm run build

# Start production server
npm start
```

## VPS Deployment

### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Install Nginx for reverse proxy
sudo apt install nginx -y
```

### 2. Application Deployment

```bash
# Create app directory
sudo mkdir -p /var/www/globalink
sudo chown $USER:$USER /var/www/globalink

# Clone and setup application
cd /var/www/globalink
git clone <your-repo> .
npm install
npm run build
```

### 3. Environment Configuration

Create `.env` file:

```bash
# Production environment
NODE_ENV=production
PORT=5000

# Database (if using PostgreSQL)
DATABASE_URL=postgresql://username:password@localhost:5432/globalink

# Session security
SESSION_SECRET=your-super-secret-session-key

# CORS settings
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### 4. PM2 Process Management

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'globalink',
    script: 'server/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000
    }
  }]
};
```

Start the application:

```bash
# Start with PM2
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save
pm2 startup
```

### 5. Nginx Configuration

Create `/etc/nginx/sites-available/globalink`:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;

    # WebRTC requires low latency
    proxy_buffering off;
    proxy_cache off;

    # Main application
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket support for real-time features
    location /ws {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # WebSocket specific settings
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/globalink /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 6. SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 7. Firewall Configuration

```bash
# Configure UFW firewall
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
```

### 8. PostgreSQL Setup (Optional)

```bash
# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Create database and user
sudo -u postgres psql
```

```sql
CREATE DATABASE globalink;
CREATE USER globalink_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE globalink TO globalink_user;
\q
```

### 9. Monitoring and Logs

```bash
# Monitor application
pm2 monit

# View logs
pm2 logs globalink

# Check Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## Docker Deployment (Alternative)

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 5000

CMD ["npm", "start"]
```

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://globalink:password@db:5432/globalink
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=globalink
      - POSTGRES_USER=globalink
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
```

Deploy with Docker:

```bash
docker-compose up -d
```

## Performance Optimization

### 1. Application Level

- Enable gzip compression
- Implement Redis for session storage
- Use CDN for static assets
- Optimize database queries

### 2. Server Level

```bash
# Increase file limits
echo "fs.file-max = 65536" >> /etc/sysctl.conf

# Optimize network settings for WebRTC
echo "net.core.rmem_max = 26214400" >> /etc/sysctl.conf
echo "net.core.rmem_default = 26214400" >> /etc/sysctl.conf
echo "net.core.wmem_max = 26214400" >> /etc/sysctl.conf
echo "net.core.wmem_default = 26214400" >> /etc/sysctl.conf

sysctl -p
```

## Troubleshooting

### Common Issues

1. **WebRTC not working**: Ensure HTTPS is enabled and proper STUN/TURN servers are configured
2. **WebSocket connection fails**: Check firewall and proxy settings
3. **Session issues**: Verify session secret and cookie settings
4. **Database connection**: Check DATABASE_URL and PostgreSQL service status

### Health Check Endpoint

The application includes a health check at `/api/health`:

```bash
curl https://yourdomain.com/api/health
```

Should return:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-XX",
  "uptime": "XXX seconds"
}
```

## Security Considerations

1. Use strong session secrets
2. Implement rate limiting
3. Regular security updates
4. Monitor access logs
5. Use fail2ban for brute force protection
6. Regular database backups

## Support

For deployment issues:
1. Check application logs: `pm2 logs globalink`
2. Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
3. Verify WebSocket connections: Browser developer tools > Network > WS
4. Test WebRTC functionality: Browser developer tools > Console

---

**Important**: WebRTC requires HTTPS in production. Ensure SSL certificates are properly configured before deploying to production.