/**
 * OrcaSlicer Model Settings Generator
 * Generates model_settings.config XML file for 3MF projects
 *
 * This file is required by OrcaSlicer to recognize modifier meshes and their settings.
 * Based on OrcaSlicer source: src/libslic3r/Format/bbs_3mf.cpp
 */

export interface ModelPart {
  /** Part ID (must match object ID in 3dmodel.model) */
  id: number;
  /** Part type - normal_part for main geometry, modifier_part for modifiers */
  subtype: 'normal_part' | 'modifier_part' | 'support_enforcer' | 'support_blocker' | 'negative_part';
  /** Display name for the part */
  name: string;
  /** Transformation matrix (4x4 flattened to 16 values, space-separated) */
  matrix: string;
  /** Settings to apply (only for modifier_part) */
  settings?: Record<string, string | number>;
}

export interface ModelObject {
  /** Object ID (must match object ID in 3dmodel.model) */
  id: number;
  /** Display name for the object */
  name: string;
  /** List of parts (main part + modifiers) */
  parts: ModelPart[];
}

export interface ModelInstance {
  objectId: number;
  instanceId: number;
  identifyId: number;
}

export interface PlateConfig {
  platerId: number;
  platerName: string;
  locked: boolean;
  instances: ModelInstance[];
}

export interface AssembleItem {
  objectId: number;
  instanceId: number;
  transform: string; // 12 values: rotation matrix (3x3) + translation (3x1)
  offset: string; // 3 values: x y z offset
}

export interface ModelSettingsConfig {
  /** List of objects in the model */
  objects: ModelObject[];
  /** Build plate configuration (optional) */
  plates?: PlateConfig[];
  /** Assembly information (optional) */
  assemble?: AssembleItem[];
}

/**
 * Escape XML special characters
 */
function escapeXml(value: string | number): string {
  return value
    .toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Generate mesh_stat element (required by OrcaSlicer even if all zeros)
 */
function generateMeshStat(): string {
  return '      <mesh_stat edges_fixed="0" degenerate_facets="0" facets_removed="0" facets_reversed="0" backwards_edges="0"/>\n';
}

/**
 * Generate metadata element
 */
function generateMetadata(key: string, value: string | number, indent: string = '      '): string {
  return `${indent}<metadata key="${escapeXml(key)}" value="${escapeXml(value)}"/>\n`;
}

/**
 * Generate a part element (normal_part or modifier_part)
 */
function generatePart(part: ModelPart): string {
  let xml = `    <part id="${part.id}" subtype="${part.subtype}">\n`;

  // Add name
  xml += generateMetadata('name', part.name);

  // Add transformation matrix
  xml += generateMetadata('matrix', part.matrix);

  // Add settings (only for modifiers)
  if (part.settings) {
    for (const [key, value] of Object.entries(part.settings)) {
      xml += generateMetadata(key, value);
    }
  }

  // Add mesh statistics
  xml += generateMeshStat();

  xml += '    </part>\n';

  return xml;
}

/**
 * Generate an object element with all its parts
 */
function generateObject(obj: ModelObject): string {
  let xml = `  <object id="${obj.id}">\n`;

  // Add object name
  xml += generateMetadata('name', obj.name, '    ');

  // Add all parts (main part + modifiers)
  for (const part of obj.parts) {
    xml += generatePart(part);
  }

  xml += '  </object>\n';

  return xml;
}

/**
 * Generate plate configuration
 */
function generatePlate(plate: PlateConfig): string {
  let xml = '  <plate>\n';

  xml += generateMetadata('plater_id', plate.platerId, '    ');
  xml += generateMetadata('plater_name', plate.platerName, '    ');
  xml += generateMetadata('locked', plate.locked.toString(), '    ');

  // Add model instances
  for (const instance of plate.instances) {
    xml += '    <model_instance>\n';
    xml += generateMetadata('object_id', instance.objectId, '      ');
    xml += generateMetadata('instance_id', instance.instanceId, '      ');
    xml += generateMetadata('identify_id', instance.identifyId, '      ');
    xml += '    </model_instance>\n';
  }

  xml += '  </plate>\n';

  return xml;
}

/**
 * Generate assemble configuration
 */
function generateAssemble(items: AssembleItem[]): string {
  let xml = '  <assemble>\n';

  for (const item of items) {
    xml += `    <assemble_item object_id="${item.objectId}" instance_id="${item.instanceId}" transform="${item.transform}" offset="${item.offset}" />\n`;
  }

  xml += '  </assemble>\n';

  return xml;
}

/**
 * Generate complete model_settings.config XML file
 *
 * This is the critical file that OrcaSlicer needs to recognize modifier meshes.
 * Format based on OrcaSlicer source: src/libslic3r/Format/bbs_3mf.cpp
 */
export function generateModelSettingsXML(config: ModelSettingsConfig): string {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<config>\n';

  // Add all objects
  for (const obj of config.objects) {
    xml += generateObject(obj);
  }

  // Add plates if specified
  if (config.plates && config.plates.length > 0) {
    for (const plate of config.plates) {
      xml += generatePlate(plate);
    }
  } else {
    // Default single plate with all objects
    xml += '  <plate>\n';
    xml += generateMetadata('plater_id', '1', '    ');
    xml += generateMetadata('plater_name', '', '    ');
    xml += generateMetadata('locked', 'false', '    ');

    for (const obj of config.objects) {
      xml += '    <model_instance>\n';
      xml += generateMetadata('object_id', obj.id, '      ');
      xml += generateMetadata('instance_id', '0', '      ');
      xml += generateMetadata('identify_id', obj.id, '      ');
      xml += '    </model_instance>\n';
    }

    xml += '  </plate>\n';
  }

  // Add assemble if specified
  if (config.assemble && config.assemble.length > 0) {
    xml += generateAssemble(config.assemble);
  } else {
    // Default assembly with identity transform
    xml += '  <assemble>\n';
    for (const obj of config.objects) {
      xml += `    <assemble_item object_id="${obj.id}" instance_id="0" transform="1 0 0 0 1 0 0 0 1 90 90 0" offset="0 0 0" />\n`;
    }
    xml += '  </assemble>\n';
  }

  xml += '</config>\n';

  return xml;
}

/**
 * Create a simple model settings config for a tower with modifiers
 *
 * @param towerName - Name of the calibration tower
 * @param modifierSettings - Array of settings for each modifier (one per section)
 * @returns Complete ModelSettingsConfig ready for XML generation
 */
export function createTowerModelSettings(
  towerName: string,
  modifierSettings: Array<{ name: string; settings: Record<string, string | number> }>
): ModelSettingsConfig {
  const parts: ModelPart[] = [];

  // Add main tower as normal part (always ID 1)
  parts.push({
    id: 1,
    subtype: 'normal_part',
    name: towerName,
    matrix: '1 0 0 0 0 1 0 0 0 0 1 0 0 0 0 1', // Identity matrix
  });

  // Add modifier parts (IDs starting from 2)
  modifierSettings.forEach((modifier, index) => {
    parts.push({
      id: index + 2,
      subtype: 'modifier_part',
      name: modifier.name,
      matrix: '1 0 0 0 0 1 0 0 0 0 1 0 0 0 0 1', // Identity matrix
      settings: modifier.settings,
    });
  });

  return {
    objects: [{
      id: 1,
      name: towerName,
      parts,
    }],
  };
}
