import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { Pool } from 'pg';
import { OpenAI } from 'openai';
import fs from 'fs/promises';
import path from 'path';

// Load environment variables FIRST
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '..', '.env.local') });

// Configuration
const BATCH_SIZE = 5; // Process 5 files at a time
const SKIP_EMBEDDINGS = false; // Set to true to skip embedding generation for faster processing

// Create our own pool instance after env vars are loaded
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ProcessedFile {
  title: string;
  content: string;
  url: string;
  sourceType: string;
  metadata: Record<string, any>;
}

async function generateEmbedding(text: string): Promise<number[]> {
  if (SKIP_EMBEDDINGS) return [];
  
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

async function readMarkdownFile(filePath: string): Promise<string> {
  try {
    return await fs.readFile(filePath, 'utf-8');
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return '';
  }
}

async function extractTitleFromContent(content: string, filename: string): string {
  // Try to extract title from first # heading
  const match = content.match(/^#\s+(.+)$/m);
  if (match) {
    return match[1].trim();
  }
  
  // Fallback to filename without extension
  return filename.replace(/\.md$/, '').replace(/-/g, ' ');
}

async function processMarkdownFile(filePath: string, baseDir: string): Promise<ProcessedFile | null> {
  const content = await readMarkdownFile(filePath);
  if (!content) return null;
  
  const relativePath = path.relative(baseDir, filePath);
  const filename = path.basename(filePath);
  const title = await extractTitleFromContent(content, filename);
  
  // Determine source type based on directory
  let sourceType = 'wiki';
  if (relativePath.includes('calibration/')) {
    sourceType = 'calibration';
  } else if (relativePath.includes('developer-reference/')) {
    sourceType = 'developer';
  } else if (relativePath.includes('material_settings/')) {
    sourceType = 'material';
  } else if (relativePath.includes('print_settings/')) {
    sourceType = 'print_settings';
  } else if (relativePath.includes('printer_settings/')) {
    sourceType = 'printer_settings';
  }
  
  return {
    title,
    content,
    url: `https://github.com/SoftFever/OrcaSlicer/wiki/${relativePath.replace(/\.md$/, '')}`,
    sourceType,
    metadata: {
      path: relativePath,
      filename,
    },
  };
}

async function findMarkdownFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  
  async function walk(currentDir: string) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      
      if (entry.isDirectory() && entry.name !== 'images') {
        await walk(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        files.push(fullPath);
      }
    }
  }
  
  await walk(dir);
  return files;
}

async function processDocument(doc: ProcessedFile): Promise<boolean> {
  console.log(`  Processing: ${doc.title}`);
  
  try {
    // Generate embedding
    const embedding = await generateEmbedding(`${doc.title} ${doc.content}`);
    
    // Check if document already exists
    const existingResult = await pool.query(
      'SELECT id FROM documents WHERE url = $1',
      [doc.url]
    );
    
    if (existingResult.rows.length > 0) {
      // Update existing document
      await pool.query(
        `UPDATE documents 
         SET title = $1, content = $2, source_type = $3, metadata = $4, embedding_json = $5, updated_at = CURRENT_TIMESTAMP
         WHERE url = $6`,
        [
          doc.title,
          doc.content,
          doc.sourceType,
          JSON.stringify(doc.metadata),
          JSON.stringify(embedding),
          doc.url
        ]
      );
      console.log(`    ✓ Updated existing document`);
    } else {
      // Insert new document
      await pool.query(
        `INSERT INTO documents (title, content, url, source_type, metadata, embedding_json) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          doc.title,
          doc.content,
          doc.url,
          doc.sourceType,
          JSON.stringify(doc.metadata),
          JSON.stringify(embedding)
        ]
      );
      console.log(`    ✓ Document inserted`);
    }
    
    return true;
  } catch (error) {
    console.error(`Error processing document ${doc.title}:`, error);
    return false;
  }
}

async function processBatch(files: string[], baseDir: string, batchNumber: number, totalBatches: number) {
  console.log(`\n📦 Processing batch ${batchNumber}/${totalBatches} (${files.length} files)`);
  
  let processed = 0;
  let failed = 0;
  
  for (const filePath of files) {
    const processedFile = await processMarkdownFile(filePath, baseDir);
    
    if (processedFile) {
      const success = await processDocument(processedFile);
      if (success) {
        processed++;
      } else {
        failed++;
      }
    } else {
      failed++;
    }
  }
  
  console.log(`  ✓ Batch complete: ${processed} processed, ${failed} failed`);
  return { processed, failed };
}

async function main() {
  console.log('🚀 Starting Batch Local OrcaSlicer Wiki Ingestion');
  console.log('='.repeat(50));
  
  const wikiDir = path.join(__dirname, '..', 'OrcaSlicer.wiki');
  
  // Check if wiki directory exists
  try {
    await fs.access(wikiDir);
  } catch (error) {
    console.error(`❌ Wiki directory not found: ${wikiDir}`);
    console.log('Please ensure the OrcaSlicer.wiki folder exists in the project root.');
    process.exit(1);
  }
  
  console.log(`📁 Reading from: ${wikiDir}`);
  console.log(`⚙️  Batch size: ${BATCH_SIZE}`);
  console.log(`🔧 Skip embeddings: ${SKIP_EMBEDDINGS}\n`);
  
  // Find all markdown files
  const markdownFiles = await findMarkdownFiles(wikiDir);
  console.log(`📄 Found ${markdownFiles.length} markdown files`);
  
  // Process in batches
  let totalProcessed = 0;
  let totalFailed = 0;
  const totalBatches = Math.ceil(markdownFiles.length / BATCH_SIZE);
  
  for (let i = 0; i < markdownFiles.length; i += BATCH_SIZE) {
    const batch = markdownFiles.slice(i, i + BATCH_SIZE);
    const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
    
    const { processed, failed } = await processBatch(batch, wikiDir, batchNumber, totalBatches);
    totalProcessed += processed;
    totalFailed += failed;
    
    // Small delay between batches to avoid rate limits
    if (i + BATCH_SIZE < markdownFiles.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  // Summary statistics
  const docCountResult = await pool.query('SELECT COUNT(*) FROM documents');
  const entityCountResult = await pool.query('SELECT COUNT(*) FROM kg_entities');
  
  console.log('\n📊 Final Statistics:');
  console.log(`   Files processed: ${totalProcessed}`);
  console.log(`   Files failed: ${totalFailed}`);
  console.log(`   Total documents in DB: ${docCountResult.rows[0].count}`);
  console.log(`   Total entities in DB: ${entityCountResult.rows[0].count}`);
  
  console.log('\n✅ Batch wiki ingestion complete!');
  
  // Create a backup record
  const backupInfo = {
    date: new Date().toISOString(),
    documentsCount: docCountResult.rows[0].count,
    entitiesCount: entityCountResult.rows[0].count,
    processedFiles: totalProcessed,
    failedFiles: totalFailed,
    totalFiles: markdownFiles.length,
    wikiPath: wikiDir,
    batchSize: BATCH_SIZE,
    skipEmbeddings: SKIP_EMBEDDINGS,
  };
  
  await fs.writeFile(
    path.join(__dirname, '..', 'wiki-ingestion-log.json'),
    JSON.stringify(backupInfo, null, 2)
  );
  
  console.log('📝 Backup info saved to wiki-ingestion-log.json');
  
  // Close pool connection
  await pool.end();
  process.exit(0);
}

// Run the ingestion
main().catch(async (error) => {
  console.error('Fatal error:', error);
  await pool.end();
  process.exit(1);
});