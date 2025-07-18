#!/usr/bin/env node
import { Client } from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env.local') });

async function setupDatabase() {
  console.log('🚀 Setting up database for OrcaSlicer Chatbot...\n');

  // Use the DATABASE_URL or POSTGRES_URL
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  
  if (!connectionString) {
    console.error('❌ No database connection string found in environment variables');
    process.exit(1);
  }

  // Create a client connection
  const client = new Client({
    connectionString: connectionString,
  });

  try {
    await client.connect();
    console.log('📡 Testing database connection...');
    const testResult = await client.query('SELECT 1 as test');
    console.log('✅ Database connection successful!\n');

    // Create tables
    console.log('📊 Creating database tables...\n');

    // Documents table for RAG (without vector column for now)
    console.log('  Creating documents table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        url TEXT,
        source_type VARCHAR(50),
        embedding_json TEXT, -- Store embeddings as JSON text for now
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('  ✓ Documents table created');

    // Chat sessions table
    console.log('  Creating chat_sessions table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS chat_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        metadata JSONB DEFAULT '{}'
      )
    `);
    console.log('  ✓ Chat sessions table created');

    // Chat messages table
    console.log('  Creating chat_messages table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id SERIAL PRIMARY KEY,
        session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
        role VARCHAR(20) NOT NULL,
        content TEXT NOT NULL,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('  ✓ Chat messages table created');

    // File uploads table
    console.log('  Creating file_uploads table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS file_uploads (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
        filename TEXT NOT NULL,
        mime_type VARCHAR(100),
        size_bytes INTEGER,
        storage_url TEXT,
        content_extracted TEXT,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('  ✓ File uploads table created');

    // Knowledge graph entities (without vector column)
    console.log('  Creating kg_entities table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS kg_entities (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        entity_type VARCHAR(100),
        description TEXT,
        embedding_json TEXT, -- Store embeddings as JSON text
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('  ✓ Knowledge graph entities table created');

    // Knowledge graph relationships
    console.log('  Creating kg_relationships table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS kg_relationships (
        id SERIAL PRIMARY KEY,
        source_entity_id INTEGER REFERENCES kg_entities(id) ON DELETE CASCADE,
        target_entity_id INTEGER REFERENCES kg_entities(id) ON DELETE CASCADE,
        relationship_type VARCHAR(100),
        weight FLOAT DEFAULT 1.0,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(source_entity_id, target_entity_id, relationship_type)
      )
    `);
    console.log('  ✓ Knowledge graph relationships table created\n');

    // Create indexes
    console.log('🔍 Creating indexes for performance...\n');

    // Text search indexes (since we don't have pgvector)
    console.log('  Creating text search indexes...');
    await client.query(`CREATE INDEX IF NOT EXISTS idx_documents_title_content ON documents USING gin(to_tsvector('english', title || ' ' || content))`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_kg_entities_name_desc ON kg_entities USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')))`);
    console.log('  ✓ Text search indexes created');

    // Other indexes
    console.log('  Creating additional indexes...');
    await client.query(`CREATE INDEX IF NOT EXISTS idx_documents_source ON documents(source_type)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_messages_session ON chat_messages(session_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_uploads_session ON file_uploads(session_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_kg_relationships_source ON kg_relationships(source_entity_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_kg_relationships_target ON kg_relationships(target_entity_id)`);
    console.log('  ✓ Additional indexes created\n');

    console.log('🎉 Database setup complete!\n');
    console.log('Note: This database is configured without pgvector.');
    console.log('      Vector similarity search will be handled in application code.\n');
    console.log('Next steps:');
    console.log('1. The chatbot is ready to use');
    console.log('2. Start the development server: npm run dev');
    console.log('3. Access the chatbot via the button in the header\n');

  } catch (error) {
    console.error('❌ Error setting up database:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run the setup
setupDatabase()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });