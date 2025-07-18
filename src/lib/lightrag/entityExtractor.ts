import { openai } from '../utils/openai';
import { query } from '../db/client';

export interface Entity {
  id?: number;
  name: string;
  type: string;
  description: string;
  embedding?: number[];
  metadata?: Record<string, any>;
}

export interface Relationship {
  id?: number;
  sourceId: number;
  targetId: number;
  type: string;
  weight: number;
  metadata?: Record<string, any>;
}

export class EntityExtractor {
  async extractEntities(text: string): Promise<Entity[]> {
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `Extract entities related to 3D printing from the text.
            Categories: tool, material, setting, problem, solution, component, process, technique.
            Return JSON object with "entities" array. Each entity should have:
            - name: the entity name
            - type: one of the categories above
            - description: brief description of the entity
            Example: {"entities": [{"name": "PLA", "type": "material", "description": "Common 3D printing filament"}]}`
          },
          {
            role: 'user',
            content: text
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1,
        max_tokens: 500,
      });

      const result = JSON.parse(completion.choices[0].message.content || '{"entities": []}');
      return result.entities || [];
    } catch (error) {
      console.error('Error extracting entities:', error);
      return [];
    }
  }

  async extractRelationships(entities: Entity[], context: string): Promise<Relationship[]> {
    if (entities.length < 2) return [];
    
    const entityNames = entities.map(e => e.name).join(', ');
    
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `Given these entities: ${entityNames}
            Extract relationships between them from the context.
            Relationship types: requires, solves, causes, prevents, improves, relates_to, configures, optimizes.
            Return JSON object with "relationships" array. Each relationship should have:
            - source: source entity name
            - target: target entity name
            - type: relationship type
            - weight: strength of relationship (0.1 to 1.0)`
          },
          {
            role: 'user',
            content: context
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1,
        max_tokens: 500,
      });

      const result = JSON.parse(completion.choices[0].message.content || '{"relationships": []}');
      const relationships: Relationship[] = [];
      
      // Map entity names to IDs
      const entityMap = new Map(entities.map(e => [e.name.toLowerCase(), e]));
      
      for (const rel of result.relationships || []) {
        const source = entityMap.get(rel.source.toLowerCase());
        const target = entityMap.get(rel.target.toLowerCase());
        
        if (source?.id && target?.id) {
          relationships.push({
            sourceId: source.id,
            targetId: target.id,
            type: rel.type,
            weight: rel.weight || 0.5,
          });
        }
      }
      
      return relationships;
    } catch (error) {
      console.error('Error extracting relationships:', error);
      return [];
    }
  }

  async storeEntity(entity: Entity): Promise<Entity> {
    try {
      // Generate embedding if not provided
      if (!entity.embedding && entity.description) {
        const { generateEmbedding } = await import('../utils/openai');
        entity.embedding = await generateEmbedding(`${entity.name} ${entity.description}`);
      }
      
      const result = await query(
        `INSERT INTO kg_entities (name, entity_type, description, embedding_json, metadata)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (name) 
         DO UPDATE SET 
           description = EXCLUDED.description,
           embedding_json = EXCLUDED.embedding_json,
           metadata = EXCLUDED.metadata
         RETURNING id, name, entity_type, description`,
        [
          entity.name,
          entity.type,
          entity.description,
          entity.embedding ? JSON.stringify(entity.embedding) : null,
          JSON.stringify(entity.metadata || {})
        ]
      );
      
      return result.rows[0];
    } catch (error) {
      console.error('Error storing entity:', error);
      throw error;
    }
  }

  async storeRelationship(relationship: Relationship): Promise<void> {
    try {
      await query(
        `INSERT INTO kg_relationships (source_entity_id, target_entity_id, relationship_type, weight, metadata)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (source_entity_id, target_entity_id, relationship_type) 
         DO UPDATE SET weight = EXCLUDED.weight`,
        [
          relationship.sourceId,
          relationship.targetId,
          relationship.type,
          relationship.weight,
          JSON.stringify(relationship.metadata || {})
        ]
      );
    } catch (error) {
      console.error('Error storing relationship:', error);
      throw error;
    }
  }
}