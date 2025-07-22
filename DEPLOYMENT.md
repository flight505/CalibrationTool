# Deployment Guide

## ⚠️ Important: Database Provider Requirements

**This application uses the native PostgreSQL driver (`pg`), NOT Prisma Client.**

If you're seeing "Failed to connect to upstream database. Please contact Prisma support", you're likely using a Prisma Accelerate URL which is **not compatible** with this application.

### Recommended Database Providers

1. **Vercel Postgres (Neon)** - Best for Vercel deployments
   - Sign up: https://vercel.com/postgres
   - Automatic pooling and serverless optimization
   - Connection string format: `postgres://user:pass@host.neon.tech:5432/db?sslmode=require`

2. **Supabase** - Great free tier
   - Sign up: https://supabase.com
   - Built-in connection pooling
   - Connection string format: `postgresql://user:pass@db.supabase.co:5432/postgres`

3. **Railway PostgreSQL** - Simple and reliable
   - Sign up: https://railway.app
   - Connection string format: `postgresql://user:pass@containers-us-west-123.railway.app:5432/railway`

4. **Render PostgreSQL** - Good free tier
   - Sign up: https://render.com
   - Connection string format: `postgresql://user:pass@oregon-postgres.render.com:5432/dbname`

## Database Setup

### Testing Database Connection
Run the diagnostic script to test your database connection:
```bash
npm run test-db
```

### Environment Variables
Copy `.env.example` to `.env.local` and configure:

```env
# Required
OPENAI_API_KEY=your-openai-api-key
DATABASE_URL=your-postgres-connection-string

# Optional
FIRECRAWL_API_KEY=your-firecrawl-api-key
```

### Database Connection Formats

#### Standard PostgreSQL
```
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
```

#### Vercel Postgres (Neon)
```
POSTGRES_URL=postgres://user:password@host.neon.tech:5432/dbname?sslmode=require
```

#### Supabase
```
DATABASE_URL=postgresql://user:password@db.supabase.co:5432/dbname
```

#### With Connection Pooling (Recommended for Serverless)
```
DATABASE_URL=postgresql://user:password@host:5432/dbname?pgbouncer=true&connection_limit=1
```

### Initial Setup
1. Create database schema:
   ```bash
   npm run setup-db
   ```

2. Populate initial data:
   ```bash
   npm run populate-data
   ```

3. (Optional) Ingest documentation:
   ```bash
   npm run ingest-docs
   ```

## Vercel Deployment

### One-Click Deploy
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/calibration-tool)

### Manual Deploy
1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Deploy:
   ```bash
   vercel
   ```

3. Set environment variables in Vercel dashboard or via CLI:
   ```bash
   vercel env add OPENAI_API_KEY
   vercel env add DATABASE_URL
   ```

## Troubleshooting

### Database Connection Issues

#### Common Errors and Solutions

**"Failed to connect to upstream database. Please contact Prisma support"**
- This error often occurs with Prisma Accelerate URLs (db.prisma.io)
- Solution: Use a standard PostgreSQL connection string instead
- Alternative: Consider using Vercel Postgres, Supabase, or Neon

**SSL Connection Errors**
- Add `?sslmode=require` to your connection string
- Or use the test endpoint to find the right SSL configuration

**Connection Timeout**
- Increase connection timeout in pool configuration
- Ensure database allows connections from Vercel's IP ranges

#### Diagnostic Steps

1. Test locally with diagnostic script:
   ```bash
   npm run test-db
   ```

2. Check deployed endpoints:
   - Visit `https://your-app.vercel.app/api/test-db` for detailed diagnostics
   - Visit `https://your-app.vercel.app/api/debug` for basic checks

3. Common database providers that work well:
   - **Vercel Postgres (Neon)**: Built for serverless, automatic pooling
   - **Supabase**: Good free tier, built-in pooling
   - **Railway PostgreSQL**: Simple setup, good for small projects
   - **Render PostgreSQL**: Reliable with connection pooling

4. Database URL formats by provider:
   ```bash
   # Neon (Vercel Postgres)
   POSTGRES_URL=postgres://user:pass@host.neon.tech:5432/db?sslmode=require
   
   # Supabase
   DATABASE_URL=postgresql://user:pass@db.supabase.co:5432/postgres
   
   # Railway
   DATABASE_URL=postgresql://user:pass@containers-us-west-123.railway.app:5432/railway
   ```

### API Errors
Visit these endpoints to diagnose issues:
- `/api/debug` - Basic environment and database check
- `/api/test-db` - Detailed database connection diagnostics with multiple SSL configurations

The test-db endpoint will try different connection configurations and show which one works.

### Build Errors
- Ensure Node.js 18+ is used
- Run `npm install` to update dependencies
- Check TypeScript errors with `npx tsc --noEmit`