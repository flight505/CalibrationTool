import { VercelRequest, VercelResponse } from '@vercel/node';
import { Client } from 'pg';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const debug = {
    method: req.method,
    hasOpenAIKey: !!process.env.OPENAI_API_KEY,
    openAIKeyLength: process.env.OPENAI_API_KEY?.length || 0,
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    hasPostgresUrl: !!process.env.POSTGRES_URL,
    dbTest: false,
    dbError: null as any,
    documentCount: 0,
    timestamp: new Date().toISOString(),
  };

  // Test database connection
  if (process.env.DATABASE_URL || process.env.POSTGRES_URL) {
    const client = new Client({
      connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
    });

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
      };
    }
  }

  res.status(200).json(debug);
}