# OrcaSlicer Chat Implementation Plan

## Implementation Status
**Last Updated**: January 18, 2025  
**Status**: Enhanced UI implemented with AnimatedAIChat, data ingestion pending

## Quick Start Guide

### Immediate Actions Required:
1. **Pull Vercel Environment Variables** ✅ (5 minutes)
   ```bash
   vercel env pull .env.local
   ```

2. **Add API Keys to .env.local** ✅ (2 minutes)
   - Add your OpenAI API key
   - Add your Firecrawl API key (optional - scraper not implemented yet)

3. **Setup Database** ✅ (5 minutes)
   ```bash
   npm run setup-db
   ```
   Note: pgvector is not available in the current Vercel Postgres setup. The system uses text-based search instead.

4. **Install Core Dependencies** ✅ (5 minutes)
   ```bash
   npm install
   ```
   All dependencies are already in package.json, including framer-motion for animations.

## How It Works

### Current Architecture
The chatbot is implemented as a Vite React application with Vercel serverless functions:

1. **Frontend**:
   - **NEW**: Animated AI Chat component (`src/components/ui/animated-ai-chat.tsx`) with full-page immersive interface
   - Chat page wrapper (`src/components/ChatPage.tsx`) integrating with existing API
   - Uses Vercel AI SDK for streaming responses
   - Command palette with OrcaSlicer-specific shortcuts:
     - `/flow` - Flow ratio calibration help
     - `/temperature` - Temperature tower guidance  
     - `/pressure` - Pressure advance tuning
     - `/retraction` - Retraction test for stringing
   - Beautiful gradient animations and visual effects
   - Supports file attachments (UI only, backend pending)

2. **Backend**:
   - Vercel serverless function (`api/chat.ts`) handles chat requests
   - PostgreSQL database stores chat sessions, messages, and knowledge graph
   - Text-based search using PostgreSQL's full-text search (tsvector/tsquery)
   - OpenAI GPT-4 for responses and entity extraction

3. **LightRAG Implementation**:
   - TypeScript implementation of core LightRAG concepts
   - Entity extraction using OpenAI function calling
   - Dual-level retrieval:
     - Low-level: Direct text search for specific terms
     - High-level: Concept extraction and graph traversal
   - Knowledge graph stored in PostgreSQL tables

4. **Database Schema** (Modified for no pgvector):
   - `documents`: Stores knowledge base content with text search indexes
   - `chat_sessions`: Tracks user sessions
   - `chat_messages`: Stores conversation history
   - `kg_entities`: Knowledge graph entities with embeddings as JSON
   - `kg_relationships`: Entity relationships for graph traversal
   - `file_uploads`: Metadata for uploaded files (implementation pending)

### Data Flow
1. User navigates to "AI Assistant" in main navigation
2. Opens full-page animated chat interface
3. User types message or uses command shortcuts
4. Request sent to `/api/chat` endpoint
5. System performs text-based retrieval from knowledge base
6. Context + user message sent to OpenAI GPT-4
7. Streaming response displayed with typing animation
8. Entities extracted asynchronously for knowledge graph

## New Features with AnimatedAIChat

### User Interface Enhancements
- **Full-page chat experience** instead of sidebar
- **Gradient animated backgrounds** with blur effects
- **Command palette** (/) for quick access to calibration topics
- **Modern message bubbles** with gradient borders
- **Smooth typing indicators** with animated dots
- **Auto-scrolling** message display
- **Responsive design** optimized for all screen sizes

### Command Shortcuts
Users can quickly access help by typing:
- `/flow` → "How do I calibrate flow ratio in OrcaSlicer?"
- `/temperature` → "What is the temperature tower calibration process?"
- `/pressure` → "Explain pressure advance calibration"
- `/retraction` → "How to perform a retraction test?"

## Admin Usage Scenarios

### Scenario 1: Populating the Knowledge Base Manually

Since the Firecrawl scraper isn't implemented yet, here's how to add content manually:

1. **Connect to your database**:
   ```bash
   # Use any PostgreSQL client with your DATABASE_URL from .env.local
   psql $DATABASE_URL
   ```

2. **Add documents directly**:
   ```sql
   -- Add a calibration guide
   INSERT INTO documents (title, content, url, source_type, metadata)
   VALUES (
     'Flow Ratio Calibration Guide',
     'Flow ratio calibration is essential for accurate extrusion. Start by printing a calibration cube...',
     'https://github.com/SoftFever/OrcaSlicer/wiki/Flow-Rate',
     'wiki',
     '{"category": "calibration", "difficulty": "beginner"}'::jsonb
   );

   -- Add troubleshooting content
   INSERT INTO documents (title, content, url, source_type, metadata)
   VALUES (
     'Fixing Stringing Issues',
     'Stringing occurs when filament oozes during travel moves. Solutions include: adjusting retraction distance...',
     'https://example.com/stringing-guide',
     'guide',
     '{"category": "troubleshooting", "tags": ["stringing", "retraction"]}'::jsonb
   );
   ```

3. **Extract entities from existing content**:
   ```sql
   -- Add common entities
   INSERT INTO kg_entities (name, entity_type, description, metadata)
   VALUES 
     ('PLA', 'material', 'Polylactic Acid - biodegradable thermoplastic', '{"temp_range": "190-220C"}'::jsonb),
     ('Flow Ratio', 'setting', 'Controls material extrusion multiplier', '{"default": "1.0"}'::jsonb),
     ('Stringing', 'problem', 'Thin strings of plastic between parts', '{"severity": "medium"}'::jsonb);

   -- Add relationships
   INSERT INTO kg_relationships (source_entity_id, target_entity_id, relationship_type, weight)
   VALUES 
     (1, 3, 'causes', 0.3), -- PLA causes stringing (low weight)
     (2, 3, 'solves', 0.8); -- Flow Ratio solves stringing (high weight)
   ```

4. **Verify content is searchable**:
   ```sql
   -- Test text search
   SELECT title, ts_rank(to_tsvector('english', content), query) as rank
   FROM documents, plainto_tsquery('english', 'calibration flow') query
   WHERE to_tsvector('english', content) @@ query
   ORDER BY rank DESC;
   ```

### Scenario 2: Monitoring and Managing Chat Sessions

1. **View active sessions**:
   ```sql
   -- Recent chat sessions
   SELECT 
     id,
     created_at,
     metadata->>'startTime' as start_time,
     (SELECT COUNT(*) FROM chat_messages WHERE session_id = cs.id) as message_count
   FROM chat_sessions cs
   ORDER BY created_at DESC
   LIMIT 10;
   ```

2. **Analyze popular queries**:
   ```sql
   -- Most common user questions
   SELECT 
     substring(content, 1, 100) as query_preview,
     COUNT(*) as frequency
   FROM chat_messages
   WHERE role = 'user'
   GROUP BY substring(content, 1, 100)
   ORDER BY frequency DESC
   LIMIT 20;
   ```

3. **Export conversation for analysis**:
   ```sql
   -- Export a session
   SELECT 
     cm.created_at,
     cm.role,
     cm.content
   FROM chat_messages cm
   WHERE session_id = 'YOUR_SESSION_UUID'
   ORDER BY created_at;
   ```

4. **Clean up old sessions** (optional):
   ```sql
   -- Delete sessions older than 30 days
   DELETE FROM chat_sessions
   WHERE created_at < NOW() - INTERVAL '30 days';
   ```

## Implementation Progress

### ✅ Completed

#### Phase 1: Project Setup and Configuration
- [x] Create `.env.local` file in project root
- [x] Add all required environment variables
- [x] Install core dependencies including framer-motion
- [x] Install Vercel AI SDK
- [x] Install utility libraries
- [x] Create TypeScript implementation of LightRAG concepts
- [x] Add vite-env.d.ts for proper TypeScript support

#### Phase 2: Database Schema and Setup
- [x] Create database setup script (modified for no pgvector)
- [x] Create all necessary tables
- [x] Add text search indexes
- [x] Successfully run database setup

#### Phase 3: Core Implementation
- [x] Create entity extraction module (`src/lib/lightrag/entityExtractor.ts`)
- [x] Implement dual-level retrieval (`src/lib/lightrag/retrieval.ts`)
- [x] Create database client (`src/lib/db/client.ts`)
- [x] Implement OpenAI utilities (`src/lib/utils/openai.ts`)

#### Phase 4: Backend API Implementation
- [x] Create chat API endpoint (`api/chat.ts`)
- [x] Handle streaming responses
- [x] Implement context retrieval (text-based)
- [x] Session management

#### Phase 5: Frontend Integration (Enhanced)
- [x] **NEW**: Implement AnimatedAIChat component with OrcaSlicer customizations
- [x] **NEW**: Create dedicated chat page route in navigation
- [x] **NEW**: Add command palette with calibration shortcuts
- [x] **NEW**: Integrate with existing chat API using useChat hook
- [x] **NEW**: Add gradient animations and visual effects
- [x] **NEW**: Successfully build for Vercel deployment
- [x] Remove sidebar chatbot in favor of full-page experience
- [x] Implement streaming message display with typing indicators
- [x] Add auto-scrolling and responsive design

### ❌ Not Implemented

#### Data Ingestion
- [ ] Firecrawl web scraper for automatic documentation ingestion
- [ ] Batch embedding generation
- [ ] Automated entity extraction pipeline

#### File Upload Features
- [ ] Backend handler for file uploads
- [ ] JSON file analysis (printer/filament settings)
- [ ] Image analysis with OpenAI Vision
- [ ] STL file parsing

#### Advanced Features
- [ ] Vector similarity search (requires pgvector)
- [ ] Usage analytics dashboard
- [ ] Rate limiting implementation
- [ ] Caching layer

## Current Limitations

1. **No Vector Search**: Database doesn't support pgvector, so similarity search is text-based only
2. **Manual Data Entry**: No automated scraper implemented yet
3. **File Uploads**: UI exists but backend processing not implemented
4. **No Caching**: Each query hits the database and OpenAI directly

## Next Steps for Full Implementation

1. **Implement Data Ingestion Script**:
   ```typescript
   // scripts/ingest-docs.ts
   import { FirecrawlApp } from '@mendable/firecrawl-js';
   import { query } from '../src/lib/db/client';
   
   async function ingestWiki() {
     const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });
     const result = await firecrawl.crawlUrl('https://github.com/SoftFever/OrcaSlicer/wiki');
     // Process and store documents...
   }
   ```

2. **Add File Upload Handler**:
   ```typescript
   // api/upload.ts
   export default async function handler(req: VercelRequest, res: VercelResponse) {
     const form = new formidable.IncomingForm();
     const [fields, files] = await form.parse(req);
     // Process uploaded files...
   }
   ```

3. **Implement Vector Search Alternative**:
   - Store embeddings as JSON arrays
   - Compute cosine similarity in application code
   - Or migrate to a database with pgvector support

## Deployment Notes

- The chatbot works in both development and production (Vercel)
- API endpoint: `/api/chat` (Vercel serverless function)
- **Local Development**: To test the chat functionality locally, you must use Vercel CLI:
  ```bash
  vercel dev
  ```
  This will run the Vercel serverless functions locally. Regular `npm run dev` will NOT work for chat API.
- No additional configuration needed for deployment
- Environment variables must be set in Vercel dashboard
- **Build verified**: Successfully builds with `npm run build`
- TypeScript errors resolved with vite-env.d.ts addition

## UI/UX Improvements

The new AnimatedAIChat interface provides:
- **Immersive Experience**: Full-page chat with gradient backgrounds
- **Modern Aesthetics**: Glassmorphism effects and smooth animations
- **Quick Access**: Command shortcuts for common calibration tasks
- **Visual Feedback**: Animated typing indicators and message transitions
- **Dark Theme Optimized**: Designed to work beautifully with the app's dark mode
- **Responsive**: Works seamlessly on desktop, tablet, and mobile devices

## Cost Considerations

With current implementation:
- OpenAI API: ~$0.01-0.03 per conversation
- Vercel Postgres: Included in Vercel Pro plan
- Estimated monthly cost: < $50 for moderate usage

## Troubleshooting

**Q: Chatbot not responding**
- Check OpenAI API key is set correctly
- Verify database connection in logs
- Check browser console for errors

**Q: "pgvector not found" error**
- Use the `setup-database-simple.ts` script instead
- System works without vector search

**Q: How to add knowledge without scraper?**
- Use SQL INSERT statements as shown in admin scenarios
- Or create a simple admin UI for content management

**Q: Build errors on Vercel?**
- Ensure vite-env.d.ts exists in src directory
- Check all TypeScript errors are resolved
- Verify environment variables are set in Vercel dashboard