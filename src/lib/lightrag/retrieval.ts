import { query } from '../db/client';
import { generateEmbedding, cosineSimilarity, extractKeyPhrases } from '../utils/openai';

export interface RetrievalResult {
  id: number;
  title?: string;
  name?: string;
  content?: string;
  description?: string;
  similarity?: number;
  metadata?: any;
  type?: string;
}

export class DualLevelRetrieval {
  // Low-level retrieval: Direct entity/document search
  async lowLevelRetrieve(queryText: string, topK: number = 5): Promise<RetrievalResult[]> {
    try {
      // Generate embedding for the query
      const queryEmbedding = await generateEmbedding(queryText);
      
      // Search in documents
      const docsResult = await query(
        `SELECT id, title, content, metadata, embedding_json
         FROM documents
         WHERE content ILIKE $1 OR title ILIKE $1
         ORDER BY created_at DESC
         LIMIT $2`,
        [`%${queryText}%`, topK]
      );
      
      // Search in entities
      const entitiesResult = await query(
        `SELECT id, name, description, entity_type, metadata, embedding_json
         FROM kg_entities
         WHERE name ILIKE $1 OR description ILIKE $1
         ORDER BY created_at DESC
         LIMIT $2`,
        [`%${queryText}%`, topK]
      );
      
      // Calculate similarities if embeddings exist
      const results: RetrievalResult[] = [];
      
      // Process documents
      for (const doc of docsResult.rows) {
        let similarity = 0;
        if (doc.embedding_json) {
          try {
            const docEmbedding = JSON.parse(doc.embedding_json);
            similarity = cosineSimilarity(queryEmbedding, docEmbedding);
          } catch (e) {
            console.error('Error parsing embedding:', e);
          }
        }
        
        results.push({
          id: doc.id,
          title: doc.title,
          content: doc.content,
          metadata: doc.metadata,
          similarity,
          type: 'document'
        });
      }
      
      // Process entities
      for (const entity of entitiesResult.rows) {
        let similarity = 0;
        if (entity.embedding_json) {
          try {
            const entityEmbedding = JSON.parse(entity.embedding_json);
            similarity = cosineSimilarity(queryEmbedding, entityEmbedding);
          } catch (e) {
            console.error('Error parsing embedding:', e);
          }
        }
        
        results.push({
          id: entity.id,
          name: entity.name,
          description: entity.description,
          metadata: { ...entity.metadata, type: entity.entity_type },
          similarity,
          type: 'entity'
        });
      }
      
      // Sort by similarity if available, otherwise by relevance
      results.sort((a, b) => (b.similarity || 0) - (a.similarity || 0));
      
      return results.slice(0, topK);
    } catch (error) {
      console.error('Error in low-level retrieval:', error);
      return [];
    }
  }

  // High-level retrieval: Conceptual search with graph traversal
  async highLevelRetrieve(queryText: string, topK: number = 5): Promise<RetrievalResult[]> {
    try {
      // Extract key concepts from the query
      const concepts = await extractKeyPhrases(queryText);
      
      if (concepts.length === 0) {
        // Fallback to simple search
        return this.lowLevelRetrieve(queryText, topK);
      }
      
      // Find entities related to concepts using graph traversal
      const entityQuery = `
        WITH RECURSIVE related_entities AS (
          -- Start with entities matching concepts
          SELECT DISTINCT e.id, e.name, e.description, e.entity_type, e.metadata, 0 as depth
          FROM kg_entities e
          WHERE ${concepts.map((_, i) => `e.name ILIKE $${i + 1}`).join(' OR ')}
          
          UNION
          
          -- Traverse relationships (up to 2 hops)
          SELECT DISTINCT e.id, e.name, e.description, e.entity_type, e.metadata, re.depth + 1
          FROM kg_entities e
          JOIN kg_relationships r ON e.id = r.target_entity_id
          JOIN related_entities re ON r.source_entity_id = re.id
          WHERE re.depth < 2
        )
        SELECT DISTINCT * FROM related_entities
        ORDER BY depth, name
        LIMIT $${concepts.length + 1}
      `;
      
      const params = [...concepts.map(c => `%${c}%`), topK * 2];
      const result = await query(entityQuery, params);
      
      // Also search for related documents
      const docsResult = await query(
        `SELECT DISTINCT d.id, d.title, d.content, d.metadata
         FROM documents d
         WHERE ${concepts.map((_, i) => `(d.title ILIKE $${i + 1} OR d.content ILIKE $${i + 1})`).join(' OR ')}
         ORDER BY d.created_at DESC
         LIMIT $${concepts.length + 1}`,
        params
      );
      
      // Combine results
      const results: RetrievalResult[] = [];
      
      // Add entities
      for (const entity of result.rows) {
        results.push({
          id: entity.id,
          name: entity.name,
          description: entity.description,
          metadata: { ...entity.metadata, type: entity.entity_type, depth: entity.depth },
          type: 'entity'
        });
      }
      
      // Add documents
      for (const doc of docsResult.rows) {
        results.push({
          id: doc.id,
          title: doc.title,
          content: doc.content,
          metadata: doc.metadata,
          type: 'document'
        });
      }
      
      return results.slice(0, topK);
    } catch (error) {
      console.error('Error in high-level retrieval:', error);
      return [];
    }
  }

  // Combined retrieval using both methods
  async hybridRetrieve(queryText: string, topK: number = 10): Promise<RetrievalResult[]> {
    const [lowLevel, highLevel] = await Promise.all([
      this.lowLevelRetrieve(queryText, Math.ceil(topK / 2)),
      this.highLevelRetrieve(queryText, Math.ceil(topK / 2))
    ]);
    
    // Merge and deduplicate results
    const resultMap = new Map<string, RetrievalResult>();
    
    for (const result of [...lowLevel, ...highLevel]) {
      const key = `${result.type}-${result.id}`;
      if (!resultMap.has(key) || (resultMap.get(key)!.similarity || 0) < (result.similarity || 0)) {
        resultMap.set(key, result);
      }
    }
    
    return Array.from(resultMap.values()).slice(0, topK);
  }
}