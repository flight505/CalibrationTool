import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { Client } from 'pg';

// Load environment variables FIRST
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '..', '.env.local') });

async function testConnection() {
  console.log('Testing database connection...');
  console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
  console.log('POSTGRES_URL exists:', !!process.env.POSTGRES_URL);
  
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  
  if (!connectionString) {
    console.error('❌ No database connection string found');
    return;
  }
  
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('✅ Connected to database!');
    
    const result = await client.query('SELECT COUNT(*) FROM documents');
    console.log('Documents count:', result.rows[0].count);
    
    const entityResult = await client.query('SELECT COUNT(*) FROM kg_entities');
    console.log('Entities count:', entityResult.rows[0].count);
    
  } catch (error) {
    console.error('❌ Connection failed:', error);
  } finally {
    await client.end();
  }
}

testConnection();