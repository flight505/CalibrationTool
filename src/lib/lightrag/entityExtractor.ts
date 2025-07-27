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
            content: `Extract entities related to 3D printing and OrcaSlicer from the text.
            
            Categories:
            - material: Filament types, brands (PLA, PETG, ABS, TPU, Prusament, eSUN, etc.)
            - setting: Slicer settings, parameters (flow rate, retraction, pressure advance, etc.)
            - problem: Print defects, issues (stringing, warping, layer adhesion, etc.)
            - solution: Fixes, techniques to solve problems
            - component: Printer parts (hotend, nozzle, extruder, bed, etc.)
            - process: Printing processes, calibration methods (temperature tower, flow calibration, etc.)
            - technique: Printing techniques, methods (tree supports, sequential printing, etc.)
            - tool: Software tools, utilities (OrcaSlicer, Cura, calibration tools, etc.)
            - feature: Slicer features (adaptive layer height, fuzzy skin, ironing, etc.)
            - printer_model: Specific printer models (Prusa MK3S, Ender 3, Bambu X1, etc.)
            - firmware: Firmware types (Marlin, Klipper, RepRapFirmware, etc.)
            - defect: Specific print defects (elephant foot, ringing, z-banding, etc.)
            - measurement: Values, dimensions, specifications (0.4mm nozzle, 210°C, etc.)
            - brand: Manufacturer, company names (Prusa, Creality, E3D, etc.)
            
            Return JSON object with "entities" array. Each entity should have:
            - name: the entity name (keep original capitalization)
            - type: one of the categories above
            - description: brief, specific description of the entity
            - context: relevant context from the text (optional)
            
            Example: {"entities": [
              {"name": "PLA", "type": "material", "description": "Biodegradable thermoplastic filament, prints at 190-220°C"},
              {"name": "Flow Rate", "type": "setting", "description": "Extrusion multiplier controlling material flow", "context": "calibrate to 0.95"}
            ]}`
          },
          {
            role: 'user',
            content: text
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1,
        max_tokens: 1000,
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
            
            Relationship types for 3D printing:
            - requires: One thing needs another (e.g., TPU requires slow speed)
            - solves: Fixes or addresses a problem (e.g., retraction solves stringing)
            - causes: Creates or leads to an issue (e.g., high temperature causes stringing)
            - prevents: Stops something from happening (e.g., brim prevents warping)
            - improves: Makes something better (e.g., pressure advance improves corners)
            - relates_to: General connection between concepts
            - configures: Sets up or adjusts (e.g., OrcaSlicer configures print settings)
            - optimizes: Fine-tunes for best results (e.g., temperature tower optimizes nozzle temp)
            - compatible_with: Works well together (e.g., Prusa MK3S compatible_with PrusaSlicer)
            - incompatible_with: Doesn't work together (e.g., PLA incompatible_with high temps)
            - replaces: Substitutes for another (e.g., PETG replaces ABS for some uses)
            - calibrates: Used to calibrate (e.g., flow cube calibrates flow rate)
            - affects: Has impact on (e.g., nozzle size affects layer width)
            - depends_on: Relies on for function (e.g., bridging depends_on cooling)
            
            Return JSON object with "relationships" array. Each relationship should have:
            - source: source entity name (exact match from list)
            - target: target entity name (exact match from list)
            - type: relationship type from above
            - weight: strength of relationship (0.1 to 1.0)
            - reason: brief explanation of the relationship (optional)
            
            Focus on meaningful, specific relationships that help understand 3D printing concepts.`
          },
          {
            role: 'user',
            content: context
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1,
        max_tokens: 800,
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
            metadata: rel.reason ? { reason: rel.reason } : undefined
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