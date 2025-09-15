# Knowledge Base Improvements for OrcaSlicer AI Assistant

## Overview

This document outlines the improvements made to enhance the AI Assistant's knowledge base and provides instructions for implementation.

## Completed Improvements

### 1. Obico Blog Scraper (`scripts/ingest-obico-blog.ts`)
- Automatically discovers and scrapes all blog posts from https://www.obico.io/blog/
- Extracts structured metadata (title, author, publish date)
- Generates embeddings for semantic search
- Extracts entities and relationships specific to 3D printing

**Usage:**
```bash
npm run ingest-obico
```

### 2. Enhanced Entity Extraction
Updated `src/lib/lightrag/entityExtractor.ts` with:
- 15 comprehensive entity categories specific to 3D printing
- Categories include: material, setting, problem, solution, component, process, technique, tool, feature, printer_model, firmware, defect, measurement, brand
- 14 relationship types for better knowledge graph connections
- Improved extraction prompts for more accurate entity identification

### 3. Wiki Sync System (`scripts/sync-wiki.ts`)
- Automatically pulls latest changes from OrcaSlicer wiki GitHub repository
- Tracks file changes using SHA-256 hashes for incremental updates
- Preserves document history and marks deleted files
- Maintains git repository for the wiki locally

**Usage:**
```bash
npm run sync-wiki
```

## Critical Database Issue

⚠️ **Your current database is using Prisma Accelerate URLs which are NOT supported for the AI Assistant.**

### Required Action: Migrate to Standard PostgreSQL

Your current `.env.local` contains:
```
POSTGRES_URL="postgres://...@db.prisma.io:5432/..."
```

This Prisma Accelerate URL won't work with the standard PostgreSQL client used by the AI Assistant.

### Recommended PostgreSQL Providers:

1. **Vercel Postgres (Neon)** - Recommended for Vercel deployments
   - https://vercel.com/docs/storage/vercel-postgres
   - Free tier available
   - Easy integration with Vercel

2. **Supabase**
   - https://supabase.com
   - Generous free tier
   - Built-in pgvector support

3. **Railway**
   - https://railway.app
   - Simple setup
   - Good for development

### Migration Steps:

1. **Create a new PostgreSQL database** with one of the providers above

2. **Update your `.env.local`** with the new connection string:
   ```env
   DATABASE_URL="postgresql://user:password@host:5432/dbname"
   POSTGRES_URL="postgresql://user:password@host:5432/dbname"
   ```

3. **Run database setup**:
   ```bash
   npm run setup-db
   ```

4. **Ingest the OrcaSlicer wiki**:
   ```bash
   npm run ingest-local-wiki
   ```

5. **Ingest Obico blog** (optional but recommended):
   ```bash
   npm run ingest-obico
   ```

## How to Use the Improvements

### Initial Setup (After Database Migration)

1. **Populate initial calibration data**:
   ```bash
   npm run populate-data
   ```

2. **Ingest the full OrcaSlicer wiki**:
   ```bash
   npm run ingest-local-wiki
   ```

3. **Add Obico blog content**:
   ```bash
   npm run ingest-obico
   ```

### Regular Maintenance

1. **Keep wiki up to date** (run weekly/monthly):
   ```bash
   npm run sync-wiki
   ```

2. **Add new content sources** as needed

## Next Steps for Further Improvement

### 1. Add More Knowledge Sources
Create scrapers for:
- OrcaSlicer GitHub issues (common problems/solutions)
- OrcaSlicer release notes
- Teaching Tech calibration guides
- Ellis' Print Tuning Guide

### 2. Implement Better Search
The current system uses basic embeddings. Consider:
- Implementing hybrid search (vector + keyword + graph)
- Using the LightRAG graph traversal features
- Adding query expansion for better results

### 3. Add Source Attribution
Modify the chat API to include source references:
```typescript
// In api/chat.ts
const context = await rag.query(lastMessage, {
  mode: 'hybrid',
  top_k: 5,
  include_metadata: true // Add this
});

// Include sources in response
const sources = context.sources.map(s => ({
  title: s.title,
  url: s.url,
  relevance: s.score
}));
```

### 4. Quality Assurance
Create test queries to verify knowledge:
```typescript
// scripts/test-knowledge.ts
const testQueries = [
  "How to calibrate flow rate in OrcaSlicer?",
  "What causes stringing in PETG?",
  "Best retraction settings for Bowden extruder",
  // ... more test queries
];
```

## Monitoring Knowledge Base Health

Check your knowledge base statistics:
```bash
# Check database contents
npm run test-db

# Test chat functionality
npm run test-chat
```

## Troubleshooting

### If ingestion fails:
1. Check API keys in `.env.local`
2. Ensure database is accessible
3. Check rate limits (add delays if needed)

### If chat responses are poor:
1. Verify documents were ingested properly
2. Check embedding generation worked
3. Increase context window size in chat API
4. Review entity extraction results

## Resources

- [LightRAG Documentation](https://github.com/HKUDS/LightRAG)
- [Firecrawl API Docs](https://docs.firecrawl.dev/)
- [pgvector Documentation](https://github.com/pgvector/pgvector)

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review error logs in console
3. Open an issue on GitHub with details