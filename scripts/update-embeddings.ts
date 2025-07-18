import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables FIRST
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '..', '.env.local') });

import { Pool } from 'pg';
import { OpenAI } from 'openai';

// Initialize after env vars are loaded
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

async function updateDocumentEmbeddings() {
  console.log('📄 Updating document embeddings...');
  
  // Find documents without embeddings
  const result = await pool.query(`
    SELECT id, title, content
    FROM documents
    WHERE embedding_json IS NULL OR embedding_json = '[]'
  `);
  
  console.log(`Found ${result.rows.length} documents without embeddings`);
  
  for (const doc of result.rows) {
    try {
      const text = `${doc.title} ${doc.content}`.slice(0, 8000);
      const embedding = await generateEmbedding(text);
      
      if (embedding.length > 0) {
        await pool.query(
          `UPDATE documents SET embedding_json = $1 WHERE id = $2`,
          [JSON.stringify(embedding), doc.id]
        );
        
        console.log(`  ✓ Updated: ${doc.title}`);
      }
    } catch (error) {
      console.error(`  ✗ Failed: ${doc.title}`, error);
    }
  }
}

async function updateEntityEmbeddings() {
  console.log('\n🔧 Updating entity embeddings...');
  
  // Find entities without embeddings
  const result = await pool.query(`
    SELECT id, name, entity_type, description
    FROM kg_entities
    WHERE embedding_json IS NULL OR embedding_json = '[]'
  `);
  
  console.log(`Found ${result.rows.length} entities without embeddings`);
  
  for (const entity of result.rows) {
    try {
      const text = `${entity.name} ${entity.entity_type} ${entity.description || ''}`;
      const embedding = await generateEmbedding(text);
      
      if (embedding.length > 0) {
        await pool.query(
          `UPDATE kg_entities SET embedding_json = $1 WHERE id = $2`,
          [JSON.stringify(embedding), entity.id]
        );
        
        console.log(`  ✓ Updated: ${entity.name} (${entity.entity_type})`);
      }
    } catch (error) {
      console.error(`  ✗ Failed: ${entity.name}`, error);
    }
  }
}

async function main() {
  console.log('🚀 Starting embedding updates...\n');
  
  try {
    await updateDocumentEmbeddings();
    await updateEntityEmbeddings();
    
    // Show final statistics
    const docResult = await pool.query(
      `SELECT COUNT(*) as total,
              COUNT(CASE WHEN embedding_json IS NOT NULL AND embedding_json != '[]' THEN 1 END) as with_embeddings
       FROM documents`
    );
    
    const entityResult = await pool.query(
      `SELECT COUNT(*) as total,
              COUNT(CASE WHEN embedding_json IS NOT NULL AND embedding_json != '[]' THEN 1 END) as with_embeddings
       FROM kg_entities`
    );
    
    console.log('\n📊 Final Statistics:');
    console.log(`   Documents: ${docResult.rows[0].with_embeddings}/${docResult.rows[0].total} have embeddings`);
    console.log(`   Entities: ${entityResult.rows[0].with_embeddings}/${entityResult.rows[0].total} have embeddings`);
    
  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    await pool.end();
  }
}

main();