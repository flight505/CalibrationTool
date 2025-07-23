import 'dotenv/config';
import { Client } from 'pg';
import { v4 as uuidv4 } from 'uuid';

async function testChatAPI() {
  console.log('🧪 Testing Chat API Database Operations\n');
  
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  
  if (!connectionString) {
    console.error('❌ No database connection string found');
    process.exit(1);
  }
  
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('✅ Connected to database\n');
    
    // Test 1: Check if tables exist
    console.log('📋 Test 1: Checking database schema...');
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('chat_sessions', 'chat_messages')
      ORDER BY table_name
    `);
    
    console.log('Tables found:', tables.rows.map(r => r.table_name).join(', '));
    
    if (tables.rows.length !== 2) {
      console.error('❌ Missing tables! Run npm run setup-db first');
      process.exit(1);
    }
    console.log('✅ Schema is correct\n');
    
    // Test 2: Create a test session
    console.log('📋 Test 2: Creating test session...');
    const testSessionId = uuidv4();
    
    try {
      const sessionResult = await client.query(
        `INSERT INTO chat_sessions (id, metadata) 
         VALUES ($1, $2::jsonb) 
         ON CONFLICT (id) DO UPDATE 
         SET updated_at = CURRENT_TIMESTAMP
         RETURNING id, created_at`,
        [testSessionId, JSON.stringify({ test: true })]
      );
      
      console.log('✅ Session created:', sessionResult.rows[0]);
    } catch (error: any) {
      console.error('❌ Failed to create session:', error.message);
      throw error;
    }
    
    // Test 3: Insert a test message
    console.log('\n📋 Test 3: Inserting test message...');
    try {
      const messageResult = await client.query(
        `INSERT INTO chat_messages (session_id, role, content) 
         VALUES ($1, $2, $3) 
         RETURNING id, created_at`,
        [testSessionId, 'user', 'Test message']
      );
      
      console.log('✅ Message inserted:', messageResult.rows[0]);
    } catch (error: any) {
      console.error('❌ Failed to insert message:', error.message);
      throw error;
    }
    
    // Test 4: Test with non-existent session (should fail)
    console.log('\n📋 Test 4: Testing foreign key constraint...');
    const fakeSessionId = uuidv4();
    
    try {
      await client.query(
        `INSERT INTO chat_messages (session_id, role, content) 
         VALUES ($1, $2, $3)`,
        [fakeSessionId, 'user', 'This should fail']
      );
      console.error('❌ Foreign key constraint not working!');
    } catch (error: any) {
      if (error.code === '23503') {
        console.log('✅ Foreign key constraint working correctly');
        console.log('   Error:', error.detail);
      } else {
        throw error;
      }
    }
    
    // Test 5: Transaction test
    console.log('\n📋 Test 5: Testing transaction handling...');
    await client.query('BEGIN');
    
    try {
      const txSessionId = uuidv4();
      
      // Create session
      await client.query(
        `INSERT INTO chat_sessions (id) VALUES ($1)`,
        [txSessionId]
      );
      
      // Insert message
      await client.query(
        `INSERT INTO chat_messages (session_id, role, content) 
         VALUES ($1, $2, $3)`,
        [txSessionId, 'user', 'Transaction test']
      );
      
      // Check counts before commit
      const countBefore = await client.query(
        `SELECT COUNT(*) FROM chat_messages WHERE session_id = $1`,
        [txSessionId]
      );
      
      await client.query('COMMIT');
      console.log('✅ Transaction committed successfully');
      console.log('   Messages in transaction:', countBefore.rows[0].count);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Transaction failed:', error);
      throw error;
    }
    
    // Test 6: Check session/message relationship
    console.log('\n📋 Test 6: Checking session/message relationships...');
    const stats = await client.query(`
      SELECT 
        s.id as session_id,
        COUNT(m.id) as message_count,
        MAX(m.created_at) as last_message_at
      FROM chat_sessions s
      LEFT JOIN chat_messages m ON s.id = m.session_id
      WHERE s.created_at > NOW() - INTERVAL '1 hour'
      GROUP BY s.id
      ORDER BY s.created_at DESC
      LIMIT 5
    `);
    
    console.log('Recent sessions:');
    stats.rows.forEach(row => {
      console.log(`  Session ${row.session_id.substring(0, 8)}... has ${row.message_count} messages`);
    });
    
    console.log('\n✅ All tests passed!\n');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run the tests
testChatAPI().catch(console.error);