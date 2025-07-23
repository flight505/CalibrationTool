#!/usr/bin/env node
import 'dotenv/config';
import { Client } from 'pg';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function resetSessions() {
  console.log('🔄 Resetting chat sessions...\n');
  
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  
  if (!connectionString) {
    console.error('❌ No database connection string found');
    process.exit(1);
  }
  
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    
    // Get current counts
    const beforeStats = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM chat_sessions) as session_count,
        (SELECT COUNT(*) FROM chat_messages) as message_count
    `);
    
    console.log('Current state:');
    console.log(`  Sessions: ${beforeStats.rows[0].session_count}`);
    console.log(`  Messages: ${beforeStats.rows[0].message_count}`);
    
    // Ask for confirmation
    console.log('\n⚠️  This will delete ALL chat sessions and messages!');
    console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Delete all messages first (due to foreign key)
    console.log('Deleting messages...');
    await client.query('TRUNCATE TABLE chat_messages CASCADE');
    
    // Delete all sessions
    console.log('Deleting sessions...');
    await client.query('TRUNCATE TABLE chat_sessions CASCADE');
    
    // Verify deletion
    const afterStats = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM chat_sessions) as session_count,
        (SELECT COUNT(*) FROM chat_messages) as message_count
    `);
    
    console.log('\n✅ Reset complete!');
    console.log('Final state:');
    console.log(`  Sessions: ${afterStats.rows[0].session_count}`);
    console.log(`  Messages: ${afterStats.rows[0].message_count}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run the reset
resetSessions().catch(console.error);