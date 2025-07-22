import { Pool } from 'pg';

// Create a singleton pool instance
let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    
    if (!connectionString) {
      throw new Error('Database connection string not found');
    }

    // Parse connection string to add pgbouncer support if needed
    let poolConfig: any = {
      connectionString,
      max: 5, // Reduced for serverless
      idleTimeoutMillis: 10000, // Reduced for serverless
      connectionTimeoutMillis: 10000, // Increased for cold starts
      statement_timeout: 25000,
      query_timeout: 25000,
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
    };

    // If using Vercel Postgres, it might need special SSL config
    if (process.env.POSTGRES_URL && process.env.POSTGRES_URL.includes('neon.tech')) {
      poolConfig.ssl = { rejectUnauthorized: false };
    }
    
    // Add pgbouncer support
    if (connectionString.includes('pgbouncer=true')) {
      poolConfig.allowExitOnIdle = true;
    }

    pool = new Pool(poolConfig);

    // Handle pool errors
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
  }

  return pool;
}

// Helper function to get a client from the pool
export async function withClient<T>(
  callback: (client: any) => Promise<T>
): Promise<T> {
  const pool = getPool();
  const client = await pool.connect();
  
  try {
    return await callback(client);
  } finally {
    client.release();
  }
}

// Graceful shutdown
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}