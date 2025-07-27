import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { Pool } from 'pg';
import { OpenAI } from 'openai';
import { FirecrawlApp } from '@mendable/firecrawl-js';
import crypto from 'crypto';

// Load environment variables FIRST
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '..', '.env.local') });

// Create our own pool instance after env vars are loaded
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

import { EntityExtractor } from '../src/lib/lightrag/entityExtractor';
const entityExtractor = new EntityExtractor();

interface BlogPost {
  title: string;
  content: string;
  url: string;
  metadata: Record<string, any>;
}

async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text.slice(0, 8000), // Limit text length
    });
    
    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    return [];
  }
}

async function processBlogPost(post: BlogPost): Promise<boolean> {
  console.log(`Processing: ${post.title}`);
  
  try {
    // Generate embedding
    const embedding = await generateEmbedding(`${post.title} ${post.content}`);
    
    // Generate content hash
    const contentHash = crypto
      .createHash('sha256')
      .update(post.content)
      .digest('hex');
    
    // Check if document already exists
    const existingResult = await pool.query(
      'SELECT id FROM documents WHERE url = $1 OR doc_hash = $2',
      [post.url, contentHash]
    );
    
    let documentId: number;
    
    if (existingResult.rows.length > 0) {
      // Update existing document
      await pool.query(
        `UPDATE documents 
         SET title = $1, content = $2, source_type = $3, metadata = $4, embedding_json = $5, doc_hash = $6, updated_at = CURRENT_TIMESTAMP
         WHERE id = $7`,
        [
          post.title,
          post.content,
          'blog',
          JSON.stringify(post.metadata),
          JSON.stringify(embedding),
          contentHash,
          existingResult.rows[0].id
        ]
      );
      documentId = existingResult.rows[0].id;
      console.log(`  ✓ Updated existing document: ${documentId}`);
    } else {
      // Insert new document
      const insertResult = await pool.query(
        `INSERT INTO documents (title, content, url, source_type, metadata, embedding_json, doc_hash) 
         VALUES ($1, $2, $3, $4, $5, $6, $7) 
         RETURNING id`,
        [
          post.title,
          post.content,
          post.url,
          'blog',
          JSON.stringify(post.metadata),
          JSON.stringify(embedding),
          contentHash
        ]
      );
      documentId = insertResult.rows[0].id;
      console.log(`  ✓ Document inserted: ${documentId}`);
    }
    
    // Extract entities (limit content to avoid token limits)
    try {
      const contentForExtraction = post.content.slice(0, 3000);
      const entities = await entityExtractor.extractEntities(contentForExtraction);
      console.log(`  ✓ Extracted ${entities.length} entities`);
      
      // Process entities
      for (const entity of entities) {
        try {
          const existingEntityResult = await pool.query(
            `SELECT id FROM kg_entities WHERE name = $1 AND entity_type = $2`,
            [entity.name, entity.type]
          );
          
          if (existingEntityResult.rows.length === 0) {
            const entityEmbedding = await generateEmbedding(
              `${entity.name} ${entity.type} ${entity.description || ''}`
            );
            
            await pool.query(
              `INSERT INTO kg_entities (name, entity_type, description, metadata, embedding_json) 
               VALUES ($1, $2, $3, $4, $5)
               ON CONFLICT (name) DO UPDATE
               SET description = COALESCE(kg_entities.description, $3),
                   metadata = kg_entities.metadata || $4,
                   updated_at = CURRENT_TIMESTAMP`,
              [
                entity.name,
                entity.type,
                entity.description,
                JSON.stringify({ ...entity.metadata, source: 'obico_blog' }),
                JSON.stringify(entityEmbedding)
              ]
            );
            console.log(`    + New entity: ${entity.name} (${entity.type})`);
          }
        } catch (error) {
          console.error(`    ! Error processing entity ${entity.name}:`, error);
        }
      }
    } catch (error) {
      console.error(`  ! Error extracting entities:`, error);
    }
    
    return true;
  } catch (error) {
    console.error(`Error processing blog post ${post.title}:`, error);
    return false;
  }
}

async function scrapeBlogPost(url: string): Promise<BlogPost | null> {
  try {
    const firecrawl = new FirecrawlApp({ 
      apiKey: process.env.FIRECRAWL_API_KEY 
    });
    
    const result = await firecrawl.scrapeUrl(url, {
      pageOptions: { 
        onlyMainContent: true,
        includeHtml: false,
        screenshot: false
      }
    });
    
    if (!result || !result.markdown) {
      console.error(`Failed to scrape ${url}`);
      return null;
    }
    
    // Extract title from markdown or metadata
    let title = result.metadata?.title || 'Untitled';
    const titleMatch = result.markdown.match(/^#\s+(.+)$/m);
    if (titleMatch) {
      title = titleMatch[1].trim();
    }
    
    // Extract metadata
    const metadata: Record<string, any> = {
      ...result.metadata,
      source: 'obico_blog',
      scrapedAt: new Date().toISOString(),
    };
    
    // Try to extract date from URL or content
    const dateMatch = url.match(/(\d{4})\/(\d{2})\/(\d{2})/);
    if (dateMatch) {
      metadata.publishDate = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
    }
    
    // Extract author if present
    const authorMatch = result.markdown.match(/[Bb]y\s+([A-Za-z\s]+?)(?:\s*\||\s*-|\s*$)/m);
    if (authorMatch) {
      metadata.author = authorMatch[1].trim();
    }
    
    return {
      title,
      content: result.markdown,
      url,
      metadata
    };
  } catch (error) {
    console.error(`Error scraping ${url}:`, error);
    return null;
  }
}

async function discoverBlogPosts(): Promise<string[]> {
  console.log('🔍 Discovering Obico blog posts...\n');
  
  try {
    const firecrawl = new FirecrawlApp({ 
      apiKey: process.env.FIRECRAWL_API_KEY 
    });
    
    // First, map the blog to discover all URLs
    const mapResult = await firecrawl.mapUrl('https://www.obico.io/blog/', {
      includeSubdomains: false,
      limit: 500
    });
    
    if (!mapResult || !mapResult.links) {
      console.error('Failed to map blog URLs');
      return [];
    }
    
    // Filter for blog post URLs (exclude category pages, tags, etc.)
    const blogPostUrls = mapResult.links.filter(url => {
      // Match patterns like /blog/2024/01/15/post-title/ or /blog/post-title/
      const isBlogPost = url.match(/\/blog\/(?:\d{4}\/\d{2}\/\d{2}\/)?[^\/]+\/?$/);
      const isNotCategory = !url.includes('/category/') && !url.includes('/tag/') && !url.includes('/page/');
      return isBlogPost && isNotCategory;
    });
    
    console.log(`Found ${blogPostUrls.length} blog posts\n`);
    return blogPostUrls;
  } catch (error) {
    console.error('Error discovering blog posts:', error);
    return [];
  }
}

async function main() {
  console.log('🚀 Starting Obico Blog Ingestion');
  console.log('='.repeat(50));
  
  // Check required environment variables
  if (!process.env.FIRECRAWL_API_KEY) {
    console.error('❌ FIRECRAWL_API_KEY not found in environment variables');
    console.log('Please add FIRECRAWL_API_KEY to your .env.local file');
    console.log('Get your API key from: https://www.firecrawl.dev/');
    process.exit(1);
  }
  
  try {
    // Discover all blog post URLs
    const blogUrls = await discoverBlogPosts();
    
    if (blogUrls.length === 0) {
      console.log('No blog posts found. Trying alternative approach...');
      
      // Alternative: scrape the blog index page and extract links
      const firecrawl = new FirecrawlApp({ 
        apiKey: process.env.FIRECRAWL_API_KEY 
      });
      
      const blogIndex = await firecrawl.scrapeUrl('https://www.obico.io/blog/', {
        pageOptions: { 
          onlyMainContent: true,
          includeHtml: true
        }
      });
      
      if (blogIndex && blogIndex.html) {
        // Extract blog post links from HTML
        const linkMatches = blogIndex.html.matchAll(/href="(\/blog\/[^"]+)"/g);
        const links = Array.from(linkMatches).map(match => `https://www.obico.io${match[1]}`);
        blogUrls.push(...new Set(links)); // Remove duplicates
        console.log(`Found ${blogUrls.length} blog posts from index page\n`);
      }
    }
    
    // Process each blog post
    let processed = 0;
    let failed = 0;
    
    for (const url of blogUrls) {
      console.log(`\n📄 Scraping: ${url}`);
      
      const blogPost = await scrapeBlogPost(url);
      
      if (blogPost) {
        const success = await processBlogPost(blogPost);
        if (success) {
          processed++;
        } else {
          failed++;
        }
      } else {
        failed++;
      }
      
      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Summary statistics
    const docCountResult = await pool.query('SELECT COUNT(*) FROM documents WHERE source_type = \'blog\'');
    const entityCountResult = await pool.query('SELECT COUNT(*) FROM kg_entities');
    
    console.log('\n📊 Final Statistics:');
    console.log(`   Blog posts processed: ${processed}`);
    console.log(`   Blog posts failed: ${failed}`);
    console.log(`   Total blog documents in DB: ${docCountResult.rows[0].count}`);
    console.log(`   Total entities in DB: ${entityCountResult.rows[0].count}`);
    
    console.log('\n✅ Obico blog ingestion complete!');
    
    // Create ingestion record
    const ingestionInfo = {
      date: new Date().toISOString(),
      source: 'obico_blog',
      documentsProcessed: processed,
      documentsFailed: failed,
      totalBlogDocs: docCountResult.rows[0].count,
      urls: blogUrls
    };
    
    await pool.query(
      `INSERT INTO documents (title, content, url, source_type, metadata) 
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (url) DO UPDATE
       SET metadata = documents.metadata || $5,
           updated_at = CURRENT_TIMESTAMP`,
      [
        'Obico Blog Ingestion Log',
        JSON.stringify(ingestionInfo, null, 2),
        'internal://obico-blog-ingestion-log',
        'system',
        JSON.stringify(ingestionInfo)
      ]
    );
    
    console.log('📝 Ingestion log saved to database');
    
  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    // Close pool connection
    await pool.end();
  }
}

// Run the ingestion
main().catch(async (error) => {
  console.error('Fatal error:', error);
  await pool.end();
  process.exit(1);
});