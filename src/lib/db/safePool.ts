import { getPool, withClient as originalWithClient } from './pool';

/**
 * Safe wrapper for database operations with fallback behavior
 */
export async function safeWithClient<T>(
  callback: (client: any) => Promise<T>,
  fallback?: T
): Promise<T | undefined> {
  try {
    return await originalWithClient(callback);
  } catch (error: any) {
    console.error('Database operation failed:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
    });
    
    // Return fallback value if provided
    if (fallback !== undefined) {
      return fallback;
    }
    
    // Otherwise throw the error
    throw error;
  }
}

/**
 * Check if database is available
 */
export async function isDatabaseAvailable(): Promise<boolean> {
  try {
    const pool = getPool();
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    return true;
  } catch (error) {
    console.error('Database availability check failed:', error);
    return false;
  }
}

/**
 * Get database status information
 */
export async function getDatabaseStatus(): Promise<{
  available: boolean;
  error?: string;
  connectionString?: string;
}> {
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  
  if (!connectionString) {
    return {
      available: false,
      error: 'No database connection string configured',
    };
  }
  
  try {
    const url = new URL(connectionString);
    const isAvailable = await isDatabaseAvailable();
    
    return {
      available: isAvailable,
      connectionString: `${url.protocol}//${url.hostname}:${url.port || '5432'}${url.pathname}`,
    };
  } catch (error: any) {
    return {
      available: false,
      error: error.message,
    };
  }
}