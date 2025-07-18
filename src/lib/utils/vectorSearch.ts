import { pool } from '../db/client';
import { openai } from './openai';

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must have the same length');
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);
  
  if (normA === 0 || normB === 0) {
    return 0;
  }
  
  return dotProduct / (normA * normB);
}

/**
 * Generate embedding for a text query
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });
    
    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

/**
 * Search documents using vector similarity
 */
export async function vectorSearch(
  query: string,
  limit: number = 5,
  threshold: number = 0.7
): Promise<Array<{ id: number; title: string; content: string; similarity: number }>> {
  // Generate embedding for the query
  const queryEmbedding = await generateEmbedding(query);
  
  // Fetch all documents with embeddings
  const result = await pool.query(`
    SELECT id, title, content, embedding_json
    FROM documents
    WHERE embedding_json IS NOT NULL AND embedding_json != '[]'
  `);
  
  // Calculate similarities
  const documentsWithSimilarity = result.rows
    .map(doc => {
      try {
        const docEmbedding = JSON.parse(doc.embedding_json);
        const similarity = cosineSimilarity(queryEmbedding, docEmbedding);
        
        return {
          id: doc.id,
          title: doc.title,
          content: doc.content,
          similarity,
        };
      } catch (error) {
        console.error(`Error processing document ${doc.id}:`, error);
        return null;
      }
    })
    .filter(doc => doc !== null && doc.similarity >= threshold)
    .sort((a, b) => b!.similarity - a!.similarity)
    .slice(0, limit);
  
  return documentsWithSimilarity as any;
}

/**
 * Search entities using vector similarity
 */
export async function vectorSearchEntities(
  query: string,
  limit: number = 10,
  threshold: number = 0.6
): Promise<Array<{ id: number; name: string; type: string; description: string; similarity: number }>> {
  // Generate embedding for the query
  const queryEmbedding = await generateEmbedding(query);
  
  // Fetch all entities with embeddings
  const result = await pool.query(`
    SELECT id, name, entity_type, description, embedding_json
    FROM kg_entities
    WHERE embedding_json IS NOT NULL AND embedding_json != '[]'
  `);
  
  // Calculate similarities
  const entitiesWithSimilarity = result.rows
    .map(entity => {
      try {
        const entityEmbedding = JSON.parse(entity.embedding_json);
        const similarity = cosineSimilarity(queryEmbedding, entityEmbedding);
        
        return {
          id: entity.id,
          name: entity.name,
          type: entity.entity_type,
          description: entity.description,
          similarity,
        };
      } catch (error) {
        console.error(`Error processing entity ${entity.id}:`, error);
        return null;
      }
    })
    .filter(entity => entity !== null && entity.similarity >= threshold)
    .sort((a, b) => b!.similarity - a!.similarity)
    .slice(0, limit);
  
  return entitiesWithSimilarity as any;
}

/**
 * Hybrid search combining text search and vector similarity
 */
export async function hybridSearch(
  query: string,
  limit: number = 5
): Promise<Array<{ id: number; title: string; content: string; score: number; source: string }>> {
  // Perform text search
  const textSearchResult = await pool.query(`
    SELECT id, title, content, 
           ts_rank(to_tsvector('english', title || ' ' || content), query) as rank
    FROM documents, plainto_tsquery('english', $1) query
    WHERE to_tsvector('english', title || ' ' || content) @@ query
    ORDER BY rank DESC
    LIMIT $2
  `, [query, limit]);
  
  // Perform vector search
  const vectorResults = await vectorSearch(query, limit, 0.6);
  
  // Combine results with weighted scoring
  const combinedResults = new Map<number, any>();
  
  // Add text search results (weight: 0.6)
  textSearchResult.rows.forEach(doc => {
    combinedResults.set(doc.id, {
      id: doc.id,
      title: doc.title,
      content: doc.content,
      score: doc.rank * 0.6,
      source: 'text',
    });
  });
  
  // Add vector search results (weight: 0.4)
  vectorResults.forEach(doc => {
    if (combinedResults.has(doc.id)) {
      const existing = combinedResults.get(doc.id);
      existing.score += doc.similarity * 0.4;
      existing.source = 'hybrid';
    } else {
      combinedResults.set(doc.id, {
        id: doc.id,
        title: doc.title,
        content: doc.content,
        score: doc.similarity * 0.4,
        source: 'vector',
      });
    }
  });
  
  // Sort by combined score and return top results
  return Array.from(combinedResults.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Update embeddings for documents without them
 */
export async function updateMissingEmbeddings() {
  // Find documents without embeddings
  const result = await pool.query(`
    SELECT id, title, content
    FROM documents
    WHERE embedding_json IS NULL OR embedding_json = '[]'
    LIMIT 10
  `);
  
  for (const doc of result.rows) {
    try {
      const text = `${doc.title} ${doc.content}`.slice(0, 8000); // Limit text length
      const embedding = await generateEmbedding(text);
      
      await pool.query(
        `UPDATE documents SET embedding_json = $1 WHERE id = $2`,
        [JSON.stringify(embedding), doc.id]
      );
      
      console.log(`Updated embedding for document ${doc.id}: ${doc.title}`);
    } catch (error) {
      console.error(`Failed to update embedding for document ${doc.id}:`, error);
    }
  }
}