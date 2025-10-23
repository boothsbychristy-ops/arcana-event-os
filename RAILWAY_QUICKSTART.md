# Railway Quick Start Guide

Deploy Arcana Event OS to Railway in 5 minutes.

## Prerequisites

- GitHub account
- Railway account (https://railway.app)

## Quick Deploy Steps

### 1. Create Railway Project

1. Go to https://railway.app
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose `boothsbychristy-ops/arcana-event-os`

### 2. Add PostgreSQL Database

1. In your project, click "New"
2. Select "Database" → "PostgreSQL"
3. Railway provisions the database automatically

### 3. Set Environment Variables

Click on your service → "Variables" tab → Add these:

```env
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_SECRET=<generate-below>
SESSION_SECRET=<generate-below>
NODE_ENV=production
PORT=5000
JWT_ISS=arcana-event-os
JWT_AUD=arcana-web
JWT_EXPIRES=7d
LOG_LEVEL=info
```

**Generate secrets locally:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Run this twice to get `JWT_SECRET` and `SESSION_SECRET`.

### 4. Deploy

Railway automatically deploys. Monitor in the "Deployments" tab.

### 5. Initialize Database

**Option A - Railway CLI:**
```bash
npm i -g @railway/cli
railway login
railway link
railway run npm run db:push
```

**Option B - Railway Shell:**
1. Go to service → "Settings" → "Open Shell"
2. Run: `npm run db:push`

### 6. Access Your App

Find your URL in "Domains" section (e.g., `arcana-event-os-production.up.railway.app`)

## Troubleshooting

**Build fails?**
- Check build logs in "Deployments" tab
- Verify all environment variables are set

**Database connection error?**
- Ensure PostgreSQL service is running
- Verify `DATABASE_URL` is set to `${{Postgres.DATABASE_URL}}`

**App crashes on startup?**
- Check deployment logs
- Ensure `npm run db:push` was executed

## Cost

- **Hobby Plan**: $5/month (500 hours)
- **Pro Plan**: $20/month (unlimited)

## Next Steps

- Configure custom domain in "Domains" section
- Set up monitoring in "Metrics" tab
- Enable auto-backups for PostgreSQL

## Full Documentation

See [RAILWAY_DEPLOYMENT.md](./RAILWAY_DEPLOYMENT.md) for comprehensive guide.

---

**Need help?** Check Railway docs at https://docs.railway.app

