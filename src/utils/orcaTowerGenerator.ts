/**
 * OrcaSlicer Tower Generator
 * Generates parametric calibration towers optimized for OrcaSlicer
 */

import { stlToString, ParsedSTL, Triangle } from './asciiStlUtils';

export interface OrcaTowerParameters {
  type: 'temperature' | 'pressure_advance' | 'max_flow' | 'fan' | 'layer_time' | 'retraction';
  startValue: number;
  endValue: number;
  stepSize: number;
  baseHeight?: number;
  sectionHeight?: number;
  towerWidth?: number;
  towerDepth?: number;
  includeLabels?: boolean;
  includeModifierMesh?: boolean;
  material?: 'PLA' | 'PETG' | 'ABS' | 'TPU' | 'ASA' | 'PC' | 'PA';
}

export interface TowerSection {
  height: number;
  value: number;
  label: string;
  modifierMesh?: ParsedSTL;
}

export interface GeneratedTower {
  mainSTL: Blob;
  sections: TowerSection[];
  modifierMeshes?: Blob[];
  orcaSettings?: OrcaSlicerSettings;
  instructions: string;
}

export interface OrcaSlicerSettings {
  calibrationType: string;
  parameters: Record<string, any>;
  modifierSettings: Array<{
    sectionIndex: number;
    settings: Record<string, any>;
  }>;
}

/**
 * Material temperature presets for different filament types
 */
export const MATERIAL_TEMP_PRESETS = {
  PLA: { start: 220, end: 190, step: 5, hotend: 'standard' },
  PETG: { start: 250, end: 220, step: 5, hotend: 'standard' },
  ABS: { start: 260, end: 230, step: 5, hotend: 'standard' },
  TPU: { start: 240, end: 210, step: 5, hotend: 'standard' },
  ASA: { start: 270, end: 240, step: 5, hotend: 'high-temp' },
  PC: { start: 290, end: 260, step: 5, hotend: 'high-temp' },
  PA: { start: 280, end: 250, step: 5, hotend: 'high-temp' }
};

/**
 * Pressure Advance presets for different extruder types
 */
export const PA_PRESETS = {
  direct_drive: { start: 0.00, end: 0.10, step: 0.01 },
  bowden: { start: 0.00, end: 0.50, step: 0.05 },
  high_speed: { start: 0.00, end: 0.05, step: 0.005 }
};

/**
 * Base class for tower generation
 */
export abstract class TowerGeneratorBase {
  protected params: OrcaTowerParameters;
  protected sections: TowerSection[] = [];

  constructor(params: OrcaTowerParameters) {
    this.params = {
      baseHeight: 1.0,
      sectionHeight: 10.0,
      towerWidth: 40,
      towerDepth: 10,
      includeLabels: true,
      includeModifierMesh: true,
      ...params
    };
    
    this.calculateSections();
  }

  /**
   * Calculate the number and values of tower sections
   */
  protected calculateSections(): void {
    const { startValue, endValue, stepSize, baseHeight, sectionHeight } = this.params;
    
    const direction = endValue > startValue ? 1 : -1;
    const steps = Math.floor(Math.abs(endValue - startValue) / Math.abs(stepSize)) + 1;
    
    let currentHeight = baseHeight!;
    
    for (let i = 0; i < steps; i++) {
      const value = startValue + (i * stepSize * direction);
      this.sections.push({
        height: currentHeight,
        value: value,
        label: this.formatLabel(value)
      });
      currentHeight += sectionHeight!;
    }
  }

  /**
   * Format the label for a section based on tower type
   */
  protected abstract formatLabel(value: number): string;

  /**
   * Generate the main tower geometry
   */
  protected abstract generateTowerGeometry(): ParsedSTL;

  /**
   * Generate modifier meshes for each section
   */
  protected generateModifierMeshes(): ParsedSTL[] {
    const modifiers: ParsedSTL[] = [];
    const { towerWidth, towerDepth, sectionHeight } = this.params;
    
    for (let i = 0; i < this.sections.length; i++) {
      const section = this.sections[i];
      const triangles: Triangle[] = [];
      
      // Create a simple box for each section as modifier
      const minX = -towerWidth! / 2;
      const maxX = towerWidth! / 2;
      const minY = -towerDepth! / 2;
      const maxY = towerDepth! / 2;
      const minZ = section.height;
      const maxZ = section.height + sectionHeight!;
      
      // Generate box faces
      triangles.push(...this.createBoxTriangles(minX, maxX, minY, maxY, minZ, maxZ));
      
      modifiers.push({
        name: `modifier_section_${i}`,
        triangles
      });
    }
    
    return modifiers;
  }

  /**
   * Helper to create box triangles
   */
  protected createBoxTriangles(
    minX: number, maxX: number,
    minY: number, maxY: number,
    minZ: number, maxZ: number
  ): Triangle[] {
    const triangles: Triangle[] = [];
    
    // Define vertices
    const v = [
      { x: minX, y: minY, z: minZ }, // 0
      { x: maxX, y: minY, z: minZ }, // 1
      { x: maxX, y: maxY, z: minZ }, // 2
      { x: minX, y: maxY, z: minZ }, // 3
      { x: minX, y: minY, z: maxZ }, // 4
      { x: maxX, y: minY, z: maxZ }, // 5
      { x: maxX, y: maxY, z: maxZ }, // 6
      { x: minX, y: maxY, z: maxZ }  // 7
    ];
    
    // Bottom face
    triangles.push(
      { normal: { x: 0, y: 0, z: -1 }, vertices: [v[0], v[1], v[2]] },
      { normal: { x: 0, y: 0, z: -1 }, vertices: [v[0], v[2], v[3]] }
    );
    
    // Top face
    triangles.push(
      { normal: { x: 0, y: 0, z: 1 }, vertices: [v[4], v[6], v[5]] },
      { normal: { x: 0, y: 0, z: 1 }, vertices: [v[4], v[7], v[6]] }
    );
    
    // Front face
    triangles.push(
      { normal: { x: 0, y: -1, z: 0 }, vertices: [v[0], v[4], v[5]] },
      { normal: { x: 0, y: -1, z: 0 }, vertices: [v[0], v[5], v[1]] }
    );
    
    // Back face
    triangles.push(
      { normal: { x: 0, y: 1, z: 0 }, vertices: [v[2], v[6], v[7]] },
      { normal: { x: 0, y: 1, z: 0 }, vertices: [v[2], v[7], v[3]] }
    );
    
    // Left face
    triangles.push(
      { normal: { x: -1, y: 0, z: 0 }, vertices: [v[0], v[3], v[7]] },
      { normal: { x: -1, y: 0, z: 0 }, vertices: [v[0], v[7], v[4]] }
    );
    
    // Right face
    triangles.push(
      { normal: { x: 1, y: 0, z: 0 }, vertices: [v[1], v[5], v[6]] },
      { normal: { x: 1, y: 0, z: 0 }, vertices: [v[1], v[6], v[2]] }
    );
    
    return triangles;
  }

  /**
   * Generate OrcaSlicer-specific settings for the tower
   */
  protected abstract generateOrcaSettings(): OrcaSlicerSettings;

  /**
   * Generate usage instructions
   */
  protected generateInstructions(): string {
    return `OrcaSlicer Calibration Tower Instructions:
    
1. Import the main STL file into OrcaSlicer
2. If modifier meshes are included, import them as modifier meshes
3. Apply the provided settings to each modifier region
4. Slice and print the tower
5. Evaluate the results and choose the best value

Tower Parameters:
- Type: ${this.params.type}
- Start Value: ${this.params.startValue}
- End Value: ${this.params.endValue}
- Step Size: ${this.params.stepSize}
- Total Sections: ${this.sections.length}
`;
  }

  /**
   * Generate the complete tower with all components
   */
  public generate(): GeneratedTower {
    const mainGeometry = this.generateTowerGeometry();
    const mainSTL = new Blob([stlToString(mainGeometry)], { type: 'application/sla' });
    
    const result: GeneratedTower = {
      mainSTL,
      sections: this.sections,
      instructions: this.generateInstructions()
    };
    
    if (this.params.includeModifierMesh) {
      const modifiers = this.generateModifierMeshes();
      result.modifierMeshes = modifiers.map(mod => 
        new Blob([stlToString(mod)], { type: 'application/sla' })
      );
      result.orcaSettings = this.generateOrcaSettings();
    }
    
    return result;
  }
}

/**
 * Generate a text label as triangles (simplified version)
 * In a real implementation, this would use a proper text-to-mesh library
 */
export function generateTextMesh(
  _text: string,
  _position: { x: number, y: number, z: number },
  _size: number = 5,
  _depth: number = 0.5
): Triangle[] {
  // This is a placeholder - in production, use a proper text mesh generator
  // For now, return an empty array
  return [];
}

/**
 * Utility to create a cylinder mesh
 */
export function createCylinderMesh(
  radius: number,
  height: number,
  position: { x: number, y: number, z: number },
  segments: number = 32
): Triangle[] {
  const triangles: Triangle[] = [];
  const angleStep = (2 * Math.PI) / segments;
  
  // Generate vertices
  const bottomCenter = position;
  const topCenter = { ...position, z: position.z + height };
  
  for (let i = 0; i < segments; i++) {
    const angle1 = i * angleStep;
    const angle2 = (i + 1) * angleStep;
    
    const x1 = position.x + radius * Math.cos(angle1);
    const y1 = position.y + radius * Math.sin(angle1);
    const x2 = position.x + radius * Math.cos(angle2);
    const y2 = position.y + radius * Math.sin(angle2);
    
    const bottomV1 = { x: x1, y: y1, z: position.z };
    const bottomV2 = { x: x2, y: y2, z: position.z };
    const topV1 = { x: x1, y: y1, z: position.z + height };
    const topV2 = { x: x2, y: y2, z: position.z + height };
    
    // Bottom face
    triangles.push({
      normal: { x: 0, y: 0, z: -1 },
      vertices: [bottomCenter, bottomV2, bottomV1]
    });
    
    // Top face
    triangles.push({
      normal: { x: 0, y: 0, z: 1 },
      vertices: [topCenter, topV1, topV2]
    });
    
    // Side faces
    const nx = (Math.cos(angle1) + Math.cos(angle2)) / 2;
    const ny = (Math.sin(angle1) + Math.sin(angle2)) / 2;
    
    triangles.push(
      {
        normal: { x: nx, y: ny, z: 0 },
        vertices: [bottomV1, bottomV2, topV2]
      },
      {
        normal: { x: nx, y: ny, z: 0 },
        vertices: [bottomV1, topV2, topV1]
      }
    );
  }
  
  return triangles;
}