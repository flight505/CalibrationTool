import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { Pool } from 'pg';
import { OpenAI } from 'openai';
import chalk from 'chalk';
import ora from 'ora';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '..', '.env.local') });

// Initialize clients
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Test queries for different aspects of 3D printing knowledge
const testQueries = [
  // Calibration queries
  {
    category: 'Flow Calibration',
    queries: [
      'How to calibrate flow rate in OrcaSlicer?',
      'What is the flow ratio formula for calibration cube?',
      'Why are my walls too thick after flow calibration?'
    ]
  },
  {
    category: 'Temperature Calibration',
    queries: [
      'What temperature should I use for PLA?',
      'How to use temperature tower in OrcaSlicer?',
      'PETG optimal temperature range'
    ]
  },
  {
    category: 'Pressure Advance',
    queries: [
      'How to calibrate pressure advance for direct drive?',
      'What PA value for Bowden extruder?',
      'Pressure advance causing gaps in corners'
    ]
  },
  {
    category: 'Retraction',
    queries: [
      'Best retraction settings for PETG',
      'How to fix stringing with retraction tower?',
      'Retraction length for TPU filament'
    ]
  },
  // Material-specific queries
  {
    category: 'Materials',
    queries: [
      'PLA vs PETG comparison',
      'How to print with TPU successfully?',
      'ABS warping prevention techniques'
    ]
  },
  // Problem-solving queries
  {
    category: 'Troubleshooting',
    queries: [
      'How to fix elephant foot?',
      'Why is my first layer not sticking?',
      'Solving layer adhesion problems'
    ]
  },
  // OrcaSlicer features
  {
    category: 'Slicer Features',
    queries: [
      'What is adaptive layer height?',
      'How to use tree supports in OrcaSlicer?',
      'Fuzzy skin settings explanation'
    ]
  }
];

// Generate embedding for search
async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text.slice(0, 8000),
  });
  
  return response.data[0].embedding;
}

// Search knowledge base
async function searchKnowledge(query: string): Promise<any[]> {
  const embedding = await generateEmbedding(query);
  
  const result = await pool.query(
    `SELECT 
      title,
      source_type,
      url,
      substring(content, 1, 200) as snippet,
      1 - (embedding_json::vector <=> $1::vector) as score
    FROM documents
    WHERE embedding_json IS NOT NULL
    ORDER BY embedding_json::vector <=> $1::vector
    LIMIT 3`,
    [JSON.stringify(embedding)]
  );
  
  return result.rows;
}

// Test entity extraction
async function testEntityExtraction(sampleText: string): Promise<any> {
  const result = await pool.query(
    `SELECT DISTINCT entity_type, COUNT(*) as count
     FROM kg_entities
     GROUP BY entity_type
     ORDER BY count DESC`
  );
  
  return result.rows;
}

// Test a single query
async function testQuery(query: string): Promise<{
  query: string;
  results: any[];
  topScore: number;
  hasRelevantResult: boolean;
}> {
  const results = await searchKnowledge(query);
  const topScore = results[0]?.score || 0;
  
  // Consider a result relevant if score > 0.7
  const hasRelevantResult = topScore > 0.7;
  
  return {
    query,
    results,
    topScore,
    hasRelevantResult
  };
}

async function main() {
  console.log(chalk.bold('\n🧪 OrcaSlicer Knowledge Base Quality Test\n'));
  
  const spinner = ora('Checking database connection...').start();
  
  try {
    // Test database connection
    await pool.query('SELECT 1');
    spinner.succeed('Database connected');
    
    // Get statistics
    spinner.start('Gathering statistics...');
    
    const stats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM documents) as total_docs,
        (SELECT COUNT(*) FROM documents WHERE source_type = 'wiki') as wiki_docs,
        (SELECT COUNT(*) FROM documents WHERE source_type = 'blog') as blog_docs,
        (SELECT COUNT(*) FROM kg_entities) as total_entities,
        (SELECT COUNT(*) FROM kg_relationships) as total_relationships
    `);
    
    spinner.succeed('Statistics gathered');
    
    console.log(chalk.blue('\n📊 Knowledge Base Statistics:'));
    console.log(`   Total Documents: ${stats.rows[0].total_docs}`);
    console.log(`   Wiki Documents: ${stats.rows[0].wiki_docs}`);
    console.log(`   Blog Documents: ${stats.rows[0].blog_docs}`);
    console.log(`   Entities: ${stats.rows[0].total_entities}`);
    console.log(`   Relationships: ${stats.rows[0].total_relationships}`);
    
    // Test entity types
    spinner.start('Testing entity extraction...');
    const entityTypes = await testEntityExtraction('');
    spinner.succeed('Entity extraction tested');
    
    console.log(chalk.blue('\n🏷️  Entity Types:'));
    entityTypes.forEach(type => {
      console.log(`   ${type.entity_type}: ${type.count}`);
    });
    
    // Test queries
    console.log(chalk.blue('\n🔍 Testing Search Quality:\n'));
    
    let totalQueries = 0;
    let successfulQueries = 0;
    const categoryResults: Record<string, { total: number; successful: number }> = {};
    
    for (const category of testQueries) {
      console.log(chalk.yellow(`\n${category.category}:`));
      categoryResults[category.category] = { total: 0, successful: 0 };
      
      for (const query of category.queries) {
        spinner.start(`Testing: ${query}`);
        
        const result = await testQuery(query);
        totalQueries++;
        categoryResults[category.category].total++;
        
        if (result.hasRelevantResult) {
          successfulQueries++;
          categoryResults[category.category].successful++;
          spinner.succeed(`${query} ${chalk.green(`(score: ${result.topScore.toFixed(3)})`)}`);
          
          // Show top result
          const topResult = result.results[0];
          console.log(chalk.gray(`   → ${topResult.title} [${topResult.source_type}]`));
        } else {
          spinner.fail(`${query} ${chalk.red(`(score: ${result.topScore.toFixed(3)})`)}`);
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    // Summary
    console.log(chalk.blue('\n📈 Test Summary:\n'));
    
    const overallScore = (successfulQueries / totalQueries * 100).toFixed(1);
    console.log(`Overall Success Rate: ${
      overallScore >= 80 ? chalk.green(overallScore + '%') :
      overallScore >= 60 ? chalk.yellow(overallScore + '%') :
      chalk.red(overallScore + '%')
    } (${successfulQueries}/${totalQueries})`);
    
    console.log('\nCategory Breakdown:');
    Object.entries(categoryResults).forEach(([category, results]) => {
      const categoryScore = (results.successful / results.total * 100).toFixed(1);
      console.log(`  ${category}: ${categoryScore}% (${results.successful}/${results.total})`);
    });
    
    // Recommendations
    console.log(chalk.blue('\n💡 Recommendations:\n'));
    
    if (overallScore < 60) {
      console.log(chalk.red('⚠️  Knowledge base needs more content:'));
      console.log('   1. Run: npm run ingest-local-wiki');
      console.log('   2. Run: npm run ingest-obico');
      console.log('   3. Consider adding more sources');
    } else if (overallScore < 80) {
      console.log(chalk.yellow('📚 Knowledge base is good but could be better:'));
      console.log('   1. Run: npm run sync-wiki');
      console.log('   2. Add more specialized content');
      console.log('   3. Check entity extraction quality');
    } else {
      console.log(chalk.green('✅ Knowledge base is performing well!'));
      console.log('   Keep it updated with: npm run sync-wiki');
    }
    
    // Test sample query with full response
    console.log(chalk.blue('\n🎯 Sample Full Query Test:\n'));
    
    const sampleQuery = 'How to calibrate flow rate in OrcaSlicer?';
    console.log(`Query: "${sampleQuery}"`);
    
    const sampleResults = await searchKnowledge(sampleQuery);
    
    console.log('\nTop 3 Results:');
    sampleResults.forEach((result, index) => {
      console.log(`\n${index + 1}. ${chalk.bold(result.title)} (${result.source_type})`);
      console.log(`   Score: ${result.score.toFixed(3)}`);
      console.log(`   Snippet: ${result.snippet}...`);
      if (result.url) {
        console.log(`   URL: ${chalk.cyan(result.url)}`);
      }
    });
    
  } catch (error) {
    spinner.fail('Test failed');
    console.error(chalk.red('\n❌ Error:'), error);
    
    if (error.message?.includes('relation "documents" does not exist')) {
      console.log(chalk.yellow('\n⚠️  Database not initialized. Run: npm run setup-db'));
    } else if (error.message?.includes('connection')) {
      console.log(chalk.yellow('\n⚠️  Database connection failed. Check your DATABASE_URL'));
    }
  } finally {
    await pool.end();
  }
}

// Run tests
main().catch(console.error);