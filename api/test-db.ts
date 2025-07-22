import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const tests = [];
  
  // Test 1: Environment variables
  tests.push({
    test: 'Environment Variables',
    DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'Not set',
    POSTGRES_URL: process.env.POSTGRES_URL ? 'Set' : 'Not set',
    NODE_ENV: process.env.NODE_ENV,
    VERCEL_ENV: process.env.VERCEL_ENV,
  });
  
  // Test 2: Parse connection string
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (connectionString) {
    try {
      const url = new URL(connectionString);
      tests.push({
        test: 'Connection String Parse',
        host: url.hostname,
        port: url.port || '5432',
        database: url.pathname.slice(1),
        ssl: url.searchParams.get('sslmode'),
        pgbouncer: url.searchParams.get('pgbouncer'),
        isPrismaAccelerate: url.hostname.includes('prisma.io'),
      });
    } catch (error: any) {
      tests.push({
        test: 'Connection String Parse',
        error: error.message,
      });
    }
  }
  
  // Test 3: Different connection configurations
  if (connectionString) {
    const configs = [
      { name: 'Basic', options: {} },
      { name: 'SSL Disabled', options: { ssl: false } },
      { name: 'SSL Required', options: { ssl: { rejectUnauthorized: false } } },
      { name: 'SSL True', options: { ssl: true } },
      { name: 'Minimal Pool', options: { 
        ssl: { rejectUnauthorized: false },
        max: 1,
        idleTimeoutMillis: 1000,
        connectionTimeoutMillis: 20000,
      }},
    ];
    
    for (const config of configs) {
      const pool = new Pool({
        connectionString,
        ...config.options,
      });
      
      const testResult: any = {
        test: `Connection Test: ${config.name}`,
        config: config.options,
      };
      
      try {
        const client = await pool.connect();
        const result = await client.query('SELECT 1 as test');
        testResult.success = true;
        testResult.result = result.rows[0];
        client.release();
      } catch (error: any) {
        testResult.success = false;
        testResult.error = error.message;
        testResult.code = error.code;
        testResult.detail = error.detail;
      } finally {
        await pool.end();
      }
      
      tests.push(testResult);
      
      // If one succeeds, we found the working config
      if (testResult.success) {
        tests.push({
          test: 'Recommended Configuration',
          config: config.options,
          note: 'Use this configuration in your pool setup',
        });
        break;
      }
    }
  }
  
  return res.status(200).json({
    timestamp: new Date().toISOString(),
    tests,
  });
}