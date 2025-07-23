# Troubleshooting Guide - AI Assistant

## Common Issues and Solutions

### 1. Foreign Key Constraint Error

**Error**: `insert or update on table "chat_messages" violates foreign key constraint "chat_messages_session_id_fkey"`

**Cause**: The chat API is trying to insert a message with a session ID that doesn't exist in the `chat_sessions` table.

**Solution**:
1. The latest code now creates sessions automatically using transactions
2. If you still see this error, run:
   ```bash
   npm run reset-sessions  # WARNING: Deletes all chat history
   npm run setup-db       # Recreate tables if needed
   ```

### 2. Prisma Accelerate Connection Error

**Error**: `Failed to connect to upstream database. Please contact Prisma support`

**Cause**: You're using a Prisma Accelerate URL (db.prisma.io) which is incompatible with the native PostgreSQL driver.

**Solution**: Switch to a standard PostgreSQL provider:
- **Vercel Postgres**: https://vercel.com/postgres
- **Supabase**: https://supabase.com
- **Railway**: https://railway.app

See [MIGRATE_FROM_PRISMA.md](./MIGRATE_FROM_PRISMA.md) for detailed migration steps.

### 3. UUID Validation Error

**Error**: `invalid input syntax for type uuid: "default-session"`

**Cause**: The session ID being passed is not a valid UUID.

**Solution**: The code now validates and generates proper UUIDs automatically.

## Diagnostic Tools

### 1. Test Database Connection
```bash
# Local testing
npm run test-db

# Production endpoint
https://your-app.vercel.app/api/test-db
```

### 2. Test Session Creation
```bash
# Local testing
npm run test-chat

# Production endpoint
https://your-app.vercel.app/api/test-session
```

### 3. Debug Environment
```bash
# Production endpoint
https://your-app.vercel.app/api/debug
```

### 4. Test Streaming Response
```bash
# Test if AI streaming works (POST request)
curl -X POST https://your-app.vercel.app/api/test-stream \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello"}'
```

## Quick Fixes

### Reset All Sessions (Development Only)
```bash
npm run reset-sessions
```
⚠️ WARNING: This deletes ALL chat history!

### Reinitialize Database
```bash
npm run setup-db
npm run populate-data
```

### Test Chat API Locally
```bash
npm run test-chat
```

This will:
- Verify table existence
- Test session creation
- Test message insertion
- Verify foreign key constraints
- Show recent session statistics

## Architecture Overview

The chat system uses:
1. **chat_sessions** table - Stores session metadata
2. **chat_messages** table - Stores messages with foreign key to sessions
3. **Transaction-based insertion** - Ensures session exists before message

### Session Flow:
1. Client generates UUID using `crypto.randomUUID()`
2. Client passes UUID to chat API via `useChat` hook
3. API creates session if it doesn't exist (upsert)
4. API inserts message with valid session reference
5. All operations wrapped in transaction for consistency

## Environment Variables

Ensure these are set correctly:
```env
# Use a standard PostgreSQL URL, NOT Prisma Accelerate
DATABASE_URL=postgresql://user:pass@host:5432/dbname?sslmode=require
OPENAI_API_KEY=your-openai-api-key
```

## Still Having Issues?

1. Check the logs in Vercel dashboard
2. Run `/api/test-session` to diagnose
3. Ensure you're not using Prisma Accelerate URLs
4. Try a different database provider
5. Open an issue with:
   - Error messages
   - `/api/test-session` output
   - Database provider being used