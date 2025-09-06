# Backend Deployment Guide: AWS EC2 vs Cloudflare

## 🎯 **Recommendation: Cloudflare Workers (Easiest Migration)**

Based on your current setup (Hono + PostgreSQL + Stripe), **Cloudflare Workers** is the best choice for you:

### ✅ **Why Cloudflare Workers?**

- **Zero Cold Starts** - Instant response times
- **Global CDN** - Fast worldwide performance
- **Pay-per-use** - Costs scale with usage
- **Hono Compatible** - Your existing code works with minimal changes
- **Database Ready** - PostgreSQL works perfectly
- **Stripe Compatible** - All payment features work

---

## 🚀 **Cloudflare Workers Setup (Recommended)**

### **Step 1: Install Wrangler**

```bash
cd handypay-backend
npm install -g wrangler
```

### **Step 2: Initialize Cloudflare**

```bash
wrangler auth login
wrangler init --yes
```

### **Step 3: Create wrangler.toml**

```toml
name = "handypay-backend"
main = "src/index.ts"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]

[vars]
BETTER_AUTH_URL = "https://handypay-backend.your-domain.workers.dev"
DATABASE_URL = "your_postgresql_connection_string"
DIRECT_URL = "your_postgresql_direct_connection"

[[d1_databases]]
binding = "DB"
database_name = "handypay-db"
database_id = "your-database-id"
```

### **Step 4: Update your Hono app**

```typescript
// src/index.ts
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

const app = new Hono();

app.use("*", cors());
app.use("*", logger());

// Your existing routes here...

export default {
  port: 3000,
  fetch: app.fetch,
};
```

### **Step 5: Deploy**

```bash
npm run cf-deploy
```

---

## 🏗️ **AWS EC2 Setup (Alternative)**

### **Step 1: Launch EC2 Instance**

```bash
# Free tier eligible
Instance Type: t3.micro
AMI: Ubuntu 22.04 LTS
Storage: 8GB gp2
```

### **Step 2: Connect and Setup**

```bash
ssh -i your-key.pem ubuntu@your-ec2-ip

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo apt install nginx -y
```

### **Step 3: Configure Nginx**

```bash
sudo nano /etc/nginx/sites-available/handypay-backend

# Add this configuration:
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

sudo ln -s /etc/nginx/sites-available/handypay-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### **Step 4: Deploy Your App**

```bash
# Clone your repo
git clone your-repo-url
cd handypay-backend

# Install dependencies
npm install

# Build the app
npm run build

# Start with PM2
pm2 start dist/index.js --name handypay-backend
pm2 startup
pm2 save
```

### **Step 5: SSL Setup (Let's Encrypt)**

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com
```

---

## 📊 **Cost Comparison**

| Service                | Free Tier         | Paid Usage             | Setup Time   |
| ---------------------- | ----------------- | ---------------------- | ------------ |
| **Cloudflare Workers** | 100k requests/day | $0.15/million requests | 30 minutes   |
| **AWS EC2 t3.micro**   | 750 hours/month   | $8.50/month            | 2-3 hours    |
| **Render (Current)**   | 750 hours/month   | $7/month               | Already done |

---

## 🔧 **Migration Checklist**

### **For Cloudflare Workers:**

- [ ] Install Wrangler CLI
- [ ] Create Cloudflare account
- [ ] Update wrangler.toml
- [ ] Test locally with `wrangler dev`
- [ ] Deploy with `wrangler deploy`
- [ ] Update frontend API URLs

### **For AWS EC2:**

- [ ] Launch EC2 instance
- [ ] Configure security groups
- [ ] Setup Nginx reverse proxy
- [ ] Configure SSL certificate
- [ ] Deploy application
- [ ] Setup monitoring

---

## 🎯 **Final Recommendation**

**Go with Cloudflare Workers** because:

1. **Easier Migration** - Your Hono code works with minimal changes
2. **Better Performance** - Global CDN, zero cold starts
3. **Cost Effective** - Pay only for what you use
4. **Lower Maintenance** - No server management needed
5. **Scalable** - Handles traffic spikes automatically

**Ready to get started with Cloudflare Workers?** I can help you with the setup process!

Would you like me to help you set up the Cloudflare Workers deployment?
