import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { Pool } from 'pg';
import { OpenAI } from 'openai';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { execSync } from 'child_process';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '..', '.env.local') });

// Create pool instance
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

import { EntityExtractor } from '../src/lib/lightrag/entityExtractor';
const entityExtractor = new EntityExtractor();

interface WikiFile {
  path: string;
  content: string;
  hash: string;
  lastModified: Date;
}

interface SyncResult {
  added: number;
  updated: number;
  deleted: number;
  unchanged: number;
}

async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text.slice(0, 8000),
    });
    
    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    return [];
  }
}

async function getFileHash(content: string): Promise<string> {
  return crypto.createHash('sha256').update(content).digest('hex');
}

async function getStoredHashes(): Promise<Map<string, { id: number; hash: string }>> {
  const result = await pool.query(
    `SELECT id, url, metadata->>'fileHash' as hash 
     FROM documents 
     WHERE source_type = 'wiki' AND url LIKE 'file://%'`
  );
  
  const hashMap = new Map<string, { id: number; hash: string }>();
  for (const row of result.rows) {
    const filePath = row.url.replace('file://', '');
    hashMap.set(filePath, { id: row.id, hash: row.hash });
  }
  
  return hashMap;
}

async function processWikiFile(file: WikiFile, isUpdate: boolean = false): Promise<boolean> {
  const relativePath = file.path.replace(/\\/g, '/');
  const title = path.basename(file.path, '.md').replace(/-/g, ' ');
  
  console.log(`  ${isUpdate ? '↻' : '+'} Processing: ${title}`);
  
  try {
    // Generate embedding
    const embedding = await generateEmbedding(`${title} ${file.content}`);
    
    // Prepare metadata
    const metadata = {
      path: relativePath,
      fileHash: file.hash,
      lastModified: file.lastModified.toISOString(),
      isUpdate,
    };
    
    // Determine document category
    let sourceCategory = 'wiki';
    if (relativePath.includes('calibration/')) {
      sourceCategory = 'calibration';
    } else if (relativePath.includes('developer-reference/')) {
      sourceCategory = 'developer';
    } else if (relativePath.includes('material_settings/')) {
      sourceCategory = 'material';
    } else if (relativePath.includes('print_settings/')) {
      sourceCategory = 'print_settings';
    } else if (relativePath.includes('printer_settings/')) {
      sourceCategory = 'printer_settings';
    }
    
    const fileUrl = `file://${relativePath}`;
    
    if (isUpdate) {
      // Update existing document
      await pool.query(
        `UPDATE documents 
         SET title = $1, content = $2, metadata = $3, embedding_json = $4, 
             doc_hash = $5, updated_at = CURRENT_TIMESTAMP
         WHERE url = $6`,
        [
          title,
          file.content,
          JSON.stringify(metadata),
          JSON.stringify(embedding),
          file.hash,
          fileUrl
        ]
      );
    } else {
      // Insert new document
      await pool.query(
        `INSERT INTO documents (title, content, url, source_type, metadata, embedding_json, doc_hash) 
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          title,
          file.content,
          fileUrl,
          sourceCategory,
          JSON.stringify(metadata),
          JSON.stringify(embedding),
          file.hash
        ]
      );
    }
    
    // Extract and update entities
    try {
      const contentForExtraction = file.content.slice(0, 3000);
      const entities = await entityExtractor.extractEntities(contentForExtraction);
      
      for (const entity of entities) {
        const entityEmbedding = await generateEmbedding(
          `${entity.name} ${entity.type} ${entity.description || ''}`
        );
        
        await pool.query(
          `INSERT INTO kg_entities (name, entity_type, description, metadata, embedding_json) 
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (name) DO UPDATE
           SET description = COALESCE(kg_entities.description, $3),
               metadata = kg_entities.metadata || $4,
               embedding_json = $5,
               updated_at = CURRENT_TIMESTAMP`,
          [
            entity.name,
            entity.type,
            entity.description,
            JSON.stringify({ ...entity.metadata, source: 'wiki_sync' }),
            JSON.stringify(entityEmbedding)
          ]
        );
      }
    } catch (error) {
      console.error(`    ! Error extracting entities:`, error);
    }
    
    return true;
  } catch (error) {
    console.error(`  ! Error processing ${title}:`, error);
    return false;
  }
}

async function syncWikiFiles(wikiDir: string): Promise<SyncResult> {
  const result: SyncResult = {
    added: 0,
    updated: 0,
    deleted: 0,
    unchanged: 0,
  };
  
  // Get stored file hashes
  const storedHashes = await getStoredHashes();
  
  // Track current files
  const currentFiles = new Set<string>();
  
  // Walk through wiki directory
  async function walkDir(dir: string) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory() && entry.name !== 'images' && entry.name !== '.git') {
        await walkDir(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        const relativePath = path.relative(wikiDir, fullPath);
        currentFiles.add(relativePath);
        
        // Read file content
        const content = await fs.readFile(fullPath, 'utf-8');
        const hash = await getFileHash(content);
        const stats = await fs.stat(fullPath);
        
        const wikiFile: WikiFile = {
          path: relativePath,
          content,
          hash,
          lastModified: stats.mtime,
        };
        
        // Check if file exists in database
        const stored = storedHashes.get(relativePath);
        
        if (!stored) {
          // New file
          const success = await processWikiFile(wikiFile, false);
          if (success) result.added++;
        } else if (stored.hash !== hash) {
          // Updated file
          const success = await processWikiFile(wikiFile, true);
          if (success) result.updated++;
        } else {
          // Unchanged file
          result.unchanged++;
        }
      }
    }
  }
  
  await walkDir(wikiDir);
  
  // Check for deleted files
  for (const [storedPath, stored] of storedHashes) {
    if (!currentFiles.has(storedPath)) {
      // Mark as deleted (don't actually delete, just update metadata)
      await pool.query(
        `UPDATE documents 
         SET metadata = jsonb_set(metadata, '{deleted}', 'true'), 
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [stored.id]
      );
      result.deleted++;
      console.log(`  - Marked as deleted: ${storedPath}`);
    }
  }
  
  return result;
}

async function pullLatestWiki(wikiDir: string): Promise<boolean> {
  console.log('📥 Pulling latest wiki changes...');
  
  try {
    // Check if it's a git repository
    const gitDir = path.join(wikiDir, '.git');
    const isGitRepo = await fs.access(gitDir).then(() => true).catch(() => false);
    
    if (!isGitRepo) {
      console.log('  ! Wiki directory is not a git repository');
      console.log('  → Cloning OrcaSlicer wiki...');
      
      // Clone the wiki
      execSync(
        `git clone https://github.com/SoftFever/OrcaSlicer.wiki.git "${wikiDir}"`,
        { stdio: 'inherit' }
      );
    } else {
      // Pull latest changes
      const currentBranch = execSync('git branch --show-current', { 
        cwd: wikiDir, 
        encoding: 'utf-8' 
      }).trim();
      
      console.log(`  → Current branch: ${currentBranch}`);
      
      // Fetch and pull
      execSync('git fetch origin', { cwd: wikiDir, stdio: 'inherit' });
      execSync(`git pull origin ${currentBranch}`, { cwd: wikiDir, stdio: 'inherit' });
    }
    
    // Get last commit info
    const lastCommit = execSync('git log -1 --oneline', { 
      cwd: wikiDir, 
      encoding: 'utf-8' 
    }).trim();
    
    console.log(`  ✓ Updated to: ${lastCommit}`);
    return true;
  } catch (error) {
    console.error('  ! Error pulling wiki:', error);
    return false;
  }
}

async function main() {
  console.log('🔄 OrcaSlicer Wiki Sync');
  console.log('='.repeat(50));
  
  const wikiDir = path.join(__dirname, '..', 'OrcaSlicer.wiki');
  
  // Check if wiki directory exists
  const wikiExists = await fs.access(wikiDir).then(() => true).catch(() => false);
  
  if (!wikiExists) {
    console.log('📁 Wiki directory not found.');
  }
  
  // Pull latest changes
  const pullSuccess = await pullLatestWiki(wikiDir);
  
  if (!pullSuccess && !wikiExists) {
    console.error('❌ Failed to clone/update wiki. Exiting.');
    process.exit(1);
  }
  
  console.log('\n📊 Syncing wiki files...\n');
  
  // Sync files
  const syncResult = await syncWikiFiles(wikiDir);
  
  // Summary
  console.log('\n📈 Sync Summary:');
  console.log(`   Added:     ${syncResult.added} files`);
  console.log(`   Updated:   ${syncResult.updated} files`);
  console.log(`   Deleted:   ${syncResult.deleted} files`);
  console.log(`   Unchanged: ${syncResult.unchanged} files`);
  
  // Get total counts
  const docCount = await pool.query(
    `SELECT COUNT(*) FROM documents WHERE source_type LIKE '%wiki%' OR source_type IN ('calibration', 'developer', 'material', 'print_settings', 'printer_settings')`
  );
  const entityCount = await pool.query('SELECT COUNT(*) FROM kg_entities');
  
  console.log('\n📚 Database Statistics:');
  console.log(`   Wiki documents: ${docCount.rows[0].count}`);
  console.log(`   Total entities: ${entityCount.rows[0].count}`);
  
  // Save sync log
  const syncLog = {
    timestamp: new Date().toISOString(),
    wikiDir,
    result: syncResult,
    totalDocs: docCount.rows[0].count,
    totalEntities: entityCount.rows[0].count,
  };
  
  await pool.query(
    `INSERT INTO documents (title, content, url, source_type, metadata) 
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (url) DO UPDATE
     SET content = $2,
         metadata = documents.metadata || $5,
         updated_at = CURRENT_TIMESTAMP`,
    [
      'Wiki Sync Log',
      JSON.stringify(syncLog, null, 2),
      'internal://wiki-sync-log',
      'system',
      JSON.stringify(syncLog)
    ]
  );
  
  console.log('\n✅ Wiki sync complete!');
  
  // Close pool
  await pool.end();
}

// Run the sync
main().catch(async (error) => {
  console.error('Fatal error:', error);
  await pool.end();
  process.exit(1);
});