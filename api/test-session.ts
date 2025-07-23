import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const tests = [];
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  
  if (!connectionString) {
    return res.status(500).json({ error: 'No database connection configured' });
  }
  
  const pool = new Pool({
    connectionString,
    ssl: connectionString.includes('require') ? { rejectUnauthorized: false } : undefined,
    max: 1,
    connectionTimeoutMillis: 10000,
  });
  
  try {
    // Test 1: Check table existence
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('chat_sessions', 'chat_messages')
      ORDER BY table_name
    `);
    
    tests.push({
      test: 'Table Existence',
      success: tablesResult.rows.length === 2,
      tables: tablesResult.rows.map(r => r.table_name),
    });
    
    // Test 2: Create test session
    const testSessionId = uuidv4();
    try {
      await pool.query(
        `INSERT INTO chat_sessions (id, metadata) 
         VALUES ($1, $2::jsonb) 
         ON CONFLICT (id) DO NOTHING`,
        [testSessionId, JSON.stringify({ test: true, timestamp: new Date().toISOString() })]
      );
      
      tests.push({
        test: 'Session Creation',
        success: true,
        sessionId: testSessionId,
      });
      
      // Test 3: Insert test message
      try {
        await pool.query(
          `INSERT INTO chat_messages (session_id, role, content) 
           VALUES ($1, $2, $3)`,
          [testSessionId, 'user', 'Test message from API endpoint']
        );
        
        tests.push({
          test: 'Message Insertion',
          success: true,
          message: 'Successfully inserted message with valid session',
        });
      } catch (msgError: any) {
        tests.push({
          test: 'Message Insertion',
          success: false,
          error: msgError.message,
          code: msgError.code,
        });
      }
      
    } catch (sessionError: any) {
      tests.push({
        test: 'Session Creation',
        success: false,
        error: sessionError.message,
        code: sessionError.code,
      });
    }
    
    // Test 4: Check foreign key constraint
    const fakeSessionId = uuidv4();
    try {
      await pool.query(
        `INSERT INTO chat_messages (session_id, role, content) 
         VALUES ($1, $2, $3)`,
        [fakeSessionId, 'user', 'This should fail']
      );
      
      tests.push({
        test: 'Foreign Key Constraint',
        success: false,
        error: 'Constraint not enforced - message inserted with non-existent session!',
      });
    } catch (fkError: any) {
      tests.push({
        test: 'Foreign Key Constraint',
        success: fkError.code === '23503',
        message: 'Foreign key constraint working correctly',
        errorCode: fkError.code,
      });
    }
    
    // Test 5: Session statistics
    const statsResult = await pool.query(`
      SELECT 
        COUNT(DISTINCT s.id) as session_count,
        COUNT(m.id) as message_count,
        MAX(s.created_at) as newest_session,
        MAX(m.created_at) as newest_message
      FROM chat_sessions s
      LEFT JOIN chat_messages m ON s.id = m.session_id
      WHERE s.created_at > NOW() - INTERVAL '24 hours'
    `);
    
    tests.push({
      test: 'Session Statistics (24h)',
      success: true,
      stats: statsResult.rows[0],
    });
    
    // Test 6: Sample of recent sessions
    const recentSessions = await pool.query(`
      SELECT 
        s.id,
        s.created_at,
        COUNT(m.id) as message_count
      FROM chat_sessions s
      LEFT JOIN chat_messages m ON s.id = m.session_id
      GROUP BY s.id
      ORDER BY s.created_at DESC
      LIMIT 5
    `);
    
    tests.push({
      test: 'Recent Sessions',
      success: true,
      sessions: recentSessions.rows.map(r => ({
        id: r.id.substring(0, 8) + '...',
        created: r.created_at,
        messages: parseInt(r.message_count),
      })),
    });
    
  } catch (error: any) {
    tests.push({
      test: 'General Error',
      success: false,
      error: error.message,
      code: error.code,
    });
  } finally {
    await pool.end();
  }
  
  // Summary
  const allPassed = tests.every(t => t.success !== false);
  
  return res.status(200).json({
    timestamp: new Date().toISOString(),
    allTestsPassed: allPassed,
    tests,
    recommendation: allPassed 
      ? 'All tests passed - chat API should work correctly' 
      : 'Some tests failed - check individual test results',
  });
}