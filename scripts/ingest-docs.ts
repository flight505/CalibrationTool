import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables FIRST before any other imports
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '..', '.env.local') });

// Now import other modules after env vars are loaded
import FirecrawlApp from '@mendable/firecrawl-js';
import { Pool } from 'pg';
import { EntityExtractor } from '../src/lib/lightrag/entityExtractor';
import { openai } from '../src/lib/utils/openai';
import { v4 as uuidv4 } from 'uuid';

// Create our own pool instance after env vars are loaded
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Create entity extractor instance
const entityExtractor = new EntityExtractor();

interface CrawlResult {
  title: string;
  content: string;
  url: string;
  metadata?: Record<string, any>;
}

interface ExtractedEntity {
  name: string;
  type: string;
  description?: string;
  metadata?: Record<string, any>;
  relatedTo?: Array<{
    name: string;
    type: string;
    weight?: number;
    metadata?: Record<string, any>;
  }>;
}

// Configuration for different documentation sources
const DOCUMENTATION_SOURCES = [
  {
    name: 'OrcaSlicer Wiki',
    url: 'https://github.com/SoftFever/OrcaSlicer/wiki',
    type: 'wiki',
    crawlOptions: {
      limit: 100,
      scrapeOptions: {
        formats: ['markdown'],
        onlyMainContent: true,
        waitFor: 1000,
      },
      includePaths: ['/wiki/*'],
      maxDepth: 3,
    }
  },
  {
    name: 'OrcaSlicer Manual',
    url: 'https://github.com/SoftFever/OrcaSlicer/tree/main/doc',
    type: 'documentation',
    crawlOptions: {
      limit: 50,
      scrapeOptions: {
        formats: ['markdown'],
        onlyMainContent: true,
      },
      includePaths: ['/doc/*'],
      excludePaths: ['/doc/images/*'],
      maxDepth: 2,
    }
  }
];

async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });
    
    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    // Return empty array if embedding fails (since pgvector not available)
    return [];
  }
}

async function processDocument(doc: CrawlResult, sourceType: string) {
  console.log(`Processing: ${doc.title || doc.url}`);
  
  try {
    // Insert document into database
    const insertResult = await pool.query(
      `INSERT INTO documents (title, content, url, source_type, metadata, embedding_json) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING id`,
      [
        doc.title || 'Untitled',
        doc.content,
        doc.url,
        sourceType,
        JSON.stringify(doc.metadata || {}),
        '[]' // Empty embedding array as JSON string
      ]
    );
    
    const insertedDoc = insertResult.rows[0];
    console.log(`  ✓ Document inserted: ${insertedDoc.id}`);
    
    // Extract entities from the document
    const entities = await entityExtractor.extractEntities(doc.content);
    console.log(`  ✓ Extracted ${entities.length} entities`);
    
    // Process and store entities
    for (const entity of entities) {
      // Check if entity already exists
      const existingResult = await pool.query(
        `SELECT id FROM kg_entities WHERE name = $1 AND entity_type = $2`,
        [entity.name, entity.type]
      );
      
      let entityId: number;
      
      if (existingResult.rows.length > 0) {
        entityId = existingResult.rows[0].id;
        console.log(`    - Entity exists: ${entity.name} (${entity.type})`);
      } else {
        // Generate embedding for entity description
        const entityEmbedding = await generateEmbedding(
          `${entity.name} ${entity.type} ${entity.description || ''}`
        );
        
        // Insert new entity
        const insertEntityResult = await pool.query(
          `INSERT INTO kg_entities (name, entity_type, description, metadata, embedding_json) 
           VALUES ($1, $2, $3, $4, $5) 
           RETURNING id`,
          [
            entity.name,
            entity.type,
            entity.description,
            JSON.stringify(entity.metadata || {}),
            JSON.stringify(entityEmbedding)
          ]
        );
        
        entityId = insertEntityResult.rows[0].id;
        console.log(`    + New entity: ${entity.name} (${entity.type})`);
      }
      
      // Create relationships if provided
      if (entity.relatedTo && entity.relatedTo.length > 0) {
        for (const relation of entity.relatedTo) {
          // Find target entity
          const targetResult = await pool.query(
            `SELECT id FROM kg_entities WHERE name = $1`,
            [relation.name]
          );
          
          if (targetResult.rows.length > 0) {
            const targetEntityId = targetResult.rows[0].id;
            
            // Check if relationship already exists
            const existingRelationResult = await pool.query(
              `SELECT id FROM kg_relationships 
               WHERE source_entity_id = $1 AND target_entity_id = $2 AND relationship_type = $3`,
              [entityId, targetEntityId, relation.type]
            );
            
            if (existingRelationResult.rows.length === 0) {
              await pool.query(
                `INSERT INTO kg_relationships (source_entity_id, target_entity_id, relationship_type, weight, metadata) 
                 VALUES ($1, $2, $3, $4, $5)`,
                [
                  entityId,
                  targetEntityId,
                  relation.type,
                  relation.weight || 0.5,
                  JSON.stringify(relation.metadata || {})
                ]
              );
              
              console.log(`      → Relationship: ${entity.name} -[${relation.type}]-> ${relation.name}`);
            }
          }
        }
      }
    }
    
    return insertedDoc;
  } catch (error) {
    console.error(`Error processing document ${doc.url}:`, error);
    return null;
  }
}

async function crawlAndIngest(source: typeof DOCUMENTATION_SOURCES[0]) {
  console.log(`\n🔍 Starting crawl for: ${source.name}`);
  console.log(`   URL: ${source.url}`);
  
  const firecrawl = new FirecrawlApp({
    apiKey: process.env.FIRECRAWL_API_KEY || '',
  });
  
  try {
    // Start crawling
    const crawlResult = await firecrawl.crawlUrl(
      source.url,
      source.crawlOptions as any,
      true // Wait for completion
    );
    
    if (!crawlResult.success) {
      console.error(`Crawl failed for ${source.name}:`, crawlResult.error);
      return;
    }
    
    const documents = crawlResult.data || [];
    console.log(`\n📄 Found ${documents.length} documents`);
    
    // Process each document
    let processed = 0;
    let failed = 0;
    
    for (const doc of documents) {
      if (doc.markdown && doc.metadata?.url) {
        const result = await processDocument({
          title: doc.metadata.title || doc.metadata.ogTitle || 'Untitled',
          content: doc.markdown,
          url: doc.metadata.url,
          metadata: {
            description: doc.metadata.description,
            ...doc.metadata,
          }
        }, source.type);
        
        if (result) {
          processed++;
        } else {
          failed++;
        }
      }
    }
    
    console.log(`\n✅ Crawl complete for ${source.name}`);
    console.log(`   Processed: ${processed}`);
    console.log(`   Failed: ${failed}`);
    
  } catch (error) {
    console.error(`Error crawling ${source.name}:`, error);
  }
}

async function manualSeedData() {
  console.log('\n🌱 Adding manual seed data...');
  
  // Common 3D printing entities
  const seedEntities = [
    { name: 'PLA', type: 'material', description: 'Polylactic Acid - biodegradable thermoplastic', metadata: { tempRange: '190-220°C', bedTemp: '60°C' } },
    { name: 'PETG', type: 'material', description: 'Polyethylene Terephthalate Glycol - strong and flexible', metadata: { tempRange: '220-250°C', bedTemp: '70-80°C' } },
    { name: 'ABS', type: 'material', description: 'Acrylonitrile Butadiene Styrene - durable and heat resistant', metadata: { tempRange: '220-250°C', bedTemp: '95-110°C' } },
    { name: 'TPU', type: 'material', description: 'Thermoplastic Polyurethane - flexible material', metadata: { tempRange: '210-230°C', bedTemp: '60°C' } },
    { name: 'Flow Ratio', type: 'setting', description: 'Controls material extrusion multiplier', metadata: { default: '1.0', category: 'calibration' } },
    { name: 'Temperature', type: 'setting', description: 'Hotend temperature setting', metadata: { category: 'calibration' } },
    { name: 'Pressure Advance', type: 'setting', description: 'Linear advance compensation', metadata: { default: '0.0', category: 'calibration' } },
    { name: 'Retraction', type: 'setting', description: 'Filament retraction settings', metadata: { category: 'calibration' } },
    { name: 'Stringing', type: 'problem', description: 'Thin strings of plastic between parts', metadata: { severity: 'medium' } },
    { name: 'Warping', type: 'problem', description: 'Corners lifting from build plate', metadata: { severity: 'high' } },
    { name: 'Layer Adhesion', type: 'problem', description: 'Poor bonding between layers', metadata: { severity: 'high' } },
    { name: 'Overheating', type: 'problem', description: 'Material getting too hot causing quality issues', metadata: { severity: 'medium' } },
  ];
  
  for (const entity of seedEntities) {
    try {
      const existingResult = await pool.query(
        `SELECT id FROM kg_entities WHERE name = $1 AND entity_type = $2`,
        [entity.name, entity.type]
      );
      
      if (existingResult.rows.length === 0) {
        const embedding = await generateEmbedding(
          `${entity.name} ${entity.type} ${entity.description}`
        );
        
        await pool.query(
          `INSERT INTO kg_entities (name, entity_type, description, metadata, embedding_json) 
           VALUES ($1, $2, $3, $4, $5)`,
          [
            entity.name,
            entity.type,
            entity.description,
            JSON.stringify(entity.metadata),
            JSON.stringify(embedding)
          ]
        );
        
        console.log(`  + Added entity: ${entity.name} (${entity.type})`);
      }
    } catch (error) {
      console.error(`Failed to add entity ${entity.name}:`, error);
    }
  }
  
  // Add some calibration guides
  const calibrationGuides = [
    {
      title: 'Flow Ratio Calibration Guide',
      content: `Flow ratio calibration is essential for accurate extrusion. The process involves:

1. Print a calibration cube with specific wall thickness
2. Measure the actual wall thickness
3. Calculate the new flow ratio using: New Flow = Current Flow × (Expected / Measured)
4. Update the flow ratio in OrcaSlicer material settings

For 0.4mm nozzle, use a cube with 1.2mm thick walls (3 perimeters) and 0.4mm thin walls (1 perimeter).`,
      url: 'https://github.com/SoftFever/OrcaSlicer/wiki/Flow-Rate',
      sourceType: 'guide',
      metadata: { category: 'calibration', difficulty: 'beginner' }
    },
    {
      title: 'Temperature Tower Calibration',
      content: `Temperature calibration helps find the optimal printing temperature for your filament:

1. Download a temperature tower model
2. Set temperature changes at specific heights
3. Print and examine quality at each temperature
4. Select the temperature with best layer adhesion and minimal stringing

Typical ranges:
- PLA: 190-220°C
- PETG: 220-250°C
- ABS: 220-250°C`,
      url: 'https://github.com/SoftFever/OrcaSlicer/wiki/Temperature-Tower',
      sourceType: 'guide',
      metadata: { category: 'calibration', difficulty: 'beginner' }
    },
    {
      title: 'Pressure Advance Tuning',
      content: `Pressure Advance compensates for filament compression in the hotend:

1. Print a pressure advance calibration pattern
2. Look for the height where corners are sharpest
3. Calculate PA value: PA = Step × Measured Height
4. Enter value in OrcaSlicer (typically 0.02-0.1 for direct drive)

Direct drive systems typically need PA values between 0.02-0.08, while Bowden systems need 0.3-1.0.`,
      url: 'https://github.com/SoftFever/OrcaSlicer/wiki/Pressure-Advance',
      sourceType: 'guide',
      metadata: { category: 'calibration', difficulty: 'intermediate' }
    }
  ];
  
  for (const guide of calibrationGuides) {
    try {
      await pool.query(
        `INSERT INTO documents (title, content, url, source_type, metadata, embedding_json) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          guide.title,
          guide.content,
          guide.url,
          guide.sourceType,
          JSON.stringify(guide.metadata),
          '[]'
        ]
      );
      console.log(`  + Added guide: ${guide.title}`);
    } catch (error) {
      console.error(`Failed to add guide ${guide.title}:`, error);
    }
  }
  
  console.log('✅ Manual seed data added');
}

async function main() {
  console.log('🚀 Starting OrcaSlicer Documentation Ingestion');
  console.log('='.repeat(50));
  
  // Check if we have API key
  if (!process.env.FIRECRAWL_API_KEY) {
    console.error('❌ FIRECRAWL_API_KEY not found in environment');
    console.log('\n💡 Falling back to manual seed data only...');
    
    await manualSeedData();
    
    console.log('\n📝 To enable automatic documentation scraping:');
    console.log('   1. Get a Firecrawl API key from https://firecrawl.dev');
    console.log('   2. Add FIRECRAWL_API_KEY to your .env.local file');
    console.log('   3. Run this script again');
    
    process.exit(0);
  }
  
  // Add manual seed data first
  await manualSeedData();
  
  // Crawl and ingest each documentation source
  for (const source of DOCUMENTATION_SOURCES) {
    await crawlAndIngest(source);
  }
  
  // Summary statistics
  const docCountResult = await pool.query('SELECT COUNT(*) FROM documents');
  const entityCountResult = await pool.query('SELECT COUNT(*) FROM kg_entities');
  const relationCountResult = await pool.query('SELECT COUNT(*) FROM kg_relationships');
  
  console.log('\n📊 Final Statistics:');
  console.log(`   Documents: ${docCountResult.rows[0].count}`);
  console.log(`   Entities: ${entityCountResult.rows[0].count}`);
  console.log(`   Relationships: ${relationCountResult.rows[0].count}`);
  
  console.log('\n✅ Documentation ingestion complete!');
  
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