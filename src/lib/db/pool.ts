import { Pool } from 'pg';

// Create a singleton pool instance
let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    
    if (!connectionString) {
      throw new Error('Database connection string not found');
    }

    // Log connection details (without password)
    const url = new URL(connectionString);
    const isPrismaAccelerate = url.hostname.includes('prisma.io') || connectionString.includes('accelerate.prisma');
    
    console.log('Database connection:', {
      host: url.hostname,
      port: url.port || '5432',
      database: url.pathname.slice(1),
      ssl: url.searchParams.get('sslmode'),
      isPrismaAccelerate,
    });
    
    // Warn about Prisma Accelerate
    if (isPrismaAccelerate) {
      console.warn('⚠️ Prisma Accelerate detected. This requires Prisma Client, not raw pg library.');
      console.warn('Consider switching to a standard PostgreSQL provider like:');
      console.warn('- Vercel Postgres (Neon): https://vercel.com/postgres');
      console.warn('- Supabase: https://supabase.com');
      console.warn('- Railway: https://railway.app');
    }

    // Parse connection string to add pgbouncer support if needed
    let poolConfig: any = {
      connectionString,
      max: 3, // Further reduced for serverless
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 15000, // Increased for cold starts
      statement_timeout: 25000,
      query_timeout: 25000,
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
    };

    // SSL configuration for various providers
    if (connectionString.includes('neon.tech') || 
        connectionString.includes('supabase') || 
        connectionString.includes('prisma.io') ||
        connectionString.includes('sslmode=require')) {
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