import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Client } from 'pg';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const debug = {
    method: req.method,
    hasOpenAIKey: !!process.env.OPENAI_API_KEY,
    openAIKeyLength: process.env.OPENAI_API_KEY?.length || 0,
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    hasPostgresUrl: !!process.env.POSTGRES_URL,
    dbUrl: process.env.DATABASE_URL ? 'Set (hidden)' : 'Not set',
    postgresUrl: process.env.POSTGRES_URL ? 'Set (hidden)' : 'Not set',
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
    dbTest: false,
    dbError: null as any,
    documentCount: 0,
    timestamp: new Date().toISOString(),
  };

  // Test database connection
  if (process.env.DATABASE_URL || process.env.POSTGRES_URL) {
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    let clientConfig: any = {
      connectionString,
    };
    
    // Add SSL config for production databases
    if (connectionString.includes('neon.tech') || connectionString.includes('supabase') || connectionString.includes('prisma.io')) {
      clientConfig.ssl = { rejectUnauthorized: false };
    }
    
    const client = new Client(clientConfig);

    try {
      await client.connect();
      const result = await client.query('SELECT COUNT(*) FROM documents');
      debug.dbTest = true;
      debug.documentCount = parseInt(result.rows[0].count);
      await client.end();
    } catch (error: any) {
      debug.dbError = {
        message: error.message,
        code: error.code,
        detail: error.detail,
        hint: error.hint,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      };
    }
  }

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  return res.status(200).json(debug);
}