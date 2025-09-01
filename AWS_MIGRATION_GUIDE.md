# AWS EC2 Migration Guide for HandyPay Backend

## Overview

This guide covers migrating your HandyPay backend from Render to AWS EC2 free tier to eliminate cold start delays.

## Pre-Migration Preparation Checklist

### Phase 1: AWS Account & Security (15-30 minutes)

#### 1. Create AWS Account

- Go to [aws.amazon.com](https://aws.amazon.com)
- Click "Create an AWS Account"
- Use a credit card (required for verification)
- Complete phone verification
- **Cost:** Free (you won't be charged during free tier)

#### 2. Set Up Billing Alerts

- Enable billing alerts for $0.01 threshold
- Set up cost allocation tags
- Enable free tier usage alerts

#### 3. Create SSH Key Pair

- Generate SSH key pair on your local machine:

```bash
ssh-keygen -t rsa -b 2048 -f ~/.ssh/handypay-aws-key
```

- Save the private key securely
- You'll need the public key for EC2 setup

### Phase 2: Domain & Networking (15 minutes)

#### 4. Domain Decision

- **Option A:** Keep current domain (easier)
  - Just update DNS A record to point to new EC2 IP
- **Option B:** Use Route 53 (AWS DNS)
  - Transfer domain or create subdomain

#### 5. SSL Certificate Planning

- **Free Option:** AWS Certificate Manager (ACM) - FREE
- **Alternative:** Let's Encrypt (free, manual renewal)
- Your app currently uses HTTPS, so this is required

### Phase 3: Application Audit (20-30 minutes)

#### 6. Environment Variables Inventory

Current `.env` file should include:

- Database connection strings
- Stripe API keys
- JWT secrets
- Other API keys
- Port configurations

#### 7. Database Strategy

- **Option A:** Keep current database (easiest)
  - Just whitelist EC2 IP in database security
- **Option B:** Migrate to AWS RDS (free tier available)
  - PostgreSQL free tier: 750 hours/month

#### 8. Performance Considerations

- Your app uses connection pooling (good!)
- Current database is PostgreSQL (perfect for AWS)
- Hono.js is lightweight and efficient

### Phase 4: Security & Monitoring (15 minutes)

#### 9. Security Groups Planning

- SSH access (port 22) - only from your IP
- HTTP (port 80) - for health checks
- HTTPS (port 443) - for your app
- Database port (if using RDS)

#### 10. Monitoring Setup

- AWS CloudWatch (free tier included)
- Basic health checks
- Error logging
- Performance monitoring

## Time Estimate: 1-2 Hours Total

### Priority Order:

1. ✅ AWS Account creation
2. ✅ SSH key generation
3. ✅ Environment variables audit
4. ✅ Domain decision
5. ✅ Database strategy decision

## What the Migration Script Will Handle:

- EC2 deployment script (automated setup)
- PM2 configuration (process management)
- Nginx reverse proxy (for SSL termination)
- Monitoring setup (CloudWatch integration)
- Backup automation (if needed)

## Current Backend Stack (Ready for Migration):

- **Framework:** Hono.js ✅
- **Runtime:** Node.js 18 ✅
- **Database:** PostgreSQL ✅
- **ORM:** Drizzle ✅
- **Build Process:** TypeScript ✅
- **Process Management:** PM2 ready ✅

## Cost Breakdown (Free Period):

| Service            | Free Period | Free Resources  |
| ------------------ | ----------- | --------------- |
| **EC2 t2.micro**   | 12 months   | 750 hours/month |
| **RDS PostgreSQL** | 12 months   | 750 hours/month |
| **Load Balancer**  | 12 months   | 750 hours/month |
| **Data Transfer**  | Always Free | 15GB/month      |

## Questions to Answer Before Migration:

1. **Do you have an AWS account already?** If not, are you ready to create one?
2. **What's your current domain setup?** (Custom domain or Render subdomain?)
3. **Are you using a managed database** (like Render PostgreSQL) or self-hosted?
4. **Do you have SSH experience?** (Don't worry if not - I'll guide you through it)

## Next Steps:

1. Complete the preparation checklist above
2. Reply with answers to the questions
3. I'll create the deployment script and guide you through the migration

---

_This guide was created for HandyPay backend migration from Render to AWS EC2_
