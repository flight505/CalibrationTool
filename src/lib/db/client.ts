import { Pool } from 'pg';

// Create a connection pool for better performance
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Export pool for direct queries
export { pool };

// Helper function to get a client from the pool
export async function getClient() {
  return await pool.connect();
}

// Helper function to execute a query
export async function query(text: string, params?: any[]) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  
  if (process.env.NODE_ENV === 'development') {
    console.log('Executed query', { text, duration, rows: res.rowCount });
  }
  
  return res;
}

// Clean up on app termination
process.on('SIGINT', async () => {
  await pool.end();
  process.exit(0);
});