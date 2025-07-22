# Deployment Guide

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
1. Check connection with diagnostic tool:
   ```bash
   npm run test-db
   ```

2. Common fixes:
   - Ensure SSL is enabled for production databases
   - Use connection pooling for serverless environments
   - Check firewall rules allow connections from Vercel IPs

### API Errors
Visit `/api/debug` endpoint to check:
- Database connectivity
- Environment variable presence
- Document count in database

### Build Errors
- Ensure Node.js 18+ is used
- Run `npm install` to update dependencies
- Check TypeScript errors with `npx tsc --noEmit`