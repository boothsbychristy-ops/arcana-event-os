# Railway Deployment Guide for Arcana Event OS

This guide will walk you through deploying Arcana Event OS to Railway with PostgreSQL database support.

## Prerequisites

- GitHub account with access to `boothsbychristy-ops/arcana-event-os`
- Railway account (sign up at https://railway.app)
- Credit card for Railway (required even for free tier)

## Step 1: Set Up Railway Account

1. Go to https://railway.app
2. Click "Login" and sign in with your GitHub account
3. Authorize Railway to access your GitHub repositories
4. Complete the account setup

## Step 2: Create New Project

1. **From Railway Dashboard:**
   - Click "New Project"
   - Select "Deploy from GitHub repo"

2. **Select Repository:**
   - Choose `boothsbychristy-ops/arcana-event-os`
   - Railway will automatically detect it's a Node.js project

3. **Add PostgreSQL Database:**
   - Click "New" in your project
   - Select "Database"
   - Choose "PostgreSQL"
   - Railway will provision a PostgreSQL database

## Step 3: Configure Environment Variables

In your Railway project, go to the **Variables** tab and add these:

### Required Variables

```env
# Database (automatically provided by Railway PostgreSQL)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Authentication - Generate secure secrets
JWT_SECRET=<generate_with_command_below>
SESSION_SECRET=<generate_with_command_below>

# Application Configuration
NODE_ENV=production
PORT=5000

# JWT Configuration
JWT_ISS=arcana-event-os
JWT_AUD=arcana-web
JWT_EXPIRES=7d
```

### Optional Variables

```env
# AI Design Agent (if using Leonardo API)
LEONARDO_API_KEY=your_leonardo_api_key_here

# CDN Configuration (if using external CDN)
PUBLIC_ASSET_ORIGIN=https://your-cdn.com

# Client Origin (Railway will provide this)
CLIENT_ORIGIN=${{RAILWAY_PUBLIC_DOMAIN}}
BASE_URL=${{RAILWAY_PUBLIC_DOMAIN}}

# Logging
LOG_LEVEL=info

# Security
CSP_ENABLE_NONCE=false
```

### Generate Secure Secrets

Run these commands locally to generate secure secrets:

```bash
# Generate JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Generate SESSION_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Copy the output and paste into Railway variables.

## Step 4: Configure Build Settings

Railway should auto-detect the configuration from `railway.json`, but verify:

1. **Build Command:** `npm install && npm run build`
2. **Start Command:** `npm run start`
3. **Root Directory:** `/` (default)

## Step 5: Deploy

1. **Trigger Deployment:**
   - Railway will automatically deploy when you push to the `main` branch
   - Or click "Deploy" in the Railway dashboard

2. **Monitor Build:**
   - Watch the build logs in Railway dashboard
   - Build process:
     - Install dependencies
     - Build frontend (Vite)
     - Build backend (esbuild)
     - Start production server

3. **Check Deployment Status:**
   - Green checkmark = successful deployment
   - Red X = deployment failed (check logs)

## Step 6: Initialize Database

After first deployment, you need to push the database schema:

### Option A: Using Railway CLI (Recommended)

1. **Install Railway CLI:**
   ```bash
   npm i -g @railway/cli
   ```

2. **Login to Railway:**
   ```bash
   railway login
   ```

3. **Link to your project:**
   ```bash
   railway link
   ```

4. **Push database schema:**
   ```bash
   railway run npm run db:push
   ```

### Option B: Using Railway Shell

1. In Railway dashboard, go to your service
2. Click on "Settings" tab
3. Scroll to "Service" section
4. Click "Open Shell"
5. Run: `npm run db:push`

## Step 7: Access Your Application

1. **Get your URL:**
   - In Railway dashboard, find your service
   - Look for "Domains" section
   - Copy the generated URL (e.g., `arcana-event-os-production.up.railway.app`)

2. **Test the application:**
   - Open the URL in your browser
   - You should see the Arcana Event OS login page

3. **Create first user:**
   - The application should allow you to create an initial owner account
   - If not, you may need to seed the database

## Step 8: Configure Custom Domain (Optional)

1. **In Railway Dashboard:**
   - Go to your service
   - Click "Settings" tab
   - Scroll to "Domains" section
   - Click "Add Domain"

2. **Add Custom Domain:**
   - Enter your domain (e.g., `arcana.events`)
   - Follow Railway's DNS configuration instructions
   - Add CNAME record to your DNS provider

3. **Update Environment Variables:**
   - Update `CLIENT_ORIGIN` to your custom domain
   - Update `BASE_URL` to your custom domain

## Step 9: Set Up Auto-Deployment

Railway automatically deploys when you push to GitHub:

1. **Automatic Deployments:**
   - Push to `main` branch triggers deployment
   - Railway pulls latest code
   - Runs build process
   - Deploys new version

2. **Manual Deployments:**
   - Click "Deploy" in Railway dashboard
   - Select specific commit or branch

## Monitoring and Maintenance

### View Logs

1. In Railway dashboard, go to your service
2. Click "Deployments" tab
3. Click on a deployment to view logs
4. Use filters to find specific log entries

### Database Management

1. **Access Database:**
   - In Railway dashboard, click on PostgreSQL service
   - Click "Data" tab to browse tables
   - Or use "Connect" to get connection string

2. **Database Backups:**
   - Railway automatically backs up PostgreSQL databases
   - Go to PostgreSQL service → "Backups" tab

3. **Run Migrations:**
   ```bash
   railway run npm run db:push
   ```

### Scaling

1. **Vertical Scaling:**
   - Railway automatically scales based on usage
   - No configuration needed for free tier

2. **Monitor Usage:**
   - Check "Metrics" tab in Railway dashboard
   - Monitor CPU, memory, and network usage

## Troubleshooting

### Build Failures

**Issue:** Build fails during `npm install`
- **Solution:** Check `package.json` for incompatible dependencies
- Clear build cache in Railway settings

**Issue:** Build fails during `npm run build`
- **Solution:** Check build logs for specific errors
- Ensure all environment variables are set

### Runtime Errors

**Issue:** Application crashes on startup
- **Solution:** Check deployment logs
- Verify `DATABASE_URL` is correctly set
- Ensure all required environment variables are present

**Issue:** Database connection errors
- **Solution:** Verify PostgreSQL service is running
- Check `DATABASE_URL` format
- Ensure database schema is pushed

### Performance Issues

**Issue:** Slow response times
- **Solution:** Check Railway metrics
- Consider upgrading Railway plan
- Optimize database queries

**Issue:** Out of memory errors
- **Solution:** Check memory usage in metrics
- Optimize application code
- Upgrade Railway plan for more memory

## Cost Estimation

### Railway Pricing (as of 2024)

- **Hobby Plan:** $5/month
  - 500 hours of execution time
  - 512 MB RAM, 1 vCPU
  - Good for development/testing

- **Pro Plan:** $20/month
  - Unlimited execution time
  - 8 GB RAM, 8 vCPU shared
  - Production-ready

- **PostgreSQL:** 
  - Included in plan
  - 1 GB storage (Hobby)
  - 10 GB storage (Pro)

### Cost Optimization Tips

1. Use environment-based deployments (staging vs production)
2. Set up auto-sleep for development environments
3. Monitor usage in Railway dashboard
4. Optimize database queries to reduce CPU usage

## Security Best Practices

1. **Environment Variables:**
   - Never commit `.env` files
   - Use Railway's encrypted variables
   - Rotate secrets regularly

2. **Database Security:**
   - Railway PostgreSQL is private by default
   - Only accessible from Railway services
   - Use strong passwords

3. **Application Security:**
   - Keep dependencies updated
   - Enable Helmet security headers (already configured)
   - Use HTTPS only (Railway provides SSL)

4. **Access Control:**
   - Limit GitHub repository access
   - Use Railway team features for collaboration
   - Enable 2FA on Railway account

## Continuous Integration

### GitHub Actions (Optional)

Create `.github/workflows/railway-deploy.yml`:

```yaml
name: Deploy to Railway

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Use Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run type check
        run: npm run check
        
      - name: Build
        run: npm run build
```

## Support and Resources

- **Railway Documentation:** https://docs.railway.app
- **Railway Discord:** https://discord.gg/railway
- **GitHub Repository:** https://github.com/boothsbychristy-ops/arcana-event-os
- **Arcana Documentation:** See README.md in repository

## Quick Reference Commands

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login to Railway
railway login

# Link to project
railway link

# Push database schema
railway run npm run db:push

# View logs
railway logs

# Open project in browser
railway open

# Run commands in Railway environment
railway run <command>
```

## Next Steps

1. ✅ Set up Railway account
2. ✅ Create project and add PostgreSQL
3. ✅ Configure environment variables
4. ✅ Deploy application
5. ✅ Initialize database schema
6. ✅ Test application
7. ⏳ Configure custom domain (optional)
8. ⏳ Set up monitoring and alerts
9. ⏳ Configure backups
10. ⏳ Optimize performance

---

**Congratulations!** Your Arcana Event OS is now deployed on Railway and ready for production use.

