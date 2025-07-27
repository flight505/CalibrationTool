import type { VercelRequest, VercelResponse } from '@vercel/node';
import { OpenAI } from 'openai';
import { Pool } from 'pg';

// Initialize clients
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
});

// Type definitions
interface SearchResult {
  id: number;
  title: string;
  content: string;
  url: string;
  source_type: string;
  score: number;
  metadata?: Record<string, any>;
}

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// Generate embedding for search
async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text.slice(0, 8000),
  });
  
  return response.data[0].embedding;
}

// Hybrid search combining vector similarity and text search
async function hybridSearch(query: string, limit: number = 5): Promise<SearchResult[]> {
  const embedding = await generateEmbedding(query);
  
  // Combined query using both vector similarity and text search
  const searchQuery = `
    WITH vector_search AS (
      SELECT 
        id,
        title,
        content,
        url,
        source_type,
        metadata,
        1 - (embedding_json::vector <=> $1::vector) as vector_score
      FROM documents
      WHERE embedding_json IS NOT NULL
      ORDER BY embedding_json::vector <=> $1::vector
      LIMIT $2
    ),
    text_search AS (
      SELECT 
        id,
        title,
        content,
        url,
        source_type,
        metadata,
        ts_rank_cd(to_tsvector('english', title || ' ' || content), plainto_tsquery('english', $3)) as text_score
      FROM documents
      WHERE to_tsvector('english', title || ' ' || content) @@ plainto_tsquery('english', $3)
      ORDER BY text_score DESC
      LIMIT $2
    ),
    combined AS (
      SELECT 
        COALESCE(v.id, t.id) as id,
        COALESCE(v.title, t.title) as title,
        COALESCE(v.content, t.content) as content,
        COALESCE(v.url, t.url) as url,
        COALESCE(v.source_type, t.source_type) as source_type,
        COALESCE(v.metadata, t.metadata) as metadata,
        COALESCE(v.vector_score, 0) * 0.7 + COALESCE(t.text_score, 0) * 0.3 as combined_score
      FROM vector_search v
      FULL OUTER JOIN text_search t ON v.id = t.id
    )
    SELECT * FROM combined
    ORDER BY combined_score DESC
    LIMIT $2
  `;
  
  const result = await pool.query(searchQuery, [
    JSON.stringify(embedding),
    limit,
    query
  ]);
  
  return result.rows.map(row => ({
    ...row,
    score: row.combined_score
  }));
}

// Format sources for display
function formatSources(sources: SearchResult[]): string {
  if (sources.length === 0) return '';
  
  const sourceList = sources
    .slice(0, 3) // Top 3 sources
    .map((source, index) => {
      const sourceType = source.source_type === 'wiki' ? '📖 Wiki' : 
                        source.source_type === 'blog' ? '📝 Blog' :
                        source.source_type === 'calibration' ? '🔧 Guide' : '📄 Doc';
      
      const url = source.url?.startsWith('http') ? source.url : 
                 source.url?.startsWith('file://') ? 
                 `https://github.com/SoftFever/OrcaSlicer/wiki/${source.url.replace('file://', '')}` : 
                 null;
      
      return `${index + 1}. ${sourceType}: **${source.title}**${url ? ` - [View Source](${url})` : ''}`;
    })
    .join('\n');
  
  return `\n\n---\n📚 **Sources:**\n${sourceList}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages } = req.body as { messages: ChatMessage[] };
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid request format' });
    }
    
    // Get the last user message
    const lastUserMessage = messages[messages.length - 1];
    if (!lastUserMessage || lastUserMessage.role !== 'user') {
      return res.status(400).json({ error: 'No user message found' });
    }
    
    // Search for relevant context
    const searchResults = await hybridSearch(lastUserMessage.content, 5);
    
    // Build context from search results
    const context = searchResults
      .map(result => `## ${result.title}\n${result.content.slice(0, 500)}...`)
      .join('\n\n');
    
    // Create system prompt with context
    const systemPrompt = `You are an expert assistant for OrcaSlicer, a 3D printing slicer software.
You provide accurate, helpful information about calibration, settings, and troubleshooting.

Use the following context to answer questions:
${context}

Important guidelines:
- Be specific and reference exact settings when possible
- Provide step-by-step instructions for procedures
- Mention relevant calibration tests when appropriate
- If the context doesn't contain enough information, acknowledge this
- Always maintain a helpful and professional tone`;
    
    // Get response from OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      temperature: 0.3,
      max_tokens: 2000,
      stream: true,
    });
    
    // Set up SSE headers for streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    // Stream the response
    let fullResponse = '';
    
    for await (const chunk of completion) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        fullResponse += content;
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }
    
    // Add sources at the end
    const sourcesText = formatSources(searchResults);
    res.write(`data: ${JSON.stringify({ content: sourcesText })}\n\n`);
    
    // Send done signal
    res.write(`data: [DONE]\n\n`);
    
    // Log for analytics (optional)
    try {
      await pool.query(
        `INSERT INTO chat_messages (session_id, role, content, metadata) 
         VALUES (gen_random_uuid(), $1, $2, $3)`,
        [
          'user',
          lastUserMessage.content,
          JSON.stringify({
            sources: searchResults.map(s => ({ title: s.title, url: s.url, score: s.score })),
            timestamp: new Date().toISOString()
          })
        ]
      );
    } catch (error) {
      console.error('Failed to log message:', error);
    }
    
    res.end();
  } catch (error) {
    console.error('Chat API error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}