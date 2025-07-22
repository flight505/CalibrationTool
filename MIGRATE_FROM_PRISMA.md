# Migrating from Prisma Accelerate

If you're seeing the error "Failed to connect to upstream database. Please contact Prisma support", you need to switch to a standard PostgreSQL provider.

## Quick Migration Guide

### Option 1: Vercel Postgres (Recommended for Vercel)

1. **Go to your Vercel Dashboard**
   - Navigate to your project
   - Click on "Storage" tab
   - Click "Create Database" → "Postgres"

2. **Connect the database**
   - Vercel will automatically add the `POSTGRES_URL` environment variable
   - No additional configuration needed!

3. **Initialize the database**
   ```bash
   npm run setup-db
   npm run populate-data
   ```

### Option 2: Supabase (Free Tier)

1. **Create a Supabase account**
   - Go to https://supabase.com
   - Create a new project

2. **Get your connection string**
   - Go to Settings → Database
   - Copy the "Connection string" (URI format)
   - It looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxx.supabase.co:5432/postgres`

3. **Update Vercel environment variables**
   ```bash
   vercel env rm DATABASE_URL
   vercel env add DATABASE_URL
   # Paste your Supabase connection string
   ```

4. **Redeploy and initialize**
   ```bash
   vercel --prod
   npm run setup-db
   npm run populate-data
   ```

### Option 3: Railway

1. **Create a Railway account**
   - Go to https://railway.app
   - Create a new project

2. **Add PostgreSQL**
   - Click "New" → "Database" → "PostgreSQL"
   - Railway will provision a database

3. **Get connection string**
   - Click on the PostgreSQL service
   - Go to "Connect" tab
   - Copy the Postgres Connection URL

4. **Update Vercel environment variables**
   ```bash
   vercel env rm DATABASE_URL
   vercel env add DATABASE_URL
   # Paste your Railway connection string
   ```

## Why Prisma Accelerate Doesn't Work

Prisma Accelerate is a connection pooling proxy that requires:
- Prisma Client (ORM) to handle the special protocol
- Special authentication headers
- Custom connection handling

This application uses the native PostgreSQL driver (`pg`) for better performance and simplicity, which is incompatible with Prisma Accelerate's proxy protocol.

## Troubleshooting

After switching providers, if you still have issues:

1. **Check the connection**
   ```bash
   npm run test-db
   ```

2. **Visit the diagnostic endpoint**
   ```
   https://your-app.vercel.app/api/test-db
   ```

3. **Ensure tables are created**
   ```bash
   npm run setup-db
   ```

## Benefits of Standard PostgreSQL

- ✅ Direct connection without proxy overhead
- ✅ Better performance for serverless
- ✅ Standard PostgreSQL features
- ✅ No vendor lock-in
- ✅ Works with any PostgreSQL client/tool