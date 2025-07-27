# AI Assistant Setup & Usage Guide

## Quick Start (After Database Migration)

### 1. Check Environment
Ensure your `.env.local` has:
```env
# Standard PostgreSQL URL (NOT Prisma Accelerate)
DATABASE_URL="postgresql://user:password@host:5432/dbname"
POSTGRES_URL="postgresql://user:password@host:5432/dbname"

# API Keys
OPENAI_API_KEY="sk-..."
FIRECRAWL_API_KEY="fc-..."
```

### 2. Initialize Database & Knowledge Base
```bash
# Setup database schema
npm run setup-db

# Populate initial calibration guides
npm run populate-data

# Ingest OrcaSlicer wiki (if you have it locally)
npm run ingest-local-wiki

# OR sync wiki from GitHub (downloads automatically)
npm run sync-wiki

# Add Obico blog content (optional but recommended)
npm run ingest-obico
```

### 3. Verify Everything Works
```bash
# Test database connection
npm run test-db

# Test knowledge base quality
npm run test-knowledge

# Test chat functionality
npm run test-chat
```

## Regular Maintenance

### Keep Wiki Updated (Weekly/Monthly)
```bash
npm run sync-wiki
```
This will:
- Pull latest changes from GitHub
- Update only changed files
- Preserve existing embeddings
- Track deleted files

### Monitor Knowledge Base Health
```bash
npm run test-knowledge
```
This shows:
- Document counts by source
- Entity extraction statistics
- Search quality scores
- Recommendations for improvement

## Using the Enhanced Features

### 1. Chat with Source Attribution
The example implementation in `api/chat-with-sources.ts` shows how to:
- Include source references in responses
- Display relevance scores
- Link back to original documentation

### 2. Better Entity Extraction
The enhanced entity extractor now recognizes:
- 15 entity types (materials, settings, problems, etc.)
- 14 relationship types (solves, causes, requires, etc.)
- Specific 3D printing concepts and brands

### 3. Hybrid Search
Combines:
- Vector similarity search (semantic)
- Full-text search (keywords)
- Knowledge graph relationships

## Troubleshooting Common Issues

### "Database not initialized"
```bash
npm run setup-db
```

### "No documents found"
```bash
# Check what's in the database
npm run test-db

# If empty, run initial ingestion
npm run populate-data
npm run sync-wiki
```

### "Poor search results"
```bash
# Test knowledge base quality
npm run test-knowledge

# If scores are low, add more content
npm run ingest-obico
```

### "Firecrawl API errors"
- Check your FIRECRAWL_API_KEY is valid
- Add delays between requests if rate limited
- Use fallback scraping methods if needed

## Advanced Usage

### Adding Custom Content Sources

1. Create a new ingestion script:
```typescript
// scripts/ingest-custom-source.ts
import { /* ... */ } from './ingest-obico-blog.ts';

// Adapt the pattern for your source
```

2. Add to package.json:
```json
"scripts": {
  "ingest-custom": "tsx scripts/ingest-custom-source.ts"
}
```

### Implementing in Your App

1. **Basic Chat Integration**:
```typescript
// Use existing api/chat.ts
const response = await fetch('/api/chat', {
  method: 'POST',
  body: JSON.stringify({ messages })
});
```

2. **Chat with Sources**:
```typescript
// Use api/chat-with-sources.ts
// Returns responses with source attribution
```

3. **Custom Search**:
```typescript
// Implement hybrid search in your components
import { hybridSearch } from '@/lib/search';
const results = await hybridSearch(query);
```

## Performance Tips

1. **Batch Operations**: When ingesting multiple sources, use batch inserts
2. **Caching**: Consider caching frequent searches
3. **Indexing**: Ensure database indexes are created (done by setup-db)
4. **Embeddings**: Use smaller models for faster processing if needed

## Next Steps

1. **Migrate Database**: Move from Prisma Accelerate to standard PostgreSQL
2. **Initial Setup**: Run the initialization commands above
3. **Test Quality**: Use test-knowledge to verify setup
4. **Schedule Updates**: Set up cron job for wiki sync
5. **Monitor Usage**: Track which queries users ask most

## Support Resources

- [PostgreSQL Setup Guide](https://www.postgresql.org/docs/current/tutorial-start.html)
- [pgvector Documentation](https://github.com/pgvector/pgvector)
- [Firecrawl API Docs](https://docs.firecrawl.dev/)
- [OpenAI Embeddings Guide](https://platform.openai.com/docs/guides/embeddings)

Remember: The key to a good AI assistant is quality data. Keep your knowledge base updated and comprehensive!